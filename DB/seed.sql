-- ============================================================================
-- TradeLink MySQL 8.0 Clean Production Seed Script
-- Platform: University of Cebu Student Marketplace & Barter Hub
-- Note: Seeds ONLY the official administrator account, baseline safety rules,
-- announcements, and prohibited keywords. Zero mock students, zero mock products.
-- ============================================================================

-- If executing locally or on a dedicated instance, select your database:
-- CREATE DATABASE IF NOT EXISTS `tradelink_db_test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `tradelink_db_test`;

SET FOREIGN_KEY_CHECKS = 0;

-- Clean truncate / delete in reverse dependency order
DELETE FROM `review_badges`;
DELETE FROM `reviews`;
DELETE FROM `messages`;
DELETE FROM `conversations`;
DELETE FROM `transactions`;
DELETE FROM `swap_offers`;
DELETE FROM `flash_requests`;
DELETE FROM `wanted_requests` WHERE EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wanted_requests');
DELETE FROM `listing_media`;
DELETE FROM `listings`;
DELETE FROM `verification_requests`;
DELETE FROM `flagged_listings`;
DELETE FROM `trade_disputes`;
DELETE FROM `announcements`;
DELETE FROM `admin_audit_logs`;
DELETE FROM `prohibited_keywords`;
DELETE FROM `password_reset_requests`;
DELETE FROM `feature_flags`;
DELETE FROM `system_config`;
DELETE FROM `newsletter_subscribers` WHERE EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'newsletter_subscribers');
DELETE FROM `users`;

-- ----------------------------------------------------------------------------
-- 1. SECURITY COLUMNS COMPATIBILITY CHECK
-- ----------------------------------------------------------------------------
SET @dbname = DATABASE();
SET @tablename = "users";

-- token_version
SET @colname = "token_version";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  "ALTER TABLE `users` ADD COLUMN `token_version` INT UNSIGNED NOT NULL DEFAULT 1"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- failed_login_attempts
SET @colname = "failed_login_attempts";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  "ALTER TABLE `users` ADD COLUMN `failed_login_attempts` INT UNSIGNED NOT NULL DEFAULT 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- locked_until
SET @colname = "locked_until";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  "ALTER TABLE `users` ADD COLUMN `locked_until` DATETIME DEFAULT NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- failed_reset_attempts
SET @colname = "failed_reset_attempts";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  "ALTER TABLE `users` ADD COLUMN `failed_reset_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- password_changed_at
SET @colname = "password_changed_at";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  "ALTER TABLE `users` ADD COLUMN `password_changed_at` DATETIME DEFAULT NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ----------------------------------------------------------------------------
-- 2. SEED ADMINISTRATOR ACCOUNT ONLY (No Student Users, No Products)
-- ----------------------------------------------------------------------------
-- Password: TradeLink@2026 (Bcrypt 12 rounds: $2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS)
-- Login Email: uc.tradelink@gmail.com
-- Admin ID: ADMIN001

INSERT INTO `users` (
  `id`, `name`, `email`, `student_id`, `password_hash`, `role`, `campus`, `college`, `year_level`,
  `avatar_url`, `is_verified`, `id_photo_url`, `trust_score`, `rating`, `total_reviews`,
  `completed_trades`, `punctuality_rate`, `bio`, `is_pro_merchant`, `is_banned`, `token_version`
) VALUES (
  'user-admin',
  'UC Campus Moderation',
  'uc.tradelink@gmail.com',
  'ADMIN001',
  '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS',
  'admin',
  'UC Main',
  'CCS',
  'Faculty / Staff',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  1,
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
  100,
  5.0,
  0,
  0,
  100,
  'Official University of Cebu Campus Moderation & Safety Desk. Direct peer-to-peer student verification.',
  0,
  0,
  1
);

-- ----------------------------------------------------------------------------
-- 3. SEED CAMPUS ANNOUNCEMENTS
-- ----------------------------------------------------------------------------

INSERT INTO `announcements` (`id`, `title`, `message`, `campus`, `type`, `author_id`, `author_name`, `is_active`) VALUES
('ann-1', 'Official Campus Safety Trading Protocol', 'All student exchanges must be scheduled at guarded campus hubs (canteen, campus library entrance, or student center) during operational school hours. Always inspect items before concluding transactions.', 'All', 'alert', 'user-admin', 'UC Moderation Desk', 1),
('ann-2', 'Midterm Examination Academic Resource Desk Active', 'Students seeking calculators, reviewers, and engineering supplies can use Flash Market for urgent same-day peer requests across all 8 University of Cebu campuses.', 'All', 'info', 'user-admin', 'UC Moderation Desk', 1),
('ann-3', 'High School Textbook & PE Gear Swap Portal Live', 'TradeLink now fully supports textbook exchanges for UC PRI and UC South Campus basic education students with zero platform fees.', 'UC PRI', 'info', 'user-admin', 'Campus Coordinator', 1);

-- ----------------------------------------------------------------------------
-- 4. SEED ADMIN AUDIT LOGS
-- ----------------------------------------------------------------------------

INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `admin_name`, `action`, `target_type`, `target_id`, `details`, `ip_address`) VALUES
('log-1', 'user-admin', 'UC Campus Moderation', 'Platform Initialized', 'system', 'system', 'Production safety desk and KYC verification queues initialized for University of Cebu network.', '127.0.0.1');

-- ----------------------------------------------------------------------------
-- 5. SEED PROHIBITED SAFETY KEYWORDS
-- ----------------------------------------------------------------------------

INSERT INTO `prohibited_keywords` (`id`, `keyword`, `added_by`) VALUES
('kw-1', 'exam leak', 'user-admin'),
('kw-2', 'test bank', 'user-admin'),
('kw-3', 'test paper', 'user-admin'),
('kw-4', 'midterm answer', 'user-admin'),
('kw-5', 'final exam key', 'user-admin'),
('kw-6', 'vape', 'user-admin'),
('kw-7', 'pod', 'user-admin'),
('kw-8', 'cigarette', 'user-admin'),
('kw-9', 'smoke', 'user-admin'),
('kw-10', 'counterfeit uniform', 'user-admin'),
('kw-11', 'fake id', 'user-admin'),
('kw-12', 'liquor', 'user-admin'),
('kw-13', 'beer', 'user-admin'),
('kw-14', 'gambling', 'user-admin'),
('kw-15', 'weapon', 'user-admin'),
('kw-16', 'knife', 'user-admin'),
('kw-17', 'proxy test', 'user-admin');

-- ----------------------------------------------------------------------------
-- 6. SEED SYSTEM CONFIGURATION & FEATURE FLAGS
-- ----------------------------------------------------------------------------

INSERT INTO `system_config` (`config_key`, `config_value`, `last_updated_by`) VALUES
('platform_rules', JSON_OBJECT(
  'maintenanceMode', false,
  'maxListingPrice', 50000,
  'maxImagesPerListing', 10,
  'swapModeEnabled', true,
  'flashMarketEnabled', true,
  'freeDonationEnabled', true,
  'maxListingsPerUser', 25
), 'user-admin');

INSERT INTO `feature_flags` (`id`, `name`, `description`, `enabled`) VALUES
('ff-1', 'Campus Fair Price Guide', 'Standard campus student resale valuation', 1),
('ff-2', 'Direct Student Chat', 'Peer-to-peer student messaging connected to listings and flash requests', 1),
('ff-3', 'Campus Swap Desk', 'Allow item-for-item barter swaps across all UC campuses', 1),
('ff-4', 'Flash Market Board', 'Urgent same-day buy, sell, and donation board', 1);

SET FOREIGN_KEY_CHECKS = 1;
