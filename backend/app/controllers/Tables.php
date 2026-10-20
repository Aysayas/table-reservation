<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Tables extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
	}

	public function index()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function show($id)
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function store()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function update($id)
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function status($id)
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function destroy($id)
	{
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
