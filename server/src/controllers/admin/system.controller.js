const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { logAdminAction } = require('./verification.controller');

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
      totalUsers: Number(totalUsers.count || 0),
      totalListings: Number(totalListings.count || 0),
      completedTrades: Number(completedTrades.count || 0),
      pendingVerifications: Number(pendingVerifications.count || 0),
      pendingFlags: Number(pendingFlags.count || 0),
      pendingDisputes: Number(pendingDisputes.count || 0)
    }
  });
});

/**
 * Get audit logs (with pagination)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  const logs = await db('admin_audit_logs')
    .orderBy('created_at', 'desc')
    .limit(parsedLimit)
    .offset(offset);

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
    data: {
      auditLogs: formatted,
      page: parsedPage,
      limit: parsedLimit
    }
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
    id: `kw_${uuidv4()}`,
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
 * Update system config (Admin)
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
 * Toggle feature flag (Admin)
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
  getAuditLogs,
  getKeywords,
  addKeyword,
  removeKeyword,
  getSystemConfig,
  updateSystemConfig,
  toggleFeatureFlag
};
