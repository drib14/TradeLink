/**
 * Migration: Add soft delete columns and status ENUMs across listings and flash requests,
 * and ensure user_favorites and reviews.listing_id are present.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Listings table soft delete columns
  const hasListings = await knex.schema.hasTable('listings');
  if (hasListings) {
    const hasListingDeletedAt = await knex.schema.hasColumn('listings', 'deleted_at');
    const hasListingDelReason = await knex.schema.hasColumn('listings', 'deletion_reason');
    const hasListingDelBy = await knex.schema.hasColumn('listings', 'deleted_by');

    await knex.schema.alterTable('listings', (table) => {
      if (!hasListingDeletedAt) table.datetime('deleted_at').nullable().defaultTo(null);
      if (!hasListingDelReason) table.string('deletion_reason', 255).nullable().defaultTo(null);
      if (!hasListingDelBy) table.string('deleted_by', 36).nullable().defaultTo(null);
    });

    try {
      await knex.raw("ALTER TABLE `listings` MODIFY COLUMN `status` ENUM('available', 'pending', 'sold', 'archived', 'banned', 'deleted') NOT NULL DEFAULT 'available';");
    } catch (_) {}
  }

  // 2. Flash requests table soft delete columns
  const hasFlash = await knex.schema.hasTable('flash_requests');
  if (hasFlash) {
    const hasFlashDeletedAt = await knex.schema.hasColumn('flash_requests', 'deleted_at');
    const hasFlashDelReason = await knex.schema.hasColumn('flash_requests', 'deletion_reason');
    const hasFlashDelBy = await knex.schema.hasColumn('flash_requests', 'deleted_by');

    await knex.schema.alterTable('flash_requests', (table) => {
      if (!hasFlashDeletedAt) table.datetime('deleted_at').nullable().defaultTo(null);
      if (!hasFlashDelReason) table.string('deletion_reason', 255).nullable().defaultTo(null);
      if (!hasFlashDelBy) table.string('deleted_by', 36).nullable().defaultTo(null);
    });

    try {
      await knex.raw("ALTER TABLE `flash_requests` MODIFY COLUMN `status` ENUM('open', 'fulfilled', 'expired', 'cancelled', 'deleted') NOT NULL DEFAULT 'open';");
    } catch (_) {}
  }

  // 3. User favorites table
  const hasUserFavorites = await knex.schema.hasTable('user_favorites');
  if (!hasUserFavorites) {
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
  }

  // 4. Reviews table listing_id column
  const hasReviews = await knex.schema.hasTable('reviews');
  if (hasReviews) {
    const hasReviewListing = await knex.schema.hasColumn('reviews', 'listing_id');
    if (!hasReviewListing) {
      await knex.schema.alterTable('reviews', (table) => {
        table.string('listing_id', 36).nullable();
        table.index('listing_id', 'idx_reviews_listing');
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasListings = await knex.schema.hasTable('listings');
  if (hasListings) {
    await knex.schema.alterTable('listings', (table) => {
      table.dropColumn('deleted_at');
      table.dropColumn('deletion_reason');
      table.dropColumn('deleted_by');
    }).catch(() => {});
  }

  const hasFlash = await knex.schema.hasTable('flash_requests');
  if (hasFlash) {
    await knex.schema.alterTable('flash_requests', (table) => {
      table.dropColumn('deleted_at');
      table.dropColumn('deletion_reason');
      table.dropColumn('deleted_by');
    }).catch(() => {});
  }
};
