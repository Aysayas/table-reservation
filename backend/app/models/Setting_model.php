<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Setting_model extends Model {
	protected $table = 'restaurant_settings';
	protected $primary_key = 'setting_id';
	protected $fillable = ['restaurant_name', 'address', 'contact_number', 'email', 'facebook_url', 'logo_url', 'deposit_per_guest'];
}
