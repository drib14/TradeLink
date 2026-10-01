const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

function escapeLike(str) {
  return str.replace(/[%_]/g, '\\$&');
}

async function getFlashTableName() {
  return 'flash_requests';
}

/**
 * Get flash market requests with filters
 */
const getFlashRequests = asyncHandler(async (req, res) => {
  const { campus, category, urgency, search, status } = req.query;
  const table = await getFlashTableName();

  let query = db(table)
    .join('users as requester', `${table}.requester_id`, 'requester.id')
    .select(
      `${table}.*`,
      `${table}.item_name as item_title`,
      `${table}.target_campus as preferred_campus`,
      `${table}.budget_range as target_budget`,
      `${table}.notes as description`,
      'requester.name as requester_name',
      'requester.avatar_url as requester_avatar',
      'requester.campus as requester_campus',
      'requester.department as requester_department',
      'requester.department as requester_college'
    );

  if (status && status !== 'All') {
    query = query.where(`${table}.status`, status);
  } else {
    // Return open, expired, and fulfilled cards so expired requests are NOT deleted or hidden
    query = query.whereIn(`${table}.status`, ['open', 'expired', 'fulfilled']);
  }

  if (campus && campus !== 'All') {
    query = query.where(`${table}.target_campus`, campus);
  }

  if (category && category !== 'All') {
    const escapedCat = escapeLike(category.trim());
    query = query.where(`${table}.category`, 'like', `%${escapedCat}%`);
  }

  if (urgency && urgency !== 'All') {
    query = query.where(`${table}.urgency`, urgency);
  }

  if (search && search.trim()) {
    const escapedSearch = escapeLike(search.trim());
    query = query.where((builder) => {
      builder.where(`${table}.item_name`, 'like', `%${escapedSearch}%`)
             .orWhere(`${table}.notes`, 'like', `%${escapedSearch}%`);
    });
  }

  const requests = await query.orderBy(`${table}.created_at`, 'desc');
  const now = new Date();

  const formatted = requests.map((r) => {
    let budgetNum = parseFloat(r.target_budget || r.budget_range || 0);
    if (isNaN(budgetNum)) budgetNum = 0;

    const isPastExpiration = r.expires_at ? new Date(r.expires_at) < now : false;
    const isExpired = r.status === 'expired' || (r.status === 'open' && isPastExpiration);
    const effectiveStatus = isExpired ? 'expired' : r.status;

    return {
      id: r.id,
      requesterId: r.requester_id,
      requesterName: r.requester_name,
      requesterAvatar: r.requester_avatar,
      requesterCampus: r.requester_campus,
      requesterCollege: r.requester_college,
      itemTitle: r.item_title || r.item_name || 'Flash Request Item',
      itemName: r.item_name || r.item_title || 'Flash Request Item',
      category: r.category,
      targetBudget: budgetNum,
      urgency: r.urgency || 'flexible',
      durationHours: r.duration_hours || 24,
      expiresAt: r.expires_at || null,
      isExpired,
      description: r.description || r.notes || '',
      notes: r.notes || r.description || '',
      preferredCampus: r.preferred_campus || r.target_campus || 'UC Main',
      imageUrl: r.image_url || null,
      image_url: r.image_url || null,
      status: effectiveStatus,
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
 * Create a flash market request
 */
const createFlashRequest = asyncHandler(async (req, res, next) => {
  const {
    itemTitle,
    itemName,
    category,
    targetBudget,
    budgetRange,
    urgency = 'flexible',
    durationHours,
    description,
    notes,
    preferredCampus,
    targetCampus,
    imageUrl,
    image_url
  } = req.body;

  const title = (itemTitle || itemName || '').trim();
  if (!title || !category) {
    return next(new AppError('Item title and category are required.', 400));
  }

  let hours = parseInt(durationHours, 10);
  if (isNaN(hours) || hours <= 0) {
    if (urgency === 'immediate' || urgency === 'Immediate / Urgent') {
      hours = 24;
    } else if (urgency === 'this_week' || urgency === 'This Week') {
      hours = 72;
    } else {
      hours = 168;
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + hours * 3600 * 1000);

  const table = await getFlashTableName();
  const reqId = uuidv4();
  const newReq = {
    id: reqId,
    requester_id: req.user.id,
    item_name: title,
    category,
    target_campus: preferredCampus || targetCampus || req.user.campus || 'UC Main',
    urgency,
    budget_range: String(targetBudget || budgetRange || '0.00'),
    notes: (description || notes || '').trim(),
    image_url: imageUrl || image_url || null,
    duration_hours: hours,
    expires_at: expiresAt,
    status: 'open',
    offers_count: 0
  };

  await db(table).insert(newReq);

  res.status(201).json({
    status: 'success',
    message: 'Flash Market request posted to campus board.',
    data: {
      request: {
        id: reqId,
        requesterId: req.user.id,
        requesterName: req.user.name,
        requesterAvatar: req.user.avatar_url,
        requesterCampus: req.user.campus,
        requesterCollege: req.user.college,
        itemTitle: title,
        itemName: title,
        category,
        targetBudget: parseFloat(targetBudget || budgetRange || 0),
        urgency,
        durationHours: hours,
        expiresAt: expiresAt.toISOString(),
        imageUrl: newReq.image_url,
        image_url: newReq.image_url,
        isExpired: false,
        description: (description || notes || '').trim(),
        preferredCampus: newReq.target_campus,
        targetCampus: newReq.target_campus,
        status: 'open',
        offersCount: 0,
        createdAt: now.toISOString()
      }
    }
  });
});

/**
 * Respond to flash market request: increments offers count and connects to chat thread
 */
const respondToFlashRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { offerMessage } = req.body;
  const currentUserId = req.user.id;
  const table = await getFlashTableName();

  const target = await db(table).where({ id }).first();
  if (!target) {
    return next(new AppError('Flash Market request not found.', 404));
  }

  if (target.requester_id === currentUserId) {
    return next(new AppError('You cannot offer an item to your own request.', 400));
  }

  const now = new Date();
  const isPastExpiration = target.expires_at ? new Date(target.expires_at) < now : false;
  if (target.status === 'expired' || isPastExpiration) {
    return next(new AppError('This flash request has expired and is no longer accepting offers.', 400));
  }

  await db(table).where({ id }).increment('offers_count', 1);

  // Connect to conversation thread
  const userA = currentUserId < target.requester_id ? currentUserId : target.requester_id;
  const userB = currentUserId < target.requester_id ? target.requester_id : currentUserId;

  let conv = await db('conversations').where({
    user_one_id: userA,
    user_two_id: userB,
    flash_request_id: target.id
  }).first();

  const initialContent = (offerMessage || '').trim() ||
    `Flash Market Offer: Hi! I have "${target.item_name}" available on campus for your target budget of ₱${target.budget_range || '0'}. Let's coordinate meetup details here!`;

  if (!conv) {
    const convId = uuidv4();
    conv = {
      id: convId,
      listing_id: null,
      flash_request_id: target.id,
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
    flash_request_id: target.id,
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
      flashRequestId: target.id,
      flashRequest: {
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
      message: `Someone responded to your Flash Request: "${target.item_name}"!`,
      type: 'flash_offer',
      conversationId: conv.id
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Offer sent! Conversation started in Campus Chat.',
    data: {
      conversationId: conv.id
    }
  });
});

/**
 * Mark flash market request as fulfilled
 */
const fulfillFlashRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const table = await getFlashTableName();
  const target = await db(table).where({ id }).first();

  if (!target) {
    return next(new AppError('Flash Market request not found.', 404));
  }

  if (target.requester_id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized.', 403));
  }

  await db(table).where({ id }).update({ status: 'fulfilled' });

  res.status(200).json({
    status: 'success',
    message: 'Flash Market request marked as fulfilled.'
  });
});

/**
 * Delete flash market request
 */
const deleteFlashRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const table = await getFlashTableName();
  const target = await db(table).where({ id }).first();

  if (!target) {
    return next(new AppError('Flash Market request not found.', 404));
  }

  if (target.requester_id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized.', 403));
  }

  await db(table).where({ id }).del();

  res.status(200).json({
    status: 'success',
    message: 'Flash Market request removed.'
  });
});

module.exports = {
  getFlashRequests,
  createFlashRequest,
  respondToFlashRequest,
  fulfillFlashRequest,
  deleteFlashRequest
};
