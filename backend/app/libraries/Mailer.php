<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Mailer {
	private $url;
	private $secret;

	public function __construct()
	{
		$this->url = trim(getenv('MAIL_SCRIPT_URL') ?: '');
		$this->secret = trim(getenv('MAIL_SCRIPT_SECRET') ?: '');
	}

	public function password_reset($email, $name, $token)
	{
		$link = rtrim(getenv('FRONTEND_URL') ?: 'http://localhost:5173', '/') . '/reset-password?token=' . $token;
		$text = "Hi {$name},\n\nUse this link to set a new password for your Vencio's Garden account. It works once and expires in 1 hour.\n\n{$link}\n\nIf you didn't ask for this, you can ignore this email.";
		return $this->send($email, "Reset your Vencio's Garden password", $text);
	}

	private function send($email, $subject, $text)
	{
		if ($this->url === '' || $this->secret === '') {
			error_log("Email (fake mode) to {$email}: {$subject}\n{$text}");
			return true;
		}

		// Render's free plan blocks SMTP ports, so Gmail sends through an Apps Script over HTTPS (docs/email-relay.gs)
		$curl = curl_init($this->url);
		curl_setopt_array($curl, [
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_MAXREDIRS => 3,
			CURLOPT_TIMEOUT => 15,
			CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
			CURLOPT_POSTFIELDS => json_encode([
				'secret' => $this->secret,
				'to' => $email,
				'name' => "Vencio's Garden",
				'subject' => $subject,
				'text' => $text,
			]),
		]);
		$raw = curl_exec($curl);
		$code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
		curl_close($curl);

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
