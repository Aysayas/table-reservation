<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Sms {
	private $_lava;

	public function __construct()
	{
		$this->_lava = lava_instance();
		$this->_lava->call->model(['Reservation_model', 'Customer_model', 'Notification_model']);
	}

	public function reservation($reservation_id, $kind)
	{
		try {
			$reservation = $this->_lava->Reservation_model->find($reservation_id);
			$customer = $reservation ? $this->_lava->Customer_model->find($reservation['customer_id']) : null;
			if (!$customer) {
				return;
			}
			$message = $this->message($reservation, $customer, $kind);
			$sent = $this->send($customer['mobile_number'], $message);
			$this->_lava->Notification_model->insert([
				'customer_id' => $customer['customer_id'],
				'type' => 'sms',
				'message' => $message,
				'status' => $sent ? 'sent' : 'failed',
			]);
		} catch (Throwable $e) {
			error_log("SMS {$kind} for reservation {$reservation_id} failed: " . $e->getMessage());
		}
	}

	private function message($reservation, $customer, $kind)
	{
		$name = mb_substr(strtok(trim($customer['full_name']), ' ') ?: 'there', 0, 20);
		$code = $reservation['reference_code'];
		$when = strtotime("{$reservation['reservation_date']} {$reservation['reservation_time']}");
		$date = date('D, M j', $when);
		$time = date('g:i A', $when);
		$deposit = (float) $reservation['deposit_amount'];

		switch ($kind) {
			case 'booked':
				return "Vencio's Garden: Hi {$name}, your table for {$reservation['pax']} on {$date} at {$time} is booked. Code {$code}."
					. ($deposit > 0 ? ' Please pay the PHP ' . number_format($deposit, 2) . ' deposit.' : '');
			case 'deposit_paid':
				return "Vencio's Garden: We received your PHP " . number_format($deposit, 2) . " deposit for {$code} on {$date} at {$time}. See you!";
			case 'cancelled':
				return "Vencio's Garden: Your booking {$code} on {$date} at {$time} is cancelled.";
			case 'rescheduled':
				return "Vencio's Garden: Your booking {$code} is moved to {$date} at {$time}.";
			case 'reminder':
				return "Vencio's Garden: Reminder, your table for {$reservation['pax']} is today at {$time}. Code {$code}. See you soon!";
		}
		throw new InvalidArgumentException("Unknown SMS kind {$kind}");
	}

	private function send($mobile, $message)
	{
		// shortcut: no SMS provider yet (fake mode), so texts are only logged; add the provider's API call here once one is chosen
		error_log("SMS (fake mode) to {$mobile}: {$message}");
		return true;
	}
}
