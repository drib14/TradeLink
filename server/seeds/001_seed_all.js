const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Truncate tables in reverse dependency order
  const tables = [
    'review_badges', 'reviews', 'messages', 'conversations',
    'transactions', 'swap_offers', 'wanted_requests', 'listing_media',
    'listings', 'verification_requests', 'flagged_listings', 'trade_disputes',
    'announcements', 'admin_audit_logs', 'prohibited_keywords',
    'feature_flags', 'system_config', 'users'
  ];

  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of tables) {
    const hasTable = await knex.schema.hasTable(table);
    if (hasTable) {
      await knex(table).truncate();
    }
  }
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

  const adminHash = await bcrypt.hash('TradeLink@2026', 10);

  // 1. Seed Default Administrator Account & Student Test Accounts
  await knex('users').insert([
    {
      id: 'user-admin',
      name: 'UC Administrator',
      email: 'uc.tradelink@gmail.com',
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
      bio: 'Official TradeLink Campus Moderation & Safety Desk. Verified student marketplace.',
      is_pro_merchant: false,
      is_banned: false
    },
    {
      id: 'user-student-1',
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@uc.edu.ph',
      student_id: '20240001',
      password_hash: adminHash,
      role: 'student',
      campus: 'UC Main',
      college: 'CCS',
      year_level: '3rd Year',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      is_verified: true,
      id_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      trust_score: 85,
      rating: 5.0,
      total_reviews: 4,
      completed_trades: 3,
      punctuality_rate: 100,
      bio: 'BSIT 3rd Year student at UC Main. Regular campus trader.',
      is_pro_merchant: false,
      is_banned: false
    },
    {
      id: 'user-student-2',
      name: 'Maria Santos',
      email: 'maria.santos@uc.edu.ph',
      student_id: '20240002',
      password_hash: adminHash,
      role: 'student',
      campus: 'UC Banilad',
      college: 'CBA',
      year_level: '2nd Year',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      is_verified: false,
      id_photo_url: null,
      trust_score: 60,
      rating: 5.0,
      total_reviews: 0,
      completed_trades: 0,
      punctuality_rate: 100,
      bio: 'BSBA 2nd Year student at UC Banilad.',
      is_pro_merchant: false,
      is_banned: false
    }
  ]);

  // 2. Seed Campus Announcements
  await knex('announcements').insert([
    {
      id: 'ann-1',
      title: 'Safe Student Trading Reminder',
      message: 'Coordinate trades safely through direct chat. Always verify items before completing payments.',
      campus: 'All',
      type: 'alert',
      author_id: 'user-admin',
      author_name: 'UC Administration',
      is_active: true
    },
    {
      id: 'ann-2',
      title: 'Junior High & Senior High Trading Desk Live',
      message: 'Students from UC PRI and UC South high school departments can now trade textbooks and PE uniforms with zero platform fees.',
      campus: 'UC PRI',
      type: 'info',
      author_id: 'user-admin',
      author_name: 'High School Coordinator',
      is_active: true
    }
  ]);

  // 3. Seed Admin Audit Logs
  await knex('admin_audit_logs').insert([
    {
      id: 'log-1',
      admin_id: 'user-admin',
      admin_name: 'UC Administrator',
      action: 'Platform Initialized',
      target_type: 'system',
      target_id: 'system',
      details: 'Admin desk initialized for University of Cebu campus network',
      ip_address: '127.0.0.1'
    }
  ]);

  // 4. Seed Prohibited Keywords
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

  // 5. Seed System Configuration & Feature Flags
  await knex('system_config').insert([
    {
      config_key: 'platform_rules',
      config_value: JSON.stringify({
        maintenanceMode: false,
        maxListingPrice: 50000,
        maxMediaPerListing: 10,
        swapModeEnabled: true,
        wantedBoardEnabled: true,
        freeDonationEnabled: true,
        maxListingsPerUser: 20
      }),
      last_updated_by: 'user-admin'
    }
  ]);

  await knex('feature_flags').insert([
    { id: 'ff-1', name: 'Price Advisor AI', description: 'Enable AI-powered pricing suggestions', enabled: true },
    { id: 'ff-2', name: 'Direct Student Chat', description: 'Enable instant peer-to-peer student messaging', enabled: true },
    { id: 'ff-3', name: 'Campus Swap Desk', description: 'Allow barter and item-for-item swaps', enabled: true }
  ]);
};
