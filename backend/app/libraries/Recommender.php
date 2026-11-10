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

	public function check()
	{
		if ($this->url === '' || $this->secret === '') {
			return ['status' => 'fake', 'detail' => ['message' => 'RECOMMENDER_URL or RECOMMENDER_SECRET is empty, so best sellers are used']];
		}
		$curl = curl_init($this->url . '/health');
		curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60]);
		$health = json_decode((string) curl_exec($curl), true);
		$code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
		curl_close($curl);
		if ($code !== 200 || ($health['status'] ?? '') !== 'ok') {
			throw new RuntimeException("The recommender's /health answered HTTP {$code}");
		}
		$result = $this->recommend([], 3);
		if (!$result) {
			throw new RuntimeException('The recommender is up, but /recommend failed (check RECOMMENDER_SECRET and its database settings)');
		}
		return ['status' => 'ok', 'detail' => ['url' => $this->url, 'source' => $result['source'], 'item_ids' => $result['item_ids']]];
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
		$item_ids = array_map('intval', $body['item_ids']);
		$reasons = is_array($body['reasons'] ?? null) ? $body['reasons'] : [];
		$by_item = [];
		foreach ($item_ids as $i => $id) {
			$by_item[$id] = $reasons[$i] ?? null;
		}
		return ['item_ids' => $item_ids, 'source' => (string) ($body['source'] ?? ''), 'reasons' => $by_item];
	}
}
