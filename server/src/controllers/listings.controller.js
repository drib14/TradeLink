const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeListing } = require('../serializers/listingSerializer');
const storageService = require('../services/storage.service');

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
    status = 'active',
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

  // Filter: Status (default 'active', or specific status if not 'All')
  if (status && status !== 'All') {
    query = query.where('listings.status', status);
  }

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
    query = query.orderBy('listings.is_featured', 'desc').orderBy('listings.created_at', 'desc');
  } else if (sortBy === 'price_low') {
    query = query.orderBy('listings.price', 'asc');
  } else if (sortBy === 'price_high') {
    query = query.orderBy('listings.price', 'desc');
  } else if (sortBy === 'trust_high') {
    query = query.orderBy('seller.trust_score', 'desc');
  } else if (sortBy === 'views_high') {
    query = query.orderBy('listings.views_count', 'desc');
  }

  // Pagination
  const offset = (parsedPage - 1) * parsedLimit;
  const listings = await query.limit(parsedLimit).offset(offset);

  // Fetch images and tags for returned listings with single bulk queries
  const listingIds = listings.map((l) => l.id);
  const images = listingIds.length > 0
    ? await db('listing_images').whereIn('listing_id', listingIds).orderBy('display_order', 'asc')
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

  // Increment view counter safely for non-owners only (prevent self-inflation)
  const isOwner = req.user && req.user.id === listing.seller_id;
  if (!isOwner) {
    try {
      await db('listings').where({ id }).increment('views_count', 1);
    } catch {}
  }

  const images = await db('listing_images').where({ listing_id: id }).orderBy('display_order', 'asc');
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
    campus,
    department,
    quantity = 1,
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

  // Prevent rapid double-click duplicate creation
  const recentDuplicate = await db('listings')
    .where({ seller_id: req.user.id, title: title.trim(), status: 'active' })
    .andWhere('created_at', '>', new Date(Date.now() - 15000))
    .first();

  if (recentDuplicate) {
    return next(new AppError('A listing with this exact title was just published. Please wait before creating another.', 409));
  }

  const listingId = uuidv4();
  const newListing = {
    id: listingId,
    seller_id: req.user.id,
    title: title.trim(),
    description: description.trim(),
    price: parseFloat(price || 0),
    original_srp: originalSrp ? parseFloat(originalSrp) : null,
    trade_mode: tradeMode || 'buy_sell',
    swap_preference: swapPreference ? swapPreference.trim() : null,
    category,
    condition: condition || 'Gently Used',
    campus: campus || req.user.campus || 'UC Main',
    department: department || req.user.college || null,
    status: 'active',
    views_count: 1,
    favorites_count: 0,
    is_featured: false
  };

  // Upload any base64 images to Cloudflare R2 / secure storage (cap to 5)
  const cappedImages = (Array.isArray(images) ? images : []).slice(0, 5);
  const cappedTags = (Array.isArray(tags) ? tags : []).slice(0, 10);
  const resolvedImages = await Promise.all(
    cappedImages.map((img) => storageService.uploadBase64(img, 'listings'))
  );

  await db.transaction(async (trx) => {
    await trx('listings').insert(newListing);

    if (resolvedImages.length > 0) {
      const imgRows = resolvedImages.map((url, index) => ({
        id: uuidv4(),
        listing_id: listingId,
        image_url: url,
        is_primary: index === 0,
        display_order: index
      }));
      await trx('listing_images').insert(imgRows);
    }

    if (cappedTags.length > 0) {
      const tagRows = cappedTags.map((t) => ({
        id: uuidv4(),
        listing_id: listingId,
        tag: t.trim()
      }));
      await trx('listing_tags').insert(tagRows);
    }
  });

  const createdListing = await db('listings')
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
    message: 'Listing created successfully.',
    data: {
      listing: serializeListing(createdListing, resolvedImages, tags)
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
  if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to edit this listing.', 403));
  }

  const updates = {};
  if (req.body.title) updates.title = req.body.title.trim();
  if (req.body.description) updates.description = req.body.description.trim();
  if (req.body.price !== undefined) updates.price = Math.max(0, parseFloat(req.body.price) || 0);
  if (req.body.originalSrp !== undefined) updates.original_srp = parseFloat(req.body.originalSrp);
  if (req.body.tradeMode) updates.trade_mode = req.body.tradeMode;
  if (req.body.swapPreference !== undefined) updates.swap_preference = req.body.swapPreference;
  if (req.body.category) updates.category = req.body.category;
  if (req.body.condition) updates.condition = req.body.condition;
  if (req.body.campus) updates.campus = req.body.campus;

  // Status check: regular users can only mark active or sold; admins can set any status
  if (req.body.status) {
    if (req.user.role !== 'admin' && !['active', 'sold'].includes(req.body.status)) {
      return next(new AppError('Unauthorized status change. Allowed values: active, sold.', 403));
    }
    updates.status = req.body.status;
  }
  if (req.body.isSold) updates.status = 'sold';

  // Only admins can modify is_featured / isBoosted via update
  if (req.user.role === 'admin' && (req.body.isFeatured !== undefined || req.body.isBoosted !== undefined)) {
    updates.is_featured = Boolean(req.body.isFeatured ?? req.body.isBoosted);
  }

  await db.transaction(async (trx) => {
    if (Object.keys(updates).length > 0) {
      await trx('listings').where({ id }).update(updates);
    }

    if (Array.isArray(req.body.images)) {
      const cappedImages = req.body.images.slice(0, 5);
      const resolvedImages = await Promise.all(
        cappedImages.map((img) => storageService.uploadBase64(img, 'listings'))
      );
      await trx('listing_images').where({ listing_id: id }).delete();
      if (resolvedImages.length > 0) {
        const imgRows = resolvedImages.map((url, index) => ({
          id: uuidv4(),
          listing_id: id,
          image_url: url,
          is_primary: index === 0,
          display_order: index
        }));
        await trx('listing_images').insert(imgRows);
      }
    }
  });

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

  // Clean up listing images from storage
  const listingImages = await db('listing_images').where({ listing_id: id });
  for (const img of listingImages) {
    await storageService.deleteFile(img.image_url);
  }

  // Clean up dependent child rows in a single transaction to prevent orphans
  await db.transaction(async (trx) => {
    await trx('listing_tags').where({ listing_id: id }).delete();
    await trx('listing_images').where({ listing_id: id }).delete();
    await trx('favorites').where({ listing_id: id }).delete();
    await trx('flagged_listings').where({ listing_id: id }).delete();
    await trx('listings').where({ id }).delete();
  });

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

  await db('listings').where({ id }).update({ is_featured: true });

  res.status(200).json({
    status: 'success',
    message: 'Listing boosted successfully.'
  });
});

/**
 * Mark a listing as sold / out of stock
 */
const markAsSold = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const listing = await db('listings').where({ id }).first();

  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to modify this listing.', 403));
  }

  await db('listings').where({ id }).update({ status: 'sold' });

  res.status(200).json({
    status: 'success',
    message: 'Listing marked as sold.'
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

  // Prevent self-reporting
  if (listing.seller_id === req.user.id) {
    return next(new AppError('You cannot report your own listing.', 400));
  }

  // Prevent duplicate pending reports from the same user
  const existingReport = await db('flagged_listings')
    .where({ listing_id: id, reporter_id: req.user.id, status: 'pending' })
    .first();

  if (existingReport) {
    return next(new AppError('You have already submitted a report for this listing that is pending review.', 409));
  }

  await db('flagged_listings').insert({
    id: uuidv4(),
    listing_id: id,
    reporter_id: req.user.id,
    reason: (reason || 'Inappropriate listing').trim(),
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
