<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Payment_model extends Model {
	protected $table = 'payments';
	protected $primary_key = 'payment_id';
	protected $fillable = ['order_id', 'reservation_id', 'received_by', 'method', 'provider_reference', 'amount', 'status', 'paid_at'];
}
