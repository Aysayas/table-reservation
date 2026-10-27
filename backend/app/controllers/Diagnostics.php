<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Diagnostics extends Controller {
	private $services = ['paymongo', 'recommender', 'cloudinary', 'pusher'];

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
}
?>
