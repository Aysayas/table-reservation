<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Paymongo {
	private $_lava;
	private $secret_key;
	private $webhook_secret;
	private $methods = ['gcash', 'paymaya', 'card'];

	public function __construct()
	{
		$this->_lava = lava_instance();
		$this->secret_key = getenv('PAYMONGO_SECRET_KEY') ?: '';
		$this->webhook_secret = getenv('PAYMONGO_WEBHOOK_SECRET') ?: '';
	}

	public function frontend_url($path)
	{
		return rtrim(getenv('FRONTEND_URL') ?: 'http://localhost:5173', '/') . $path;
	}

	public function start($target, $id, $due, $name, $reference, $success_url, $cancel_url)
	{
		$payments = $this->_lava->Payment_model;
		$cents = (int) round($due * 100);

		foreach ($payments->query()->where([$target => $id, 'method' => 'online', 'status' => 'pending'])->get_all() as $old) {
			$session = (int) round((float) $old['amount'] * 100) === $cents ? $this->get_session($old['provider_reference']) : null;
			if ($session && $session['status'] === 'active') {
				return ['payment_id' => (int) $old['payment_id'], 'checkout_url' => $session['checkout_url']];
			}
			$payments->update_where(['payment_id' => $old['payment_id'], 'status' => 'pending'], ['status' => 'failed']);
			if ($session) {
				$this->expire_session($old['provider_reference']);
			}
		}

		$session = $this->create_session($cents, $name, $reference, $success_url, $cancel_url);
		$payment_id = $payments->insert([
			$target => $id,
			'method' => 'online',
			'provider_reference' => $session['id'],
			'amount' => number_format($due, 2, '.', ''),
			'status' => 'pending',
		]);
		return ['payment_id' => (int) $payment_id, 'checkout_url' => $session['checkout_url']];
	}

	public function verify($header, $raw)
	{
		if ($this->webhook_secret === '' || !is_string($header)) {
			return false;
		}
		$parts = [];
		foreach (explode(',', $header) as $pair) {
			[$key, $value] = array_pad(explode('=', trim($pair), 2), 2, '');
			$parts[$key] = $value;
		}
		$event = json_decode($raw, true);
		$signature = ($event['data']['attributes']['livemode'] ?? false) ? ($parts['li'] ?? '') : ($parts['te'] ?? '');
		if (($parts['t'] ?? '') === '' || $signature === '') {
			return false;
		}
		return hash_equals(hash_hmac('sha256', $parts['t'] . '.' . $raw, $this->webhook_secret), $signature);
	}

	private function create_session($cents, $name, $reference, $success_url, $cancel_url)
	{
		if ($this->secret_key === '') {
			return ['id' => 'cs_fake_' . bin2hex(random_bytes(12)), 'checkout_url' => $success_url];
		}
		$response = $this->request('POST', '/checkout_sessions', ['data' => ['attributes' => [
			'line_items' => [['amount' => $cents, 'currency' => 'PHP', 'name' => $name, 'quantity' => 1]],
			'payment_method_types' => $this->methods,
			'reference_number' => $reference,
			'description' => $name,
			'success_url' => $success_url,
			'cancel_url' => $cancel_url,
		]]]);
		if (empty($response['data']['id']) || empty($response['data']['attributes']['checkout_url'])) {
			throw new RuntimeException('PayMongo did not return a checkout session');
		}
		return ['id' => $response['data']['id'], 'checkout_url' => $response['data']['attributes']['checkout_url']];
	}

	private function get_session($id)
	{
		if ($this->secret_key === '' || !is_string($id) || $id === '') {
			return null;
		}
		$response = $this->request('GET', '/checkout_sessions/' . rawurlencode($id));
		$attributes = $response['data']['attributes'] ?? null;
		return $attributes ? ['status' => $attributes['status'] ?? '', 'checkout_url' => $attributes['checkout_url'] ?? ''] : null;
	}

	private function expire_session($id)
	{
		try {
			$this->request('POST', '/checkout_sessions/' . rawurlencode($id) . '/expire');
		} catch (RuntimeException $e) {
			error_log("PayMongo could not expire {$id}");
		}
	}

	private function request($method, $path, $body = null)
	{
		$curl = curl_init('https://api.paymongo.com/v1' . $path);
		curl_setopt_array($curl, [
			CURLOPT_CUSTOMREQUEST => $method,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_TIMEOUT => 15,
			CURLOPT_USERPWD => $this->secret_key . ':',
			CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
		]);
		if ($body !== null) {
			curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body));
		}
		$raw = curl_exec($curl);
		$code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
		$error = curl_error($curl);
		curl_close($curl);
		if ($raw === false || $code >= 400) {
			error_log("PayMongo {$method} {$path} failed: HTTP {$code} {$error} " . substr((string) $raw, 0, 300));
			throw new RuntimeException('PayMongo request failed');
		}
		return json_decode($raw, true) ?: [];
	}
}
