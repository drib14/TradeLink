const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const config = require('../config/env');

const MESSAGE_KEY_SOURCE = process.env.MESSAGE_ENCRYPTION_KEY || config.cookieSecret || 'tradelink-campus-chat-secure-salt-2026';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(MESSAGE_KEY_SOURCE).digest();
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts plaintext message content with AES-256-GCM
 * Output format: enc:v1:<hex_iv>:<hex_auth_tag>:<hex_ciphertext>
 */
function encryptMessageContent(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    return text;
  }
}

/**
 * Decrypts encrypted message content
 */
function decryptMessageContent(text) {
  if (!text || typeof text !== 'string') return text;
  if (!text.startsWith('enc:v1:')) return text;
  try {
    const parts = text.split(':');
    if (parts.length !== 5) return text;
    const iv = Buffer.from(parts[2], 'hex');
    const authTag = Buffer.from(parts[3], 'hex');
    const encryptedText = parts[4];
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return text;
  }
}

/**
 * Persists an encrypted message and updates conversation status in a single atomic transaction
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

  const actualReceiverId = conv.user_one_id === senderId ? conv.user_two_id : conv.user_one_id;

  const msgId = uuidv4();
  const summaryContent = cleanContent || (mediaType === 'video' ? '[Video Attachment]' : '[Image Attachment]');
  const storedContent = isSystemMessage ? summaryContent : encryptMessageContent(summaryContent);

  const newMsg = {
    id: msgId,
    conversation_id: conversationId,
    sender_id: senderId,
    receiver_id: actualReceiverId,
    content: storedContent,
    is_read: false,
    is_system_message: Boolean(isSystemMessage),
    media_url: mediaUrl || null,
    media_type: mediaType || null,
    swap_offer_id: swapOfferId || null,
    transaction_id: transactionId || null,
    flash_request_id: flashRequestId || null,
    created_at: new Date()
  };

  await db.transaction(async (trx) => {
    await trx('messages').insert(newMsg);
    await trx('conversations').where({ id: conversationId }).update({
      last_message: isSystemMessage ? summaryContent : encryptMessageContent(summaryContent),
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
  if (flashRequestId) {
    flashRequest = await db('flash_requests').where({ id: flashRequestId }).first();
  }

  return {
    id: msgId,
    conversationId,
    senderId,
    receiverId: actualReceiverId,
    content: summaryContent,
    isEncrypted: !isSystemMessage,
    isRead: false,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    timestamp: newMsg.created_at.toISOString(),
    isSystemMessage: Boolean(isSystemMessage),
    swapOfferId: swapOfferId || null,
    transactionId: transactionId || null,
    flashRequestId: flashRequestId || null,
    swapOffer: swapOffer || null,
    transaction: transaction || null,
    flashRequest: flashRequest || null
  };
}

module.exports = {
  createMessage,
  encryptMessageContent,
  decryptMessageContent
};
