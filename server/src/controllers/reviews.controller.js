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

  const reviewId = `rev_${uuidv4()}`;

  await db.transaction(async (trx) => {
    await trx('reviews').insert({
      id: reviewId,
      listing_id: listingId,
      reviewer_id: req.user.id,
      transaction_id: transactionId || (transaction ? transaction.id : null),
      target_user_id: listing.seller_id,
      rating: numRating,
      comment: comment ? comment.trim() : null,
      trade_type: tradeType || listing.trade_mode || 'buy_sell',
      item_title: itemTitle || listing.title,
      created_at: new Date()
    });

    // Recalculate listing rating and total_reviews
    const stats = await trx('reviews')
      .where({ listing_id: listingId })
      .select(
        trx.raw('COUNT(*) as total_reviews'),
        trx.raw('AVG(rating) as avg_rating')
      )
      .first();

    const totalReviews = Number(stats.total_reviews) || 0;
    const avgRating = totalReviews > 0 ? parseFloat(stats.avg_rating).toFixed(1) : 0.0;

    await trx('listings').where({ id: listingId }).update({
      rating: avgRating,
      total_reviews: totalReviews
    });
  });

  const updatedListing = await db('listings').where({ id: listingId }).select('rating', 'total_reviews').first();

  res.status(201).json({
    status: 'success',
    message: 'Product review submitted! Thank you for sharing your experience.',
    data: {
      reviewId,
      listingRating: Number(updatedListing?.rating || numRating),
      totalReviews: Number(updatedListing?.total_reviews || 1)
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
      'reviews.created_at as createdAt',
      'reviewer.id as reviewerId',
      'reviewer.name as reviewerName',
      'reviewer.avatar_url as reviewerAvatar',
      'reviewer.campus as reviewerCampus',
      'reviewer.college as reviewerCollege',
      'reviewer.is_verified as reviewerIsVerified'
    )
    .orderBy('reviews.created_at', 'desc');

  res.status(200).json({
    status: 'success',
    data: {
      listingId,
      rating: Number(listing.rating || 0.0),
      totalReviews: Number(listing.total_reviews || reviews.length),
      reviews
    }
  });
});

module.exports = {
  createReview,
  getListingReviews
};
