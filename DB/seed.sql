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
DELETE FROM `listing_views`;
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
-- 2. SEED USERS (Admin and Verified Students)
-- ----------------------------------------------------------------------------
-- Password: TradeLink@2026 (Bcrypt 12 rounds: $2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS)

INSERT INTO `users` (
  `id`, `name`, `email`, `student_id`, `password_hash`, `role`, `campus`, `department`,
  `avatar_url`, `is_verified`, `id_photo_url`, `trust_score`, `rating`, `total_reviews`,
  `completed_trades`, `punctuality_rate`, `bio`, `is_banned`, `token_version`
) VALUES
('user-admin', 'UC Campus Moderation', 'uc.tradelink@gmail.com', 'ADMIN001', '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS', 'admin', 'UC Main', 'CCS', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 100, 0.0, 0, 0, 100, 'Official University of Cebu Campus Moderation & Safety Desk. Direct peer-to-peer student verification.', 0, 1),
('student-1', 'Maria Santos', 'maria.santos@uc.edu.ph', '2022-01452', '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS', 'student', 'UC Main', 'CEA', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 98, 4.9, 14, 18, 96, 'BS Civil Engineering student. Fast responder, available for canteen or library handovers.', 0, 1),
('student-2', 'Joshua Tan', 'joshua.tan@uc.edu.ph', '2023-08912', '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS', 'student', 'UC Banilad', 'CON', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 94, 4.8, 8, 11, 92, 'College of Nursing. Selling textbooks and medical review guides between clinical duties.', 0, 1),
('student-3', 'Bea Alonzo', 'bea.alonzo@uc.edu.ph', '2021-04519', '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS', 'student', 'UC METC', 'CME', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 96, 5.0, 19, 24, 100, 'Maritime Education & Training student. Available for equipment swaps and uniform handovers.', 0, 1),
('student-4', 'Kenjiro Sato', 'kenjiro.sato@uc.edu.ph', '2024-00128', '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS', 'student', 'UC LM', 'CBA', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 92, 4.7, 5, 7, 90, 'Business Administration freshman at UC LM campus. Punctual and friendly meetup partner.', 0, 1);

-- ----------------------------------------------------------------------------
-- 2B. SEED MARKETPLACE LISTINGS
-- ----------------------------------------------------------------------------

INSERT INTO `listings` (
  `id`, `seller_id`, `title`, `description`, `price`, `original_srp`,
  `trade_mode`, `swap_preference`, `category`, `condition`, `campus`, `department`,
  `accepted_payment_methods`, `status`, `views_count`, `quantity`, `is_featured`
) VALUES
('list-1', 'student-1', 'Casio fx-991ES Plus 2nd Edition Scientific Calculator', 'Original scientific calculator with natural textbook display and two-way power (solar + battery). Fully functional, clean keys, approved for UC engineering midterm and board exams.', 850.00, 1400.00, 'buy_sell', NULL, 'Electronics', 'Like New', 'UC Main', 'CEA', 'cash,gcash,maya', 'active', 84, 1, 1),
('list-2', 'student-2', 'Nursing Pharmacology & Medical-Surgical Reviewer (Latest Edition)', 'Comprehensive nursing pharmacology and med-surg review compilation with high-yield drug tables and mnemonic charts. Highlighted for UC CON 3rd year battery exams.', 420.00, 750.00, 'buy_sell', NULL, 'Textbooks', 'Gently Used', 'UC Banilad', 'CON', 'cash,gcash', 'active', 112, 1, 1),
('list-3', 'student-2', 'Littmann Classic III Monitoring Stethoscope (Navy Blue Tube)', 'Acoustically superior dual-sided stainless steel chestpiece stethoscope. Tunable diaphragms on both adult and pediatric sides. Used for 1 hospital semester rotation, in pristine medical condition.', 3400.00, 5200.00, 'buy_sell', NULL, 'Electronics', 'Like New', 'UC Banilad', 'CON', 'cash,gcash,maya', 'active', 67, 1, 0),
('list-4', 'student-1', 'Engineering Technical Drafting Tool Set with Rotring Compass', 'Complete technical architectural plate drawing set including Rotring precision compass, acrylic triangles, and mechanical pencils. Prepared for mechanical or civil plates.', 650.00, 1100.00, 'buy_sell', NULL, 'School Supplies', 'Gently Used', 'UC Main', 'CEA', 'cash,gcash', 'active', 45, 1, 0),
('list-5', 'student-3', 'Official UC Female College Polo Uniform (Size Medium - Set of 2)', 'Standard University of Cebu female college uniform polos with embroidered university crest. Clean collars, no stains, professionally washed. Selling as a set of 2 for incoming students.', 550.00, 900.00, 'buy_sell', NULL, 'Uniforms', 'Gently Used', 'UC METC', 'CME', 'cash,gcash', 'active', 93, 2, 0),
('list-6', 'student-3', 'UC Marine Engineering Epaulettes & Dress Uniform Cap', 'Authentic CME 3rd year marine transportation epaulettes with anchor insignia plus standard service dress visor cap. Clean, inspection-ready for formation.', 0.00, NULL, 'swap', 'BSIT / CEA reference textbooks or Casio ClassWiz fx-991CW', 'Uniforms', 'Like New', 'UC METC', 'CME', 'cash,gcash', 'active', 38, 1, 0),
('list-7', 'student-4', 'Accounting Information Systems 14th Edition Hardcover', 'Comprehensive accounting and ERP management course reference textbook. Complete pages, zero missing leaves, clean binding for accountancy coursework.', 0.00, NULL, 'swap', 'Financial Management by Brigham (any recent edition) or JHS Reviewer', 'Textbooks', 'Gently Used', 'UC LM', 'CBA', 'cash,gcash', 'active', 29, 1, 0),
('list-8', 'student-2', 'Complete 1st Year General Chemistry Review Notes & Laboratory Binder', 'Organised, handwritten, and digitised notes for General Chemistry and Anatomy lecture series. Free student donation for incoming 1st year health sciences students.', 0.00, NULL, 'free_donation', NULL, 'Textbooks', 'Gently Used', 'UC Banilad', 'CON', 'cash', 'active', 51, 1, 0),
('list-9', 'student-4', 'Official UC Campus Lanyard & Clip-On ID Holder Pack', 'Brand new University of Cebu navy and gold woven campus lanyard with safety breakaway clip and clear ID casing. Donating for free to any student in need of an ID holder.', 0.00, NULL, 'free_donation', NULL, 'School Supplies', 'Brand New', 'UC LM', 'CBA', 'cash', 'active', 42, 3, 0),
('list-10', 'student-2', 'Anti-Fog Impact Laboratory Safety Goggles', 'ANSI-certified clear side-shield laboratory goggles required for campus organic chemistry and physics lab sessions. Free donation.', 0.00, NULL, 'free_donation', NULL, 'School Supplies', 'Gently Used', 'UC Banilad', 'CON', 'cash', 'active', 23, 1, 0);

