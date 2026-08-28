const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Helper to format listing with images and tags
function formatListing(row, images = [], tags = []) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: parseFloat(row.price),
    originalSrp: parseFloat(row.original_srp),
    tradeMode: row.trade_mode,
    swapPreference: row.swap_preference,
    category: row.category,
    tags: tags.length > 0 ? tags : (row.tags ? (typeof row.tags === 'string' ? row.tags.split(',') : row.tags) : []),
    condition: row.condition,
    images: images.length > 0 ? images : (row.images ? (typeof row.images === 'string' ? row.images.split(',') : row.images) : []),
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerAvatar: row.seller_avatar,
    sellerCampus: row.seller_campus,
    sellerCollege: row.seller_college,
    sellerIsVerified: Boolean(row.seller_is_verified),
    sellerTrustScore: row.seller_trust_score,
    preferredMeetupSpots: row.preferred_meetup_spots ? (typeof row.preferred_meetup_spots === 'string' ? JSON.parse(row.preferred_meetup_spots) : row.preferred_meetup_spots) : [],
    customMeetupSpot: row.custom_meetup_spot,
    isBoosted: Boolean(row.is_boosted),
    isSold: Boolean(row.is_sold),
    courseCode: row.course_code,
    createdAt: row.created_at,
    views: row.views,
    favoritesCount: row.favorites_count
  };
}

/**
 * List & search marketplace listings with multi-filter and pagination
 */
const getListings = asyncHandler(async (req, res) => {
  const {
    campus,
    category,
    tradeMode,
    condition,
    search,
    sortBy = 'recent',
    priceMin = 0,
    priceMax = 100000,
    page = 1,
    limit = 24
  } = req.query;

  let query = db('listings')
    .join('users as seller', 'listings.seller_id', 'seller.id')
    .select(
      'listings.*',
      'seller.name as seller_name',
      'seller.avatar_url as seller_avatar',
      'seller.campus as seller_campus',
      'seller.college as seller_college',
      'seller.is_verified as seller_is_verified',
      'seller.trust_score as seller_trust_score'
    )
    .where('seller.is_banned', false);

  // Filter: Campus
  if (campus && campus !== 'All') {
    query = query.where('seller.campus', campus);
  }

  // Filter: Category
  if (category && category !== 'All') {
    query = query.where('listings.category', 'like', `%${category}%`);
  }

  // Filter: Trade Mode
  if (tradeMode && tradeMode !== 'All') {
    query = query.where('listings.trade_mode', tradeMode);
  }

  // Filter: Condition
  if (condition && condition !== 'All') {
    query = query.where('listings.condition', condition);
  }

  // Filter: Price range
  query = query.whereBetween('listings.price', [priceMin, priceMax]);

  // Search keyword across title, description, category, course_code, seller name
  if (search && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    query = query.where((builder) => {
      builder
        .whereILike('listings.title', q)
        .orWhereILike('listings.description', q)
        .orWhereILike('listings.category', q)
        .orWhereILike('listings.course_code', q)
        .orWhereILike('seller.name', q);
    });
  }

  // Sorting
  if (sortBy === 'recent') {
    query = query.orderBy('listings.is_boosted', 'desc').orderBy('listings.created_at', 'desc');
  } else if (sortBy === 'price_low') {
    query = query.orderBy('listings.price', 'asc');
  } else if (sortBy === 'price_high') {
    query = query.orderBy('listings.price', 'desc');
  } else if (sortBy === 'trust_high') {
    query = query.orderBy('seller.trust_score', 'desc');
  } else if (sortBy === 'views_high') {
    query = query.orderBy('listings.views', 'desc');
  }

  // Pagination
  const offset = (page - 1) * limit;
  const listings = await query.limit(limit).offset(offset);

  // Fetch images and tags for these listings
  const listingIds = listings.map((l) => l.id);
  const images = listingIds.length > 0 ? await db('listing_images').whereIn('listing_id', listingIds).orderBy('sort_order', 'asc') : [];
  const tags = listingIds.length > 0 ? await db('listing_tags').whereIn('listing_id', listingIds) : [];

  const formatted = listings.map((l) => {
    const lImages = images.filter((img) => img.listing_id === l.id).map((img) => img.image_url);
    const lTags = tags.filter((t) => t.listing_id === l.id).map((t) => t.tag);
    return formatListing(l, lImages, lTags);
  });

  res.status(200).json({
    status: 'success',
    data: {
      listings: formatted,
      page: Number(page),
      limit: Number(limit)
    }
  });
});

/**
 * Get listing detail by ID
 */
const getListingById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const listing = await db('listings')
    .where('listings.id', id)
    .join('users as seller', 'listings.seller_id', 'seller.id')
    .select(
      'listings.*',
      'seller.name as seller_name',
      'seller.avatar_url as seller_avatar',
      'seller.campus as seller_campus',
      'seller.college as seller_college',
      'seller.is_verified as seller_is_verified',
      'seller.trust_score as seller_trust_score'
    )
    .first();

  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  // Increment view counter
  await db('listings').where({ id }).increment('views', 1);

  const images = await db('listing_images').where({ listing_id: id }).orderBy('sort_order', 'asc');
  const tags = await db('listing_tags').where({ listing_id: id });

  res.status(200).json({
    status: 'success',
    data: {
      listing: formatListing(
        listing,
        images.map((i) => i.image_url),
        tags.map((t) => t.tag)
      )
    }
  });
});

/**
 * Create a new listing
 */
