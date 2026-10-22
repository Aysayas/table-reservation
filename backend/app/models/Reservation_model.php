<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Reservation_model extends Model {
	protected $table = 'reservations';
	protected $primary_key = 'reservation_id';
	protected $fillable = ['customer_id', 'table_id', 'reference_code', 'reservation_date', 'reservation_time', 'pax', 'special_request', 'deposit_amount', 'status'];

	public function customer()
	{
		return $this->belongs_to('Customer_model', 'customer_id');
	}

	public function table()
	{
		return $this->belongs_to('Table_model', 'table_id');
	}

	public function stats($from, $to)
	{
		$row = $this->db->raw(
			"SELECT SUM(status <> 'cancelled') AS reservations,
			        SUM(status = 'no_show') AS no_shows,
			        SUM(status IN ('arrived', 'no_show')) AS settled
			 FROM reservations
			 WHERE reservation_date BETWEEN ? AND ?",
			[$from, $to]
		)->fetch(PDO::FETCH_ASSOC);

		$no_shows = (int) $row['no_shows'];
		$settled = (int) $row['settled'];
		return [
			'reservations' => (int) $row['reservations'],
			'no_shows' => $no_shows,
			'no_show_rate' => $settled ? round($no_shows / $settled * 100, 1) : 0.0,
		];
	}
}
