const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { logAdminAction } = require('./verification.controller');
const emailService = require('../../services/email.service');

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
    db('transactions').where({ status: 'completed' }).count('id as count').first(),
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
 * Get comprehensive dynamic analytics & time-series graph datasets
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  // Generate 6-month timeline array
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      volume: 0,
      trades: 0,
      newListings: 0,
      newUsers: 0
    });
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // 1. KPI Counts
  const [
    totalUsersCount,
    verifiedUsersCount,
    activeListingsCount,
    completedTradesCount,
    totalVolumeSum,
    activeInventoryValueSum,
    pendingVerifsCount,
    pendingFlagsCount,
    pendingDisputesCount
  ] = await Promise.all([
    db('users').count('id as count').first(),
    db('users').where({ is_verified: true }).count('id as count').first(),
    db('listings').whereNot({ status: 'sold' }).count('id as count').first(),
    db('transactions').where({ status: 'completed' }).count('id as count').first(),
    db('transactions').where({ status: 'completed' }).sum('amount as total').first(),
    db('listings').whereNot({ status: 'sold' }).sum(db.raw('price * COALESCE(quantity, 1) as total')).first(),
    db('verification_requests').where({ status: 'pending' }).count('id as count').first(),
    db('flagged_listings').where({ status: 'pending' }).count('id as count').first(),
    db('trade_disputes').where({ status: 'pending' }).count('id as count').first()
  ]);

  // 2. Time-series data
  // Query completed transactions in past 6 months
  const recentTransactions = await db('transactions')
    .where('status', 'completed')
    .andWhere('created_at', '>=', sixMonthsAgo)
    .select('amount', 'created_at', 'completed_at');

  recentTransactions.forEach((tx) => {
    const d = new Date(tx.completed_at || tx.created_at);
    const m = months.find((m) => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
    if (m) {
      m.volume += Number(tx.amount) || 0;
      m.trades += 1;
    }
  });

  // Query new listings in past 6 months
  const recentListings = await db('listings')
    .where('created_at', '>=', sixMonthsAgo)
    .select('id', 'price', 'created_at');

  recentListings.forEach((l) => {
    const d = new Date(l.created_at);
    const m = months.find((m) => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
    if (m) {
      m.newListings += 1;
    }
  });

  // Query new users in past 6 months
  const recentUsers = await db('users')
    .where('created_at', '>=', sixMonthsAgo)
    .select('id', 'created_at');

  recentUsers.forEach((u) => {
    const d = new Date(u.created_at);
    const m = months.find((m) => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
    if (m) {
      m.newUsers += 1;
    }
  });

  // 3. Campus distribution
  const officialCampuses = [
    'UC Main',
    'UC Banilad',
    'UC LM',
    'UC METC',
    'UC PRI',
    'UC Pardo-Talisay',
    'UC South Campus',
    'UC Medical Center'
  ];

  const campusUsers = await db('users')
    .select('campus')
    .count('id as users')
    .count(db.raw('CASE WHEN is_verified = 1 THEN 1 END as verifiedUsers'))
    .groupBy('campus');

  const campusListings = await db('listings')
    .whereNot({ status: 'sold' })
    .select('campus')
    .count('id as listings')
    .sum(db.raw('price * COALESCE(quantity, 1) as inventoryValue'))
    .groupBy('campus');

  const campusDistribution = officialCampuses.map((campusName) => {
    const uMatch = campusUsers.find((c) => (c.campus || '').toLowerCase() === campusName.toLowerCase());
    const lMatch = campusListings.find((c) => (c.campus || '').toLowerCase() === campusName.toLowerCase());

    const totalStudents = Number(uMatch?.users || 0);
    const verified = Number(uMatch?.verifiedUsers || 0);
    const rate = totalStudents > 0 ? Math.round((verified / totalStudents) * 100) : 0;
    const activeItems = Number(lMatch?.listings || 0);
    const inventoryVal = Math.round(Number(lMatch?.inventoryValue || 0));

    return {
      campus: campusName,
      users: totalStudents,
      verifiedUsers: verified,
      verifiedRate: rate,
      listings: activeItems,
      inventoryValue: inventoryVal
    };
  });

  // 4. Category breakdown
  const categoryStats = await db('listings')
    .select('category')
    .count('id as total')
    .count(db.raw("CASE WHEN status != 'sold' THEN 1 END as active"))
    .count(db.raw("CASE WHEN status = 'sold' THEN 1 END as sold"))
    .avg('price as avgPrice')
    .groupBy('category')
    .orderBy('total', 'desc');

  const categoryDistribution = categoryStats.map((c) => ({
    category: c.category || 'General',
    total: Number(c.total || 0),
    active: Number(c.active || 0),
    sold: Number(c.sold || 0),
    avgPrice: Math.round(Number(c.avgPrice || 0))
  }));

  res.status(200).json({
    status: 'success',
    data: {
      kpi: {
        totalUsers: Number(totalUsersCount?.count || 0),
        verifiedUsers: Number(verifiedUsersCount?.count || 0),
        activeListings: Number(activeListingsCount?.count || 0),
        completedTrades: Number(completedTradesCount?.count || 0),
        totalVolume: Math.round(Number(totalVolumeSum?.total || 0)),
        grossInventoryValue: Math.round(Number(activeInventoryValueSum?.total || 0)),
        pendingVerifications: Number(pendingVerifsCount?.count || 0),
        pendingFlags: Number(pendingFlagsCount?.count || 0),
        pendingDisputes: Number(pendingDisputesCount?.count || 0)
      },
      monthlyTimeline: months.map((m) => ({
        label: m.label,
        year: m.year,
        volume: Math.round(m.volume),
        trades: m.trades,
        newListings: m.newListings,
        newUsers: m.newUsers
      })),
      campusDistribution,
      categoryDistribution
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

  const ALLOWED_CONFIG_KEYS = [
    'maintenanceMode',
    'maxListingPrice',
    'maxImagesPerListing',
    'swapModeEnabled',
    'flashMarketEnabled',
    'wantedBoardEnabled',
    'freeDonationEnabled',
    'maxListingsPerUser'
  ];

  const safeUpdates = {};
  for (const key of ALLOWED_CONFIG_KEYS) {
    if (req.body[key] !== undefined) {
      safeUpdates[key] = req.body[key];
    }
  }

  const merged = {
    ...currentVal,
    ...safeUpdates
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
  let flag = await db('feature_flags').where({ id }).first();

  if (!flag) {
    flag = await db('feature_flags')
      .where('name', 'like', `%${id.replace(/_/g, ' ')}%`)
      .first();
  }

  if (!flag) {
    return next(new AppError('Feature flag not found.', 404));
  }

  const newEnabled = !flag.enabled;
  await db('feature_flags').where({ id: flag.id }).update({ enabled: newEnabled });
  await logAdminAction(req.user, 'Toggled Feature Flag', 'system', flag.id, `Toggled ${flag.name} to ${newEnabled}`, req);

  res.status(200).json({
    status: 'success',
    message: `Feature flag "${flag.name}" updated.`,
    data: {
      id: flag.id,
      enabled: Boolean(newEnabled)
    }
  });
});

/**
 * Test email service configuration & live dispatch diagnostics (Admin only)
 */
const testEmail = asyncHandler(async (req, res) => {
  const recipient = req.body?.to || req.query?.to || req.user?.email;
  const result = await emailService.testEmailConnection(recipient);

  res.status(200).json({
    status: 'success',
    message: (result.smtpVerification?.ok || result.testSendResult?.ok) 
      ? 'Email service verified successfully.' 
      : 'Email service diagnostic executed. Check details for troubleshooting.',
    data: result
  });
});

module.exports = {
  getStats,
  getAnalytics,
  getAuditLogs,
  getKeywords,
  addKeyword,
  removeKeyword,
  getSystemConfig,
  updateSystemConfig,
  toggleFeatureFlag,
  testEmail
};
