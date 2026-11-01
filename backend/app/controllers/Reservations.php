<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Reservations extends Controller {
	private $active = ['pending', 'confirmed', 'arrived'];
	private $statuses = ['pending', 'confirmed', 'arrived', 'no_show', 'cancelled'];
	private $per_page = 8;
	private $views = ['upcoming', 'today', 'past', 'cancelled'];
	private $settings;
	private $account = null;

	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Reservation_model', 'Customer_model', 'Table_model', 'Setting_model', 'User_model', 'Opening_hour_model', 'Payment_model']);
	}

	public function index()
	{
		$this->api->require_role('staff', 'admin');
		$query = $this->api->get_query_params();
		$view = $query['view'] ?? '';
		$date = $this->valid_date($query['reservation_date'] ?? date('Y-m-d'), true);
		$status = $query['status'] ?? '';
		$search = is_string($query['search'] ?? null) ? trim($query['search']) : '';
		$raw_page = $query['page'] ?? '1';
		$page = is_string($raw_page) && ctype_digit($raw_page) ? (int) $raw_page : 0;

		if (($view !== '' && !in_array($view, $this->views, true)) || !$date || ($status !== '' && !in_array($status, $this->statuses, true)) || $page < 1) {
			$this->api->respond_error('Give a view (' . implode(', ', $this->views) . ') or reservation_date as YYYY-MM-DD, a valid status and a page of 1 or more', 422);
		}

		$customer_ids = $search !== ''
			? array_column($this->Customer_model->query()->like('full_name', "%{$search}%")->get_all(), 'customer_id')
			: [];
		$all_days = $search !== '' && $view === '' && !isset($query['reservation_date']);
		$build = function () use ($view, $date, $status, $search, $customer_ids, $all_days) {
			$today = date('Y-m-d');
			$query = $this->Reservation_model->query();
			if ($view === 'upcoming') {
				$query->where('reservation_date', '>', $today)->in('status', ['pending', 'confirmed']);
			} elseif ($view === 'past') {
				$query->where('reservation_date', '<', $today)->where('status', '<>', 'cancelled');
			} elseif ($view === 'cancelled') {
				$query->where('status', 'cancelled');
			} elseif (!$all_days) {
				$query->where('reservation_date', $view === 'today' ? $today : $date);
			}
			if ($status !== '') {
				$query->where('status', $status);
			}
			if ($search !== '') {
				$query->grouped(function ($group) use ($search, $customer_ids) {
					$group->like('reference_code', "%{$search}%");
					if ($customer_ids) {
						$group->or_in('customer_id', $customer_ids);
					}
				});
			}
			return $query;
		};

		$total = (int) $build()->count();
		$rows = $build()
			->order_by('TIMESTAMP(reservation_date, reservation_time)', in_array($view, ['past', 'cancelled'], true) ? 'DESC' : 'ASC')
			->pagination($this->per_page, $page)
			->get_all();

		$this->api->respond([
			'data' => array_map(fn($reservation) => $this->format($reservation, true), $rows),
			'meta' => ['total' => $total, 'page' => $page, 'per_page' => $this->per_page],
		]);
	}

	public function show($id)
	{
		$this->api->require_role('staff', 'admin');
		$reservation = $this->Reservation_model->find($id);
		if (!$reservation) {
			$this->api->respond_error('Reservation not found', 404);
		}

		$this->api->respond(['data' => $this->format($reservation, true)]);
	}

	public function update($id)
	{
		$this->api->require_role('admin');
		$reservation = $this->Reservation_model->find($id);
		if (!$reservation) {
			$this->api->respond_error('Reservation not found', 404);
		}
		if (!in_array($reservation['status'], ['pending', 'confirmed'], true)) {
			$this->api->respond_error("This reservation is {$reservation['status']} and can't be changed", 409);
		}

		$body = $this->api->body();
		$input = $this->validate_booking([], null, false, $reservation);
		$old_table = $reservation['table_id'] !== null ? (int) $reservation['table_id'] : null;
		$new_table = array_key_exists('table_id', $body) ? $body['table_id'] : $old_table;
		if ($new_table !== null && !is_int($new_table)) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['"table_id" must be a number or null.']], 422);
		}

		if (!$this->is_open($input['reservation_date'], $input['reservation_time'], $input['pax'], (int) $id)) {
			$this->api->respond_error('That time is no longer available', 409);
		}
		if ($new_table !== null) {
			$table = $this->Table_model->find($new_table);
			if (!$table) {
				$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['That table does not exist.']], 422);
			}
			if ((int) $table['capacity'] < $input['pax']) {
				$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ["Table {$table['table_number']} seats only {$table['capacity']}."]], 422);
			}
			$taken = $this->Reservation_model
				->filter(['table_id' => $new_table, 'reservation_date' => $input['reservation_date'], 'reservation_time' => $input['reservation_time']])
				->in('status', $this->active)
				->not_where('reservation_id', $id)
				->count();
			if ($taken) {
				$this->api->respond_error('That table is already booked for this time', 409);
			}
		}

		$moved = $input['reservation_date'] !== $reservation['reservation_date'] || $input['reservation_time'] !== $reservation['reservation_time'];
		$deposit = [];
		if (!$this->Payment_model->exists(['reservation_id' => (int) $id, 'status' => 'paid'])) {
			$settings = $this->settings();
			$deposit = ['deposit_amount' => number_format($input['pax'] * ($settings['deposit_required'] ? $settings['deposit_per_guest'] : 0.0), 2, '.', '')];
		}
		$this->Reservation_model->transaction();
		try {
			$this->Reservation_model->update($id, [
				'reservation_date' => $input['reservation_date'],
				'reservation_time' => $input['reservation_time'],
				'pax' => $input['pax'],
				'table_id' => $new_table,
				'special_request' => array_key_exists('special_request', $body) ? $input['special_request'] : $reservation['special_request'],
			] + $deposit + ($moved ? ['reminder_sent_at' => null] : []));
			if ($old_table !== null && $old_table !== $new_table) {
				$this->release_table($old_table);
			}
			if ($new_table !== null) {
				$this->hold_table($new_table, $input['reservation_date']);
			}
			$this->Reservation_model->commit();
		} catch (Throwable $e) {
			$this->Reservation_model->rollback();
			$this->api->respond_error('Could not update the reservation', 500);
		}

		if ($moved) {
			$this->call->library('sms');
			$this->sms->reservation((int) $id, 'rescheduled');
		}
		$this->api->respond(['data' => $this->format($this->Reservation_model->find($id), true)]);
	}

	public function status($id)
	{
		$this->api->require_role('staff', 'admin');
		$reservation = $this->Reservation_model->find($id);
		if (!$reservation) {
			$this->api->respond_error('Reservation not found', 404);
		}

		$input = $this->api->body();
		$status = $input['status'] ?? null;
		$has_table = array_key_exists('table_id', $input);
		$table_id = $input['table_id'] ?? null;

		$errors = [];
		if ($status === null && !$has_table) {
			$errors[] = 'Give "status", "table_id" or both.';
		}
		if ($status !== null && !in_array($status, $this->statuses, true)) {
			$errors[] = '"status" must be one of ' . implode(', ', $this->statuses) . '.';
		}
		if ($has_table && !is_int($table_id)) {
			$errors[] = '"table_id" must be a number.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		$current = $reservation['status'];
		if (!in_array($current, ['pending', 'confirmed', 'no_show'], true)) {
			$this->api->respond_error("This reservation is {$current} and can't be changed", 409);
		}

		if ($has_table) {
			$table = $this->Table_model->find($table_id);
			if (!$table) {
				$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['That table does not exist.']], 422);
			}
			if ((int) $table['capacity'] < (int) $reservation['pax']) {
				$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ["Table {$table['table_number']} seats only {$table['capacity']}."]], 422);
			}
			$taken = $this->Reservation_model
				->filter(['table_id' => $table_id, 'reservation_date' => $reservation['reservation_date'], 'reservation_time' => $reservation['reservation_time']])
				->in('status', $this->active)
				->not_where('reservation_id', $id)
				->count();
			if ($taken) {
				$this->api->respond_error('That table is already booked for this time', 409);
			}
		}

		$next = $status ?? ($has_table && $current === 'pending' ? 'confirmed' : $current);
		$allowed = [
			'pending' => ['pending', 'confirmed', 'no_show', 'cancelled'],
			'confirmed' => ['confirmed', 'arrived', 'no_show', 'cancelled'],
			'no_show' => ['pending', 'confirmed'],
		];
		if (!in_array($next, $allowed[$current], true)) {
			$this->api->respond_error("A reservation can't go from {$current} to {$next}", 409);
		}

		$old_table = $reservation['table_id'] !== null ? (int) $reservation['table_id'] : null;
		$new_table = $has_table ? $table_id : $old_table;
		if ($current === 'no_show') {
			$next = $new_table !== null ? 'confirmed' : 'pending';
			$taken = $new_table !== null && $this->Reservation_model
				->filter(['table_id' => $new_table, 'reservation_date' => $reservation['reservation_date'], 'reservation_time' => $reservation['reservation_time']])
				->in('status', $this->active)
				->not_where('reservation_id', $id)
				->count();
			if ($taken) {
				$this->api->respond_error('That table was given to another booking. Assign a new table instead', 409);
			}
		}
		if ($next === 'arrived' && $new_table === null) {
			$this->api->respond_error('Assign a table before marking the guests arrived', 409);
		}

		$this->Reservation_model->transaction();
		try {
			$this->Reservation_model->update($id, ['status' => $next, 'table_id' => $new_table]);
			if ($old_table !== null && $old_table !== $new_table) {
				$this->release_table($old_table);
			}
			if ($new_table !== null) {
				if ($next === 'arrived') {
					$this->Table_model->update($new_table, ['status' => 'occupied']);
				} elseif (in_array($next, ['no_show', 'cancelled'], true)) {
					$this->release_table($new_table);
				} else {
					$this->hold_table($new_table, $reservation['reservation_date']);
				}
			}
			$this->Reservation_model->commit();
		} catch (Throwable $e) {
			$this->Reservation_model->rollback();
			$this->api->respond_error('Could not update the reservation', 500);
		}

		if ($next === 'cancelled') {
			$this->call->library('sms');
			$this->sms->reservation((int) $id, 'cancelled');
		}
		$this->api->respond(['data' => $this->format($this->Reservation_model->find($id), true)]);
	}

	public function availability()
	{
		$query = $this->api->get_query_params();
		$date = $this->valid_date($query['date'] ?? '');
		$pax = is_string($query['pax'] ?? null) && ctype_digit($query['pax']) ? (int) $query['pax'] : 0;

		if (!$date || $pax < 1) {
			$this->api->respond_error('Give a date (YYYY-MM-DD, today or later) and pax (1 or more)', 422);
		}

		$this->api->respond(['data' => $this->slots($date, $pax)]);
	}

	public function mine()
	{
		$payload = $this->api->require_role('customer');
		$customer = $this->Customer_model->find_by('user_id', $payload['sub']);
		$reservations = $customer
			? $this->Reservation_model
				->filter(['customer_id' => $customer['customer_id']])
				->order_by('reservation_date', 'DESC')
				->order_by('reservation_time', 'DESC')
				->get_all()
			: [];

		$this->api->respond(['data' => array_map(fn($reservation) => $this->format($reservation, true), $reservations)]);
	}

	public function store()
	{
		$this->account = $this->customer_account();
		if (!$this->account) {
			$this->api->respond_error('Please log in to reserve a table', 401);
		}
		$input = $this->validate_booking(['full_name' => 'required|max_length[100]']);

		$this->Reservation_model->transaction();
		try {
			$customer = $this->Customer_model->first_or_create(
				['user_id' => $this->account['user_id']],
				['full_name' => $input['full_name'], 'mobile_number' => $input['mobile_number'], 'email' => $input['email']]
			)['record'];

			if (!$this->is_open($input['reservation_date'], $input['reservation_time'], $input['pax'])) {
				$this->Reservation_model->rollback();
				$this->api->respond_error('That time is no longer available', 409);
			}

			if ($input['email'] !== null && $customer['email'] === null) {
				$this->Customer_model->update($customer['customer_id'], ['email' => $input['email']]);
			}

			$settings = $this->settings();
			$per_guest = $settings['deposit_required'] ? $settings['deposit_per_guest'] : 0.0;

			$id = $this->Reservation_model->insert([
				'customer_id' => $customer['customer_id'],
				'reference_code' => $this->make_code(),
				'reservation_date' => $input['reservation_date'],
				'reservation_time' => $input['reservation_time'],
				'pax' => $input['pax'],
				'special_request' => $input['special_request'],
				'deposit_amount' => number_format($input['pax'] * $per_guest, 2, '.', ''),
				'status' => 'pending',
			]);

			$this->Reservation_model->commit();
		} catch (Throwable $e) {
			$this->Reservation_model->rollback();
			$this->api->respond_error('Could not save the reservation', 500);
		}

		$this->call->library('sms');
		$this->sms->reservation((int) $id, 'booked');
		$this->api->respond(['data' => $this->format($this->Reservation_model->find($id))], 201);
	}

	public function find()
	{
		$this->limit();
		$input = $this->api->body();
		$code = is_string($input['reference_code'] ?? null) ? $input['reference_code'] : '';

		$this->api->respond(['data' => $this->format($this->owned($code, $input['mobile_number'] ?? ''))]);
	}

	public function by_code($code)
	{
		$reservation = $this->Reservation_model->find_by('reference_code', $code);
		if (!$reservation) {
			$this->api->respond_error('Reservation not found', 404);
		}

		$this->api->respond(['data' => $this->format($reservation)]);
	}

	public function cancel($code)
	{
		$this->limit();
		$reservation = $this->changeable($code);

		$this->Reservation_model->update($reservation['reservation_id'], ['status' => 'cancelled']);
		if ($reservation['table_id'] !== null) {
			$this->release_table((int) $reservation['table_id']);
		}
		$this->call->library('sms');
		$this->sms->reservation((int) $reservation['reservation_id'], 'cancelled');
		$this->api->respond(['data' => $this->format($this->Reservation_model->find($reservation['reservation_id']))]);
	}

	public function reschedule($code)
	{
		$this->limit();
		$reservation = $this->changeable($code);
		$input = $this->validate_booking([], (int) $reservation['pax']);

		if (!$this->is_open($input['reservation_date'], $input['reservation_time'], (int) $reservation['pax'], (int) $reservation['reservation_id'])) {
			$this->api->respond_error('That time is no longer available', 409);
		}

		$this->Reservation_model->update($reservation['reservation_id'], [
			'reservation_date' => $input['reservation_date'],
			'reservation_time' => $input['reservation_time'],
			'table_id' => null,
			'reminder_sent_at' => null,
		]);
		$this->call->library('sms');
		$this->sms->reservation((int) $reservation['reservation_id'], 'rescheduled');
		$this->api->respond(['data' => $this->format($this->Reservation_model->find($reservation['reservation_id']))]);
	}

	public function deposit($code)
	{
		$this->limit();
		$reservation = $this->Reservation_model->find_by('reference_code', $code);
		if (!$reservation) {
			$this->api->respond_error('Reservation not found', 404);
		}
		if (!in_array($reservation['status'], ['pending', 'confirmed'], true)) {
			$this->api->respond_error("This reservation is {$reservation['status']}", 409);
		}
		if ($this->Payment_model->exists(['reservation_id' => $reservation['reservation_id'], 'status' => 'paid'])) {
			$this->api->respond_error('This is already paid', 409);
		}
		$due = (float) $reservation['deposit_amount'];
		if ($due <= 0) {
			$this->api->respond_error('There is nothing to pay', 409);
		}

		$this->call->library('paymongo');
		$code = $reservation['reference_code'];
		try {
			$checkout = $this->paymongo->start('reservation_id', (int) $reservation['reservation_id'], $due, "Reservation deposit {$code}", $code,
				$this->paymongo->frontend_url("/reserve/confirmation/{$code}"), $this->paymongo->frontend_url('/reserve/payment?code=' . rawurlencode($code)));
		} catch (RuntimeException $e) {
			$this->api->respond_error('The payment service is not available, please try again', 502);
		}
		$this->api->respond(['data' => $checkout]);
	}

	private function validate_booking($rules, $pax = null, $customer = true, $current = null)
	{
		$input = $this->api->body();
		if ($pax !== null) {
			$input['pax'] = $pax;
		}
		if ($this->account) {
			$input['full_name'] = $this->account['full_name'];
			$input['mobile_number'] = $this->account['mobile_number'];
			$input['email'] = $this->account['email'];
		}
		$_POST = $input;
		$this->call->library('form_validation');

		$rules += [
			'reservation_date' => 'required',
			'reservation_time' => 'required',
			'pax' => 'required|numeric|greater_than[0]',
		];
		if ($pax === null && $customer) {
			$rules['mobile_number'] = 'required';
			if (!empty($input['email'])) {
				$rules['email'] = 'valid_email';
			}
		}
		if (!empty($input['special_request'])) {
			$rules['special_request'] = 'max_length[255]';
		}

		$type_errors = [];
		foreach (['full_name', 'mobile_number', 'email', 'reservation_date', 'reservation_time', 'special_request'] as $field) {
			if (isset($input[$field]) && !is_string($input[$field])) {
				$type_errors[] = "\"{$field}\" must be text.";
			}
		}
		if (isset($input['pax']) && !is_int($input['pax']) && !is_string($input['pax'])) {
			$type_errors[] = '"pax" must be a number.';
		}
		if ($type_errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $type_errors], 422);
		}

		$this->form_validation->validate($rules);
		$errors = $this->form_validation->get_errors() ?? [];

		$date = $this->valid_date($input['reservation_date'] ?? '');
		if (!empty($input['reservation_date']) && !$date) {
			$errors[] = '"reservation_date" must be a date (YYYY-MM-DD), today or later.';
		}
		if ($pax === null && $customer && !empty($input['mobile_number']) && !preg_match('/^09\d{9}$/', (string) $input['mobile_number'])) {
			$errors[] = '"mobile_number" must be 11 digits starting with 09.';
		}

		$max_capacity = min($this->settings()['max_pax'], max(array_column($this->Table_model->all(), 'capacity') ?: [0]));
		if (is_numeric($input['pax'] ?? null) && (int) $input['pax'] > $max_capacity) {
			$errors[] = "\"pax\" can be at most {$max_capacity}.";
		}

		$time = is_string($input['reservation_time'] ?? null) ? $input['reservation_time'] : '';
		if (strlen($time) === 5) {
			$time .= ':00';
		}
		$unchanged = $current && $date === $current['reservation_date'] && $time === $current['reservation_time'];
		if (!$unchanged && $date && $time !== '' && !in_array($time, array_column($this->slots($date, max(1, (int) ($input['pax'] ?? 1))), 'time'), true)) {
			$errors[] = '"reservation_time" is not an open time slot for that date.';
		}

		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		return [
			'full_name' => isset($input['full_name']) ? trim($input['full_name']) : null,
			'mobile_number' => $input['mobile_number'] ?? null,
			'email' => !empty($input['email']) ? trim($input['email']) : null,
			'reservation_date' => $date,
			'reservation_time' => $time,
			'pax' => (int) $input['pax'],
			'special_request' => !empty($input['special_request']) ? trim($input['special_request']) : null,
		];
	}

	private function valid_date($value, $allow_past = false)
	{
		$date = is_string($value) ? DateTime::createFromFormat('!Y-m-d', $value) : false;
		if (!$date || $date->format('Y-m-d') !== $value || (!$allow_past && $value < date('Y-m-d'))) {
			return null;
		}
		return $value;
	}

	private function slots($date, $pax)
	{
		$day = $this->Opening_hour_model->find((int) date('w', strtotime($date)));
		if (!$day || !$day['is_open'] || !$day['open_time'] || !$day['close_time']) {
			return [];
		}

		$fitting = $this->fitting_tables($pax);
		$booked = array_count_values(array_column(
			$this->Reservation_model->filter(['reservation_date' => $date])->in('status', $this->active)->get_all(),
			'reservation_time'
		));

		$slots = [];
		$now = time();
		$step = $this->settings()['slot_minutes'] * 60;
		$start = max($day['open_time'], $this->settings()['booking_open_time'] ?? '');
		for ($t = strtotime("{$date} {$start}"); $t + $step <= strtotime("{$date} {$day['close_time']}"); $t += $step) {
			if ($t <= $now) {
				continue;
			}
			$time = date('H:i:s', $t);
			$slots[] = ['time' => $time, 'available' => ($booked[$time] ?? 0) < $fitting];
		}
		return $slots;
	}

	private function fitting_tables($pax)
	{
		return count(array_filter($this->Table_model->all(), fn($table) => (int) $table['capacity'] >= $pax));
	}

	private function is_open($date, $time, $pax, $except_id = null)
	{
		$fitting = $this->fitting_tables($pax);

		$query = $this->Reservation_model
			->filter(['reservation_date' => $date, 'reservation_time' => $time])
			->in('status', $this->active);
		if ($except_id !== null) {
			$query->not_where('reservation_id', $except_id);
		}

		// shortcut: no row lock, so two bookings at the same instant can both pass; add SELECT ... FOR UPDATE if this goes live
		return (int) $query->count() < $fitting;
	}

	private function settings()
	{
		if ($this->settings === null) {
			$row = $this->Setting_model->all()[0] ?? [];
			$this->settings = [
				'slot_minutes' => (int) ($row['slot_minutes'] ?? 60),
				'max_pax' => (int) ($row['max_pax'] ?? 10),
				'booking_open_time' => $row['booking_open_time'] ?? null,
				'deposit_required' => (bool) ($row['deposit_required'] ?? true),
				'deposit_per_guest' => (float) ($row['deposit_per_guest'] ?? 0),
			];
		}
		return $this->settings;
	}

	private function customer_account()
	{
		$token = $this->api->get_bearer_token();
		if (!$token) {
			return null;
		}
		$payload = $this->api->require_jwt();
		if (($payload['role'] ?? '') !== 'customer') {
			return null;
		}
		$user = $this->User_model->find($payload['sub']);
		if (!$user || !$user['is_active']) {
			$this->api->respond_error('Unauthorized', 401);
		}
		return $user;
	}

	private function owned($code, $mobile)
	{
		$reservation = $code !== '' ? $this->Reservation_model->find_by('reference_code', $code) : null;
		$customer = $reservation ? $this->Customer_model->find($reservation['customer_id']) : null;

		if (!$customer || !is_string($mobile) || $customer['mobile_number'] !== $mobile) {
			$this->api->respond_error('Reservation not found', 404);
		}
		return $reservation;
	}

	private function changeable($code)
	{
		$reservation = $this->owned($code, $this->api->body()['mobile_number'] ?? '');
		if (!in_array($reservation['status'], ['pending', 'confirmed'], true)) {
			$this->api->respond_error("This reservation is {$reservation['status']} and can't be changed", 409);
		}
		return $reservation;
	}

	private function limit()
	{
		$this->api->rate_limit('res_' . $this->api->client_ip(), 20, 60);
	}

	private function make_code()
	{
		$alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
		do {
			$code = 'RSV-';
			for ($i = 0; $i < 6; $i++) {
				$code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
			}
		} while ($this->Reservation_model->exists(['reference_code' => $code]));
		return $code;
	}

	private function release_table($table_id)
	{
		$this->Table_model->update_where(['table_id' => $table_id, 'status' => 'reserved'], ['status' => 'available']);
	}

	private function hold_table($table_id, $date)
	{
		if ($date !== date('Y-m-d')) {
			return;
		}
		$this->Table_model->update_where(['table_id' => $table_id, 'status' => 'available'], ['status' => 'reserved']);
	}

	private function format($reservation, $full_mobile = false)
	{
		$customer = $this->Customer_model->find($reservation['customer_id']);
		$table = $reservation['table_id'] ? $this->Table_model->find($reservation['table_id']) : null;
		$mobile = $customer['mobile_number'] ?? '';

		$reservation['pax'] = (int) $reservation['pax'];
		$reservation['deposit_amount'] = (float) $reservation['deposit_amount'];
		$reservation['deposit_status'] = $this->Payment_model->exists(['reservation_id' => $reservation['reservation_id'], 'status' => 'paid']) ? 'paid' : 'unpaid';
		$reservation['customer'] = [
			'full_name' => $customer['full_name'] ?? null,
			'mobile_number' => $full_mobile ? ($mobile ?: null) : (strlen($mobile) === 11 ? '09XX XXX ' . substr($mobile, -4) : null),
		];
		$reservation['table_number'] = $table['table_number'] ?? null;
		return $reservation;
	}
}
?>
