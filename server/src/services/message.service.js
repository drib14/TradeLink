const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Persists a message and updates conversation status in a single atomic transaction
 */
async function createMessage({
  conversationId,
  senderId,
  receiverId,
  content,
  isSystemMessage = false,
  swapOfferId = null
}) {
  const cleanContent = (content || '').trim();
  if (!cleanContent) {
    throw new AppError('Message content cannot be empty.', 400);
  }

  const conv = await db('conversations').where({ id: conversationId }).first();
  if (!conv) {
    throw new AppError('Conversation not found.', 404);
  }

  if (conv.user_one_id !== senderId && conv.user_two_id !== senderId) {
    throw new AppError('Unauthorized access to this conversation.', 403);
  }

  const msgId = uuidv4();
  const newMsg = {
    id: msgId,
    conversation_id: conversationId,
    sender_id: senderId,
    receiver_id: receiverId,
    content: cleanContent,
    is_system_message: Boolean(isSystemMessage),
    swap_offer_id: swapOfferId || null,
    created_at: new Date()
  };

  await db.transaction(async (trx) => {
    await trx('messages').insert(newMsg);
    await trx('conversations').where({ id: conversationId }).update({
      last_message: cleanContent,
      last_message_at: new Date()
    });
    // Increment recipient unread count
    await trx.raw(
      `INSERT INTO conversation_read_status (conversation_id, user_id, unread_count, last_read_at)
       VALUES (?, ?, 1, NULL)
       ON DUPLICATE KEY UPDATE unread_count = unread_count + 1`,
      [conversationId, receiverId]
    );
  });

  return {
    id: msgId,
    conversationId,
    senderId,
    receiverId,
    content: cleanContent,
    timestamp: newMsg.created_at.toISOString(),
    isSystemMessage: Boolean(isSystemMessage),
    swapOfferId: swapOfferId || null
  };
}

module.exports = {
  createMessage
};
