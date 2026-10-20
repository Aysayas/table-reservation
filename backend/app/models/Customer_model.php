<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Customer_model extends Model {
	protected $table = 'customers';
	protected $primary_key = 'customer_id';
	protected $fillable = ['full_name', 'mobile_number', 'email'];
}
