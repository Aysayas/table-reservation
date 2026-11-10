<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Table_model extends Model {
	protected $table = 'restaurant_tables';
	protected $primary_key = 'table_id';
	protected $fillable = ['table_number', 'capacity', 'qr_token', 'status', 'is_active'];
	private $arrived_hours = 3;

	public function active()
	{
		return $this->filter(['is_active' => 1])->order_by('table_id')->get_all();
	}

	public function occupy($table_id)
	{
		$this->db->raw("UPDATE restaurant_tables SET status = 'occupied' WHERE table_id = ? AND status IN ('available', 'reserved')", [(int) $table_id]);
	}

	public function free_if_idle($table_id)
	{
		$now = time();
		$this->db->raw(
			"UPDATE restaurant_tables SET status = IF(
				EXISTS (SELECT 1 FROM reservations
					WHERE table_id = ? AND status IN ('pending', 'confirmed') AND reservation_date = ? AND reservation_time > ?),
				'reserved', 'available')
			WHERE table_id = ? AND status = 'occupied'
			AND NOT EXISTS (SELECT 1 FROM orders WHERE table_id = ? AND NOT (status = 'served' AND payment_status = 'paid'))
			AND NOT EXISTS (SELECT 1 FROM reservations
				WHERE table_id = ? AND status = 'arrived' AND reservation_date = ?
				AND TIMESTAMP(reservation_date, reservation_time) > ?)",
			[
				(int) $table_id, date('Y-m-d', $now), date('H:i:s', $now),
				(int) $table_id, (int) $table_id,
				(int) $table_id, date('Y-m-d', $now), date('Y-m-d H:i:s', $now - $this->arrived_hours * 3600),
			]
		);
	}
}
