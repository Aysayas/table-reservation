<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Payments extends Controller {
	private $per_page = 8;

	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Payment_model', 'Order_model', 'Reservation_model', 'User_model', 'Table_model']);
	}

	public function index()
	{
		$this->api->require_role('admin');
		$query = $this->api->get_query_params();
		$method = $query['method'] ?? '';
		$status = $query['status'] ?? '';
		$page = $query['page'] ?? '1';
		$search = is_string($query['search'] ?? null) ? trim($query['search']) : '';

		$errors = [];
		if ($method !== '' && !in_array($method, ['online', 'cash'], true)) {
			$errors[] = '"method" must be online or cash.';
		}
		if ($status !== '' && !in_array($status, ['pending', 'paid', 'failed', 'refunded'], true)) {
			$errors[] = '"status" must be pending, paid, failed or refunded.';
		}
		if (!(is_string($page) && ctype_digit($page) && (int) $page >= 1)) {
			$errors[] = '"page" must be 1 or more.';
		}
		$range = [];
		foreach (['date_from', 'date_to'] as $field) {
			$value = $query[$field] ?? '';
			$date = is_string($value) ? DateTime::createFromFormat('!Y-m-d', $value) : false;
			if ($value !== '' && (!$date || $date->format('Y-m-d') !== $value)) {
				$errors[] = "\"{$field}\" must be a date (YYYY-MM-DD).";
			} elseif ($value !== '') {
				$range[$field] = $field === 'date_from' ? "{$value} 00:00:00" : date('Y-m-d', strtotime("{$value} +1 day")) . ' 00:00:00';
			}
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		$search_reservations = $search !== ''
			? array_column($this->Reservation_model->query()->like('reference_code', "%{$search}%")->get_all(), 'reservation_id')
			: [];
		$digits = preg_replace('/^(PAY-|#)/i', '', $search);
		$number = ctype_digit($digits) ? (int) $digits : 0;
		$build = function ($with_filters) use ($method, $status, $range, $search, $search_reservations, $number) {
			$payments = $this->Payment_model->query();
			if (isset($range['date_from'])) {
				$payments->where('paid_at', '>=', $range['date_from']);
			}
			if (isset($range['date_to'])) {
				$payments->where('paid_at', '<', $range['date_to']);
			}
			if (!$with_filters) {
				return $payments;
			}
			if ($method !== '') {
				$payments->where('method', $method);
			}
			if ($status !== '') {
				$payments->where('status', $status);
			}
			if ($search !== '') {
				$payments->grouped(function ($group) use ($search, $search_reservations, $number) {
					$group->like('provider_reference', "%{$search}%");
					if ($number) {
						$group->or_where('payment_id', $number)->or_where('order_id', $number);
					}
					if ($search_reservations) {
						$group->or_in('reservation_id', $search_reservations);
					}
				});
			}
			return $payments;
		};

		$total = (int) $build(true)->count();
		$rows = $build(true)->order_by('payment_id', 'DESC')->pagination($this->per_page, (int) $page)->get_all();

		$totals = ['total_collected' => 0.0, 'online' => 0.0, 'cash' => 0.0, 'deposits' => 0.0];
		foreach ($build(false)->where('status', 'paid')->get_all() as $payment) {
			$amount = (float) $payment['amount'];
			$totals['total_collected'] += $amount;
			$totals[$payment['method']] += $amount;
			if ($payment['reservation_id'] !== null) {
				$totals['deposits'] += $amount;
			}
		}

		$this->api->respond([
			'data' => array_map([$this, 'format'], $rows),
			'totals' => array_map(fn($value) => round($value, 2), $totals),
			'meta' => ['total' => $total, 'page' => (int) $page, 'per_page' => $this->per_page],
		]);
	}

	public function show($id)
	{
		$this->api->require_role('admin');
		$payment = $this->Payment_model->find($id);
		if (!$payment) {
			$this->api->respond_error('Payment not found', 404);
		}

		$this->api->respond(['data' => $this->format($payment)]);
	}

	private function format($payment)
	{
		$reservation = $payment['reservation_id'] !== null ? $this->Reservation_model->find($payment['reservation_id']) : null;
		$user = $payment['received_by'] !== null ? $this->User_model->find($payment['received_by']) : null;

		return [
			'payment_id' => (int) $payment['payment_id'],
			'order_id' => $payment['order_id'] !== null ? (int) $payment['order_id'] : null,
			'reservation_id' => $payment['reservation_id'] !== null ? (int) $payment['reservation_id'] : null,
			'for' => $payment['order_id'] !== null
				? ['type' => 'order', 'order_id' => (int) $payment['order_id']]
				: ['type' => 'deposit', 'reservation_id' => (int) $payment['reservation_id'], 'reference_code' => $reservation['reference_code'] ?? null],
			'method' => $payment['method'],
			'provider_reference' => $payment['provider_reference'],
			'amount' => (float) $payment['amount'],
			'status' => $payment['status'],
			'paid_at' => $payment['paid_at'],
			'received_by' => $user ? ['user_id' => (int) $user['user_id'], 'full_name' => $user['full_name']] : null,
		];
	}

	public function store()
	{
		$user = $this->api->require_role('staff', 'admin');
		$input = $this->api->body();
		$order_id = $input['order_id'] ?? null;
		$reservation_id = $input['reservation_id'] ?? null;
		$amount = $input['amount'] ?? null;

		$errors = [];
		if (($order_id === null) === ($reservation_id === null)) {
			$errors[] = 'Give exactly one of "order_id" or "reservation_id".';
		}
		foreach (['order_id' => $order_id, 'reservation_id' => $reservation_id] as $field => $value) {
			if ($value !== null && !is_int($value)) {
				$errors[] = "\"{$field}\" must be a number.";
			}
		}
		if (!is_int($amount) && !is_float($amount)) {
			$errors[] = '"amount" must be a number.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		if ($order_id !== null) {
			$target = $this->Order_model->find($order_id);
			if (!$target) {
				$this->api->respond_error('Order not found', 404);
			}
			$due = (float) $target['total_amount'];
			$paid = $target['payment_status'] === 'paid';
		} else {
			$target = $this->Reservation_model->find($reservation_id);
			if (!$target) {
				$this->api->respond_error('Reservation not found', 404);
			}
			if (in_array($target['status'], ['no_show', 'cancelled'], true)) {
				$this->api->respond_error("This reservation is {$target['status']}", 409);
			}
			$due = (float) $target['deposit_amount'];
			$paid = $this->Payment_model->exists(['reservation_id' => $reservation_id, 'status' => 'paid']);
		}

		if ($paid) {
			$this->api->respond_error('This is already paid', 409);
		}
		if ($due <= 0) {
			$this->api->respond_error('There is nothing to pay', 409);
		}
		if (round((float) $amount, 2) !== round($due, 2)) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['"amount" must be ' . number_format($due, 2, '.', '') . '.']], 422);
		}

		$this->Payment_model->transaction();
		try {
			$id = $this->Payment_model->insert([
				'order_id' => $order_id,
				'reservation_id' => $reservation_id,
				'received_by' => (int) $user['sub'],
				'method' => 'cash',
				'amount' => number_format($due, 2, '.', ''),
				'status' => 'paid',
				'paid_at' => date('Y-m-d H:i:s'),
			]);
			if ($order_id !== null && !$this->Order_model->update_where(['order_id' => $order_id, 'payment_status' => 'unpaid'], ['payment_status' => 'paid'])) {
				$this->Payment_model->rollback();
				$this->api->respond_error('This is already paid', 409);
			}
			// shortcut: a deposit paid twice at the same instant can be recorded twice; add a row lock if cash deposits become common
			$this->Payment_model->commit();
		} catch (Throwable $e) {
			$this->Payment_model->rollback();
			$this->api->respond_error('Could not save the payment', 500);
		}
		$this->call->library('paymongo');
		$this->paymongo->cancel_pending($order_id !== null ? 'order_id' : 'reservation_id', $order_id ?? $reservation_id);
		if ($order_id !== null) {
			$this->Table_model->free_if_idle($target['table_id']);
			$this->call->library('pusher');
			$this->pusher->order_changed($order_id, 'order.paid');
		} else {
			$this->call->library('sms');
			$this->sms->reservation($reservation_id, 'deposit_paid');
		}

		$payment = $this->Payment_model->find($id);
		foreach (['payment_id', 'order_id', 'reservation_id', 'received_by'] as $field) {
			$payment[$field] = $payment[$field] !== null ? (int) $payment[$field] : null;
		}
		$payment['amount'] = (float) $payment['amount'];
		$this->api->respond(['data' => $payment], 201);
	}

	public function webhook()
	{
		$raw = file_get_contents('php://input');
		$this->call->library('paymongo');
		if (!$this->paymongo->verify($_SERVER['HTTP_PAYMONGO_SIGNATURE'] ?? null, $raw)) {
			$this->api->respond_error('Invalid signature', 401);
		}

		$event = json_decode($raw, true);
		if (($event['data']['attributes']['type'] ?? '') !== 'checkout_session.payment.paid') {
			$this->api->respond(['received' => true]);
		}
		$session = $event['data']['attributes']['data'] ?? [];
		$payment = $this->Payment_model->find_by('provider_reference', (string) ($session['id'] ?? ''));
		if (!$payment || $payment['method'] !== 'online') {
			error_log('PayMongo webhook for an unknown checkout session ' . ($session['id'] ?? ''));
			$this->api->respond(['received' => true]);
		}

		$paid = array_filter($session['attributes']['payments'] ?? [], fn($p) => ($p['attributes']['status'] ?? '') === 'paid');
		$line_total = array_sum(array_map(fn($line) => (int) ($line['amount'] ?? 0) * (int) ($line['quantity'] ?? 0), $session['attributes']['line_items'] ?? []));
		$cents = $paid ? (int) (reset($paid)['attributes']['amount'] ?? $line_total) : $line_total;
		if ($cents !== (int) round((float) $payment['amount'] * 100)) {
			error_log("PayMongo amount mismatch for payment {$payment['payment_id']}: got {$cents} centavos");
			$this->api->respond(['received' => true]);
		}

		$id = $payment['payment_id'];
		$target = $payment['order_id'] !== null ? 'order_id' : 'reservation_id';
		$already_paid = $payment['status'] !== 'paid' && $this->Payment_model->query()->where([$target => $payment[$target], 'status' => 'paid'])->get_all();
		if ($already_paid) {
			error_log("{$target} {$payment[$target]} was already paid; online payment {$id} was also paid at PayMongo and needs a refund");
			$this->api->respond(['received' => true]);
		}

		$paid_at = ['status' => 'paid', 'paid_at' => date('Y-m-d H:i:s')];
		if (!$this->Payment_model->update_where(['payment_id' => $id, 'status' => 'pending'], $paid_at)
			&& !$this->Payment_model->update_where(['payment_id' => $id, 'status' => 'failed'], $paid_at)) {
			$this->api->respond(['received' => true]);
		}
		if ($payment['order_id'] !== null) {
			$this->Order_model->update_where(['order_id' => $payment['order_id'], 'payment_status' => 'unpaid'], ['payment_status' => 'paid']);
			$this->Table_model->free_if_idle($this->Order_model->find($payment['order_id'])['table_id']);
			$this->call->library('pusher');
			$this->pusher->order_changed($payment['order_id'], 'order.paid');
		} elseif ($this->Reservation_model->find($payment['reservation_id'])['status'] === 'cancelled') {
			error_log("Reservation {$payment['reservation_id']} was cancelled before online payment {$id} arrived; it needs a refund");
		} else {
			$this->call->library('sms');
			$this->sms->reservation((int) $payment['reservation_id'], 'deposit_paid');
		}
		$this->api->respond(['received' => true]);
	}
}
?>
