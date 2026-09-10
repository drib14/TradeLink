const db = require('../src/config/db');

async function run() {
  console.log('--- Applying Schema Refactor to TiDB ---');

  // Disable FK checks
  await db.raw('SET FOREIGN_KEY_CHECKS = 0');

  // 1. Drop unused tables
  const tablesToDrop = [
    'notifications',
    'favorites',
    'listing_tags',
    'conversation_read_status',
    'meetup_transactions'
  ];

  for (const tbl of tablesToDrop) {
    try {
      await db.raw(`DROP TABLE IF EXISTS \`${tbl}\``);
      console.log(`✓ Dropped table if existed: ${tbl}`);
    } catch (e) {
      console.warn(`Warning dropping ${tbl}:`, e.message);
    }
  }

  // 2. Create listing_media if not exists
  await db.raw(`
    CREATE TABLE IF NOT EXISTS \`listing_media\` (
      \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
      \`listing_id\` VARCHAR(36) NOT NULL,
      \`media_url\` VARCHAR(500) NOT NULL,
      \`media_type\` ENUM('image', 'video') NOT NULL DEFAULT 'image',
      \`thumbnail_url\` VARCHAR(500) DEFAULT NULL,
      \`is_primary\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`display_order\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_listing_media_listing\` (\`listing_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Ensured table: listing_media');

  // Migrate from listing_images if exists
  const [imgTable] = await db.raw("SHOW TABLES LIKE 'listing_images'");
  if (imgTable && imgTable.length > 0) {
    try {
      await db.raw(`
        INSERT IGNORE INTO \`listing_media\` (\`id\`, \`listing_id\`, \`media_url\`, \`media_type\`, \`is_primary\`, \`display_order\`, \`created_at\`)
        SELECT \`id\`, \`listing_id\`, \`image_url\`, 'image', \`is_primary\`, \`display_order\`, \`created_at\`
        FROM \`listing_images\`
      `);
      console.log('✓ Migrated existing images to listing_media');
      await db.raw('DROP TABLE IF EXISTS `listing_images`');
      console.log('✓ Dropped legacy table: listing_images');
    } catch (e) {
      console.warn('Migration from listing_images note:', e.message);
    }
  }

  // 3. Create transactions table
  await db.raw(`
    CREATE TABLE IF NOT EXISTS \`transactions\` (
      \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
      \`reference_no\` VARCHAR(32) NOT NULL UNIQUE,
      \`listing_id\` VARCHAR(36) NOT NULL,
      \`buyer_id\` VARCHAR(36) NOT NULL,
      \`seller_id\` VARCHAR(36) NOT NULL,
      \`swap_offer_id\` VARCHAR(36) DEFAULT NULL,
      \`trade_mode\` ENUM('buy_sell', 'swap', 'free_donation') NOT NULL DEFAULT 'buy_sell',
      \`amount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      \`payment_method\` ENUM('cash', 'gcash', 'maya', 'barter', 'free') NOT NULL DEFAULT 'cash',
      \`payment_status\` ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
      \`status\` ENUM('pending', 'completed', 'cancelled', 'disputed') NOT NULL DEFAULT 'pending',
      \`notes\` TEXT DEFAULT NULL,
      \`completed_at\` DATETIME DEFAULT NULL,
      \`cancelled_at\` DATETIME DEFAULT NULL,
      \`cancellation_reason\` VARCHAR(500) DEFAULT NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_tx_ref\` (\`reference_no\`),
      INDEX \`idx_tx_listing\` (\`listing_id\`),
      INDEX \`idx_tx_buyer\` (\`buyer_id\`),
      INDEX \`idx_tx_seller\` (\`seller_id\`),
      INDEX \`idx_tx_status\` (\`status\`),
      INDEX \`idx_tx_created\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Ensured table: transactions');

  // 4. Update messages table with media fields and transaction_id
  try {
    const [msgCols] = await db.raw("SHOW COLUMNS FROM `messages`");
    const colNames = msgCols.map((c) => c.Field);
    if (!colNames.includes('media_url')) {
      await db.raw("ALTER TABLE `messages` ADD COLUMN `media_url` VARCHAR(500) DEFAULT NULL AFTER `is_system_message`");
      console.log('✓ Added messages.media_url');
    }
    if (!colNames.includes('media_type')) {
      await db.raw("ALTER TABLE `messages` ADD COLUMN `media_type` ENUM('image', 'video') DEFAULT NULL AFTER `media_url`");
      console.log('✓ Added messages.media_type');
    }
    if (!colNames.includes('transaction_id')) {
      await db.raw("ALTER TABLE `messages` ADD COLUMN `transaction_id` VARCHAR(36) DEFAULT NULL AFTER `swap_offer_id`");
      console.log('✓ Added messages.transaction_id');
    }
  } catch (e) {
    console.warn('messages alter note:', e.message);
  }

  // 5. Update reviews table
  try {
    const [revCols] = await db.raw("SHOW COLUMNS FROM `reviews`");
    const revColNames = revCols.map((c) => c.Field);
    if (revColNames.includes('meetup_transaction_id') && !revColNames.includes('transaction_id')) {
      await db.raw("ALTER TABLE `reviews` CHANGE COLUMN `meetup_transaction_id` `transaction_id` VARCHAR(36) NOT NULL");
      console.log('✓ Renamed reviews.meetup_transaction_id to transaction_id');
    } else if (!revColNames.includes('transaction_id')) {
      await db.raw("ALTER TABLE `reviews` ADD COLUMN `transaction_id` VARCHAR(36) NOT NULL AFTER `id`");
      console.log('✓ Added reviews.transaction_id');
    }
  } catch (e) {
    console.warn('reviews alter note:', e.message);
  }

  // 6. Clean up listings table columns if they exist
  try {
    const [listingCols] = await db.raw("SHOW COLUMNS FROM `listings`");
    const listColNames = listingCols.map((c) => c.Field);
    if (listColNames.includes('preferred_meetup_spots')) {
      await db.raw("ALTER TABLE `listings` DROP COLUMN `preferred_meetup_spots`");
      console.log('✓ Dropped listings.preferred_meetup_spots');
    }
    if (listColNames.includes('custom_meetup_spot')) {
      await db.raw("ALTER TABLE `listings` DROP COLUMN `custom_meetup_spot`");
      console.log('✓ Dropped listings.custom_meetup_spot');
    }
    if (listColNames.includes('favorites_count')) {
      await db.raw("ALTER TABLE `listings` DROP COLUMN `favorites_count`");
      console.log('✓ Dropped listings.favorites_count');
    }
  } catch (e) {
    console.warn('listings alter note:', e.message);
  }

  // Enable FK checks
  await db.raw('SET FOREIGN_KEY_CHECKS = 1');

  console.log('--- Schema Refactor Applied Successfully ---');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
