const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get wanted requests with filters
 */
const getWantedRequests = asyncHandler(async (req, res) => {
  const { campus, category } = req.query;

  let query = db('wanted_requests')
    .join('users as requester', 'wanted_requests.requester_id', 'requester.id')
    .select(
      'wanted_requests.*',
      'requester.name as requester_name',
      'requester.avatar_url as requester_avatar',
      'requester.campus as requester_campus',
      'requester.college as requester_college'
    )
    .where({ 'wanted_requests.status': 'open' })
    .orderBy('wanted_requests.created_at', 'desc');

  if (campus && campus !== 'All') {
    query = query.where('wanted_requests.preferred_campus', campus);
  }

  if (category && category !== 'All') {
    query = query.where('wanted_requests.category', 'like', `%${category}%`);
  }

  const requests = await query;

  const formatted = requests.map((r) => ({
    id: r.id,
    requesterId: r.requester_id,
    requesterName: r.requester_name,
    requesterAvatar: r.requester_avatar,
    requesterCampus: r.requester_campus,
    requesterCollege: r.requester_college,
    itemTitle: r.item_title,
    category: r.category,
    targetBudget: parseFloat(r.target_budget),
    urgency: r.urgency,
    description: r.description,
    preferredCampus: r.preferred_campus,
    status: r.status,
    offersCount: r.offers_count,
    createdAt: r.created_at
  }));

  res.status(200).json({
    status: 'success',
    data: {
      requests: formatted
    }
  });
});

/**
 * Create a new wanted request
 */
const createWantedRequest = asyncHandler(async (req, res) => {
  const {
    itemTitle,
    category,
    targetBudget = 0,
    urgency,
    description,
    preferredCampus
  } = req.body;

  const reqId = `req-${Date.now()}`;
  const newReq = {
    id: reqId,
    requester_id: req.user.id,
    item_title: itemTitle.trim(),
    category,
    target_budget: targetBudget,
    urgency,
    description: description.trim(),
    preferred_campus: preferredCampus,
    status: 'open',
    offers_count: 0
  };

  await db('wanted_requests').insert(newReq);

  res.status(201).json({
    status: 'success',
    message: 'Wanted request posted to campus board.',
    data: {
      request: {
        ...newReq,
        requesterName: req.user.name,
        requesterAvatar: req.user.avatar_url,
        requesterCampus: req.user.campus,
        requesterCollege: req.user.college
      }
    }
  });
});

/**
 * Increment offers count on wanted request
 */
const respondToWanted = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const target = await db('wanted_requests').where({ id }).first();

  if (!target) {
    return next(new AppError('Wanted request not found.', 404));
  }

  await db('wanted_requests').where({ id }).increment('offers_count', 1);

  // Notify requester
  await db('notifications').insert({
    id: `notif-${Date.now()}`,
    user_id: target.requester_id,
    title: 'New Response on Wanted Board',
    message: `${req.user.name} offered an item for your request "${target.item_title}".`,
    type: 'wanted_response',
    link_view: 'wanted',
    link_params: JSON.stringify({ requestId: id })
  });

  res.status(200).json({
    status: 'success',
    message: 'Response recorded. Student notified.'
  });
});

/**
 * Mark wanted request as fulfilled
 */
const fulfillWanted = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const target = await db('wanted_requests').where({ id }).first();

  if (!target) {
    return next(new AppError('Wanted request not found.', 404));
  }

  if (target.requester_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Unauthorized.', 403));
  }

  await db('wanted_requests').where({ id }).update({ status: 'fulfilled' });

  res.status(200).json({
    status: 'success',
    message: 'Wanted request marked as fulfilled.'
  });
});

/**
 * Delete wanted request
 */
const deleteWanted = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const target = await db('wanted_requests').where({ id }).first();

  if (!target) {
    return next(new AppError('Wanted request not found.', 404));
  }

  if (target.requester_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Unauthorized.', 403));
  }

  await db('wanted_requests').where({ id }).delete();

  res.status(200).json({
    status: 'success',
    message: 'Wanted request deleted.'
  });
});

module.exports = {
  getWantedRequests,
  createWantedRequest,
  respondToWanted,
  fulfillWanted,
  deleteWanted
};
