-- Create leads table for lead management functionality
CREATE TABLE IF NOT EXISTS `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_user_id` int(11) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `customer_address` text DEFAULT NULL,
  `interested_item_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('new','contacted','interested','converted','lost') NOT NULL DEFAULT 'new',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `follow_up_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  KEY `idx_interested_item_id` (`interested_item_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_follow_up_date` (`follow_up_date`),
  FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`interested_item_id`) REFERENCES `items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample leads for testing (optional)
INSERT INTO `leads` (`admin_user_id`, `customer_name`, `customer_phone`, `customer_email`, `customer_address`, `notes`, `status`, `priority`, `follow_up_date`) VALUES
(2, 'John Doe', '9876543210', 'john.doe@email.com', '123 Main Street, City', 'Interested in religious books, wants to compare prices', 'new', 'medium', '2025-08-25'),
(2, 'Jane Smith', '9876543211', 'jane.smith@email.com', '456 Oak Avenue, Town', 'Looking for Bhagavad Gita set, budget conscious', 'contacted', 'high', '2025-08-23'),
(3, 'Mike Johnson', '9876543212', NULL, NULL, 'Called about bulk purchase for temple', 'interested', 'high', '2025-08-24');
