<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Auth extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
	}

	public function login()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function refresh()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function logout()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function me()
	{
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
