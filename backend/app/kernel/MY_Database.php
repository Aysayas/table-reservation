<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

/**
 * App-level extension of scheme/database/Database.php.
 *
 * Adds TLS for MySQL when 'ssl_ca' is set in app/config/database.php
 * (managed hosts such as Aiven require it). Without 'ssl_ca' the stock
 * constructor runs unchanged.
 */

// LavaLust requires every app/kernel/MY_*.php at boot, before Database is
// lazily loaded, so the parent class has to be loaded here first.
require_once SYSTEM_DIR . 'database/Database.php';

class MY_Database extends Database {

	public function __construct($dbname = NULL)
	{
		$config = is_null($dbname) ? database_config()['main'] : (database_config()[$dbname] ?? []);

		if (empty($config['ssl_ca']) || strtolower($config['driver'] ?? 'mysql') !== 'mysql') {
			parent::__construct($dbname);
			return;
		}

		$dsn = sprintf(
			'mysql:host=%s;port=%s;dbname=%s;charset=%s',
			$config['hostname'] ?: 'localhost',
			$config['port'] ?: '3306',
			$config['database'] ?? '',
			$config['charset'] ?: 'utf8mb4'
		);

		// PHP 8.5 deprecates PDO::MYSQL_ATTR_*; Pdo\Mysql exists since 8.4.
		$mysql = class_exists('Pdo\Mysql') ? 'Pdo\Mysql::' : 'PDO::MYSQL_';

		$options = array(
			PDO::ATTR_ERRMODE                              => PDO::ERRMODE_EXCEPTION,
			PDO::ATTR_DEFAULT_FETCH_MODE                   => PDO::FETCH_ASSOC,
			PDO::ATTR_EMULATE_PREPARES                     => false,
			constant($mysql . 'ATTR_SSL_CA')                 => $config['ssl_ca'],
			constant($mysql . 'ATTR_SSL_VERIFY_SERVER_CERT') => (bool) ($config['ssl_verify'] ?? true),
		);

		try {
			$pdo = new PDO($dsn, $config['username'] ?? '', $config['password'] ?? '', $options);
		} catch (Exception $e) {
			load_class('Errors', 'kernel')->show_database_error($e->getMessage(), '', [], $e);
		}

		// The parent's connection properties are private.
		$prefix = $config['dbprefix'] ?? '';
		Closure::bind(function () use ($pdo, $prefix) {
			$this->db = $pdo;
			$this->driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
			$this->db_prefix = $prefix;
		}, $this, Database::class)();
	}

	/**
	 * The parent hardcodes `new Database`; return this class instead.
	 */
	public static function instance($dbname)
	{
		return new static($dbname);
	}
}
