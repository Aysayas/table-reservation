<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Health extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
	}

	public function index()
	{
		$this->api->respond([
			'status'  => 'ok',
			'service' => 'table-reservation-api',
			'time'    => date('c'),
		]);
	}

	public function database()
	{
		$dsn = sprintf(
			'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
			getenv('DB_HOST') ?: 'localhost',
			getenv('DB_PORT') ?: '3306',
			getenv('DB_NAME') ?: ''
		);

		try {
			$pdo = new PDO($dsn, getenv('DB_USER') ?: '', getenv('DB_PASSWORD') ?: '', [
				PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
				PDO::ATTR_TIMEOUT => 5,
			]);
			$pdo->query('SELECT 1');
			$this->api->respond(['status' => 'ok', 'database' => 'connected']);
		} catch (Throwable $e) {
			$this->api->respond(['status' => 'error', 'database' => 'unreachable'], 503);
		}
	}

	public function preflight()
	{
		http_response_code(204);
	}
}
?>
