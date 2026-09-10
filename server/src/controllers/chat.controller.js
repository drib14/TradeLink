const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createMessage } = require('../services/message.service');

/**
 * Get or create a conversation between current user and target user
 */
const getOrCreateConversation = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user.id;
  const { targetUserId, listingId = null, wantedId = null, initialMessage = null } = req.body;

  if (!targetUserId) {
    return next(new AppError('Target user ID is required.', 400));
  }

  if (targetUserId === currentUserId) {
    return next(new AppError('You cannot create a conversation with yourself.', 400));
  }

  const targetUser = await db('users').where({ id: targetUserId }).first();
  if (!targetUser) {
    return next(new AppError('Target student user not found.', 404));
  }

  // Consistent participant ordering to ensure uniqueness
  const userA = currentUserId < targetUserId ? currentUserId : targetUserId;
  const userB = currentUserId < targetUserId ? targetUserId : currentUserId;

  let query = db('conversations').where({
    user_one_id: userA,
    user_two_id: userB
  });

  if (listingId) {
    query = query.where({ listing_id: listingId });
  } else if (wantedId) {
    query = query.where({ wanted_id: wantedId });
  } else {
    query = query.whereNull('listing_id').whereNull('wanted_id');
  }

  let conv = await query.first();
  let isNew = false;

  if (!conv) {
    const convId = uuidv4();
    const cleanInitial = (initialMessage || '').trim();
    const initialSummary = cleanInitial || 'Conversation started';

    conv = {
      id: convId,
      listing_id: listingId || null,
      wanted_id: wantedId || null,
      user_one_id: userA,
      user_two_id: userB,
      last_message: initialSummary,
      last_message_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    await db('conversations').insert(conv);
    isNew = true;

    if (cleanInitial) {
      await db('messages').insert({
        id: uuidv4(),
        conversation_id: convId,
        sender_id: currentUserId,
        receiver_id: targetUserId,
        content: cleanInitial,
        is_read: false,
        is_system_message: false,
        created_at: new Date()
      });
    }
  }

  // Fetch listing details if applicable
  let listing = null;
  let listingMedia = null;
  if (conv.listing_id) {
    listing = await db('listings').where({ id: conv.listing_id }).first();
    listingMedia = await db('listing_media')
      .where({ listing_id: conv.listing_id })
      .orderBy('display_order', 'asc')
      .first();
  }

  // Fetch wanted details if applicable
  let wanted = null;
  if (conv.wanted_id) {
    wanted = await db('wanted_requests').where({ id: conv.wanted_id }).first();
  }

  // Unread messages count
  const unreadCountRow = await db('messages')
    .where({ conversation_id: conv.id, receiver_id: currentUserId, is_read: false })
    .count('id as count')
    .first();

  const formatted = {
    id: conv.id,
    participantIds: [conv.user_one_id, conv.user_two_id],
    otherParticipant: {
      id: targetUser.id,
      name: targetUser.name,
      avatar: targetUser.avatar_url,
      campus: targetUser.campus,
      college: targetUser.college,
      isVerified: Boolean(targetUser.is_verified),
      trustScore: targetUser.trust_score || 60,
      rating: parseFloat(targetUser.rating || 5.0)
    },
    listingId: conv.listing_id || '',
    listingTitle: listing?.title || (wanted ? `[Wanted] ${wanted.item_name}` : 'Student Trade Chat'),
    listingImage: listingMedia?.media_url || '',
    listingPrice: listing ? parseFloat(listing.price || 0) : (wanted ? parseFloat(wanted.budget_range || 0) : null),
    listingTradeMode: listing?.trade_mode || 'buy_sell',
    listingStatus: listing?.status || (wanted ? wanted.status : 'active'),
    listingSellerId: listing?.seller_id || (wanted ? wanted.requester_id : ''),
    wantedId: conv.wanted_id || null,
    wantedRequest: wanted ? {
      id: wanted.id,
      itemName: wanted.item_name,
      targetBudget: parseFloat(wanted.budget_range || 0),
      category: wanted.category,
      urgency: wanted.urgency,
      campus: wanted.target_campus
    } : null,
    lastMessage: conv.last_message || '',
    lastMessageTimestamp: conv.last_message_at || conv.created_at,
    unreadCount: Number(unreadCountRow?.count || 0),
    isNew
  };

  res.status(isNew ? 201 : 200).json({
    status: 'success',
    data: { conversation: formatted }
  });
});

