const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeListing } = require('../serializers/listingSerializer');

/**
 * Escapes special wildcard characters for SQL LIKE statements
 */
function escapeLike(str) {
  return str.replace(/[%_]/g, '\\$&');
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

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 24));
  const parsedMin = Math.max(0, parseFloat(priceMin) || 0);
  const parsedMax = Math.min(1000000, parseFloat(priceMax) || 100000);

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

  // Filter: Category (safe like)
  if (category && category !== 'All') {
    const escapedCat = escapeLike(category.trim());
    query = query.where('listings.category', 'like', `%${escapedCat}%`);
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
  query = query.whereBetween('listings.price', [parsedMin, parsedMax]);

  // Search keyword across title, description, category, course_code, seller name with escaped wildcards
  if (search && search.trim()) {
    const cleanSearch = escapeLike(search.trim());
    const q = `%${cleanSearch}%`;
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
  const offset = (parsedPage - 1) * parsedLimit;
  const listings = await query.limit(parsedLimit).offset(offset);

  // Fetch images and tags for returned listings with single bulk queries
  const listingIds = listings.map((l) => l.id);
  const images = listingIds.length > 0
    ? await db('listing_images').whereIn('listing_id', listingIds).orderBy('sort_order', 'asc')
    : [];
  const tags = listingIds.length > 0
    ? await db('listing_tags').whereIn('listing_id', listingIds)
    : [];

  const formatted = listings.map((l) => {
    const lImages = images.filter((img) => img.listing_id === l.id).map((img) => img.image_url);
    const lTags = tags.filter((t) => t.listing_id === l.id).map((t) => t.tag);
    return serializeListing(l, lImages, lTags);
  });

  res.status(200).json({
    status: 'success',
    data: {
      listings: formatted,
      page: parsedPage,
      limit: parsedLimit
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

  // Increment view counter safely
  await db('listings').where({ id }).increment('views', 1);

  const images = await db('listing_images').where({ listing_id: id }).orderBy('sort_order', 'asc');
  const tags = await db('listing_tags').where({ listing_id: id });

  res.status(200).json({
    status: 'success',
    data: {
      listing: serializeListing(
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
          `Listing contains prohibited keyword: "${item.keyword}". Restricted items or academic dishonesty materials are not permitted.`,
          400
        )
      );
    }
  }

  const listingId = `list_${uuidv4()}`;
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
        id: `img_${uuidv4()}`,
        listing_id: listingId,
        image_url: url,
        sort_order: index
      }));
      await trx('listing_images').insert(imgRows);
    }

    if (tags.length > 0) {
      const tagRows = tags.map((t) => ({
        id: `tag_${uuidv4()}`,
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
      listing: serializeListing(created, images, tags)
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

  // Ensure owner or admin (superadmin removed)
  if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
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

  if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
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

  if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
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

  if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
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
    id: `flag_${uuidv4()}`,
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
