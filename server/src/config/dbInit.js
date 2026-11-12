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

    // 1a. Ensure 'users' table has token_version and auth hardening columns
    const hasUsers = await db.schema.hasTable('users');
    if (hasUsers) {
      const hasTokenVersion = await db.schema.hasColumn('users', 'token_version').catch(() => false);
      if (!hasTokenVersion) {
        await db.schema.alterTable('users', (t) => {
          t.integer('failed_login_attempts').unsigned().notNullable().defaultTo(0);
          t.dateTime('locked_until').nullable();
          t.integer('token_version').unsigned().notNullable().defaultTo(1);
          t.tinyint('failed_reset_attempts').unsigned().notNullable().defaultTo(0);
          t.dateTime('password_changed_at').nullable();
        }).catch((err) => {
          logger.warn(`[DB Init] Could not alter users table: ${err.message}`);
        });
        logger.info('[DB Init] Added token_version and auth hardening columns to users table.');
      }

      // 1a-1. Ensure 'users' table has both college and department columns and year_level is nullable
      const hasCollege = await db.schema.hasColumn('users', 'college').catch(() => false);
      const hasDepartment = await db.schema.hasColumn('users', 'department').catch(() => false);
      const hasYearLevel = await db.schema.hasColumn('users', 'year_level').catch(() => false);

      if (!hasCollege) {
        await db.schema.alterTable('users', (t) => {
          t.string('college', 100).nullable().defaultTo(null);
        }).catch(() => {});
      } else {
        await db.raw('ALTER TABLE `users` MODIFY COLUMN `college` VARCHAR(100) NULL DEFAULT NULL;').catch(() => {});
      }

      if (!hasDepartment) {
        await db.schema.alterTable('users', (t) => {
          t.string('department', 100).nullable().defaultTo(null);
        }).catch(() => {});
      } else {
        await db.raw('ALTER TABLE `users` MODIFY COLUMN `department` VARCHAR(100) NULL DEFAULT NULL;').catch(() => {});
      }

      if (!hasYearLevel) {
        await db.schema.alterTable('users', (t) => {
          t.string('year_level', 50).nullable().defaultTo(null);
        }).catch(() => {});
      } else {
        await db.raw('ALTER TABLE `users` MODIFY COLUMN `year_level` VARCHAR(50) NULL DEFAULT NULL;').catch(() => {});
      }
    }

    // 1b. Ensure password_reset_requests table exists
    const hasPasswordResetTable = await db.schema.hasTable('password_reset_requests');
    if (!hasPasswordResetTable) {
      await db.raw(`
        CREATE TABLE IF NOT EXISTS \`password_reset_requests\` (
          \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
          \`user_id\` VARCHAR(36) NOT NULL,
          \`status\` ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
          \`code_hash\` VARCHAR(255) DEFAULT NULL,
          \`code_exp\` DATETIME DEFAULT NULL,
          \`reviewed_by\` VARCHAR(36) DEFAULT NULL,
          \`admin_note\` VARCHAR(255) DEFAULT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          \`reviewed_at\` DATETIME DEFAULT NULL,
          INDEX \`idx_pw_reset_user_id\` (\`user_id\`),
          INDEX \`idx_pw_reset_reviewer\` (\`reviewed_by\`),
          INDEX \`idx_pw_reset_status\` (\`status\`),
          CONSTRAINT \`fk_pw_reset_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      logger.info('[DB Init] Created password_reset_requests table.');
    }

    // 1c. Ensure flash_requests table and conversation foreign keys exist
    const hasFlash = await db.schema.hasTable('flash_requests').catch(() => false);
    if (!hasFlash) {
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

    // 1d. Ensure accepted_payment_methods exists on listings table
    const hasListingsTable = await db.schema.hasTable('listings').catch(() => false);
    if (hasListingsTable) {
      const hasAcceptedPaymentMethods = await db.schema.hasColumn('listings', 'accepted_payment_methods').catch(() => false);
      if (!hasAcceptedPaymentMethods) {
        await db.schema.alterTable('listings', (t) => {
          t.string('accepted_payment_methods', 255).notNullable().defaultTo('cash,gcash,maya');
        }).catch((err) => {
          logger.warn(`[DB Init] Could not alter listings table: ${err.message}`);
        });
        logger.info('[DB Init] Added accepted_payment_methods column to listings table.');
      }

      const hasIsFeatured = await db.schema.hasColumn('listings', 'is_featured').catch(() => false);
      if (!hasIsFeatured) {
        await db.schema.alterTable('listings', (t) => {
          t.boolean('is_featured').notNullable().defaultTo(false);
        }).catch((err) => {
          logger.warn(`[DB Init] Could not add is_featured column to listings table: ${err.message}`);
        });
        logger.info('[DB Init] Added is_featured column to listings table.');
      }

      const hasQuantity = await db.schema.hasColumn('listings', 'quantity').catch(() => false);
      if (!hasQuantity) {
        await db.schema.alterTable('listings', (t) => {
          t.integer('quantity').unsigned().notNullable().defaultTo(1);
        }).catch((err) => {
          logger.warn(`[DB Init] Could not add quantity column to listings table: ${err.message}`);
        });
        logger.info('[DB Init] Added quantity column to listings table.');
      }
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

    // Drop legacy newsletter_subscribers table if exists
    await db.raw('DROP TABLE IF EXISTS `newsletter_subscribers`;').catch(() => {});

    // 1g. Ensure listing_views table exists for persistent unique view tracking
    const hasListingViewsTable = await db.schema.hasTable('listing_views').catch(() => false);
    if (!hasListingViewsTable) {
      await db.raw(`
        CREATE TABLE IF NOT EXISTS \`listing_views\` (
          \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
          \`listing_id\` VARCHAR(36) NOT NULL,
          \`viewer_identifier\` VARCHAR(128) NOT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY \`uniq_listing_viewer\` (\`listing_id\`, \`viewer_identifier\`),
          INDEX \`idx_listing_views_listing\` (\`listing_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(() => {});
      logger.info('[DB Init] Created listing_views table for persistent deduplicated view counting.');
    }

    // 1h. Ensure flash_requests.image_url exists
    const hasFlashImageCol = await db.schema.hasColumn('flash_requests', 'image_url').catch(() => false);
    if (!hasFlashImageCol) {
      await db.schema.alterTable('flash_requests', (t) => {
        t.string('image_url', 255).nullable();
      }).catch(() => {});
      logger.info('[DB Init] Added image_url column to flash_requests table.');
    }

    // 1i. Ensure transactions verification handshake columns exist
    const hasTransactionsTable = await db.schema.hasTable('transactions').catch(() => false);
    if (hasTransactionsTable) {
      const hasCodeHash = await db.schema.hasColumn('transactions', 'verification_code_hash').catch(() => false);
      if (!hasCodeHash) {
        await db.schema.alterTable('transactions', (t) => {
          t.string('verification_code_hash', 255).nullable();
          t.integer('failed_handshake_attempts').unsigned().notNullable().defaultTo(0);
          t.dateTime('handshake_locked_until').nullable();
        }).catch((err) => {
          logger.warn(`[DB Init] Could not alter transactions table: ${err.message}`);
        });
        logger.info('[DB Init] Added verification_code_hash and security columns to transactions table.');
      }
    }

    // Self-healing: Backfill missing or null flash_requests images with high-resolution academic photos
    try {
      const emptyImageRequests = await db('flash_requests')
        .whereNull('image_url')
        .orWhere('image_url', '')
        .select('id', 'item_name', 'category');

      for (const req of emptyImageRequests) {
        let fallbackImage = 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80';
        const nameLower = (req.item_name || '').toLowerCase();
        const catLower = (req.category || '').toLowerCase();

        if (nameLower.includes('calculator') || catLower.includes('calculator')) {
          fallbackImage = 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80';
        } else if (nameLower.includes('uniform') || nameLower.includes('epaulette') || catLower.includes('uniform')) {
          fallbackImage = nameLower.includes('marine') || nameLower.includes('epaulette')
            ? 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
            : 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=800&q=80';
        } else if (nameLower.includes('medical') || nameLower.includes('stethoscope') || catLower.includes('medical')) {
          fallbackImage = 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80';
        } else if (nameLower.includes('drafting') || nameLower.includes('square') || catLower.includes('architecture') || catLower.includes('engineering')) {
          fallbackImage = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
        } else if (nameLower.includes('notes') || nameLower.includes('book') || catLower.includes('textbook')) {
          fallbackImage = 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80';
        }

        await db('flash_requests').where({ id: req.id }).update({ image_url: fallbackImage });
      }
      if (emptyImageRequests.length > 0) {
        logger.info(`[DB Init] Backfilled realistic academic images for ${emptyImageRequests.length} flash request(s).`);
      }
    } catch (backfillErr) {
      logger.warn(`[DB Init] Flash image backfill notice: ${backfillErr.message}`);
    }

    // 1i. Ensure listings rating and total_reviews columns exist
    const hasListingRatingCol = await db.schema.hasColumn('listings', 'rating').catch(() => false);
    if (!hasListingRatingCol) {
      await db.schema.alterTable('listings', (t) => {
        t.decimal('rating', 2, 1).defaultTo(0.0);
        t.integer('total_reviews').unsigned().defaultTo(0);
      }).catch(() => {});
      logger.info('[DB Init] Added rating and total_reviews columns to listings table.');
    }

    // 1j. Ensure reviews.listing_id column exists
    const hasReviewListingCol = await db.schema.hasColumn('reviews', 'listing_id').catch(() => false);
    if (!hasReviewListingCol) {
      await db.schema.alterTable('reviews', (t) => {
        t.string('listing_id', 36).nullable();
        t.index('listing_id', 'idx_reviews_listing');
      }).catch(() => {});
      logger.info('[DB Init] Added listing_id column to reviews table.');
    }

    // 1k. Ensure listing_variations table exists
    const hasVariationsTable = await db.schema.hasTable('listing_variations').catch(() => false);
    if (!hasVariationsTable) {
      await db.raw(`
        CREATE TABLE IF NOT EXISTS \`listing_variations\` (
          \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
          \`listing_id\` VARCHAR(36) NOT NULL,
          \`title\` VARCHAR(150) NOT NULL,
          \`price\` DECIMAL(10, 2) DEFAULT NULL,
          \`image_url\` VARCHAR(255) DEFAULT NULL,
          \`image_index\` INT DEFAULT 0,
          \`quantity\` INT DEFAULT 1,
          \`is_available\` BOOLEAN DEFAULT TRUE,
          \`display_order\` INT DEFAULT 0,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX \`idx_variations_listing\` (\`listing_id\`),
          CONSTRAINT \`fk_variations_listing\` FOREIGN KEY (\`listing_id\`) REFERENCES \`listings\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch((err) => {
        logger.warn(`[DB Init] Notice on creating listing_variations table: ${err.message}`);
      });
      logger.info('[DB Init] Initialized listing_variations table.');
    }

    // 1l. Ensure transactions.selected_variation and variation_id exist
    const hasTxVarCol = await db.schema.hasColumn('transactions', 'selected_variation').catch(() => false);
    if (!hasTxVarCol) {
      await db.schema.alterTable('transactions', (t) => {
        t.string('selected_variation', 150).nullable();
        t.string('variation_id', 36).nullable();
      }).catch(() => {});
      logger.info('[DB Init] Added selected_variation and variation_id to transactions table.');
    }

    // 1n. Ensure security_events audit table exists
    const hasSecEvents = await db.schema.hasTable('security_events').catch(() => false);
    if (!hasSecEvents) {
      await db.raw(`
        CREATE TABLE IF NOT EXISTS \`security_events\` (
          \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
          \`event_type\` VARCHAR(100) NOT NULL,
          \`severity\` ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
          \`user_id\` VARCHAR(36) DEFAULT NULL,
          \`ip_address\` VARCHAR(45) DEFAULT NULL,
          \`user_agent\` VARCHAR(256) DEFAULT NULL,
          \`details\` TEXT DEFAULT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX \`idx_security_event_type\` (\`event_type\`),
          INDEX \`idx_security_severity\` (\`severity\`),
          INDEX \`idx_security_user_id\` (\`user_id\`),
          INDEX \`idx_security_created_at\` (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(() => {});
      logger.info('[DB Init] Initialized security_events audit table.');
    }

    // 1o. Database Optimization: Clean up orphaned records & create high-performance composite indexes
    try {
      // Clean up orphaned media rows
      await db.raw(`
        DELETE FROM listing_media
        WHERE listing_id NOT IN (SELECT id FROM listings)
      `).catch(() => {});

      // Drop obsolete legacy tables if any linger
      await db.raw('DROP TABLE IF EXISTS notifications, favorites, listing_tags, conversation_read_status, meetup_transactions, listing_images, newsletter_subscribers;').catch(() => {});

      // Remove redundant duplicate indexes to speed up writes
      const safeDropIndex = async (tbl, idx) => {
        try {
          await db.schema.alterTable(tbl, (t) => t.dropIndex([], idx));
        } catch (_) {}
      };
      await safeDropIndex('users', 'idx_users_email');
      await safeDropIndex('users', 'idx_users_student_id');
      await safeDropIndex('prohibited_keywords', 'idx_keyword');
      await safeDropIndex('transactions', 'idx_tx_ref');
      await safeDropIndex('listing_views', 'idx_listing_views_listing');

      // Add composite indexes for accelerated feed queries & join lookups
      const safeAddIndex = async (tbl, cols, idx) => {
        try {
          await db.schema.alterTable(tbl, (t) => t.index(cols, idx));
        } catch (_) {}
      };
      await safeAddIndex('listings', ['status', 'created_at'], 'idx_listings_status_created');
      await safeAddIndex('listings', ['status', 'campus', 'created_at'], 'idx_listings_status_campus');
      await safeAddIndex('listings', ['status', 'category', 'created_at'], 'idx_listings_status_cat');
      await safeAddIndex('listings', ['seller_id', 'status'], 'idx_listings_seller_status');
      await safeAddIndex('messages', ['conversation_id', 'created_at'], 'idx_msg_conv_created');
      await safeAddIndex('messages', ['receiver_id', 'is_read'], 'idx_msg_recv_unread');
      await safeAddIndex('conversations', ['user_one_id', 'last_message_at'], 'idx_conv_user_one_last');
      await safeAddIndex('conversations', ['user_two_id', 'last_message_at'], 'idx_conv_user_two_last');
      await safeAddIndex('transactions', ['buyer_id', 'status'], 'idx_tx_buyer_status');
      await safeAddIndex('transactions', ['seller_id', 'status'], 'idx_tx_seller_status');
      await safeAddIndex('reviews', ['target_user_id', 'created_at'], 'idx_reviews_target_created');
    } catch (optErr) {
      logger.warn(`[DB Init] Index optimization note: ${optErr.message}`);
    }



    // 2. Ensure Sole Administrator Account Exists using environment variables
    const adminEmail = process.env.ADMIN_SEED_EMAIL || process.env.ADMIN_EMAIL || 'uc.tradelink@gmail.com';
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || process.env.ADMIN_PASSWORD;
    if (!adminPassword && env.isProduction) {
      throw new Error('[DB Init] ADMIN_SEED_PASSWORD is required in production environment.');
    }
    const finalAdminPassword = adminPassword || 'TradeLink@2026';
    const adminName = process.env.ADMIN_SEED_NAME || 'TradeLink Admin';
    const adminPasswordHash = await bcrypt.hash(finalAdminPassword, 10);

    // Remove legacy or alternative admin accounts
    await db('users').where({ email: 'admin@uc.edu.ph' }).del().catch(() => {});
    await db('users').where({ id: 'user-admin' }).whereNot({ email: adminEmail }).del().catch(() => {});

    const existingAdmin = await db('users').where({ email: adminEmail }).first();
    if (existingAdmin) {
      await db('users').where({ id: existingAdmin.id }).update({
        name: adminName,
        password_hash: adminPasswordHash,
        role: 'admin',
        is_banned: false,
        is_verified: true
      });
      logger.info(`[DB Init] Synchronized credentials for admin account [${existingAdmin.email}]`);
    } else {
      await db('users').insert({
        id: 'user-admin-main',
        name: adminName,
        email: adminEmail,
        student_id: '10000001',
        password_hash: adminPasswordHash,
        role: 'admin',
        campus: 'UC Main',
        department: 'CCS',
        college: 'CCS',
        year_level: '4th Year',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        is_verified: true,
        id_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
        trust_score: 100,
        rating: 0.0,
        total_reviews: 0,
        completed_trades: 0,
        punctuality_rate: 100,
        bio: 'Official TradeLink Administration & Moderation Desk.',
        is_banned: false
      });
      logger.info(`[DB Init] Created administrator: ${adminEmail}`);
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
            message: 'Always meet inside official UC campus security gates during daytime hours. Inspect items before completing the transaction.',
            campus: 'All',
            type: 'alert',
            author_id: 'user-admin',
            is_active: true
          },
          {
            id: 'ann-2',
            title: 'Junior High & Senior High Trading Desk Live',
            message: 'Students from UC PRI and UC South high school departments can now trade textbooks and PE uniforms with zero platform fees.',
            campus: 'UC PRI',
            type: 'info',
            author_id: 'user-admin',
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
          { id: 'ff-1', name: 'Campus Fair Price Guide', description: 'Standard campus student resale valuation', enabled: true },
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

    // 8. Ensure categories table and baseline categories exist
    const hasCategoriesTable = await db.schema.hasTable('categories');
    if (!hasCategoriesTable) {
      await db.schema.createTable('categories', (table) => {
        table.string('id', 36).primary();
        table.string('name', 100).notNullable().unique();
        table.string('slug', 100).notNullable();
        table.string('icon', 50).nullable();
        table.integer('display_order').defaultTo(0);
        table.boolean('is_active').defaultTo(true);
        table.string('created_by', 36).nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());

        table.index(['slug'], 'idx_categories_slug');
        table.index(['display_order'], 'idx_categories_display_order');
        table.index(['is_active'], 'idx_categories_is_active');
      }).catch((err) => {
        logger.warn(`[DB Init] Could not create categories table: ${err.message}`);
      });
      logger.info('[DB Init] Created categories table.');
    }

    if (await db.schema.hasTable('categories')) {
      const catCount = await db('categories').count('id as count').first();
      if (Number(catCount?.count || 0) === 0) {
        const { v4: uuidv4 } = require('uuid');
        const defaultCats = [
          'Electronics & Gadgets',
          'Textbooks & Reviewers',
          'Uniforms & Apparel',
          'Calculators & Electronics',
          'Fashion & Sneakers',
          'Music & Instruments',
          'Audio & Gadgets',
          'Dorm & Living',
          'Gaming & Tech',
          'Medical Equipment',
          'Junior High School Books & Reviewers',
          'Senior High Reviewers & Books',
          'General Supplies'
        ];
        for (let i = 0; i < defaultCats.length; i++) {
          const name = defaultCats[i];
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          await db('categories').insert({
            id: uuidv4(),
            name,
            slug: slug || 'general',
            display_order: i + 1,
            is_active: true
          }).catch(() => {});
        }
        logger.info(`[DB Init] Seeded ${defaultCats.length} default categories.`);
      }
    }

    logger.info('[DB Init] Database is fully synchronized.');
  } catch (err) {
    logger.warn(`[DB Init Warning] autoInitDatabase: ${err.message}`);
  }
}

module.exports = { autoInitDatabase };