/**
 * Get all conversations for current user with full marketplace context
 */
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const convs = await db('conversations')
    .where('user_one_id', userId)
    .orWhere('user_two_id', userId)
    .leftJoin('listings', 'conversations.listing_id', 'listings.id')
    .leftJoin('wanted_requests', 'conversations.wanted_id', 'wanted_requests.id')
    .join('users as userA', 'conversations.user_one_id', 'userA.id')
    .join('users as userB', 'conversations.user_two_id', 'userB.id')
    .select(
      'conversations.*',
      'listings.title as listing_title',
      'listings.price as listing_price',
      'listings.trade_mode as listing_trade_mode',
      'listings.status as listing_status',
      'listings.seller_id as listing_seller_id',
      'wanted_requests.item_name as wanted_item_name',
      'wanted_requests.budget_range as wanted_budget',
      'wanted_requests.urgency as wanted_urgency',
      'wanted_requests.status as wanted_status',
      'wanted_requests.requester_id as wanted_requester_id',
      'userA.id as user_a_id',
      'userA.name as user_a_name',
      'userA.avatar_url as user_a_avatar',
      'userA.campus as user_a_campus',
      'userA.college as user_a_college',
      'userA.is_verified as user_a_verified',
      'userA.trust_score as user_a_trust',
      'userA.rating as user_a_rating',
      'userB.id as user_b_id',
      'userB.name as user_b_name',
      'userB.avatar_url as user_b_avatar',
      'userB.campus as user_b_campus',
      'userB.college as user_b_college',
      'userB.is_verified as user_b_verified',
      'userB.trust_score as user_b_trust',
      'userB.rating as user_b_rating'
    )
    .orderBy('conversations.last_message_at', 'desc');

  const convIds = convs.map((c) => c.id);
  const listingIds = [...new Set(convs.map((c) => c.listing_id).filter(Boolean))];

  // Fetch listing media in bulk
  const mediaRows = listingIds.length > 0
    ? await db('listing_media')
        .whereIn('listing_id', listingIds)
        .orderBy('display_order', 'asc')
    : [];

  // Fetch unread count for current user
  const unreadRows = convIds.length > 0
    ? await db('messages')
        .whereIn('conversation_id', convIds)
        .andWhere({ receiver_id: userId, is_read: false })
        .groupBy('conversation_id')
        .select('conversation_id')
        .count('id as unread_count')
    : [];

  const unreadMap = new Map();
  unreadRows.forEach((r) => unreadMap.set(r.conversation_id, Number(r.unread_count || 0)));

  // Bulk fetch active pending transactions
  const activeTxs = listingIds.length > 0
    ? await db('transactions')
        .whereIn('listing_id', listingIds)
        .where('status', 'pending')
        .select('id', 'reference_no', 'listing_id', 'amount', 'buyer_id', 'seller_id', 'status')
    : [];

  // Bulk fetch active swap offers
  const activeSwaps = listingIds.length > 0
    ? await db('swap_offers')
        .whereIn('listing_id', listingIds)
        .where('status', 'pending')
        .select('id', 'listing_id', 'proposer_id', 'offered_item_title', 'cash_adjustment', 'status')
    : [];

  const formatted = convs.map((c) => {
    const isUserA = c.user_one_id === userId;
    const otherUser = isUserA
      ? {
          id: c.user_b_id,
          name: c.user_b_name,
          avatar: c.user_b_avatar,
          campus: c.user_b_campus,
          college: c.user_b_college,
          isVerified: Boolean(c.user_b_verified),
          trustScore: c.user_b_trust || 60,
          rating: parseFloat(c.user_b_rating || 5.0)
        }
      : {
          id: c.user_a_id,
          name: c.user_a_name,
          avatar: c.user_a_avatar,
          campus: c.user_a_campus,
          college: c.user_a_college,
          isVerified: Boolean(c.user_a_verified),
          trustScore: c.user_a_trust || 60,
          rating: parseFloat(c.user_a_rating || 5.0)
        };

    const firstMedia = mediaRows.find((m) => m.listing_id === c.listing_id);

    // Contextual badge (active transaction or swap offer between these 2 users)
    const matchingTx = activeTxs.find(
      (t) =>
        t.listing_id === c.listing_id &&
        ((t.buyer_id === userId && t.seller_id === otherUser.id) ||
         (t.seller_id === userId && t.buyer_id === otherUser.id))
    );

    const matchingSwap = activeSwaps.find(
      (s) =>
        s.listing_id === c.listing_id &&
        (s.proposer_id === otherUser.id || s.proposer_id === userId)
    );

    let listingTitle = c.listing_title;
    if (!listingTitle && c.wanted_item_name) {
      listingTitle = `Looking For: ${c.wanted_item_name}`;
    } else if (!listingTitle) {
      listingTitle = 'Campus Trade Chat';
    }

    return {
      id: c.id,
      participantIds: [c.user_one_id, c.user_two_id],
      otherParticipant: otherUser,
      listingId: c.listing_id || '',
      listingTitle,
      listingImage: firstMedia ? firstMedia.media_url : '',
      listingPrice: c.listing_price ? parseFloat(c.listing_price) : (c.wanted_budget ? parseFloat(c.wanted_budget) : null),
      listingTradeMode: c.listing_trade_mode || (c.wanted_id ? 'wanted' : 'buy_sell'),
      listingStatus: c.listing_status || (c.wanted_status || 'active'),
      listingSellerId: c.listing_seller_id || (c.wanted_requester_id || ''),
      wantedId: c.wanted_id || null,
      activeTransaction: matchingTx ? {
        id: matchingTx.id,
        referenceNo: matchingTx.reference_no,
        amount: parseFloat(matchingTx.amount || 0),
        status: matchingTx.status
      } : null,
      activeSwap: matchingSwap ? {
        id: matchingSwap.id,
        offeredTitle: matchingSwap.offered_item_title,
        status: matchingSwap.status
      } : null,
      lastMessage: c.last_message || '',
      lastMessageTimestamp: c.last_message_at || c.created_at,
      unreadCount: unreadMap.get(c.id) || 0
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      conversations: formatted
    }
  });
});

