const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeUser } = require('../serializers/userSerializer');
const { serializeListing } = require('../serializers/listingSerializer');
const { serializeReview } = require('../serializers');
const storageService = require('../services/storage.service');

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
  const images = listingIds.length > 0
    ? await db('listing_images').whereIn('listing_id', listingIds).orderBy('display_order', 'asc')
    : [];
  const tags = listingIds.length > 0
    ? await db('listing_tags').whereIn('listing_id', listingIds)
    : [];

  const formattedListings = listings.map((l) => {
    const lImages = images.filter((img) => img.listing_id === l.id).map((img) => img.image_url);
    const lTags = tags.filter((t) => t.listing_id === l.id).map((t) => t.tag);
    return serializeListing(l, lImages, lTags);
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
 * Submit student ID verification request
 */
const submitIdVerification = asyncHandler(async (req, res, next) => {
  const { studentIdNumber, idPhotoUrl, idCardImageUrl, selfiePhotoUrl } = req.body;
  const rawIdPhoto = idPhotoUrl || idCardImageUrl;

  if (!studentIdNumber || !rawIdPhoto) {
    return next(new AppError('Student ID number and valid ID photo are required.', 400));
  }

  const cleanId = studentIdNumber.replace(/\D/g, '');
  if (cleanId.length < 6) {
    return next(new AppError('Student ID must contain at least 6 digits.', 400));
  }

  // Check if another account is already registered with this student ID
  const existingAccountWithId = await db('users')
    .where({ student_id: cleanId })
    .andWhereNot({ id: req.user.id })
    .first();

  if (existingAccountWithId) {
    return next(new AppError('This Student ID number is already registered to another student account.', 409));
  }

  // Upload ID photos to Cloudflare R2 / secure storage
  const [resolvedIdPhoto, resolvedSelfie] = await Promise.all([
    storageService.uploadBase64(rawIdPhoto, 'id-photos'),
    selfiePhotoUrl ? storageService.uploadBase64(selfiePhotoUrl, 'id-photos') : Promise.resolve(null)
  ]);

  // Check if user already has an active pending request (prevent duplicates)
  const existingPending = await db('verification_requests')
    .where({ user_id: req.user.id, status: 'pending' })
    .first();

  if (existingPending) {
    await db('verification_requests').where({ id: existingPending.id }).update({
      student_id_number: cleanId,
      id_photo_url: resolvedIdPhoto,
      selfie_photo_url: resolvedSelfie || existingPending.selfie_photo_url,
      updated_at: new Date()
    });
  } else {
    const insertData = {
      id: uuidv4(),
      user_id: req.user.id,
      student_id_number: cleanId,
      id_photo_url: resolvedIdPhoto,
      status: 'pending'
    };

    if (resolvedSelfie) {
      insertData.selfie_photo_url = resolvedSelfie;
    }

    await db('verification_requests').insert(insertData);
  }

  // Update user student ID and photo
  await db('users').where({ id: req.user.id }).update({
    student_id: cleanId,
    id_photo_url: resolvedIdPhoto
  });

  res.status(200).json({
    status: 'success',
    message: 'ID verification submitted for administrator review.'
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
  submitIdVerification,
  getUserReviews
};
