/**
 * Keep the listing status enum aligned with the marketplace transaction flow.
 * Older schema initialization rewrote it to available/pending/sold and removed
 * active/reserved, causing new purchase reservations to fail in production.
 */
exports.up = async function up(knex) {
  const result = await knex.raw("SHOW COLUMNS FROM `listings` LIKE 'status'");
  const rows = Array.isArray(result?.[0]) ? result[0] : result;
  const columnType = String(rows?.[0]?.Type || rows?.[0]?.type || '').toLowerCase();
  if (!columnType) throw new Error('Could not inspect listings.status.');

  const required = ['active', 'reserved', 'sold', 'swapped', 'donated', 'archived', 'banned', 'deleted'];
  if (required.every((status) => columnType.includes(`'${status}'`))) return;

  await knex.raw("ALTER TABLE `listings` MODIFY COLUMN `status` ENUM('active','reserved','sold','swapped','donated','archived','banned','deleted','available','pending') NOT NULL DEFAULT 'active'");
  await knex.raw("UPDATE `listings` SET `status` = 'active' WHERE `status` = 'available'");
  await knex.raw("UPDATE `listings` SET `status` = 'reserved' WHERE `status` = 'pending'");
  await knex.raw("ALTER TABLE `listings` MODIFY COLUMN `status` ENUM('active','reserved','sold','swapped','donated','archived','banned','deleted') NOT NULL DEFAULT 'active'");
};

exports.down = async function down() {
  // Intentionally no destructive rollback: older enums cannot represent current marketplace states.
};
