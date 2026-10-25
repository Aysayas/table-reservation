<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Realtime extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->library('pusher');
	}

	public function auth()
	{
		$this->api->require_role('staff', 'kitchen', 'admin');
		$input = $this->api->body();
		$socket_id = is_string($input['socket_id'] ?? null) ? $input['socket_id'] : '';
		$channel = is_string($input['channel_name'] ?? null) ? $input['channel_name'] : '';

		if (!preg_match('/^\d+\.\d+$/', $socket_id) || $channel !== Pusher::STAFF_CHANNEL) {
			$this->api->respond_error('Not allowed', 403);
		}
		if (!$this->pusher->enabled()) {
			$this->api->respond_error('Real-time is not set up', 503);
		}
		$this->api->respond($this->pusher->authorize($socket_id, $channel));
	}
}
?>
