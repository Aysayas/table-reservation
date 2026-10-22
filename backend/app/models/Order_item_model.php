<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Order_item_model extends Model {
	protected $table = 'order_items';
	protected $primary_key = 'order_item_id';
	protected $fillable = ['order_id', 'item_id', 'quantity', 'unit_price', 'notes'];

	public function item()
	{
		return $this->belongs_to('Menu_item_model', 'item_id');
	}

	public function best_sellers($from, $to, $limit)
	{
		$rows = $this->db->raw(
			"SELECT oi.item_id, m.name, SUM(oi.quantity) AS quantity
			 FROM order_items oi
			 JOIN orders o ON o.order_id = oi.order_id
			 JOIN menu_items m ON m.item_id = oi.item_id
			 WHERE o.payment_status = 'paid' AND o.created_at >= ? AND o.created_at < ?
			 GROUP BY oi.item_id, m.name
			 ORDER BY quantity DESC, m.name
			 LIMIT " . (int) $limit,
			["{$from} 00:00:00", date('Y-m-d', strtotime("{$to} +1 day")) . ' 00:00:00']
		)->fetchAll(PDO::FETCH_ASSOC);

		return array_map(fn($row) => [
			'item_id' => (int) $row['item_id'],
			'name' => $row['name'],
			'quantity' => (int) $row['quantity'],
		], $rows);
	}
}
