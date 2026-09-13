const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { serializeListing } = require('../../serializers/listingSerializer');
const { logAdminAction } = require('./verification.controller');

function escapeLike(str) {
  return str.replace(/[%_]/g, '\\$&');
}

/**
 * Get all listings for admin management with filters and pagination
 */
const getAllListingsAdmin = asyncHandler(async (req, res) => {
  const {
    campus,
    category,
    tradeMode,
    status = 'All',
    search,
    page = 1,
    limit = 50
  } = req.query;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

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
    );

  if (status && status !== 'All') {
    query = query.where('listings.status', status);
  }

  if (campus && campus !== 'All') {
    query = query.where('seller.campus', campus);
  }

  if (category && category !== 'All') {
    const escapedCat = escapeLike(category.trim());
    query = query.where('listings.category', 'like', `%${escapedCat}%`);
  }

  if (tradeMode && tradeMode !== 'All') {
    query = query.where('listings.trade_mode', tradeMode);
  }

  if (search && search.trim()) {
    const cleanSearch = escapeLike(search.trim());
    const q = `%${cleanSearch}%`;
    query = query.where((builder) => {
      builder
        .whereILike('listings.title', q)
        .orWhereILike('listings.description', q)
        .orWhereILike('seller.name', q);
    });
  }

  const [countResult] = await query.clone().clearSelect().count('listings.id as total');
  const total = parseInt(countResult?.total || 0, 10);

  const listings = await query
    .orderBy('listings.created_at', 'desc')
    .limit(parsedLimit)
    .offset(offset);

  const listingIds = listings.map((l) => l.id);
  const mediaRows = listingIds.length > 0
    ? await db('listing_media').whereIn('listing_id', listingIds).orderBy('display_order', 'asc')
    : [];

  const formatted = listings.map((l) => {
    const lMedia = mediaRows.filter((m) => m.listing_id === l.id);
    return serializeListing(l, lMedia);
  });

  res.status(200).json({
    status: 'success',
    data: {
      listings: formatted,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit)
    }
  });
});

/**
 * Admin create an official listing
 */
const createListingAdmin = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    price = 0,
    originalSrp,
    category,
    tradeMode = 'buy_sell',
    condition = 'Like New',
    quantity = 1,
    isFeatured = false,
    images = [],
    media = [],
    tags = [],
    sellerId
  } = req.body;

  if (!title || !category) {
    return next(new AppError('Title and Category are required.', 400));
  }

  const effectiveSellerId = sellerId || req.user.id;
  const listingId = uuidv4();

  await db.transaction(async (trx) => {
    await trx('listings').insert({
      id: listingId,
      seller_id: effectiveSellerId,
      title: title.trim(),
      description: (description || '').trim(),
      price: Math.max(0, parseFloat(price) || 0),
      original_srp: originalSrp ? parseFloat(originalSrp) : null,
      category,
      trade_mode: tradeMode,
      condition,
      quantity: Math.max(0, parseInt(quantity, 10) || 1),
      is_featured: Boolean(isFeatured),
      status: 'active',
      tags: JSON.stringify(tags || []),
      created_at: new Date(),
      updated_at: new Date()
    });

    const mediaToInsert = [];
    if (Array.isArray(media) && media.length > 0) {
      media.forEach((item, idx) => {
        if (item.url && item.url.trim()) {
          mediaToInsert.push({
            id: uuidv4(),
            listing_id: listingId,
            media_url: item.url.trim(),
            media_type: item.type === 'video' ? 'video' : 'image',
            display_order: idx
          });
        }
      });
    } else if (Array.isArray(images) && images.length > 0) {
      images.forEach((imgUrl, idx) => {
        if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim()) {
          const isVid = imgUrl.match(/\.(mp4|webm|mov|mkv)$/i) || imgUrl.includes('/video/upload/');
          mediaToInsert.push({
            id: uuidv4(),
            listing_id: listingId,
            media_url: imgUrl.trim(),
            media_type: isVid ? 'video' : 'image',
            display_order: idx
          });
        }
      });
    }

    if (mediaToInsert.length > 0) {
      await trx('listing_media').insert(mediaToInsert);
    }
  });

  await logAdminAction(req.user, 'Created Listing', 'listing', listingId, `Admin created listing "${title}"`, req);

  const created = await db('listings')
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
    .where('listings.id', listingId)
    .first();

  const createdMedia = await db('listing_media')
    .where('listing_id', listingId)
    .orderBy('display_order', 'asc');

  res.status(201).json({
    status: 'success',
    data: {
      listing: serializeListing(created, createdMedia)
    }
  });
});

