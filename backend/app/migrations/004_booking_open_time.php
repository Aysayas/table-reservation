<?php

class Booking_open_time {

    private $_lava;

    public function __construct()
    {
        $this->_lava = lava_instance();
    }

    public function up()
    {
        $this->_lava->db->raw('ALTER TABLE restaurant_settings ADD COLUMN booking_open_time TIME NULL AFTER max_pax');
    }

    public function down()
    {
        $this->_lava->db->raw('ALTER TABLE restaurant_settings DROP COLUMN booking_open_time');
    }
}
