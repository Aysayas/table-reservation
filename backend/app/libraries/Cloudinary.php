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

	public function delete($url)
	{
		$prefix = "https://res.cloudinary.com/{$this->cloud}/image/upload/";
		if ($this->secret === '' || !is_string($url) || !str_starts_with($url, $prefix)) {
			return;
		}
		$public_id = preg_replace(['#^v\d+/#', '#\.[a-z0-9]+$#i'], '', substr($url, strlen($prefix)));
		try {
			$this->post('destroy', ['public_id' => $public_id]);
		} catch (RuntimeException $e) {
			error_log("Cloudinary could not delete {$public_id}");
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
