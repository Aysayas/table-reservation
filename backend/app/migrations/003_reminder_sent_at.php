<?php

class Reminder_sent_at {

    private $_lava;

    public function __construct()
    {
        $this->_lava = lava_instance();
    }

    public function up()
    {
        $this->_lava->db->raw('ALTER TABLE reservations ADD COLUMN reminder_sent_at DATETIME NULL AFTER status');
    }

    public function down()
    {
        $this->_lava->db->raw('ALTER TABLE reservations DROP COLUMN reminder_sent_at');
    }
}
