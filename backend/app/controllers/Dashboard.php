<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Dashboard extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
	}

	public function staff()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function admin()
	{
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
