<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Table_model extends Model {
	protected $table = 'restaurant_tables';
	protected $primary_key = 'table_id';
	protected $fillable = ['table_number', 'capacity', 'qr_token', 'status'];
}
