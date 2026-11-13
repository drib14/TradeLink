/**
 * Unrated accounts must not inherit a five-star rating.
 * Derive reputation from persisted review rows, not seeded/cached counters.
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.decimal('rating', 2, 1).notNullable().defaultTo(0.0).alter();
  });

  const hasTargetUserColumn = await knex.schema.hasColumn('reviews', 'target_user_id');
  const reviewUserColumn = hasTargetUserColumn ? 'target_user_id' : 'reviewee_id';

  await knex('users')
    .whereNotExists(function() {
      this.select(knex.raw('1'))
        .from('reviews')
        .whereRaw('?? = users.id', [reviewUserColumn]);
    })
    .update({ rating: 0.0, total_reviews: 0 });
};

exports.down = async function(knex) {
  // Keep the safe zero default on rollback; never recreate an implied five-star rating.
  await knex.schema.alterTable('users', (table) => {
    table.decimal('rating', 2, 1).notNullable().defaultTo(0.0).alter();
  });
};
