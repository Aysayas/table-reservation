<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Orders extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Order_model', 'Order_item_model', 'Menu_item_model', 'Table_model']);
	}

	public function index()
	{
		$this->api->require_role('staff', 'kitchen', 'admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function show($id)
	{
		$this->api->rate_limit('order_view_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 60, 60);
		$order = $this->Order_model->find($id);
		$token = $this->api->get_query_params()['qr_token'] ?? '';

		if (!$order || !$this->token_matches($order['table_id'], $token)) {
			$this->api->respond_error('Order not found', 404);
		}

		$this->api->respond(['data' => $this->format($order)]);
	}

	public function store()
	{
		$this->api->rate_limit('order_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 10, 60);
		$input = $this->api->body();
		$errors = [];

		$table_id = $input['table_id'] ?? null;
		if (!is_int($table_id) && !(is_string($table_id) && ctype_digit($table_id))) {
			$errors[] = '"table_id" must be a number.';
		}

		$name = $input['customer_name'] ?? null;
		if ($name !== null && (!is_string($name) || mb_strlen(trim($name)) > 60)) {
			$errors[] = '"customer_name" must be text of at most 60 characters.';
		}

		$lines = $input['items'] ?? null;
		if (!is_array($lines) || !$lines || !array_is_list($lines) || count($lines) > 50) {
			$errors[] = '"items" must be a list of 1 to 50 items.';
			$lines = [];
		}

		foreach ($lines as $i => $line) {
			if (!is_array($line)) {
				$errors[] = "\"items[{$i}]\" must be an object.";
				continue;
			}
			$item_id = $line['item_id'] ?? null;
			$quantity = $line['quantity'] ?? null;
			$notes = $line['notes'] ?? null;
			if (!is_int($item_id) || $item_id < 1) {
				$errors[] = "\"items[{$i}].item_id\" must be a number.";
			}
			if (!is_int($quantity) || $quantity < 1 || $quantity > 99) {
				$errors[] = "\"items[{$i}].quantity\" must be a whole number from 1 to 99.";
			}
			if ($notes !== null && (!is_string($notes) || mb_strlen($notes) > 255)) {
				$errors[] = "\"items[{$i}].notes\" must be text of at most 255 characters.";
			}
		}

		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		if (!$this->token_matches($table_id, $input['qr_token'] ?? '')) {
			$this->api->respond_error('This QR code is not valid for that table', 403);
		}

		$ids = array_values(array_unique(array_column($lines, 'item_id')));
		$menu = array_column($this->Menu_item_model->query()->in('item_id', $ids)->get_all(), null, 'item_id');
		foreach ($ids as $item_id) {
			if (!isset($menu[$item_id])) {
				$errors[] = "Menu item {$item_id} does not exist.";
			} elseif (!$menu[$item_id]['is_available']) {
				$errors[] = "\"{$menu[$item_id]['name']}\" is not available right now.";
			}
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		$total = 0.0;
		foreach ($lines as $line) {
			$total += (float) $menu[$line['item_id']]['price'] * $line['quantity'];
		}

		$this->Order_model->transaction();
		try {
			$id = $this->Order_model->insert([
				'table_id' => (int) $table_id,
				'customer_name' => $name !== null && trim($name) !== '' ? trim($name) : null,
				'status' => 'received',
				'total_amount' => number_format($total, 2, '.', ''),
				'payment_status' => 'unpaid',
			]);
			foreach ($lines as $line) {
				$this->Order_item_model->insert([
					'order_id' => $id,
					'item_id' => $line['item_id'],
					'quantity' => $line['quantity'],
					'unit_price' => $menu[$line['item_id']]['price'],
					'notes' => isset($line['notes']) && trim($line['notes']) !== '' ? trim($line['notes']) : null,
				]);
			}
			$this->Order_model->commit();
		} catch (Throwable $e) {
			$this->Order_model->rollback();
			$this->api->respond_error('Could not save the order', 500);
		}

		$this->api->respond(['data' => $this->format($this->Order_model->find($id))], 201);
	}

	public function status($id)
	{
		$this->api->require_role('staff', 'kitchen', 'admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function pay($id)
	{
		$this->api->respond_error('Not implemented', 501);
	}

	private function token_matches($table_id, $token)
	{
		$table = $this->Table_model->find((int) $table_id);
		return $table && is_string($token) && $token !== '' && hash_equals($table['qr_token'], $token);
	}

	private function format($order)
	{
		$table = $this->Table_model->find($order['table_id']);
		$items = $this->Order_item_model->find_all_by('order_id', $order['order_id']);
		$names = array_column($this->Menu_item_model->query()->in('item_id', array_column($items, 'item_id') ?: [0])->get_all(), 'name', 'item_id');

		$order['order_id'] = (int) $order['order_id'];
		$order['table_id'] = (int) $order['table_id'];
		$order['customer_id'] = $order['customer_id'] !== null ? (int) $order['customer_id'] : null;
		$order['total_amount'] = (float) $order['total_amount'];
		$order['table_number'] = $table['table_number'] ?? null;
		$order['items'] = array_map(fn($item) => [
			'order_item_id' => (int) $item['order_item_id'],
			'order_id' => (int) $item['order_id'],
			'item_id' => (int) $item['item_id'],
			'name' => $names[$item['item_id']] ?? null,
			'quantity' => (int) $item['quantity'],
			'unit_price' => (float) $item['unit_price'],
			'notes' => $item['notes'],
		], $items);
		return $order;
	}
}
?>
