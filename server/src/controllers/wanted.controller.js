const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

function escapeLike(str) {
  return str.replace(/[%_]/g, '\\$&');
}

/**
 * Get wanted requests with filters
 */
const getWantedRequests = asyncHandler(async (req, res) => {
  const { campus, category } = req.query;

  let query = db('wanted_requests')
    .join('users as requester', 'wanted_requests.requester_id', 'requester.id')
    .select(
      'wanted_requests.*',
      'wanted_requests.item_name as item_title',
      'wanted_requests.target_campus as preferred_campus',
      'wanted_requests.budget_range as target_budget',
      'wanted_requests.notes as description',
      'requester.name as requester_name',
      'requester.avatar_url as requester_avatar',
      'requester.campus as requester_campus',
      'requester.college as requester_college'
    )
    .where({ 'wanted_requests.status': 'open' })
    .orderBy('wanted_requests.created_at', 'desc');

  if (campus && campus !== 'All') {
    query = query.where('wanted_requests.target_campus', campus);
  }

  if (category && category !== 'All') {
    const escapedCat = escapeLike(category.trim());
    query = query.where('wanted_requests.category', 'like', `%${escapedCat}%`);
  }

  const requests = await query;

  const formatted = requests.map((r) => {
    let budgetNum = parseFloat(r.target_budget || r.budget_range || 0);
    if (isNaN(budgetNum)) budgetNum = 0;

    return {
      id: r.id,
      requesterId: r.requester_id,
      requesterName: r.requester_name,
      requesterAvatar: r.requester_avatar,
      requesterCampus: r.requester_campus,
      requesterCollege: r.requester_college,
      itemTitle: r.item_title || r.item_name || 'Wanted Item',
      category: r.category,
      targetBudget: budgetNum,
      urgency: r.urgency || 'Flexible',
      description: r.description || r.notes || '',
      preferredCampus: r.preferred_campus || r.target_campus || 'UC Main',
      status: r.status,
      offersCount: Number(r.offers_count || 0),
      createdAt: r.created_at
    };
  });

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
    urgency = 'Flexible',
    description,
    preferredCampus
  } = req.body;

  const reqId = uuidv4();
  const newReq = {
    id: reqId,
    requester_id: req.user.id,
    item_name: (itemTitle || '').trim(),
    category,
    target_campus: preferredCampus || req.user.campus || 'UC Main',
    urgency,
    budget_range: String(targetBudget || '0.00'),
    notes: (description || '').trim(),
    status: 'open',
    offers_count: 0
  };

  await db('wanted_requests').insert(newReq);

  res.status(201).json({
    status: 'success',
    message: 'Wanted request posted to campus board.',
    data: {
      request: {
        id: reqId,
        requesterId: req.user.id,
        requesterName: req.user.name,
        requesterAvatar: req.user.avatar_url,
        requesterCampus: req.user.campus,
        requesterCollege: req.user.college,
        itemTitle: (itemTitle || '').trim(),
        category,
        targetBudget: parseFloat(targetBudget || 0),
        urgency,
        description: (description || '').trim(),
        preferredCampus: preferredCampus || req.user.campus || 'UC Main',
        status: 'open',
        offersCount: 0,
        createdAt: new Date().toISOString()
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

  if (target.requester_id !== req.user.id && req.user.role !== 'admin') {
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

  if (target.requester_id !== req.user.id && req.user.role !== 'admin') {
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
