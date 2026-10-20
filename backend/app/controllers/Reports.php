<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Reports extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
	}

	public function index()
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
