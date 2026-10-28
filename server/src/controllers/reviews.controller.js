const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Submit a product review for a listing
 */
const createReview = asyncHandler(async (req, res, next) => {
  let {
    listingId,
    transactionId,
    targetUserId,
    rating,
    comment,
    itemTitle,
    tradeType
  } = req.body;

  // Support /listings/:id/reviews route param
  if (!listingId && req.params && req.params.id) {
    listingId = req.params.id;
  }

  // If transactionId is provided without listingId, derive listingId from transaction
  let transaction = null;
  if (transactionId) {
    transaction = await db('transactions').where({ id: transactionId }).first();
    if (!transaction && !listingId) {
      return next(new AppError('Transaction not found.', 404));
    }
    if (transaction && !listingId) {
      listingId = transaction.listing_id;
    }
  }

  if (!listingId) {
    return next(new AppError('Listing ID is required to submit a product review.', 400));
  }

  // Fetch listing
  const listing = await db('listings').where({ id: listingId }).first();
  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  // Prevent seller from reviewing their own product
  if (req.user.id === listing.seller_id) {
    return next(new AppError('You cannot review your own listing.', 400));
  }

  // Validate rating (1 to 5)
  const numRating = Math.round(Number(rating));
  if (!numRating || numRating < 1 || numRating > 5) {
    return next(new AppError('Rating must be between 1 and 5 stars.', 400));
  }

  // Check for duplicate review by the same student on this listing
  const existingReview = await db('reviews')
    .where({ listing_id: listingId, reviewer_id: req.user.id })
    .first();

  if (existingReview) {
    return next(new AppError('You have already submitted a review for this item.', 409));
  }

  const { badges: inputBadges, traitBadges } = req.body;
  const rawBadges = Array.isArray(inputBadges) ? inputBadges : (Array.isArray(traitBadges) ? traitBadges : []);
  const safeBadges = rawBadges.map((b) => String(b).trim()).filter(Boolean);

  const reviewId = `rev_${uuidv4()}`;

  const reviewData = {
    id: reviewId,
    listing_id: listingId,
    reviewer_id: req.user.id,
    transaction_id: transactionId || (transaction ? transaction.id : null),
    target_user_id: listing.seller_id,
    rating: numRating,
    comment: comment ? comment.trim() : null,
    created_at: new Date()
  };

  const hasBadgesCol = await db.schema.hasColumn('reviews', 'badges').catch(() => false);
  if (hasBadgesCol) {
    reviewData.badges = JSON.stringify(safeBadges);
  }

  await db('reviews').insert(reviewData);

  const stats = await db('reviews')
    .where({ listing_id: listingId })
    .select(
      db.raw('COUNT(*) as total_reviews'),
      db.raw('AVG(rating) as avg_rating')
    )
    .first();

  const totalReviews = Number(stats?.total_reviews) || 1;
  const avgRating = totalReviews > 0 ? parseFloat(stats.avg_rating).toFixed(1) : Number(numRating).toFixed(1);

  res.status(201).json({
    status: 'success',
    message: 'Product review submitted! Thank you for sharing your experience.',
    data: {
      reviewId,
      listingRating: Number(avgRating),
      totalReviews,
      badges: safeBadges
    }
  });
});

/**
 * Get all product reviews for a listing
 */
const getListingReviews = asyncHandler(async (req, res, next) => {
  const { id: listingId } = req.params;

  const listing = await db('listings').where({ id: listingId }).first();
  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  const reviews = await db('reviews')
    .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
    .where({ 'reviews.listing_id': listingId })
    .select(
      'reviews.id',
      'reviews.listing_id as listingId',
      'reviews.rating',
      'reviews.comment',
      'reviews.badges',
      'reviews.created_at as createdAt',
      'reviewer.id as reviewerId',
      'reviewer.name as reviewerName',
      'reviewer.avatar_url as reviewerAvatar',
      'reviewer.campus as reviewerCampus',
      'reviewer.department as reviewerDepartment',
      'reviewer.is_verified as reviewerIsVerified'
    )
    .orderBy('reviews.created_at', 'desc');

  const formattedReviews = reviews.map((r) => ({
    ...r,
    badges: r.badges ? (typeof r.badges === 'string' ? JSON.parse(r.badges) : r.badges) : []
  }));

  const avgRating = reviews.length > 0
    ? Number((reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1))
    : 0.0;

  res.status(200).json({
    status: 'success',
    data: {
      listingId,
      rating: avgRating,
      totalReviews: reviews.length,
      reviews: formattedReviews
    }
  });
});

module.exports = {
  createReview,
  getListingReviews
};
