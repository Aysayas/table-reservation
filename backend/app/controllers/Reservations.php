<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Reservations extends Controller {
	private $active = ['pending', 'confirmed', 'arrived'];

	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Reservation_model', 'Customer_model', 'Table_model', 'Setting_model', 'Opening_hour_model']);
	}

	public function index()
	{
		$this->api->require_role('staff', 'admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function show($id)
	{
		$this->api->require_role('staff', 'admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function update($id)
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function status($id)
	{
		$this->api->require_role('staff', 'admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function availability()
	{
		$query = $this->api->get_query_params();
		$date = $this->valid_date($query['date'] ?? '');
		$pax = ctype_digit((string) ($query['pax'] ?? '')) ? (int) $query['pax'] : 0;

		if (!$date || $pax < 1) {
			$this->api->respond_error('Give a date (YYYY-MM-DD, today or later) and pax (1 or more)', 422);
		}

		$this->api->respond(['data' => $this->slots($date, $pax)]);
	}

	public function store()
	{
		$input = $this->validate_booking(['full_name' => 'required|max_length[100]']);

		$this->Reservation_model->transaction();
		try {
			$customer = $this->Customer_model->first_or_create(
				['mobile_number' => $input['mobile_number']],
				['full_name' => $input['full_name'], 'email' => $input['email']]
			)['record'];

			if (!$this->is_open($input['reservation_date'], $input['reservation_time'], $input['pax'])) {
				$this->Reservation_model->rollback();
				$this->api->respond_error('That time is no longer available', 409);
			}

			if ($customer['full_name'] !== $input['full_name'] || ($input['email'] !== null && $customer['email'] !== $input['email'])) {
				$this->Customer_model->update($customer['customer_id'], array_filter([
					'full_name' => $input['full_name'],
					'email' => $input['email'],
				], fn($value) => $value !== null));
			}

			$settings = $this->Setting_model->all();
			$per_guest = $settings ? (float) $settings[0]['deposit_per_guest'] : 0.0;

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
		]);
		$this->api->respond(['data' => $this->format($this->Reservation_model->find($reservation['reservation_id']))]);
	}

	public function deposit($code)
	{
		$this->api->respond_error('Not implemented', 501);
	}

	private function validate_booking($rules, $pax = null)
	{
		$input = $this->api->body();
		if ($pax !== null) {
			$input['pax'] = $pax;
		}
		$_POST = $input;
		$this->call->library('form_validation');

		$rules += [
			'reservation_date' => 'required',
			'reservation_time' => 'required',
			'pax' => 'required|numeric|greater_than[0]',
		];
		if ($pax === null) {
			$rules['mobile_number'] = 'required';
			if (!empty($input['email'])) {
				$rules['email'] = 'valid_email';
			}
			if (!empty($input['special_request'])) {
				$rules['special_request'] = 'max_length[255]';
			}
		}

		$this->form_validation->validate($rules);
		$errors = $this->form_validation->get_errors() ?? [];

		foreach (['full_name', 'mobile_number', 'email', 'reservation_date', 'reservation_time', 'special_request'] as $field) {
			if (isset($input[$field]) && !is_string($input[$field])) {
				$errors[] = "\"{$field}\" must be text.";
			}
		}

		$date = $this->valid_date($input['reservation_date'] ?? '');
		if (!empty($input['reservation_date']) && !$date) {
			$errors[] = '"reservation_date" must be a date (YYYY-MM-DD), today or later.';
		}
		if ($pax === null && !empty($input['mobile_number']) && !preg_match('/^09\d{9}$/', (string) $input['mobile_number'])) {
			$errors[] = '"mobile_number" must be 11 digits starting with 09.';
		}

		$max_capacity = max(array_column($this->Table_model->all(), 'capacity') ?: [0]);
		if (is_numeric($input['pax'] ?? null) && (int) $input['pax'] > $max_capacity) {
			$errors[] = "\"pax\" can be at most {$max_capacity}.";
		}

		$time = is_string($input['reservation_time'] ?? null) ? $input['reservation_time'] : '';
		if (strlen($time) === 5) {
			$time .= ':00';
		}
		if ($date && $time !== '' && !in_array($time, array_column($this->slots($date, max(1, (int) ($input['pax'] ?? 1))), 'time'), true)) {
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

	private function valid_date($value)
	{
		$date = is_string($value) ? DateTime::createFromFormat('!Y-m-d', $value) : false;
		if (!$date || $date->format('Y-m-d') !== $value || $value < date('Y-m-d')) {
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

		$slots = [];
		$now = time();
		for ($t = strtotime("{$date} {$day['open_time']}"); $t + 3600 <= strtotime("{$date} {$day['close_time']}"); $t += 3600) {
			if ($t <= $now) {
				continue;
			}
			$time = date('H:i:s', $t);
			$slots[] = ['time' => $time, 'available' => $this->is_open($date, $time, $pax)];
		}
		return $slots;
	}

	private function is_open($date, $time, $pax, $except_id = null)
	{
		$fitting = count(array_filter($this->Table_model->all(), fn($table) => (int) $table['capacity'] >= $pax));

		$query = $this->Reservation_model
			->filter(['reservation_date' => $date, 'reservation_time' => $time])
			->in('status', $this->active);
		if ($except_id !== null) {
			$query->not_where('reservation_id', $except_id);
		}

		// shortcut: no row lock, so two bookings at the same instant can both pass; add SELECT ... FOR UPDATE if this goes live
		return (int) $query->count() < $fitting;
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
			$this->api->respond_error("A {$reservation['status']} reservation can't be changed", 409);
		}
		return $reservation;
	}

	private function limit()
	{
		$this->api->rate_limit('res_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 20, 60);
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

	private function format($reservation)
	{
		$customer = $this->Customer_model->find($reservation['customer_id']);
		$table = $reservation['table_id'] ? $this->Table_model->find($reservation['table_id']) : null;
		$mobile = $customer['mobile_number'] ?? '';

		$reservation['pax'] = (int) $reservation['pax'];
		$reservation['deposit_amount'] = (float) $reservation['deposit_amount'];
		$reservation['customer'] = [
			'full_name' => $customer['full_name'] ?? null,
			'mobile_number' => strlen($mobile) === 11 ? '09XX XXX ' . substr($mobile, -4) : null,
		];
		$reservation['table_number'] = $table['table_number'] ?? null;
		return $reservation;
	}
}
?>
