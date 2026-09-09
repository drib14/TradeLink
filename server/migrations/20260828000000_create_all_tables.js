/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Users table
  await knex.schema.createTable('users', (table) => {
    table.string('id', 36).primary();
    table.string('name', 100).notNullable();
    table.string('email', 150).notNullable().unique();
    table.string('student_id', 20).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enu('role', ['student', 'admin']).notNullable().defaultTo('student');
    table.enu('campus', [
      'UC Main', 'UC Banilad', 'UC LM', 'UC METC',
      'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center', 'UC PRI'
    ]).notNullable();
    table.string('college', 50).notNullable();
    table.string('year_level', 50).notNullable();
    table.string('avatar_url', 500).nullable();
    table.boolean('is_verified').notNullable().defaultTo(false);
    table.string('id_photo_url', 500).nullable();
    table.tinyint('trust_score').unsigned().notNullable().defaultTo(60);
    table.decimal('rating', 2, 1).notNullable().defaultTo(5.0);
    table.integer('total_reviews').unsigned().notNullable().defaultTo(0);
    table.integer('completed_trades').unsigned().notNullable().defaultTo(0);
    table.tinyint('punctuality_rate').unsigned().notNullable().defaultTo(100);
    table.text('bio').nullable();
    table.boolean('is_pro_merchant').notNullable().defaultTo(false);
    table.boolean('is_banned').notNullable().defaultTo(false);
    table.string('ban_reason', 500).nullable();
    table.dateTime('banned_at').nullable();
    table.tinyint('warnings_count').unsigned().notNullable().defaultTo(0);
    table.string('refresh_token_hash', 255).nullable();
    table.string('reset_code_hash', 255).nullable();
    table.dateTime('reset_code_exp').nullable();
    table.timestamps(true, true);

    table.index(['campus'], 'idx_users_campus');
    table.index(['email'], 'idx_users_email');
    table.index(['student_id'], 'idx_users_student_id');
    table.index(['role'], 'idx_users_role');
  });

  // 2. Listings table
  await knex.schema.createTable('listings', (table) => {
    table.string('id', 36).primary();
    table.string('title', 200).notNullable();
    table.text('description').notNullable();
    table.decimal('price', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('original_srp', 10, 2).nullable();
    table.enu('trade_mode', ['buy_sell', 'swap', 'free_donation']).notNullable().defaultTo('buy_sell');
    table.string('swap_preference', 300).nullable();
    table.string('category', 100).notNullable();
    table.enu('condition', [
      'Brand New', 'Like New', 'Gently Used', 'Fair / Academic Usable'
    ]).notNullable().defaultTo('Gently Used');
    table.integer('quantity').unsigned().notNullable().defaultTo(1);
    table.string('seller_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('campus', [
      'UC Main', 'UC Banilad', 'UC LM', 'UC METC',
      'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center', 'UC PRI'
    ]).notNullable().defaultTo('UC Main');
    table.string('department', 50).nullable();
    table.enu('status', ['active', 'reserved', 'sold', 'swapped', 'donated', 'archived', 'banned']).notNullable().defaultTo('active');
    table.boolean('is_featured').notNullable().defaultTo(false);
    table.dateTime('featured_until').nullable();
    table.string('course_code', 30).nullable();
    table.integer('views_count').unsigned().notNullable().defaultTo(0);
    table.timestamps(true, true);

    table.index(['seller_id'], 'idx_listings_seller');
    table.index(['category'], 'idx_listings_category');
    table.index(['campus'], 'idx_listings_campus');
    table.index(['trade_mode'], 'idx_listings_trade_mode');
    table.index(['status'], 'idx_listings_status');
  });

  // 3. Listing Media (Images & Product Sample Videos)
  await knex.schema.createTable('listing_media', (table) => {
    table.string('id', 36).primary();
    table.string('listing_id', 36).notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.string('media_url', 500).notNullable();
    table.enu('media_type', ['image', 'video']).notNullable().defaultTo('image');
    table.string('thumbnail_url', 500).nullable();
    table.boolean('is_primary').notNullable().defaultTo(false);
    table.tinyint('display_order').unsigned().notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['listing_id', 'display_order'], 'idx_media_listing');
  });

  // 4. Conversations
  await knex.schema.createTable('conversations', (table) => {
    table.string('id', 36).primary();
    table.string('listing_id', 36).nullable().references('id').inTable('listings').onDelete('SET NULL');
    table.string('user_one_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('user_two_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('last_message').nullable();
    table.dateTime('last_message_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.unique(['listing_id', 'user_one_id', 'user_two_id'], 'uq_conv_participants');
    table.index(['user_one_id'], 'idx_conv_user_one');
    table.index(['user_two_id'], 'idx_conv_user_two');
  });

  // 5. Swap Offers
  await knex.schema.createTable('swap_offers', (table) => {
    table.string('id', 36).primary();
    table.string('listing_id', 36).notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.string('proposer_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('offered_item_title', 200).notNullable();
    table.text('offered_item_description').nullable();
    table.string('offered_item_image', 500).nullable();
    table.string('offered_listing_id', 36).nullable().references('id').inTable('listings').onDelete('SET NULL');
    table.decimal('cash_adjustment', 10, 2).notNullable().defaultTo(0.00);
    table.enu('adjustment_type', ['none', 'proposer_adds_cash', 'proposer_requests_cash']).notNullable().defaultTo('none');
    table.enu('status', ['pending', 'accepted', 'rejected', 'withdrawn', 'cancelled']).notNullable().defaultTo('pending');
    table.string('status_note', 255).nullable();
    table.timestamps(true, true);

    table.index(['listing_id'], 'idx_swap_listing');
    table.index(['proposer_id'], 'idx_swap_proposer');
    table.index(['status'], 'idx_swap_status');
  });

  // 6. Transactions (Direct Purchases, Swaps & Donations)
  await knex.schema.createTable('transactions', (table) => {
    table.string('id', 36).primary();
    table.string('reference_no', 32).notNullable().unique();
    table.string('listing_id', 36).notNullable().references('id').inTable('listings').onDelete('RESTRICT');
    table.string('buyer_id', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('seller_id', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('swap_offer_id', 36).nullable().references('id').inTable('swap_offers').onDelete('SET NULL');
    table.enu('trade_mode', ['buy_sell', 'swap', 'free_donation']).notNullable().defaultTo('buy_sell');
    table.decimal('amount', 10, 2).notNullable().defaultTo(0.00);
    table.enu('payment_method', ['cash', 'gcash', 'maya', 'barter', 'free']).notNullable().defaultTo('cash');
    table.enu('payment_status', ['unpaid', 'paid', 'refunded']).notNullable().defaultTo('unpaid');
    table.enu('status', ['pending', 'completed', 'cancelled', 'disputed']).notNullable().defaultTo('pending');
    table.text('notes').nullable();
    table.dateTime('completed_at').nullable();
    table.dateTime('cancelled_at').nullable();
    table.string('cancellation_reason', 500).nullable();
    table.timestamps(true, true);

    table.index(['reference_no'], 'idx_tx_ref');
    table.index(['listing_id'], 'idx_tx_listing');
    table.index(['buyer_id'], 'idx_tx_buyer');
    table.index(['seller_id'], 'idx_tx_seller');
    table.index(['status'], 'idx_tx_status');
  });

  // 7. Messages (With Media Attachments)
  await knex.schema.createTable('messages', (table) => {
    table.string('id', 36).primary();
    table.string('conversation_id', 36).notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.string('sender_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('receiver_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.boolean('is_system_message').notNullable().defaultTo(false);
    table.string('media_url', 500).nullable();
    table.enu('media_type', ['image', 'video']).nullable();
    table.string('swap_offer_id', 36).nullable().references('id').inTable('swap_offers').onDelete('SET NULL');
    table.string('transaction_id', 36).nullable().references('id').inTable('transactions').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['conversation_id', 'created_at'], 'idx_msg_conv_created');
    table.index(['receiver_id', 'is_read'], 'idx_msg_receiver_read');
    table.index(['sender_id'], 'idx_msg_sender');
  });

  // 8. Wanted Requests
  await knex.schema.createTable('wanted_requests', (table) => {
    table.string('id', 36).primary();
    table.string('requester_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('item_name', 200).notNullable();
    table.string('category', 100).notNullable();
    table.string('budget_range', 50).nullable();
    table.enu('urgency', ['immediate', 'this_week', 'flexible']).notNullable().defaultTo('flexible');
    table.text('notes').nullable();
    table.enu('target_campus', [
      'UC Main', 'UC Banilad', 'UC LM', 'UC METC',
      'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center', 'UC PRI'
    ]).notNullable();
    table.enu('status', ['open', 'fulfilled', 'cancelled', 'expired']).notNullable().defaultTo('open');
    table.integer('offers_count').unsigned().notNullable().defaultTo(0);
    table.timestamps(true, true);

    table.index(['requester_id'], 'idx_wanted_requester');
    table.index(['target_campus'], 'idx_wanted_campus');
  });

  // 9. Reviews
  await knex.schema.createTable('reviews', (table) => {
    table.string('id', 36).primary();
    table.string('transaction_id', 36).notNullable().references('id').inTable('transactions').onDelete('CASCADE');
    table.string('reviewer_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('target_user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.tinyint('rating').unsigned().notNullable().defaultTo(5);
    table.text('comment').nullable();
    table.string('item_title', 200).nullable();
    table.string('trade_type', 50).notNullable().defaultTo('buy_sell');
    table.boolean('was_punctual').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['transaction_id', 'reviewer_id'], 'uq_review_tx_reviewer');
    table.index(['target_user_id'], 'idx_review_target');
    table.index(['reviewer_id'], 'idx_review_reviewer');
  });

  // 10. Review Badges
  await knex.schema.createTable('review_badges', (table) => {
    table.string('id', 36).primary();
    table.string('review_id', 36).notNullable().references('id').inTable('reviews').onDelete('CASCADE');
    table.string('badge', 50).notNullable();

    table.index(['review_id'], 'idx_review_badges_review');
  });

  // 11. Verification Requests
  await knex.schema.createTable('verification_requests', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('student_id_number', 50).notNullable();
    table.string('id_photo_url', 500).notNullable();
    table.string('selfie_photo_url', 500).nullable();
    table.enu('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending');
    table.string('rejection_reason', 255).nullable();
    table.string('reviewed_by', 36).nullable();
    table.dateTime('reviewed_at').nullable();
    table.timestamps(true, true);

    table.index(['user_id'], 'idx_verif_user');
    table.index(['status'], 'idx_verif_status');
  });

  // 12. Flagged Listings
  await knex.schema.createTable('flagged_listings', (table) => {
    table.string('id', 36).primary();
    table.string('listing_id', 36).notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.string('reporter_id', 36).nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('reason', 255).notNullable();
    table.enu('status', ['pending', 'reviewed', 'dismissed', 'removed']).notNullable().defaultTo('pending');
    table.string('action_taken', 255).nullable();
    table.string('reviewed_by', 36).nullable();
    table.dateTime('reviewed_at').nullable();
    table.timestamps(true, true);

    table.index(['listing_id'], 'idx_flag_listing');
    table.index(['status'], 'idx_flag_status');
  });

  // 13. Trade Disputes
  await knex.schema.createTable('trade_disputes', (table) => {
    table.string('id', 36).primary();
    table.string('transaction_id', 36).notNullable().references('id').inTable('transactions').onDelete('CASCADE');
    table.string('complainant_id', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('respondent_id', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('reason', 255).notNullable();
    table.enu('status', ['open', 'under_review', 'resolved', 'dismissed']).notNullable().defaultTo('open');
    table.enu('verdict', ['warning_issued', 'account_suspended', 'dismissed', 'amicable_settlement']).nullable();
    table.text('notes').nullable();
    table.string('resolved_by', 36).nullable();
    table.dateTime('resolved_at').nullable();
    table.timestamps(true, true);

    table.index(['transaction_id'], 'idx_disputes_trans');
    table.index(['status'], 'idx_disputes_status');
  });

  // 14. Announcements
  await knex.schema.createTable('announcements', (table) => {
    table.string('id', 36).primary();
    table.string('title', 200).notNullable();
    table.text('message').notNullable();
    table.enu('campus', [
      'All', 'UC Main', 'UC Banilad', 'UC LM', 'UC METC',
      'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center', 'UC PRI'
    ]).notNullable().defaultTo('All');
    table.enu('type', ['info', 'alert', 'event']).notNullable().defaultTo('info');
    table.string('author_id', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('author_name', 100).notNullable().defaultTo('UC Administration');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.index(['campus'], 'idx_ann_campus');
    table.index(['is_active'], 'idx_ann_active');
  });

  // 15. Admin Audit Logs
  await knex.schema.createTable('admin_audit_logs', (table) => {
    table.string('id', 36).primary();
    table.string('admin_id', 36).notNullable();
    table.string('admin_name', 100).notNullable();
    table.string('action', 100).notNullable();
    table.string('target_type', 50).notNullable();
    table.string('target_id', 36).notNullable();
    table.text('details').nullable();
    table.string('ip_address', 45).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['admin_id'], 'idx_audit_admin');
    table.index(['action'], 'idx_audit_action');
  });

  // 16. Prohibited Keywords
  await knex.schema.createTable('prohibited_keywords', (table) => {
    table.string('id', 36).primary();
    table.string('keyword', 100).notNullable().unique();
    table.string('added_by', 36).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['keyword'], 'idx_keyword');
  });

  // 17. System Configuration
  await knex.schema.createTable('system_config', (table) => {
    table.string('config_key', 50).primary();
    table.json('config_value').notNullable();
    table.string('last_updated_by', 100).notNullable().defaultTo('system');
    table.timestamps(true, true);
  });

  // 18. Feature Flags
  await knex.schema.createTable('feature_flags', (table) => {
    table.string('id', 36).primary();
    table.string('name', 100).notNullable().unique();
    table.string('description', 300).nullable();
    table.boolean('enabled').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  // 19. Password Reset Requests
  await knex.schema.createTable('password_reset_requests', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('email', 150).notNullable();
    table.enu('status', ['pending', 'approved', 'rejected', 'completed']).notNullable().defaultTo('pending');
    table.string('code_hash', 255).nullable();
    table.dateTime('code_exp').nullable();
    table.string('reviewed_by', 36).nullable();
    table.string('admin_note', 500).nullable();
    table.dateTime('reviewed_at').nullable();
    table.timestamps(true, true);

    table.index(['user_id'], 'idx_pw_reset_user_id');
    table.index(['status'], 'idx_pw_reset_status');
    table.index(['email'], 'idx_pw_reset_email');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('password_reset_requests');
  await knex.schema.dropTableIfExists('feature_flags');
  await knex.schema.dropTableIfExists('system_config');
  await knex.schema.dropTableIfExists('prohibited_keywords');
  await knex.schema.dropTableIfExists('admin_audit_logs');
  await knex.schema.dropTableIfExists('announcements');
  await knex.schema.dropTableIfExists('trade_disputes');
  await knex.schema.dropTableIfExists('flagged_listings');
  await knex.schema.dropTableIfExists('verification_requests');
  await knex.schema.dropTableIfExists('review_badges');
  await knex.schema.dropTableIfExists('reviews');
  await knex.schema.dropTableIfExists('wanted_requests');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('swap_offers');
  await knex.schema.dropTableIfExists('conversations');
  await knex.schema.dropTableIfExists('listing_media');
  await knex.schema.dropTableIfExists('listings');
  await knex.schema.dropTableIfExists('users');
  // Obsolete tables cleanup
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('favorites');
  await knex.schema.dropTableIfExists('listing_tags');
  await knex.schema.dropTableIfExists('conversation_read_status');
  await knex.schema.dropTableIfExists('meetup_transactions');
  await knex.schema.dropTableIfExists('listing_images');
};
