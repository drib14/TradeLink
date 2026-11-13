const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Return the authenticated student's saved listing IDs.
 */
const getFavorites = asyncHandler(async (req, res) => {
  const rows = await db('user_favorites')
    .where({ user_id: req.user.id })
    .orderBy('created_at', 'desc')
    .select('listing_id');

  res.status(200).json({
    status: 'success',
    data: { favorites: rows.map((row) => row.listing_id) }
  });
});

/**
 * Toggle a saved listing for the current student. The unique composite key
 * protects against duplicate favorites at the database layer.
 */
const toggleFavorite = asyncHandler(async (req, res, next) => {
  const { id: listingId } = req.params;

  const result = await db.transaction(async (trx) => {
    const listing = await trx('listings').where({ id: listingId }).first();
    if (!listing || listing.status === 'archived' || listing.status === 'banned') {
      throw new AppError('Listing not found or no longer available.', 404);
    }

    const existing = await trx('user_favorites')
      .where({ user_id: req.user.id, listing_id: listingId })
      .first();

    let isFavorited;
    if (existing) {
      await trx('user_favorites').where({ id: existing.id }).delete();
      isFavorited = false;
    } else {
      await trx('user_favorites').insert({
        id: uuidv4(),
        user_id: req.user.id,
        listing_id: listingId,
        created_at: new Date()
      });
      isFavorited = true;
    }

    const countRow = await trx('user_favorites')
      .where({ listing_id: listingId })
      .count({ total: '*' })
      .first();

    return {
      isFavorited,
      listingId,
      favoritesCount: Number(countRow?.total || 0)
    };
  });

  res.status(200).json({
    status: 'success',
    message: result.isFavorited ? 'Listing saved to favorites.' : 'Listing removed from favorites.',
    data: result
  });
});

module.exports = { getFavorites, toggleFavorite };
