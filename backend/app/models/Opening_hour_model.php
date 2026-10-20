<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Opening_hour_model extends Model {
	protected $table = 'opening_hours';
	protected $primary_key = 'day_of_week';
	protected $fillable = ['day_of_week', 'open_time', 'close_time', 'is_open'];
}
