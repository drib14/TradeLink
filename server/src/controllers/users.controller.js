const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeUser } = require('../serializers/userSerializer');
const { serializeListing } = require('../serializers/listingSerializer');
const { serializeReview } = require('../serializers');
const storageService = require('../services/storage.service');
const verificationSessionService = require('../services/verificationSession.service');

/**
 * Get public profile of a student
 */
const getUserProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await db('users').where({ id }).first();

  if (!user || user.is_banned) {
    return next(new AppError('User profile not found or account is deactivated.', 404));
  }

  // Get user's active listings
  const listings = await db('listings')
    .where({ seller_id: id })
    .orderBy('created_at', 'desc')
    .limit(12);

  const listingIds = listings.map((l) => l.id);
  const mediaRows = listingIds.length > 0
    ? await db('listing_media').whereIn('listing_id', listingIds).orderBy('display_order', 'asc')
    : [];

  const formattedListings = listings.map((l) => {
    const lMedia = mediaRows.filter((m) => m.listing_id === l.id);
    return serializeListing(l, lMedia);
  });

  // Get user's reviews
  const reviews = await db('reviews')
    .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
    .select(
      'reviews.*',
      'reviewer.name as reviewer_name',
      'reviewer.avatar_url as reviewer_avatar',
      'reviewer.campus as reviewer_campus',
      'reviewer.trust_score as reviewer_trust_score'
    )
    .where('reviews.reviewee_id', id)
    .orderBy('reviews.created_at', 'desc')
    .limit(10);

  const formattedReviews = reviews.map(serializeReview);

  res.status(200).json({
    status: 'success',
    data: {
      user: serializeUser(user),
      listings: formattedListings,
      reviews: formattedReviews
    }
  });
});

/**
 * Update current user's profile
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const updates = {};

  if (req.body.name) updates.name = req.body.name.trim();
  if (req.body.bio !== undefined) updates.bio = req.body.bio ? req.body.bio.trim() : null;
  if (req.body.avatar) {
    updates.avatar_url = await storageService.uploadBase64(req.body.avatar, 'avatars');
  }
  if (req.body.campus) updates.campus = req.body.campus;
  if (req.body.college) updates.college = req.body.college.trim();
  if (req.body.yearLevel) updates.year_level = req.body.yearLevel.trim();

  await db('users').where({ id: req.user.id }).update(updates);
  const updatedUser = await db('users').where({ id: req.user.id }).first();

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully.',
    data: {
      user: serializeUser(updatedUser)
    }
  });
});

/**
 * Create a secure, single-use 5-minute cryptographic session challenge for ID verification
 */
const getVerificationSession = asyncHandler(async (req, res) => {
  const sessionData = verificationSessionService.createSession(req.user.id);
  res.status(200).json({
    status: 'success',
    data: sessionData
  });
});

/**
 * Get current user's detailed verification status and history
 */
const getVerificationStatus = asyncHandler(async (req, res) => {
  const latest = await db('verification_requests')
    .where({ user_id: req.user.id })
    .orderBy('created_at', 'desc')
    .first();

  const user = await db('users').where({ id: req.user.id }).first();

  let status = 'unverified';
  if (user?.is_verified) {
    status = 'approved';
  } else if (latest) {
    status = latest.status;
  }

  res.status(200).json({
    status: 'success',
    data: {
      status,
      isVerified: Boolean(user?.is_verified),
      studentIdNumber: latest?.student_id_number || user?.student_id || '',
      rejectionReason: latest?.rejection_reason || null,
      submittedAt: latest?.created_at || null,
      reviewedAt: latest?.reviewed_at || null,
      idPhotoUrl: latest?.id_photo_url || user?.id_photo_url || null,
      selfiePhotoUrl: latest?.selfie_photo_url || null
    }
  });
});

/**
 * Submit student ID verification request with biometric liveness validation and anti-fraud checks
 */
