/**
 * Migration: Create security_events table for persistent audit logging
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('security_events');
  if (hasTable) return;

  await knex.schema.createTable('security_events', (table) => {
    table.string('id', 36).primary();
    table.string('event_type', 100).notNullable();
    table.enu('severity', ['info', 'warning', 'critical']).notNullable().defaultTo('info');
    table.string('user_id', 36).nullable();
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 256).nullable();
    table.text('details').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['event_type'], 'idx_security_event_type');
    table.index(['severity'], 'idx_security_severity');
    table.index(['user_id'], 'idx_security_user_id');
    table.index(['created_at'], 'idx_security_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('security_events');
};
