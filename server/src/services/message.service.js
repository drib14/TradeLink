const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');

// Helper to determine flash table name
let _flashTable = null;
async function getFlashTable() {
  if (_flashTable) return _flashTable;
  try {
    const hasFlash = await db.schema.hasTable('flash_requests');
    _flashTable = hasFlash ? 'flash_requests' : 'wanted_requests';
  } catch (e) {
    _flashTable = 'flash_requests';
  }
  return _flashTable;
}

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
  flashRequestId = null,
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

  const effectiveFlashId = flashRequestId || wantedRequestId || null;
  const msgId = uuidv4();
  const summaryContent = cleanContent || (mediaType === 'video' ? '[Video Attachment]' : '[Image Attachment]');

  // Check column name in messages table
  const hasFlashCol = await db.schema.hasColumn('messages', 'flash_request_id').catch(() => false);
  const flashColName = hasFlashCol ? 'flash_request_id' : 'wanted_request_id';

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
    [flashColName]: effectiveFlashId,
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

  let flashRequest = null;
  if (effectiveFlashId) {
    const table = await getFlashTable();
    flashRequest = await db(table).where({ id: effectiveFlashId }).first();
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
    flashRequestId: effectiveFlashId,
    wantedRequestId: effectiveFlashId,
    swapOffer,
    transaction,
    flashRequest,
    wantedRequest: flashRequest
  };
}

module.exports = {
  createMessage
};