const submitIdVerification = asyncHandler(async (req, res, next) => {
  const {
    studentIdNumber,
    idPhotoUrl,
    idCardImageUrl,
    selfiePhotoUrl,
    sessionToken
  } = req.body;

  const rawIdPhoto = idPhotoUrl || idCardImageUrl;

  if (!studentIdNumber || !rawIdPhoto) {
    return next(new AppError('Student ID number and valid ID photo are required.', 400));
  }

  if (!selfiePhotoUrl) {
    return next(new AppError('Live biometric selfie is required to complete verification.', 400));
  }

  // Cryptographic session token verification (if provided, validate and consume)
  if (sessionToken) {
    const tokenResult = verificationSessionService.validateAndConsumeSession(req.user.id, sessionToken);
    if (!tokenResult.valid) {
      return next(new AppError(`Verification security check failed: ${tokenResult.reason}`, 403));
    }
  }

  // Validate Student ID Format: must contain between 6 and 15 alphanumeric characters
  const cleanId = studentIdNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleanId.length < 6 || cleanId.length > 15) {
    return next(new AppError('Student ID must contain between 6 and 15 valid characters.', 400));
  }

  // Check rate limiting: max 5 verification submissions per 24 hours
  const recentSubmissions = await db('verification_requests')
    .where({ user_id: req.user.id })
    .andWhere('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000));

  if (recentSubmissions.length >= 5) {
    return next(new AppError('Verification submission limit reached (maximum 5 attempts per 24 hours). Please contact campus administration if you require assistance.', 429));
  }

  // Check if another account is already registered with this student ID
  const existingAccountWithId = await db('users')
    .where({ student_id: cleanId })
    .andWhereNot({ id: req.user.id })
    .first();

  if (existingAccountWithId) {
    return next(new AppError('This Student ID number is already registered to another student account.', 409));
  }

  // Also check if an active approved or pending verification exists for this student ID on another user
  const duplicatePending = await db('verification_requests')
    .where({ student_id_number: cleanId })
    .andWhereNot({ user_id: req.user.id })
    .whereIn('status', ['approved', 'pending'])
    .first();

  if (duplicatePending) {
    return next(new AppError('A verification request with this Student ID is already active on another account.', 409));
  }

  // Basic image data sanity check
  const isDataUrl = (str) => typeof str === 'string' && (str.startsWith('data:image/') || str.startsWith('http'));
  if (!isDataUrl(rawIdPhoto) || !isDataUrl(selfiePhotoUrl)) {
    return next(new AppError('Invalid image format. Images must be valid JPEG, PNG, or WebP files.', 400));
  }

  // Upload ID photos to Cloudflare R2 / secure storage
  const [resolvedIdPhoto, resolvedSelfie] = await Promise.all([
    storageService.uploadBase64(rawIdPhoto, 'id-photos'),
    storageService.uploadBase64(selfiePhotoUrl, 'id-photos')
  ]);

  // Check if user already has a pending or rejected request (update record or insert new)
  const existingPending = await db('verification_requests')
    .where({ user_id: req.user.id })
    .andWhere({ status: 'pending' })
    .first();

  if (existingPending) {
    await db('verification_requests').where({ id: existingPending.id }).update({
      student_id_number: cleanId,
      id_photo_url: resolvedIdPhoto,
      selfie_photo_url: resolvedSelfie,
      rejection_reason: null,
      updated_at: new Date()
    });
  } else {
    await db('verification_requests').insert({
      id: uuidv4(),
      user_id: req.user.id,
      student_id_number: cleanId,
      id_photo_url: resolvedIdPhoto,
      selfie_photo_url: resolvedSelfie,
      status: 'pending',
      rejection_reason: null,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  // Update user student ID and photo
  await db('users').where({ id: req.user.id }).update({
    student_id: cleanId,
    id_photo_url: resolvedIdPhoto
  });

  res.status(200).json({
    status: 'success',
    message: 'ID verification and biometric live selfie submitted successfully for administrator review.',
    data: {
      status: 'pending',
      studentIdNumber: cleanId,
      submittedAt: new Date().toISOString()
    }
  });
});

/**
 * Get reviews for a specific user
 */
const getUserReviews = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const reviews = await db('reviews')
    .where({ reviewee_id: id })
    .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
    .select(
      'reviews.*',
      'reviewer.name as reviewer_name',
      'reviewer.avatar_url as reviewer_avatar',
      'reviewer.campus as reviewer_campus'
    )
    .orderBy('reviews.created_at', 'desc');

  const reviewIds = reviews.map((r) => r.id);
  const badges = reviewIds.length > 0
    ? await db('review_badges').whereIn('review_id', reviewIds)
    : [];

  const formatted = reviews.map((r) => {
    const rBadges = badges.filter((b) => b.review_id === r.id).map((b) => b.badge);
    return serializeReview(r, rBadges);
  });

  res.status(200).json({
    status: 'success',
    data: {
      reviews: formatted
    }
  });
});

module.exports = {
  getUserProfile,
  updateProfile,
  getVerificationSession,
  getVerificationStatus,
  submitIdVerification,
  getUserReviews
};
