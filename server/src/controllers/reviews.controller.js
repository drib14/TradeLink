const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { recalculateUserStats } = require('../services/trustScore.service');

/**
 * Submit a review after completing a meetup
 */
const createReview = asyncHandler(async (req, res, next) => {
  const {
    transactionId,
    targetUserId,
    rating,
    comment,
    itemTitle,
    tradeType,
    wasPunctual = true,
    traitBadges = []
  } = req.body;

  // Check if meetup exists and is completed
  const meetup = await db('meetup_transactions').where({ id: transactionId }).first();
  if (!meetup) {
    return next(new AppError('Meetup transaction not found.', 404));
  }

  // Ensure caller is buyer or seller
  if (req.user.id !== meetup.seller_id && req.user.id !== meetup.buyer_id) {
    return next(new AppError('Unauthorized to review this transaction.', 403));
  }

  // Prevent self review
  if (targetUserId === req.user.id) {
    return next(new AppError('You cannot review yourself.', 400));
  }

  // Prevent duplicate review for the same transaction by the same reviewer
  const existing = await db('reviews')
    .where({ transaction_id: transactionId, reviewer_id: req.user.id })
    .first();

  if (existing) {
    return next(new AppError('You have already submitted a review for this trade.', 409));
  }

  const reviewId = `rev_${uuidv4()}`;

  await db.transaction(async (trx) => {
    await trx('reviews').insert({
      id: reviewId,
      transaction_id: transactionId,
      reviewer_id: req.user.id,
      target_user_id: targetUserId,
      rating,
      comment: comment ? comment.trim() : null,
      item_title: itemTitle,
      trade_type: tradeType,
      was_punctual: wasPunctual
    });

    if (traitBadges.length > 0) {
      const badgeRows = traitBadges.map((badge) => ({
        id: `rb_${uuidv4()}`,
        review_id: reviewId,
        badge: badge.trim()
      }));
      await trx('review_badges').insert(badgeRows);
    }
  });

  // Recalculate target user's trust score and rating metrics
  const newStats = await recalculateUserStats(targetUserId);

  res.status(201).json({
    status: 'success',
    message: 'Review submitted! Thank you for keeping the UC community safe.',
    data: {
      stats: newStats
    }
  });
});

module.exports = {
  createReview
};
