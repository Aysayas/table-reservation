<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Sms {
	private const API = 'https://www.iprogsms.com/api/v1';
	private static $queue = [];
	private $_lava;
	private $token;

	public function __construct()
	{
		$this->_lava = lava_instance();
		$this->_lava->call->model(['Reservation_model', 'Customer_model', 'Notification_model']);
		$this->token = trim(getenv('IPROG_SMS_TOKEN') ?: '');
	}

	public function mode()
	{
		return $this->token === '' ? 'fake' : 'iprog';
	}

	public function reservation($reservation_id, $kind)
	{
		try {
			$reservation = $this->_lava->Reservation_model->find($reservation_id);
			$customer = $reservation ? $this->_lava->Customer_model->find($reservation['customer_id']) : null;
			if (!$customer) {
				return;
			}
			$message = $this->message($reservation, $customer, $kind);
			$this->after_response(function () use ($customer, $message) {
				$this->deliver($customer, $message);
			});
		} catch (Throwable $e) {
			error_log("SMS {$kind} for reservation {$reservation_id} failed: " . $e->getMessage());
		}
	}

	public function test($mobile)
	{
		$customer = $this->_lava->Customer_model->first_or_create(['mobile_number' => $mobile], ['full_name' => 'Diagnostics Test'])['record'];
		$message = "Vencio's Garden: This is a test message from the integration tests page.";
		$status = $this->deliver($customer, $message) ? 'sent' : 'failed';
		return ['message' => $message, 'length' => strlen($message), 'status' => $status, 'mode' => $this->mode()];
	}

	public function balance()
	{
		if ($this->token === '') {
			return null;
		}
		$data = $this->request('GET', '/account/sms_credits?api_token=' . rawurlencode($this->token));
		if (!isset($data['data']['load_balance'])) {
			throw new RuntimeException($data['message'] ?? 'Could not read the SMS balance');
		}
		return (float) $data['data']['load_balance'];
	}

	private function after_response(callable $job)
	{
		if (PHP_SAPI === 'cli' || !function_exists('fastcgi_finish_request')) {
			$job();
			return;
		}
		if (!self::$queue) {
			register_shutdown_function(function () {
				fastcgi_finish_request();
				foreach (self::$queue as $queued) {
					try {
						$queued();
					} catch (Throwable $e) {
						error_log('SMS after response failed: ' . $e->getMessage());
					}
				}
			});
		}
		self::$queue[] = $job;
	}

	private function deliver($customer, $message)
	{
		$sent = $this->send($customer['mobile_number'], $message);
		$this->_lava->Notification_model->insert([
			'customer_id' => $customer['customer_id'],
			'type' => 'sms',
			'message' => $message,
			'status' => $sent ? 'sent' : 'failed',
		]);
		return $sent;
	}

	private function message($reservation, $customer, $kind)
	{
		$name = mb_substr(strtok(trim($customer['full_name']), ' ') ?: 'there', 0, 20);
		$code = $reservation['reference_code'];
		$when = strtotime("{$reservation['reservation_date']} {$reservation['reservation_time']}");
		$date = date('D, M j', $when);
		$time = date('g:i A', $when);
		$deposit = (float) $reservation['deposit_amount'];

		switch ($kind) {
			case 'booked':
				return "Vencio's Garden: Hi {$name}, your table for {$reservation['pax']} on {$date} at {$time} is booked. Code {$code}."
					. ($deposit > 0 ? ' Please pay the PHP ' . number_format($deposit, 2) . ' deposit.' : '');
			case 'deposit_paid':
				return "Vencio's Garden: We received your PHP " . number_format($deposit, 2) . " deposit for {$code} on {$date} at {$time}. See you!";
			case 'cancelled':
				return "Vencio's Garden: Your booking {$code} on {$date} at {$time} is cancelled.";
			case 'rescheduled':
				return "Vencio's Garden: Your booking {$code} is moved to {$date} at {$time}.";
			case 'reminder':
				return "Vencio's Garden: Reminder, your table for {$reservation['pax']} is today at {$time}. Code {$code}. See you soon!";
		}
		throw new InvalidArgumentException("Unknown SMS kind {$kind}");
	}

	private function send($mobile, $message)
	{
		$number = $this->local_number($mobile);
		$masked = '09XX XXX ' . substr($number, -4);
		if ($this->token === '') {
			error_log("SMS (fake mode) to {$masked}: {$message}");
			return true;
		}
		$payload = ['api_token' => $this->token, 'phone_number' => $number, 'message' => $message];
		$provider = trim(getenv('IPROG_SMS_PROVIDER') ?: '');
		if ($provider !== '') {
			$payload['sms_provider'] = (int) $provider;
		}
		$data = $this->request('POST', '/sms_messages', $payload);
		if ((int) ($data['status'] ?? 0) === 200) {
			error_log("SMS sent to {$masked}: " . ($data['message_id'] ?? 'no id'));
			return true;
		}
		error_log("SMS failed to {$masked}: " . ($data['message'] ?? 'no reply'));
		return false;
	}

	private function request($method, $path, $payload = null)
	{
		$ch = curl_init(self::API . $path);
		$options = [
			CURLOPT_CUSTOMREQUEST => $method,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_TIMEOUT => 10,
			CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/json'],
		];
		if ($payload !== null) {
			$options[CURLOPT_POSTFIELDS] = json_encode($payload);
		}
		curl_setopt_array($ch, $options);
		$body = curl_exec($ch);
		$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$error = curl_error($ch);
		$data = is_string($body) ? json_decode($body, true) : null;
		if (!is_array($data)) {
			return ['status' => $code, 'message' => $error ?: "HTTP {$code}"];
		}
		return $data;
	}

	private function local_number($mobile)
	{
		$digits = preg_replace('/\D/', '', (string) $mobile);
		if (strlen($digits) === 12 && strpos($digits, '63') === 0) {
			return '0' . substr($digits, 2);
		}
		if (strlen($digits) === 10 && $digits[0] === '9') {
			return '0' . $digits;
		}
		return $digits;
	}
}
