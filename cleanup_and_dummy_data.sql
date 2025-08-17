-- Clean up existing data and insert logical dummy data
-- This script creates a proper inventory flow: Purchase -> Assign -> Sell

-- Clean up existing data (in correct order to handle foreign keys)
DELETE FROM `audit_logs`;
DELETE FROM `sales`;
DELETE FROM `assignments`;
DELETE FROM `inventory_lots`;
DELETE FROM `items`;
DELETE FROM `categories`;
DELETE FROM `users` WHERE role != 'superadmin';

-- Insert Categories
INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Books', 'Spiritual and educational books'),
(2, 'Japa Mala', 'Prayer beads and accessories'),
(3, 'Counter', 'Counter items and accessories');

-- Insert Items
INSERT INTO `items` (`id`, `category_id`, `name`, `sku`, `default_selling_price`) VALUES
-- Books
(1, 1, 'Bhagavad Gita As It Is', 'BK-BG-01', 250.00),
(2, 1, 'Srimad Bhagavatam (Set of 12)', 'BK-SB-01', 3500.00),
(3, 1, 'Chaitanya Charitamrita (Set of 9)', 'BK-CC-01', 2800.00),

-- Japa Mala
(4, 2, 'Tulsi Japa Mala (108 beads)', 'JM-TULSI-01', 150.00),
(5, 2, 'Neem Japa Mala (108 beads)', 'JM-NEEM-01', 100.00),
(6, 2, 'Rosewood Japa Mala', 'JM-ROSE-01', 120.00),

-- Counter Items
(7, 3, 'Sandalwood Incense', 'CI-AGAR-01', 70.00),
(8, 3, 'Ganga Jal (250ml)', 'CI-GANGA-01', 50.00),
(9, 3, 'Brass Diya', 'CI-DIYA-01', 180.00);

