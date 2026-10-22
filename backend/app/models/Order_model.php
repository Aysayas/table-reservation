<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Order_model extends Model {
	protected $table = 'orders';
	protected $primary_key = 'order_id';
	protected $fillable = ['table_id', 'customer_id', 'customer_name', 'status', 'total_amount', 'payment_status'];

	public function items()
	{
		return $this->has_many('Order_item_model', 'order_id');
	}
}
