<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Settings extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Setting_model', 'Opening_hour_model']);
	}

	public function show()
	{
		$settings = $this->Setting_model->all();
		if (!$settings) {
			$this->api->respond_error('Settings not found', 404);
		}

		$settings[0]['deposit_per_guest'] = (float) $settings[0]['deposit_per_guest'];
		$settings[0]['service_charge_percent'] = (float) $settings[0]['service_charge_percent'];
		$settings[0]['slot_minutes'] = (int) $settings[0]['slot_minutes'];
		$settings[0]['max_pax'] = (int) $settings[0]['max_pax'];
		$settings[0]['deposit_required'] = (bool) $settings[0]['deposit_required'];
		$this->api->respond(['data' => $settings[0]]);
	}

	public function update()
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function logo()
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function hours()
	{
		$hours = array_map(function ($day) {
			$day['is_open'] = (bool) $day['is_open'];
			return $day;
		}, $this->Opening_hour_model->order_by('day_of_week'));

		$this->api->respond(['data' => $hours]);
	}

	public function update_hours()
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
