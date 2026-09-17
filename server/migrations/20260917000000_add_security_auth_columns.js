/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) return;

  await knex.schema.alterTable('users', (table) => {
    table.integer('failed_login_attempts').unsigned().notNullable().defaultTo(0);
    table.dateTime('locked_until').nullable();
    table.integer('token_version').unsigned().notNullable().defaultTo(1);
    table.tinyint('failed_reset_attempts').unsigned().notNullable().defaultTo(0);
    table.dateTime('password_changed_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) return;

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('failed_login_attempts');
    table.dropColumn('locked_until');
    table.dropColumn('token_version');
    table.dropColumn('failed_reset_attempts');
    table.dropColumn('password_changed_at');
  });
};
