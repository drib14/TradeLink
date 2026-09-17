-- ============================================================================
-- TradeLink MySQL 8.0 Full Production Seed Data Script
-- Platform: University of Cebu Student Marketplace & Barter Hub
-- Database: tradelink_db_test / tradelink_db
-- ============================================================================

USE `tradelink_db_test`;

SET FOREIGN_KEY_CHECKS = 0;

-- Clean truncate / delete in reverse dependency order
DELETE FROM `review_badges`;
DELETE FROM `reviews`;
DELETE FROM `messages`;
DELETE FROM `conversations`;
DELETE FROM `transactions`;
DELETE FROM `swap_offers`;
DELETE FROM `flash_requests`;
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
-- 1. SEED ADMINISTRATOR & VERIFIED STUDENT USERS
-- ----------------------------------------------------------------------------
-- Password for all seed accounts: TradeLink@2026 / Password123!
-- Hashes generated with 12 bcrypt salt rounds

INSERT INTO `users` (
  `id`, `name`, `email`, `student_id`, `password_hash`, `role`, `campus`, `college`, `year_level`,
  `avatar_url`, `is_verified`, `id_photo_url`, `trust_score`, `rating`, `total_reviews`,
  `completed_trades`, `punctuality_rate`, `bio`, `is_pro_merchant`, `is_banned`, `token_version`
) VALUES
('user-admin', 'UC Campus Moderation', 'uc.tradelink@gmail.com', 'ADMIN001', '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS', 'admin', 'UC Main', 'CCS', 'Faculty / Staff', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 100, 5.0, 0, 0, 100, 'Official University of Cebu Campus Moderation & Safety Desk. Direct peer-to-peer student verification.', 0, 0, 1),

('student-1', 'Christian Dave Tan', 'christian.dave@uc.edu.ph', '2022-01452', '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS', 'student', 'UC Main', 'College of Computer Studies', '3rd Year', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 96, 4.9, 14, 12, 100, 'BSIT 3rd Year student at UC Main. Passionate coder, trading extra hardware and textbooks responsibly.', 1, 0, 1),

('student-2', 'Angela Mae Rodriguez', 'angela.mae@uc.edu.ph', '2023-08912', '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS', 'student', 'UC Banilad', 'College of Nursing', '2nd Year', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 94, 5.0, 9, 8, 98, 'Nursing student at Banilad campus. Swapping medical reviewer guides and pre-loved scrub uniforms.', 0, 0, 1),

('student-3', 'Mark Anthony Fernandez', 'mark.anthony@uc.edu.ph', '2021-04321', '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS', 'student', 'UC METC', 'College of Engineering', '4th Year', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 98, 4.8, 22, 19, 100, 'Marine Engineering senior at UC METC. Meetups at METC guard house or Main campus student hub.', 1, 0, 1),

('student-4', 'Patricia Gail Lim', 'patricia.gail@uc.edu.ph', '2022-09874', '$2a$12$yJGlhUWl2NptA2YAljBOo.UgBKtyBjDDHFdOvEQsOdClm/AT0xJrS', 'student', 'UC LM', 'College of Business Administration', '3rd Year', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 90, 4.9, 6, 5, 95, 'Accountancy student at Lapu-Lapu Mandaue campus. Donating completed notes and swapping accounting books.', 0, 0, 1);

-- ----------------------------------------------------------------------------
-- 2. SEED CAMPUS PRODUCT LISTINGS ACROSS ALL TRADE MODES
-- ----------------------------------------------------------------------------

INSERT INTO `listings` (
  `id`, `seller_id`, `title`, `description`, `price`, `original_srp`, `trade_mode`,
  `swap_preference`, `category`, `condition`, `campus`, `department`, `status`,
  `views_count`, `is_featured`, `course_code`, `quantity`
) VALUES
-- Buy & Sell Listings
('list-1', 'student-1', 'Casio FX-991EX ClassWiz Scientific Calculator', 'Original ClassWiz high-resolution solar scientific calculator. Required for College of Engineering, IT, and Math majors. No scratches, crisp display, with hard protective slide-on case.', 950.00, 1450.00, 'buy_sell', NULL, 'Calculators', 'Like New', 'UC Main', 'CCS', 'active', 48, 1, 'MATH101', 1),

