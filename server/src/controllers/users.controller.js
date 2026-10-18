const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeUser } = require('../serializers/userSerializer');
const { serializeListing } = require('../serializers/listingSerializer');
const { serializeReview } = require('../serializers');
const storageService = require('../services/storage.service');
const verificationSessionService = require('../services/verificationSession.service');
const studentVerificationEngine = require('../services/studentVerificationEngine');

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
  const hasTargetCol = await db.schema.hasColumn('reviews', 'target_user_id').catch(() => true);
  const targetUserCol = hasTargetCol ? 'reviews.target_user_id' : 'reviews.reviewee_id';

  const reviews = await db('reviews')
    .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
    .select(
      'reviews.*',
      'reviewer.name as reviewer_name',
      'reviewer.avatar_url as reviewer_avatar',
      'reviewer.campus as reviewer_campus',
      'reviewer.trust_score as reviewer_trust_score'
    )
    .where(targetUserCol, id)
    .orderBy('reviews.created_at', 'desc')
    .limit(10);

  const formattedReviews = reviews.map(serializeReview);

  const isSelf = Boolean(req.user && req.user.id === id);
  const isAdmin = Boolean(req.user && req.user.role === 'admin');

  res.status(200).json({
    status: 'success',
    data: {
      user: serializeUser(user, { isSelf, isAdmin }),
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
  if (req.body.department || req.body.college) {
    updates.department = (req.body.department || req.body.college).trim();
  }

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

  // Basic image data sanity check
  const isDataUrl = (str) => typeof str === 'string' && (str.startsWith('data:image/') || str.startsWith('http'));
  if (!isDataUrl(rawIdPhoto) || !isDataUrl(selfiePhotoUrl)) {
    return next(new AppError('Invalid image format. Images must be valid JPEG, PNG, or WebP files.', 400));
  }

  // Check rate limiting: max 5 verification submissions per 24 hours
  const recentSubmissions = await db('verification_requests')
    .where({ user_id: req.user.id })
    .andWhere('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000));

  if (recentSubmissions.length >= 5) {
    return next(new AppError('Verification submission limit reached (maximum 5 attempts per 24 hours). Please contact campus administration if you require assistance.', 429));
  }

  // Check if another account is already registered with this student ID
  const cleanId = studentIdNumber.replace(/\D/g, '');
  if (cleanId.length < 6 || cleanId.length > 20) {
    return next(new AppError('Student ID must contain between 6 and 20 digits with no hyphens or letters.', 400));
  }

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

  // Evaluate verification credentials, liveness challenge, and image forensics
  const evaluation = await studentVerificationEngine.evaluateVerification({
    user: req.user,
    studentId: studentIdNumber,
    idPhotoUrl: rawIdPhoto,
    selfiePhotoUrl,
    sessionToken,
    telemetry: req.body.telemetry
  });

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

  let targetVerifId = existingPending ? existingPending.id : uuidv4();

  const verifData = {
    student_id_number: evaluation.cleanId,
    id_photo_url: resolvedIdPhoto,
    selfie_photo_url: resolvedSelfie,
    status: evaluation.status,
    confidence_score: evaluation.confidenceScore,
    is_suspicious: evaluation.isSuspicious,
    suspicious_reasons: evaluation.suspiciousReasons.length > 0 ? JSON.stringify(evaluation.suspiciousReasons) : null,
    credential_diagnostics: JSON.stringify(evaluation.credentialDiagnostics),
    id_photo_hash: evaluation.idPhotoHash,
    selfie_photo_hash: evaluation.selfiePhotoHash,
    verification_method: evaluation.isApproved ? 'automated' : 'manual_review',
    reviewed_by: evaluation.isApproved ? 'system_auto_verify' : null,
    reviewed_at: evaluation.isApproved ? new Date() : null,
    rejection_reason: null,
    updated_at: new Date()
  };

  if (existingPending) {
    await db('verification_requests').where({ id: existingPending.id }).update(verifData);
  } else {
    await db('verification_requests').insert({
      id: targetVerifId,
      user_id: req.user.id,
      created_at: new Date(),
      ...verifData
    });
  }

  // Update user record
  if (evaluation.isApproved) {
    // Automated instant approval (>90% accuracy passed)
    await db('users').where({ id: req.user.id }).update({
      student_id: evaluation.cleanId,
      id_photo_url: resolvedIdPhoto,
      is_verified: true,
      trust_score: db.raw('LEAST(100, trust_score + 25)')
    });

    // Record automated audit log
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    await db('admin_audit_logs').insert({
      id: `log_${Date.now()}_auto`,
      admin_id: 'system_auto_verify',
      admin_name: 'Automated Student Verification Engine',
      action: 'Automated Approval',
      target_type: 'verification',
      target_id: targetVerifId,
      details: `Student ID [${evaluation.cleanId}] auto-approved with ${evaluation.confidenceScore}% confidence score.`,
      ip_address: typeof clientIp === 'string' ? clientIp.split(',')[0].trim() : clientIp,
      created_at: new Date()
    }).catch(() => {});
  } else {
    // Queued for human administrator review (suspicious or <90% score)
    await db('users').where({ id: req.user.id }).update({
      student_id: evaluation.cleanId,
      id_photo_url: resolvedIdPhoto
    });
  }

  const successMessage = evaluation.isApproved
    ? `Student ID verified automatically (${evaluation.confidenceScore}% confidence score, ${evaluation.facialMatchScore}% facial match). Your verified badge is now active!`
    : `Verification submitted for admin review (${evaluation.facialMatchScore}% facial match). Our team will review your ID shortly.`;

  res.status(200).json({
    status: 'success',
    message: successMessage,
    autoApproved: evaluation.isApproved,
    isSuspicious: evaluation.isSuspicious,
    confidenceScore: evaluation.confidenceScore,
    facialMatchScore: evaluation.facialMatchScore,
    reviewEstimate: evaluation.reviewEstimate || '1-3 business days',
    data: {
      status: evaluation.status,
      autoApproved: evaluation.isApproved,
      isSuspicious: evaluation.isSuspicious,
      confidenceScore: evaluation.confidenceScore,
      facialMatchScore: evaluation.facialMatchScore,
      reviewEstimate: evaluation.reviewEstimate || '1-3 business days',
      studentIdNumber: evaluation.cleanId,
      submittedAt: new Date().toISOString()
    }
  });
});

/**
 * Get reviews for a specific user
 */
const getUserReviews = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const hasTargetCol = await db.schema.hasColumn('reviews', 'target_user_id').catch(() => true);
  const targetUserCol = hasTargetCol ? 'reviews.target_user_id' : 'reviews.reviewee_id';

  const reviews = await db('reviews')
    .where(targetUserCol, id)
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

/**
 * Get dynamic personal trading analytics and monthly volume for profile graphs
 */
const getUserAnalytics = asyncHandler(async (req, res, next) => {
  const targetUserId = req.params.id || req.user?.id;

  if (!targetUserId) {
    return next(new AppError('User ID is required.', 400));
  }

  const user = await db('users').where({ id: targetUserId }).first();
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // Authorization: Only the user themselves or an administrator can view full trading volume and transaction details
  const isSelf = req.user?.id === targetUserId;
  const isAdmin = req.user?.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(200).json({
      status: 'success',
      data: {
        userId: targetUserId,
        completedTradesCount: Number(user.completed_trades || 0),
        rating: parseFloat(user.rating ?? 0.0),
        totalReviewsCount: Number(user.total_reviews || 0)
      }
    });
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  // Generate 6-month timeline
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      volume: 0,
      trades: 0
    });
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Fetch all analytics data concurrently in a single batch
  const [
    completedTxs,
    soldListings,
    activeListings,
    totalCompletedTrades,
    totalSoldListings,
    reviewStats
  ] = await Promise.all([
    // Completed transactions involving this user (either buyer or seller) in past 6 months
    db('transactions')
      .where(function() {
        this.where('seller_id', targetUserId).orWhere('buyer_id', targetUserId);
      })
      .andWhere('status', 'completed')
      .andWhere('created_at', '>=', sixMonthsAgo)
      .select('amount', 'created_at', 'completed_at'),

    // Sold listings in past 6 months
    db('listings')
      .where({ seller_id: targetUserId, status: 'sold' })
      .andWhere('updated_at', '>=', sixMonthsAgo)
      .select('price', 'updated_at'),

    // Active inventory
    db('listings')
      .where({ seller_id: targetUserId })
      .whereNot({ status: 'sold' })
      .select('price', 'quantity'),

    // Total completed trades all-time
    db('transactions')
      .where(function() {
        this.where('seller_id', targetUserId).orWhere('buyer_id', targetUserId);
      })
      .where({ status: 'completed' })
      .count('id as count')
      .first(),

    // Total sold listings all-time
    db('listings')
      .where({ seller_id: targetUserId, status: 'sold' })
      .count('id as count')
      .first(),

    // Reviews summary
    db('reviews')
      .where({ target_user_id: targetUserId })
      .avg('rating as avgRating')
      .count('id as count')
      .first()
  ]);

  completedTxs.forEach((tx) => {
    const d = new Date(tx.completed_at || tx.created_at);
    const m = months.find((m) => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
    if (m) {
      m.volume += Number(tx.amount) || 0;
      m.trades += 1;
    }
  });

  soldListings.forEach((l) => {
    const d = new Date(l.updated_at);
    const m = months.find((m) => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
    if (m && m.trades === 0) {
      m.volume += Number(l.price) || 0;
      m.trades += 1;
    }
  });

  const activeInventoryValue = activeListings.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const allTimeTrades = Math.max(
    Number(totalCompletedTrades?.count || 0),
    Number(totalSoldListings?.count || 0),
    Number(user.completed_trades || 0)
  );

  const reviewsCount = Number(reviewStats?.count || 0);
  const avgRating = reviewsCount > 0
    ? Number(Number(reviewStats?.avgRating || 0).toFixed(1))
    : (Number(user.total_reviews || 0) > 0 ? Number(Number(user.rating || 0).toFixed(1)) : 0.0);

  res.status(200).json({
    status: 'success',
    data: {
      userId: targetUserId,
      activeInventoryCount: activeListings.length,
      activeInventoryValue: Math.round(activeInventoryValue),
      completedTradesCount: allTimeTrades,
      rating: avgRating,
      totalReviewsCount: reviewsCount,
      monthlyData: months.map((m) => ({
        label: m.label,
        year: m.year,
        volume: Math.round(m.volume),
        trades: m.trades
      }))
    }
  });
});

module.exports = {
  getUserProfile,
  updateProfile,
  getVerificationSession,
  getVerificationStatus,
  submitIdVerification,
  getUserReviews,
  getUserAnalytics
};
