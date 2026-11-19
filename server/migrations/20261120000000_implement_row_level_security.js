/**
 * Migration: Implement Database-Level Row-Level Security (RLS) Views
 * Creates secure relational views that enforce row filtering and column redaction.
 */

exports.up = async function (knex) {
  // 1. v_users_public: Strips sensitive credential hashes, tokens, lockout counters, and institutional student ID
  await knex.raw(`
    CREATE OR REPLACE VIEW v_users_public AS
    SELECT 
      id,
      name,
      campus,
      department,
      avatar_url,
      is_verified,
      trust_score,
      rating,
      total_reviews,
      completed_trades,
      punctuality_rate,
      bio,
      created_at
    FROM users
    WHERE is_banned = FALSE;
  `);

  // 2. v_listings_active: Exposes only active, non-soft-deleted listings
  await knex.raw(`
    CREATE OR REPLACE VIEW v_listings_active AS
    SELECT 
      l.*
    FROM listings l
    WHERE l.status = 'active'
      AND (l.deleted_at IS NULL);
  `);

  // 3. v_transactions_safe: Redacts verification_code_hash from general query exposure
  await knex.raw(`
    CREATE OR REPLACE VIEW v_transactions_safe AS
    SELECT 
      id,
      reference_no,
      listing_id,
      buyer_id,
      seller_id,
      swap_offer_id,
      trade_mode,
      amount,
      payment_method,
      payment_status,
      status,
      selected_variation,
      variation_id,
      failed_handshake_attempts,
      handshake_locked_until,
      handshake_code_sent_at,
      buyer_confirmed_at,
      seller_confirmed_at,
      handshake_completed_at,
      completion_override_by,
      notes,
      completed_at,
      cancelled_at,
      cancellation_reason,
      created_at,
      updated_at
    FROM transactions;
  `);

  // 4. v_messages_safe: Clean message projection
  await knex.raw(`
    CREATE OR REPLACE VIEW v_messages_safe AS
    SELECT 
      id,
      conversation_id,
      sender_id,
      receiver_id,
      content,
      is_read,
      is_system_message,
      media_url,
      media_type,
      swap_offer_id,
      transaction_id,
      flash_request_id,
      created_at
    FROM messages;
  `);
};

exports.down = async function (knex) {
  await knex.raw('DROP VIEW IF EXISTS v_messages_safe;');
  await knex.raw('DROP VIEW IF EXISTS v_transactions_safe;');
  await knex.raw('DROP VIEW IF EXISTS v_listings_active;');
  await knex.raw('DROP VIEW IF EXISTS v_users_public;');
};
