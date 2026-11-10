<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Tables extends Controller {
	private $statuses = ['available', 'occupied', 'reserved'];

	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Table_model', 'Order_model', 'Reservation_model', 'Customer_model']);
	}

	public function index()
	{
		$user = $this->api->require_role('staff', 'admin');
		$status = $this->api->get_query_params()['status'] ?? '';
		if ($status !== '' && !in_array($status, $this->statuses, true)) {
			$this->api->respond_error('"status" must be one of ' . implode(', ', $this->statuses), 422);
		}

		$retired = $user['role'] === 'admin' && ($this->api->get_query_params()['retired'] ?? '') === '1';
		$tables = $status !== ''
			? $this->Table_model->filter(['status' => $status, 'is_active' => 1])->order_by('table_id')->get_all()
			: ($retired ? $this->Table_model->order_by('table_id') : $this->Table_model->active());

		$this->api->respond(['data' => $this->with_activity($tables, $user['role'] === 'admin')]);
	}

	public function taken()
	{
		$this->api->require_role('staff', 'admin');
		$query = $this->api->get_query_params();
		$date = $query['date'] ?? null;
		$time = $query['time'] ?? null;
		$except = $query['except_id'] ?? '0';
		$valid_date = is_string($date) ? DateTime::createFromFormat('!Y-m-d', $date) : false;
		$valid_time = is_string($time) ? DateTime::createFromFormat('!H:i:s', $time) : false;
		if (!$valid_date || $valid_date->format('Y-m-d') !== $date || !$valid_time || $valid_time->format('H:i:s') !== $time || !is_string($except) || !ctype_digit($except)) {
			$this->api->respond_error('Give a date (YYYY-MM-DD), a time (HH:MM:SS) and, if needed, a numeric except_id', 422);
		}

		$rows = $this->Reservation_model
			->filter(['reservation_date' => $date, 'reservation_time' => $time])
			->in('status', ['pending', 'confirmed', 'arrived'])
			->where_not_null('table_id')
			->not_where('reservation_id', (int) $except)
			->get_all();
		$this->api->respond(['data' => array_map('intval', array_column($rows, 'table_id'))]);
	}

	public function show($id)
	{
		$table = $this->Table_model->find($id);
		if (!$table || !(int) $table['is_active']) {
			$this->api->respond_error('Table not found', 404);
		}

		$this->api->respond(['data' => $this->format($table)]);
	}

	public function store()
	{
		$this->api->require_role('admin');
		$input = $this->validate();

		$id = $this->Table_model->insert($input + ['qr_token' => bin2hex(random_bytes(32)), 'status' => 'available']);
		$this->api->respond(['data' => $this->with_activity([$this->Table_model->find($id)], true)[0]], 201);
	}

	public function update($id)
	{
		$this->api->require_role('admin');
		if (!$this->Table_model->find($id)) {
			$this->api->respond_error('Table not found', 404);
		}

		$input = $this->validate((int) $id);
		$too_big = $this->upcoming($id)->where('pax', '>', $input['capacity'])->count();
		if ($too_big) {
			$this->api->respond_error("An upcoming booking for this table has more than {$input['capacity']} guests", 409);
		}

		$this->Table_model->update($id, $input);
		$this->api->respond(['data' => $this->with_activity([$this->Table_model->find($id)], true)[0]]);
	}

	public function status($id)
	{
		$this->api->require_role('staff', 'admin');
		if (!$this->Table_model->find($id)) {
			$this->api->respond_error('Table not found', 404);
		}

		$status = $this->api->body()['status'] ?? null;
		if (!in_array($status, $this->statuses, true)) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['"status" must be one of ' . implode(', ', $this->statuses) . '.']], 422);
		}

		$this->Table_model->update($id, ['status' => $status]);
		$this->api->respond(['data' => $this->with_activity([$this->Table_model->find($id)])[0]]);
	}

	public function active($id)
	{
		$this->api->require_role('admin');
		$table = $this->Table_model->find($id);
		if (!$table) {
			$this->api->respond_error('Table not found', 404);
		}
		$active = $this->api->body()['is_active'] ?? null;
		if (!is_bool($active)) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['"is_active" must be true or false.']], 422);
		}
		if (!$active) {
			$orders = $this->Order_model->find_all_by('table_id', (int) $id);
			if (array_filter($orders, fn($order) => $order['status'] !== 'served' || $order['payment_status'] !== 'paid')) {
				$this->api->respond_error("Table {$table['table_number']} has an open order; finish it first", 409);
			}
			if ($this->upcoming($id)->count()) {
				$this->api->respond_error("Table {$table['table_number']} has upcoming bookings; move them first", 409);
			}
			if ($this->Reservation_model->filter(['table_id' => $id, 'status' => 'arrived', 'reservation_date' => date('Y-m-d')])->count()) {
				$this->api->respond_error("Table {$table['table_number']} has seated guests today", 409);
			}
		}

		$this->Table_model->update($id, ['is_active' => $active ? 1 : 0] + ($active ? [] : ['status' => 'available']));
		$this->api->respond(['data' => $this->with_activity([$this->Table_model->find($id)], true)[0]]);
	}

	public function destroy($id)
	{
		$this->api->require_role('admin');
		if (!$this->Table_model->find($id)) {
			$this->api->respond_error('Table not found', 404);
		}
		if ($this->Order_model->exists(['table_id' => $id])) {
			$this->api->respond_error("This table has past orders, so it can't be deleted. Retire it instead.", 409);
		}
		if ($this->upcoming($id)->count()) {
			$this->api->respond_error('This table has upcoming bookings; move them first', 409);
		}

		$this->Table_model->delete($id);
		$this->api->respond(['data' => ['message' => 'Deleted']]);
	}

	private function validate($except_id = null)
	{
		$input = $this->api->body();
		$number = is_string($input['table_number'] ?? null) ? trim($input['table_number']) : '';
		$capacity = $input['capacity'] ?? null;

		$errors = [];
		if ($number === '' || mb_strlen($number) > 10) {
			$errors[] = '"table_number" is required, up to 10 characters.';
		} else {
			$query = $this->Table_model->filter(['table_number' => $number]);
			if ($except_id !== null) {
				$query->not_where('table_id', $except_id);
			}
			if ($query->count()) {
				$errors[] = 'A table with that number already exists.';
			}
		}
		if (!is_int($capacity) || $capacity < 1 || $capacity > 50) {
			$errors[] = '"capacity" must be a whole number from 1 to 50.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		return ['table_number' => $number, 'capacity' => $capacity];
	}

	private function upcoming($table_id)
	{
		return $this->Reservation_model
			->filter(['table_id' => $table_id])
			->in('status', ['pending', 'confirmed'])
			->where('reservation_date', '>=', date('Y-m-d'));
	}

	private function format($table)
	{
		return [
			'table_id' => (int) $table['table_id'],
			'table_number' => $table['table_number'],
			'capacity' => (int) $table['capacity'],
			'status' => $table['status'],
			'is_active' => (bool) $table['is_active'],
		];
	}

	private function with_activity($tables, $with_token = false)
	{
		$orders = [];
		$open = $this->Order_model->query()
			->in('status', ['received', 'preparing', 'ready'])
			->or_where('payment_status', 'unpaid')
			->order_by('order_id', 'DESC')
			->get_all();
		foreach ($open as $order) {
			$orders[$order['table_id']] ??= [
				'order_id' => (int) $order['order_id'],
				'status' => $order['status'],
				'payment_status' => $order['payment_status'],
				'total_amount' => (float) $order['total_amount'],
				'created_at' => $order['created_at'],
			];
		}

		$bookings = [];
		$today = $this->Reservation_model
			->filter(['reservation_date' => date('Y-m-d')])
			->in('status', ['pending', 'confirmed'])
			->where_not_null('table_id')
			->order_by('reservation_time')
			->get_all();
		foreach ($today as $reservation) {
			$bookings[$reservation['table_id']] ??= [
				'reservation_id' => (int) $reservation['reservation_id'],
				'reference_code' => $reservation['reference_code'],
				'full_name' => $this->Customer_model->find($reservation['customer_id'])['full_name'] ?? null,
				'reservation_time' => $reservation['reservation_time'],
				'status' => $reservation['status'],
			];
		}

		return array_map(fn($table) => $this->format($table) + ($with_token ? ['qr_token' => $table['qr_token']] : []) + [
			'current_order' => $orders[$table['table_id']] ?? null,
			'next_reservation' => $bookings[$table['table_id']] ?? null,
		], $tables);
	}
}
?>
