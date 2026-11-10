<?php

class Retire_tables {

    private $_lava;

    public function __construct()
    {
        $this->_lava = lava_instance();
    }

    public function up()
    {
        $this->_lava->db->raw('ALTER TABLE restaurant_tables ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER status');
    }

    public function down()
    {
        $this->_lava->db->raw('ALTER TABLE restaurant_tables DROP COLUMN is_active');
    }
}
