require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('=== Connecting to Live Database ===');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);

  const sslConfig = process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : false;

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 4000,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: sslConfig,
      multipleStatements: true
    });
    console.log('✓ Successfully connected to live database!');
  } catch (err) {
    console.error('✗ Failed to connect to database:', err.message);
    process.exit(1);
  }

  try {
    // 1. Check if tables exist
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Found ${tables.length} tables in ${process.env.DB_NAME}.`);

    if (tables.length === 0) {
      console.log('No tables found. Executing schema.sql...');
      const schemaPath = path.resolve(__dirname, '../../DB/schema.sql');
      let schemaSql = fs.readFileSync(schemaPath, 'utf8');
      // Strip CREATE DATABASE / USE commands if targeting remote database
      schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS `[^`]+`[^;]*;/gi, '');
      schemaSql = schemaSql.replace(/USE `[^`]+`;/gi, '');
      await connection.query(schemaSql);
      console.log('✓ Schema applied successfully.');
    }

    console.log('\n--- Cleaning tables (deleting all mock users and products) ---');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const cleanTables = [
      'review_badges', 'reviews', 'messages', 'conversations',
      'transactions', 'swap_offers', 'flash_requests', 'wanted_requests',
      'listing_media', 'listings', 'verification_requests', 'flagged_listings',
      'trade_disputes', 'announcements', 'admin_audit_logs', 'prohibited_keywords',
      'password_reset_requests', 'feature_flags', 'system_config',
      'users'
    ];

    for (const tbl of cleanTables) {
      try {
        await connection.query(`DELETE FROM \`${tbl}\``);
        console.log(`✓ Cleared table: ${tbl}`);
      } catch (tableErr) {
        // Ignore if table does not exist
      }
    }

    // Ensure users security columns exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    `);
    const colNames = columns.map(c => c.COLUMN_NAME);

    if (!colNames.includes('token_version')) {
      await connection.query('ALTER TABLE `users` ADD COLUMN `token_version` INT UNSIGNED NOT NULL DEFAULT 1');
    }
    if (!colNames.includes('failed_login_attempts')) {
      await connection.query('ALTER TABLE `users` ADD COLUMN `failed_login_attempts` INT UNSIGNED NOT NULL DEFAULT 0');
    }
    if (!colNames.includes('locked_until')) {
      await connection.query('ALTER TABLE `users` ADD COLUMN `locked_until` DATETIME DEFAULT NULL');
    }
    if (!colNames.includes('failed_reset_attempts')) {
      await connection.query('ALTER TABLE `users` ADD COLUMN `failed_reset_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0');
    }
    if (!colNames.includes('password_changed_at')) {
      await connection.query('ALTER TABLE `users` ADD COLUMN `password_changed_at` DATETIME DEFAULT NULL');
    }

    console.log('\n--- Seeding Administrator Account ONLY ---');
    const adminEmail = process.env.ADMIN_SEED_EMAIL || 'uc.tradelink@gmail.com';
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'TradeLink@2026';
    const adminName = process.env.ADMIN_SEED_NAME || 'TradeLink Moderation Team';

    // Bcrypt 12 salt rounds
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

    await connection.query(`
      INSERT INTO \`users\` (
        \`id\`, \`name\`, \`email\`, \`student_id\`, \`password_hash\`, \`role\`, \`campus\`, \`department\`,
        \`avatar_url\`, \`is_verified\`, \`id_photo_url\`, \`trust_score\`, \`rating\`, \`total_reviews\`,
        \`completed_trades\`, \`punctuality_rate\`, \`bio\`, \`is_banned\`, \`token_version\`
      ) VALUES (
        'user-admin',
        ?,
        ?,
        'ADMIN001',
        ?,
        'admin',
        'UC Main',
        'CCS',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        1,
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
        100,
        5.0,
        0,
        0,
        100,
        'TradeLink Community Moderation Desk. Direct peer-to-peer student verification and trust enforcement.',
        0,
        1
      )
    `, [adminName, adminEmail, adminPasswordHash]);
    console.log(`✓ Administrator account seeded: ${adminEmail} (ADMIN001)`);

    console.log('\n--- Seeding Baseline Announcements & Prohibited Keywords ---');
    await connection.query(`
      INSERT INTO \`announcements\` (\`id\`, \`title\`, \`message\`, \`campus\`, \`type\`, \`author_id\`, \`is_active\`) VALUES
      ('ann-1', 'Campus Safety & Meetup Guidelines', 'Schedule handovers in well-lit public campus spots (canteen, library entrance, or student lounge) during daylight hours. Always physically inspect items before finalizing payment or barter.', 'All', 'alert', 'user-admin', 1),
      ('ann-2', 'Academic Resource Desk Active', 'Need calculators, reviewers, or course essentials urgently? Use Flash Market to post instant same-day peer requests to students on your campus.', 'All', 'info', 'user-admin', 1),
      ('ann-3', 'Textbook & Gear Swap Portal Live', 'TradeLink now fully supports direct item-for-item swaps and textbook exchanges with zero platform fees.', 'All', 'info', 'user-admin', 1)
    `);

    await connection.query(`
      INSERT INTO \`admin_audit_logs\` (\`id\`, \`admin_id\`, \`admin_name\`, \`action\`, \`target_type\`, \`target_id\`, \`details\`, \`ip_address\`) VALUES
      ('log-1', 'user-admin', 'TradeLink Moderation', 'Platform Initialized', 'system', 'system', 'Production safety desk and KYC verification queues initialized.', '127.0.0.1')
    `);

    await connection.query(`
      INSERT INTO \`prohibited_keywords\` (\`id\`, \`keyword\`, \`added_by\`) VALUES
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
      ('kw-17', 'proxy test', 'user-admin')
    `);

    await connection.query(`
      INSERT INTO \`system_config\` (\`config_key\`, \`config_value\`, \`last_updated_by\`) VALUES
      ('platform_rules', JSON_OBJECT(
        'maintenanceMode', false,
        'maxListingPrice', 50000,
        'maxImagesPerListing', 10,
        'swapModeEnabled', true,
        'flashMarketEnabled', true,
        'freeDonationEnabled', true,
        'maxListingsPerUser', 25
      ), 'user-admin')
    `);

    await connection.query(`
      INSERT INTO \`feature_flags\` (\`id\`, \`name\`, \`description\`, \`enabled\`) VALUES
      ('ff-1', 'Campus Fair Price Guide', 'Standard campus student resale valuation', 1),
      ('ff-2', 'Direct Student Chat', 'Peer-to-peer student messaging connected to listings and flash requests', 1),
      ('ff-3', 'Campus Swap Desk', 'Allow item-for-item barter swaps across all UC campuses', 1),
      ('ff-4', 'Flash Market Board', 'Urgent same-day buy, sell, and donation board', 1)
    `);

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n=== Database Verification ===');
    const [[userCount]] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [[listingCount]] = await connection.query('SELECT COUNT(*) as count FROM listings');
    const [[txCount]] = await connection.query('SELECT COUNT(*) as count FROM transactions');
    const [[flashCount]] = await connection.query('SELECT COUNT(*) as count FROM flash_requests');
    const [[annCount]] = await connection.query('SELECT COUNT(*) as count FROM announcements');

    console.log(`Users in DB:        ${userCount.count} (Expected: 1 - Admin only)`);
    console.log(`Listings in DB:     ${listingCount.count} (Expected: 0 - Clean)`);
    console.log(`Transactions in DB: ${txCount.count} (Expected: 0 - Clean)`);
    console.log(`Flash Requests:     ${flashCount.count} (Expected: 0 - Clean)`);
    console.log(`Announcements:      ${annCount.count} (Expected: 3 - Baseline)`);

    console.log('\n✓ Clean seed completed successfully!');
  } catch (err) {
    console.error('✗ Execution error:', err);
  } finally {
    await connection.end();
  }
}

main();
