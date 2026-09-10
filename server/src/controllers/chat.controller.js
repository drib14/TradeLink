const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createMessage } = require('../services/message.service');

/**
 * Get all conversations for current user
 */
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const convs = await db('conversations')
    .where('user_one_id', userId)
    .orWhere('user_two_id', userId)
    .leftJoin('listings', 'conversations.listing_id', 'listings.id')
    .join('users as userA', 'conversations.user_one_id', 'userA.id')
    .join('users as userB', 'conversations.user_two_id', 'userB.id')
    .select(
      'conversations.*',
      'listings.title as listing_title',
      'userA.id as user_a_id',
      'userA.name as user_a_name',
      'userA.avatar_url as user_a_avatar',
      'userA.campus as user_a_campus',
      'userA.is_verified as user_a_verified',
      'userB.id as user_b_id',
      'userB.name as user_b_name',
      'userB.avatar_url as user_b_avatar',
      'userB.campus as user_b_campus',
      'userB.is_verified as user_b_verified'
    )
    .orderBy('conversations.last_message_at', 'desc');

  const convIds = convs.map((c) => c.id);
  const listingIds = [...new Set(convs.map((c) => c.listing_id).filter(Boolean))];

  // Fetch listing media
  const mediaRows = listingIds.length > 0
    ? await db('listing_media').whereIn('listing_id', listingIds).orderBy('display_order', 'asc')
    : [];

  // Fetch unread count directly from messages
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

  const formatted = convs.map((c) => {
    const isUserA = c.user_one_id === userId;
    const otherUser = isUserA
      ? {
          id: c.user_b_id,
          name: c.user_b_name,
          avatar: c.user_b_avatar,
          campus: c.user_b_campus,
          isVerified: Boolean(c.user_b_verified)
        }
      : {
          id: c.user_a_id,
          name: c.user_a_name,
          avatar: c.user_a_avatar,
          campus: c.user_a_campus,
          isVerified: Boolean(c.user_a_verified)
        };

    const firstMedia = mediaRows.find((m) => m.listing_id === c.listing_id);

    return {
      id: c.id,
      participantIds: [c.user_one_id, c.user_two_id],
      otherParticipant: otherUser,
      listingId: c.listing_id || '',
      listingTitle: c.listing_title || 'Campus Item',
      listingImage: firstMedia ? firstMedia.media_url : '',
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
 * Get message history for a conversation
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

  // Mark unread messages as read directly
  await db('messages')
    .where({ conversation_id: id, receiver_id: userId, is_read: false })
    .update({ is_read: true });

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
    transactionId: m.transaction_id
  }));

  res.status(200).json({
    status: 'success',
    data: {
      messages: formatted
    }
  });
});

/**
 * Send a message via REST
 */
const sendMessage = asyncHandler(async (req, res, next) => {
  const {
    conversationId,
    receiverId,
    content,
    isSystemMessage = false,
    swapOfferId,
    transactionId,
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
    mediaUrl,
    mediaType
  });

  res.status(201).json({
    status: 'success',
    data: { message }
  });
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage
};
