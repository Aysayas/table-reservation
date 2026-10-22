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
		$this->api->respond(['data' => $this->current()]);
	}

	public function update()
	{
		$this->api->require_role('admin');
		$settings = $this->current();
		$input = $this->api->body();
		$data = [];
		$errors = [];

		$whole = ['slot_minutes' => [15, 240], 'max_pax' => [1, 100]];
		foreach ($whole as $field => [$min, $max]) {
			if (!array_key_exists($field, $input)) {
				continue;
			}
			if (!is_int($input[$field]) || $input[$field] < $min || $input[$field] > $max) {
				$errors[] = "\"{$field}\" must be a whole number from {$min} to {$max}.";
			} else {
				$data[$field] = $input[$field];
			}
		}
		if (array_key_exists('deposit_required', $input)) {
			if (!is_bool($input['deposit_required'])) {
				$errors[] = '"deposit_required" must be true or false.';
			} else {
				$data['deposit_required'] = (int) $input['deposit_required'];
			}
		}
		if (array_key_exists('deposit_per_guest', $input)) {
			$value = $input['deposit_per_guest'];
			if ((!is_int($value) && !is_float($value)) || $value < 0 || $value > 99999999.99) {
				$errors[] = '"deposit_per_guest" must be a number from 0 to 99999999.99.';
			} else {
				$data['deposit_per_guest'] = number_format($value, 2, '.', '');
			}
		}
		if (!$data && !$errors) {
			$errors[] = 'Give at least one of slot_minutes, max_pax, deposit_required, deposit_per_guest.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		$this->Setting_model->update($settings['setting_id'], $data);
		$this->api->respond(['data' => $this->current()]);
	}

	private function current()
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
		return $settings[0];
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
