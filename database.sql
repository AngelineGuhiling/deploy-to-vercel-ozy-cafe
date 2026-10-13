CREATE DATABASE IF NOT EXISTS ozy_cafe;
USE ozy_cafe;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'barista', 'customer') DEFAULT 'customer',
  avatar VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  address VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('coffee', 'dessert') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INT,
  image VARCHAR(500) DEFAULT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  min_stock DECIMAL(10,2) DEFAULT 0,
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255) DEFAULT 'Walk-in',
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  payment_method ENUM('cash', 'gcash', 'card', 'debit', 'digital') DEFAULT 'cash',
  order_type ENUM('dine-in','takeout') DEFAULT 'dine-in',
  delivery_address TEXT DEFAULT NULL,
  delivery_status ENUM('pending','preparing','ready_for_pickup','out_for_delivery','delivered') DEFAULT 'pending',
  driver_lat DECIMAL(10,7) DEFAULT NULL,
  driver_lng DECIMAL(10,7) DEFAULT NULL,
  customer_phone VARCHAR(20) DEFAULT NULL,
  payment_ref VARCHAR(255) DEFAULT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_name VARCHAR(255) DEFAULT 'Ozy Cafe',
  shop_address TEXT,
  shop_phone VARCHAR(20),
  shop_email VARCHAR(255),
  opening_hours VARCHAR(255),
  gcash_number VARCHAR(20) DEFAULT NULL,
  gcash_qr VARCHAR(500) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO settings (shop_name, shop_address, shop_phone, shop_email, opening_hours)
VALUES ('Ozy Cafe', '123 Coffee Street, Manila', '+63 912 345 6789', 'info@ozycafe.com', '8:00 AM - 10:00 PM')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO categories (name, type) VALUES
('Espresso', 'coffee'),
('Latte', 'coffee'),
('Cappuccino', 'coffee'),
('Cold Brew', 'coffee'),
('Specialty', 'coffee'),
('Cakes', 'dessert'),
('Pastries', 'dessert'),
('Cookies', 'dessert')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO menu_items (name, description, price, category_id, image, is_available)
SELECT * FROM (
  SELECT 'Classic Espresso', 'Rich and bold single shot of pure espresso', 56.00, (SELECT id FROM categories WHERE name='Espresso' AND type='coffee'), '/classic espresso.jpg', TRUE
  UNION ALL SELECT 'Double Espresso', 'Double shot for extra energy', 55.00, (SELECT id FROM categories WHERE name='Espresso' AND type='coffee'), '/double espresso.jpg', TRUE
  UNION ALL SELECT 'Vanilla Latte', 'Smooth latte with a touch of vanilla', 60.00, (SELECT id FROM categories WHERE name='Latte' AND type='coffee'), '/vanilla latte.jpg', TRUE
  UNION ALL SELECT 'Caramel Latte', 'Creamy latte with caramel drizzle', 60.00, (SELECT id FROM categories WHERE name='Latte' AND type='coffee'), '/caramel latte.jpg', TRUE
  UNION ALL SELECT 'Cappuccino', 'Classic Italian cappuccino with frothy milk', 60.00, (SELECT id FROM categories WHERE name='Cappuccino' AND type='coffee'), '/cappucinno.jpg', TRUE
  UNION ALL SELECT 'Hazelnut Cappuccino', 'Cappuccino with a warm hazelnut twist', 65.00, (SELECT id FROM categories WHERE name='Cappuccino' AND type='coffee'), '/hazelnut cappuccino.jpg', TRUE
  UNION ALL SELECT 'Iced Cold Brew', 'Smooth 24-hour steeped cold brew', 49.00, (SELECT id FROM categories WHERE name='Cold Brew' AND type='coffee'), '/ice cold brew.jpg', TRUE
  UNION ALL SELECT 'Vanilla Cold Brew', 'Cold brew sweetened with vanilla', 49.00, (SELECT id FROM categories WHERE name='Cold Brew' AND type='coffee'), '/vanilla cold brew.jpg', TRUE
  UNION ALL SELECT 'Caramel Macchiato', 'Espresso with steamed milk and caramel', 39.00, (SELECT id FROM categories WHERE name='Specialty' AND type='coffee'), '/caramel macchiato.jpg', TRUE
  UNION ALL SELECT 'Mocha Supreme', 'Chocolate, espresso, and steamed milk', 70.00, (SELECT id FROM categories WHERE name='Specialty' AND type='coffee'), '/mocha supreme.jpg', TRUE
  UNION ALL SELECT 'Tiramisu Cake', 'Classic Italian coffee-flavored dessert', 75.00, (SELECT id FROM categories WHERE name='Cakes' AND type='dessert'), '/Tiramisu cake.jpg', TRUE
  UNION ALL SELECT 'Cheesecake', 'Creamy New York style cheesecake', 54.97, (SELECT id FROM categories WHERE name='Cakes' AND type='dessert'), '/cheesecake.jpg', TRUE
  UNION ALL SELECT 'Butter Croissant', 'Freshly baked flaky butter croissant', 54.97, (SELECT id FROM categories WHERE name='Pastries' AND type='dessert'), '/butter croissant.jpg', TRUE
  UNION ALL SELECT 'Blueberry Muffin', 'Soft muffin packed with blueberries', 25.00, (SELECT id FROM categories WHERE name='Pastries' AND type='dessert'), '/blueberry muffin.jpg', TRUE
  UNION ALL SELECT 'Chocolate Chip Cookie', 'Warm chewy cookie with chocolate chips', 30.00, (SELECT id FROM categories WHERE name='Cookies' AND type='dessert'), '/chocolate chip cookie.jpg', TRUE
  UNION ALL SELECT 'Oatmeal Raisin Cookie', 'Healthy oats with sweet raisins', 30.00, (SELECT id FROM categories WHERE name='Cookies' AND type='dessert'), '/oatmeal raisin cookie.jpg', TRUE
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM menu_items);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  message VARCHAR(500) NOT NULL,
  type VARCHAR(50) DEFAULT 'order',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  user_id INT,
  customer_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type ENUM('percentage','fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2) DEFAULT 0,
  max_uses INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO promo_codes (code, discount_type, discount_value, min_order, max_uses, expires_at) VALUES
('WELCOME10', 'percentage', 10, 50, 100, '2027-12-31'),
('CAFE50', 'fixed', 50, 200, 50, '2027-12-31'),
('FREESHIP', 'fixed', 30, 100, 20, '2027-12-31');

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) DEFAULT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  check_in DATETIME NOT NULL,
  check_out DATETIME DEFAULT NULL,
  status ENUM('present','late','absent','half_day') DEFAULT 'present',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);