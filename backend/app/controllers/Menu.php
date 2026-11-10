<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Menu extends Controller {
	private $photo_dir = 'public/uploads/menu/';

	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Menu_item_model', 'Category_model', 'Order_item_model']);
	}

	public function index()
	{
		$query = $this->api->get_query_params();
		$conditions = [];

		foreach (['category_id', 'is_available'] as $field) {
			if (!isset($query[$field]) || $query[$field] === '') {
				continue;
			}
			if (!is_string($query[$field]) || !ctype_digit($query[$field])) {
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

	public function recommendations()
	{
		$this->api->rate_limit('reco_' . $this->api->client_ip(), 60, 60);
		$query = $this->api->get_query_params();
		$raw_ids = is_string($query['item_ids'] ?? null) ? trim($query['item_ids']) : '';
		$raw_limit = $query['limit'] ?? '4';

		$errors = [];
		$item_ids = $raw_ids === '' ? [] : explode(',', $raw_ids);
		if (count($item_ids) > 50 || array_filter($item_ids, fn($id) => !ctype_digit(trim($id)))) {
			$errors[] = '"item_ids" must be up to 50 item IDs separated by commas.';
		}
		if (!(is_string($raw_limit) && ctype_digit($raw_limit) && (int) $raw_limit >= 1 && (int) $raw_limit <= 12)) {
			$errors[] = '"limit" must be 1 to 12.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}
		$item_ids = array_values(array_unique(array_map('intval', $item_ids)));
		$limit = (int) $raw_limit;

		$this->call->library('recommender');
		$result = $this->recommender->recommend($item_ids, $limit);
		$flagged = $this->Menu_item_model->filter(['is_available' => 1, 'is_recommended' => 1])->get_all();
		$by_id = array_column(array_map([$this, 'format'], $flagged), null, 'item_id');

		$best = [];
		if ($result) {
			$picks = $result['item_ids'];
			$source = $result['source'];
		} else {
			$best = array_column($this->Order_item_model->best_sellers(date('Y-m-d', strtotime('-30 days')), date('Y-m-d'), 50), 'item_id');
			$picks = array_merge($best, array_map('intval', array_keys($by_id)));
			$source = 'fallback';
		}

		$picks = array_slice(array_values(array_unique(array_filter($picks, fn($id) => isset($by_id[$id]) && !in_array($id, $item_ids, true)))), 0, $limit);
		$reason = function ($id) use ($result, $best, $item_ids) {
			$given = $result['reasons'][$id] ?? null;
			$type = $given['type'] ?? null;
			if ($type === 'together' && in_array((int) ($given['with_item_id'] ?? 0), $item_ids, true)) {
				return ['type' => 'together', 'with_item_id' => (int) $given['with_item_id']];
			}
			if ($type === 'popular' || in_array($id, $best, true)) {
				return ['type' => 'popular'];
			}
			return ['type' => 'pick'];
		};
		$data = array_map(fn($id) => $by_id[$id] + ['reason' => $reason($id)], $picks);
		$this->api->respond(['data' => $data, 'meta' => ['source' => $source]]);
	}

	private function format($item)
	{
		$item['price'] = (float) $item['price'];
		$item['is_available'] = (bool) $item['is_available'];
		$item['is_recommended'] = (bool) $item['is_recommended'];
		return $item;
	}

	public function store()
	{
		$this->api->require_role('admin');
		$id = $this->Menu_item_model->insert($this->validate());
		$this->api->respond(['data' => $this->format($this->Menu_item_model->find($id))], 201);
	}

	public function update($id)
	{
		$this->api->require_role('admin');
		$item = $this->Menu_item_model->find($id);
		if (!$item) {
			$this->api->respond_error('Menu item not found', 404);
		}

		$this->Menu_item_model->update($id, $this->validate($item));
		$this->api->respond(['data' => $this->format($this->Menu_item_model->find($id))]);
	}

	public function availability($id)
	{
		$this->api->require_role('admin');
		if (!$this->Menu_item_model->find($id)) {
			$this->api->respond_error('Menu item not found', 404);
		}

		$available = $this->api->body()['is_available'] ?? null;
		if (!is_bool($available)) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['"is_available" must be true or false.']], 422);
		}

		$this->Menu_item_model->update($id, ['is_available' => (int) $available]);
		$this->api->respond(['data' => $this->format($this->Menu_item_model->find($id))]);
	}

	public function image($id)
	{
		$this->api->require_role('admin');
		$item = $this->Menu_item_model->find($id);
		if (!$item) {
			$this->api->respond_error('Menu item not found', 404);
		}
		if (empty($_FILES['photo'])) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['Send the photo as a multipart "photo" field.']], 422);
		}

		$this->call->library('upload', $_FILES['photo']);
		$this->upload
			->allowed_extensions(['jpg', 'jpeg', 'png'])
			->allowed_mimes(['image/jpeg', 'image/png'])
			->set_dir(ROOT_DIR . $this->photo_dir)
			->max_size(2)
			->is_image()
			->encrypt_name();

		if (!$this->upload->do_upload()) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $this->upload->get_errors()], 422);
		}

		$file = $this->upload->get_filename();
		$this->call->library('cloudinary');
		try {
			$url = $this->cloudinary->store(ROOT_DIR . $this->photo_dir . $file, 'menu') ?? '/uploads/menu/' . $file;
		} catch (RuntimeException $e) {
			$this->api->respond_error('The photo could not be stored, please try again', 502);
		}

		$this->Menu_item_model->update($id, ['image_url' => $url]);
		$this->delete_photo($item['image_url']);
		$this->api->respond(['data' => $this->format($this->Menu_item_model->find($id))]);
	}

	public function destroy($id)
	{
		$this->api->require_role('admin');
		$item = $this->Menu_item_model->find($id);
		if (!$item) {
			$this->api->respond_error('Menu item not found', 404);
		}
		if ($this->Order_item_model->exists(['item_id' => $id])) {
			$this->api->respond_error('This item has orders; mark it unavailable instead', 409);
		}

		$this->Menu_item_model->delete($id);
		$this->delete_photo($item['image_url']);
		$this->api->respond(['data' => ['message' => 'Deleted']]);
	}

	private function validate($current = null)
	{
		$input = $this->api->body();
		$category_id = $input['category_id'] ?? null;
		$name = is_string($input['name'] ?? null) ? trim($input['name']) : '';
		$price = $input['price'] ?? null;
		$description = $input['description'] ?? null;

		$errors = [];
		if (!is_int($category_id) || !$this->Category_model->find($category_id)) {
			$errors[] = '"category_id" must be an existing category.';
		}
		if ($name === '' || mb_strlen($name) > 100) {
			$errors[] = '"name" is required, up to 100 characters.';
		}
		if ((!is_int($price) && !is_float($price)) || $price < 0 || $price > 99999999.99) {
			$errors[] = '"price" must be a number from 0 to 99999999.99.';
		}
		if ($description !== null && (!is_string($description) || mb_strlen($description) > 1000)) {
			$errors[] = '"description" must be text of at most 1000 characters.';
		}
		foreach (['is_available', 'is_recommended'] as $field) {
			if (array_key_exists($field, $input) && !is_bool($input[$field])) {
				$errors[] = "\"{$field}\" must be true or false.";
			}
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		return [
			'category_id' => $category_id,
			'name' => $name,
			'price' => number_format($price, 2, '.', ''),
			'description' => is_string($description) && trim($description) !== '' ? trim($description) : null,
			'is_available' => (int) ($input['is_available'] ?? ($current ? (bool) $current['is_available'] : true)),
			'is_recommended' => (int) ($input['is_recommended'] ?? ($current ? (bool) $current['is_recommended'] : true)),
		];
	}

	private function delete_photo($url)
	{
		if (is_string($url) && str_starts_with($url, '/uploads/menu/')) {
			@unlink(ROOT_DIR . $this->photo_dir . basename($url));
		}
		$this->call->library('cloudinary');
		$this->cloudinary->delete($url);
	}
}
?>
