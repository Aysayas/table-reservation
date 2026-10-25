<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Notifications extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
	}

	public function reminders()
	{
		$secret = trim(getenv('CRON_SECRET') ?: '');
		if ($secret === '') {
			$this->api->respond_error('Reminders are not set up', 503);
		}
		if (!hash_equals($secret, (string) ($_SERVER['HTTP_X_CRON_SECRET'] ?? ''))) {
			$this->api->respond_error('Unauthorized', 401);
		}

		$due = $this->db->raw(
			"SELECT reservation_id FROM reservations
			 WHERE status IN ('pending', 'confirmed') AND reminder_sent_at IS NULL
			   AND TIMESTAMP(reservation_date, reservation_time) BETWEEN NOW() AND NOW() + INTERVAL 2 HOUR"
		)->fetchAll(PDO::FETCH_COLUMN);

		$this->call->library('sms');
		$sent = 0;
		foreach ($due as $id) {
			$claimed = $this->db->raw('UPDATE reservations SET reminder_sent_at = NOW() WHERE reservation_id = ? AND reminder_sent_at IS NULL', [$id])->rowCount();
			if ($claimed) {
				$this->sms->reservation((int) $id, 'reminder');
				$sent++;
			}
		}
		$this->api->respond(['data' => ['reminders_sent' => $sent]]);
	}
}
?>
