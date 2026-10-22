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
		$this->api->require_role('staff', 'admin');
		$status = $this->api->get_query_params()['status'] ?? '';
		if ($status !== '' && !in_array($status, $this->statuses, true)) {
			$this->api->respond_error('"status" must be one of ' . implode(', ', $this->statuses), 422);
		}

		$tables = $status !== ''
			? $this->Table_model->filter(['status' => $status])->order_by('table_id')->get_all()
			: $this->Table_model->order_by('table_id');

		$this->api->respond(['data' => $this->with_activity($tables)]);
	}

	public function show($id)
	{
		$table = $this->Table_model->find($id);
		if (!$table) {
			$this->api->respond_error('Table not found', 404);
		}

		$this->api->respond(['data' => $this->format($table)]);
	}

	public function store()
	{
		$this->api->require_role('admin');
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

	public function destroy($id)
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}

	private function format($table)
	{
		return [
			'table_id' => (int) $table['table_id'],
			'table_number' => $table['table_number'],
			'capacity' => (int) $table['capacity'],
			'status' => $table['status'],
		];
	}

	private function with_activity($tables)
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

		return array_map(fn($table) => $this->format($table) + [
			'current_order' => $orders[$table['table_id']] ?? null,
			'next_reservation' => $bookings[$table['table_id']] ?? null,
		], $tables);
	}
}
?>
