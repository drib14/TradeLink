-- ============================================================================
-- TradeLink MySQL 8.0 Full Production Schema DDL
-- Platform: University of Cebu Student-to-Student Marketplace & Barter System
-- Database: tradelink_db_test / tradelink_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `tradelink_db_test` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `tradelink_db_test`;

-- Disable foreign key checks for clean teardown and recreation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user_favorites`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `security_events`;
DROP TABLE IF EXISTS `review_badges`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `swap_offers`;
DROP TABLE IF EXISTS `flash_requests`;
DROP TABLE IF EXISTS `listing_variations`;
DROP TABLE IF EXISTS `listing_views`;
DROP TABLE IF EXISTS `listing_media`;
DROP TABLE IF EXISTS `listings`;
DROP TABLE IF EXISTS `verification_requests`;
DROP TABLE IF EXISTS `flagged_listings`;
DROP TABLE IF EXISTS `trade_disputes`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `admin_audit_logs`;
DROP TABLE IF EXISTS `prohibited_keywords`;
DROP TABLE IF EXISTS `password_reset_requests`;
DROP TABLE IF EXISTS `feature_flags`;
DROP TABLE IF EXISTS `system_config`;
DROP TABLE IF EXISTS `users`;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `student_id` BIGINT UNSIGNED NOT NULL UNIQUE,
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
  `department` VARCHAR(100) NOT NULL,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `id_photo_url` VARCHAR(255) DEFAULT NULL,
  `trust_score` TINYINT UNSIGNED NOT NULL DEFAULT 60,
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  `total_reviews` INT UNSIGNED NOT NULL DEFAULT 0,
  `completed_trades` INT UNSIGNED NOT NULL DEFAULT 0,
  `punctuality_rate` TINYINT UNSIGNED NOT NULL DEFAULT 100,
  `bio` TEXT DEFAULT NULL,
  `is_banned` BOOLEAN NOT NULL DEFAULT FALSE,
  `ban_reason` VARCHAR(255) DEFAULT NULL,
  `banned_at` DATETIME DEFAULT NULL,
  `warnings_count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `refresh_token_hash` VARCHAR(255) DEFAULT NULL,
  `reset_code_hash` VARCHAR(255) DEFAULT NULL,
  `reset_code_exp` DATETIME DEFAULT NULL,
  `failed_login_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` DATETIME DEFAULT NULL,
  `token_version` INT UNSIGNED NOT NULL DEFAULT 1,
  `failed_reset_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `password_changed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_users_campus` (`campus`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_trust_score` (`trust_score`),
  INDEX `idx_users_locked_until` (`locked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. LISTINGS TABLE
-- ----------------------------------------------------------------------------
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
    'Lightly Used',
    'Well Used',
    'Heavily Used',
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
  `department` VARCHAR(100) DEFAULT NULL,
  `accepted_payment_methods` VARCHAR(255) NOT NULL DEFAULT 'cash,gcash,maya',
  `status` ENUM('active', 'reserved', 'sold', 'swapped', 'donated', 'archived', 'banned') NOT NULL DEFAULT 'active',
  `views_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  `total_reviews` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_listings_seller_status` (`seller_id`, `status`),
  INDEX `idx_listings_campus` (`campus`),
  INDEX `idx_listings_category` (`category`),
  INDEX `idx_listings_status_created` (`status`, `created_at`),
  INDEX `idx_listings_status_campus` (`status`, `campus`, `created_at`),
  INDEX `idx_listings_status_cat` (`status`, `category`, `created_at`),
  INDEX `idx_listings_trade_mode` (`trade_mode`),
  INDEX `idx_listings_created_at` (`created_at`),
  FULLTEXT `ft_listings_title` (`title`),
  FULLTEXT `ft_listings_description` (`description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. LISTING MEDIA TABLE (Images and Video Samples)
-- ----------------------------------------------------------------------------
CREATE TABLE `listing_media` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `media_url` VARCHAR(255) NOT NULL,
  `media_type` ENUM('image', 'video') NOT NULL DEFAULT 'image',
  `thumbnail_url` VARCHAR(255) DEFAULT NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
  `display_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  INDEX `idx_listing_media_listing` (`listing_id`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. LISTING UNIQUE VIEWS TABLE (Owner Exclusion & Deduplication)
-- ----------------------------------------------------------------------------
CREATE TABLE `listing_views` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `viewer_identifier` VARCHAR(128) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY `uniq_listing_viewer` (`listing_id`, `viewer_identifier`),
  CONSTRAINT `fk_listing_views_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. LISTING VARIATIONS TABLE (Sizes, Editions, Multi-Item Options)
-- ----------------------------------------------------------------------------
CREATE TABLE `listing_variations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `price` DECIMAL(10,2) DEFAULT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `image_index` INT UNSIGNED DEFAULT 0,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_variations_listing` (`listing_id`),
  CONSTRAINT `fk_variations_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. FLASH MARKET REQUESTS TABLE (Urgent Buy/Sell/Swap Requests)
-- ----------------------------------------------------------------------------
CREATE TABLE `flash_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `requester_id` VARCHAR(36) NOT NULL,
  `item_name` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
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
  `image_url` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('open', 'fulfilled', 'cancelled', 'expired') NOT NULL DEFAULT 'open',
  `offers_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `duration_hours` INT UNSIGNED NOT NULL DEFAULT 24,
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_flash_requester` (`requester_id`),
  INDEX `idx_flash_campus` (`target_campus`),
  INDEX `idx_flash_status` (`status`),
  INDEX `idx_flash_expires` (`status`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. SWAP OFFERS / BARTER PROPOSALS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `swap_offers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `proposer_id` VARCHAR(36) NOT NULL,
  `offered_item_title` VARCHAR(200) NOT NULL,
  `offered_item_description` TEXT DEFAULT NULL,
  `offered_item_image` VARCHAR(255) DEFAULT NULL,
  `offered_listing_id` VARCHAR(36) DEFAULT NULL,
  `cash_adjustment` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `adjustment_type` ENUM('none', 'proposer_adds_cash', 'proposer_requests_cash') NOT NULL DEFAULT 'none',
  `selected_variation` VARCHAR(150) DEFAULT NULL,
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
-- 8. TRANSACTIONS TABLE (Student Purchases, Swaps & Donations)
-- ----------------------------------------------------------------------------
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
  `selected_variation` VARCHAR(150) DEFAULT NULL,
  `variation_id` VARCHAR(36) DEFAULT NULL,
  `verification_code_hash` VARCHAR(255) DEFAULT NULL,
  `failed_handshake_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `handshake_locked_until` DATETIME DEFAULT NULL,
  `handshake_code_sent_at` DATETIME DEFAULT NULL,
  `buyer_confirmed_at` DATETIME DEFAULT NULL,
  `seller_confirmed_at` DATETIME DEFAULT NULL,
  `handshake_completed_at` DATETIME DEFAULT NULL,
  `completion_override_by` VARCHAR(36) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `cancelled_at` DATETIME DEFAULT NULL,
  `cancellation_reason` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`swap_offer_id`) REFERENCES `swap_offers` (`id`) ON DELETE SET NULL,
  INDEX `idx_tx_listing` (`listing_id`),
  INDEX `idx_tx_buyer_status` (`buyer_id`, `status`),
  INDEX `idx_tx_seller_status` (`seller_id`, `status`),
  INDEX `idx_tx_status` (`status`),
  INDEX `idx_tx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. CONVERSATIONS TABLE
-- ----------------------------------------------------------------------------
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

  `conversation_key` VARCHAR(160) GENERATED ALWAYS AS (
    CONCAT(`user_one_id`, ':', `user_two_id`, ':', COALESCE(`listing_id`, 'none'), ':', COALESCE(`flash_request_id`, 'none'))
  ) STORED,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`flash_request_id`) REFERENCES `flash_requests` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_one_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_two_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_conv_key` (`conversation_key`),
  INDEX `idx_conv_user_one_last` (`user_one_id`, `last_message_at`),
  INDEX `idx_conv_user_two_last` (`user_two_id`, `last_message_at`),
  INDEX `idx_conv_listing` (`listing_id`),
  INDEX `idx_conv_flash` (`flash_request_id`),
  INDEX `idx_conv_last_message_at` (`last_message_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. MESSAGES TABLE (With Media Attachments & Direct Context Links)
-- ----------------------------------------------------------------------------
CREATE TABLE `messages` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `receiver_id` VARCHAR(36) NOT NULL,
  `content` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_system_message` BOOLEAN NOT NULL DEFAULT FALSE,
  `media_url` VARCHAR(255) DEFAULT NULL,
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
  INDEX `idx_msg_conv_created` (`conversation_id`, `created_at`),
  INDEX `idx_messages_receiver_read` (`receiver_id`, `is_read`),
  INDEX `idx_messages_sender` (`sender_id`),
  INDEX `idx_messages_swap` (`swap_offer_id`),
  INDEX `idx_messages_transaction` (`transaction_id`),
  INDEX `idx_messages_flash` (`flash_request_id`),
  INDEX `idx_messages_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. PRODUCT REVIEWS TABLE (Item Reviews & Ratings)
-- ----------------------------------------------------------------------------
CREATE TABLE `reviews` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `reviewer_id` VARCHAR(36) NOT NULL,
  `transaction_id` VARCHAR(36) DEFAULT NULL,
  `target_user_id` VARCHAR(36) DEFAULT NULL,
  `rating` TINYINT UNSIGNED NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT DEFAULT NULL,
  `badges` JSON DEFAULT (JSON_ARRAY()),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE SET NULL,
  INDEX `idx_reviews_listing` (`listing_id`),
  INDEX `idx_reviews_reviewer` (`reviewer_id`),
  INDEX `idx_reviews_target_created` (`target_user_id`, `created_at`),
  INDEX `idx_reviews_transaction` (`transaction_id`),
  INDEX `idx_reviews_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. STUDENT ID VERIFICATION REQUESTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `verification_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `student_id_number` BIGINT UNSIGNED NOT NULL,
  `id_photo_url` VARCHAR(255) NOT NULL,
  `selfie_photo_url` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `confidence_score` INT UNSIGNED NOT NULL DEFAULT 100,
  `is_suspicious` BOOLEAN NOT NULL DEFAULT FALSE,
  `suspicious_reasons` TEXT DEFAULT NULL,
  `credential_diagnostics` TEXT DEFAULT NULL,
  `id_photo_hash` VARCHAR(64) DEFAULT NULL,
  `selfie_photo_hash` VARCHAR(64) DEFAULT NULL,
  `verification_method` VARCHAR(50) NOT NULL DEFAULT 'admin_kyc',
  `rejection_reason` VARCHAR(255) DEFAULT NULL,
  `reviewed_by` VARCHAR(36) DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_verif_user` (`user_id`),
  INDEX `idx_verif_student_id` (`student_id_number`),
  INDEX `idx_verif_reviewer` (`reviewed_by`),
  INDEX `idx_verif_status` (`status`),
  INDEX `idx_verif_suspicious` (`is_suspicious`),
  INDEX `idx_verif_photo_hash` (`id_photo_hash`),
  INDEX `idx_verif_selfie_hash` (`selfie_photo_hash`),
  INDEX `idx_verif_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. FLAGGED LISTINGS / MODERATION REPORTS TABLE
-- ----------------------------------------------------------------------------
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
  FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_flag_listing` (`listing_id`),
  INDEX `idx_flag_reporter` (`reporter_id`),
  INDEX `idx_flag_reviewer` (`reviewed_by`),
  INDEX `idx_flag_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. TRADE DISPUTES TABLE
-- ----------------------------------------------------------------------------
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
  FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_disputes_trans` (`transaction_id`),
  INDEX `idx_disputes_resolver` (`resolved_by`),
  INDEX `idx_disputes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. CAMPUS ANNOUNCEMENTS BULLETIN TABLE
-- ----------------------------------------------------------------------------
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
  `author_id` VARCHAR(36) DEFAULT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_ann_campus` (`campus`),
  INDEX `idx_ann_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. ADMIN AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `admin_audit_logs` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `admin_id` VARCHAR(36) DEFAULT NULL,
  `admin_name` VARCHAR(100) DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(50) NOT NULL,
  `target_id` VARCHAR(36) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_audit_admin` (`admin_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. PROHIBITED KEYWORDS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `prohibited_keywords` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `keyword` VARCHAR(100) NOT NULL UNIQUE,
  `added_by` VARCHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_keywords_added_by` (`added_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. SYSTEM CONFIGURATION
-- ----------------------------------------------------------------------------
CREATE TABLE `system_config` (
  `config_key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `config_value` JSON NOT NULL,
  `last_updated_by` VARCHAR(100) NOT NULL DEFAULT 'system',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. FEATURE FLAGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `feature_flags` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. PASSWORD RESET REQUESTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `password_reset_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `status` ENUM('pending', 'sent', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  `code_hash` VARCHAR(255) DEFAULT NULL,
  `code_exp` DATETIME DEFAULT NULL,
  `reviewed_by` VARCHAR(36) DEFAULT NULL,
  `admin_note` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reviewed_at` DATETIME DEFAULT NULL,

  INDEX `idx_pw_reset_user_id` (`user_id`),
  INDEX `idx_pw_reset_reviewer` (`reviewed_by`),
  INDEX `idx_pw_reset_status` (`status`),
  CONSTRAINT `fk_pw_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pw_reset_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 21. SECURITY EVENTS AUDIT LOG TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `security_events` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `event_type` VARCHAR(100) NOT NULL,
  `severity` ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
  `user_id` VARCHAR(36) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_security_event_type` (`event_type`),
  INDEX `idx_security_severity` (`severity`),
  INDEX `idx_security_user_id` (`user_id`),
  INDEX `idx_security_created_at` (`created_at`),
  CONSTRAINT `fk_security_events_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 22. NOTIFICATIONS TABLE (Student System & In-App Activity Notifications)
-- ----------------------------------------------------------------------------
CREATE TABLE `notifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `data` JSON DEFAULT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_notifications_user_read` (`user_id`, `is_read`),
  INDEX `idx_notifications_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 23. USER FAVORITES TABLE (Saved / Watchlist Listings)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_favorites` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `listing_id` VARCHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_listing_favorite` (`user_id`, `listing_id`),
  INDEX `idx_favorites_listing` (`listing_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;