/**
 * Admin update any listing
 */
const updateListingAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const listing = await db('listings').where({ id }).first();

  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  const {
    title,
    description,
    price,
    originalSrp,
    category,
    tradeMode,
    condition,
    quantity,
    isFeatured,
    status,
    tags,
    images,
    media
  } = req.body;

  const updates = { updated_at: new Date() };

  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (price !== undefined) updates.price = Math.max(0, parseFloat(price) || 0);
  if (originalSrp !== undefined) updates.original_srp = originalSrp ? parseFloat(originalSrp) : null;
  if (category !== undefined) updates.category = category;
  if (tradeMode !== undefined) updates.trade_mode = tradeMode;
  if (condition !== undefined) updates.condition = condition;
  if (quantity !== undefined) {
    const q = Math.max(0, parseInt(quantity, 10) || 0);
    updates.quantity = q;
    if (q === 0) updates.status = 'sold';
  }
  if (isFeatured !== undefined) updates.is_featured = Boolean(isFeatured);
  if (status !== undefined) updates.status = status;
  if (tags !== undefined) updates.tags = JSON.stringify(tags);

  await db.transaction(async (trx) => {
    await trx('listings').where({ id }).update(updates);

    if (media !== undefined || images !== undefined) {
      await trx('listing_media').where({ listing_id: id }).delete();

      const mediaToInsert = [];
      if (Array.isArray(media) && media.length > 0) {
        media.forEach((item, idx) => {
          if (item.url && item.url.trim()) {
            mediaToInsert.push({
              id: uuidv4(),
              listing_id: id,
              media_url: item.url.trim(),
              media_type: item.type === 'video' ? 'video' : 'image',
              display_order: idx
            });
          }
        });
      } else if (Array.isArray(images) && images.length > 0) {
        images.forEach((imgUrl, idx) => {
          if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim()) {
            const isVid = imgUrl.match(/\.(mp4|webm|mov|mkv)$/i) || imgUrl.includes('/video/upload/');
            mediaToInsert.push({
              id: uuidv4(),
              listing_id: id,
              media_url: imgUrl.trim(),
              media_type: isVid ? 'video' : 'image',
              display_order: idx
            });
          }
        });
      }

      if (mediaToInsert.length > 0) {
        await trx('listing_media').insert(mediaToInsert);
      }
    }
  });

  await logAdminAction(req.user, 'Updated Listing', 'listing', id, `Admin updated listing "${updates.title || listing.title}"`, req);

  const updatedListing = await db('listings')
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
    .where('listings.id', id)
    .first();

  const updatedMedia = await db('listing_media').where('listing_id', id).orderBy('display_order', 'asc');

  res.status(200).json({
    status: 'success',
    data: {
      listing: serializeListing(updatedListing, updatedMedia)
    }
  });
});

/**
 * Admin delete listing
 */
const deleteListingAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const listing = await db('listings').where({ id }).first();

  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  await db.transaction(async (trx) => {
    await trx('listing_media').where({ listing_id: id }).delete();
    await trx('flagged_listings').where({ listing_id: id }).delete();
    await trx('favorites').where({ listing_id: id }).delete();
    await trx('listings').where({ id }).delete();
  });

  await logAdminAction(req.user, 'Deleted Listing', 'listing', id, `Admin removed listing "${listing.title}"`, req);

  res.status(200).json({
    status: 'success',
    message: 'Listing removed successfully by admin.'
  });
});

module.exports = {
  getAllListingsAdmin,
  createListingAdmin,
  updateListingAdmin,
  deleteListingAdmin
};
