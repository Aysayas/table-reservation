<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Category_model extends Model {
	protected $table = 'categories';
	protected $primary_key = 'category_id';
	protected $fillable = ['name', 'sort_order'];
}
