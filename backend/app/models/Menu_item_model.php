<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Menu_item_model extends Model {
	protected $table = 'menu_items';
	protected $primary_key = 'item_id';
	protected $fillable = ['category_id', 'name', 'description', 'price', 'image_url', 'is_available', 'is_recommended'];

	public function category()
	{
		return $this->belongs_to('Category_model', 'category_id');
	}
}
