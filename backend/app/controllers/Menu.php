<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Menu extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model('Menu_item_model');
	}

	public function index()
	{
		$query = $this->api->get_query_params();
		$conditions = [];

		foreach (['category_id', 'is_available'] as $field) {
			if (!isset($query[$field]) || $query[$field] === '') {
				continue;
			}
			if (!ctype_digit((string) $query[$field])) {
				$this->api->respond_error("Invalid {$field}", 422);
			}
			$conditions[$field] = (int) $query[$field];
		}

		$items = $conditions
			? $this->Menu_item_model->filter($conditions)->get_all()
			: $this->Menu_item_model->all();

		$this->api->respond(['data' => array_map([$this, 'format'], $items)]);
	}

	public function show($id)
	{
		$item = $this->Menu_item_model->find($id);
		if (!$item) {
			$this->api->respond_error('Menu item not found', 404);
		}

		$this->api->respond(['data' => $this->format($item)]);
	}

	private function format($item)
	{
		$item['price'] = (float) $item['price'];
		$item['is_available'] = (bool) $item['is_available'];
		return $item;
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

	public function availability($id)
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function image($id)
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function destroy($id)
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
