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
    table.decimal('original_srp', 10, 2).notNullable().defaultTo(0.00);
    table.enu('trade_mode', ['buy_sell', 'swap', 'free_donation']).notNullable().defaultTo('buy_sell');
    table.string('swap_preference', 300).nullable();
    table.string('category', 100).notNullable();
    table.enu('condition', [
      'Brand New', 'Like New', 'Gently Used', 'Fair / Academic Usable'
    ]).notNullable().defaultTo('Gently Used');
    table.integer('quantity').unsigned().notNullable().defaultTo(1);
    table.string('seller_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.json('preferred_meetup_spots').nullable();
    table.string('custom_meetup_spot', 200).nullable();
    table.boolean('is_boosted').notNullable().defaultTo(false);
    table.boolean('is_sold').notNullable().defaultTo(false);
    table.string('course_code', 30).nullable();
    table.integer('views').unsigned().notNullable().defaultTo(0);
    table.integer('favorites_count').unsigned().notNullable().defaultTo(0);
    table.timestamps(true, true);

    table.index(['seller_id'], 'idx_listings_seller');
    table.index(['category'], 'idx_listings_category');
    table.index(['trade_mode'], 'idx_listings_trade_mode');
    table.index(['is_boosted'], 'idx_listings_is_boosted');
    table.index(['is_sold'], 'idx_listings_is_sold');
  });

  // 3. Listing Images
  await knex.schema.createTable('listing_images', (table) => {
    table.string('id', 36).primary();
    table.string('listing_id', 36).notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.string('image_url', 500).notNullable();
    table.tinyint('sort_order').unsigned().notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['listing_id', 'sort_order'], 'idx_images_listing');
  });

  // 4. Listing Tags
  await knex.schema.createTable('listing_tags', (table) => {
    table.string('id', 36).primary();
    table.string('listing_id', 36).notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.string('tag', 50).notNullable();

    table.index(['listing_id'], 'idx_tags_listing');
    table.index(['tag'], 'idx_tags_tag');
  });

  // 5. Conversations
  await knex.schema.createTable('conversations', (table) => {
    table.string('id', 36).primary();
    table.string('listing_id', 36).notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.string('participant_a', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('participant_b', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('last_message').nullable();
    table.dateTime('last_message_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['listing_id', 'participant_a', 'participant_b'], 'uq_conv_listing_users');
    table.index(['participant_a'], 'idx_conv_participant_a');
    table.index(['participant_b'], 'idx_conv_participant_b');
  });

  // 6. Conversation Read Status
  await knex.schema.createTable('conversation_read_status', (table) => {
    table.string('conversation_id', 36).notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('unread_count').unsigned().notNullable().defaultTo(0);
    table.dateTime('last_read_at').nullable();

    table.primary(['conversation_id', 'user_id']);
  });

  // 7. Messages
  await knex.schema.createTable('messages', (table) => {
    table.string('id', 36).primary();
    table.string('conversation_id', 36).notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.string('sender_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('receiver_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.boolean('is_system_message').notNullable().defaultTo(false);
    table.string('swap_offer_id', 36).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['conversation_id', 'created_at'], 'idx_msg_conv_created');
  });

  // 8. Swap Offers
  await knex.schema.createTable('swap_offers', (table) => {
    table.string('id', 36).primary();
    table.string('target_listing_id', 36).notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.string('target_seller_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('offerer_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('offered_listing_id', 36).nullable().references('id').inTable('listings').onDelete('SET NULL');
    table.text('offered_description').notNullable();
    table.decimal('cash_top_up', 10, 2).notNullable().defaultTo(0.00);
    table.enu('status', ['pending', 'accepted', 'declined', 'completed']).notNullable().defaultTo('pending');
    table.string('proposed_meetup_spot', 200).notNullable();
    table.string('proposed_datetime', 100).notNullable();
    table.timestamps(true, true);

    table.index(['target_listing_id'], 'idx_swap_target');
    table.index(['offerer_id'], 'idx_swap_offerer');
  });

  // 9. Meetup Transactions
  await knex.schema.createTable('meetup_transactions', (table) => {
    table.string('id', 36).primary();
    table.string('listing_id', 36).notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.string('seller_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('buyer_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('trade_mode', ['buy_sell', 'swap', 'free_donation']).notNullable().defaultTo('buy_sell');
    table.decimal('final_price', 10, 2).notNullable().defaultTo(0.00);
    table.string('swap_summary', 500).nullable();
    table.enu('campus', [
      'UC Main', 'UC Banilad', 'UC LM', 'UC METC',
      'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center', 'UC PRI'
    ]).notNullable();
    table.string('landmark_spot', 200).notNullable();
    table.string('scheduled_datetime', 100).notNullable();
    table.string('verification_code_hash', 255).notNullable();
    table.enu('status', ['scheduled', 'on_the_way', 'completed', 'cancelled']).notNullable().defaultTo('scheduled');
    table.text('notes').nullable();
    table.dateTime('completed_at').nullable();
    table.timestamps(true, true);

    table.index(['seller_id'], 'idx_meetup_seller');
    table.index(['buyer_id'], 'idx_meetup_buyer');
    table.index(['status'], 'idx_meetup_status');
  });

  // 10. Wanted Requests
  await knex.schema.createTable('wanted_requests', (table) => {
    table.string('id', 36).primary();
    table.string('requester_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('item_title', 200).notNullable();
    table.string('category', 100).notNullable();
    table.decimal('target_budget', 10, 2).notNullable().defaultTo(0.00);
    table.enu('urgency', ['Immediate / Urgent', 'This Week', 'Flexible']).notNullable().defaultTo('This Week');
    table.text('description').notNullable();
    table.enu('preferred_campus', [
      'UC Main', 'UC Banilad', 'UC LM', 'UC METC',
      'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center', 'UC PRI'
    ]).notNullable();
    table.enu('status', ['open', 'fulfilled']).notNullable().defaultTo('open');
    table.integer('offers_count').unsigned().notNullable().defaultTo(0);
    table.timestamps(true, true);

    table.index(['requester_id'], 'idx_wanted_requester');
    table.index(['preferred_campus'], 'idx_wanted_campus');
  });

  // 11. Reviews
  await knex.schema.createTable('reviews', (table) => {
    table.string('id', 36).primary();
    table.string('transaction_id', 36).notNullable().references('id').inTable('meetup_transactions').onDelete('CASCADE');
    table.string('reviewer_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('target_user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.tinyint('rating').unsigned().notNullable().defaultTo(5);
    table.text('comment').nullable();
    table.string('item_title', 200).notNullable();
    table.string('trade_type', 50).notNullable();
    table.boolean('was_punctual').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['transaction_id', 'reviewer_id'], 'uq_review_tx_reviewer');
    table.index(['target_user_id'], 'idx_review_target');
  });

  // 12. Review Badges
  await knex.schema.createTable('review_badges', (table) => {
    table.string('id', 36).primary();
    table.string('review_id', 36).notNullable().references('id').inTable('reviews').onDelete('CASCADE');
    table.string('badge', 50).notNullable();
  });

  // 13. Favorites
  await knex.schema.createTable('favorites', (table) => {
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('listing_id', 36).notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.primary(['user_id', 'listing_id']);
  });

  // 14. Notifications
  await knex.schema.createTable('notifications', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 200).notNullable();
    table.text('message').notNullable();
    table.enu('type', ['swap', 'meetup', 'price_drop', 'wanted_response', 'system']).notNullable().defaultTo('system');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.string('link_view', 100).nullable();
    table.json('link_params').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id', 'is_read'], 'idx_notif_user_read');
  });

  // 15. Verification Requests
  await knex.schema.createTable('verification_requests', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('student_id_number', 30).notNullable();
    table.enu('campus', [
      'UC Main', 'UC Banilad', 'UC LM', 'UC METC',
      'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center', 'UC PRI'
    ]).notNullable();
    table.string('college', 50).notNullable();
    table.string('id_card_image_url', 500).notNullable();
    table.text('selfie_photo_url').nullable();
    table.enu('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending');
    table.timestamp('submitted_at').defaultTo(knex.fn.now());
    table.dateTime('reviewed_at').nullable();
    table.string('reviewed_by', 36).nullable();
    table.string('reject_reason', 500).nullable();

    table.index(['status'], 'idx_verif_status');
  });

  // 16. Flagged Listings
  await knex.schema.createTable('flagged_listings', (table) => {
    table.string('id', 36).primary();
    table.string('listing_id', 36).notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.string('reporter_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('reason').notNullable();
    table.enu('status', ['pending', 'resolved', 'removed']).notNullable().defaultTo('pending');
    table.timestamp('reported_at').defaultTo(knex.fn.now());
    table.string('resolved_by', 36).nullable();
    table.string('resolution_note', 500).nullable();

    table.index(['status'], 'idx_flag_status');
  });

  // 17. Announcements
  await knex.schema.createTable('announcements', (table) => {
    table.string('id', 36).primary();
    table.string('title', 200).notNullable();
    table.text('message').notNullable();
    table.string('campus', 50).notNullable().defaultTo('All');
    table.enu('type', ['info', 'alert', 'event']).notNullable().defaultTo('info');
    table.string('author_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('author_name', 100).notNullable().defaultTo('UC Administration');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['campus', 'is_active'], 'idx_ann_campus_active');
  });

  // 18. Admin Audit Logs
  await knex.schema.createTable('admin_audit_logs', (table) => {
    table.string('id', 36).primary();
    table.string('admin_id', 36).notNullable();
    table.string('admin_name', 100).notNullable();
    table.string('action', 100).notNullable();
    table.enu('target_type', [
      'user', 'listing', 'verification', 'wanted', 'meetup', 'announcement', 'dispute', 'system'
    ]).notNullable();
    table.string('target_id', 100).notNullable();
    table.text('details').notNullable();
    table.string('ip_address', 50).nullable();
    table.string('user_agent', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['target_type', 'target_id'], 'idx_audit_target');
    table.index(['created_at'], 'idx_audit_created');
  });

  // 19. Trade Disputes
  await knex.schema.createTable('trade_disputes', (table) => {
    table.string('id', 36).primary();
    table.string('transaction_id', 36).nullable();
    table.string('listing_title', 200).notNullable();
    table.string('buyer_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('buyer_name', 100).notNullable();
    table.string('seller_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('seller_name', 100).notNullable();
    table.enu('campus', [
      'UC Main', 'UC Banilad', 'UC LM', 'UC METC',
      'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center', 'UC PRI'
    ]).notNullable();
    table.text('reason').notNullable();
    table.enu('status', ['pending', 'resolved', 'dismissed']).notNullable().defaultTo('pending');
    table.text('verdict_note').nullable();
    table.enu('verdict_action', ['refund', 'warning', 'dismissed', 'ban']).nullable();
    table.string('resolved_by', 36).nullable();
    table.timestamp('filed_at').defaultTo(knex.fn.now());
    table.dateTime('resolved_at').nullable();

    table.index(['status'], 'idx_dispute_status');
  });

  // 20. Prohibited Keywords
  await knex.schema.createTable('prohibited_keywords', (table) => {
    table.string('id', 36).primary();
    table.string('keyword', 100).notNullable().unique();
    table.string('added_by', 36).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 21. System Config
  await knex.schema.createTable('system_config', (table) => {
    table.string('config_key', 50).primary();
    table.json('config_value').notNullable();
    table.string('last_updated_by', 100).notNullable().defaultTo('system');
    table.timestamps(true, true);
  });

  // 22. Feature Flags
  await knex.schema.createTable('feature_flags', (table) => {
    table.string('id', 36).primary();
    table.string('name', 100).notNullable().unique();
    table.string('description', 300).nullable();
    table.boolean('enabled').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('feature_flags');
  await knex.schema.dropTableIfExists('system_config');
  await knex.schema.dropTableIfExists('prohibited_keywords');
  await knex.schema.dropTableIfExists('trade_disputes');
  await knex.schema.dropTableIfExists('admin_audit_logs');
  await knex.schema.dropTableIfExists('announcements');
  await knex.schema.dropTableIfExists('flagged_listings');
  await knex.schema.dropTableIfExists('verification_requests');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('favorites');
  await knex.schema.dropTableIfExists('review_badges');
  await knex.schema.dropTableIfExists('reviews');
  await knex.schema.dropTableIfExists('wanted_requests');
  await knex.schema.dropTableIfExists('meetup_transactions');
  await knex.schema.dropTableIfExists('swap_offers');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('conversation_read_status');
  await knex.schema.dropTableIfExists('conversations');
  await knex.schema.dropTableIfExists('listing_tags');
  await knex.schema.dropTableIfExists('listing_images');
  await knex.schema.dropTableIfExists('listings');
  await knex.schema.dropTableIfExists('users');
};
