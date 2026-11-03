<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Mailer {
	private const KINDS = [
		'booked' => ['Your table is booked', 'Your table is booked'],
		'deposit_paid' => ['Deposit received, your table is confirmed', 'Deposit received'],
		'rescheduled' => ['Your booking has moved', 'Your booking has moved'],
		'cancelled' => ['Your booking is cancelled', 'Your booking is cancelled'],
		'expired' => ['Your booking was cancelled', 'Your booking was cancelled'],
	];
	private $_lava;
	private $url;
	private $secret;
	private $frontend;

	public function __construct()
	{
		$this->_lava = lava_instance();
		$this->url = trim(getenv('MAIL_SCRIPT_URL') ?: '');
		$this->secret = trim(getenv('MAIL_SCRIPT_SECRET') ?: '');
		$this->frontend = rtrim(getenv('FRONTEND_URL') ?: 'http://localhost:5173', '/');
	}

	public function password_reset($email, $name, $token)
	{
		$link = $this->frontend . '/reset-password?token=' . $token;
		$text = "Hi {$name},\n\nUse this link to set a new password for your Vencio's Garden account. It works once and expires in 1 hour.\n\n{$link}\n\nIf you didn't ask for this, you can ignore this email.";
		return $this->send($email, "Reset your Vencio's Garden password", $text);
	}

	public function reservation($reservation_id, $kind)
	{
		if (!isset(self::KINDS[$kind])) {
			return;
		}
		try {
			$this->_lava->call->model(['Reservation_model', 'Customer_model', 'Notification_model', 'Setting_model', 'Table_model']);
			$this->_lava->call->helper('after_response');
			$reservation = $this->_lava->Reservation_model->find($reservation_id);
			$customer = $reservation ? $this->_lava->Customer_model->find($reservation['customer_id']) : null;
			$email = trim((string) ($customer['email'] ?? ''));
			if (!$customer || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
				return;
			}
			$table = $reservation['table_id'] ? $this->_lava->Table_model->find($reservation['table_id']) : null;
			$settings = $this->_lava->Setting_model->all()[0] ?? [];
			[$subject, $text, $html] = $this->booking_email($reservation, $customer, $table, $settings, $kind);
			after_response(function () use ($customer, $email, $subject, $text, $html) {
				$sent = $this->send($email, $subject, $text, $html);
				$this->_lava->Notification_model->insert([
					'customer_id' => $customer['customer_id'],
					'type' => 'email',
					'message' => mb_substr($subject, 0, 255),
					'status' => $sent ? 'sent' : 'failed',
				]);
			});
		} catch (Throwable $e) {
			error_log("Email {$kind} for reservation {$reservation_id} failed: " . $e->getMessage());
		}
	}

	private function booking_email($reservation, $customer, $table, $settings, $kind)
	{
		[$title, $heading] = self::KINDS[$kind];
		$code = $reservation['reference_code'];
		$name = strtok(trim($customer['full_name']), ' ') ?: 'there';
		$when = strtotime("{$reservation['reservation_date']} {$reservation['reservation_time']}");
		$deposit = (float) $reservation['deposit_amount'];
		$peso = 'PHP ' . number_format($deposit, 2);
		$restaurant = $settings['restaurant_name'] ?? "Vencio's Garden";
		$view = "{$this->frontend}/reserve/confirmation/{$code}";

		switch ($kind) {
			case 'booked':
				$owes = $deposit > 0 && $reservation['status'] === 'pending';
				$lead = $owes
					? 'Your table is held for ' . Reservation_model::PAY_MINUTES . " minutes. Please pay the {$peso} deposit to confirm it, or the booking is cancelled."
					: 'We look forward to seeing you.';
				$button = $owes ? ['Pay Deposit', "{$this->frontend}/reserve/payment?code={$code}"] : ['View Reservation', $view];
				break;
			case 'deposit_paid':
				$lead = "We received your {$peso} deposit. Your table is confirmed.";
				$button = ['View Reservation', $view];
				break;
			case 'rescheduled':
				$lead = 'Here are the new details of your booking.';
				$button = ['View Reservation', $view];
				break;
			case 'cancelled':
				$lead = 'This booking is cancelled. If that was a mistake, you can book again anytime.';
				$button = ['Reserve a Table', "{$this->frontend}/reserve"];
				break;
			default:
				$lead = "The deposit wasn't paid within " . Reservation_model::PAY_MINUTES . ' minutes, so the table was released. You can book again anytime.';
				$button = ['Reserve a Table', "{$this->frontend}/reserve"];
		}

		$rows = [
			'Reference code' => $code,
			'Date' => date('l, F j, Y', $when),
			'Time' => date('g:i A', $when),
			'Guests' => (string) $reservation['pax'],
		];
		if ($table && in_array($kind, ['booked', 'deposit_paid', 'rescheduled'], true)) {
			$rows['Table'] = $table['table_number'];
		}
		if ($deposit > 0) {
			$rows['Deposit'] = $peso;
		}
		$contact = array_filter([$settings['address'] ?? '', $settings['contact_number'] ?? '', $settings['email'] ?? '']);
		$manage = "{$this->frontend}/reservation?code={$code}";

		$text = "Hi {$name},\n\n{$heading}. {$lead}\n\n";
		foreach ($rows as $label => $value) {
			$text .= "{$label}: {$value}\n";
		}
		$text .= "\n{$button[0]}: {$button[1]}\nManage your booking: {$manage}\n\n{$restaurant}\n" . implode("\n", $contact);

		$e = fn($value) => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
		$details = '';
		foreach ($rows as $label => $value) {
			$details .= '<tr><td style="padding:8px 0;color:#6b5f55;font-size:14px;border-bottom:1px dotted #d8c6a3">' . $e($label) . '</td>'
				. '<td style="padding:8px 0;color:#1c1917;font-size:14px;font-weight:bold;text-align:right;border-bottom:1px dotted #d8c6a3">' . $e($value) . '</td></tr>';
		}
		$html = '<!doctype html><html><body style="margin:0;padding:0;background:#f7f2e9;font-family:Helvetica,Arial,sans-serif">'
			. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2e9;padding:24px 12px"><tr><td align="center">'
			. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #d8c6a3;border-radius:8px;overflow:hidden">'
			. '<tr><td style="background:#1c1917;padding:20px 28px;font-family:Georgia,serif;font-size:22px;color:#ffffff">' . $e($restaurant) . '</td></tr>'
			. '<tr><td style="padding:28px">'
			. '<p style="margin:0 0 6px;color:#7d5f24;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">Reservation ' . $e($code) . '</p>'
			. '<h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;font-weight:normal;color:#1c1917">' . $e($heading) . '</h1>'
			. '<p style="margin:0 0 20px;color:#2b2522;font-size:15px;line-height:1.6">Hi ' . $e($name) . ', ' . $e($lead) . '</p>'
			. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $details . '</table>'
			. '<p style="margin:24px 0 0"><a href="' . $e($button[1]) . '" style="display:inline-block;background:#b3121b;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:1px;text-transform:uppercase;padding:14px 24px;border-radius:4px">' . $e($button[0]) . '</a></p>'
			. '<p style="margin:16px 0 0;font-size:13px;color:#6b5f55"><a href="' . $e($manage) . '" style="color:#7d5f24">Manage your booking</a> with your reference code and mobile number.</p>'
			. '</td></tr>'
			. '<tr><td style="padding:18px 28px;background:#f7f2e9;color:#6b5f55;font-size:12px;line-height:1.6">' . $e($restaurant) . ($contact ? '<br>' . implode('<br>', array_map($e, $contact)) : '') . '</td></tr>'
			. '</table></td></tr></table></body></html>';

		return ["{$title} · {$code}", $text, $html];
	}

	private function send($email, $subject, $text, $html = null)
	{
		if ($this->url === '' || $this->secret === '') {
			error_log("Email (fake mode) to {$email}: {$subject}\n{$text}");
			return true;
		}

		// Render's free plan blocks SMTP ports, so Gmail sends through an Apps Script over HTTPS (docs/email-relay.gs)
		$payload = [
			'secret' => $this->secret,
			'to' => $email,
			'name' => "Vencio's Garden",
			'subject' => $subject,
			'text' => $text,
		];
		if ($html !== null) {
			$payload['html'] = $html;
		}
		$curl = curl_init($this->url);
		curl_setopt_array($curl, [
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_MAXREDIRS => 3,
			CURLOPT_TIMEOUT => 15,
			CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
			CURLOPT_POSTFIELDS => json_encode($payload),
		]);
		$raw = curl_exec($curl);
		$code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);

		// Apps Script answers 200 even when it refuses, so success is only in the body
		$result = is_string($raw) ? json_decode($raw, true) : null;
		if (!is_array($result) || ($result['ok'] ?? false) !== true) {
			error_log("Email failed: HTTP {$code} " . ($result['error'] ?? 'unexpected response'));
			return false;
		}
		return true;
	}
}
?>
