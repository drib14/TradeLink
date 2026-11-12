/**
 * Align users table columns across dev and production environments.
 * Ensures college, department, and year_level all exist and are nullable with default NULL.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) return;

  const hasCollege = await knex.schema.hasColumn('users', 'college');
  const hasDepartment = await knex.schema.hasColumn('users', 'department');
  const hasYearLevel = await knex.schema.hasColumn('users', 'year_level');

  await knex.schema.alterTable('users', (table) => {
    if (!hasCollege) {
      table.string('college', 100).nullable().defaultTo(null);
    }
    if (!hasDepartment) {
      table.string('department', 100).nullable().defaultTo(null);
    }
    if (!hasYearLevel) {
      table.string('year_level', 50).nullable().defaultTo(null);
    }
  });

  // Modify college to be nullable if it was previously notNullable
  if (hasCollege) {
    try {
      await knex.raw('ALTER TABLE `users` MODIFY COLUMN `college` VARCHAR(100) NULL DEFAULT NULL;');
    } catch (_) {}
  }

  // Modify year_level to be nullable if it was previously notNullable
  if (hasYearLevel) {
    try {
      await knex.raw('ALTER TABLE `users` MODIFY COLUMN `year_level` VARCHAR(50) NULL DEFAULT NULL;');
    } catch (_) {}
  }

  // Modify department to be nullable
  if (hasDepartment) {
    try {
      await knex.raw('ALTER TABLE `users` MODIFY COLUMN `department` VARCHAR(100) NULL DEFAULT NULL;');
    } catch (_) {}
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Safe no-op on rollback to prevent data loss
};

