const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sanitizeUser } = require('../utils/sanitize');
const { recalculateUserStats } = require('../services/trustScore.service');

// Helper to log admin actions
async function logAdminAction(adminUser, action, targetType, targetId, details, req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || null;

  await db('admin_audit_logs').insert({
    id: `log-${Date.now()}`,
    admin_id: adminUser.id,
    admin_name: adminUser.name,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    ip_address: typeof ip === 'string' ? ip.split(',')[0].trim() : ip,
    user_agent: userAgent
  });
}

/**
 * Get dashboard overview statistics
 */
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalListings,
    completedTrades,
    pendingVerifications,
    pendingFlags,
    pendingDisputes
  ] = await Promise.all([
    db('users').count('id as count').first(),
    db('listings').count('id as count').first(),
    db('meetup_transactions').where({ status: 'completed' }).count('id as count').first(),
    db('verification_requests').where({ status: 'pending' }).count('id as count').first(),
    db('flagged_listings').where({ status: 'pending' }).count('id as count').first(),
    db('trade_disputes').where({ status: 'pending' }).count('id as count').first()
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalUsers: Number(totalUsers.count),
      totalListings: Number(totalListings.count),
      completedTrades: Number(completedTrades.count),
      pendingVerifications: Number(pendingVerifications.count),
      pendingFlags: Number(pendingFlags.count),
      pendingDisputes: Number(pendingDisputes.count)
    }
  });
});

/**
 * Get verification requests
 */
const getVerifications = asyncHandler(async (req, res) => {
  const requests = await db('verification_requests')
    .join('users', 'verification_requests.user_id', 'users.id')
    .select(
      'verification_requests.*',
      'users.name as user_name',
      'users.email as user_email'
    )
    .orderBy('verification_requests.submitted_at', 'desc');

  const formatted = requests.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    studentIdNumber: r.student_id_number,
    campus: r.campus,
    college: r.college,
    idCardImageUrl: r.id_card_image_url,
    selfiePhotoUrl: r.selfie_photo_url,
    status: r.status,
    submittedAt: r.submitted_at,
    reviewedAt: r.reviewed_at
  }));

  res.status(200).json({
    status: 'success',
    data: { verifications: formatted }
  });
});

/**
 * Approve student ID verification
 */
const approveVerification = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const verif = await db('verification_requests').where({ id }).first();

  if (!verif) {
    return next(new AppError('Verification request not found.', 404));
  }

  await db.transaction(async (trx) => {
    await trx('verification_requests').where({ id }).update({
      status: 'approved',
      reviewed_at: new Date(),
      reviewed_by: req.user.id
    });

    await trx('users').where({ id: verif.user_id }).update({
      is_verified: true,
      trust_score: db.raw('LEAST(100, trust_score + 25)')
    });
  });

  await logAdminAction(req.user, 'Approved Student Verification', 'verification', id, `Verified user ${verif.user_id}`, req);

  res.status(200).json({
    status: 'success',
    message: 'Student ID verification approved. Trust Score bonus awarded.'
  });
});

/**
 * Reject student ID verification
 */
const rejectVerification = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason = 'Incomplete or unreadable ID photo' } = req.body;

  const verif = await db('verification_requests').where({ id }).first();
  if (!verif) {
    return next(new AppError('Verification request not found.', 404));
  }

  await db('verification_requests').where({ id }).update({
    status: 'rejected',
    reviewed_at: new Date(),
    reviewed_by: req.user.id,
    reject_reason: reason
  });

  await logAdminAction(req.user, 'Rejected Verification', 'verification', id, `Rejected: ${reason}`, req);

  res.status(200).json({
    status: 'success',
    message: 'Verification request rejected.'
  });
});

/**
 * Get flagged listings
 */
const getFlaggedListings = asyncHandler(async (req, res) => {
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
    .orderBy('flagged_listings.reported_at', 'desc');

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
    data: { flags: formatted }
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
  const disputes = await db('trade_disputes').orderBy('filed_at', 'desc');

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
    data: { disputes: formatted }
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
 * Get announcements
 */
const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await db('announcements').orderBy('created_at', 'desc');

  const formatted = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    campus: a.campus,
    type: a.type,
    authorName: a.author_name,
    createdAt: a.created_at,
    isActive: Boolean(a.is_active)
  }));

  res.status(200).json({
    status: 'success',
    data: { announcements: formatted }
  });
});

/**
 * Create announcement
 */
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, campus = 'All', type = 'info' } = req.body;

  const annId = `ann-${Date.now()}`;
  const newAnn = {
    id: annId,
    title: title.trim(),
    message: message.trim(),
    campus,
    type,
    author_id: req.user.id,
    author_name: req.user.name,
    is_active: true
  };

  await db('announcements').insert(newAnn);
  await logAdminAction(req.user, 'Created Campus Announcement', 'announcement', annId, `Posted "${title}" for ${campus}`, req);

  res.status(201).json({
    status: 'success',
    message: 'Announcement published to campus bulletin.',
    data: { announcement: newAnn }
  });
});

/**
 * Delete announcement
 */
const deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  await db('announcements').where({ id }).delete();
  await logAdminAction(req.user, 'Deleted Announcement', 'announcement', id, `Deleted announcement ${id}`, req);

  res.status(200).json({
    status: 'success',
    message: 'Announcement removed.'
  });
});

/**
 * Toggle announcement active status
 */
