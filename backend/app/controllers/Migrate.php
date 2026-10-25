<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Migrate extends Controller {
	public function __construct()
	{
		parent::__construct();
		if (!IS_CLI) {
			show_404();
		}
		$this->call->library('migration');
	}

	public function run()
	{
		$this->migration->migrate();
	}

	public function status()
	{
		$this->migration->status();
	}
}
