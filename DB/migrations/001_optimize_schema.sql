-- ============================================================================
-- Migration: 001_optimize_schema.sql
-- Description: TradeLink Database Optimization & Standardization
-- 1. Correct syntax types (VARCHAR(300) -> VARCHAR(255))
-- 2. Expand listings.condition ENUM to support all 7 grades from client UI
-- 3. Fix conversations NULL-semantics uniqueness using a stored generated key
-- 4. Add foreign key constraint to security_events.user_id
-- 5. Consolidate review_badges into reviews.badges JSON column
-- 6. Clean up redundant denormalized columns & low-selectivity indexes
-- 7. Create notifications and user_favorites tables
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Correct syntax & ENUM types
ALTER TABLE `feature_flags` 
  MODIFY COLUMN `description` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `listings`
  MODIFY COLUMN `condition` ENUM(
    'Brand New',
    'Like New',
    'Gently Used',
    'Lightly Used',
    'Well Used',
    'Heavily Used',
    'Fair / Academic Usable'
  ) NOT NULL DEFAULT 'Gently Used';

ALTER TABLE `messages`
  MODIFY COLUMN `media_url` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `verification_requests`
  MODIFY COLUMN `id_photo_url` VARCHAR(255) NOT NULL,
  MODIFY COLUMN `selfie_photo_url` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `password_reset_requests`
  MODIFY COLUMN `admin_note` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `security_events`
  MODIFY COLUMN `user_agent` VARCHAR(255) DEFAULT NULL;

-- 2. Security Events: Add foreign key constraint
ALTER TABLE `security_events`
  ADD CONSTRAINT `fk_security_events_user` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- 3. Conversations: Deterministic uniqueness for NULLable listing_id & flash_request_id
-- Add stored virtual column and index
ALTER TABLE `conversations`
  DROP INDEX `uk_conv_participants`,
  ADD COLUMN `conversation_key` VARCHAR(160) GENERATED ALWAYS AS (
    CONCAT(`user_one_id`, ':', `user_two_id`, ':', COALESCE(`listing_id`, 'none'), ':', COALESCE(`flash_request_id`, 'none'))
  ) STORED,
  ADD UNIQUE KEY `uk_conv_key` (`conversation_key`);

-- 4. Consolidate Reviews Badges
-- Add badges JSON column to reviews
ALTER TABLE `reviews`
  ADD COLUMN `badges` JSON DEFAULT (JSON_ARRAY()) AFTER `comment`;

-- Migrate existing badges if review_badges table exists
UPDATE `reviews` r
SET r.badges = (
  SELECT JSON_ARRAYAGG(rb.badge)
  FROM `review_badges` rb
  WHERE rb.review_id = r.id
)
WHERE EXISTS (
  SELECT 1 FROM `review_badges` rb WHERE rb.review_id = r.id
);

-- Drop review_badges table
DROP TABLE IF EXISTS `review_badges`;

-- 5. Remove redundant denormalized columns
-- admin_audit_logs.admin_name can be queried via JOIN users.name
ALTER TABLE `admin_audit_logs`
  DROP COLUMN `admin_name`;

-- transactions.selected_variation is redundant with variation_id
ALTER TABLE `transactions`
  DROP COLUMN `selected_variation`;

-- 6. Remove redundant / low-selectivity indexes
ALTER TABLE `listings`
  DROP INDEX `idx_listings_status`;

ALTER TABLE `transactions`
  DROP INDEX `idx_tx_buyer`,
  DROP INDEX `idx_tx_seller`;

ALTER TABLE `users`
  DROP INDEX `idx_users_is_banned`;

-- 7. Create Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
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

-- 8. Create User Favorites / Saved Items Table
CREATE TABLE IF NOT EXISTS `user_favorites` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `listing_id` VARCHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_listing_favorite` (`user_id`, `listing_id`),
  INDEX `idx_favorites_user` (`user_id`),
  INDEX `idx_favorites_listing` (`listing_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