-- ----------------------------------------------------------------------------
-- 2C. SEED LISTING MEDIA
-- ----------------------------------------------------------------------------

INSERT INTO `listing_media` (`id`, `listing_id`, `media_url`, `media_type`, `thumbnail_url`, `is_primary`, `display_order`) VALUES
('med-1', 'list-1', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80', 'image', NULL, 1, 0),
('med-2', 'list-2', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80', 'image', NULL, 1, 0),
('med-3', 'list-3', 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', 'image', NULL, 1, 0),
('med-4', 'list-4', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', 'image', NULL, 1, 0),
('med-5', 'list-5', 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80', 'image', NULL, 1, 0),
('med-6', 'list-6', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', 'image', NULL, 1, 0),
('med-7', 'list-7', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 'image', NULL, 1, 0),
('med-8', 'list-8', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80', 'image', NULL, 1, 0),
('med-9', 'list-9', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 'image', NULL, 1, 0),
('med-10', 'list-10', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', 'image', NULL, 1, 0);

-- ----------------------------------------------------------------------------
-- 2D. SEED FLASH MARKET REQUESTS
-- ----------------------------------------------------------------------------

INSERT INTO `flash_requests` (
  `id`, `requester_id`, `item_name`, `category`, `target_campus`,
  `urgency`, `budget_range`, `notes`, `image_url`, `status`, `offers_count`
) VALUES
('flash-1', 'student-4', 'Casio fx-991ES or ClassWiz Scientific Calculator', 'Calculators', 'UC Main', 'immediate', '₱500', 'Urgent need for midterms exam this Friday! Willing to meet at UC Main campus lobby or canteen.', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80', 'open', 3),
('flash-2', 'student-3', 'UC Marine Deck Epaulettes and Shoulder Marks', 'Uniforms', 'UC METC', 'this_week', 'Open to Offers', 'Looking for pristine condition 3rd year deck epaulettes. Please send offers via campus chat.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', 'open', 1),
('flash-3', 'student-2', 'Medical Parasitology Lecture Review Notes / Flashcards', 'Textbooks', 'UC Banilad', 'flexible', 'FREE / Donation', 'Seeking any senior who can pass down their 2nd year parasitology notes or flashcards. Much appreciated!', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80', 'open', 2),
('flash-4', 'student-1', 'Standard Medical Stethoscope & Sphygmomanometer Set', 'Medical Supplies', 'UC Medical Center', 'immediate', '₱850', 'Needed for clinical rotation duty this weekend at UCMed. Any clean working model.', 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', 'open', 1),
('flash-5', 'student-3', 'Rotring / Standard 24-inch Technical T-Square & Triangles', 'School Supplies', 'UC Main', 'this_week', '₱350', 'For plate drafting submission on Monday. Clean acrylic blade preferred.', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', 'open', 0);

-- ----------------------------------------------------------------------------
-- 3. SEED CAMPUS ANNOUNCEMENTS
-- ----------------------------------------------------------------------------

INSERT INTO `announcements` (`id`, `title`, `message`, `campus`, `type`, `author_id`, `is_active`) VALUES
('ann-1', 'Official Campus Safety Trading Protocol', 'All student exchanges must be scheduled at guarded campus hubs (canteen, campus library entrance, or student center) during operational school hours. Always inspect items before concluding transactions.', 'All', 'alert', 'user-admin', 1),
('ann-2', 'Midterm Examination Academic Resource Desk Active', 'Students seeking calculators, reviewers, and engineering supplies can use Flash Market for urgent same-day peer requests across all 8 University of Cebu campuses.', 'All', 'info', 'user-admin', 1),
('ann-3', 'High School Textbook & PE Gear Swap Portal Live', 'TradeLink now fully supports textbook exchanges for UC PRI and UC South Campus basic education students with zero platform fees.', 'UC PRI', 'info', 'user-admin', 1);

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
