<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Settings extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
	}

	public function show()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function update()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function logo()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function hours()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function update_hours()
	{
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
