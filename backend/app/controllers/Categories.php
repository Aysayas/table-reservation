<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Categories extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model('Category_model');
	}

	public function index()
	{
		$this->api->respond(['data' => $this->Category_model->order_by('sort_order')]);
	}

	public function store()
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function update($id)
	{
		$this->api->respond_error('Not implemented', 501);
	}

	public function destroy($id)
	{
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