const toggleAnnouncement = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const ann = await db('announcements').where({ id }).first();

  if (!ann) {
    return next(new AppError('Announcement not found.', 404));
  }

  await db('announcements').where({ id }).update({ is_active: !ann.is_active });

  res.status(200).json({
    status: 'success',
    message: 'Announcement visibility updated.'
  });
});

/**
 * Get audit logs
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await db('admin_audit_logs').orderBy('created_at', 'desc').limit(100);

  const formatted = logs.map((l) => ({
    id: l.id,
    adminName: l.admin_name,
    action: l.action,
    targetType: l.target_type,
    targetId: l.target_id,
    details: l.details,
    timestamp: l.created_at
  }));

  res.status(200).json({
    status: 'success',
    data: { auditLogs: formatted }
  });
});

/**
 * Get all users with filters for admin user management
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await db('users').orderBy('created_at', 'desc');

  res.status(200).json({
    status: 'success',
    data: {
      users: users.map(sanitizeUser)
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
 * Delete user (SuperAdmin only)
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
 * Promote student to admin (SuperAdmin only)
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
 * Demote admin to student (SuperAdmin only)
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
 * Get prohibited keywords
 */
const getKeywords = asyncHandler(async (req, res) => {
  const keywords = await db('prohibited_keywords').select('keyword');
  res.status(200).json({
    status: 'success',
    data: { keywords: keywords.map((k) => k.keyword) }
  });
});

/**
 * Add prohibited keyword
 */
const addKeyword = asyncHandler(async (req, res, next) => {
  const { keyword } = req.body;
  const trimmed = keyword.trim().toLowerCase();

  const existing = await db('prohibited_keywords').where({ keyword: trimmed }).first();
  if (existing) {
    return next(new AppError('Keyword filter already exists.', 409));
  }

  await db('prohibited_keywords').insert({
    id: `kw-${Date.now()}`,
    keyword: trimmed,
    added_by: req.user.id
  });

  await logAdminAction(req.user, 'Added Prohibited Keyword', 'system', `keyword-${trimmed}`, `Added auto-filter: "${trimmed}"`, req);

  res.status(201).json({
    status: 'success',
    message: `Prohibited keyword "${trimmed}" added.`
  });
});

/**
 * Remove prohibited keyword
 */
const removeKeyword = asyncHandler(async (req, res, next) => {
  const { keyword } = req.params;
  const trimmed = keyword.trim().toLowerCase();

  await db('prohibited_keywords').where({ keyword: trimmed }).delete();
  await logAdminAction(req.user, 'Removed Prohibited Keyword', 'system', `keyword-${trimmed}`, `Removed keyword "${trimmed}"`, req);

  res.status(200).json({
    status: 'success',
    message: `Prohibited keyword "${trimmed}" removed.`
  });
});

/**
 * Get system config & feature flags
 */
const getSystemConfig = asyncHandler(async (req, res) => {
  const config = await db('system_config').where({ config_key: 'platform_rules' }).first();
  const flags = await db('feature_flags').orderBy('name', 'asc');

  const parsedConfig = config
    ? (typeof config.config_value === 'string' ? JSON.parse(config.config_value) : config.config_value)
    : {};

  res.status(200).json({
    status: 'success',
    data: {
      config: {
        ...parsedConfig,
        lastUpdatedBy: config?.last_updated_by || 'system',
        lastUpdatedAt: config?.updated_at || new Date()
      },
      featureFlags: flags.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        enabled: Boolean(f.enabled),
        updatedAt: f.updated_at
      }))
    }
  });
});

/**
 * Update system config (SuperAdmin only)
 */
const updateSystemConfig = asyncHandler(async (req, res) => {
  const current = await db('system_config').where({ config_key: 'platform_rules' }).first();
  const currentVal = current
    ? (typeof current.config_value === 'string' ? JSON.parse(current.config_value) : current.config_value)
    : {};

  const merged = {
    ...currentVal,
    ...req.body
  };

  await db('system_config')
    .insert({
      config_key: 'platform_rules',
      config_value: JSON.stringify(merged),
      last_updated_by: req.user.name
    })
    .onConflict('config_key')
    .merge({
      config_value: JSON.stringify(merged),
      last_updated_by: req.user.name
    });

  await logAdminAction(req.user, 'System Config Updated', 'system', 'config', `Updated: ${Object.keys(req.body).join(', ')}`, req);

  res.status(200).json({
    status: 'success',
    message: 'System configuration updated.'
  });
});

/**
 * Toggle feature flag (SuperAdmin only)
 */
const toggleFeatureFlag = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const flag = await db('feature_flags').where({ id }).first();

  if (!flag) {
    return next(new AppError('Feature flag not found.', 404));
  }

  await db('feature_flags').where({ id }).update({ enabled: !flag.enabled });
  await logAdminAction(req.user, 'Toggled Feature Flag', 'system', id, `Toggled ${flag.name} to ${!flag.enabled}`, req);

  res.status(200).json({
    status: 'success',
    message: `Feature flag "${flag.name}" updated.`
  });
});

module.exports = {
  getStats,
  getVerifications,
  approveVerification,
  rejectVerification,
  getFlaggedListings,
  resolveFlag,
  removeListingByAdmin,
  getDisputes,
  resolveDispute,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement,
  getAuditLogs,
  getAllUsers,
  banUser,
  unbanUser,
  warnUser,
  toggleVerifyUser,
  deleteUser,
  promoteToAdmin,
  demoteAdmin,
  getKeywords,
  addKeyword,
  removeKeyword,
  getSystemConfig,
  updateSystemConfig,
  toggleFeatureFlag
};
