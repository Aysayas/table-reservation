<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

/**
 * App-level extension of scheme/kernel/Errors.php.
 *
 * Outside development, error details (host, user, SQL, bindings, traces)
 * go to the PHP error log only; the client gets a generic JSON 500.
 */

// LavaLust requires every app/kernel/MY_*.php at boot, before Errors is
// lazily loaded, so the parent class has to be loaded here first.
require_once SYSTEM_DIR . 'kernel/Errors.php';

class MY_Errors extends Errors {

	/**
	 * Show Database Error
	 */
	public function show_database_error($message, $sql = '', $bindings = [], $exception = null, $template = 'error_db')
	{
		if (PHP_SAPI === 'cli') {
			$this->cli_fail('Database error: ' . $message);
		}
		if ($this->is_development()) {
			parent::show_database_error($message, $sql, $bindings, $exception, $template);
		}

		error_log('Database error: ' . $message . ($sql ? ' | SQL: ' . $sql : ''));
		$this->json_500();
	}

	/**
	 * Show Exception error (parent never sets a status code)
	 */
	public function show_exception($exception)
	{
		if (PHP_SAPI === 'cli') {
			$this->cli_fail(get_class($exception) . ': ' . $exception->getMessage());
		}
		if (! $this->is_development()) {
			$this->json_500();
		}
		if (! headers_sent()) {
			http_response_code(500);
		}
		parent::show_exception($exception);
	}

	/**
	 * Show PHP error (parent never sets a status code)
	 */
	public function show_php_error($severity, $message, $filepath, $line)
	{
		if (! headers_sent()) {
			http_response_code(500);
		}
		parent::show_php_error($severity, $message, $filepath, $line);
	}

	protected function is_development()
	{
		return strtolower((string) config_item('environment')) === 'development';
	}

	/**
	 * CLI (php lava migration run): message to STDERR and a non-zero exit
	 * code, so scripts and deploys see the failure.
	 */
	protected function cli_fail($message)
	{
		fwrite(STDERR, $message . PHP_EOL);
		exit(1);
	}

	protected function json_500()
	{
		if (! headers_sent()) {
			http_response_code(500);
			header('Content-Type: application/json');
		}
		echo json_encode(['error' => 'Internal server error', 'status' => 500]);
		exit();
	}
}

/*
| scheme/kernel/Routine.php's _exception_handler renders nothing outside
| development, leaving a blank HTTP 200. Wrap it so the exception is
| logged and the client gets a JSON 500.
*/
if (strtolower((string) config_item('environment')) !== 'development') {
	set_exception_handler(function ($e) {
		_exception_handler($e);
		error_log(get_class($e) . ': ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
		load_class('Errors', 'kernel')->show_exception($e);
	});
}