const createListing = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    price,
    originalSrp,
    tradeMode,
    swapPreference,
    category,
    condition,
    tags = [],
    images = [],
    preferredMeetupSpots = [],
    customMeetupSpot,
    courseCode
  } = req.body;

  // Check prohibited keywords in title and description
  const prohibited = await db('prohibited_keywords').select('keyword');
  const lowerText = `${title} ${description}`.toLowerCase();
  for (const item of prohibited) {
    if (lowerText.includes(item.keyword.toLowerCase())) {
      return next(
        new AppError(
          `Listing contains prohibited word: "${item.keyword}". Trading of restricted items or academic dishonesty material is not allowed.`,
          400
        )
      );
    }
  }

  const listingId = `list-${Date.now()}`;
  const newListing = {
    id: listingId,
    title: title.trim(),
    description: description.trim(),
    price: price || 0,
    original_srp: originalSrp || 0,
    trade_mode: tradeMode,
    swap_preference: swapPreference ? swapPreference.trim() : null,
    category,
    condition,
    seller_id: req.user.id,
    preferred_meetup_spots: JSON.stringify(preferredMeetupSpots),
    custom_meetup_spot: customMeetupSpot ? customMeetupSpot.trim() : null,
    is_boosted: false,
    is_sold: false,
    course_code: courseCode ? courseCode.trim().toUpperCase() : null,
    views: 1,
    favorites_count: 0
  };

  await db.transaction(async (trx) => {
    await trx('listings').insert(newListing);

    if (images.length > 0) {
      const imgRows = images.map((url, index) => ({
        id: `img-${Date.now()}-${index}`,
        listing_id: listingId,
        image_url: url,
        sort_order: index
      }));
      await trx('listing_images').insert(imgRows);
    }

    if (tags.length > 0) {
      const tagRows = tags.map((t, index) => ({
        id: `tag-${Date.now()}-${index}`,
        listing_id: listingId,
        tag: t.trim()
      }));
      await trx('listing_tags').insert(tagRows);
    }
  });

  const created = await db('listings')
    .where('listings.id', listingId)
    .join('users as seller', 'listings.seller_id', 'seller.id')
    .select(
      'listings.*',
      'seller.name as seller_name',
      'seller.avatar_url as seller_avatar',
      'seller.campus as seller_campus',
      'seller.college as seller_college',
      'seller.is_verified as seller_is_verified',
      'seller.trust_score as seller_trust_score'
    )
    .first();

  res.status(201).json({
    status: 'success',
    message: 'Listing published to UC marketplace successfully.',
    data: {
      listing: formatListing(created, images, tags)
    }
  });
});

/**
 * Update a listing
 */
const updateListing = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const listing = await db('listings').where({ id }).first();

  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  // Ensure owner or admin
  if (listing.seller_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('You are not authorized to edit this listing.', 403));
  }

  const updates = {};
  if (req.body.title) updates.title = req.body.title.trim();
  if (req.body.description) updates.description = req.body.description.trim();
  if (req.body.price !== undefined) updates.price = req.body.price;
  if (req.body.originalSrp !== undefined) updates.original_srp = req.body.originalSrp;
  if (req.body.tradeMode) updates.trade_mode = req.body.tradeMode;
  if (req.body.swapPreference !== undefined) updates.swap_preference = req.body.swapPreference;
  if (req.body.category) updates.category = req.body.category;
  if (req.body.condition) updates.condition = req.body.condition;
  if (req.body.isSold !== undefined) updates.is_sold = req.body.isSold;
  if (req.body.isBoosted !== undefined) updates.is_boosted = req.body.isBoosted;
  if (req.body.customMeetupSpot !== undefined) updates.custom_meetup_spot = req.body.customMeetupSpot;
  if (req.body.courseCode !== undefined) updates.course_code = req.body.courseCode;
  if (req.body.preferredMeetupSpots) updates.preferred_meetup_spots = JSON.stringify(req.body.preferredMeetupSpots);

  await db('listings').where({ id }).update(updates);

  res.status(200).json({
    status: 'success',
    message: 'Listing updated successfully.'
  });
});

/**
 * Delete a listing
 */
const deleteListing = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const listing = await db('listings').where({ id }).first();

  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  if (listing.seller_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('You are not authorized to delete this listing.', 403));
  }

  await db('listings').where({ id }).delete();

  res.status(200).json({
    status: 'success',
    message: 'Listing deleted.'
  });
});

/**
 * Boost a listing
 */
const boostListing = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const listing = await db('listings').where({ id }).first();

  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  if (listing.seller_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('You are not authorized to boost this listing.', 403));
  }

  await db('listings').where({ id }).update({ is_boosted: true });

  res.status(200).json({
    status: 'success',
    message: 'Listing boosted to the top of the campus feed!'
  });
});

/**
 * Mark a listing as sold or active
 */
const markAsSold = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isSold = true } = req.body;

  const listing = await db('listings').where({ id }).first();
  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  if (listing.seller_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Unauthorized.', 403));
  }

  await db('listings').where({ id }).update({ is_sold: isSold });

  res.status(200).json({
    status: 'success',
    message: isSold ? 'Listing marked as sold.' : 'Listing restored to active.'
  });
});

/**
 * Report / Flag a listing
 */
const reportListing = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const listing = await db('listings').where({ id }).first();
  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  await db('flagged_listings').insert({
    id: `flag-${Date.now()}`,
    listing_id: id,
    reporter_id: req.user.id,
    reason: reason.trim(),
    status: 'pending'
  });

  res.status(200).json({
    status: 'success',
    message: 'Report submitted. Our campus moderation desk will review this listing.'
  });
});

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  boostListing,
  markAsSold,
  reportListing
};
