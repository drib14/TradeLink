-- ============================================================================
-- TradeLink MySQL 8.0 Full Schema DDL
-- Platform: University of Cebu Student-to-Student Marketplace & Barter System
-- Database: tradelink_db_test / tradelink_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `tradelink_db_test` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `tradelink_db_test`;

-- Disable foreign key checks for table creation/resets
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS `review_badges`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `conversation_read_status`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `meetup_transactions`;
DROP TABLE IF EXISTS `swap_offers`;
DROP TABLE IF EXISTS `flash_requests`;
DROP TABLE IF EXISTS `wanted_requests`;
DROP TABLE IF EXISTS `listing_tags`;
DROP TABLE IF EXISTS `listing_images`;
DROP TABLE IF EXISTS `listings`;
DROP TABLE IF EXISTS `verification_requests`;
DROP TABLE IF EXISTS `flagged_listings`;
DROP TABLE IF EXISTS `trade_disputes`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `admin_audit_logs`;
DROP TABLE IF EXISTS `prohibited_keywords`;
DROP TABLE IF EXISTS `feature_flags`;
DROP TABLE IF EXISTS `system_config`;
DROP TABLE IF EXISTS `users`;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `student_id` VARCHAR(20) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  `campus` ENUM(
    'UC Main',
    'UC Banilad',
    'UC LM',
    'UC METC',
    'UC Pardo-Talisay',
    'UC South Campus',
    'UC Medical Center',
    'UC PRI'
  ) NOT NULL,
  `college` VARCHAR(50) NOT NULL,
  `year_level` VARCHAR(50) NOT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `id_photo_url` VARCHAR(500) DEFAULT NULL,
  `trust_score` TINYINT UNSIGNED NOT NULL DEFAULT 60,
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  `total_reviews` INT UNSIGNED NOT NULL DEFAULT 0,
  `completed_trades` INT UNSIGNED NOT NULL DEFAULT 0,
  `punctuality_rate` TINYINT UNSIGNED NOT NULL DEFAULT 100,
  `bio` TEXT DEFAULT NULL,
  `is_pro_merchant` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_banned` BOOLEAN NOT NULL DEFAULT FALSE,
  `ban_reason` VARCHAR(500) DEFAULT NULL,
  `banned_at` DATETIME DEFAULT NULL,
  `warnings_count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `refresh_token_hash` VARCHAR(255) DEFAULT NULL,
  `reset_code_hash` VARCHAR(255) DEFAULT NULL,
  `reset_code_exp` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_users_campus` (`campus`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_student_id` (`student_id`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_trust_score` (`trust_score`),
  INDEX `idx_users_is_banned` (`is_banned`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. LISTINGS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `listings`;
CREATE TABLE `listings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `seller_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `original_srp` DECIMAL(10,2) DEFAULT NULL,
  `trade_mode` ENUM('buy_sell', 'swap', 'free_donation') NOT NULL DEFAULT 'buy_sell',
  `swap_preference` VARCHAR(255) DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL,
  `condition` ENUM(
    'Brand New',
    'Like New',
    'Gently Used',
    'Fair / Academic Usable'
  ) NOT NULL DEFAULT 'Gently Used',
  `campus` ENUM(
    'UC Main',
    'UC Banilad',
    'UC LM',
    'UC METC',
    'UC Pardo-Talisay',
    'UC South Campus',
    'UC Medical Center',
    'UC PRI'
  ) NOT NULL,
  `department` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('active', 'reserved', 'sold', 'swapped', 'donated', 'archived', 'banned') NOT NULL DEFAULT 'active',
  `views_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `featured_until` DATETIME DEFAULT NULL,
  `course_code` VARCHAR(30) DEFAULT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_listings_seller` (`seller_id`),
  INDEX `idx_listings_campus` (`campus`),
  INDEX `idx_listings_category` (`category`),
  INDEX `idx_listings_status` (`status`),
  INDEX `idx_listings_trade_mode` (`trade_mode`),
  INDEX `idx_listings_created_at` (`created_at`),
  FULLTEXT `ft_listings_title` (`title`),
  FULLTEXT `ft_listings_description` (`description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. LISTING MEDIA TABLE (Images and Video Samples)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `listing_images`;
DROP TABLE IF EXISTS `listing_media`;
CREATE TABLE `listing_media` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `media_url` VARCHAR(500) NOT NULL,
  `media_type` ENUM('image', 'video') NOT NULL DEFAULT 'image',
  `thumbnail_url` VARCHAR(500) DEFAULT NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
  `display_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  INDEX `idx_listing_media_listing` (`listing_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. FLASH MARKET REQUESTS TABLE (Urgent Buy/Sell/Swap Requests)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `flash_requests`;
DROP TABLE IF EXISTS `wanted_requests`;
CREATE TABLE `flash_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `requester_id` VARCHAR(36) NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `target_campus` ENUM(
    'UC Main',
    'UC Banilad',
    'UC LM',
    'UC METC',
    'UC Pardo-Talisay',
    'UC South Campus',
    'UC Medical Center',
    'UC PRI'
  ) NOT NULL,
  `urgency` ENUM('immediate', 'this_week', 'flexible') NOT NULL DEFAULT 'flexible',
  `budget_range` VARCHAR(50) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('open', 'fulfilled', 'cancelled', 'expired') NOT NULL DEFAULT 'open',
  `offers_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_flash_requester` (`requester_id`),
  INDEX `idx_flash_campus` (`target_campus`),
  INDEX `idx_flash_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. SWAP OFFERS / BARTER PROPOSALS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `swap_offers`;
CREATE TABLE `swap_offers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `proposer_id` VARCHAR(36) NOT NULL,
  `offered_item_title` VARCHAR(200) NOT NULL,
  `offered_item_description` TEXT DEFAULT NULL,
  `offered_item_image` VARCHAR(500) DEFAULT NULL,
  `offered_listing_id` VARCHAR(36) DEFAULT NULL,
  `cash_adjustment` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `adjustment_type` ENUM('none', 'proposer_adds_cash', 'proposer_requests_cash') NOT NULL DEFAULT 'none',
  `status` ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'cancelled') NOT NULL DEFAULT 'pending',
  `status_note` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`proposer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`offered_listing_id`) REFERENCES `listings` (`id`) ON DELETE SET NULL,
  INDEX `idx_swap_listing` (`listing_id`),
  INDEX `idx_swap_proposer` (`proposer_id`),
  INDEX `idx_swap_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. TRANSACTIONS TABLE (Direct Student Purchases & Swaps)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `meetup_transactions`;
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `reference_no` VARCHAR(32) NOT NULL UNIQUE,
  `listing_id` VARCHAR(36) NOT NULL,
  `buyer_id` VARCHAR(36) NOT NULL,
  `seller_id` VARCHAR(36) NOT NULL,
  `swap_offer_id` VARCHAR(36) DEFAULT NULL,
  `trade_mode` ENUM('buy_sell', 'swap', 'free_donation') NOT NULL DEFAULT 'buy_sell',
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` ENUM('cash', 'gcash', 'maya', 'barter', 'free') NOT NULL DEFAULT 'cash',
  `payment_status` ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  `status` ENUM('pending', 'completed', 'cancelled', 'disputed') NOT NULL DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `cancelled_at` DATETIME DEFAULT NULL,
  `cancellation_reason` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`swap_offer_id`) REFERENCES `swap_offers` (`id`) ON DELETE SET NULL,
  INDEX `idx_tx_ref` (`reference_no`),
  INDEX `idx_tx_listing` (`listing_id`),
  INDEX `idx_tx_buyer` (`buyer_id`),
  INDEX `idx_tx_seller` (`seller_id`),
  INDEX `idx_tx_status` (`status`),
  INDEX `idx_tx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. CONVERSATIONS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `conversation_read_status`;
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) DEFAULT NULL,
  `flash_request_id` VARCHAR(36) DEFAULT NULL,
  `user_one_id` VARCHAR(36) NOT NULL,
  `user_two_id` VARCHAR(36) NOT NULL,
  `last_message` TEXT DEFAULT NULL,
  `last_message_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`flash_request_id`) REFERENCES `flash_requests` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_one_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_two_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_conv_participants` (`user_one_id`, `user_two_id`, `listing_id`),
  INDEX `idx_conv_user_one` (`user_one_id`),
  INDEX `idx_conv_user_two` (`user_two_id`),
  INDEX `idx_conv_listing` (`listing_id`),
  INDEX `idx_conv_flash` (`flash_request_id`),
  INDEX `idx_conv_last_message_at` (`last_message_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. MESSAGES TABLE (With Media Attachments)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `receiver_id` VARCHAR(36) NOT NULL,
  `content` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_system_message` BOOLEAN NOT NULL DEFAULT FALSE,
  `media_url` VARCHAR(500) DEFAULT NULL,
  `media_type` ENUM('image', 'video') DEFAULT NULL,
  `swap_offer_id` VARCHAR(36) DEFAULT NULL,
  `transaction_id` VARCHAR(36) DEFAULT NULL,
  `flash_request_id` VARCHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`swap_offer_id`) REFERENCES `swap_offers` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`flash_request_id`) REFERENCES `flash_requests` (`id`) ON DELETE SET NULL,
  INDEX `idx_messages_conversation` (`conversation_id`),
  INDEX `idx_messages_receiver_read` (`receiver_id`, `is_read`),
  INDEX `idx_messages_sender` (`sender_id`),
  INDEX `idx_messages_swap` (`swap_offer_id`),
  INDEX `idx_messages_transaction` (`transaction_id`),
  INDEX `idx_messages_flash` (`flash_request_id`),
  INDEX `idx_messages_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drop obsolete tables if they exist
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `listing_tags`;

