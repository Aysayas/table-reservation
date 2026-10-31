<?php

class Customer_accounts {

    private $_lava;

    public function __construct()
    {
        $this->_lava = lava_instance();
    }

    public function up()
    {
        $db = $this->_lava->db;
        $db->raw("ALTER TABLE users MODIFY role ENUM('admin', 'staff', 'kitchen', 'customer') NOT NULL DEFAULT 'staff'");
        $db->raw('ALTER TABLE users ADD COLUMN mobile_number VARCHAR(15) NULL AFTER email, ADD UNIQUE KEY users_mobile_unique (mobile_number)');
        $db->raw('ALTER TABLE customers ADD COLUMN user_id INT UNSIGNED NULL AFTER customer_id, ADD UNIQUE KEY customers_user_unique (user_id), ADD CONSTRAINT customers_user_fk FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL');
        $db->raw('CREATE TABLE password_resets (
            user_id INT UNSIGNED NOT NULL PRIMARY KEY,
            token_hash CHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            UNIQUE KEY password_resets_token_unique (token_hash),
            CONSTRAINT password_resets_user_fk FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    public function down()
    {
        $db = $this->_lava->db;
        $db->raw('DROP TABLE password_resets');
        $db->raw('ALTER TABLE customers DROP FOREIGN KEY customers_user_fk, DROP KEY customers_user_unique, DROP COLUMN user_id');
        $db->raw('ALTER TABLE users DROP KEY users_mobile_unique, DROP COLUMN mobile_number');
        $db->raw("DELETE FROM users WHERE role = 'customer'");
        $db->raw("ALTER TABLE users MODIFY role ENUM('admin', 'staff', 'kitchen') NOT NULL DEFAULT 'staff'");
    }
}
