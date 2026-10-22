<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Dashboard extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Reservation_model', 'Customer_model', 'Order_model', 'Order_item_model', 'Table_model']);
	}

	public function staff()
	{
		$this->api->require_role('staff', 'admin');

		$reservations = $this->Reservation_model
			->filter(['reservation_date' => date('Y-m-d')])
			->in('status', ['pending', 'confirmed', 'arrived'])
			->order_by('reservation_time')
			->get_all();
		$arrived = array_filter($reservations, fn($reservation) => $reservation['status'] === 'arrived');
		$upcoming = array_filter($reservations, fn($reservation) => $reservation['status'] !== 'arrived' && $reservation['reservation_time'] >= date('H:i:s'));

		$orders = $this->Order_model->query()
			->in('status', ['received', 'preparing', 'ready'])
			->order_by('order_id', 'DESC')
			->get_all();

		$tables = $this->Table_model->all();
		$numbers = array_column($tables, 'table_number', 'table_id');

		$this->api->respond(['data' => [
			'reservations_today' => count($reservations),
			'guests_arrived' => array_sum(array_map(fn($reservation) => (int) $reservation['pax'], $arrived)),
			'active_orders' => count($orders),
			'available_tables' => count(array_filter($tables, fn($table) => $table['status'] === 'available')),
			'total_tables' => count($tables),
			'upcoming_reservations' => array_map(fn($reservation) => [
				'reservation_id' => (int) $reservation['reservation_id'],
				'reference_code' => $reservation['reference_code'],
				'reservation_time' => $reservation['reservation_time'],
				'full_name' => $this->Customer_model->find($reservation['customer_id'])['full_name'] ?? null,
				'pax' => (int) $reservation['pax'],
				'table_number' => $numbers[$reservation['table_id']] ?? null,
				'status' => $reservation['status'],
			], array_slice(array_values($upcoming), 0, 7)),
			'active_orders_list' => array_map(fn($order) => [
				'order_id' => (int) $order['order_id'],
				'table_number' => $numbers[$order['table_id']] ?? null,
				'item_count' => array_sum(array_column($this->Order_item_model->find_all_by('order_id', $order['order_id']), 'quantity')),
				'total_amount' => (float) $order['total_amount'],
				'status' => $order['status'],
			], array_slice($orders, 0, 7)),
		]]);
	}

	public function admin()
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