/**
 * Get message history for a conversation with enriched transaction and swap cards
 */
const getMessages = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const conv = await db('conversations').where({ id }).first();
  if (!conv) {
    return next(new AppError('Conversation not found.', 404));
  }

  if (conv.user_one_id !== userId && conv.user_two_id !== userId && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized access to this conversation.', 403));
  }

  const messages = await db('messages')
    .where({ conversation_id: id })
    .orderBy('created_at', 'asc');

  // Mark unread messages as read
  await db('messages')
    .where({ conversation_id: id, receiver_id: userId, is_read: false })
    .update({ is_read: true });

  // Gather referenced IDs for batch population
  const swapOfferIds = [...new Set(messages.map((m) => m.swap_offer_id).filter(Boolean))];
  const txIds = [...new Set(messages.map((m) => m.transaction_id).filter(Boolean))];
  const wantedIds = [...new Set(messages.map((m) => m.wanted_request_id).filter(Boolean))];

  // Batch query swap offers
  const swapRows = swapOfferIds.length > 0
    ? await db('swap_offers')
        .whereIn('swap_offers.id', swapOfferIds)
        .leftJoin('listings as offListing', 'swap_offers.offered_listing_id', 'offListing.id')
        .select(
          'swap_offers.*',
          'offListing.title as offered_listing_title'
        )
    : [];

  // Batch query transactions
  const txRows = txIds.length > 0
    ? await db('transactions')
        .whereIn('id', txIds)
        .select('*')
    : [];

  // Batch query wanted requests
  const wantedRows = wantedIds.length > 0
    ? await db('wanted_requests')
        .whereIn('id', wantedIds)
        .select('*')
    : [];

  const swapMap = new Map();
  swapRows.forEach((s) => swapMap.set(s.id, {
    id: s.id,
    targetListingId: s.listing_id,
    proposerId: s.proposer_id,
    offeredItemTitle: s.offered_item_title,
    offeredItemDescription: s.offered_item_description,
    offeredItemImage: s.offered_item_image,
    cashAdjustment: parseFloat(s.cash_adjustment || 0),
    adjustmentType: s.adjustment_type,
    status: s.status,
    statusNote: s.status_note
  }));

  const txMap = new Map();
  txRows.forEach((t) => txMap.set(t.id, {
    id: t.id,
    referenceNo: t.reference_no,
    listingId: t.listing_id,
    buyerId: t.buyer_id,
    sellerId: t.seller_id,
    tradeMode: t.trade_mode,
    amount: parseFloat(t.amount || 0),
    paymentMethod: t.payment_method,
    paymentStatus: t.payment_status,
    status: t.status,
    notes: t.notes
  }));

  const wantedMap = new Map();
  wantedRows.forEach((w) => wantedMap.set(w.id, {
    id: w.id,
    itemName: w.item_name,
    targetBudget: parseFloat(w.budget_range || 0),
    category: w.category,
    urgency: w.urgency,
    status: w.status,
    campus: w.target_campus
  }));

  const formatted = messages.map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    receiverId: m.receiver_id,
    content: m.content,
    isRead: Boolean(m.is_read),
    mediaUrl: m.media_url || null,
    mediaType: m.media_type || null,
    timestamp: m.created_at,
    isSystemMessage: Boolean(m.is_system_message),
    swapOfferId: m.swap_offer_id,
    transactionId: m.transaction_id,
    wantedRequestId: m.wanted_request_id,
    swapOffer: m.swap_offer_id ? swapMap.get(m.swap_offer_id) || null : null,
    transaction: m.transaction_id ? txMap.get(m.transaction_id) || null : null,
    wantedRequest: m.wanted_request_id ? wantedMap.get(m.wanted_request_id) || null : null
  }));

  res.status(200).json({
    status: 'success',
    data: {
      messages: formatted
    }
  });
});

