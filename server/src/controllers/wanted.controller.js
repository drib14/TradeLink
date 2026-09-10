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
      offersCount: r.offers_count || 0,
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
 * Create a wanted request
 */
const createWantedRequest = asyncHandler(async (req, res, next) => {
  const {
    itemTitle,
    category,
    targetBudget,
    urgency = 'flexible',
    description,
    preferredCampus
  } = req.body;

  if (!itemTitle || !category) {
    return next(new AppError('Item title and category are required.', 400));
  }

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
 * Respond to wanted request: increments offers count and connects to chat thread
 */
const respondToWanted = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { offerMessage } = req.body;
  const currentUserId = req.user.id;

  const target = await db('wanted_requests').where({ id }).first();
  if (!target) {
    return next(new AppError('Wanted request not found.', 404));
  }

  if (target.requester_id === currentUserId) {
    return next(new AppError('You cannot offer an item to your own request.', 400));
  }

  await db('wanted_requests').where({ id }).increment('offers_count', 1);

  // Connect to conversation thread
  const userA = currentUserId < target.requester_id ? currentUserId : target.requester_id;
  const userB = currentUserId < target.requester_id ? target.requester_id : currentUserId;

  let conv = await db('conversations').where({
    user_one_id: userA,
    user_two_id: userB,
    wanted_id: target.id
  }).first();

  const initialContent = (offerMessage || '').trim() ||
    `📢 Wanted Item Offer: Hi! I have "${target.item_name}" available on campus for your target budget of ₱${target.budget_range || '0'}. Let's coordinate meetup details here!`;

  if (!conv) {
    const convId = uuidv4();
    conv = {
      id: convId,
      listing_id: null,
      wanted_id: target.id,
      user_one_id: userA,
      user_two_id: userB,
      last_message: initialContent,
      last_message_at: new Date()
    };
    await db('conversations').insert(conv);
  } else {
    await db('conversations').where({ id: conv.id }).update({
      last_message: initialContent,
      last_message_at: new Date()
    });
  }

  const msgId = uuidv4();
  const newMsg = {
    id: msgId,
    conversation_id: conv.id,
    sender_id: currentUserId,
    receiver_id: target.requester_id,
    content: initialContent,
    is_read: false,
    is_system_message: false,
    wanted_request_id: target.id,
    created_at: new Date()
  };
  await db('messages').insert(newMsg);

  // Real-time socket broadcast
  const io = req.app.get('io');
  if (io) {
    io.to(`conv:${conv.id}`).emit('chat:message', {
      ...newMsg,
      conversationId: conv.id,
      senderId: newMsg.sender_id,
      receiverId: newMsg.receiver_id,
      wantedRequestId: target.id,
      wantedRequest: {
        id: target.id,
        itemName: target.item_name,
        targetBudget: parseFloat(target.budget_range || 0),
        category: target.category,
        urgency: target.urgency,
        campus: target.target_campus
      },
      timestamp: newMsg.created_at.toISOString()
    });

    io.to(`user:${target.requester_id}`).emit('notification:new', {
      title: `Offer received from ${req.user.name}`,
      message: `Someone offered your requested item: "${target.item_name}"!`,
      type: 'wanted_offer',
      conversationId: conv.id
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Offer sent to student! Conversation started in Campus Chat.',
    data: {
      conversationId: conv.id
    }
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

  await db('wanted_requests').where({ id }).del();

  res.status(200).json({
    status: 'success',
    message: 'Wanted request removed.'
  });
});

module.exports = {
  getWantedRequests,
  createWantedRequest,
  respondToWanted,
  fulfillWanted,
  deleteWanted
};
