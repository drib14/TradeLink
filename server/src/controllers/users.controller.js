const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sanitizeUser } = require('../utils/sanitize');
const { recalculateUserStats } = require('../services/trustScore.service');

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

  // Fetch reviews received
  const reviews = await db('reviews')
    .where({ target_user_id: id })
    .orderBy('created_at', 'desc');

  res.status(200).json({
    status: 'success',
    data: {
      user: sanitizeUser(user),
      listings,
      reviews
    }
  });
});

/**
 * Update current user's profile
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const updates = {};
  const allowed = ['name', 'bio', 'avatar', 'campus', 'college', 'yearLevel'];

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
      user: sanitizeUser(updatedUser)
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
  const verifId = `verif-${Date.now()}`;

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
    message: 'ID verification and live selfie submitted for administrator review.'
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

  // Fetch badges for each review
  const reviewIds = reviews.map((r) => r.id);
  const badges = reviewIds.length > 0
    ? await db('review_badges').whereIn('review_id', reviewIds)
    : [];

  const reviewsWithBadges = reviews.map((r) => ({
    id: r.id,
    transactionId: r.transaction_id,
    reviewerId: r.reviewer_id,
    reviewerName: r.reviewer_name,
    reviewerAvatar: r.reviewer_avatar,
    reviewerCampus: r.reviewer_campus,
    targetUserId: r.target_user_id,
    rating: r.rating,
    comment: r.comment,
    itemTitle: r.item_title,
    tradeType: r.trade_type,
    wasPunctual: Boolean(r.was_punctual),
    traitBadges: badges.filter((b) => b.review_id === r.id).map((b) => b.badge),
    createdAt: r.created_at
  }));

  res.status(200).json({
    status: 'success',
    data: {
      reviews: reviewsWithBadges
    }
  });
});

module.exports = {
  getUserProfile,
  updateProfile,
  submitIdVerification,
  getUserReviews
};
