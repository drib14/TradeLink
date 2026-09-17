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

    // 1c. Ensure flash_requests table and conversation foreign keys exist
    const hasFlash = await db.schema.hasTable('flash_requests').catch(() => false);
    const hasWanted = await db.schema.hasTable('wanted_requests').catch(() => false);
    if (hasWanted && !hasFlash) {
      await db.schema.renameTable('wanted_requests', 'flash_requests').catch(() => {});
      logger.info('[DB Init] Renamed wanted_requests to flash_requests.');
    } else if (!hasFlash) {
      await db.raw(`
        CREATE TABLE IF NOT EXISTS \`flash_requests\` (
          \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
          \`requester_id\` VARCHAR(36) NOT NULL,
          \`item_name\` VARCHAR(150) NOT NULL,
          \`category\` VARCHAR(50) NOT NULL,
          \`target_campus\` VARCHAR(50) NOT NULL,
          \`urgency\` VARCHAR(50) NOT NULL DEFAULT 'flexible',
          \`budget_range\` VARCHAR(50) DEFAULT NULL,
          \`notes\` TEXT DEFAULT NULL,
          \`status\` ENUM('open', 'fulfilled', 'cancelled', 'expired') NOT NULL DEFAULT 'open',
          \`offers_count\` INT UNSIGNED NOT NULL DEFAULT 0,
          \`duration_hours\` INT NOT NULL DEFAULT 24,
          \`expires_at\` DATETIME DEFAULT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_flash_requester\` (\`requester_id\`),
          INDEX \`idx_flash_campus\` (\`target_campus\`),
          INDEX \`idx_flash_status\` (\`status\`),
          CONSTRAINT \`fk_flash_user\` FOREIGN KEY (\`requester_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(() => {});
      logger.info('[DB Init] Created flash_requests table.');
    }

    // Ensure expires_at and duration_hours exist on flash_requests
    const hasExpiresCol = await db.schema.hasColumn('flash_requests', 'expires_at').catch(() => false);
    if (!hasExpiresCol) {
      await db.schema.alterTable('flash_requests', (t) => {
        t.datetime('expires_at').nullable();
        t.integer('duration_hours').defaultTo(24);
      }).catch(() => {});
    }

    // Ensure flash_request_id exists on conversations
    const hasConvFlashCol = await db.schema.hasColumn('conversations', 'flash_request_id').catch(() => false);
    if (!hasConvFlashCol) {
      await db.schema.alterTable('conversations', (t) => {
        t.string('flash_request_id', 36).nullable();
        t.index('flash_request_id', 'idx_conv_flash');
      }).catch(() => {});
    }

    // Ensure flash_request_id exists on messages
    const hasMsgFlashCol = await db.schema.hasColumn('messages', 'flash_request_id').catch(() => false);
    if (!hasMsgFlashCol) {
      await db.schema.alterTable('messages', (t) => {
        t.string('flash_request_id', 36).nullable();
        t.index('flash_request_id', 'idx_msg_flash');
      }).catch(() => {});
    }

    // 1d. Ensure verification_requests columns exist for automated approval and fraud analysis
    const hasVerifTable = await db.schema.hasTable('verification_requests').catch(() => false);
    if (hasVerifTable) {
      const hasConfidenceCol = await db.schema.hasColumn('verification_requests', 'confidence_score').catch(() => false);
      if (!hasConfidenceCol) {
        await db.schema.alterTable('verification_requests', (t) => {
          t.integer('confidence_score').defaultTo(0);
          t.boolean('is_suspicious').defaultTo(false);
          t.text('suspicious_reasons').nullable();
          t.text('credential_diagnostics').nullable();
          t.string('id_photo_hash', 64).nullable();
          t.string('selfie_photo_hash', 64).nullable();
          t.string('verification_method', 50).defaultTo('automated');
          t.index('is_suspicious', 'idx_verif_suspicious');
        }).catch(() => {});
        logger.info('[DB Init] Enhanced verification_requests table with automated confidence and fraud detection columns.');
      }
    }

    // 1e. Ensure listings.category is VARCHAR(100) to support all university categories
    try {
      await db.raw('ALTER TABLE `listings` MODIFY COLUMN `category` VARCHAR(100) NOT NULL;');
    } catch (_) {}

    // 1f. Ensure newsletter_subscribers table exists
    const hasNewsletterTable = await db.schema.hasTable('newsletter_subscribers').catch(() => false);
    if (!hasNewsletterTable) {
      await db.raw(`
        CREATE TABLE IF NOT EXISTS \`newsletter_subscribers\` (
          \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
          \`email\` VARCHAR(150) NOT NULL UNIQUE,
          \`status\` ENUM('active', 'unsubscribed') NOT NULL DEFAULT 'active',
          \`ip_address\` VARCHAR(45) DEFAULT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX \`idx_newsletter_email\` (\`email\`),
          INDEX \`idx_newsletter_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(() => {});
      logger.info('[DB Init] Created newsletter_subscribers table.');
    }

    // 1f. Ensure users table has advanced security authentication columns
    const hasUsers = await db.schema.hasTable('users').catch(() => false);
    if (hasUsers) {
      const hasFailedAttempts = await db.schema.hasColumn('users', 'failed_login_attempts').catch(() => false);
      if (!hasFailedAttempts) {
        await db.schema.alterTable('users', (t) => {
          t.integer('failed_login_attempts').unsigned().defaultTo(0);
          t.datetime('locked_until').nullable();
          t.integer('token_version').unsigned().defaultTo(1);
          t.tinyint('failed_reset_attempts').unsigned().defaultTo(0);
          t.datetime('password_changed_at').nullable();
        }).catch(() => {});
        logger.info('[DB Init] Added security auth columns to users table.');
      }
    }

    // 2. Ensure Sole Administrator Account Exists: uc.tradelink@gmail.com | TradeLink@2026 | TradeLink Admin
    const adminPassword = 'TradeLink@2026';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    // Remove legacy or alternative admin accounts
    await db('users').where({ email: 'admin@uc.edu.ph' }).del().catch(() => {});
    await db('users').where({ id: 'user-admin' }).whereNot({ email: 'uc.tradelink@gmail.com' }).del().catch(() => {});

    const existingAdmin = await db('users').where({ email: 'uc.tradelink@gmail.com' }).first();
    if (existingAdmin) {
      await db('users').where({ id: existingAdmin.id }).update({
        name: 'TradeLink Admin',
        password_hash: adminPasswordHash,
        role: 'admin',
        is_banned: false,
        is_verified: true
      });
      logger.info(`[DB Init] Synchronized credentials for admin account [${existingAdmin.email}]`);
    } else {
      await db('users').insert({
        id: 'user-admin-main',
        name: 'TradeLink Admin',
        email: 'uc.tradelink@gmail.com',
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
        bio: 'Official TradeLink Administration & Moderation Desk.',
        is_pro_merchant: false,
        is_banned: false
      });
      logger.info('[DB Init] Created administrator: uc.tradelink@gmail.com');
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
            maxImagesPerListing: 10,
            swapModeEnabled: true,
            flashMarketEnabled: true,
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

    // 7. Normalize all zero-transaction user stats to 0, 0.0, and 0%
    if (hasUsersTable) {
      await db('users')
        .where('completed_trades', 0)
        .where('total_reviews', 0)
        .update({
          trust_score: 0,
          rating: 0.0,
          punctuality_rate: 0
        })
        .catch(() => {});
    }

    logger.info('[DB Init] Database is fully synchronized.');
  } catch (err) {
    logger.warn(`[DB Init Warning] autoInitDatabase: ${err.message}`);
  }
}

module.exports = { autoInitDatabase };
