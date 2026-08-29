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
    .where('participant_a', userId)
    .orWhere('participant_b', userId)
    .join('listings', 'conversations.listing_id', 'listings.id')
    .join('users as userA', 'conversations.participant_a', 'userA.id')
    .join('users as userB', 'conversations.participant_b', 'userB.id')
    .leftJoin('conversation_read_status as readStatus', function() {
      this.on('conversations.id', '=', 'readStatus.conversation_id')
        .andOn('readStatus.user_id', '=', db.raw('?', [userId]));
    })
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
      'userB.is_verified as user_b_verified',
      'readStatus.unread_count'
    )
    .orderBy('conversations.last_message_at', 'desc');

  // Fetch listing images with a single query
  const listingIds = [...new Set(convs.map((c) => c.listing_id))];
  const images = listingIds.length > 0
    ? await db('listing_images').whereIn('listing_id', listingIds).where('sort_order', 0)
    : [];

  const formatted = convs.map((c) => {
    const isUserA = c.participant_a === userId;
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

    return {
      id: c.id,
      participantIds: [c.participant_a, c.participant_b],
      otherParticipant: otherUser,
      listingId: c.listing_id,
      listingTitle: c.listing_title,
      listingImage: images.find((i) => i.listing_id === c.listing_id)?.image_url || '',
      lastMessage: c.last_message,
      lastMessageTimestamp: c.last_message_at,
      unreadCount: c.unread_count || 0
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

  if (conv.participant_a !== userId && conv.participant_b !== userId) {
    return next(new AppError('Unauthorized access to this conversation.', 403));
  }

  const messages = await db('messages')
    .where({ conversation_id: id })
    .orderBy('created_at', 'asc');

  // Mark unread count as 0
  await db('conversation_read_status')
    .insert({
      conversation_id: id,
      user_id: userId,
      unread_count: 0,
      last_read_at: new Date()
    })
    .onConflict(['conversation_id', 'user_id'])
    .merge({
      unread_count: 0,
      last_read_at: new Date()
    });

  const formatted = messages.map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    receiverId: m.receiver_id,
    content: m.content,
    timestamp: m.created_at,
    isSystemMessage: Boolean(m.is_system_message),
    swapOfferId: m.swap_offer_id
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
  const { conversationId, receiverId, content, isSystemMessage = false, swapOfferId } = req.body;

  const message = await createMessage({
    conversationId,
    senderId: req.user.id,
    receiverId,
    content,
    isSystemMessage,
    swapOfferId
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
