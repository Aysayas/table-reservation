<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Notification_model extends Model {
	protected $table = 'notifications';
	protected $primary_key = 'notification_id';
	protected $fillable = ['customer_id', 'type', 'message', 'status'];
}
