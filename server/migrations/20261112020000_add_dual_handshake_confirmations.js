/**
 * Add independent buyer/seller confirmation timestamps to the transaction handshake.
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  const table = 'transactions';
  const additions = [
    ['buyer_confirmed_at', (t) => t.timestamp('buyer_confirmed_at').nullable()],
    ['seller_confirmed_at', (t) => t.timestamp('seller_confirmed_at').nullable()],
    ['handshake_completed_at', (t) => t.timestamp('handshake_completed_at').nullable()]
  ];

  for (const [column, addColumn] of additions) {
    if (!(await knex.schema.hasColumn(table, column))) {
      await knex.schema.alterTable(table, addColumn);
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function(knex) {
  const table = 'transactions';
  const columns = ['handshake_completed_at', 'seller_confirmed_at', 'buyer_confirmed_at'];
  for (const column of columns) {
    if (await knex.schema.hasColumn(table, column)) {
      await knex.schema.alterTable(table, (t) => t.dropColumn(column));
    }
  }
};
