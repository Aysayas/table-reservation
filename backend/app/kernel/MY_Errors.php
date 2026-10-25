<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

require_once SYSTEM_DIR . 'kernel/Errors.php';

class MY_Errors extends Errors {

	public function show_database_error($message, $sql = '', $bindings = [], $exception = null, $template = 'error_db')
	{
		if (PHP_SAPI === 'cli') {
			fwrite(STDERR, 'Database error: ' . $message . PHP_EOL);
			exit(1);
		}
		if ($this->is_development()) {
			parent::show_database_error($message, $sql, $bindings, $exception, $template);
		}
		error_log('Database error: ' . $message . ($sql ? ' | SQL: ' . $sql : ''));
		$this->json_500();
	}

	public function show_exception($exception)
	{
		if (!$this->is_development()) {
			$this->json_500();
		}
		parent::show_exception($exception);
	}

	protected function is_development()
	{
		return strtolower((string) config_item('environment')) === 'development';
	}

	protected function json_500()
	{
		if (!headers_sent()) {
			http_response_code(500);
			header('Content-Type: application/json');
		}
		echo json_encode(['error' => 'Internal server error', 'status' => 500]);
		exit();
	}
}

if (strtolower((string) config_item('environment')) !== 'development') {
	set_exception_handler(function ($e) {
		_exception_handler($e);
		error_log(get_class($e) . ': ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
		load_class('Errors', 'kernel')->show_exception($e);
	});
}