('list-2', 'student-1', 'Data Structures & Algorithms in C++ (2nd Edition)', 'Good condition academic textbook with comprehensive code samples and diagram annotations. Perfect for CS and IT 2nd/3rd year subjects. Clean pages with zero highlight marks.', 380.00, 850.00, 'buy_sell', NULL, 'Textbooks', 'Gently Used', 'UC Main', 'CCS', 'active', 32, 0, 'IT212', 1),

('list-3', 'student-2', 'Official UC Nursing Scrub Uniform Set (Size Medium)', 'Two sets of pre-loved University of Cebu white and teal clinical scrub suits. Tailored for Banilad Nursing students. Washed, sanitised, and in crisp condition with zero stains.', 450.00, 750.00, 'buy_sell', NULL, 'Uniforms', 'Like New', 'UC Banilad', 'CON', 'active', 64, 1, 'NURS201', 2),

('list-4', 'student-3', 'Rotring Mechanical Drafting T-Square & Triangle Set', 'Heavy-duty 24-inch acrylic drawing T-square with beveled edges and 30/60 degree drafting triangles. Essential for 1st/2nd year Engineering drawing and plate work.', 650.00, 1200.00, 'buy_sell', NULL, 'School Supplies', 'Like New', 'UC METC', 'COE', 'active', 19, 0, 'DRAW101', 1),

('list-5', 'student-1', 'Huion Inspiroy H640P Digital Graphics Drawing Tablet', 'Type-C battery-free digital pen tablet with 8192 pressure levels. Ideal for Multimedia Arts, UI/UX students, and digital note-taking on campus laptops. Includes all extra pen nibs.', 1200.00, 2100.00, 'buy_sell', NULL, 'Electronics', 'Like New', 'UC Main', 'CCS', 'active', 87, 1, 'IT315', 1),

-- Item Swaps / Barter Listings
('list-6', 'student-3', 'UC Marine Engineering Uniform (Size L) — Looking to Swap for Size M', 'Authentic UC METC Marine Engineering white dress uniform in Size L. Looking to barter or swap for a well-kept Size M uniform set.', 0.00, NULL, 'swap', 'Looking for UC METC Size M Dress Uniform in good condition', 'Uniforms', 'Gently Used', 'UC METC', 'COE', 'active', 28, 0, 'MAR101', 1),

('list-7', 'student-1', 'Thomas Calculus Early Transcendentals 14th Ed — Swapping for Differential Equations', 'Standard hardbound university calculus textbook. Want to swap for Boyce Differential Equations or Linear Algebra book for 1st term.', 0.00, NULL, 'swap', 'Swap for Elementary Differential Equations or Advanced Engineering Math book', 'Textbooks', 'Gently Used', 'UC Main', 'CCS', 'active', 15, 0, 'MATH202', 1),

-- Free Student Donations
('list-8', 'student-2', 'Complete 1st Year General Chemistry Review Notes & Laboratory Binder', 'Organised, handwritten, and digitised notes for General Chemistry and Anatomy lecture series. Free student donation for incoming 1st year health sciences students.', 0.00, NULL, 'free_donation', NULL, 'Textbooks', 'Gently Used', 'UC Banilad', 'CON', 'active', 51, 0, 'CHEM101', 1),

('list-9', 'student-4', 'Official UC Campus Lanyard & Clip-On ID Holder Pack', 'Brand new University of Cebu navy and gold woven campus lanyard with safety breakaway clip and clear ID casing. Donating for free to any student in need of an ID holder.', 0.00, NULL, 'free_donation', NULL, 'School Supplies', 'Brand New', 'UC LM', 'CBA', 'active', 42, 0, 'GEN001', 3),

