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
		echo '<p style="font-family:sans-serif">Try it yourself: ';
		foreach (array_keys($this->cases) as $model) {
			$name = $this->slug($model);
			echo "<a href=\"/dev/db/table/{$name}\">{$name}</a> &middot; ";
		}
		echo '<a href="/dev/db/crud">automatic CRUD test</a></p>';

		foreach (array_keys($this->cases) as $model) {
			ddt($this->$model->all(), $model);
		}
	}

	public function table($name)
	{
		$model = null;
		foreach (array_keys($this->cases) as $candidate) {
			if ($this->slug($candidate) === $name) {
				$model = $candidate;
			}
		}
		if (!$model) {
			show_404();
		}

		$columns = $this->$model->get_columns();
		$key = '';
		foreach ($columns as $column) {
			if ($column['Key'] === 'PRI') {
				$key = $column['Field'];
			}
		}

		$message = '';
		$found = null;
		if ($this->request->is_post()) {
			[$message, $found] = $this->handle($model, $columns);
		}

		echo '<div style="font-family:sans-serif;max-width:1100px">';
		echo "<p><a href=\"/dev/db\">&larr; all tables</a></p><h1>{$model}</h1>";
		if ($message !== '') {
			echo '<p style="padding:8px;border:1px solid #888"><strong>' . htmlspecialchars($message) . '</strong></p>';
		}
		echo '</div>';

		if ($found) {
			ddt($found, "Read {$key} " . $this->request->post('id'));
		}

		$this->form('Create', 'create', $columns, false);
		$this->form("Read by {$key}", 'read', [], true);
		$this->form("Update by {$key} (blank fields stay the same)", 'update', $columns, true);
		$this->form("Delete by {$key}", 'delete', [], true);

		ddt($this->$model->all(), "{$model}: all rows");
	}

	private function handle($model, $columns)
	{
		$action = $this->request->post('action', '');
		$id = trim((string) $this->request->post('id', ''));
		$data = [];
		foreach ($columns as $column) {
			$value = trim((string) $this->request->post('f_' . $column['Field'], ''));
			if ($value !== '') {
				$data[$column['Field']] = $value;
			}
		}

		try {
			if ($action === 'create') {
				$new_id = $this->$model->insert($data);
				return [$new_id === false ? 'Nothing created: no allowed fields were filled in' : "Created, id {$new_id}", null];
			}
			if ($id === '') {
				return ['Fill in the id', null];
			}
			if ($action === 'read') {
				$row = $this->$model->find($id);
				return [$row ? 'Found' : "No row with id {$id}", $row ?: null];
			}
			if ($action === 'update') {
				if (!$this->$model->find($id)) {
					return ["No row with id {$id}", null];
				}
				$result = $this->$model->update($id, $data);
				return [$result === false ? 'Nothing updated: no allowed fields were filled in' : "Updated id {$id}", null];
			}
			if ($action === 'delete') {
				if (!$this->$model->find($id)) {
					return ["No row with id {$id}", null];
				}
				$this->$model->delete($id);
				return ["Deleted id {$id}", null];
			}
		} catch (Throwable $e) {
			return ['Database error: ' . $e->getMessage(), null];
		}

		return ['Unknown action', null];
	}

	private function form($title, $action, $columns, $with_id)
	{
		echo '<form method="post" style="font-family:sans-serif;border:1px solid #ccc;padding:12px;margin:12px 0;max-width:1100px">';
		echo '<h3 style="margin-top:0">' . htmlspecialchars($title) . '</h3>';
		echo "<input type=\"hidden\" name=\"action\" value=\"{$action}\">";
		if ($with_id) {
			echo '<label style="display:inline-block;margin:4px 12px 4px 0">id <input name="id" size="6"></label>';
		}
		foreach ($columns as $column) {
			if (strpos($column['Extra'], 'auto_increment') !== false) {
				continue;
			}
			$field = htmlspecialchars($column['Field']);
			echo "<label style=\"display:inline-block;margin:4px 12px 4px 0\">{$field} ";
			if (preg_match_all("/'([^']*)'/", $column['Type'], $options) && strpos($column['Type'], 'enum(') === 0) {
				echo "<select name=\"f_{$field}\"><option value=\"\"></option>";
				foreach ($options[1] as $option) {
					$option = htmlspecialchars($option);
					echo "<option>{$option}</option>";
				}
				echo '</select>';
			} else {
				$type = htmlspecialchars($column['Type']);
				echo "<input name=\"f_{$field}\" placeholder=\"{$type}\" size=\"14\">";
			}
			echo '</label>';
		}
		echo '<br><button type="submit" style="margin-top:8px">' . ucfirst($action) . '</button></form>';
	}

	private function slug($model)
	{
		return strtolower(substr($model, 0, -strlen('_model')));
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
		$this->$model->transaction();

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

		$this->$model->rollback();
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
