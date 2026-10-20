<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Reservation_model extends Model {
	protected $table = 'reservations';
	protected $primary_key = 'reservation_id';
	protected $fillable = ['customer_id', 'table_id', 'reference_code', 'reservation_date', 'reservation_time', 'pax', 'deposit_amount', 'status'];

	public function customer()
	{
		return $this->belongs_to('Customer_model', 'customer_id');
	}

	public function table()
	{
		return $this->belongs_to('Table_model', 'table_id');
	}
}
