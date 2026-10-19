SET NAMES utf8mb4;

INSERT INTO users (user_id, full_name, email, password_hash, role, created_at) VALUES
    (1, 'Admin Name', 'admin@placeholder-domain.com', '$2y$12$NqJRFPwqqyTgYLZyEbZ2RO6g7dpU9rn93tfmpEi7KXdku7l5ePOpa', 'admin', '2026-01-01 00:00:00'),
    (2, 'Staff Name', 'staff@placeholder-domain.com', '$2y$12$NqJRFPwqqyTgYLZyEbZ2RO6g7dpU9rn93tfmpEi7KXdku7l5ePOpa', 'staff', '2026-01-01 00:00:00'),
    (3, 'Kitchen Name', 'kitchen@placeholder-domain.com', '$2y$12$NqJRFPwqqyTgYLZyEbZ2RO6g7dpU9rn93tfmpEi7KXdku7l5ePOpa', 'kitchen', '2026-01-01 00:00:00');

INSERT INTO categories (category_id, name, sort_order) VALUES
    (1, 'Category 1', 1),
    (2, 'Category 2', 2),
    (3, 'Category 3', 3);

INSERT INTO menu_items (item_id, category_id, name, description, price, image_url, is_available) VALUES
    (1, 1, 'Menu Item 1', 'Short description of the dish.', 0.00, NULL, 1),
    (2, 2, 'Menu Item 2', 'Short description of the dish.', 0.00, NULL, 1),
    (3, 3, 'Menu Item 3', 'Short description of the dish.', 0.00, NULL, 1),
    (4, 1, 'Menu Item 4', 'Short description of the dish.', 0.00, NULL, 1),
    (5, 2, 'Menu Item 5', 'Short description of the dish.', 0.00, NULL, 1),
    (6, 3, 'Menu Item 6', 'Short description of the dish.', 0.00, NULL, 1),
    (7, 1, 'Menu Item 7', 'Short description of the dish.', 0.00, NULL, 1),
    (8, 2, 'Menu Item 8', 'Short description of the dish.', 0.00, NULL, 1),
    (9, 3, 'Menu Item 9', 'Short description of the dish.', 0.00, NULL, 0);

INSERT INTO restaurant_tables (table_id, table_number, capacity, qr_token, status) VALUES
    (1, 'T1', 2, 'sample-qr-token-1', 'available'),
    (2, 'T2', 2, 'sample-qr-token-2', 'occupied'),
    (3, 'T3', 2, 'sample-qr-token-3', 'reserved'),
    (4, 'T4', 2, 'sample-qr-token-4', 'available'),
    (5, 'T5', 4, 'sample-qr-token-5', 'available'),
    (6, 'T6', 4, 'sample-qr-token-6', 'available'),
    (7, 'T7', 4, 'sample-qr-token-7', 'available'),
    (8, 'T8', 4, 'sample-qr-token-8', 'available');

INSERT INTO customers (customer_id, full_name, mobile_number, email, created_at) VALUES
    (1, 'Customer Name', '09000000000', 'customer@placeholder-domain.com', '2026-01-01 00:00:00'),
    (2, 'Customer Name', '09000000000', NULL, '2026-01-01 00:00:00');

INSERT INTO reservations (reservation_id, customer_id, table_id, reference_code, reservation_date, reservation_time, pax, deposit_amount, status, created_at) VALUES
    (1, 1, 3, 'RSV-000001', '2026-01-01', '18:00:00', 4, 0.00, 'confirmed', '2026-01-01 00:00:00'),
    (2, 2, NULL, 'RSV-000002', '2026-01-01', '19:30:00', 2, 0.00, 'pending', '2026-01-01 00:00:00');

INSERT INTO orders (order_id, table_id, customer_id, status, total_amount, payment_status, created_at) VALUES
    (1, 2, NULL, 'preparing', 0.00, 'unpaid', '2026-01-01 12:00:00'),
    (2, 5, NULL, 'served', 0.00, 'paid', '2026-01-01 12:30:00');

INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price, notes) VALUES
    (1, 1, 1, 2, 0.00, NULL),
    (2, 1, 4, 1, 0.00, 'No onions'),
    (3, 2, 2, 1, 0.00, NULL);

INSERT INTO payments (payment_id, order_id, reservation_id, received_by, method, provider_reference, amount, status, paid_at) VALUES
    (1, 2, NULL, 2, 'cash', NULL, 0.00, 'paid', '2026-01-01 13:00:00');

INSERT INTO restaurant_settings (setting_id, restaurant_name, address, contact_number, email, facebook_url, logo_url) VALUES
    (1, 'Restaurant Name', 'Street, City, Province', '0000 000 0000', 'info@placeholder-domain.com', 'facebook.com/placeholder-page', NULL);

INSERT INTO opening_hours (day_of_week, open_time, close_time, is_open) VALUES
    (0, '10:00:00', '22:00:00', 1),
    (1, '10:00:00', '22:00:00', 1),
    (2, '10:00:00', '22:00:00', 1),
    (3, '10:00:00', '22:00:00', 1),
    (4, '10:00:00', '22:00:00', 1),
    (5, '10:00:00', '22:00:00', 1),
    (6, '10:00:00', '22:00:00', 1);
