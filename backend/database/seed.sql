SET NAMES utf8mb4;

INSERT INTO users (user_id, full_name, email, password_hash, role, is_active, last_login_at, created_at) VALUES
    (1, 'Admin Name', 'admin@placeholder-domain.com', '$2y$12$NqJRFPwqqyTgYLZyEbZ2RO6g7dpU9rn93tfmpEi7KXdku7l5ePOpa', 'admin', 1, NULL, '2026-01-01 00:00:00'),
    (2, 'Staff Name', 'staff@placeholder-domain.com', '$2y$12$NqJRFPwqqyTgYLZyEbZ2RO6g7dpU9rn93tfmpEi7KXdku7l5ePOpa', 'staff', 1, NULL, '2026-01-01 00:00:00'),
    (3, 'Kitchen Name', 'kitchen@placeholder-domain.com', '$2y$12$NqJRFPwqqyTgYLZyEbZ2RO6g7dpU9rn93tfmpEi7KXdku7l5ePOpa', 'kitchen', 1, NULL, '2026-01-01 00:00:00'),
    (4, 'Staff Name', 'staff2@placeholder-domain.com', '$2y$12$NqJRFPwqqyTgYLZyEbZ2RO6g7dpU9rn93tfmpEi7KXdku7l5ePOpa', 'staff', 0, NULL, '2026-01-01 00:00:00');

INSERT INTO categories (category_id, name, sort_order) VALUES
    (1, 'Breakfast Corner', 1),
    (2, 'Prelude', 2),
    (3, 'Rice Harmony', 3),
    (4, 'Signature Presto Pizza', 4),
    (5, 'Vencio''s Merienda', 5),
    (6, 'Pinoy Desserts', 6),
    (7, 'Vegetable Tunes', 7),
    (8, 'Soup Melodies', 8),
    (9, 'Vencio''s Classics', 9),
    (10, 'Seafood Serenade', 10),
    (11, 'Bayanihan Meals', 11),
    (12, 'Hot Drinks', 12),
    (13, 'Cold Drinks', 13),
    (14, 'Speciality Drinks', 14),
    (15, 'Liquors', 15),
    (16, 'Cocktails', 16);

