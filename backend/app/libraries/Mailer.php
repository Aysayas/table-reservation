<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Mailer {
	private $api_key;
	private $from;

	public function __construct()
	{
		$this->api_key = trim(getenv('BREVO_API_KEY') ?: '');
		$this->from = trim(getenv('MAIL_FROM') ?: '');
	}

	public function password_reset($email, $name, $token)
	{
		$link = rtrim(getenv('FRONTEND_URL') ?: 'http://localhost:5173', '/') . '/reset-password?token=' . $token;
		$text = "Hi {$name},\n\nUse this link to set a new password for your Vencio's Garden account. It works once and expires in 1 hour.\n\n{$link}\n\nIf you didn't ask for this, you can ignore this email.";
		return $this->send($email, $name, "Reset your Vencio's Garden password", $text);
	}

	private function send($email, $name, $subject, $text)
	{
		if ($this->api_key === '' || $this->from === '') {
			error_log("Email (fake mode) to {$email}: {$subject}\n{$text}");
			return true;
		}

		// Render's free plan blocks SMTP ports, so this uses Brevo's HTTPS API
		$curl = curl_init('https://api.brevo.com/v3/smtp/email');
		curl_setopt_array($curl, [
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_TIMEOUT => 10,
			CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json', 'api-key: ' . $this->api_key],
			CURLOPT_POSTFIELDS => json_encode([
				'sender' => ['email' => $this->from, 'name' => "Vencio's Garden"],
				'to' => [['email' => $email, 'name' => $name]],
				'subject' => $subject,
				'textContent' => $text,
			]),
		]);
		$raw = curl_exec($curl);
		$code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
		curl_close($curl);
		if ($raw === false || $code >= 400) {
			error_log("Email failed: HTTP {$code} " . substr((string) $raw, 0, 200));
			return false;
		}
		return true;
	}
}
?>
