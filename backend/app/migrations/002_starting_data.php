<?php

class Starting_data {

    private $_lava;

    private $tables = ['categories', 'menu_items', 'restaurant_tables', 'restaurant_settings', 'opening_hours'];

    public function __construct()
    {
        $this->_lava = lava_instance();
    }

    public function up()
    {
        $sql = file_get_contents(ROOT_DIR . 'database/seed.sql');
        foreach (preg_split('/;\s*[\r\n]+/', $sql) as $statement) {
            $statement = trim($statement);
            if (!preg_match('/^INSERT INTO (\w+)/', $statement, $match) || !in_array($match[1], $this->tables, true)) {
                continue;
            }
            $table = $match[1];
            if ($this->_lava->db->raw("SELECT COUNT(*) FROM `{$table}`")->fetchColumn() > 0) {
                continue;
            }
            $this->_lava->db->raw($statement);
            if ($table === 'restaurant_tables') {
                $this->replace_qr_tokens();
            }
        }
    }

    public function down()
    {
    }

    private function replace_qr_tokens()
    {
        $ids = $this->_lava->db->raw('SELECT table_id FROM restaurant_tables')->fetchAll(PDO::FETCH_COLUMN);
        foreach ($ids as $id) {
            $this->_lava->db->raw(
                "UPDATE restaurant_tables SET qr_token = ?, status = 'available' WHERE table_id = ?",
                [bin2hex(random_bytes(32)), $id]
            );
        }
    }
}
