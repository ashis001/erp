-- Add the password column to the users table if it doesn't exist.
-- This file contains the initial data to seed the database for the RoleStock ERP application.
-- Run these commands after creating the tables with schema.sql.

-- Create a Superadmin User (if you haven't already)
-- This is the main administrator account.
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_active`) VALUES
(1, 'Super Admin', 'superadmin@example.com', 'superadmin', 'superadmin', 1)
ON DUPLICATE KEY UPDATE name='Super Admin';

-- Create Categories
-- These are the high-level groups for your inventory items.
INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Books', 'Spiritual and educational books'),
(2, 'Clothing', 'Robes, t-shirts, and other apparel'),
(3, 'Accessories', 'Japa beads, bags, and other items')
ON DUPLICATE KEY UPDATE name=name; -- Do nothing if id exists

-- Truncate items table to remove old data before inserting new data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `items`;
SET FOREIGN_KEY_CHECKS = 1;

-- Create Items
-- These are the specific products within each category.
INSERT INTO `items` (`id`, `category_id`, `name`, `sku`, `default_selling_price`) VALUES
-- Books
(1, 1, 'Bhagavad Gita As It Is', 'BK-BG-01', 250.00),
(2, 1, 'Srimad Bhagavatam (Set of 12 Cantos)', 'BK-SB-01', 3500.00),
(3, 1, 'Chaitanya Charitamrita (Set of 9 Volumes)', 'BK-CC-01', 2800.00),
(4, 1, 'The Nectar of Devotion', 'BK-NOD-01', 200.00),

-- Japa Mala
(5, 2, 'Tulsi Japa Mala (108 beads)', 'JM-TULSI-01', 150.00),
(6, 2, 'Neem Japa Mala (108 beads)', 'JM-NEEM-01', 100.00),
(7, 2, 'Rosewood Japa Mala', 'JM-ROSE-01', 120.00),

-- Counter Items
(8, 3, 'Sandalwood Agarbatti (Incense)', 'CI-AGAR-01', 70.00),
(9, 3, 'Ganga Jal (250ml Bottle)', 'CI-GANGA-01', 50.00),
(10, 3, 'Brass Diya (Oil Lamp)', 'CI-DIYA-01', 180.00),
(11, 3, 'Small Gaura-Nitai Deities', 'CI-DEITY-GN-01', 600.00)
ON DUPLICATE KEY UPDATE name=VALUES(name), sku=VALUES(sku), default_selling_price=VALUES(default_selling_price);

-- You can now log into the application. The default user switcher will show the "Super Admin" account.
-- From there, you can add more admin users and manage inventory.
-- Create credit_sales table
CREATE TABLE IF NOT EXISTS credit_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  admin_id INT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  down_payment DECIMAL(10, 2) NOT NULL,
  payment_type ENUM('emi', 'pay_later') DEFAULT 'emi',
  emi_periods INT NOT NULL,
  pay_later_date DATE NULL,
  pending_balance DECIMAL(10, 2) NOT NULL,
  monthly_emi DECIMAL(10, 2) NOT NULL,
  status ENUM('active', 'completed', 'defaulted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Create credit_payments table
CREATE TABLE IF NOT EXISTS credit_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  credit_sale_id INT NOT NULL,
  payment_number INT NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  payment_date TIMESTAMP NULL,
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credit_sale_id) REFERENCES credit_sales(id)
);

-- Add phone number column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT '99999999';

-- Update existing users with default phone number
UPDATE users SET phone = '99999999' WHERE phone IS NULL OR phone = '';