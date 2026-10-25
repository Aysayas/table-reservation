<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Categories extends Controller {
	private $counts;

	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Category_model', 'Menu_item_model']);
	}

	public function index()
	{
		$this->api->respond(['data' => array_map([$this, 'format'], $this->Category_model->order_by('sort_order'))]);
	}

	public function store()
	{
		$this->api->require_role('admin');
		$input = $this->validate();
		if ($input['sort_order'] === null) {
			$input['sort_order'] = (int) max(array_column($this->Category_model->all(), 'sort_order') ?: [0]) + 1;
		}

		$id = $this->Category_model->insert($input);
		$this->api->respond(['data' => $this->format($this->Category_model->find($id))], 201);
	}

	public function update($id)
	{
		$this->api->require_role('admin');
		$category = $this->Category_model->find($id);
		if (!$category) {
			$this->api->respond_error('Category not found', 404);
		}

		$input = $this->validate((int) $id);
		$this->Category_model->update($id, array_filter($input, fn($value) => $value !== null));
		$this->api->respond(['data' => $this->format($this->Category_model->find($id))]);
	}

	public function destroy($id)
	{
		$this->api->require_role('admin');
		if (!$this->Category_model->find($id)) {
			$this->api->respond_error('Category not found', 404);
		}

		$items = (int) $this->Menu_item_model->filter(['category_id' => $id])->count();
		if ($items) {
			$this->api->respond_error("This category has {$items} menu item(s); move or delete them first", 409);
		}

		$this->Category_model->delete($id);
		$this->api->respond(['data' => ['message' => 'Deleted']]);
	}

	private function validate($except_id = null)
	{
		$input = $this->api->body();
		$name = is_string($input['name'] ?? null) ? trim($input['name']) : '';
		$sort_order = $input['sort_order'] ?? null;

		$errors = [];
		if ($name === '' || mb_strlen($name) > 50) {
			$errors[] = '"name" is required, up to 50 characters.';
		} else {
			$query = $this->Category_model->filter(['name' => $name]);
			if ($except_id !== null) {
				$query->not_where('category_id', $except_id);
			}
			if ($query->count()) {
				$errors[] = 'A category with that name already exists.';
			}
		}
		if ($sort_order !== null && (!is_int($sort_order) || $sort_order < 0)) {
			$errors[] = '"sort_order" must be a whole number, 0 or more.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		return ['name' => $name, 'sort_order' => $sort_order];
	}

	private function format($category)
	{
		$category['category_id'] = (int) $category['category_id'];
		$category['sort_order'] = (int) $category['sort_order'];
		$category['item_count'] = $this->item_counts()[$category['category_id']] ?? 0;
		return $category;
	}

	private function item_counts()
	{
		if ($this->counts === null) {
			$rows = $this->db->raw('SELECT category_id, COUNT(*) AS items FROM menu_items GROUP BY category_id')->fetchAll(PDO::FETCH_ASSOC);
			$this->counts = array_map('intval', array_column($rows, 'items', 'category_id'));
		}
		return $this->counts;
	}
}
?>
