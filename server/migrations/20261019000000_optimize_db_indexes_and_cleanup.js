/**
 * Database Optimization Migration:
 * - Drops redundant/duplicate indexes that duplicate primary/unique constraints.
 * - Adds composite indexes for high-frequency queries (listings feed, messages ordering, conversation sorting).
 * - Creates security_events table if not already present.
 * - Cleans up orphaned or obsolete records.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Ensure security_events table exists
  const hasSecurityEvents = await knex.schema.hasTable('security_events');
  if (!hasSecurityEvents) {
    await knex.schema.createTable('security_events', (table) => {
      table.string('id', 36).primary();
      table.string('event_type', 100).notNullable();
      table.enu('severity', ['info', 'warning', 'critical']).notNullable().defaultTo('info');
      table.string('user_id', 36).nullable();
      table.string('ip_address', 45).nullable();
      table.string('user_agent', 256).nullable();
      table.text('details').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['event_type'], 'idx_security_event_type');
      table.index(['severity'], 'idx_security_severity');
      table.index(['user_id'], 'idx_security_user_id');
      table.index(['created_at'], 'idx_security_created_at');
    });
  }

  // 2. Clean up orphaned listing_media records
  await knex.raw(`
    DELETE FROM listing_media
    WHERE listing_id NOT IN (SELECT id FROM listings)
  `).catch(() => {});

  // 3. Drop redundant / duplicate indexes safely
  const helperDropIndex = async (tableName, indexName) => {
    try {
      await knex.schema.alterTable(tableName, (table) => {
        table.dropIndex([], indexName);
      });
    } catch (_) {
      // Ignore if index doesn't exist
    }
  };

  await helperDropIndex('users', 'idx_users_email');
  await helperDropIndex('users', 'idx_users_student_id');
  await helperDropIndex('prohibited_keywords', 'idx_keyword');
  await helperDropIndex('transactions', 'idx_tx_ref');
  await helperDropIndex('listing_views', 'idx_listing_views_listing');

  // 4. Add high-performance composite indexes
  const helperAddIndex = async (tableName, columns, indexName) => {
    try {
      await knex.schema.alterTable(tableName, (table) => {
        table.index(columns, indexName);
      });
    } catch (_) {
      // Ignore if already exists
    }
  };

  // Active marketplace feed queries: WHERE status = 'active' ORDER BY created_at DESC
  await helperAddIndex('listings', ['status', 'created_at'], 'idx_listings_status_created');
  // Campus active filtering: WHERE status = 'active' AND campus = ? ORDER BY created_at DESC
  await helperAddIndex('listings', ['status', 'campus', 'created_at'], 'idx_listings_status_campus');
  // Category active filtering: WHERE status = 'active' AND category = ?
  await helperAddIndex('listings', ['status', 'category', 'created_at'], 'idx_listings_status_cat');
  // User listings: WHERE seller_id = ? AND status = ?
  await helperAddIndex('listings', ['seller_id', 'status'], 'idx_listings_seller_status');

  // Messages in conversation: WHERE conversation_id = ? ORDER BY created_at ASC
  await helperAddIndex('messages', ['conversation_id', 'created_at'], 'idx_msg_conv_created');
  // Unread messages: WHERE receiver_id = ? AND is_read = 0
  await helperAddIndex('messages', ['receiver_id', 'is_read'], 'idx_msg_recv_unread');

  // Conversations user lookup: WHERE user_one_id = ? ORDER BY last_message_at DESC
  await helperAddIndex('conversations', ['user_one_id', 'last_message_at'], 'idx_conv_user_one_last');
  await helperAddIndex('conversations', ['user_two_id', 'last_message_at'], 'idx_conv_user_two_last');

  // Transactions query optimizations
  await helperAddIndex('transactions', ['buyer_id', 'status'], 'idx_tx_buyer_status');
  await helperAddIndex('transactions', ['seller_id', 'status'], 'idx_tx_seller_status');

  // Reviews query optimizations
  await helperAddIndex('reviews', ['target_user_id', 'created_at'], 'idx_reviews_target_created');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const helperDropIndex = async (tableName, indexName) => {
    try {
      await knex.schema.alterTable(tableName, (table) => {
        table.dropIndex([], indexName);
      });
    } catch (_) {}
  };

  await helperDropIndex('reviews', 'idx_reviews_target_created');
  await helperDropIndex('transactions', 'idx_tx_seller_status');
  await helperDropIndex('transactions', 'idx_tx_buyer_status');
  await helperDropIndex('conversations', 'idx_conv_user_two_last');
  await helperDropIndex('conversations', 'idx_conv_user_one_last');
  await helperDropIndex('messages', 'idx_msg_recv_unread');
  await helperDropIndex('messages', 'idx_msg_conv_created');
  await helperDropIndex('listings', 'idx_listings_seller_status');
  await helperDropIndex('listings', 'idx_listings_status_cat');
  await helperDropIndex('listings', 'idx_listings_status_campus');
  await helperDropIndex('listings', 'idx_listings_status_created');
};