INSERT INTO menu_items (item_id, category_id, name, description, price, image_url, is_available) VALUES
    (1, 1, 'Hungarian Sausage with Bread and Egg', 'Short description of the dish.', 285.00, NULL, 1),
    (2, 1, 'Tapa with Dilis and Banana Garlic Oleo', 'Short description of the dish.', 250.00, NULL, 1),
    (3, 1, 'Crispy Biya with Egg and Fried Banana', 'Short description of the dish.', 195.00, NULL, 1),
    (4, 1, 'Smoked Salmon Egg Benedict', 'Short description of the dish.', 356.00, NULL, 1),
    (5, 1, 'Scrambled Egg (3 pcs.)', 'Add-on.', 150.00, NULL, 1),
    (6, 1, 'Boiled or Fried Egg', 'Add-on.', 50.00, NULL, 1),
    (7, 1, 'Poached Egg', 'Add-on.', 50.00, NULL, 1),
    (8, 1, 'Toasted Garlic Bread (2 pcs.) with Jam/Butter', 'Add-on.', 50.00, NULL, 1),
    (9, 2, 'Kilawin Tanigue', 'Short description of the dish.', 460.00, NULL, 1),
    (10, 2, 'Buffalo Wings', 'Short description of the dish.', 250.00, NULL, 1),
    (11, 2, 'Nachos', 'Short description of the dish.', 150.00, NULL, 1),
    (12, 2, 'Lumpiang Shanghai', 'Short description of the dish.', 150.00, NULL, 1),
    (13, 2, 'Clubhouse with Fries', 'Short description of the dish.', 185.00, NULL, 1),
    (14, 2, 'Fries and Mojos', 'Short description of the dish.', 250.00, NULL, 1),
    (15, 3, 'Yang Chow Fried Rice', 'Good for 3-4 pax.', 250.00, NULL, 1),
    (16, 3, 'Plain Rice', 'Single order.', 35.00, NULL, 1),
    (17, 4, 'Grilled Vegetable Pizza', 'Short description of the dish.', 345.00, NULL, 1),
    (18, 4, 'Pumpkin Shrimp Pizza', 'Short description of the dish.', 385.00, NULL, 1),
    (19, 4, 'Grilled Chicken & Hummus Pizza', 'Short description of the dish.', 360.00, NULL, 1),
    (20, 4, 'Hawaiian Pizza', 'Short description of the dish.', 350.00, NULL, 1),
    (21, 4, 'Palagitik (Duck) Pizza', 'Short description of the dish.', 350.00, NULL, 1),
    (22, 5, 'Lomi Overload', 'Good for 3-4 pax.', 350.00, NULL, 1),
    (23, 5, 'Pansit Palabok Platter', 'Good for 3-4 pax.', 280.00, NULL, 1),
    (24, 5, 'Pansit Musiko', 'Good for 3-4 pax.', 280.00, NULL, 1),
    (25, 5, 'Bihon con Lechon', 'Good for 3-4 pax.', 305.00, NULL, 1),
    (26, 5, 'Lasagna with Garlic Bread', 'Single order.', 150.00, NULL, 1),
    (27, 5, 'Creamy Chicken Carbonara with Toasted Bread', 'Single order.', 250.00, NULL, 1),
    (28, 6, 'Fruit Platter', 'Short description of the dish.', 250.00, NULL, 1),
    (29, 6, 'Coco Halo-Halo', 'Short description of the dish.', 150.00, NULL, 1),
    (30, 6, 'Coco Halo-Halo (Small)', 'Short description of the dish.', 120.00, NULL, 1),
    (31, 6, 'Turon de Crema', 'Short description of the dish.', 150.00, NULL, 1),
    (32, 6, 'Leche Flan', 'Short description of the dish.', 120.00, NULL, 1),
    (33, 6, 'Creamy Gelatin', 'Short description of the dish.', 150.00, NULL, 1),
    (34, 6, 'Bibingka', 'Short description of the dish.', 150.00, NULL, 1),
    (35, 6, 'Puto Bumbong', 'Short description of the dish.', 150.00, NULL, 1),
    (36, 7, 'Caesar Salad', 'Classic salad made with crisp romaine lettuce, crunchy croutons, Parmesan cheese, and creamy Caesar dressing.', 250.00, NULL, 1),
    (37, 7, 'Fresh Garden Salad', 'Fresh lettuce and fruits harvest from our aquaponics farm served with cheese or bignay sauce.', 250.00, NULL, 1),
    (38, 7, 'Laing na Gabi with Shrimp', 'Creamy taro leaves simmered in coconut milk and spices, topped with tender shrimp.', 345.00, NULL, 1),
    (39, 7, 'Chopsuey', 'A vibrant stir-fried Chinoy vegetable dish that is cooked with a medley of crispy vegetables and tender meat and seafood.', 250.00, NULL, 1),
    (40, 7, 'Talong Binagoongan', 'Grilled eggplant with shrimp paste and coconut sauce one of our best seller.', 175.00, NULL, 1),
    (41, 8, 'Bulalo', 'Filipino boiled soup made with bones, beef shank, corn, and pechay leaves.', 450.00, NULL, 1),
    (42, 8, 'Sinigang na Tanigue', 'One of the varieties of fish sinigang is characterized by its sour and savory taste.', 359.00, NULL, 1),
    (43, 8, 'Sinigang na Hipon', 'A delightful spin on our cherished Filipino sour soup, crafted with succulent shrimp and infused with tangy essence of tamarind.', 359.00, NULL, 1),
    (44, 8, 'Bean Soup in Bread Bowl', 'Made with sautéed mushrooms, cream, garlic, shallots, and herbs. Served hot inside a fresh sourdough bread bowl.', 195.00, NULL, 1),
    (45, 8, 'Mushroom Soup', 'Classic creamy soup with mushroom, garlic, shallot and herbs. Good for 3-4 pax.', 195.00, NULL, 1),
    (46, 9, 'Lechon Kawali or Crispy Pata', 'Short description of the dish.', 850.00, NULL, 1),
    (47, 9, 'Palagitik Native Duck', 'Golden-skinned native duck slowly braised in coconut milk, bay leaves, and peppercorns, then finished by frying or reducing the sauce.', 450.00, NULL, 1),
    (48, 9, 'Chicken Tinupig', 'Short description of the dish.', 400.00, NULL, 1),
    (49, 9, 'Beef Caldereta', 'A hearty beef simmered in rich tomato sauce, potato, liver paste and bell pepper.', 395.00, NULL, 1),
    (50, 9, 'Sizzling Sisig', 'Short description of the dish.', 325.00, NULL, 1),
    (51, 9, 'Crispy Pork Kare-Kare', 'Meat and vegetable stew in peanut sauce that uses lechon meat.', 385.00, NULL, 1),
    (52, 10, 'Seafood Kare-Kare', 'Fresh prawns, squid and fish in a rich peanut sauce with vegetables.', 850.00, NULL, 1),
    (53, 10, 'Relyenong Bangus', 'Milkfish deboned flaked, stuffed with savory and fried.', 319.00, NULL, 1),
    (54, 10, 'Palagitik Hito', 'Slow cooked tender catfish in savory garlic-soy vinegar adobo until dry and caramelized, with crispy edges.', 299.00, NULL, 1),
    (55, 10, 'Sweet & Sour Fish', 'Crispy fried fish in a vibrant sweet and sour sauce with bell pepper and onions.', 750.00, NULL, 1),
    (56, 10, 'Fortune Hotpot', 'Premium Chinese hotpot with thinly sliced beef, fresh seafood, vegetables, and meatballs simmered in rich broth.', 350.00, NULL, 1),
    (57, 11, 'All Star Pizza Bundle', 'Choose a pizza: Palagitik Pizza (House Special) or Hawaiian Pizza, with Half Chicken Tinupig. Choose Creamy Chicken Carbonara or Pansit Palabok Platter (Best Seller). Choose Nachos or Lumpiang Shanghai, with Cucumber Pitcher. Perfect for 4-6 people.', 1499.00, NULL, 1),
    (58, 11, 'Signature Pamilya Bundle', 'Whole Chicken Tinupig, Lechon Kare-Kare, Rice Platter, and Turon de Crema with Ice Cream. Good for 5 pax.', 999.00, NULL, 1),
    (59, 11, 'Fisherman''s Choice', 'Crispy Fried Bangus, Inihaw na Liempo, Inihaw na Talong, Crispy Fillet Fingers, Grilled Chicken, and Steamed Egg & Okra. Good for 5 pax.', 790.00, NULL, 1),
    (60, 12, 'Tsokolate de Batirol', 'Short description of the dish.', 160.00, NULL, 1),
    (61, 12, 'Caramel Macchiato', 'Short description of the dish.', 149.00, NULL, 1),
    (62, 12, 'Cafe Latte', 'Short description of the dish.', 129.00, NULL, 1),
    (63, 12, 'Cappuccino', 'Short description of the dish.', 120.00, NULL, 1),
    (64, 12, 'Cafe Americano', 'Short description of the dish.', 95.00, NULL, 1),
    (65, 12, 'Espresso', 'Short description of the dish.', 60.00, NULL, 1),
    (66, 13, 'Gac Juice Pitcher (Seasonal)', 'Short description of the dish.', 150.00, NULL, 0),
    (67, 13, 'Ice Tea or Cucumber Pitcher', 'Short description of the dish.', 149.00, NULL, 1),
    (68, 13, 'Cucumber and Pineapple Detox', 'Short description of the dish.', 125.00, NULL, 1),
    (69, 13, 'Mango Shake', 'Short description of the dish.', 120.00, NULL, 1),
    (70, 13, 'Buko Shake', 'Short description of the dish.', 120.00, NULL, 1),
    (71, 13, 'Coke in Can', 'Short description of the dish.', 85.00, NULL, 1),
    (72, 13, 'Cucumber Juice', 'Short description of the dish.', 75.00, NULL, 1),
    (73, 13, 'Ice Tea Juice', 'Short description of the dish.', 75.00, NULL, 1),
    (74, 14, 'Affogato Coffee', 'Short description of the dish.', 160.00, NULL, 1),
    (75, 14, 'Matcha Ube Latte', 'Short description of the dish.', 149.00, NULL, 1),
    (76, 14, 'Matcha Pistachio Latte', 'Short description of the dish.', 135.00, NULL, 1),
    (77, 14, 'Salted Caramel Macchiato', 'Short description of the dish.', 149.00, NULL, 1),
    (78, 14, 'Fruit in Season Shake', 'Short description of the dish.', 140.00, NULL, 1),
    (79, 14, 'Iced Latte / Cappuccino', 'Short description of the dish.', 149.00, NULL, 1),
    (80, 14, 'Spanish Latte', 'Short description of the dish.', 149.00, NULL, 1),
    (81, 14, 'Iced Americano', 'Short description of the dish.', 100.00, NULL, 1),
    (82, 15, 'Fundador Light 1L', 'Short description of the dish.', 800.00, NULL, 1),
    (83, 15, 'Alfonso Light 1L', 'Short description of the dish.', 795.00, NULL, 1),
    (84, 15, 'Emperador Light 1L', 'Short description of the dish.', 299.00, NULL, 1),
    (85, 15, 'San Miguel Light 330 mL', 'Short description of the dish.', 70.00, NULL, 1),
    (86, 15, 'San Miguel Apple 330 mL', 'Short description of the dish.', 70.00, NULL, 1),
    (87, 15, 'Red Horse 330 mL', 'Short description of the dish.', 70.00, NULL, 1),
    (88, 15, 'San Miguel Pilsen 330 mL', 'Short description of the dish.', 70.00, NULL, 1),
    (89, 16, 'Mango Daiquiri', 'Short description of the dish.', 220.00, NULL, 1),
    (90, 16, 'Mojito', 'Short description of the dish.', 160.00, NULL, 1),
    (91, 16, 'Margarita', 'Short description of the dish.', 150.00, NULL, 1),
    (92, 16, 'Shirley Temple', 'Short description of the dish.', 120.00, NULL, 1),
    (93, 16, 'Blow Job', 'Short description of the dish.', 100.00, NULL, 1);

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
    (1, 2, NULL, 'preparing', 926.00, 'unpaid', '2026-01-01 12:00:00'),
    (2, 5, NULL, 'served', 250.00, 'paid', '2026-01-01 12:30:00');

INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price, notes) VALUES
    (1, 1, 1, 2, 285.00, NULL),
    (2, 1, 4, 1, 356.00, 'No onions'),
    (3, 2, 2, 1, 250.00, NULL);

INSERT INTO payments (payment_id, order_id, reservation_id, received_by, method, provider_reference, amount, status, paid_at) VALUES
    (1, 2, NULL, 2, 'cash', NULL, 250.00, 'paid', '2026-01-01 13:00:00');

INSERT INTO restaurant_settings (setting_id, restaurant_name, address, contact_number, email, facebook_url, logo_url) VALUES
    (1, 'Vencio''s Garden', '#08 Nautical Highway, Tawiran, Calapan City, Oriental Mindoro', '0918 957 2855', 'venciosgarden@yahoo.com', 'https://www.facebook.com/venciosgardenhotel', NULL);

INSERT INTO opening_hours (day_of_week, open_time, close_time, is_open) VALUES
    (0, '10:00:00', '22:00:00', 1),
    (1, '10:00:00', '22:00:00', 1),
    (2, '10:00:00', '22:00:00', 1),
    (3, '10:00:00', '22:00:00', 1),
    (4, '10:00:00', '22:00:00', 1),
    (5, '10:00:00', '22:00:00', 1),
    (6, '10:00:00', '22:00:00', 1);
