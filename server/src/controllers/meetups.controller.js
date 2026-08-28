const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generate4DigitCode, hashCode, verifyCode } = require('../utils/generateCode');
const { recalculateUserStats } = require('../services/trustScore.service');

/**
 * Get all meetups for current user
 */
const getMeetups = asyncHandler(async (req, res) => {
  const meetups = await db('meetup_transactions')
    .where('seller_id', req.user.id)
    .orWhere('buyer_id', req.user.id)
    .join('listings', 'meetup_transactions.listing_id', 'listings.id')
    .join('users as seller', 'meetup_transactions.seller_id', 'seller.id')
    .join('users as buyer', 'meetup_transactions.buyer_id', 'buyer.id')
    .select(
      'meetup_transactions.*',
      'listings.title as listing_title',
      'seller.name as seller_name',
      'buyer.name as buyer_name'
    )
    .orderBy('meetup_transactions.created_at', 'desc');

  // Fetch listing image
  const listingIds = meetups.map((m) => m.listing_id);
  const images = listingIds.length > 0
    ? await db('listing_images').whereIn('listing_id', listingIds).where('sort_order', 0)
    : [];

  const formatted = meetups.map((m) => ({
    id: m.id,
    listingId: m.listing_id,
    listingTitle: m.listing_title,
    listingImage: images.find((i) => i.listing_id === m.listing_id)?.image_url || '',
    sellerId: m.seller_id,
    sellerName: m.seller_name,
    buyerId: m.buyer_id,
    buyerName: m.buyer_name,
    tradeMode: m.trade_mode,
    finalPrice: parseFloat(m.final_price),
    swapSummary: m.swap_summary,
    campus: m.campus,
    landmarkSpot: m.landmark_spot,
    scheduledDateTime: m.scheduled_datetime,
    verificationCode: m.plain_verification_code,
    status: m.status,
    notes: m.notes,
    createdAt: m.created_at
  }));

  res.status(200).json({
    status: 'success',
    data: {
      meetups: formatted
    }
  });
});

/**
 * Schedule a new guarded campus meetup
 */
const scheduleMeetup = asyncHandler(async (req, res, next) => {
  const {
    listingId,
    sellerId,
    buyerId,
    tradeMode,
    finalPrice = 0,
    swapSummary,
    campus,
    landmarkSpot,
    scheduledDateTime,
    notes
  } = req.body;

  const code = generate4DigitCode();
  const codeHash = await hashCode(code);
  const meetupId = `meet-${Date.now()}`;

  const newMeetup = {
    id: meetupId,
    listing_id: listingId,
    seller_id: sellerId,
    buyer_id: buyerId,
    trade_mode: tradeMode,
    final_price: finalPrice,
    swap_summary: swapSummary || null,
    campus,
    landmark_spot: landmarkSpot.trim(),
    scheduled_datetime: scheduledDateTime.trim(),
    verification_code_hash: codeHash,
    plain_verification_code: code,
    status: 'scheduled',
    notes: notes ? notes.trim() : null
  };

  await db('meetup_transactions').insert(newMeetup);

  // Notify the other party
  const targetRecipientId = req.user.id === sellerId ? buyerId : sellerId;
  await db('notifications').insert({
    id: `notif-${Date.now()}`,
    user_id: targetRecipientId,
    title: 'Meetup Scheduled!',
    message: `Campus meetup scheduled at ${landmarkSpot} (${campus}) on ${scheduledDateTime}. Check your Meetups tab for the 4-digit code.`,
    type: 'meetup',
    link_view: 'meetups',
    link_params: JSON.stringify({ meetupId })
  });

  res.status(201).json({
    status: 'success',
    message: 'Campus meetup scheduled. Handshake verification code generated.',
    data: {
      meetup: {
        ...newMeetup,
        verificationCode: code
      }
    }
  });
});

/**
 * Verify 4-digit handshake code and complete the trade
 */
const verifyMeetupCode = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { code } = req.body;

  const meetup = await db('meetup_transactions').where({ id }).first();
  if (!meetup) {
    return next(new AppError('Meetup transaction not found.', 404));
  }

  // Ensure caller is buyer or seller
  if (req.user.id !== meetup.seller_id && req.user.id !== meetup.buyer_id) {
    return next(new AppError('Unauthorized to verify this meetup transaction.', 403));
  }

  // Verify code with timing-safe check
  const isMatch = await verifyCode(code, meetup.verification_code_hash);
  if (!isMatch && code !== meetup.plain_verification_code) {
    return next(new AppError('Invalid 4-digit Handshake Code. Please double-check with the other student.', 400));
  }

  // Update status to completed
  await db('meetup_transactions').where({ id }).update({
    status: 'completed',
    completed_at: new Date()
  });

  // Mark listing as sold
  await db('listings').where({ id: meetup.listing_id }).update({ is_sold: true });

  // Recalculate trust scores for both students
  await recalculateUserStats(meetup.seller_id);
  await recalculateUserStats(meetup.buyer_id);

  res.status(200).json({
    status: 'success',
    message: 'Transaction verified and completed! Campus Trust Score updated.'
  });
});

/**
 * Update meetup status (on_the_way, cancelled)
 */
const updateMeetupStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const meetup = await db('meetup_transactions').where({ id }).first();
  if (!meetup) {
    return next(new AppError('Meetup transaction not found.', 404));
  }

  if (req.user.id !== meetup.seller_id && req.user.id !== meetup.buyer_id && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Unauthorized.', 403));
  }

  await db('meetup_transactions').where({ id }).update({ status });

  res.status(200).json({
    status: 'success',
    message: `Meetup status updated to ${status}.`
  });
});

module.exports = {
  getMeetups,
  scheduleMeetup,
  verifyMeetupCode,
  updateMeetupStatus
};
