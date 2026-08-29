const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { serializeUser } = require('../../serializers/userSerializer');
const { logAdminAction } = require('./verification.controller');

/**
 * Get flagged listings
 */
const getFlaggedListings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  const flags = await db('flagged_listings')
    .join('listings', 'flagged_listings.listing_id', 'listings.id')
    .join('users as seller', 'listings.seller_id', 'seller.id')
    .join('users as reporter', 'flagged_listings.reporter_id', 'reporter.id')
    .select(
      'flagged_listings.*',
      'listings.title as listing_title',
      'seller.name as seller_name',
      'seller.campus as campus',
      'reporter.name as reporter_name'
    )
    .orderBy('flagged_listings.reported_at', 'desc')
    .limit(parsedLimit)
    .offset(offset);

  const listingIds = flags.map((f) => f.listing_id);
  const images = listingIds.length > 0
    ? await db('listing_images').whereIn('listing_id', listingIds).where('sort_order', 0)
    : [];

  const formatted = flags.map((f) => ({
    id: f.id,
    listingId: f.listing_id,
    listingTitle: f.listing_title,
    listingImage: images.find((i) => i.listing_id === f.listing_id)?.image_url || '',
    sellerName: f.seller_name,
    reporterName: f.reporter_name,
    reason: f.reason,
    campus: f.campus,
    reportedAt: f.reported_at,
    status: f.status
  }));

  res.status(200).json({
    status: 'success',
    data: {
      flags: formatted,
      page: parsedPage,
      limit: parsedLimit
    }
  });
});

/**
 * Resolve a listing flag (mark safe)
 */
const resolveFlag = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const flag = await db('flagged_listings').where({ id }).first();

  if (!flag) {
    return next(new AppError('Flagged report not found.', 404));
  }

  await db('flagged_listings').where({ id }).update({
    status: 'resolved',
    resolved_by: req.user.id
  });

  await logAdminAction(req.user, 'Resolved Listing Report', 'listing', flag.listing_id, 'Marked listing as compliant', req);

  res.status(200).json({
    status: 'success',
    message: 'Report resolved and marked safe.'
  });
});

/**
 * Remove a flagged listing (policy violation)
 */
const removeListingByAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason = 'Violation of community safety policy' } = req.body;

  const flag = await db('flagged_listings').where({ id }).first();
  const listingId = flag ? flag.listing_id : id;

  const listing = await db('listings').where({ id: listingId }).first();
  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  if (flag) {
    await db('flagged_listings').where({ id }).update({
      status: 'removed',
      resolved_by: req.user.id,
      resolution_note: reason
    });
  }

  await db('listings').where({ id: listingId }).delete();
  await logAdminAction(req.user, 'Deleted Listing', 'listing', listingId, `Reason: ${reason}`, req);

  res.status(200).json({
    status: 'success',
    message: 'Listing removed by administrator.'
  });
});

/**
 * Get trade disputes
 */
const getDisputes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  const disputes = await db('trade_disputes')
    .orderBy('filed_at', 'desc')
    .limit(parsedLimit)
    .offset(offset);

  const formatted = disputes.map((d) => ({
    id: d.id,
    transactionId: d.transaction_id,
    listingTitle: d.listing_title,
    buyerName: d.buyer_name,
    sellerName: d.seller_name,
    sellerId: d.seller_id,
    buyerId: d.buyer_id,
    campus: d.campus,
    reason: d.reason,
    status: d.status,
    filedAt: d.filed_at,
    verdictNote: d.verdict_note,
    verdictAction: d.verdict_action
  }));

  res.status(200).json({
    status: 'success',
    data: {
      disputes: formatted,
      page: parsedPage,
      limit: parsedLimit
    }
  });
});

/**
 * Resolve trade dispute with verdict
 */
const resolveDispute = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { action, note } = req.body;

  const dispute = await db('trade_disputes').where({ id }).first();
  if (!dispute) {
    return next(new AppError('Dispute case not found.', 404));
  }

  await db('trade_disputes').where({ id }).update({
    status: action === 'dismissed' ? 'dismissed' : 'resolved',
    verdict_action: action,
    verdict_note: note,
    resolved_by: req.user.id,
    resolved_at: new Date()
  });

  if (action === 'warning') {
    await db('users').where({ id: dispute.seller_id }).update({
      warnings_count: db.raw('warnings_count + 1'),
      trust_score: db.raw('GREATEST(10, trust_score - 15)')
    });
  } else if (action === 'ban') {
    await db('users').where({ id: dispute.seller_id }).update({
      is_banned: true,
      ban_reason: `Dispute Verdict: ${note}`,
      banned_at: new Date()
    });
  }

  await logAdminAction(req.user, 'Resolved Dispute Case', 'dispute', id, `Verdict [${action.toUpperCase()}]: ${note}`, req);

  res.status(200).json({
    status: 'success',
    message: `Dispute case resolved with verdict: ${action}.`
  });
});