('list-10', 'student-2', 'Anti-Fog Impact Laboratory Safety Goggles', 'ANSI-certified clear side-shield laboratory goggles required for campus organic chemistry and physics lab sessions. Free donation.', 0.00, NULL, 'free_donation', NULL, 'School Supplies', 'Gently Used', 'UC Banilad', 'CON', 'active', 23, 0, 'CHEM102', 1);

-- ----------------------------------------------------------------------------
-- 3. SEED LISTING MEDIA (Images & Educational Assets)
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
-- 4. SEED FLASH MARKET REQUESTS (Demonstrating All 3 Pricing Modes)
-- ----------------------------------------------------------------------------

INSERT INTO `flash_requests` (
  `id`, `requester_id`, `item_name`, `category`, `target_campus`,
  `urgency`, `budget_range`, `notes`, `status`, `offers_count`
) VALUES
-- Mode 1: Numeric Target Budget
('flash-1', 'student-4', 'Casio fx-991ES or ClassWiz Scientific Calculator', 'Calculators', 'UC Main', 'immediate', '₱500', 'Urgent need for midterms exam this Friday! Willing to meet at UC Main campus lobby or canteen.', 'open', 3),

-- Mode 2: Open to Offers / Negotiable
('flash-2', 'student-3', 'UC Marine Deck Epaulettes and Shoulder Marks', 'Uniforms', 'UC METC', 'this_week', 'Open to Offers', 'Looking for pristine condition 3rd year deck epaulettes. Please send offers via campus chat.', 'open', 1),

-- Mode 3: Free Student Donation Request
('flash-3', 'student-2', 'Medical Parasitology Lecture Review Notes / Flashcards', 'Textbooks', 'UC Banilad', 'flexible', 'FREE / Donation', 'Seeking any senior who can pass down their 2nd year parasitology notes or flashcards. Much appreciated!', 'open', 2);

-- ----------------------------------------------------------------------------
-- 5. SEED CAMPUS ANNOUNCEMENTS
-- ----------------------------------------------------------------------------

INSERT INTO `announcements` (`id`, `title`, `message`, `campus`, `type`, `author_id`, `author_name`, `is_active`) VALUES
('ann-1', 'Official Campus Safety Trading Protocol', 'All student exchanges must be scheduled at guarded campus hubs (canteen, campus library entrance, or student center) during operational school hours. Always inspect items before concluding transactions.', 'All', 'alert', 'user-admin', 'UC Moderation Desk', 1),
('ann-2', 'Midterm Examination Academic Resource Desk Active', 'Students seeking calculators, reviewers, and engineering supplies can use Flash Market for urgent same-day peer requests across all 8 University of Cebu campuses.', 'All', 'info', 'user-admin', 'UC Moderation Desk', 1),
('ann-3', 'High School Textbook & PE Gear Swap Portal Live', 'TradeLink now fully supports textbook exchanges for UC PRI and UC South Campus basic education students with zero platform fees.', 'UC PRI', 'info', 'user-admin', 'Campus Coordinator', 1);

-- ----------------------------------------------------------------------------
-- 6. SEED ADMIN AUDIT LOGS
-- ----------------------------------------------------------------------------

INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `admin_name`, `action`, `target_type`, `target_id`, `details`, `ip_address`) VALUES
('log-1', 'user-admin', 'UC Campus Moderation', 'Platform Initialized', 'system', 'system', 'Production safety desk and KYC verification queues initialized for University of Cebu network.', '127.0.0.1'),
('log-2', 'user-admin', 'UC Campus Moderation', 'KYC Approved', 'user', 'student-1', 'Student ID 2022-01452 verified with official university enrollment records.', '127.0.0.1');

-- ----------------------------------------------------------------------------
-- 7. SEED PROHIBITED SAFETY KEYWORDS
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
-- 8. SEED SYSTEM CONFIGURATION & FEATURE FLAGS
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
