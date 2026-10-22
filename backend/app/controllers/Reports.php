<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Reports extends Controller {
	private $defaults = ['daily' => '-6 days', 'weekly' => 'monday this week -7 weeks', 'monthly' => 'first day of -5 months'];

	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Payment_model', 'Order_model', 'Order_item_model', 'Reservation_model']);
	}

	public function index()
	{
		$this->api->require_role('admin');
		$query = $this->api->get_query_params();
		$period = $query['period'] ?? 'daily';
		$errors = [];

		if (!is_string($period) || !isset($this->defaults[$period])) {
			$errors[] = '"period" must be daily, weekly or monthly.';
			$period = 'daily';
		}
		$from = $this->date($query['from'] ?? null) ?? date('Y-m-d', strtotime($this->defaults[$period]));
		$to = $this->date($query['to'] ?? null) ?? date('Y-m-d');
		foreach (['from', 'to'] as $field) {
			if (isset($query[$field]) && $query[$field] !== '' && !$this->date($query[$field])) {
				$errors[] = "\"{$field}\" must be a date (YYYY-MM-DD).";
			}
		}
		if ($from > $to) {
			$errors[] = '"from" must be on or before "to".';
		} elseif ((strtotime($to) - strtotime($from)) / 86400 > 366) {
			$errors[] = 'The range can be at most one year.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		$sales = $this->Payment_model->sales_by_day($from, $to);
		$buckets = [];
		$per_day = [];
		$reservations = $this->db->raw(
			"SELECT reservation_date AS day, COUNT(*) AS count FROM reservations
			 WHERE status <> 'cancelled' AND reservation_date BETWEEN ? AND ? GROUP BY reservation_date",
			[$from, $to]
		)->fetchAll(PDO::FETCH_KEY_PAIR);
		for ($day = $from; $day <= $to; $day = date('Y-m-d', strtotime("{$day} +1 day"))) {
			$key = $period === 'daily' ? $day : ($period === 'weekly' ? date('Y-m-d', strtotime('monday this week', strtotime($day))) : substr($day, 0, 7));
			$buckets[$key] = round(($buckets[$key] ?? 0) + ($sales[$day]['total'] ?? 0), 2);
			$per_day[] = ['date' => $day, 'count' => (int) ($reservations[$day] ?? 0)];
		}

		$total_sales = round(array_sum(array_column($sales, 'total')), 2);
		$paid_orders = array_sum(array_column($sales, 'orders'));
		$range = ["{$from} 00:00:00", date('Y-m-d', strtotime("{$to} +1 day")) . ' 00:00:00'];
		$total_orders = $this->Order_model->query()->where('created_at', '>=', $range[0])->where('created_at', '<', $range[1])->count();
		$busiest = $this->db->raw(
			"SELECT HOUR(created_at) AS hour, COUNT(*) AS count FROM orders
			 WHERE created_at >= ? AND created_at < ? GROUP BY HOUR(created_at) ORDER BY count DESC, hour LIMIT 1",
			$range
		)->fetch(PDO::FETCH_ASSOC);
		$stats = $this->Reservation_model->stats($from, $to);

		$this->api->respond(['data' => [
			'period' => $period,
			'from' => $from,
			'to' => $to,
			'sales_over_time' => array_map(fn($start, $total) => ['start' => $start, 'total' => $total], array_keys($buckets), array_values($buckets)),
			'best_sellers' => $this->Order_item_model->best_sellers($from, $to, 10),
			'reservations_per_day' => $per_day,
			'summary' => [
				'total_sales' => $total_sales,
				'total_orders' => (int) $total_orders,
				'average_order_value' => $paid_orders ? round($total_sales / $paid_orders, 2) : 0.0,
				'reservations' => $stats['reservations'],
				'no_shows' => $stats['no_shows'],
				'no_show_rate' => $stats['no_show_rate'],
				'busiest_hour' => $busiest ? sprintf('%02d:00', $busiest['hour']) : null,
			],
		]]);
	}

	private function date($value)
	{
		$date = is_string($value) ? DateTime::createFromFormat('!Y-m-d', $value) : false;
		return $date && $date->format('Y-m-d') === $value ? $value : null;
	}
}
?>