-- ----------------------------------------------------------------------------
-- 9. REVIEWS & TRUST RATINGS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `transaction_id` VARCHAR(36) NOT NULL,
  `reviewer_id` VARCHAR(36) NOT NULL,
  `target_user_id` VARCHAR(36) NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT DEFAULT NULL,
  `trade_type` VARCHAR(50) NOT NULL DEFAULT 'buy_sell',
  `item_title` VARCHAR(200) DEFAULT NULL,
  `was_punctual` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_review_tx_reviewer` (`transaction_id`, `reviewer_id`),
  INDEX `idx_reviews_target` (`target_user_id`),
  INDEX `idx_reviews_reviewer` (`reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. REVIEW BADGES TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `review_badges`;
CREATE TABLE `review_badges` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `review_id` VARCHAR(36) NOT NULL,
  `badge` VARCHAR(50) NOT NULL,

  FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  INDEX `idx_review_badges_review` (`review_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. STUDENT ID VERIFICATION REQUESTS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `verification_requests`;
CREATE TABLE `verification_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `student_id_number` VARCHAR(50) NOT NULL,
  `id_photo_url` VARCHAR(500) NOT NULL,
  `selfie_photo_url` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` VARCHAR(255) DEFAULT NULL,
  `reviewed_by` VARCHAR(36) DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_verif_user` (`user_id`),
  INDEX `idx_verif_status` (`status`),
  INDEX `idx_verif_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. FLAGGED LISTINGS / MODERATION REPORTS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `flagged_listings`;
CREATE TABLE `flagged_listings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `reporter_id` VARCHAR(36) DEFAULT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `status` ENUM('pending', 'reviewed', 'dismissed', 'removed') NOT NULL DEFAULT 'pending',
  `action_taken` VARCHAR(255) DEFAULT NULL,
  `reviewed_by` VARCHAR(36) DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_flag_listing` (`listing_id`),
  INDEX `idx_flag_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. TRADE DISPUTES TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `trade_disputes`;
CREATE TABLE `trade_disputes` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `transaction_id` VARCHAR(36) NOT NULL,
  `complainant_id` VARCHAR(36) NOT NULL,
  `respondent_id` VARCHAR(36) NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `status` ENUM('open', 'under_review', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  `verdict` ENUM('warning_issued', 'account_suspended', 'dismissed', 'amicable_settlement') DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `resolved_by` VARCHAR(36) DEFAULT NULL,
  `resolved_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`complainant_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`respondent_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_disputes_trans` (`transaction_id`),
  INDEX `idx_disputes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. CAMPUS ANNOUNCEMENTS BULLETIN TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `campus` ENUM(
    'All',
    'UC Main',
    'UC Banilad',
    'UC LM',
    'UC METC',
    'UC Pardo-Talisay',
    'UC South Campus',
    'UC Medical Center',
    'UC PRI'
  ) NOT NULL DEFAULT 'All',
  `type` ENUM('info', 'alert', 'event') NOT NULL DEFAULT 'info',
  `author_id` VARCHAR(36) NOT NULL,
  `author_name` VARCHAR(100) NOT NULL DEFAULT 'UC Administration',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_ann_campus` (`campus`),
  INDEX `idx_ann_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. ADMIN AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `admin_audit_logs`;
CREATE TABLE `admin_audit_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `admin_id` VARCHAR(36) NOT NULL,
  `admin_name` VARCHAR(100) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(50) NOT NULL,
  `target_id` VARCHAR(36) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_audit_admin` (`admin_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. PROHIBITED KEYWORDS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `prohibited_keywords`;
CREATE TABLE `prohibited_keywords` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `keyword` VARCHAR(100) NOT NULL UNIQUE,
  `added_by` VARCHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_keyword` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. SYSTEM CONFIGURATION
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config` (
  `config_key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `config_value` JSON NOT NULL,
  `last_updated_by` VARCHAR(100) NOT NULL DEFAULT 'system',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. FEATURE FLAGS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `feature_flags`;
CREATE TABLE `feature_flags` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(300) DEFAULT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. PASSWORD RESET REQUESTS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_requests`;
CREATE TABLE `password_reset_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  `code_hash` VARCHAR(255) DEFAULT NULL,
  `code_exp` DATETIME DEFAULT NULL,
  `reviewed_by` VARCHAR(36) DEFAULT NULL,
  `admin_note` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` DATETIME DEFAULT NULL,

  INDEX `idx_pw_reset_user_id` (`user_id`),
  INDEX `idx_pw_reset_status` (`status`),
  INDEX `idx_pw_reset_email` (`email`),
  CONSTRAINT `fk_pw_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
