-- ============================================================================
-- TradeLink MySQL 8.0 Full Schema DDL
-- Platform: University of Cebu Student-to-Student Marketplace & Barter System
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `tradelink_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `tradelink_db`;

-- Disable foreign key checks for table creation/resets
SET FOREIGN_KEY_CHECKS = 0;

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
  `role` ENUM('student', 'admin', 'superadmin') NOT NULL DEFAULT 'student',
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
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `original_srp` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `trade_mode` ENUM('buy_sell', 'swap', 'free_donation') NOT NULL DEFAULT 'buy_sell',
  `swap_preference` VARCHAR(300) DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL,
  `condition` ENUM(
    'Brand New',
    'Like New',
    'Gently Used',
    'Fair / Academic Usable'
  ) NOT NULL DEFAULT 'Gently Used',
  `seller_id` VARCHAR(36) NOT NULL,
  `preferred_meetup_spots` JSON DEFAULT NULL,
  `custom_meetup_spot` VARCHAR(200) DEFAULT NULL,
  `is_boosted` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_sold` BOOLEAN NOT NULL DEFAULT FALSE,
  `course_code` VARCHAR(30) DEFAULT NULL,
  `views` INT UNSIGNED NOT NULL DEFAULT 0,
  `favorites_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_listings_seller` (`seller_id`),
  INDEX `idx_listings_category` (`category`),
  INDEX `idx_listings_trade_mode` (`trade_mode`),
  INDEX `idx_listings_is_boosted` (`is_boosted`),
  INDEX `idx_listings_is_sold` (`is_sold`),
  INDEX `idx_listings_created` (`created_at` DESC),
  FULLTEXT INDEX `ft_listings_search` (`title`, `description`, `category`, `course_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. LISTING IMAGES TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `listing_images`;
CREATE TABLE `listing_images` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  INDEX `idx_images_listing` (`listing_id`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. LISTING TAGS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `listing_tags`;
CREATE TABLE `listing_tags` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `tag` VARCHAR(50) NOT NULL,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  INDEX `idx_tags_listing` (`listing_id`),
  INDEX `idx_tags_tag` (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. CONVERSATIONS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `participant_a` VARCHAR(36) NOT NULL,
  `participant_b` VARCHAR(36) NOT NULL,
  `last_message` TEXT DEFAULT NULL,
  `last_message_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`participant_a`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`participant_b`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_conversation_listing_users` (`listing_id`, `participant_a`, `participant_b`),
  INDEX `idx_conv_participant_a` (`participant_a`),
  INDEX `idx_conv_participant_b` (`participant_b`),
  INDEX `idx_conv_last_message_at` (`last_message_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. CONVERSATION READ STATUS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `conversation_read_status`;
CREATE TABLE `conversation_read_status` (
  `conversation_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `unread_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `last_read_at` DATETIME DEFAULT NULL,

  PRIMARY KEY (`conversation_id`, `user_id`),
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. MESSAGES TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `receiver_id` VARCHAR(36) NOT NULL,
  `content` TEXT NOT NULL,
  `is_system_message` BOOLEAN NOT NULL DEFAULT FALSE,
  `swap_offer_id` VARCHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_msg_conversation_created` (`conversation_id`, `created_at`),
  INDEX `idx_msg_receiver` (`receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. SWAP OFFERS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `swap_offers`;
CREATE TABLE `swap_offers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `target_listing_id` VARCHAR(36) NOT NULL,
  `target_seller_id` VARCHAR(36) NOT NULL,
  `offerer_id` VARCHAR(36) NOT NULL,
  `offered_listing_id` VARCHAR(36) DEFAULT NULL,
  `offered_description` TEXT NOT NULL,
  `cash_top_up` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'accepted', 'declined', 'completed') NOT NULL DEFAULT 'pending',
  `proposed_meetup_spot` VARCHAR(200) NOT NULL,
  `proposed_datetime` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`target_listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`offerer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`offered_listing_id`) REFERENCES `listings` (`id`) ON DELETE SET NULL,
  INDEX `idx_swap_target_listing` (`target_listing_id`),
  INDEX `idx_swap_target_seller` (`target_seller_id`),
  INDEX `idx_swap_offerer` (`offerer_id`),
  INDEX `idx_swap_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. MEETUP TRANSACTIONS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `meetup_transactions`;
CREATE TABLE `meetup_transactions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `seller_id` VARCHAR(36) NOT NULL,
  `buyer_id` VARCHAR(36) NOT NULL,
  `trade_mode` ENUM('buy_sell', 'swap', 'free_donation') NOT NULL DEFAULT 'buy_sell',
  `final_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `swap_summary` VARCHAR(500) DEFAULT NULL,
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
  `landmark_spot` VARCHAR(200) NOT NULL,
  `scheduled_datetime` VARCHAR(100) NOT NULL,
  `verification_code_hash` VARCHAR(255) NOT NULL,
  `plain_verification_code` VARCHAR(10) NOT NULL, -- Stored for party viewing while pending
  `status` ENUM('scheduled', 'on_the_way', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  `notes` TEXT DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_meetup_seller` (`seller_id`),
  INDEX `idx_meetup_buyer` (`buyer_id`),
  INDEX `idx_meetup_campus` (`campus`),
  INDEX `idx_meetup_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. WANTED REQUESTS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `wanted_requests`;
CREATE TABLE `wanted_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `requester_id` VARCHAR(36) NOT NULL,
  `item_title` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `target_budget` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `urgency` ENUM('Immediate / Urgent', 'This Week', 'Flexible') NOT NULL DEFAULT 'This Week',
  `description` TEXT NOT NULL,
  `preferred_campus` ENUM(
    'UC Main',
    'UC Banilad',
    'UC LM',
    'UC METC',
    'UC Pardo-Talisay',
    'UC South Campus',
    'UC Medical Center',
    'UC PRI'
  ) NOT NULL,
  `status` ENUM('open', 'fulfilled') NOT NULL DEFAULT 'open',
  `offers_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_wanted_requester` (`requester_id`),
  INDEX `idx_wanted_campus` (`preferred_campus`),
  INDEX `idx_wanted_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. REVIEWS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `transaction_id` VARCHAR(36) NOT NULL,
  `reviewer_id` VARCHAR(36) NOT NULL,
  `target_user_id` VARCHAR(36) NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL DEFAULT 5,
  `comment` TEXT DEFAULT NULL,
  `item_title` VARCHAR(200) NOT NULL,
  `trade_type` VARCHAR(50) NOT NULL,
  `was_punctual` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`transaction_id`) REFERENCES `meetup_transactions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_review_transaction_reviewer` (`transaction_id`, `reviewer_id`),
  INDEX `idx_review_target` (`target_user_id`),
  INDEX `idx_review_reviewer` (`reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. REVIEW TRAIT BADGES TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `review_badges`;
CREATE TABLE `review_badges` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `review_id` VARCHAR(36) NOT NULL,
  `badge` VARCHAR(50) NOT NULL,

  FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  INDEX `idx_badges_review` (`review_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. FAVORITES TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `user_id` VARCHAR(36) NOT NULL,
  `listing_id` VARCHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`user_id`, `listing_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  INDEX `idx_fav_listing` (`listing_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('swap', 'meetup', 'price_drop', 'wanted_response', 'system') NOT NULL DEFAULT 'system',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `link_view` VARCHAR(100) DEFAULT NULL,
  `link_params` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_notif_user_read` (`user_id`, `is_read`),
  INDEX `idx_notif_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. VERIFICATION REQUESTS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `verification_requests`;
CREATE TABLE `verification_requests` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `student_id_number` VARCHAR(30) NOT NULL,
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
  `id_card_image_url` VARCHAR(500) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` DATETIME DEFAULT NULL,
  `reviewed_by` VARCHAR(36) DEFAULT NULL,
  `reject_reason` VARCHAR(500) DEFAULT NULL,

  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_verif_status` (`status`),
  INDEX `idx_verif_submitted` (`submitted_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. FLAGGED LISTINGS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `flagged_listings`;
CREATE TABLE `flagged_listings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `listing_id` VARCHAR(36) NOT NULL,
  `reporter_id` VARCHAR(36) NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'resolved', 'removed') NOT NULL DEFAULT 'pending',
  `reported_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_by` VARCHAR(36) DEFAULT NULL,
  `resolution_note` VARCHAR(500) DEFAULT NULL,

  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_flag_status` (`status`),
  INDEX `idx_flag_reported` (`reported_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. CAMPUS ANNOUNCEMENTS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `campus` VARCHAR(50) NOT NULL DEFAULT 'All',
  `type` ENUM('info', 'alert', 'event') NOT NULL DEFAULT 'info',
  `author_id` VARCHAR(36) NOT NULL,
  `author_name` VARCHAR(100) NOT NULL DEFAULT 'UC Administration',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_ann_campus` (`campus`),
  INDEX `idx_ann_active` (`is_active`),
  INDEX `idx_ann_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. ADMIN AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `admin_audit_logs`;
CREATE TABLE `admin_audit_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `admin_id` VARCHAR(36) NOT NULL,
  `admin_name` VARCHAR(100) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_type` ENUM('user', 'listing', 'verification', 'wanted', 'meetup', 'announcement', 'dispute', 'system') NOT NULL,
  `target_id` VARCHAR(100) NOT NULL,
  `details` TEXT NOT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_audit_admin` (`admin_id`),
  INDEX `idx_audit_target` (`target_type`, `target_id`),
  INDEX `idx_audit_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. TRADE DISPUTES TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `trade_disputes`;
CREATE TABLE `trade_disputes` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `transaction_id` VARCHAR(36) DEFAULT NULL,
  `listing_title` VARCHAR(200) NOT NULL,
  `buyer_id` VARCHAR(36) NOT NULL,
  `buyer_name` VARCHAR(100) NOT NULL,
  `seller_id` VARCHAR(36) NOT NULL,
  `seller_name` VARCHAR(100) NOT NULL,
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
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  `verdict_note` TEXT DEFAULT NULL,
  `verdict_action` ENUM('refund', 'warning', 'dismissed', 'ban') DEFAULT NULL,
  `resolved_by` VARCHAR(36) DEFAULT NULL,
  `filed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME DEFAULT NULL,

  FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_dispute_status` (`status`),
  INDEX `idx_dispute_campus` (`campus`),
  INDEX `idx_dispute_filed` (`filed_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. PROHIBITED KEYWORDS TABLE
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
-- 21. SUPERADMIN SYSTEM CONFIGURATION
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config` (
  `config_key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `config_value` JSON NOT NULL,
  `last_updated_by` VARCHAR(100) NOT NULL DEFAULT 'system',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 22. FEATURE FLAGS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `feature_flags`;
CREATE TABLE `feature_flags` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(300) DEFAULT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
