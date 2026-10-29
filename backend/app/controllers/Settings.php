<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Settings extends Controller {
	private $logo_dir = 'public/uploads/logo/';

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
		$texts = ['restaurant_name' => 100, 'address' => 255, 'contact_number' => 15, 'email' => 100, 'facebook_url' => 255];
		foreach ($texts as $field => $max) {
			if (!array_key_exists($field, $input)) {
				continue;
			}
			$value = is_string($input[$field]) ? trim($input[$field]) : $input[$field];
			if ($value === '' || $value === null) {
				if ($field === 'restaurant_name') {
					$errors[] = '"restaurant_name" can\'t be empty.';
				} else {
					$data[$field] = null;
				}
			} elseif (!is_string($value) || mb_strlen($value) > $max) {
				$errors[] = "\"{$field}\" must be text of at most {$max} characters.";
			} elseif ($field === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
				$errors[] = '"email" must be a valid email.';
			} else {
				$data[$field] = $value;
			}
		}
		if (array_key_exists('service_charge_percent', $input)) {
			$value = $input['service_charge_percent'];
			if ((!is_int($value) && !is_float($value)) || $value < 0 || $value > 100) {
				$errors[] = '"service_charge_percent" must be a number from 0 to 100.';
			} else {
				$data['service_charge_percent'] = number_format($value, 2, '.', '');
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
		if (array_key_exists('booking_open_time', $input)) {
			$value = $input['booking_open_time'] === null ? null : $this->valid_time($input['booking_open_time']);
			if ($input['booking_open_time'] !== null && $value === null) {
				$errors[] = '"booking_open_time" must be a time like 10:00, or null.';
			} else {
				$data['booking_open_time'] = $value;
			}
		}
		if (!$data && !$errors) {
			$errors[] = 'Give at least one setting to change.';
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
		$settings = $this->current();
		if (empty($_FILES['logo'])) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['Send the logo as a multipart "logo" field.']], 422);
		}

		$this->call->library('upload', $_FILES['logo']);
		$this->upload
			->allowed_extensions(['jpg', 'jpeg', 'png'])
			->allowed_mimes(['image/jpeg', 'image/png'])
			->set_dir(ROOT_DIR . $this->logo_dir)
			->max_size(2)
			->is_image()
			->encrypt_name();

		if (!$this->upload->do_upload()) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $this->upload->get_errors()], 422);
		}

		$file = $this->upload->get_filename();
		$this->call->library('cloudinary');
		try {
			$url = $this->cloudinary->store(ROOT_DIR . $this->logo_dir . $file, 'logo') ?? '/uploads/logo/' . $file;
		} catch (RuntimeException $e) {
			$this->api->respond_error('The logo could not be stored, please try again', 502);
		}

		$this->Setting_model->update($settings['setting_id'], ['logo_url' => $url]);
		$old = $settings['logo_url'];
		if (is_string($old) && str_starts_with($old, '/uploads/logo/')) {
			@unlink(ROOT_DIR . $this->logo_dir . basename($old));
		}
		$this->cloudinary->delete($old);
		$this->api->respond(['data' => $this->current()]);
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
		$days = $this->api->body();
		$errors = [];
		$rows = [];

		if (!is_array($days) || !array_is_list($days) || count($days) !== 7) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['Send all 7 days as a list.']], 422);
		}
		foreach ($days as $i => $day) {
			$number = is_array($day) ? ($day['day_of_week'] ?? null) : null;
			if (!is_int($number) || $number < 0 || $number > 6 || isset($rows[$number])) {
				$errors[] = "Day {$i}: \"day_of_week\" must be a different whole number from 0 to 6.";
				continue;
			}
			$open = $day['is_open'] ?? null;
			$times = [];
			foreach (['open_time', 'close_time'] as $field) {
				$times[$field] = $this->valid_time($day[$field] ?? null);
				if (($day[$field] ?? null) !== null && $times[$field] === null) {
					$errors[] = "Day {$number}: \"{$field}\" must be a time like 10:00.";
				}
			}
			if (!is_bool($open)) {
				$errors[] = "Day {$number}: \"is_open\" must be true or false.";
			} elseif ($open && (!$times['open_time'] || !$times['close_time'] || $times['open_time'] >= $times['close_time'])) {
				$errors[] = "Day {$number}: an open day needs \"open_time\" before \"close_time\".";
			}
			$rows[$number] = ['is_open' => (int) $open] + $times;
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		$this->Opening_hour_model->transaction();
		try {
			foreach ($rows as $number => $row) {
				$this->Opening_hour_model->update($number, $row);
			}
			$this->Opening_hour_model->commit();
		} catch (Throwable $e) {
			$this->Opening_hour_model->rollback();
			$this->api->respond_error('Could not save the opening hours', 500);
		}

		$this->hours();
	}

	private function valid_time($value)
	{
		if (!is_string($value) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $value)) {
			return null;
		}
		return strlen($value) === 5 ? $value . ':00' : $value;
	}
}
?>
