<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Recommender {
	private $url;
	private $secret;

	public function __construct()
	{
		$this->url = rtrim(getenv('RECOMMENDER_URL') ?: '', '/');
		$this->secret = trim(getenv('RECOMMENDER_SECRET') ?: '');
	}

	public function recommend($item_ids, $limit)
	{
		if ($this->url === '' || $this->secret === '') {
			return null;
		}
		$curl = curl_init($this->url . '/recommend');
		curl_setopt_array($curl, [
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_CONNECTTIMEOUT => 2,
			CURLOPT_TIMEOUT => 2,
			CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Recommender-Secret: ' . $this->secret],
			CURLOPT_POSTFIELDS => json_encode(['item_ids' => $item_ids, 'limit' => $limit]),
		]);
		$raw = curl_exec($curl);
		$code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
		curl_close($curl);

		$body = $code === 200 ? json_decode((string) $raw, true) : null;
		if (!is_array($body['item_ids'] ?? null)) {
			error_log("Recommender unavailable (HTTP {$code}), using the fallback");
			return null;
		}
		return ['item_ids' => array_map('intval', $body['item_ids']), 'source' => (string) ($body['source'] ?? '')];
	}
}
