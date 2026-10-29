<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Orders extends Controller {
	private $statuses = ['received', 'preparing', 'ready', 'served'];
	private $per_page = 8;

	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Order_model', 'Order_item_model', 'Menu_item_model', 'Table_model', 'Setting_model', 'Payment_model']);
		$this->call->library('pusher');
	}

	public function index()
	{
		$this->api->require_role('staff', 'kitchen', 'admin');
		$query = $this->api->get_query_params();
		$errors = [];

		$table_id = $query['table_id'] ?? '';
		if ($table_id !== '' && !(is_string($table_id) && ctype_digit($table_id))) {
			$errors[] = '"table_id" must be a number.';
		}
		$status = $query['status'] ?? '';
		$statuses = is_string($status) && $status !== '' ? explode(',', $status) : [];
		if (!is_string($status) || array_diff($statuses, $this->statuses)) {
			$errors[] = '"status" must be a comma list of ' . implode(', ', $this->statuses) . '.';
		}
		$payment = $query['payment_status'] ?? '';
		if ($payment !== '' && !in_array($payment, ['unpaid', 'paid'], true)) {
			$errors[] = '"payment_status" must be unpaid or paid.';
		}
		foreach (['date_from', 'date_to'] as $field) {
			$value = $query[$field] ?? '';
			$date = is_string($value) ? DateTime::createFromFormat('!Y-m-d', $value) : false;
			if ($value !== '' && (!$date || $date->format('Y-m-d') !== $value)) {
				$errors[] = "\"{$field}\" must be a date (YYYY-MM-DD).";
			}
		}
		$page = $query['page'] ?? null;
		if ($page !== null && !(is_string($page) && ctype_digit($page) && (int) $page >= 1)) {
			$errors[] = '"page" must be 1 or more.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		$search = is_string($query['search'] ?? null) ? trim(ltrim(trim($query['search']), '#')) : '';
		$search_tables = $search !== ''
			? array_column($this->Table_model->query()->like('table_number', "%{$search}%")->get_all(), 'table_id')
			: [];
		$build = function () use ($table_id, $statuses, $payment, $query, $search, $search_tables) {
			$orders = $this->Order_model->query();
			if ($table_id !== '') {
				$orders->where('table_id', (int) $table_id);
			}
			if ($statuses) {
				$orders->in('status', $statuses);
			}
			if ($payment !== '') {
				$orders->where('payment_status', $payment);
			}
			if (!empty($query['date_from'])) {
				$orders->where('created_at', '>=', $query['date_from'] . ' 00:00:00');
			}
			if (!empty($query['date_to'])) {
				$orders->where('created_at', '<', date('Y-m-d', strtotime($query['date_to'] . ' +1 day')) . ' 00:00:00');
			}
			if ($search !== '') {
				$orders->grouped(function ($group) use ($search, $search_tables) {
					$group->where('order_id', ctype_digit($search) ? (int) $search : 0);
					if ($search_tables) {
						$group->or_in('table_id', $search_tables);
					}
				});
			}
			return $orders->order_by('order_id', 'DESC');
		};

		if ($page === null) {
			// shortcut: without "page" every matching order is returned (kitchen and staff lists); pass "page" for long histories
			$this->api->respond(['data' => array_map([$this, 'format'], $build()->get_all())]);
		}

		$total = (int) $build()->count();
		$rows = $build()->pagination($this->per_page, (int) $page)->get_all();
		$this->api->respond([
			'data' => array_map([$this, 'format'], $rows),
			'meta' => ['total' => $total, 'page' => (int) $page, 'per_page' => $this->per_page],
		]);
	}

	public function show($id)
	{
		$this->api->rate_limit('order_view_' . $this->api->client_ip(), 60, 60);
		$order = $this->Order_model->find($id);
		$token = $this->api->get_query_params()['qr_token'] ?? '';

		if (!$order || !$this->token_matches($order['table_id'], $token)) {
			$this->api->respond_error('Order not found', 404);
		}

		$this->api->respond(['data' => $this->format($order)]);
	}

	public function store()
	{
		$this->api->rate_limit('order_' . $this->api->client_ip(), 10, 60);
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

		$subtotal = 0.0;
		foreach ($lines as $line) {
			$subtotal += (float) $menu[$line['item_id']]['price'] * $line['quantity'];
		}
		$settings = $this->Setting_model->all();
		$rate = $settings ? (float) $settings[0]['service_charge_percent'] : 0.0;
		$total = round(round($subtotal, 2) * (1 + $rate / 100), 2);

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

		$this->Table_model->occupy($table_id);
		$this->pusher->order_changed($id, 'order.created');
		$this->api->respond(['data' => $this->format($this->Order_model->find($id))], 201);
	}

	public function status($id)
	{
		$this->api->require_role('staff', 'kitchen', 'admin');
		$order = $this->Order_model->find($id);
		if (!$order) {
			$this->api->respond_error('Order not found', 404);
		}

		$status = $this->api->body()['status'] ?? null;
		if (!in_array($status, $this->statuses, true)) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['"status" must be one of ' . implode(', ', $this->statuses) . '.']], 422);
		}

		$next = $this->statuses[array_search($order['status'], $this->statuses, true) + 1] ?? null;
		if ($status !== $next) {
			$this->api->respond_error($next ? "A {$order['status']} order can only become {$next}" : 'This order is already served', 409);
		}

		$this->Order_model->update($id, ['status' => $status]);
		if ($status === 'served') {
			$this->Table_model->free_if_idle($order['table_id']);
		}
		$this->pusher->order_changed($id, 'order.status');
		$this->api->respond(['data' => $this->format($this->Order_model->find($id))]);
	}

	public function pay($id)
	{
		$this->api->rate_limit('order_pay_' . $this->api->client_ip(), 10, 60);
		$order = $this->Order_model->find($id);
		if (!$order || !$this->token_matches($order['table_id'], $this->api->body()['qr_token'] ?? '')) {
			$this->api->respond_error('Order not found', 404);
		}
		if ($order['payment_status'] === 'paid') {
			$this->api->respond_error('This is already paid', 409);
		}
		$due = (float) $order['total_amount'];
		if ($due <= 0) {
			$this->api->respond_error('There is nothing to pay', 409);
		}

		$this->call->library('paymongo');
		$table_id = (int) $order['table_id'];
		try {
			$checkout = $this->paymongo->start('order_id', (int) $order['order_id'], $due, "Order #{$order['order_id']}", "ORDER-{$order['order_id']}",
				$this->paymongo->frontend_url("/table/{$table_id}/orders?order={$order['order_id']}"), $this->paymongo->frontend_url("/table/{$table_id}/orders?order={$order['order_id']}"));
		} catch (RuntimeException $e) {
			$this->api->respond_error('The payment service is not available, please try again', 502);
		}
		$this->api->respond(['data' => $checkout]);
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
		$order['subtotal'] = round(array_sum(array_map(fn($item) => (float) $item['unit_price'] * (int) $item['quantity'], $items)), 2);
		$order['service_charge'] = round($order['total_amount'] - $order['subtotal'], 2);
		$order['table_number'] = $table['table_number'] ?? null;
		$order['channel'] = $table ? $this->pusher->table_channel($table['qr_token']) : null;
		$paid = $this->Payment_model->filter(['order_id' => $order['order_id'], 'status' => 'paid'])->order_by('payment_id', 'DESC')->get();
		$order['payment_method'] = $paid['method'] ?? null;
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
