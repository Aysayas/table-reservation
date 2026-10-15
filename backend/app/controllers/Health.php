<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

/**
 * GET /health - liveness and database check for Docker and Render.
 * A database failure ends in the JSON 500 from app/kernel/MY_Errors.php
 * (outside development).
 */
class Health extends Controller {
	public function index() {
		$this->call->library('api');
		$this->call->database();
		$this->db->raw('SELECT 1');

		$this->api->respond(['status' => 'ok', 'db' => 'ok']);
	}
}
?>
