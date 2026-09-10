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
  swapOfferId = null,
  transactionId = null,
  wantedRequestId = null,
  mediaUrl = null,
  mediaType = null
}) {
  const cleanContent = (content || '').trim();
  if (!cleanContent && !mediaUrl) {
    throw new AppError('Message must contain either text content or media.', 400);
  }

  const conv = await db('conversations').where({ id: conversationId }).first();
  if (!conv) {
    throw new AppError('Conversation not found.', 404);
  }

  if (conv.user_one_id !== senderId && conv.user_two_id !== senderId) {
    throw new AppError('Unauthorized access to this conversation.', 403);
  }

  const msgId = uuidv4();
  const summaryContent = cleanContent || (mediaType === 'video' ? '📹 Video attachment' : '📷 Image attachment');

  const newMsg = {
    id: msgId,
    conversation_id: conversationId,
    sender_id: senderId,
    receiver_id: receiverId,
    content: summaryContent,
    is_read: false,
    is_system_message: Boolean(isSystemMessage),
    media_url: mediaUrl || null,
    media_type: mediaType || null,
    swap_offer_id: swapOfferId || null,
    transaction_id: transactionId || null,
    wanted_request_id: wantedRequestId || null,
    created_at: new Date()
  };

  await db.transaction(async (trx) => {
    await trx('messages').insert(newMsg);
    await trx('conversations').where({ id: conversationId }).update({
      last_message: summaryContent,
      last_message_at: new Date()
    });
  });

  // Fetch optional enriched card data
  let swapOffer = null;
  if (swapOfferId) {
    swapOffer = await db('swap_offers').where({ id: swapOfferId }).first();
  }

  let transaction = null;
  if (transactionId) {
    transaction = await db('transactions').where({ id: transactionId }).first();
  }

  let wantedRequest = null;
  if (wantedRequestId) {
    wantedRequest = await db('wanted_requests').where({ id: wantedRequestId }).first();
  }

  return {
    id: msgId,
    conversationId,
    senderId,
    receiverId,
    content: summaryContent,
    isRead: false,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    timestamp: newMsg.created_at.toISOString(),
    isSystemMessage: Boolean(isSystemMessage),
    swapOfferId: swapOfferId || null,
    transactionId: transactionId || null,
    wantedRequestId: wantedRequestId || null,
    swapOffer,
    transaction,
    wantedRequest
  };
}

module.exports = {
  createMessage
};
