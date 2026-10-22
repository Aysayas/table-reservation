<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Tables extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model('Table_model');
	}

	public function index()
	{
		$this->api->require_role('staff', 'admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function show($id)
	{
		$table = $this->Table_model->find($id);
		if (!$table) {
			$this->api->respond_error('Table not found', 404);
		}

		$this->api->respond(['data' => [
			'table_id' => (int) $table['table_id'],
			'table_number' => $table['table_number'],
			'capacity' => (int) $table['capacity'],
			'status' => $table['status'],
		]]);
	}

	public function store()
	{
		$this->api->require_role('admin');
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

	public function destroy($id)
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
