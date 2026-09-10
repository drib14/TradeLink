-- ============================================================================
-- TradeLink MySQL 8.0 Seed Data Script
-- Populates initial University of Cebu users, listings, swaps, meetups, etc.
-- Default test passwords:
--   superadmin@uc.edu.ph   -> superadmin123
--   uc.tradelink@gmail.com -> TradeLink@2026
--   student accounts       -> password123
-- ============================================================================

USE `tradelink_db_test`;

SET FOREIGN_KEY_CHECKS = 0;

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
-- 1. SEED USERS
-- Bcrypt Hash for 'superadmin123': $2b$12$8v5uB3l/zJp.e9Hk0dY2vO7aU8lq0XWzWzGvE9wK7xKk9e0y1vV4S
-- Bcrypt Hash for 'TradeLink@2026': $2a$12$KADFhGwb/5dyBNiV8oheIeQyQLw4nWhSo0CA36EovSX0g0.CW9bly
-- Bcrypt Hash for 'password123':   $2b$12$Z.vS8/1a7UvL4zO2n4wZcOFg7T8gW3lI2k8nE1m5p0aV2sQ9yK1tG
-- ----------------------------------------------------------------------------

INSERT INTO `users` (
  `id`, `name`, `email`, `student_id`, `password_hash`, `role`, `campus`, `college`, `year_level`,
  `avatar_url`, `is_verified`, `id_photo_url`, `trust_score`, `rating`, `total_reviews`,
  `completed_trades`, `punctuality_rate`, `bio`, `is_pro_merchant`, `is_banned`
) VALUES
('user-superadmin', 'UC Super Administrator', 'superadmin@uc.edu.ph', 'UC-SA-2024', '$2b$12$8v5uB3l/zJp.e9Hk0dY2vO7aU8lq0XWzWzGvE9wK7xKk9e0y1vV4S', 'superadmin', 'UC Main', 'CCS', 'System Administrator', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 100, 5.0, 0, 0, 100, 'TradeLink Platform Super Administrator. Full system access across all UC campuses.', 0, 0),
('user-admin', 'UC Admin Moderator', 'uc.tradelink@gmail.com', 'UC-ADM-2024', '$2a$12$KADFhGwb/5dyBNiV8oheIeQyQLw4nWhSo0CA36EovSX0g0.CW9bly', 'admin', 'UC Main', 'CCS', 'Faculty / Staff', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 100, 5.0, 88, 120, 100, 'Official TradeLink Campus Moderation & Safety Desk. Verified student marketplace.', 0, 0),
('user-maria', 'Maria Santos', 'maria.nursing@uc.edu.ph', '202104982', '$2b$12$Z.vS8/1a7UvL4zO2n4wZcOFg7T8gW3lI2k8nE1m5p0aV2sQ9yK1tG', 'student', 'UC Banilad', 'Nursing', '4th Year (Senior)', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 98, 4.9, 24, 32, 96, 'Senior BSN student at Banilad. Selling gadgets, textbooks, scrubs, and study gear.', 1, 0),
('user-ken', 'Kenzo Lim', 'ken.engg@uc.edu.ph', '202211045', '$2b$12$Z.vS8/1a7UvL4zO2n4wZcOFg7T8gW3lI2k8nE1m5p0aV2sQ9yK1tG', 'student', 'UC LM', 'Engineering', '3rd Year', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 94, 4.8, 18, 22, 95, 'Mechanical Engineering student at Lapu-Lapu Mandaue. Drafting tools & calculators.', 0, 0),
('user-alex', 'Alex Rivera', 'alex.stem@uc.edu.ph', '202300189', '$2b$12$Z.vS8/1a7UvL4zO2n4wZcOFg7T8gW3lI2k8nE1m5p0aV2sQ9yK1tG', 'student', 'UC Main', 'Senior High (STEM)', 'Grade 12', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 90, 4.7, 9, 14, 92, 'STEM 12 student at UC Main. Textbook recycler & calculator bartering.', 0, 0),
('user-beatrice', 'Beatrice Tan', 'beatrice.maritime@uc.edu.ph', '202209432', '$2b$12$Z.vS8/1a7UvL4zO2n4wZcOFg7T8gW3lI2k8nE1m5p0aV2sQ9yK1tG', 'student', 'UC METC', 'Maritime', '3rd Year', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 96, 5.0, 15, 19, 100, 'BS Marine Transportation student at UC METC. Type-A uniforms and plotting charts.', 1, 0),
('user-dave', 'Dave Alcantara', 'dave.ccs@uc.edu.ph', '202100876', '$2b$12$Z.vS8/1a7UvL4zO2n4wZcOFg7T8gW3lI2k8nE1m5p0aV2sQ9yK1tG', 'student', 'UC Main', 'CCS', '4th Year (Senior)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', 1, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 88, 4.6, 12, 16, 90, 'BS Computer Science student at UC Main. Tech gear, peripherals, and code books.', 0, 0),
('user-chloe', 'Chloe Mendoza', 'chloe.cba@uc.edu.ph', '202305521', '$2b$12$Z.vS8/1a7UvL4zO2n4wZcOFg7T8gW3lI2k8nE1m5p0aV2sQ9yK1tG', 'student', 'UC South Campus', 'CBA', '2nd Year', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80', 0, NULL, 75, 4.5, 5, 6, 85, 'BSBA Accountancy student at UC South. Business calculators & ledgers.', 0, 0);

-- ----------------------------------------------------------------------------
-- 2. SEED LISTINGS
-- ----------------------------------------------------------------------------

INSERT INTO `listings` (
  `id`, `title`, `description`, `price`, `original_srp`, `trade_mode`, `swap_preference`,
  `category`, `condition`, `seller_id`, `preferred_meetup_spots`, `is_boosted`, `is_sold`,
  `course_code`, `views`, `favorites_count`
) VALUES
('list-1', 'Casio Scientific Calculator FX-991ES Plus-2 (Authentic with Slide Cover)', 'Lightly used for 2 semesters of Differential Calculus and Stat. 100% working solar + battery cells, clean buttons, crisp LCD screen.', 750.00, 1450.00, 'buy_sell', NULL, 'Electronics', 'Like New', 'user-ken', '["Gate 1 Guardhouse (Main Entrance)", "CCS Lobby & Bulletin Desk"]', 1, 0, 'MATH101', 142, 28),
('list-2', 'UC Nursing Duty Scrubs (Size M, Navy Blue) + Free UC Scrub Cap', 'Original Banilad clinical duty scrub set. Worn only 3 times during hospital orientation rotations. Crisp fabric with embroidered UC banilad college seal.', 450.00, 950.00, 'buy_sell', NULL, 'Uniforms & Gear', 'Like New', 'user-maria', '["Hospital Gate 2 (Gov. Cuenco Ave.)", "Nursing Simulation Lab Entrance"]', 1, 0, 'NURS210', 89, 14),
('list-3', 'Engineering Graphics & Drawing Technical T-Square 36" (Rotring Acrylic)', 'Heavy-duty 36-inch transparent acrylic T-square with beveled edge. Free template set included.', 350.00, 850.00, 'swap', 'Casio 991CW or Engineering Mechanics textbook', 'Instruments & Tools', 'Gently Used', 'user-ken', '["Innovation Building Lobby", "Mandaue Bridge Gate"]', 0, 0, 'ENGG102', 64, 9),
('list-4', 'Senior High STEM Rex General Physics 1 & 2 Textbook Set (Complete Edition)', 'Both Grade 12 volumes. High-yield highlighted formulas, no missing pages, plastic covered.', 480.00, 1200.00, 'buy_sell', NULL, 'Textbooks & Books', 'Gently Used', 'user-alex', '["Gate 1 Guardhouse (Main Entrance)", "Covered Court & Bleachers"]', 0, 0, 'STEM-PHYS', 112, 19),
('list-5', 'UC Maritime Deck Cadet Uniform Long Sleeve (Epaulets & Gold Buttons)', 'Complete METC deck cadet dress uniform size Large. High quality twill, complete epaulets and gold insignia buttons.', 850.00, 1800.00, 'buy_sell', NULL, 'Uniforms & Gear', 'Like New', 'user-beatrice', '["Canteen & Student Pavilion", "Registrar Lobby"]', 0, 0, 'MARITIME', 45, 7),
('list-6', 'Donation: 1st Year CCS Programming Notes & Java Binder (Clean Copy)', 'Free textbook and reviewer handouts for incoming freshmen in Java Programming / CS111. Happy to pass to the next batch.', 0.00, 300.00, 'free_donation', NULL, 'Textbooks & Books', 'Gently Used', 'user-dave', '["CCS Lobby & Bulletin Desk", "Gate 1 Guardhouse (Main Entrance)"]', 0, 0, 'CS111', 204, 34);

-- ----------------------------------------------------------------------------
-- 3. SEED LISTING IMAGES
-- ----------------------------------------------------------------------------

INSERT INTO `listing_images` (`id`, `listing_id`, `image_url`, `sort_order`) VALUES
('img-1', 'list-1', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80', 0),
('img-2', 'list-2', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80', 0),
('img-3', 'list-3', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', 0),
('img-4', 'list-4', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 0),
('img-5', 'list-5', 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80', 0),
('img-6', 'list-6', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80', 0);

-- ----------------------------------------------------------------------------
-- 4. SEED LISTING TAGS
-- ----------------------------------------------------------------------------

INSERT INTO `listing_tags` (`id`, `listing_id`, `tag`) VALUES
('tag-1', 'list-1', 'Casio'), ('tag-2', 'list-1', 'Calculator'), ('tag-3', 'list-1', 'Math'),
('tag-4', 'list-2', 'Scrubs'), ('tag-5', 'list-2', 'Nursing'), ('tag-6', 'list-2', 'Uniform'),
('tag-7', 'list-3', 'Drafting'), ('tag-8', 'list-3', 'T-Square'), ('tag-9', 'list-3', 'Engineering'),
('tag-10', 'list-4', 'STEM'), ('tag-11', 'list-4', 'Physics'), ('tag-12', 'list-4', 'Textbook'),
('tag-13', 'list-5', 'Maritime'), ('tag-14', 'list-5', 'Uniform'),
('tag-15', 'list-6', 'Freshman'), ('tag-16', 'list-6', 'Free'), ('tag-17', 'list-6', 'Java');

-- ----------------------------------------------------------------------------
-- 5. SEED CONVERSATIONS & MESSAGES
-- ----------------------------------------------------------------------------

INSERT INTO `conversations` (`id`, `listing_id`, `participant_a`, `participant_b`, `last_message`, `last_message_at`) VALUES
('conv-1', 'list-1', 'user-alex', 'user-ken', 'Yes Alex, still available! Crisp condition with sliding cover.', NOW());

INSERT INTO `conversation_read_status` (`conversation_id`, `user_id`, `unread_count`, `last_read_at`) VALUES
('conv-1', 'user-alex', 0, NOW()),
('conv-1', 'user-ken', 0, NOW());

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `receiver_id`, `content`, `is_system_message`, `created_at`) VALUES
('msg-1', 'conv-1', 'user-alex', 'user-ken', 'Hi Kenzo! Is the Casio 991ES Plus still available for meetup at UC LM?', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('msg-2', 'conv-1', 'user-ken', 'user-alex', 'Yes Alex, still available! Crisp condition with sliding cover.', 0, DATE_SUB(NOW(), INTERVAL 50 MINUTE));

-- ----------------------------------------------------------------------------
-- 6. SEED SWAP OFFERS
-- ----------------------------------------------------------------------------

INSERT INTO `swap_offers` (
  `id`, `target_listing_id`, `target_seller_id`, `offerer_id`, `offered_listing_id`,
  `offered_description`, `cash_top_up`, `status`, `proposed_meetup_spot`, `proposed_datetime`
) VALUES
('swap-1', 'list-3', 'user-ken', 'user-alex', 'list-4', 'Offering Senior High STEM Rex General Physics Set in pristine condition', 50.00, 'pending', 'Gate 1 Guardhouse (Main Entrance)', 'Tomorrow at 2:00 PM');

-- ----------------------------------------------------------------------------
-- 7. SEED MEETUP TRANSACTIONS
-- ----------------------------------------------------------------------------

INSERT INTO `meetup_transactions` (
  `id`, `listing_id`, `seller_id`, `buyer_id`, `trade_mode`, `final_price`,
  `campus`, `landmark_spot`, `scheduled_datetime`, `verification_code_hash`,
  `plain_verification_code`, `status`, `notes`
) VALUES
('meet-1', 'list-1', 'user-ken', 'user-alex', 'buy_sell', 750.00, 'UC LM', 'Gate 1 Guardhouse (Main Entrance)', 'Tomorrow at 10:30 AM', '$2b$10$wN8Gg92eDdfFf1gH5tK9e.hO2hR2qA8gB1sD3fF5gH7jK9lM1nO3p', '8421', 'scheduled', 'Meeting right next to the campus safety booth');

-- ----------------------------------------------------------------------------
-- 8. SEED WANTED REQUESTS
-- ----------------------------------------------------------------------------

INSERT INTO `wanted_requests` (
  `id`, `requester_id`, `item_title`, `category`, `target_budget`, `urgency`, `description`, `preferred_campus`, `status`, `offers_count`
) VALUES
('req-1', 'user-alex', 'Rex Grade 11 STEM Pre-Calculus Textbook (Latest Edition)', 'Textbooks', 350.00, 'Immediate / Urgent', 'Looking for a clean copy of the Grade 11 Pre-Cal book with no missing pages for our upcoming prelim exam.', 'UC Main', 'open', 2),
('req-2', 'user-maria', 'Littmann Classic III Stethoscope (Navy Blue / Black)', 'Uniforms & Gear', 2800.00, 'This Week', 'Looking for a genuine Littmann stethoscope in good working condition for clinical duty at Banilad hospital.', 'UC Banilad', 'open', 4),
('req-3', 'user-ken', 'Rotring Drafting Board A3 / Technical T-Square Set', 'Instruments', 900.00, 'This Week', 'Need complete drafting tools for 2nd year Engineering drawing subject. Can meet at UC LM Innovation lobby.', 'UC LM', 'open', 1),
('req-4', 'user-beatrice', 'Casio fx-991CW ClassWiz Scientific Calculator', 'Electronics', 950.00, 'Immediate / Urgent', 'Looking for Casio 991CW with hard slide cover for maritime navigation calculations.', 'UC METC', 'open', 3);

-- ----------------------------------------------------------------------------
-- 9. SEED REVIEWS
-- ----------------------------------------------------------------------------

INSERT INTO `reviews` (
  `id`, `transaction_id`, `reviewer_id`, `target_user_id`, `rating`, `comment`, `item_title`, `trade_type`, `was_punctual`
) VALUES
('rev-1', 'meet-1', 'user-alex', 'user-ken', 5, 'Super legit seller! Met right at UC LM guardhouse on time. The calculator looks brand new.', 'Casio Scientific Calculator FX-991ES Plus-2', 'buy_sell', 1);

INSERT INTO `review_badges` (`id`, `review_id`, `badge`) VALUES
('rb-1', 'rev-1', 'Punctual'),
('rb-2', 'rev-1', 'Accurate Description'),
('rb-3', 'rev-1', 'Safe Meetup');

-- ----------------------------------------------------------------------------
-- 10. SEED FAVORITES
-- ----------------------------------------------------------------------------

INSERT INTO `favorites` (`user_id`, `listing_id`) VALUES
('user-alex', 'list-1'),
('user-alex', 'list-2'),
('user-maria', 'list-1');

-- ----------------------------------------------------------------------------
-- 11. SEED NOTIFICATIONS
-- ----------------------------------------------------------------------------

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `link_view`, `link_params`) VALUES
('notif-1', 'user-alex', 'Meetup Scheduled', 'Your meetup with Kenzo Lim for Casio FX-991ES is set for tomorrow 10:30 AM.', 'meetup', 0, 'meetups', '{"meetupId":"meet-1"}'),
('notif-2', 'user-ken', 'New Swap Offer', 'Alex Rivera sent a swap proposal for your T-Square.', 'swap', 1, 'swaps', '{"swapId":"swap-1"}');

-- ----------------------------------------------------------------------------
-- 12. SEED VERIFICATION REQUESTS
-- ----------------------------------------------------------------------------

INSERT INTO `verification_requests` (`id`, `user_id`, `student_id_number`, `campus`, `college`, `id_card_image_url`, `status`) VALUES
('verif-1', 'user-chloe', '202305521', 'UC South Campus', 'CBA', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 'pending');

-- ----------------------------------------------------------------------------
-- 13. SEED FLAGGED LISTINGS
-- ----------------------------------------------------------------------------

INSERT INTO `flagged_listings` (`id`, `listing_id`, `reporter_id`, `reason`, `status`) VALUES
('flag-1', 'list-1', 'user-dave', 'Price might be slightly high for a generic lamp; requesting review.', 'pending');

-- ----------------------------------------------------------------------------
-- 14. SEED CAMPUS ANNOUNCEMENTS
-- ----------------------------------------------------------------------------

INSERT INTO `announcements` (`id`, `title`, `message`, `campus`, `type`, `author_id`, `author_name`, `is_active`) VALUES
('ann-1', 'Guarded Meetup Reminder', 'Always meet inside official UC campus security gates during daytime hours. Inspect items before scanning the Handshake QR code.', 'All', 'alert', 'user-superadmin', 'UC Administration', 1),
('ann-2', 'Junior High & Senior High Trading Desk Live', 'Students from UC PRI and UC South high school departments can now trade textbooks and PE uniforms with zero platform fees.', 'UC PRI', 'info', 'user-admin', 'High School Coordinator', 1);

-- ----------------------------------------------------------------------------
-- 15. SEED ADMIN AUDIT LOGS
-- ----------------------------------------------------------------------------

INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `admin_name`, `action`, `target_type`, `target_id`, `details`, `ip_address`) VALUES
('log-1', 'user-superadmin', 'UC Super Administrator', 'Platform Initialized', 'system', 'system', 'Admin desk initialized for University of Cebu campus network', '127.0.0.1');

-- ----------------------------------------------------------------------------
-- 16. SEED TRADE DISPUTES
-- ----------------------------------------------------------------------------

INSERT INTO `trade_disputes` (`id`, `listing_title`, `buyer_id`, `buyer_name`, `seller_id`, `seller_name`, `campus`, `reason`, `status`) VALUES
('disp-1', 'UC Nursing Duty Scrubs (Size M, Navy Blue)', 'user-chloe', 'Chloe Mendoza', 'user-maria', 'Maria Santos', 'UC Banilad', 'Small tear near left pocket not listed in description. Requested partial refund or replacement.', 'pending'),
('disp-2', 'Casio Scientific Calculator FX-991ES Plus-2', 'user-dave', 'Dave Alcantara', 'user-ken', 'Kenzo Lim', 'UC LM', 'Seller was 35 minutes late to the Mandaue bridge gate meetup.', 'pending');

-- ----------------------------------------------------------------------------
-- 17. SEED PROHIBITED KEYWORDS
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
-- 18. SEED SYSTEM CONFIGURATION & FEATURE FLAGS
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
), 'user-superadmin');

INSERT INTO `feature_flags` (`id`, `name`, `description`, `enabled`) VALUES
('ff-1', 'Price Advisor AI', 'Enable AI-powered pricing suggestions', 1),
('ff-2', 'Campus Map', 'Interactive campus meetup map', 1),
('ff-3', 'Pro Merchant Badge', 'Allow pro merchant status for top sellers', 1),
('ff-4', 'Dark Mode', 'Dark mode toggle for all users', 1);

SET FOREIGN_KEY_CHECKS = 1;