/**
 * Mark all messages in conversation as read
 */
const markConversationAsRead = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  await db('messages')
    .where({ conversation_id: id, receiver_id: userId, is_read: false })
    .update({ is_read: true });

  // Real-time socket notification if active
  const io = req.app.get('io');
  if (io) {
    io.to(`conv:${id}`).emit('chat:read', { conversationId: id, userId });
  }

  res.status(200).json({
    status: 'success',
    message: 'Conversation marked as read.'
  });
});

/**
 * Send a message via REST with Socket.io real-time broadcast
 */
const sendMessage = asyncHandler(async (req, res, next) => {
  const {
    conversationId,
    receiverId,
    content,
    isSystemMessage = false,
    swapOfferId,
    transactionId,
    wantedRequestId,
    mediaUrl,
    mediaType
  } = req.body;

  const message = await createMessage({
    conversationId,
    senderId: req.user.id,
    receiverId,
    content,
    isSystemMessage,
    swapOfferId,
    transactionId,
    wantedRequestId,
    mediaUrl,
    mediaType
  });

  // Real-time socket broadcast
  const io = req.app.get('io');
  if (io) {
    io.to(`conv:${conversationId}`).emit('chat:message', message);
    io.to(`user:${receiverId}`).emit('notification:new', {
      title: `Message from ${req.user.name}`,
      message: message.content,
      type: 'message',
      conversationId,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType
    });
  }

  res.status(201).json({
    status: 'success',
    data: { message }
  });
});

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  markConversationAsRead,
  sendMessage
};
