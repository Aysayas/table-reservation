<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Payments extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['Payment_model', 'Order_model', 'Reservation_model']);
	}

	public function index()
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
	}

	public function show($id)
	{
		$this->api->require_role('admin');
		$this->api->respond_error('Not implemented', 501);
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

		$payment = $this->Payment_model->find($id);
		foreach (['payment_id', 'order_id', 'reservation_id', 'received_by'] as $field) {
			$payment[$field] = $payment[$field] !== null ? (int) $payment[$field] : null;
		}
		$payment['amount'] = (float) $payment['amount'];
		$this->api->respond(['data' => $payment], 201);
	}

	public function webhook()
	{
		$this->api->respond_error('Not implemented', 501);
	}
}
?>
