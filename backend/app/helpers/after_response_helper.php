<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

if (!function_exists('after_response')) {
	function after_response(callable $job)
	{
		static $queue = null;
		if (PHP_SAPI === 'cli' || !function_exists('fastcgi_finish_request')) {
			$job();
			return;
		}
		if ($queue === null) {
			$queue = new ArrayObject();
			register_shutdown_function(function () use ($queue) {
				fastcgi_finish_request();
				foreach ($queue as $queued) {
					try {
						$queued();
					} catch (Throwable $e) {
						error_log('After-response job failed: ' . $e->getMessage());
					}
				}
			});
		}
		$queue[] = $job;
	}
}
