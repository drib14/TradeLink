-- ============================================================================
-- TradeLink MySQL 8.0 Seed Data Script
-- Platform: University of Cebu Student Marketplace (tradelink_db_test)
-- Default initial admin seed configuration
-- ============================================================================

USE `tradelink_db_test`;

SET FOREIGN_KEY_CHECKS = 0;

-- Using DELETE FROM ensures phpMyAdmin / MySQL will not throw foreign key errors
DELETE FROM `review_badges`;
DELETE FROM `reviews`;
DELETE FROM `messages`;
DELETE FROM `conversations`;
DELETE FROM `transactions`;
DELETE FROM `swap_offers`;
DELETE FROM `flash_requests`;
DELETE FROM `wanted_requests`;
DELETE FROM `listing_media`;
DELETE FROM `listings`;
DELETE FROM `verification_requests`;
DELETE FROM `flagged_listings`;
DELETE FROM `trade_disputes`;
DELETE FROM `announcements`;
DELETE FROM `admin_audit_logs`;
DELETE FROM `prohibited_keywords`;
DELETE FROM `feature_flags`;
DELETE FROM `system_config`;
DELETE FROM `users`;

-- ----------------------------------------------------------------------------
-- 1. SEED DEFAULT ADMINISTRATOR ACCOUNT
-- ----------------------------------------------------------------------------

INSERT INTO `users` (
  `id`, `name`, `email`, `student_id`, `password_hash`, `role`, `campus`, `college`, `year_level`,
  `avatar_url`, `is_verified`, `id_photo_url`, `trust_score`, `rating`, `total_reviews`,
  `completed_trades`, `punctuality_rate`, `bio`, `is_pro_merchant`, `is_banned`
) VALUES
('user-admin', 'UC Administrator', 'uc.tradelink@gmail.com', 'ADMIN001', '$2a$12$iNnuagaBhzg1dkp1nGKto..HcjqhXJRgztMJ8dcfJPzNrhN9Ps4SG', 'admin', 'UC Main', 'CCS', 'Faculty / Staff', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 100, 5.0, 0, 0, 100, 'Official TradeLink Campus Moderation & Safety Desk. Verified student marketplace.', 0, 0),
('user-student-1', 'Juan Dela Cruz', 'juan.delacruz@uc.edu.ph', '20240001', '$2a$12$iNnuagaBhzg1dkp1nGKto..HcjqhXJRgztMJ8dcfJPzNrhN9Ps4SG', 'student', 'UC Main', 'CCS', '3rd Year', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 85, 5.0, 4, 3, 100, 'BSIT 3rd Year student at UC Main. Regular campus trader.', 0, 0),
('user-student-2', 'Maria Santos', 'maria.santos@uc.edu.ph', '20240002', '$2a$12$iNnuagaBhzg1dkp1nGKto..HcjqhXJRgztMJ8dcfJPzNrhN9Ps4SG', 'student', 'UC Banilad', 'CBA', '2nd Year', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', 0, NULL, 60, 5.0, 0, 0, 100, 'BSBA 2nd Year student at UC Banilad.', 0, 0);

-- ----------------------------------------------------------------------------
-- 2. SEED CAMPUS ANNOUNCEMENTS
-- ----------------------------------------------------------------------------

INSERT INTO `announcements` (`id`, `title`, `message`, `campus`, `type`, `author_id`, `author_name`, `is_active`) VALUES
('ann-1', 'Safe Student Trading Reminder', 'Coordinate trades safely through our direct chat. Always verify items before completing payments.', 'All', 'alert', 'user-admin', 'UC Administration', 1),
('ann-2', 'Junior High & Senior High Trading Desk Live', 'Students from UC PRI and UC South high school departments can now trade textbooks and PE uniforms with zero platform fees.', 'UC PRI', 'info', 'user-admin', 'High School Coordinator', 1);

-- ----------------------------------------------------------------------------
-- 3. SEED ADMIN AUDIT LOGS
-- ----------------------------------------------------------------------------

INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `admin_name`, `action`, `target_type`, `target_id`, `details`, `ip_address`) VALUES
('log-1', 'user-admin', 'UC Administrator', 'Platform Initialized', 'system', 'system', 'Admin desk initialized for University of Cebu campus network', '127.0.0.1');

-- ----------------------------------------------------------------------------
-- 4. SEED PROHIBITED KEYWORDS
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
-- 5. SEED SYSTEM CONFIGURATION & FEATURE FLAGS
-- ----------------------------------------------------------------------------

INSERT INTO `system_config` (`config_key`, `config_value`, `last_updated_by`) VALUES
('platform_rules', JSON_OBJECT(
  'maintenanceMode', false,
  'maxListingPrice', 50000,
  'maxImagesPerListing', 10,
  'swapModeEnabled', true,
  'flashMarketEnabled', true,
  'freeDonationEnabled', true,
  'maxListingsPerUser', 20
), 'user-admin');

INSERT INTO `feature_flags` (`id`, `name`, `description`, `enabled`) VALUES
('ff-1', 'Flash Market', 'Enable urgent campus buy/sell/swap board', 1),
('ff-2', 'Direct Student Chat', 'Enable instant peer-to-peer student messaging', 1),
('ff-3', 'Campus Swap Desk', 'Allow barter and item-for-item swaps', 1);

SET FOREIGN_KEY_CHECKS = 1;
