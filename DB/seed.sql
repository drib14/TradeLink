-- ============================================================================
-- TradeLink MySQL 8.0 Seed Data Script
-- Platform: University of Cebu Student Marketplace (tradelink_db_test)
-- Default initial admin seed configuration
-- ============================================================================

USE `tradelink_db_test`;

SET FOREIGN_KEY_CHECKS = 0;

-- Using DELETE FROM ensures phpMyAdmin will NEVER throw foreign key error #1701
DELETE FROM `review_badges`;
DELETE FROM `reviews`;
DELETE FROM `favorites`;
DELETE FROM `notifications`;
DELETE FROM `messages`;
DELETE FROM `conversation_read_status`;
DELETE FROM `conversations`;
DELETE FROM `meetup_transactions`;
DELETE FROM `swap_offers`;
DELETE FROM `wanted_requests`;
DELETE FROM `listing_tags`;
DELETE FROM `listing_images`;
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
('user-admin', 'UC Administrator', 'admin@uc.edu.ph', '000001', '$2a$10$MTBYkvSLtxJ5HSsqQia0auj5CZu.WoSDpRufXg4eqtsc8aDeItX2S', 'admin', 'UC Main', 'CCS', 'Faculty / Staff', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 100, 5.0, 0, 0, 100, 'Official TradeLink Campus Moderation & Safety Desk. Verified student marketplace.', 0, 0);

-- ----------------------------------------------------------------------------
-- 2. SEED CAMPUS ANNOUNCEMENTS
-- ----------------------------------------------------------------------------

INSERT INTO `announcements` (`id`, `title`, `message`, `campus`, `type`, `author_id`, `author_name`, `is_active`) VALUES
('ann-1', 'Guarded Meetup Reminder', 'Always meet inside official UC campus security gates during daytime hours. Inspect items before scanning the Handshake QR code.', 'All', 'alert', 'user-admin', 'UC Administration', 1),
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
  'maxImagesPerListing', 5,
  'swapModeEnabled', true,
  'wantedBoardEnabled', true,
  'freeDonationEnabled', true,
  'maxListingsPerUser', 20
), 'user-admin');

INSERT INTO `feature_flags` (`id`, `name`, `description`, `enabled`) VALUES
('ff-1', 'Price Advisor AI', 'Enable AI-powered pricing suggestions', 1),
('ff-2', 'Campus Map', 'Interactive campus meetup map', 1),
('ff-3', 'Pro Merchant Badge', 'Allow pro merchant status for top sellers', 1),
('ff-4', 'Dark Mode', 'Dark mode toggle for all users', 1);

SET FOREIGN_KEY_CHECKS = 1;
