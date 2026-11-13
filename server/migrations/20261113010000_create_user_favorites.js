/**
 * Persist user favorites for both web and mobile clients.
 */
exports.up = async function(knex) {
  if (await knex.schema.hasTable('user_favorites')) return;

  await knex.schema.createTable('user_favorites', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable();
    table.string('listing_id', 36).notNullable();
    table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('listing_id').references('id').inTable('listings').onDelete('CASCADE');
    table.unique(['user_id', 'listing_id'], 'uk_user_listing_favorite');
    table.index(['listing_id'], 'idx_favorites_listing');
  });
};

exports.down = async function(knex) {
  if (await knex.schema.hasTable('user_favorites')) {
    await knex.schema.dropTable('user_favorites');
  }
};