/**
 * Get all users with pagination for admin management
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, role, campus } = req.query;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  let query = db('users');

  if (role) {
    query = query.where('role', role);
  }
  if (campus && campus !== 'All') {
    query = query.where('campus', campus);
  }
  if (search && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    query = query.where((builder) => {
      builder
        .whereILike('name', q)
        .orWhereILike('email', q)
        .orWhereILike('student_id', q);
    });
  }

  const users = await query.orderBy('created_at', 'desc').limit(parsedLimit).offset(offset);

  res.status(200).json({
    status: 'success',
    data: {
      users: users.map((u) => serializeUser(u)),
      page: parsedPage,
      limit: parsedLimit
    }
  });
});

/**
 * Ban user account
 */
const banUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const target = await db('users').where({ id }).first();
  if (!target) {
    return next(new AppError('User not found.', 404));
  }

  await db('users').where({ id }).update({
    is_banned: true,
    ban_reason: reason,
    banned_at: new Date()
  });

  await logAdminAction(req.user, 'Banned User Account', 'user', id, `Banned ${target.name}: ${reason}`, req);

  res.status(200).json({
    status: 'success',
    message: `Account for ${target.name} has been suspended.`
  });
});

/**
 * Unban user account
 */
const unbanUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const target = await db('users').where({ id }).first();

  if (!target) {
    return next(new AppError('User not found.', 404));
  }

  await db('users').where({ id }).update({
    is_banned: false,
    ban_reason: null,
    banned_at: null
  });

  await logAdminAction(req.user, 'Unbanned User Account', 'user', id, `Restored access for ${target.name}`, req);

  res.status(200).json({
    status: 'success',
    message: `Account access restored for ${target.name}.`
  });
});

/**
 * Issue warning to user
 */
const warnUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { note } = req.body;

  const target = await db('users').where({ id }).first();
  if (!target) {
    return next(new AppError('User not found.', 404));
  }

  await db('users').where({ id }).update({
    warnings_count: db.raw('warnings_count + 1'),
    trust_score: db.raw('GREATEST(10, trust_score - 15)')
  });

  await logAdminAction(req.user, 'Issued User Warning', 'user', id, `Warned ${target.name}: ${note}`, req);

  res.status(200).json({
    status: 'success',
    message: `Warning issued to ${target.name}. Trust score adjusted.`
  });
});

/**
 * Toggle verification badge on user
 */
const toggleVerifyUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const target = await db('users').where({ id }).first();

  if (!target) {
    return next(new AppError('User not found.', 404));
  }

  const newVerified = !target.is_verified;
  await db('users').where({ id }).update({
    is_verified: newVerified,
    trust_score: newVerified
      ? db.raw('LEAST(100, trust_score + 25)')
      : db.raw('GREATEST(50, trust_score - 25)')
  });

  await logAdminAction(req.user, 'Toggled Verification', 'user', id, `Set verified=${newVerified} for ${target.name}`, req);

  res.status(200).json({
    status: 'success',
    message: `Verification status updated for ${target.name}.`
  });
});

/**
 * Delete user (Admin only)
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const target = await db('users').where({ id }).first();

  if (!target) {
    return next(new AppError('User not found.', 404));
  }

  await db('users').where({ id }).delete();
  await logAdminAction(req.user, 'Deleted User Account', 'user', id, `Deleted user ${target.name}`, req);

  res.status(200).json({
    status: 'success',
    message: `User ${target.name} permanently deleted.`
  });
});

/**
 * Promote student to admin
 */
const promoteToAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const target = await db('users').where({ id }).first();

  if (!target) {
    return next(new AppError('User not found.', 404));
  }

  await db('users').where({ id }).update({ role: 'admin' });
  await logAdminAction(req.user, 'Promoted to Admin', 'user', id, `Promoted ${target.name} to Admin`, req);

  res.status(200).json({
    status: 'success',
    message: `${target.name} is now an Admin moderator.`
  });
});

/**
 * Demote admin to student
 */
const demoteAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const target = await db('users').where({ id }).first();

  if (!target) {
    return next(new AppError('User not found.', 404));
  }

  await db('users').where({ id }).update({ role: 'student' });
  await logAdminAction(req.user, 'Demoted from Admin', 'user', id, `Demoted ${target.name} to Student`, req);

  res.status(200).json({
    status: 'success',
    message: `${target.name} demoted to Student.`
  });
});

/**
 * Adjust user trust score
 */
const adjustUserTrustScore = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { delta, reason } = req.body;

  const target = await db('users').where({ id }).first();
  if (!target) {
    return next(new AppError('User not found.', 404));
  }

  const currentScore = target.trust_score || 60;
  const newScore = Math.max(10, Math.min(100, currentScore + Number(delta)));

  await db('users').where({ id }).update({ trust_score: newScore });
  await logAdminAction(req.user, 'Adjusted Trust Score', 'user', id, `Score changed from ${currentScore} to ${newScore}: ${reason}`, req);

  res.status(200).json({
    status: 'success',
    message: `Trust score for ${target.name} adjusted to ${newScore}.`,
    data: { trustScore: newScore }
  });
});

module.exports = {
  getFlaggedListings,
  resolveFlag,
  removeListingByAdmin,
  getDisputes,
  resolveDispute,
  getAllUsers,
  banUser,
  unbanUser,
  warnUser,
  toggleVerifyUser,
  deleteUser,
  promoteToAdmin,
  demoteAdmin,
  adjustUserTrustScore
};
