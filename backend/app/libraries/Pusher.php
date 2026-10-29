<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Pusher {
	const STAFF_CHANNEL = 'private-orders';

	private $_lava;
	private $app_id;
	private $key;
	private $secret;
	private $cluster;

	public function __construct()
	{
		$this->_lava = lava_instance();
		$this->app_id = trim(getenv('PUSHER_APP_ID') ?: '');
		$this->key = trim(getenv('PUSHER_KEY') ?: '');
		$this->secret = trim(getenv('PUSHER_SECRET') ?: '');
		$this->cluster = trim(getenv('PUSHER_CLUSTER') ?: '');
	}

	public function enabled()
	{
		return $this->app_id !== '' && $this->key !== '' && $this->secret !== '' && $this->cluster !== '';
	}

	public function table_channel($qr_token)
	{
		return 'order-status-' . substr(hash('sha256', (string) $qr_token), 0, 32);
	}

	public function order_changed($order_id, $event)
	{
		$this->_lava->call->model(['Order_model', 'Table_model']);
		$order = $this->_lava->Order_model->find($order_id);
		$table = $order ? $this->_lava->Table_model->find($order['table_id']) : null;
		if (!$table) {
			return;
		}
		$data = ['order_id' => (int) $order['order_id'], 'status' => $order['status'], 'payment_status' => $order['payment_status']];
		$this->trigger([self::STAFF_CHANNEL, $this->table_channel($table['qr_token'])], $event, $data);
	}

	public function check()
	{
		if (!$this->enabled()) {
			return ['status' => 'fake', 'detail' => ['message' => 'Pusher keys are empty, so events are only logged']];
		}
		$path = "/apps/{$this->app_id}/channels";
		$query = 'auth_key=' . $this->key . '&auth_timestamp=' . time() . '&auth_version=1.0';
		$query .= '&auth_signature=' . hash_hmac('sha256', "GET\n{$path}\n{$query}", $this->secret);

		$curl = curl_init("https://api-{$this->cluster}.pusher.com{$path}?{$query}");
		curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
		$raw = curl_exec($curl);
		$code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
		curl_close($curl);
		if ($code !== 200) {
			throw new RuntimeException("Pusher answered HTTP {$code}: " . substr((string) $raw, 0, 200));
		}
		$channels = json_decode((string) $raw, true)['channels'] ?? [];
		return ['status' => 'ok', 'detail' => ['cluster' => $this->cluster, 'channels_in_use' => count($channels)]];
	}

	public function authorize($socket_id, $channel)
	{
		return ['auth' => $this->key . ':' . hash_hmac('sha256', "{$socket_id}:{$channel}", $this->secret)];
	}

	private function trigger($channels, $event, $data)
	{
		if (!$this->enabled()) {
			error_log("Pusher (fake mode) {$event} " . json_encode($data));
			return;
		}
		$path = "/apps/{$this->app_id}/events";
		$body = json_encode(['name' => $event, 'channels' => $channels, 'data' => json_encode($data)]);
		$query = 'auth_key=' . $this->key . '&auth_timestamp=' . time() . '&auth_version=1.0&body_md5=' . md5($body);
		$query .= '&auth_signature=' . hash_hmac('sha256', "POST\n{$path}\n{$query}", $this->secret);

		$curl = curl_init("https://api-{$this->cluster}.pusher.com{$path}?{$query}");
		curl_setopt_array($curl, [
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_TIMEOUT => 3,
			CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
			CURLOPT_POSTFIELDS => $body,
		]);
		$raw = curl_exec($curl);
		$code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
		curl_close($curl);
		if ($raw === false || $code >= 400) {
			error_log("Pusher {$event} failed: HTTP {$code} " . substr((string) $raw, 0, 200));
		}
	}
}
