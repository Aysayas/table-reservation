<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

/**
 * Runs the Migration library from the command line.
 *
 * Routes to this controller are only registered under the CLI
 * (see app/config/routes.php), so it is unreachable over HTTP.
 * Use: php lava migration run|rollback|status
 */
class Migrate extends Controller {
	public function __construct() {
		parent::__construct();
		$this->call->library('migration');
	}

	public function run() {
		$this->migration->migrate();
	}

	public function rollback() {
		$this->migration->rollback();
	}

	public function status() {
		$this->migration->status();
	}
}
?>
