<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Dbtest extends Controller {
	private $cases = [
		'User_model' => [
			'create' => ['full_name' => 'Test User', 'email' => 'test-user@placeholder-domain.com', 'password_hash' => 'x', 'role' => 'staff'],
			'update' => ['role' => 'kitchen'],
		],
		'Customer_model' => [
			'create' => ['full_name' => 'Test Customer', 'mobile_number' => '09111111111'],
			'update' => ['email' => 'test-customer@placeholder-domain.com'],
		],
		'Table_model' => [
			'create' => ['table_number' => 'TEST', 'capacity' => 4, 'qr_token' => 'test-qr-token'],
			'update' => ['status' => 'occupied'],
		],
		'Category_model' => [
			'create' => ['name' => 'Test Category', 'sort_order' => 99],
			'update' => ['name' => 'Test Category Renamed'],
		],
		'Menu_item_model' => [
			'create' => ['category_id' => 1, 'name' => 'Test Item', 'price' => '0.00'],
			'update' => ['is_available' => 0],
		],
		'Reservation_model' => [
			'create' => ['customer_id' => 1, 'reference_code' => 'RSV-TEST01', 'reservation_date' => '2026-01-02', 'reservation_time' => '18:00:00', 'pax' => 2],
			'update' => ['status' => 'confirmed'],
		],
		'Order_model' => [
			'create' => ['table_id' => 1],
			'update' => ['status' => 'preparing'],
		],
		'Order_item_model' => [
			'create' => ['order_id' => 1, 'item_id' => 1, 'quantity' => 1, 'unit_price' => '0.00'],
			'update' => ['quantity' => 3],
		],
		'Payment_model' => [
			'create' => ['order_id' => 1, 'method' => 'cash', 'amount' => '0.00'],
			'update' => ['status' => 'paid'],
		],
		'Notification_model' => [
			'create' => ['customer_id' => 1, 'message' => 'Test message', 'status' => 'sent'],
			'update' => ['status' => 'failed'],
		],
		'Setting_model' => [
			'create' => ['restaurant_name' => 'Test Restaurant'],
			'update' => ['address' => 'Test Address'],
		],
		'Opening_hour_model' => [
			'key' => 6,
			'create' => ['day_of_week' => 6, 'open_time' => '09:00:00', 'close_time' => '17:00:00'],
			'update' => ['is_open' => 0],
		],
	];

	public function __construct()
	{
		parent::__construct();

		if (strtolower((string) config_item('environment')) !== 'development') {
			show_404();
		}

		$this->call->database();
		$this->call->helper('debug');
		$this->call->model(array_keys($this->cases));
	}

	public function index()
	{
		echo '<h1 style="font-family:sans-serif">Database read</h1>';
		foreach (array_keys($this->cases) as $model) {
			ddt($this->$model->all(), $model);
		}
	}

	public function crud()
	{
		$before = $this->counts();
		$results = [];

		foreach ($this->cases as $model => $case) {
			$results[] = $this->run($model, $case);
		}

		$after = $this->counts();
		$unchanged = $before === $after;

		echo '<h1 style="font-family:sans-serif">CRUD test</h1>';
		ddt($results, 'Create, read, update, delete per model (rolled back)');
		ddt([
			'models' => count($results),
			'passed' => count(array_filter($results, fn($r) => $r['result'] === 'PASS')),
			'row counts unchanged' => $unchanged,
		], 'Summary');
	}

	private function run($model, $case)
	{
		$row = ['model' => $model, 'create' => '', 'read' => '', 'update' => '', 'delete' => '', 'result' => 'FAIL', 'error' => ''];
		$this->db->transaction();

		try {
			if (isset($case['key'])) {
				$this->$model->delete($case['key']);
			}

			$id = $this->$model->insert($case['create']);
			$id = $case['key'] ?? $id;
			$row['create'] = $id ? "id {$id}" : 'no id';

			$found = $this->$model->find($id);
			$row['read'] = $found && $this->matches($found, $case['create']) ? 'ok' : 'mismatch';

			$this->$model->update($id, $case['update']);
			$row['update'] = $this->matches($this->$model->find($id), $case['update']) ? 'ok' : 'mismatch';

			$this->$model->delete($id);
			$row['delete'] = $this->$model->find($id) ? 'still there' : 'ok';

			if ($row['read'] === 'ok' && $row['update'] === 'ok' && $row['delete'] === 'ok') {
				$row['result'] = 'PASS';
			}
		} catch (Throwable $e) {
			$row['error'] = $e->getMessage();
		}

		$this->db->roll_back();
		return $row;
	}

	private function matches($found, $expected)
	{
		if (!$found) {
			return false;
		}
		foreach ($expected as $column => $value) {
			if ((string) $found[$column] !== (string) $value) {
				return false;
			}
		}
		return true;
	}

	private function counts()
	{
		$counts = [];
		foreach (array_keys($this->cases) as $model) {
			$counts[$model] = count($this->$model->all());
		}
		return $counts;
	}
}
?>
