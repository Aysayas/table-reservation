<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Cloudinary {
	private $cloud;
	private $key;
	private $secret;

	public function __construct()
	{
		$this->cloud = trim(getenv('CLOUDINARY_CLOUD_NAME') ?: '');
		$this->key = trim(getenv('CLOUDINARY_API_KEY') ?: '');
		$this->secret = trim(getenv('CLOUDINARY_API_SECRET') ?: '');
	}

	public function store($path, $folder)
	{
		if ($this->cloud === '' || $this->key === '' || $this->secret === '') {
			return null;
		}
		try {
			$body = $this->post('upload', ['folder' => "vencios-garden/{$folder}"], ['file' => new CURLFile($path)]);
		} finally {
			@unlink($path);
		}
		if (empty($body['secure_url'])) {
			throw new RuntimeException('Cloudinary did not return a URL');
		}
		return $body['secure_url'];
	}

	public function check()
	{
		if ($this->cloud === '' || $this->key === '' || $this->secret === '') {
			return ['status' => 'fake', 'detail' => ['message' => 'Cloudinary keys are empty, so photos are saved in public/uploads']];
		}
		$curl = curl_init("https://api.cloudinary.com/v1_1/{$this->cloud}/usage");
		curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_USERPWD => "{$this->key}:{$this->secret}"]);
		$raw = curl_exec($curl);
		$code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
		curl_close($curl);
		$body = json_decode((string) $raw, true) ?: [];
		if ($code !== 200) {
			throw new RuntimeException("Cloudinary answered HTTP {$code}: " . ($body['error']['message'] ?? 'no details'));
		}
		return ['status' => 'ok', 'detail' => [
			'cloud' => $this->cloud,
			'plan' => $body['plan'] ?? null,
			'resources' => $body['resources'] ?? null,
			'storage_mb' => isset($body['storage']['usage']) ? round($body['storage']['usage'] / 1048576, 2) : null,
		]];
	}

	public function delete($url)
	{
		$prefix = "https://res.cloudinary.com/{$this->cloud}/image/upload/";
		if ($this->secret === '' || !is_string($url) || !str_starts_with($url, $prefix)) {
			return false;
		}
		$public_id = preg_replace(['#^v\d+/#', '#\.[a-z0-9]+$#i'], '', substr($url, strlen($prefix)));
		try {
			return ($this->post('destroy', ['public_id' => $public_id])['result'] ?? '') === 'ok';
		} catch (RuntimeException $e) {
			error_log("Cloudinary could not delete {$public_id}");
			return false;
		}
	}

	private function post($action, $params, $files = [])
	{
		$params['timestamp'] = time();
		ksort($params);
		$params['signature'] = sha1(urldecode(http_build_query($params)) . $this->secret);
		$params['api_key'] = $this->key;

		$curl = curl_init("https://api.cloudinary.com/v1_1/{$this->cloud}/image/{$action}");
		curl_setopt_array($curl, [
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_TIMEOUT => 30,
			CURLOPT_POSTFIELDS => $params + $files,
		]);
		$raw = curl_exec($curl);
		$code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
		curl_close($curl);
		if ($raw === false || $code >= 400) {
			error_log("Cloudinary {$action} failed: HTTP {$code} " . substr((string) $raw, 0, 300));
			throw new RuntimeException('Cloudinary request failed');
		}
		return json_decode($raw, true) ?: [];
	}
}
