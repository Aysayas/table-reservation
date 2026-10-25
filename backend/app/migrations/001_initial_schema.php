<?php

class Initial_schema {

    private $_lava;

    private $tables = [
        'opening_hours', 'restaurant_settings', 'notifications', 'payments', 'order_items',
        'orders', 'menu_items', 'categories', 'reservations', 'restaurant_tables',
        'customers', 'refresh_tokens', 'users',
    ];

    public function __construct()
    {
        $this->_lava = lava_instance();
    }

    public function up()
    {
        $sql = file_get_contents(ROOT_DIR . 'database/schema.sql');
        foreach (preg_split('/;\s*[\r\n]+/', $sql) as $statement) {
            $statement = trim($statement);
            if ($statement !== '') {
                $this->_lava->db->raw($statement);
            }
        }
    }

    public function down()
    {
        foreach ($this->tables as $table) {
            $this->_lava->db->raw("DROP TABLE IF EXISTS `{$table}`");
        }
    }
}
