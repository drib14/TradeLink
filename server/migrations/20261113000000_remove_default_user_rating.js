/**
 * Unrated accounts must not inherit a five-star rating.
 * Existing accounts with no reviews are normalized to 0.0; actual reviewed
 * account ratings are preserved.
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.decimal('rating', 2, 1).notNullable().defaultTo(0.0).alter();
  });

  await knex('users')
    .where('total_reviews', 0)
    .update({ rating: 0.0 });
};

exports.down = async function(knex) {
  // Keep the safe zero default on rollback; never recreate an implied five-star rating.
  await knex.schema.alterTable('users', (table) => {
    table.decimal('rating', 2, 1).notNullable().defaultTo(0.0).alter();
  });
};
