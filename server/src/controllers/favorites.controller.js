const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * Get current user's saved/favorite listing IDs
 */
const getFavorites = asyncHandler(async (req, res) => {
  const favorites = await db('favorites')
    .where({ user_id: req.user.id })
    .select('listing_id');

  const listingIds = favorites.map((f) => f.listing_id);

  res.status(200).json({
    status: 'success',
    data: {
      favorites: listingIds
    }
  });
});

/**
 * Toggle favorite on a listing
 */
const toggleFavorite = asyncHandler(async (req, res, next) => {
  const { listingId } = req.params;

  const listing = await db('listings').where({ id: listingId }).first();
  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  let isFavorited = false;

  await db.transaction(async (trx) => {
    const existing = await trx('favorites')
      .where({ user_id: req.user.id, listing_id: listingId })
      .first();

    if (existing) {
      await trx('favorites').where({ user_id: req.user.id, listing_id: listingId }).delete();
      await trx('listings')
        .where({ id: listingId })
        .update({
          favorites_count: Math.max(0, (listing.favorites_count || 0) - 1)
        });
      isFavorited = false;
    } else {
      await trx('favorites').insert({ user_id: req.user.id, listing_id: listingId });
      await trx('listings')
        .where({ id: listingId })
        .increment('favorites_count', 1);
      isFavorited = true;
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      isFavorited,
      listingId
    }
  });
});

module.exports = {
  getFavorites,
  toggleFavorite
};
