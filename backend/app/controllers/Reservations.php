<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Reservations extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
	}

	public function index()
	{
		$this->api->require_role('staff', 'admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function show($id)
	{
		$this->api->require_role('staff', 'admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function update($id)
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function status($id)
	{
		$this->api->require_role('staff', 'admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function store()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function find()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function by_code($code)
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function cancel($code)
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function reschedule($code)
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function deposit($code)
	{
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
