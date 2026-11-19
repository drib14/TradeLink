const db = require('../config/db');

let schemaPromise = null;

const REQUIRED_STATUSES = ['active', 'reserved', 'sold', 'swapped', 'donated', 'archived', 'banned', 'deleted'];

function ensureListingStatusSchema() {
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const result = await db.raw("SHOW COLUMNS FROM `listings` LIKE 'status'");
    const rows = Array.isArray(result?.[0]) ? result[0] : result;
    const columnType = String(rows?.[0]?.Type || rows?.[0]?.type || '').toLowerCase();
    if (!columnType) throw new Error('Could not inspect listings.status database column.');

    const isCompatible = REQUIRED_STATUSES.every((status) => columnType.includes(`'${status}'`));
    if (isCompatible) return;

    // Expand first so legacy values remain valid while rows are normalized.
    await db.raw("ALTER TABLE `listings` MODIFY COLUMN `status` ENUM('active','reserved','sold','swapped','donated','archived','banned','deleted','available','pending') NOT NULL DEFAULT 'active'");
    await db.raw("UPDATE `listings` SET `status` = 'active' WHERE `status` = 'available'");
    await db.raw("UPDATE `listings` SET `status` = 'reserved' WHERE `status` = 'pending'");
    await db.raw("ALTER TABLE `listings` MODIFY COLUMN `status` ENUM('active','reserved','sold','swapped','donated','archived','banned','deleted') NOT NULL DEFAULT 'active'");
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });

  return schemaPromise;
}

module.exports = { ensureListingStatusSchema };
