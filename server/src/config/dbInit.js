const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const env = require('./env');
const logger = require('../utils/logger');

/**
 * Auto-initialize database tables, default administrator credentials, and baseline system records.
 */
async function autoInitDatabase() {
  try {
    logger.info('[DB Init] Checking TradeLink database schema and baseline records...');

    // 1. Check if 'users' table exists. If not, initialize from DB/schema.sql
    const hasUsersTable = await db.schema.hasTable('users');
    if (!hasUsersTable) {
      logger.info('[DB Init] Tables not found. Initializing database schema from DB/schema.sql...');
      const schemaPath = path.resolve(__dirname, '../../../DB/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const statements = schemaSql
          .split(/;\s*[\r\n]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--'));

        await db.raw('SET FOREIGN_KEY_CHECKS = 0;');
        for (const stmt of statements) {
          if (stmt.toLowerCase().startsWith('use ') || stmt.toLowerCase().startsWith('create database ')) {
            continue;
          }
          await db.raw(stmt);
        }
        await db.raw('SET FOREIGN_KEY_CHECKS = 1;');
        logger.info('[DB Init] Database schema initialized successfully.');
      } else {
        logger.warn(`[DB Init] schema.sql not found at ${schemaPath}`);
      }
    }

    // 1b. Ensure password_reset_requests table exists
    const hasPasswordResetTable = await db.schema.hasTable('password_reset_requests');
    if (!hasPasswordResetTable) {
      await db.raw(`
        CREATE TABLE IF NOT EXISTS \`password_reset_requests\` (
          \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
          \`user_id\` VARCHAR(36) NOT NULL,
          \`email\` VARCHAR(150) NOT NULL,
          \`status\` ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
          \`code_hash\` VARCHAR(255) DEFAULT NULL,
          \`code_exp\` DATETIME DEFAULT NULL,
          \`reviewed_by\` VARCHAR(36) DEFAULT NULL,
          \`admin_note\` VARCHAR(500) DEFAULT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`reviewed_at\` DATETIME DEFAULT NULL,
          INDEX \`idx_pw_reset_user_id\` (\`user_id\`),
          INDEX \`idx_pw_reset_status\` (\`status\`),
          INDEX \`idx_pw_reset_email\` (\`email\`),
          CONSTRAINT \`fk_pw_reset_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      logger.info('[DB Init] Created password_reset_requests table.');
    }

    // 2. Ensure Default Administrator Account Exists (admin@uc.edu.ph / uc.tradelink@gmail.com / TradeLink@2026)
    const adminPassword = 'TradeLink@2026';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    const existingAdminById = await db('users').where({ id: 'user-admin' }).first();

    if (existingAdminById) {
      await db('users').where({ id: 'user-admin' }).update({
        password_hash: adminPasswordHash,
        role: 'admin',
        is_banned: false,
        is_verified: true
      });
      logger.info(`[DB Init] Synchronized credentials for admin account [${existingAdminById.email}]`);
    } else {
      await db('users').insert({
        id: 'user-admin',
        name: 'UC Administrator',
        email: 'admin@uc.edu.ph',
        student_id: 'ADMIN001',
        password_hash: adminPasswordHash,
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
      });
      logger.info('[DB Init] Created default administrator: admin@uc.edu.ph');
    }

    // Also ensure uc.tradelink@gmail.com exists as an active admin
    const existingGmailAdmin = await db('users').where({ email: 'uc.tradelink@gmail.com' }).first();
    if (!existingGmailAdmin) {
      await db('users').insert({
        id: 'user-admin-gmail',
        name: 'TradeLink Support Admin',
        email: 'uc.tradelink@gmail.com',
        student_id: 'ADMIN002',
        password_hash: adminPasswordHash,
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
      }).catch(() => {});
      logger.info('[DB Init] Created alternate administrator: uc.tradelink@gmail.com');
    } else {
      await db('users').where({ id: existingGmailAdmin.id }).update({
        password_hash: adminPasswordHash,
        role: 'admin',
        is_banned: false,
        is_verified: true
      });
    }

    // 3. Ensure Default System Configuration Exists
    const hasConfigTable = await db.schema.hasTable('system_config');
    if (hasConfigTable) {
      const existingConfig = await db('system_config').where({ config_key: 'platform_rules' }).first();
      if (!existingConfig) {
        await db('system_config').insert({
          config_key: 'platform_rules',
          config_value: JSON.stringify({
            maintenanceMode: false,
            maxListingPrice: 50000,
            maxImagesPerListing: 5,
            swapModeEnabled: true,
            wantedBoardEnabled: true,
            freeDonationEnabled: true,
            maxListingsPerUser: 20
          }),
          last_updated_by: 'user-admin'
        });
        logger.info('[DB Init] Initialized default system configuration.');
      }
    }

    // 4. Ensure Default Announcements Exist
    const hasAnnouncementsTable = await db.schema.hasTable('announcements');
    if (hasAnnouncementsTable) {
      const announcementCount = await db('announcements').count('id as count').first();
      if (Number(announcementCount?.count || 0) === 0) {
        await db('announcements').insert([
          {
            id: 'ann-1',
            title: 'Guarded Meetup Reminder',
            message: 'Always meet inside official UC campus security gates during daytime hours. Inspect items before scanning the Handshake QR code.',
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
        logger.info('[DB Init] Seeded baseline campus announcements.');
      }
    }

    // 5. Ensure Default Prohibited Keywords Exist
    const hasKeywordsTable = await db.schema.hasTable('prohibited_keywords');
    if (hasKeywordsTable) {
      const keywordCount = await db('prohibited_keywords').count('id as count').first();
      if (Number(keywordCount?.count || 0) === 0) {
        const defaultKeywords = [
          'exam leak', 'test bank', 'test paper', 'midterm answer', 'final exam key',
          'homework service', 'essay writer', 'shabu', 'marijuana', 'weed', 'vape',
          'cigarette', 'alcohol', 'gambling', 'weapon', 'knife', 'proxy test'
        ];
        const keywordRows = defaultKeywords.map((kw, idx) => ({
          id: `kw-${idx + 1}`,
          keyword: kw,
          added_by: 'user-admin'
        }));
        await db('prohibited_keywords').insert(keywordRows);
        logger.info(`[DB Init] Seeded ${defaultKeywords.length} prohibited security keywords.`);
      }
    }

    // 6. Ensure Default Feature Flags Exist
    const hasFlagsTable = await db.schema.hasTable('feature_flags');
    if (hasFlagsTable) {
      const flagCount = await db('feature_flags').count('id as count').first();
      if (Number(flagCount?.count || 0) === 0) {
        await db('feature_flags').insert([
          { id: 'ff-1', name: 'Price Advisor AI', description: 'Enable AI-powered pricing suggestions', enabled: true },
          { id: 'ff-2', name: 'Campus Map', description: 'Interactive campus meetup map', enabled: true },
          { id: 'ff-3', name: 'Pro Merchant Badge', description: 'Allow pro merchant status for top sellers', enabled: true },
          { id: 'ff-4', name: 'Dark Mode', description: 'Dark mode toggle for all users', enabled: true }
        ]);
        logger.info('[DB Init] Seeded default feature flags.');
      }
    }

    logger.info('[DB Init] Database is fully synchronized.');
  } catch (err) {
    logger.warn(`[DB Init Warning] autoInitDatabase: ${err.message}`);
  }
}

module.exports = { autoInitDatabase };
