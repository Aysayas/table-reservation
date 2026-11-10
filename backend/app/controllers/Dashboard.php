<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Dashboard extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Reservation_model', 'Customer_model', 'Order_model', 'Order_item_model', 'Table_model', 'Payment_model']);
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
			'available_tables' => count(array_filter($tables, fn($table) => $table['is_active'] && $table['status'] === 'available')),
			'total_tables' => count(array_filter($tables, fn($table) => (bool) $table['is_active'])),
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
		$today = date('Y-m-d');
		$week_start = date('Y-m-d', strtotime('-6 days'));

		$sales = $this->Payment_model->sales_by_day($week_start, $today);
		$last_7_days = [];
		for ($day = $week_start; $day <= $today; $day = date('Y-m-d', strtotime("{$day} +1 day"))) {
			$last_7_days[] = ['date' => $day, 'total' => $sales[$day]['total'] ?? 0.0];
		}

		$tomorrow = date('Y-m-d', strtotime('+1 day'));
		$orders_today = $this->Order_model->query()
			->where('created_at', '>=', "{$today} 00:00:00")
			->where('created_at', '<', "{$tomorrow} 00:00:00")
			->count();
		$numbers = array_column($this->Table_model->all(), 'table_number', 'table_id');

		$this->api->respond(['data' => [
			'sales_today' => $sales[$today]['total'] ?? 0.0,
			'orders_today' => (int) $orders_today,
			'reservations_today' => $this->Reservation_model->stats($today, $today)['reservations'],
			'no_show_rate' => $this->Reservation_model->stats(date('Y-m-d', strtotime('-29 days')), $today)['no_show_rate'],
			'sales_last_7_days' => $last_7_days,
			'best_sellers' => $this->Order_item_model->best_sellers(date('Y-m-d', strtotime('-29 days')), $today, 5),
			'recent_orders' => array_map(function ($order) use ($numbers) {
				$paid = $this->Payment_model->filter(['order_id' => $order['order_id'], 'status' => 'paid'])->order_by('payment_id', 'DESC')->get();
				return [
					'order_id' => (int) $order['order_id'],
					'created_at' => $order['created_at'],
					'table_number' => $numbers[$order['table_id']] ?? null,
					'item_count' => array_sum(array_column($this->Order_item_model->find_all_by('order_id', $order['order_id']), 'quantity')),
					'total_amount' => (float) $order['total_amount'],
					'payment_status' => $order['payment_status'],
					'payment_method' => $paid['method'] ?? null,
					'status' => $order['status'],
				];
			}, $this->Order_model->query()->order_by('order_id', 'DESC')->limit(5)->get_all()),
		]]);
	}
}
?>
