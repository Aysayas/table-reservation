<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Payment_model extends Model {
	protected $table = 'payments';
	protected $primary_key = 'payment_id';
	protected $fillable = ['order_id', 'reservation_id', 'received_by', 'method', 'provider_reference', 'amount', 'status', 'paid_at'];

	public function sales_by_day($from, $to)
	{
		$rows = $this->db->raw(
			"SELECT DATE(paid_at) AS day, SUM(amount) AS total, COUNT(DISTINCT order_id) AS orders
			 FROM payments
			 WHERE status = 'paid' AND order_id IS NOT NULL AND paid_at >= ? AND paid_at < ?
			 GROUP BY DATE(paid_at)",
			["{$from} 00:00:00", date('Y-m-d', strtotime("{$to} +1 day")) . ' 00:00:00']
		)->fetchAll(PDO::FETCH_ASSOC);

		$days = [];
		foreach ($rows as $row) {
			$days[$row['day']] = ['total' => round((float) $row['total'], 2), 'orders' => (int) $row['orders']];
		}
		return $days;
	}
}
