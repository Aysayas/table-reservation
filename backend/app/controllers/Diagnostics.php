<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Diagnostics extends Controller {
	private $services = ['paymongo', 'recommender', 'cloudinary', 'pusher'];
	private $test_mobile = '09000000000';

	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
	}

	public function check($service)
	{
		$this->api->require_role('admin');
		if (!in_array($service, $this->services, true)) {
			$this->api->respond_error('Unknown service', 404);
		}

		$this->call->library($service);
		$start = microtime(true);
		try {
			$result = $this->$service->check();
		} catch (Throwable $e) {
			$result = ['status' => 'failed', 'detail' => ['message' => $e->getMessage()]];
		}
		$this->api->respond(['data' => ['service' => $service, 'ms' => (int) round((microtime(true) - $start) * 1000)] + $result]);
	}

	public function start_payment()
	{
		$this->api->require_role('admin');
		$this->call->model(['Setting_model', 'Opening_hour_model', 'Customer_model', 'Reservation_model', 'Payment_model']);

		$per_guest = (float) ($this->Setting_model->all()[0]['deposit_per_guest'] ?? 0);
		if ($per_guest <= 0) {
			$this->api->respond_error('Set deposit_per_guest above 0 first: there is nothing to pay', 409);
		}
		$slot = $this->next_open_slot();
		if (!$slot) {
			$this->api->respond_error('No opening hours in the next 7 days', 409);
		}

		$customer = $this->Customer_model->first_or_create(['mobile_number' => $this->test_mobile], ['full_name' => 'Diagnostics Test'])['record'];
		do {
			$code = 'RSV-T' . substr(str_shuffle('ABCDEFGHJKMNPQRSTUVWXYZ23456789'), 0, 5);
		} while ($this->Reservation_model->exists(['reference_code' => $code]));
		$id = (int) $this->Reservation_model->insert([
			'customer_id' => $customer['customer_id'],
			'reference_code' => $code,
			'reservation_date' => $slot[0],
			'reservation_time' => $slot[1],
			'pax' => 1,
			'special_request' => 'Integration test, cancelled automatically once paid',
			'deposit_amount' => number_format($per_guest, 2, '.', ''),
			'status' => 'pending',
		]);

		$this->call->library('paymongo');
		$page = rtrim(getenv('APP_URL') ?: '', '/') . '/diagnostics.html';
		try {
			$checkout = $this->paymongo->start('reservation_id', $id, $per_guest, "Integration test deposit {$code}", $code, $page, $page);
		} catch (RuntimeException $e) {
			$this->Reservation_model->update($id, ['status' => 'cancelled']);
			$this->api->respond_error('PayMongo is not available: ' . $e->getMessage(), 502);
		}
		$this->api->respond(['data' => $checkout + [
			'reference_code' => $code,
			'amount' => $per_guest,
			'fake' => getenv('PAYMONGO_SECRET_KEY') ? false : true,
		]], 201);
	}

	public function payment_status($payment_id)
	{
		$this->api->require_role('admin');
		$this->call->model(['Payment_model', 'Reservation_model', 'Customer_model']);
		$payment = $this->Payment_model->find($payment_id);
		$reservation = $payment && $payment['reservation_id'] ? $this->Reservation_model->find($payment['reservation_id']) : null;
		$customer = $reservation ? $this->Customer_model->find($reservation['customer_id']) : null;
		if (!$payment || !$customer || $customer['mobile_number'] !== $this->test_mobile) {
			$this->api->respond_error('Test payment not found', 404);
		}

		$paid = $payment['status'] === 'paid';
		if ($paid && in_array($reservation['status'], ['pending', 'confirmed'], true)) {
			$this->Reservation_model->update($reservation['reservation_id'], ['status' => 'cancelled']);
			$reservation = $this->Reservation_model->find($reservation['reservation_id']);
		}
		$this->api->respond(['data' => [
			'payments_row' => [
				'payment_id' => (int) $payment['payment_id'],
				'method' => $payment['method'],
				'status' => $payment['status'],
				'amount' => (float) $payment['amount'],
				'provider_reference' => $payment['provider_reference'],
				'paid_at' => $payment['paid_at'],
			],
			'reservation' => [
				'reference_code' => $reservation['reference_code'],
				'status' => $reservation['status'],
				'deposit_status' => $paid || $this->Payment_model->exists(['reservation_id' => $reservation['reservation_id'], 'status' => 'paid']) ? 'paid' : 'unpaid',
			],
		]]);
	}

	public function upload_photo()
	{
		$this->api->require_role('admin');
		if (empty($_FILES['photo'])) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['Send the photo as a multipart "photo" field.']], 422);
		}
		$dir = ROOT_DIR . 'runtime/diagnostics/';
		if (!is_dir($dir)) {
			mkdir($dir, 0755, true);
		}
		$this->call->library('upload', $_FILES['photo']);
		$this->upload
			->allowed_extensions(['jpg', 'jpeg', 'png'])
			->allowed_mimes(['image/jpeg', 'image/png'])
			->set_dir($dir)
			->max_size(2)
			->is_image()
			->encrypt_name();
		if (!$this->upload->do_upload()) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $this->upload->get_errors()], 422);
		}

		$path = $dir . $this->upload->get_filename();
		$bytes = filesize($path);
		$this->call->library('cloudinary');
		try {
			$url = $this->cloudinary->store($path, 'diagnostics');
		} catch (RuntimeException $e) {
			$this->api->respond_error('Cloudinary upload failed: ' . $e->getMessage(), 502);
		}
		if ($url === null) {
			@unlink($path);
			$this->api->respond(['data' => ['fake' => true, 'message' => 'Cloudinary keys are empty, so nothing was uploaded', 'bytes_sent' => $bytes]]);
		}
		$this->api->respond(['data' => ['fake' => false, 'url' => $url, 'bytes_sent' => $bytes]], 201);
	}

	public function delete_photo()
	{
		$this->api->require_role('admin');
		$url = $this->api->body()['url'] ?? '';
		if (!is_string($url) || !preg_match('#^https://res\.cloudinary\.com/[^/]+/image/upload/(v\d+/)?vencios-garden/diagnostics/[A-Za-z0-9_-]+\.(jpg|jpeg|png)$#', $url)) {
			$this->api->respond_error('Only test photos in vencios-garden/diagnostics can be deleted here', 422);
		}
		$this->call->library('cloudinary');
		$this->api->respond(['data' => ['deleted' => $this->cloudinary->delete($url)]]);
	}

	public function send_sms()
	{
		$this->api->require_role('admin');
		$mobile = trim((string) ($this->api->body()['mobile'] ?? ''));
		if ($mobile === '') {
			$mobile = $this->test_mobile;
		} elseif (!preg_match('/^09\d{9}$/', $mobile)) {
			$this->api->respond_error('Use a mobile number like 09171234567', 422);
		}
		$this->call->library('sms');
		$this->api->respond(['data' => $this->sms->test($mobile)], 201);
	}

	public function sms_balance()
	{
		$this->api->require_role('admin');
		$this->call->library('sms');
		try {
			$balance = $this->sms->balance();
		} catch (Throwable $e) {
			$this->api->respond_error('iProg SMS: ' . $e->getMessage(), 502);
		}
		$this->api->respond(['data' => ['mode' => $this->sms->mode(), 'balance' => $balance]]);
	}

	public function latest_sms()
	{
		$this->api->require_role('admin');
		$rows = $this->db->raw('SELECT n.notification_id, c.full_name, c.mobile_number, n.message, n.status, n.sent_at FROM notifications n JOIN customers c ON c.customer_id = n.customer_id WHERE n.type = "sms" ORDER BY n.notification_id DESC LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
		$this->api->respond(['data' => array_map(function ($row) {
			$mobile = $row['mobile_number'];
			return [
				'notification_id' => (int) $row['notification_id'],
				'customer' => $row['full_name'],
				'mobile' => $mobile === $this->test_mobile ? $mobile : '09XX XXX ' . substr($mobile, -4),
				'message' => $row['message'],
				'status' => $row['status'],
				'sent_at' => $row['sent_at'],
			];
		}, $rows)]);
	}

	private function next_open_slot()
	{
		for ($day = 1; $day <= 7; $day++) {
			$date = date('Y-m-d', strtotime("+{$day} day"));
			$hours = $this->Opening_hour_model->find((int) date('w', strtotime($date)));
			if ($hours && $hours['is_open'] && $hours['open_time']) {
				return [$date, $hours['open_time']];
			}
		}
		return null;
	}
}
?>
