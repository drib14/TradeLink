const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generate4DigitCode, hashCode, verifyCode } = require('../utils/generateCode');
const { recalculateUserStats } = require('../services/trustScore.service');
const { serializeMeetup } = require('../serializers');

/**
 * Helper to extract encoded handshake OTP from notes
 */
function extractOtp(rawNotes) {
  if (!rawNotes) return null;
  const match = rawNotes.match(/__TL_OTP__:(\d{4})/);
  return match ? match[1] : null;
}

/**
 * Helper to remove encoded handshake OTP tag from notes
 */
function cleanNotes(rawNotes) {
  if (!rawNotes) return null;
  const cleaned = rawNotes.replace(/\n?__TL_OTP__:\d{4}/, '').trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Get all meetups for current user
 */
const getMeetups = asyncHandler(async (req, res) => {
  const meetups = await db('meetup_transactions')
    .join('listings', 'meetup_transactions.listing_id', 'listings.id')
    .join('users as seller', 'meetup_transactions.seller_id', 'seller.id')
    .join('users as buyer', 'meetup_transactions.buyer_id', 'buyer.id')
    .where((builder) => {
      builder
        .where('meetup_transactions.seller_id', req.user.id)
        .orWhere('meetup_transactions.buyer_id', req.user.id);
    })
    .select(
      'meetup_transactions.*',
      'listings.title as listing_title',
      'seller.name as seller_name',
      'buyer.name as buyer_name'
    )
    .orderBy('meetup_transactions.created_at', 'desc');

  // Fetch listing images with a single query
  const listingIds = [...new Set(meetups.map((m) => m.listing_id).filter(Boolean))];
  const images = listingIds.length > 0
    ? await db('listing_images').whereIn('listing_id', listingIds).orderBy('display_order', 'asc')
    : [];

  const formatted = meetups.map((m) => {
    const img = images.find((i) => i.listing_id === m.listing_id)?.image_url || '';
    const isBuyer = req.user.id === m.buyer_id;
    const isAdmin = req.user.role === 'admin';
    const rawOtp = extractOtp(m.notes) || m.verification_code || null;
    const verificationCode = (isBuyer || isAdmin) ? rawOtp : null;

    const sanitizedMeetup = {
      ...m,
      notes: cleanNotes(m.notes)
    };

    return serializeMeetup(sanitizedMeetup, img, verificationCode);
  });

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
  const meetupId = uuidv4();

  const otpTag = `__TL_OTP__:${code}`;
  const combinedNotes = notes && notes.trim() ? `${notes.trim()}\n${otpTag}` : otpTag;

  const newMeetup = {
    id: meetupId,
    listing_id: listingId,
    seller_id: sellerId,
    buyer_id: buyerId,
    trade_mode: tradeMode,
    final_price: parseFloat(finalPrice || 0),
    campus,
    landmark_spot: landmarkSpot.trim(),
    scheduled_datetime: scheduledDateTime.trim(),
    handshake_code_hash: codeHash,
    status: 'scheduled'
  };

  await db('meetup_transactions').insert(newMeetup);

  // Notify the other party
  const targetRecipientId = req.user.id === sellerId ? buyerId : sellerId;
  await db('notifications').insert({
    id: uuidv4(),
    user_id: targetRecipientId,
    title: 'Meetup Scheduled!',
    message: `Campus meetup scheduled at ${landmarkSpot} (${campus}) on ${scheduledDateTime}.`,
    type: 'meetup',
    link_url: `/meetups`
  });

  const sanitizedMeetup = {
    ...newMeetup,
    notes: cleanNotes(combinedNotes)
  };

  res.status(201).json({
    status: 'success',
    message: 'Campus meetup scheduled. Handshake verification code generated.',
    data: {
      meetup: serializeMeetup(sanitizedMeetup, '', code),
      verificationCode: code // Provided one-time in scheduling response to parties
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
  if (req.user.id !== meetup.seller_id && req.user.id !== meetup.buyer_id && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized to verify this meetup transaction.', 403));
  }

  if (meetup.status === 'completed') {
    return next(new AppError('This transaction has already been completed.', 400));
  }

  // Strictly verify hashed code with timing-safe bcrypt or fallback to extractOtp
  let isMatch = false;
  const targetHash = meetup.handshake_code_hash || meetup.verification_code_hash;
  if (targetHash) {
    try {
      isMatch = await verifyCode(code, targetHash);
    } catch {
      isMatch = false;
    }
  }
  if (!isMatch) {
    const rawOtp = extractOtp(meetup.notes);
    if (rawOtp && rawOtp === String(code).trim()) {
      isMatch = true;
    }
  }

  if (!isMatch) {
    return next(new AppError('Invalid 4-digit Handshake Code. Please double-check with the other student.', 400));
  }

  // Update status to completed
  await db('meetup_transactions').where({ id }).update({
    status: 'completed',
    completed_at: new Date()
  });

  // Mark listing as sold
  await db('listings').where({ id: meetup.listing_id }).update({ status: 'sold' });

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

  if (req.user.id !== meetup.seller_id && req.user.id !== meetup.buyer_id && req.user.role !== 'admin') {
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