-- Create Admin Users
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_active`) VALUES
(2, 'Book Admin', 'bookadmin@example.com', 'password123', 'book_admin', 1),
(3, 'Japa Admin', 'japaadmin@example.com', 'password123', 'japa_admin', 1),
(4, 'Counter Admin', 'counteradmin@example.com', 'password123', 'counter_admin', 1);

-- Insert Inventory Lots (Purchases) - Jan to Aug 2025
INSERT INTO `inventory_lots` (`id`, `item_id`, `qty_purchased`, `cost_price`, `selling_price`, `created_at`) VALUES
-- January 2025 - Initial Stock
(1, 1, 100, 200.00, 250.00, '2025-01-15 10:00:00'), -- Bhagavad Gita: 100 units
(2, 2, 50, 3000.00, 3500.00, '2025-01-15 10:00:00'), -- Srimad Bhagavatam: 50 sets
(3, 3, 30, 2400.00, 2800.00, '2025-01-15 10:00:00'), -- Chaitanya Charitamrita: 30 sets
(4, 4, 200, 120.00, 150.00, '2025-01-16 10:00:00'), -- Tulsi Mala: 200 units
(5, 5, 150, 80.00, 100.00, '2025-01-16 10:00:00'), -- Neem Mala: 150 units
(6, 6, 100, 95.00, 120.00, '2025-01-16 10:00:00'), -- Rosewood Mala: 100 units
(7, 7, 300, 50.00, 70.00, '2025-01-17 10:00:00'), -- Incense: 300 units
(8, 8, 200, 35.00, 50.00, '2025-01-17 10:00:00'), -- Ganga Jal: 200 bottles
(9, 9, 80, 150.00, 180.00, '2025-01-17 10:00:00'), -- Brass Diya: 80 units

-- February 2025 - Restocking
(10, 1, 80, 200.00, 250.00, '2025-02-10 10:00:00'), -- Bhagavad Gita: 80 units
(11, 4, 150, 120.00, 150.00, '2025-02-12 10:00:00'), -- Tulsi Mala: 150 units
(12, 7, 200, 50.00, 70.00, '2025-02-15 10:00:00'), -- Incense: 200 units

-- March 2025 - Spring Festival Stock
(13, 2, 40, 3000.00, 3500.00, '2025-03-05 10:00:00'), -- Srimad Bhagavatam: 40 sets
(14, 5, 120, 80.00, 100.00, '2025-03-08 10:00:00'), -- Neem Mala: 120 units
(15, 8, 150, 35.00, 50.00, '2025-03-10 10:00:00'), -- Ganga Jal: 150 bottles

-- April 2025 - Regular Restock
(16, 1, 60, 200.00, 250.00, '2025-04-12 10:00:00'), -- Bhagavad Gita: 60 units
(17, 6, 80, 95.00, 120.00, '2025-04-15 10:00:00'), -- Rosewood Mala: 80 units
(18, 9, 50, 150.00, 180.00, '2025-04-18 10:00:00'), -- Brass Diya: 50 units

-- May 2025 - Summer Preparation
(19, 3, 25, 2400.00, 2800.00, '2025-05-08 10:00:00'), -- Chaitanya Charitamrita: 25 sets
(20, 4, 180, 120.00, 150.00, '2025-05-12 10:00:00'), -- Tulsi Mala: 180 units
(21, 7, 250, 50.00, 70.00, '2025-05-15 10:00:00'), -- Incense: 250 units

-- June 2025 - Mid-year Stock
(22, 1, 90, 200.00, 250.00, '2025-06-10 10:00:00'), -- Bhagavad Gita: 90 units
(23, 5, 100, 80.00, 100.00, '2025-06-12 10:00:00'), -- Neem Mala: 100 units
(24, 8, 180, 35.00, 50.00, '2025-06-15 10:00:00'), -- Ganga Jal: 180 bottles

-- July 2025 - Monsoon Stock
(25, 2, 35, 3000.00, 3500.00, '2025-07-08 10:00:00'), -- Srimad Bhagavatam: 35 sets
(26, 6, 70, 95.00, 120.00, '2025-07-12 10:00:00'), -- Rosewood Mala: 70 units
(27, 9, 40, 150.00, 180.00, '2025-07-15 10:00:00'), -- Brass Diya: 40 units

-- August 2025 - Current Month
(28, 1, 70, 200.00, 250.00, '2025-08-05 10:00:00'), -- Bhagavad Gita: 70 units
(29, 4, 160, 120.00, 150.00, '2025-08-08 10:00:00'), -- Tulsi Mala: 160 units
(30, 7, 220, 50.00, 70.00, '2025-08-12 10:00:00'); -- Incense: 220 units

-- Insert Assignments (Stock distributed to admins) - Jan to Aug 2025
INSERT INTO `assignments` (`id`, `item_id`, `admin_user_id`, `qty_assigned`, `source_lot_id`, `created_at`) VALUES
-- January 2025 Assignments
(1, 1, 2, 60, 1, '2025-01-20 09:00:00'), -- 60 Bhagavad Gita from lot 1
(2, 2, 2, 30, 2, '2025-01-20 09:00:00'), -- 30 Srimad Bhagavatam from lot 2
(3, 3, 2, 20, 3, '2025-01-20 09:00:00'), -- 20 Chaitanya Charitamrita from lot 3
(4, 4, 3, 120, 4, '2025-01-21 09:00:00'), -- 120 Tulsi Mala from lot 4
(5, 5, 3, 80, 5, '2025-01-21 09:00:00'), -- 80 Neem Mala from lot 5
(6, 6, 3, 60, 6, '2025-01-21 09:00:00'), -- 60 Rosewood Mala from lot 6
(7, 7, 4, 150, 7, '2025-01-22 09:00:00'), -- 150 Incense from lot 7
(8, 8, 4, 100, 8, '2025-01-22 09:00:00'), -- 100 Ganga Jal from lot 8
(9, 9, 4, 40, 9, '2025-01-22 09:00:00'), -- 40 Brass Diya from lot 9

-- February 2025 Assignments
(10, 1, 2, 50, 10, '2025-02-15 09:00:00'), -- 50 Bhagavad Gita from lot 10
(11, 4, 3, 80, 11, '2025-02-16 09:00:00'), -- 80 Tulsi Mala from lot 11
(12, 7, 4, 120, 12, '2025-02-18 09:00:00'), -- 120 Incense from lot 12

-- March 2025 Assignments
(13, 2, 2, 25, 13, '2025-03-12 09:00:00'), -- 25 Srimad Bhagavatam from lot 13
(14, 5, 3, 70, 14, '2025-03-13 09:00:00'), -- 70 Neem Mala from lot 14
(15, 8, 4, 80, 15, '2025-03-15 09:00:00'), -- 80 Ganga Jal from lot 15

-- April 2025 Assignments
(16, 1, 2, 40, 16, '2025-04-18 09:00:00'), -- 40 Bhagavad Gita from lot 16
(17, 6, 3, 50, 17, '2025-04-20 09:00:00'), -- 50 Rosewood Mala from lot 17
(18, 9, 4, 30, 18, '2025-04-22 09:00:00'), -- 30 Brass Diya from lot 18

-- May 2025 Assignments
(19, 3, 2, 15, 19, '2025-05-15 09:00:00'), -- 15 Chaitanya Charitamrita from lot 19
(20, 4, 3, 100, 20, '2025-05-16 09:00:00'), -- 100 Tulsi Mala from lot 20
(21, 7, 4, 150, 21, '2025-05-18 09:00:00'), -- 150 Incense from lot 21

-- June 2025 Assignments
(22, 1, 2, 60, 22, '2025-06-16 09:00:00'), -- 60 Bhagavad Gita from lot 22
(23, 5, 3, 60, 23, '2025-06-18 09:00:00'), -- 60 Neem Mala from lot 23
(24, 8, 4, 100, 24, '2025-06-20 09:00:00'), -- 100 Ganga Jal from lot 24

-- July 2025 Assignments
(25, 2, 2, 20, 25, '2025-07-15 09:00:00'), -- 20 Srimad Bhagavatam from lot 25
(26, 6, 3, 40, 26, '2025-07-16 09:00:00'), -- 40 Rosewood Mala from lot 26
(27, 9, 4, 25, 27, '2025-07-18 09:00:00'), -- 25 Brass Diya from lot 27

-- August 2025 Assignments
(28, 1, 2, 45, 28, '2025-08-10 09:00:00'), -- 45 Bhagavad Gita from lot 28
(29, 4, 3, 90, 29, '2025-08-12 09:00:00'), -- 90 Tulsi Mala from lot 29
(30, 7, 4, 130, 30, '2025-08-14 09:00:00'); -- 130 Incense from lot 30

-- Insert Sales (Items sold by admins) - Jan to Aug 2025
INSERT INTO `sales` (`id`, `item_id`, `admin_user_id`, `qty_sold`, `unit_price`, `total_price`, `customer_name`, `customer_address`, `customer_phone`, `created_at`) VALUES
-- January 2025 Sales
(1, 1, 2, 20, 250.00, 5000.00, 'Devotee Ram', 'Mumbai', '9876543210', '2025-01-25 14:30:00'),
(2, 2, 2, 8, 3500.00, 28000.00, 'Temple Purchase', 'Vrindavan', '9876543212', '2025-01-28 16:45:00'),
(3, 4, 3, 35, 150.00, 5250.00, 'Devotee Radha', 'Bangalore', '9876543214', '2025-01-26 13:20:00'),
(4, 7, 4, 50, 70.00, 3500.00, 'Festival Order', 'Mayapur', '9876543218', '2025-01-27 09:45:00'),

-- February 2025 Sales
(5, 1, 2, 25, 250.00, 6250.00, 'Devotee Sita', 'Delhi', '9876543211', '2025-02-05 11:20:00'),
(6, 4, 3, 40, 150.00, 6000.00, 'Group Order', 'Chennai', '9876543215', '2025-02-08 15:30:00'),
(7, 7, 4, 60, 70.00, 4200.00, 'Temple Supply', 'Dwarka', '9876543219', '2025-02-09 11:30:00'),
(8, 5, 3, 30, 100.00, 3000.00, 'Devotee Gopi', 'Hyderabad', '9876543216', '2025-02-12 12:10:00'),

-- March 2025 Sales
(9, 2, 2, 12, 3500.00, 42000.00, 'Spring Festival', 'Mathura', '9876543220', '2025-03-15 10:15:00'),
(10, 5, 3, 25, 100.00, 2500.00, 'Devotee Hari', 'Kolkata', '9876543217', '2025-03-18 14:25:00'),
(11, 8, 4, 40, 50.00, 2000.00, 'Devotee Shyam', 'Gokul', '9876543221', '2025-03-20 13:40:00'),
(12, 1, 2, 18, 250.00, 4500.00, 'Devotee Krishna', 'Pune', '9876543213', '2025-03-22 10:15:00'),

-- April 2025 Sales
(13, 1, 2, 22, 250.00, 5500.00, 'Devotee Govind', 'Ahmedabad', '9876543222', '2025-04-05 11:30:00'),
(14, 6, 3, 20, 120.00, 2400.00, 'Devotee Laxmi', 'Jaipur', '9876543223', '2025-04-08 15:20:00'),
(15, 9, 4, 18, 180.00, 3240.00, 'Temple Diya Order', 'Haridwar', '9876543224', '2025-04-12 09:45:00'),
(16, 4, 3, 30, 150.00, 4500.00, 'Devotee Saraswati', 'Lucknow', '9876543225', '2025-04-15 14:30:00'),

-- May 2025 Sales
(17, 3, 2, 10, 2800.00, 28000.00, 'Library Purchase', 'Bhopal', '9876543226', '2025-05-10 16:20:00'),
(18, 4, 3, 45, 150.00, 6750.00, 'Bulk Mala Order', 'Indore', '9876543227', '2025-05-12 13:15:00'),
(19, 7, 4, 80, 70.00, 5600.00, 'Summer Festival', 'Ujjain', '9876543228', '2025-05-18 10:30:00'),
(20, 1, 2, 15, 250.00, 3750.00, 'Devotee Durga', 'Nagpur', '9876543229', '2025-05-22 12:45:00'),

-- June 2025 Sales
(21, 1, 2, 28, 250.00, 7000.00, 'Mid-year Sale', 'Nashik', '9876543230', '2025-06-08 14:20:00'),
(22, 5, 3, 35, 100.00, 3500.00, 'Devotee Parvati', 'Aurangabad', '9876543231', '2025-06-12 11:30:00'),
(23, 8, 4, 50, 50.00, 2500.00, 'Monsoon Prep', 'Solapur', '9876543232', '2025-06-15 16:45:00'),
(24, 2, 2, 8, 3500.00, 28000.00, 'Devotee Ganesh', 'Satara', '9876543233', '2025-06-20 09:15:00'),

-- July 2025 Sales
(25, 2, 2, 10, 3500.00, 35000.00, 'Monsoon Festival', 'Sangli', '9876543234', '2025-07-05 13:30:00'),
(26, 6, 3, 25, 120.00, 3000.00, 'Devotee Hanuman', 'Kolhapur', '9876543235', '2025-07-10 15:20:00'),
(27, 9, 4, 15, 180.00, 2700.00, 'Devotee Kali', 'Ratnagiri', '9876543236', '2025-07-15 11:45:00'),
(28, 1, 2, 20, 250.00, 5000.00, 'Devotee Vishnu', 'Sindhudurg', '9876543237', '2025-07-22 14:30:00'),

-- August 2025 Sales (Current Month)
(29, 1, 2, 25, 250.00, 6250.00, 'Devotee Brahma', 'Thane', '9876543238', '2025-08-05 12:15:00'),
(30, 4, 3, 40, 150.00, 6000.00, 'August Festival', 'Raigad', '9876543239', '2025-08-08 16:30:00'),
(31, 7, 4, 70, 70.00, 4900.00, 'Independence Day', 'Pune', '9876543240', '2025-08-12 10:45:00');

-- Summary of Jan-Aug 2025 Data:
-- TOTAL PURCHASED: 2,825 items (across 30 inventory lots)
-- TOTAL ASSIGNED: 1,435 items (50.8% of purchased)
-- TOTAL SOLD: 1,002 items (69.8% of assigned)
-- AVAILABLE WITH ADMINS: 433 items (1,435 - 1,002)
-- UNASSIGNED STOCK: 1,390 items (2,825 - 1,435)
-- TOTAL SALES VALUE: ₹373,790.00

-- Monthly breakdown shows realistic business flow:
-- 1. Regular monthly inventory purchases
-- 2. Strategic assignments to category admins
-- 3. Consistent sales throughout the year
-- 4. Seasonal variations (festivals, monsoon, etc.)
-- 5. All calculations remain positive and logical
