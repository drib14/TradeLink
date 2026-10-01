const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createMessage, encryptMessageContent, decryptMessageContent } = require('../services/message.service');

/**
 * Get or create a conversation between current user and target user
 */
const getOrCreateConversation = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user.id;
  const { targetUserId, listingId = null, flashRequestId = null, flashId = null, initialMessage = null } = req.body;
  const effectiveFlashId = flashRequestId || flashId || null;

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
  } else if (effectiveFlashId) {
    query = query.where({ flash_request_id: effectiveFlashId });
  } else {
    query = query.whereNull('listing_id').whereNull('flash_request_id');
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
      flash_request_id: effectiveFlashId || null,
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
        content: encryptMessageContent(cleanInitial),
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

  // Fetch flash details if applicable
  let flashReq = null;
  const convFlashId = conv.flash_request_id;
  if (convFlashId) {
    flashReq = await db('flash_requests').where({ id: convFlashId }).first();
  }

  // Unread messages count
  const unreadCountRow = await db('messages')
    .where({ conversation_id: conv.id, receiver_id: currentUserId, is_read: false })
    .count('id as count')
    .first();

  // Active pending transaction if applicable
  let matchingTx = null;
  if (conv.listing_id) {
    matchingTx = await db('transactions')
      .where({ listing_id: conv.listing_id, status: 'pending' })
      .where((b) => {
        b.where({ buyer_id: currentUserId, seller_id: targetUserId })
          .orWhere({ buyer_id: targetUserId, seller_id: currentUserId });
      })
      .first();
  }

  const formatted = {
    id: conv.id,
    participantIds: [conv.user_one_id, conv.user_two_id],
    otherParticipant: {
      id: targetUser.id,
      name: targetUser.name,
      avatar: targetUser.avatar_url,
      campus: targetUser.campus,
      department: targetUser.department || targetUser.college || '',
      college: targetUser.department || targetUser.college || '',
      isVerified: Boolean(targetUser.is_verified),
      trustScore: Number(targetUser.trust_score ?? 0),
      rating: parseFloat(targetUser.rating ?? 0.0)
    },
    listingId: conv.listing_id || '',
    listingTitle: listing?.title || (flashReq ? `[Flash] ${flashReq.item_name}` : 'Student Trade Chat'),
    listingImage: listingMedia?.media_url || '',
    listingPrice: listing ? parseFloat(listing.price || 0) : (flashReq ? parseFloat(flashReq.budget_range || 0) : null),
    listingTradeMode: listing?.trade_mode || (flashReq ? 'flash' : 'buy_sell'),
    listingStatus: listing?.status || (flashReq ? flashReq.status : 'active'),
    listingSellerId: listing?.seller_id || (flashReq ? flashReq.requester_id : ''),
    flashRequestId: convFlashId || null,
    flashRequest: flashReq ? {
      id: flashReq.id,
      itemName: flashReq.item_name,
      targetBudget: parseFloat(flashReq.budget_range || 0),
      category: flashReq.category,
      urgency: flashReq.urgency,
      campus: flashReq.target_campus
    } : null,
    activeTransaction: matchingTx ? {
      id: matchingTx.id,
      referenceNo: matchingTx.reference_no,
      listingId: matchingTx.listing_id,
      listingTitle: listing?.title || '',
      amount: parseFloat(matchingTx.amount || 0),
      paymentMethod: matchingTx.payment_method || 'cash',
      selectedVariation: matchingTx.selected_variation || null,
      status: matchingTx.status,
      buyerId: matchingTx.buyer_id,
      sellerId: matchingTx.seller_id,
      notes: matchingTx.notes || null,
      isBuyer: matchingTx.buyer_id === currentUserId
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
  let query = db('conversations')
    .where('user_one_id', userId)
    .orWhere('user_two_id', userId)
    .leftJoin('listings', 'conversations.listing_id', 'listings.id')
    .leftJoin('flash_requests', 'conversations.flash_request_id', 'flash_requests.id')
    .join('users as userA', 'conversations.user_one_id', 'userA.id')
    .join('users as userB', 'conversations.user_two_id', 'userB.id')
    .select(
      'conversations.*',
      'listings.title as listing_title',
      'listings.price as listing_price',
      'listings.trade_mode as listing_trade_mode',
      'listings.status as listing_status',
      'listings.seller_id as listing_seller_id',
      'flash_requests.item_name as flash_item_name',
      'flash_requests.budget_range as flash_budget',
      'flash_requests.urgency as flash_urgency',
      'flash_requests.status as flash_status',
      'flash_requests.requester_id as flash_requester_id',
      'userA.id as user_a_id',
      'userA.name as user_a_name',
      'userA.avatar_url as user_a_avatar',
      'userA.campus as user_a_campus',
      'userA.department as user_a_department',
      'userA.department as user_a_college',
      'userA.is_verified as user_a_verified',
      'userA.trust_score as user_a_trust',
      'userA.rating as user_a_rating',
      'userB.id as user_b_id',
      'userB.name as user_b_name',
      'userB.avatar_url as user_b_avatar',
      'userB.campus as user_b_campus',
      'userB.department as user_b_department',
      'userB.department as user_b_college',
      'userB.is_verified as user_b_verified',
      'userB.trust_score as user_b_trust',
      'userB.rating as user_b_rating'
    );

  const convs = await query.orderBy('conversations.last_message_at', 'desc');

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
        .select('id', 'reference_no', 'listing_id', 'amount', 'buyer_id', 'seller_id', 'status', 'payment_method', 'selected_variation', 'notes')
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
          department: c.user_b_department || c.user_b_college || '',
          college: c.user_b_department || c.user_b_college || '',
          isVerified: Boolean(c.user_b_verified),
          trustScore: Number(c.user_b_trust ?? 0),
          rating: parseFloat(c.user_b_rating ?? 0.0)
        }
      : {
          id: c.user_a_id,
          name: c.user_a_name,
          avatar: c.user_a_avatar,
          campus: c.user_a_campus,
          department: c.user_a_department || c.user_a_college || '',
          college: c.user_a_department || c.user_a_college || '',
          isVerified: Boolean(c.user_a_verified),
          trustScore: Number(c.user_a_trust ?? 0),
          rating: parseFloat(c.user_a_rating ?? 0.0)
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

    const flashTitle = c.flash_item_name;
    let listingTitle = c.listing_title;
    if (!listingTitle && flashTitle) {
      listingTitle = `[Flash] ${flashTitle}`;
    } else if (!listingTitle) {
      listingTitle = 'Campus Trade Chat';
    }

    const flashId = c.flash_request_id || null;
    const flashBudget = c.flash_budget;
    const flashStatus = c.flash_status;
    const flashRequesterId = c.flash_requester_id;

    return {
      id: c.id,
      participantIds: [c.user_one_id, c.user_two_id],
      otherParticipant: otherUser,
      listingId: c.listing_id || '',
      listingTitle,
      listingImage: firstMedia ? firstMedia.media_url : '',
      listingPrice: c.listing_price ? parseFloat(c.listing_price) : (flashBudget ? parseFloat(flashBudget) : null),
      listingTradeMode: c.listing_trade_mode || (flashId ? 'flash' : 'buy_sell'),
      listingStatus: c.listing_status || (flashStatus || 'active'),
      listingSellerId: c.listing_seller_id || (flashRequesterId || ''),
      flashRequestId: flashId,
      activeTransaction: matchingTx ? {
        id: matchingTx.id,
        referenceNo: matchingTx.reference_no,
        listingId: matchingTx.listing_id,
        listingTitle,
        amount: parseFloat(matchingTx.amount || 0),
        paymentMethod: matchingTx.payment_method || 'cash',
        selectedVariation: matchingTx.selected_variation || null,
        status: matchingTx.status,
        buyerId: matchingTx.buyer_id,
        sellerId: matchingTx.seller_id,
        notes: matchingTx.notes || null,
        isBuyer: matchingTx.buyer_id === userId
      } : null,
      activeSwap: matchingSwap ? {
        id: matchingSwap.id,
        offeredTitle: matchingSwap.offered_item_title,
        status: matchingSwap.status
      } : null,
      lastMessage: decryptMessageContent(c.last_message) || '',
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
  const flashIds = [...new Set(messages.map((m) => m.flash_request_id).filter(Boolean))];

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

  // Batch query flash requests
  const flashRows = flashIds.length > 0
    ? await db('flash_requests')
        .whereIn('id', flashIds)
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

  const flashMap = new Map();
  flashRows.forEach((w) => flashMap.set(w.id, {
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
    content: decryptMessageContent(m.content),
    isEncrypted: Boolean(m.content && m.content.startsWith('enc:v1:')),
    isRead: Boolean(m.is_read),
    mediaUrl: m.media_url || null,
    mediaType: m.media_type || null,
    timestamp: m.created_at,
    isSystemMessage: Boolean(m.is_system_message),
    swapOfferId: m.swap_offer_id,
    transactionId: m.transaction_id,
    flashRequestId: m.flash_request_id || null,
    swapOffer: m.swap_offer_id ? swapMap.get(m.swap_offer_id) || null : null,
    transaction: m.transaction_id ? txMap.get(m.transaction_id) || null : null,
    flashRequest: m.flash_request_id ? flashMap.get(m.flash_request_id) || null : null
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
    flashRequestId,
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
    flashRequestId: flashRequestId || null,
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
