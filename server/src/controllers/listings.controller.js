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

// In-memory LRU cache to quickly avoid duplicate DB checks for repeat views in current process (bounded memory with TTL)
const LRUCache = require('lru-cache').LRUCache || require('lru-cache');
const viewCache = new LRUCache({
  max: 50000,
  maxAge: 60 * 60 * 1000, ttl: 60 * 60 * 1000 // 1 hour TTL
});

/**
 * Records a unique view on a listing:
 * - Excludes post owner from incrementing their own view count.
 * - Deduplicates repeat views so user 1 viewing the item multiple times only counts as 1 view.
 * - Persistently stores unique views in the listing_views table.
 */
async function recordUniqueView(listingId, req, listing) {
  try {
    // 1. Exclude the listing owner from incrementing views
    if (req.user && listing && req.user.id === listing.seller_id) {
      return false;
    }

    // 2. Identify viewer (authenticated user ID or anonymous client IP)
    const viewerIdentifier = req.user?.id
      ? `usr_${req.user.id}`
      : `anon_${req.ip || req.headers['x-forwarded-for'] || 'anonymous'}`;

    const cacheKey = `${listingId}:${viewerIdentifier}`;
    if (viewCache.has(cacheKey)) {
      return false;
    }

    // 3. Persistent deduplication in database using unique key
    try {
      const existing = await db('listing_views')
        .where({ listing_id: listingId, viewer_identifier: viewerIdentifier })
        .first();

      if (existing) {
        viewCache.set(cacheKey, true);
        return false;
      }

      await db('listing_views').insert({
        id: uuidv4(),
        listing_id: listingId,
        viewer_identifier: viewerIdentifier,
        created_at: new Date()
      }).catch(() => {});
    } catch (_) {}

    viewCache.set(cacheKey, true);

    // 4. Increment the listing's view counter
    await db('listings').where({ id: listingId }).increment('views_count', 1).catch(() => {});
    if (listing && listing.views_count !== undefined) {
      listing.views_count = (Number(listing.views_count) || 0) + 1;
    }
    return true;
  } catch (err) {
    return false;
  }
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
    status,
    search,
    sortBy = 'recent',
    priceMin = 0,
    priceMax = 100000,
    page = 1,
    limit
  } = req.query;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = limit ? Math.min(1000, Math.max(1, parseInt(limit, 10) || 500)) : 1000;
  const parsedMin = Math.max(0, parseFloat(priceMin) || 0);
  const parsedMax = Math.min(1000000, parseFloat(priceMax) || 100000);

  let query = db('listings')
    .leftJoin('users as seller', 'listings.seller_id', 'seller.id')
    .select(
      'listings.*',
      'seller.name as seller_name',
      'seller.avatar_url as seller_avatar',
      'seller.campus as seller_campus',
      'seller.department as seller_department',
      'seller.department as seller_college',
      'seller.is_verified as seller_is_verified',
      'seller.trust_score as seller_trust_score'
    )
    .where((builder) => {
      builder.whereNull('seller.is_banned').orWhere('seller.is_banned', false);
    });

  // Filter: Status (only filter if explicitly specified and not 'all' or 'All')
  if (status && status.toLowerCase() !== 'all') {
    query = query.where('listings.status', status);
  }

  // Filter: Campus (query on listings.campus to hit composite index, with seller fallback)
  if (campus && campus !== 'All') {
    query = query.where((builder) => {
      builder.where('listings.campus', campus).orWhere('seller.campus', campus);
    });
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

  // Search keyword across title, description, category, seller name with escaped wildcards
  if (search && search.trim()) {
    const cleanSearch = escapeLike(search.trim());
    const q = `%${cleanSearch}%`;
    query = query.where((builder) => {
      builder
        .where('listings.title', 'like', q)
        .orWhere('listings.description', 'like', q)
        .orWhere('listings.category', 'like', q)
        .orWhere('seller.name', 'like', q);
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

  // Fetch media and variations for returned listings with bulk queries
  const listingIds = listings.map((l) => l.id);
  const [mediaRows, variationRows] = await Promise.all([
    listingIds.length > 0
      ? db('listing_media').whereIn('listing_id', listingIds).orderBy('display_order', 'asc')
      : [],
    listingIds.length > 0
      ? db('listing_variations').whereIn('listing_id', listingIds).orderBy('display_order', 'asc').catch(() => [])
      : []
  ]);

  const formatted = listings.map((l) => {
    const lMedia = mediaRows.filter((m) => m.listing_id === l.id);
    const lVars = variationRows.filter((v) => v.listing_id === l.id);
    return serializeListing(l, lMedia, lVars);
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
      'seller.department as seller_department',
      'seller.department as seller_college',
      'seller.is_verified as seller_is_verified',
      'seller.trust_score as seller_trust_score'
    )
    .first();

  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  // Concurrently record unique view and fetch media and variations
  const [, media, variations] = await Promise.all([
    recordUniqueView(id, req, listing),
    db('listing_media').where({ listing_id: id }).orderBy('display_order', 'asc'),
    db('listing_variations').where({ listing_id: id }).orderBy('display_order', 'asc').catch(() => [])
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      listing: serializeListing(listing, media, variations)
    }
  });
});

/**
 * Create a new listing with multi-media (photos + product sample videos)
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
    media = [],
    images = [],
    acceptedPaymentMethods,
    variations = []
  } = req.body;

  // Unicode normalization (NFKC) prevents homoglyph bypasses of prohibited keywords
  const cleanTitle = (title || '').normalize('NFKC').trim();
  const cleanDesc = (description || '').normalize('NFKC').trim();
  const cleanSwap = swapPreference ? swapPreference.normalize('NFKC').trim() : null;

  // Check prohibited keywords in normalized title and description
  const prohibited = await db('prohibited_keywords').select('keyword');
  const lowerText = `${cleanTitle} ${cleanDesc}`.toLowerCase();
  for (const item of prohibited) {
    if (lowerText.includes(item.keyword.toLowerCase().normalize('NFKC'))) {
      return next(
        new AppError(
          `Listing contains prohibited keyword: "${item.keyword}". Restricted items or academic dishonesty materials are not permitted.`,
          400
        )
      );
    }
  }

  // Support client idempotency key to prevent accidental duplicate charges/posts
  const idempotencyKey = req.headers['x-idempotency-key'];
  if (idempotencyKey) {
    const existingListing = await db('listings')
      .where({ seller_id: req.user.id, title: cleanTitle })
      .andWhere('created_at', '>', new Date(Date.now() - 60000))
      .first();
    if (existingListing) {
      const [existingMedia, existingVars] = await Promise.all([
        db('listing_media').where({ listing_id: existingListing.id }).orderBy('display_order', 'asc'),
        db('listing_variations').where({ listing_id: existingListing.id }).orderBy('display_order', 'asc').catch(() => [])
      ]);
      return res.status(200).json({
        status: 'success',
        message: 'Listing retrieved (idempotent request).',
        data: { listing: serializeListing(existingListing, existingMedia, existingVars) }
      });
    }
  }

  // Prevent rapid duplicate creation (within 15 seconds)
  const recentDuplicate = await db('listings')
    .where({ seller_id: req.user.id, title: cleanTitle, status: 'active' })
    .andWhere('created_at', '>', new Date(Date.now() - 15000))
    .first();

  if (recentDuplicate) {
    return next(new AppError('A listing with this exact title was just published. Please wait before creating another.', 409));
  }

  // Format acceptedPaymentMethods (store as comma-separated string)
  let paymentMethodsStr = 'cash,gcash,maya';
  if (Array.isArray(acceptedPaymentMethods) && acceptedPaymentMethods.length > 0) {
    const validMethods = acceptedPaymentMethods.filter(m => ['cash', 'gcash', 'maya'].includes(String(m).toLowerCase()));
    if (validMethods.length > 0) {
      paymentMethodsStr = validMethods.join(',');
    }
  } else if (typeof acceptedPaymentMethods === 'string' && acceptedPaymentMethods.trim()) {
    paymentMethodsStr = acceptedPaymentMethods.trim();
  }

  const listingId = uuidv4();
  const newListing = {
    id: listingId,
    seller_id: req.user.id,
    title: cleanTitle,
    description: cleanDesc,
    price: parseFloat(price || 0),
    original_srp: originalSrp ? parseFloat(originalSrp) : null,
    trade_mode: tradeMode || 'buy_sell',
    swap_preference: cleanSwap,
    category,
    condition: condition || 'Gently Used',
    campus: campus || req.user.campus || 'UC Main',
    department: department || req.user.department || req.user.college || null,
    accepted_payment_methods: paymentMethodsStr,
    status: 'active',
    views_count: 1,
    is_featured: false
  };

  // Cap at 5 media items to optimize storage and bandwidth usage
  const rawItems = (Array.isArray(media) && media.length > 0) ? media : (Array.isArray(images) ? images : []);
  const cappedItems = rawItems.slice(0, 5);

  // Validate base64 payload size before uploading to prevent memory exhaustion
  for (const item of cappedItems) {
    const rawUrl = typeof item === 'string' ? item : (item.url || item.media_url || item.mediaUrl || '');
    if (typeof rawUrl === 'string' && rawUrl.startsWith('data:') && rawUrl.length > 15 * 1024 * 1024) {
      return next(new AppError('A media item exceeds maximum allowed size of 15MB.', 400));
    }
  }

  const resolvedMedia = await Promise.all(
    cappedItems.map(async (item, index) => {
      const rawUrl = typeof item === 'string' ? item : (item.url || item.media_url || item.mediaUrl || '');
      const uploadedUrl = await storageService.uploadBase64(rawUrl, 'listings');
      const isExplicitVideo = typeof item === 'object' && item.mediaType === 'video';
      const isDetectedVideo = Boolean(
        uploadedUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ||
        uploadedUrl.includes('/video/upload/')
      );
      return {
        id: uuidv4(),
        listing_id: listingId,
        media_url: uploadedUrl,
        media_type: (isExplicitVideo || isDetectedVideo) ? 'video' : 'image',
        thumbnail_url: (typeof item === 'object' && item.thumbnailUrl) ? item.thumbnailUrl : null,
        is_primary: index === 0,
        display_order: index
      };
    })
  );

  // Build resolved variations matching with uploaded images
  const resolvedVariations = [];
  const rawVariations = Array.isArray(variations)
    ? variations
    : (typeof variations === 'string' ? (() => { try { return JSON.parse(variations); } catch { return []; } })() : []);

  if (Array.isArray(rawVariations) && rawVariations.length > 0) {
    rawVariations.forEach((v, index) => {
      if (!v || (!v.title && !v.name)) return;
      const vTitle = String(v.title || v.name).trim();
      const imgIdx = (v.imageIndex !== undefined && v.imageIndex !== null && !isNaN(Number(v.imageIndex)))
        ? Number(v.imageIndex)
        : (v.image_index !== undefined && v.image_index !== null && !isNaN(Number(v.image_index)) ? Number(v.image_index) : 0);

      let matchedImageUrl = v.imageUrl || v.image_url || null;
      if (!matchedImageUrl && resolvedMedia.length > 0) {
        const targetMedia = resolvedMedia[imgIdx] || resolvedMedia[0];
        matchedImageUrl = targetMedia ? targetMedia.media_url : null;
      }

      resolvedVariations.push({
        id: uuidv4(),
        listing_id: listingId,
        title: vTitle,
        price: (v.price !== undefined && v.price !== null && !isNaN(Number(v.price))) ? parseFloat(v.price) : null,
        image_url: matchedImageUrl,
        image_index: imgIdx,
        quantity: Math.max(1, parseInt(v.quantity, 10) || 1),
        is_available: v.isAvailable !== undefined ? Boolean(v.isAvailable) : (v.is_available !== undefined ? Boolean(v.is_available) : true),
        display_order: index
      });
    });
  }

  await db.transaction(async (trx) => {
    await trx('listings').insert(newListing);

    if (resolvedMedia.length > 0) {
      await trx('listing_media').insert(resolvedMedia);
    }

    if (resolvedVariations.length > 0) {
      await trx('listing_variations').insert(resolvedVariations);
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
      'seller.department as seller_department',
      'seller.department as seller_college',
      'seller.is_verified as seller_is_verified',
      'seller.trust_score as seller_trust_score'
    )
    .first();

  res.status(201).json({
    status: 'success',
    message: 'Listing created successfully.',
    data: {
      listing: serializeListing(createdListing, resolvedMedia, resolvedVariations)
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
  if (req.body.title) updates.title = req.body.title.normalize('NFKC').trim();
  if (req.body.description) updates.description = req.body.description.normalize('NFKC').trim();
  if (req.body.price !== undefined) updates.price = Math.max(0, parseFloat(req.body.price) || 0);
  if (req.body.originalSrp !== undefined) updates.original_srp = parseFloat(req.body.originalSrp);
  if (req.body.tradeMode) updates.trade_mode = req.body.tradeMode;
  if (req.body.swapPreference !== undefined) updates.swap_preference = req.body.swapPreference ? req.body.swapPreference.normalize('NFKC').trim() : null;
  if (req.body.category) updates.category = req.body.category;
  if (req.body.condition) updates.condition = req.body.condition;
  if (req.body.campus) updates.campus = req.body.campus;
  if (req.body.acceptedPaymentMethods !== undefined) {
    if (Array.isArray(req.body.acceptedPaymentMethods)) {
      const valid = req.body.acceptedPaymentMethods.filter(m => ['cash', 'gcash', 'maya'].includes(String(m).toLowerCase()));
      if (valid.length > 0) {
        updates.accepted_payment_methods = valid.join(',');
      }
    } else if (typeof req.body.acceptedPaymentMethods === 'string' && req.body.acceptedPaymentMethods.trim()) {
      updates.accepted_payment_methods = req.body.acceptedPaymentMethods.trim();
    }
  }
  if (req.body.quantity !== undefined) {
    const q = Math.max(0, parseInt(req.body.quantity, 10) || 0);
    updates.quantity = q;
    if (q === 0 && !updates.status) updates.status = 'sold';
  }

  // Validate prohibited keywords in updated text
  if (updates.title || updates.description) {
    const prohibited = await db('prohibited_keywords').select('keyword');
    const combinedText = `${updates.title || listing.title} ${updates.description || listing.description}`.toLowerCase();
    for (const item of prohibited) {
      if (combinedText.includes(item.keyword.toLowerCase().normalize('NFKC'))) {
        return next(
          new AppError(
            `Listing update contains prohibited keyword: "${item.keyword}". Restricted items or academic dishonesty materials are not permitted.`,
            400
          )
        );
      }
    }
  }

  // Status check: regular users can only mark active or sold; admins can set any status
  if (req.body.status) {
    if (req.user.role !== 'admin' && !['active', 'sold'].includes(req.body.status)) {
      return next(new AppError('Unauthorized status change. Allowed values: active, sold.', 403));
    }
    updates.status = req.body.status;
  }
  if (req.body.isSold !== undefined) {
    updates.status = req.body.isSold ? 'sold' : 'active';
    if (!req.body.isSold && updates.quantity === undefined && listing.quantity === 0) {
      updates.quantity = 1;
    }
  }

  await db.transaction(async (trx) => {
    if (Object.keys(updates).length > 0) {
      await trx('listings').where({ id }).update(updates);
    }

    const rawMedia = Array.isArray(req.body.media) ? req.body.media : (Array.isArray(req.body.images) ? req.body.images : null);
    if (rawMedia) {
      const cappedMedia = rawMedia.slice(0, 5);
      for (const item of cappedMedia) {
        const rawUrl = typeof item === 'string' ? item : (item.url || item.media_url || item.mediaUrl || '');
        if (typeof rawUrl === 'string' && rawUrl.startsWith('data:') && rawUrl.length > 15 * 1024 * 1024) {
          return next(new AppError('A media item exceeds maximum allowed size of 15MB.', 400));
        }
      }
      const resolvedMedia = await Promise.all(
        cappedMedia.map(async (item, index) => {
          const rawUrl = typeof item === 'string' ? item : (item.url || item.media_url || item.mediaUrl || '');
          const uploadedUrl = await storageService.uploadBase64(rawUrl, 'listings');
          const isExplicitVideo = typeof item === 'object' && item.mediaType === 'video';
          const isDetectedVideo = Boolean(
            uploadedUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ||
            uploadedUrl.includes('/video/upload/')
          );
          return {
            id: uuidv4(),
            listing_id: id,
            media_url: uploadedUrl,
            media_type: (isExplicitVideo || isDetectedVideo) ? 'video' : 'image',
            thumbnail_url: (typeof item === 'object' && item.thumbnailUrl) ? item.thumbnailUrl : null,
            is_primary: index === 0,
            display_order: index
          };
        })
      );

      // Clean up replaced media files from Cloudinary to prevent orphaned asset leak
      const existingMedia = await trx('listing_media').where({ listing_id: id });
      const newUrls = new Set(resolvedMedia.map(m => m.media_url));
      const toDelete = existingMedia.filter(m => !newUrls.has(m.media_url));
      for (const oldItem of toDelete) {
        await storageService.deleteFile(oldItem.media_url);
      }

      await trx('listing_media').where({ listing_id: id }).delete();
      if (resolvedMedia.length > 0) {
        await trx('listing_media').insert(resolvedMedia);
      }
    }

    if (req.body.variations !== undefined) {
      const rawVars = Array.isArray(req.body.variations)
        ? req.body.variations
        : (typeof req.body.variations === 'string' ? (() => { try { return JSON.parse(req.body.variations); } catch { return []; } })() : []);
      await trx('listing_variations').where({ listing_id: id }).delete().catch(() => {});
      if (Array.isArray(rawVars) && rawVars.length > 0) {
        const curMedia = await trx('listing_media').where({ listing_id: id }).orderBy('display_order', 'asc');
        const updatedVariations = rawVars.map((v, index) => {
          const vTitle = String(v.title || v.name || '').trim();
          const imgIdx = (v.imageIndex !== undefined && !isNaN(Number(v.imageIndex)))
            ? Number(v.imageIndex)
            : (v.image_index !== undefined && !isNaN(Number(v.image_index)) ? Number(v.image_index) : 0);
          let matchedUrl = v.imageUrl || v.image_url || null;
          if (!matchedUrl && curMedia.length > 0) {
            matchedUrl = curMedia[imgIdx]?.media_url || curMedia[0]?.media_url || null;
          }
          return {
            id: uuidv4(),
            listing_id: id,
            title: vTitle,
            price: (v.price !== undefined && v.price !== null && !isNaN(Number(v.price))) ? parseFloat(v.price) : null,
            image_url: matchedUrl,
            image_index: imgIdx,
            quantity: Math.max(1, parseInt(v.quantity, 10) || 1),
            is_available: v.isAvailable !== undefined ? Boolean(v.isAvailable) : true,
            display_order: index
          };
        }).filter(v => v.title);
        if (updatedVariations.length > 0) {
          await trx('listing_variations').insert(updatedVariations);
        }
      }
    }
  });

  res.status(200).json({
    status: 'success',
    message: 'Listing updated successfully.'
  });
});

/**
 * Delete a listing (with foreign key safe soft-delete / archiving if transacted)
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

  // Check if foreign key references exist in transactions or swaps to prevent DB foreign key constraint errors
  const hasTransactions = await db('transactions').where({ listing_id: id }).first();
  const hasSwaps = await db('swap_offers').where(builder => {
    builder.where({ listing_id: id }).orWhere({ offered_listing_id: id });
  }).first();

  if (hasTransactions || hasSwaps) {
    // Soft-delete / archive to preserve history without foreign key failure
    await db('listings').where({ id }).update({ status: 'archived', updated_at: new Date() });
    return res.status(200).json({
      status: 'success',
      message: 'Listing archived (historical transaction records preserved).'
    });
  }

  // Clean up listing media from storage
  const listingMedia = await db('listing_media').where({ listing_id: id });
  for (const m of listingMedia) {
    await storageService.deleteFile(m.media_url);
  }

  // Clean up dependent child rows in a single transaction to prevent orphans
  await db.transaction(async (trx) => {
    await trx('listing_media').where({ listing_id: id }).delete();
    await trx('listing_variations').where({ listing_id: id }).delete().catch(() => {});
    await trx('flagged_listings').where({ listing_id: id }).delete();
    await trx('listings').where({ id }).delete();
  });

  res.status(200).json({
    status: 'success',
    message: 'Listing deleted.'
  });
});

/**
 * Mark a listing as sold or reactivate listing
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

  const isSold = req.body.isSold !== undefined ? Boolean(req.body.isSold) : true;
  const newStatus = isSold ? 'sold' : 'active';
  const updates = { status: newStatus, updated_at: new Date() };

  if (isSold) {
    updates.quantity = 0;
  } else if (listing.quantity === 0) {
    updates.quantity = 1;
  }

  await db('listings').where({ id }).update(updates);

  res.status(200).json({
    status: 'success',
    message: isSold ? 'Listing marked as sold.' : 'Listing reactivated.',
    data: { status: newStatus }
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

/**
 * Increment view count (dedicated endpoint)
 */
const viewListing = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const listing = await db('listings').where({ id }).first();

  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  // Record unique view: excludes owner and deduplicates repeat views
  await recordUniqueView(id, req, listing);

  res.status(200).json({
    status: 'success',
    message: 'View recorded.'
  });
});

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  markAsSold,
  reportListing,
  viewListing
};
