const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Truncate tables in reverse dependency order
  const tables = [
    'review_badges', 'reviews', 'messages', 'conversations',
    'transactions', 'swap_offers', 'flash_requests', 'wanted_requests',
    'listing_media', 'listings', 'verification_requests', 'flagged_listings',
    'trade_disputes', 'announcements', 'admin_audit_logs', 'prohibited_keywords',
    'feature_flags', 'system_config', 'password_reset_requests',
    'newsletter_subscribers', 'users'
  ];

  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of tables) {
    const hasTable = await knex.schema.hasTable(table);
    if (hasTable) {
      await knex(table).truncate().catch(() => {});
    }
  }
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

  // Hash admin password using 12 salt rounds for enhanced brute-force resistance
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@tradelink.ph';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'TradeLink@2026';
  const adminName = process.env.ADMIN_SEED_NAME || 'TradeLink Admin';
  const adminHash = await bcrypt.hash(adminPassword, 12);

  // 1. Seed ONLY the single official Administrator Account
  await knex('users').insert([
    {
      id: 'user-admin',
      name: adminName,
      email: adminEmail,
      student_id: 'ADMIN001',
      password_hash: adminHash,
      role: 'admin',
      campus: 'UC Main',
      college: 'CCS',
      year_level: 'Faculty / Staff',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      is_verified: true,
      id_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      trust_score: 100,
      rating: 5.0,
      total_reviews: 0,
      completed_trades: 0,
      punctuality_rate: 100,
      bio: 'Official TradeLink Administration & Moderation Desk.',
      is_pro_merchant: false,
      is_banned: false
    }
  ]);

  // 2. Seed Baseline Campus Announcements
  await knex('announcements').insert([
    {
      id: 'ann-1',
      title: 'Safe Student Trading Reminder',
      message: 'Coordinate trades safely through direct chat. Always verify items before completing payments.',
      campus: 'All',
      type: 'alert',
      author_id: 'user-admin',
      author_name: 'TradeLink Admin',
      is_active: true
    }
  ]);

  // 3. Seed Prohibited Safety Keywords
  await knex('prohibited_keywords').insert([
    { id: 'kw-1', keyword: 'exam leak', added_by: 'user-admin' },
    { id: 'kw-2', keyword: 'test bank', added_by: 'user-admin' },
    { id: 'kw-3', keyword: 'test paper', added_by: 'user-admin' },
    { id: 'kw-4', keyword: 'midterm answer', added_by: 'user-admin' },
    { id: 'kw-5', keyword: 'final exam key', added_by: 'user-admin' },
    { id: 'kw-6', keyword: 'vape', added_by: 'user-admin' },
    { id: 'kw-7', keyword: 'pod', added_by: 'user-admin' },
    { id: 'kw-8', keyword: 'cigarette', added_by: 'user-admin' },
    { id: 'kw-9', keyword: 'smoke', added_by: 'user-admin' },
    { id: 'kw-10', keyword: 'counterfeit uniform', added_by: 'user-admin' },
    { id: 'kw-11', keyword: 'fake id', added_by: 'user-admin' },
    { id: 'kw-12', keyword: 'liquor', added_by: 'user-admin' },
    { id: 'kw-13', keyword: 'beer', added_by: 'user-admin' },
    { id: 'kw-14', keyword: 'gambling', added_by: 'user-admin' },
    { id: 'kw-15', keyword: 'weapon', added_by: 'user-admin' },
    { id: 'kw-16', keyword: 'knife', added_by: 'user-admin' },
    { id: 'kw-17', keyword: 'proxy test', added_by: 'user-admin' }
  ]);

  // 4. Seed System Configuration & Feature Flags
  await knex('system_config').insert([
    {
      config_key: 'platform_rules',
      config_value: JSON.stringify({
        maintenanceMode: false,
        maxListingPrice: 50000,
        maxMediaPerListing: 5,
        swapModeEnabled: true,
        wantedBoardEnabled: true,
        freeDonationEnabled: true,
        maxListingsPerUser: 20
      }),
      last_updated_by: 'user-admin'
    }
  ]);

  await knex('feature_flags').insert([
    { id: 'ff-1', name: 'Campus Fair Price Guide', description: 'Standard campus student resale valuation', enabled: true },
    { id: 'ff-2', name: 'Direct Student Chat', description: 'Enable instant peer-to-peer student messaging', enabled: true },
    { id: 'ff-3', name: 'Campus Swap Desk', description: 'Allow barter and item-for-item swaps', enabled: true }
  ]);
};
