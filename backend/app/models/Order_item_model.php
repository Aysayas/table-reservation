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
}
