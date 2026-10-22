<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class User_model extends Model {
	protected $table = 'users';
	protected $primary_key = 'user_id';
	protected $fillable = ['full_name', 'email', 'password_hash', 'role', 'is_active', 'last_login_at'];
}
