<?php

class Email_notifications {

    private $_lava;

    public function __construct()
    {
        $this->_lava = lava_instance();
    }

    public function up()
    {
        $this->_lava->db->raw("ALTER TABLE notifications MODIFY type ENUM('sms', 'email') NOT NULL DEFAULT 'sms'");
    }

    public function down()
    {
        $this->_lava->db->raw("DELETE FROM notifications WHERE type = 'email'");
        $this->_lava->db->raw("ALTER TABLE notifications MODIFY type ENUM('sms') NOT NULL DEFAULT 'sms'");
    }
}
