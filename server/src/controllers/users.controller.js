const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeUser } = require('../serializers/userSerializer');
const { serializeListing } = require('../serializers/listingSerializer');
const { serializeReview } = require('../serializers');

/**
 * Get public profile of a student
 */
const getUserProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await db('users').where({ id }).first();

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // Fetch user's active listings
  const listings = await db('listings')
    .where({ seller_id: id, is_sold: false })
    .orderBy('created_at', 'desc');

  const listingIds = listings.map((l) => l.id);
  const images = listingIds.length > 0
    ? await db('listing_images').whereIn('listing_id', listingIds).orderBy('sort_order', 'asc')
    : [];

  const formattedListings = listings.map((l) => {
    const lImages = images.filter((img) => img.listing_id === l.id).map((img) => img.image_url);
    return serializeListing(l, lImages);
  });

  // Fetch reviews received
  const reviews = await db('reviews')
    .where({ target_user_id: id })
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

  const formattedReviews = reviews.map((r) => {
    const rBadges = badges.filter((b) => b.review_id === r.id).map((b) => b.badge);
    return serializeReview(r, rBadges);
  });

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
  if (req.body.avatar) updates.avatar_url = req.body.avatar;
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
  const resolvedIdPhoto = idPhotoUrl || idCardImageUrl;

  if (!studentIdNumber || !resolvedIdPhoto) {
    return next(new AppError('Student ID number and valid ID photo are required.', 400));
  }

  const cleanId = studentIdNumber.replace(/\D/g, '');
  const verifId = `verif_${uuidv4()}`;

  const insertData = {
    id: verifId,
    user_id: req.user.id,
    student_id_number: cleanId,
    campus: req.user.campus,
    college: req.user.college,
    id_card_image_url: resolvedIdPhoto,
    status: 'pending'
  };

  if (selfiePhotoUrl) {
    insertData.selfie_photo_url = selfiePhotoUrl;
  }

  await db('verification_requests').insert(insertData);

  // Update user ID number and photo
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
    .where({ target_user_id: id })
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
