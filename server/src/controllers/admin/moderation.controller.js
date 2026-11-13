const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { serializeUser } = require('../../serializers/userSerializer');
const { logAdminAction } = require('./verification.controller');
const storageService = require('../../services/storage.service');

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
    .leftJoin('users as reporter', 'flagged_listings.reporter_id', 'reporter.id')
    .select(
      'flagged_listings.*',
      'listings.title as listing_title',
      'seller.name as seller_name',
      'seller.campus as campus',
      'reporter.name as reporter_name'
    )
    .orderBy('flagged_listings.created_at', 'desc')
    .limit(parsedLimit)
    .offset(offset);

  const listingIds = flags.map((f) => f.listing_id);
  const mediaRows = listingIds.length > 0
    ? await db('listing_media').whereIn('listing_id', listingIds).orderBy('display_order', 'asc')
    : [];

  const formatted = flags.map((f) => ({
    id: f.id,
    listingId: f.listing_id,
    listingTitle: f.listing_title,
    listingImage: mediaRows.find((i) => i.listing_id === f.listing_id)?.media_url || '',
    sellerName: f.seller_name,
    reporterName: f.reporter_name || 'Anonymous Student',
    reason: f.reason,
    campus: f.campus,
    reportedAt: f.created_at || f.reported_at,
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
    status: 'dismissed',
    action_taken: 'Marked as compliant by moderator',
    reviewed_by: req.user.id,
    reviewed_at: new Date()
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
      action_taken: reason,
      reviewed_by: req.user.id,
      reviewed_at: new Date()
    });
  }

  // Check if foreign key references exist in transactions or swaps
  const hasTransactions = await db('transactions').where({ listing_id: listingId }).first();
  const hasSwaps = await db('swap_offers').where(builder => {
    builder.where({ listing_id: listingId }).orWhere({ offered_listing_id: listingId });
  }).first();

  if (hasTransactions || hasSwaps) {
    await db('listings').where({ id: listingId }).update({ status: 'archived', updated_at: new Date() });
    await logAdminAction(req.user, 'Archived Listing', 'listing', listingId, `Reason: ${reason}`, req);
    return res.status(200).json({
      status: 'success',
      message: 'Listing archived (historical transaction records preserved).'
    });
  }

  // Clean up listing media files from Cloudinary storage
  const listingMedia = await db('listing_media').where({ listing_id: listingId });
  for (const m of listingMedia) {
    await storageService.deleteFile(m.media_url);
  }

  await db.transaction(async (trx) => {
    await trx('listing_media').where({ listing_id: listingId }).delete();
    await trx('flagged_listings').where({ listing_id: listingId }).delete();
    await trx('listings').where({ id: listingId }).delete();
  });

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
    .leftJoin('users as complainant', 'trade_disputes.complainant_id', 'complainant.id')
    .leftJoin('users as respondent', 'trade_disputes.respondent_id', 'respondent.id')
    .leftJoin('transactions', 'trade_disputes.transaction_id', 'transactions.id')
    .leftJoin('listings', 'transactions.listing_id', 'listings.id')
    .select(
      'trade_disputes.*',
      'complainant.name as complainant_name',
      'complainant.campus as complainant_campus',
      'respondent.name as respondent_name',
      'listings.title as listing_title'
    )
    .orderBy('trade_disputes.created_at', 'desc')
    .limit(parsedLimit)
    .offset(offset);

  const formatted = disputes.map((d) => ({
    id: d.id,
    transactionId: d.transaction_id,
    listingTitle: d.listing_title || 'Campus Trade',
    buyerName: d.complainant_name || 'Complainant Student',
    sellerName: d.respondent_name || 'Respondent Student',
    sellerId: d.respondent_id,
    buyerId: d.complainant_id,
    campus: d.complainant_campus || 'UC Main',
    reason: d.reason,
    status: d.status,
    filedAt: d.created_at,
    verdictNote: d.notes,
    verdictAction: d.verdict
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

  const mappedVerdict = action === 'warning' ? 'warning_issued' : (action === 'ban' ? 'account_suspended' : (action === 'dismissed' ? 'dismissed' : 'amicable_settlement'));

  await db('trade_disputes').where({ id }).update({
    status: action === 'dismissed' ? 'dismissed' : 'resolved',
    verdict: mappedVerdict,
    notes: note,
    resolved_by: req.user.id,
    resolved_at: new Date()
  });

  const targetRespondentId = dispute.respondent_id || dispute.seller_id;
  if (targetRespondentId) {
    if (action === 'warning') {
      await db('users').where({ id: targetRespondentId }).update({
        warnings_count: db.raw('warnings_count + 1'),
        trust_score: db.raw('GREATEST(10, trust_score - 15)')
      });
    } else if (action === 'ban') {
      await db('users').where({ id: targetRespondentId }).update({
        is_banned: true,
        ban_reason: `Dispute Verdict: ${note}`,
        banned_at: new Date()
      });
    }
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
        .where('name', 'like', q)
        .orWhere('email', 'like', q)
        .orWhereRaw('CAST(student_id AS CHAR) LIKE ?', [q]);
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

  if (target.id === req.user.id) {
    return next(new AppError('You cannot ban your own administrative account.', 400));
  }

  const rootAdminEmail = process.env.ADMIN_SEED_EMAIL || process.env.ADMIN_EMAIL || '';
  if ((rootAdminEmail && target.email === rootAdminEmail) || target.id === 'user-admin-main' || target.id === 'user-admin') {
    return next(new AppError('The root administrator account cannot be banned.', 403));
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

  if (target.id === req.user.id) {
    return next(new AppError('You cannot delete your own administrative account.', 400));
  }

  const rootAdminEmail = process.env.ADMIN_SEED_EMAIL || process.env.ADMIN_EMAIL || '';
  if ((rootAdminEmail && target.email === rootAdminEmail) ||
      target.id === 'user-admin-main' || target.id === 'user-admin') {
    return next(new AppError('The root administrator account cannot be deleted.', 403));
  }

  // Preserve transaction history and referential integrity. Accounts with
  // completed or pending trades must be suspended rather than hard-deleted.
  const relatedTransaction = await db('transactions')
    .where((builder) => builder.where({ buyer_id: id }).orWhere({ seller_id: id }))
    .first();

  if (relatedTransaction) {
    return next(new AppError(
      'This account has transaction history and cannot be permanently deleted. Suspend the account instead to preserve transaction and audit records.',
      409
    ));
  }

  // Clean up user's listing media from Cloudinary storage
  const userListings = await db('listings').where({ seller_id: id }).select('id');
  const listingIds = userListings.map(l => l.id);
  if (listingIds.length > 0) {
    const media = await db('listing_media').whereIn('listing_id', listingIds);
    for (const m of media) {
      await storageService.deleteFile(m.media_url);
    }
  }

  if (target.avatar_url) {
    await storageService.deleteFile(target.avatar_url);
  }

  await db.transaction(async (trx) => {
    if (listingIds.length > 0) {
      await trx('listing_media').whereIn('listing_id', listingIds).delete();
      await trx('flagged_listings').whereIn('listing_id', listingIds).delete();
      await trx('listings').whereIn('id', listingIds).delete();
    }
    await trx('users').where({ id }).delete();
  });

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

  if (target.id === req.user.id) {
    return next(new AppError('You cannot demote your own administrative account.', 400));
  }

  const rootAdminEmail = process.env.ADMIN_SEED_EMAIL || process.env.ADMIN_EMAIL || 'uc.tradelink@gmail.com';
  if (target.email === rootAdminEmail || target.id === 'user-admin') {
    return next(new AppError('The root administrator account cannot be demoted.', 403));
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
  const { delta, adjustment, amount, newScore: explicitScore, reason = 'Administrator adjustment' } = req.body;

  const target = await db('users').where({ id }).first();
  if (!target) {
    return next(new AppError('User not found.', 404));
  }

  const currentScore = target.trust_score || 60;
  let finalScore = currentScore;

  if (explicitScore !== undefined) {
    finalScore = Math.max(10, Math.min(100, parseInt(explicitScore, 10)));
  } else {
    const diff = Number(delta ?? adjustment ?? amount ?? 0);
    finalScore = Math.max(10, Math.min(100, currentScore + diff));
  }

  await db('users').where({ id }).update({ trust_score: finalScore });
  await logAdminAction(req.user, 'Adjusted Trust Score', 'user', id, `Score changed from ${currentScore} to ${finalScore}: ${reason}`, req);

  res.status(200).json({
    status: 'success',
    message: `Trust score for ${target.name} adjusted to ${finalScore}.`,
    data: { trustScore: finalScore }
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
