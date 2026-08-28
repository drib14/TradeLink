const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

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
const toggleFavorite = asyncHandler(async (req, res) => {
  const { listingId } = req.params;

  const existing = await db('favorites')
    .where({ user_id: req.user.id, listing_id: listingId })
    .first();

  let isFavorited = false;

  if (existing) {
    await db('favorites').where({ user_id: req.user.id, listing_id: listingId }).delete();
    await db('listings').where({ id: listingId }).decrement('favorites_count', 1);
    isFavorited = false;
  } else {
    await db('favorites').insert({ user_id: req.user.id, listing_id: listingId });
    await db('listings').where({ id: listingId }).increment('favorites_count', 1);
    isFavorited = true;
  }

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
