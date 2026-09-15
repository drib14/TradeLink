const db = require('../config/db');
const logger = require('../utils/logger');
const { createMessage } = require('../services/message.service');
const { sanitizeString } = require('../middleware/sanitizeInput');

module.exports = (io, socket) => {
  const userId = socket.user?.id;
  if (!userId || userId === 'guest' || socket.user?.role === 'guest') {
    return;
  }

  // Join personal user room immediately on connection
  socket.join(`user:${userId}`);

  // Socket rate limiting state (30 messages per minute)
  const messageTimestamps = [];
  const MAX_MESSAGES_PER_MINUTE = 30;

  /**
   * Join a private conversation room
   */
  socket.on('chat:join', async ({ conversationId }) => {
    try {
      if (!conversationId) return;
      const conv = await db('conversations').where({ id: conversationId }).first();
      if (!conv) return;

      // Verify user is a participant
      if (conv.user_one_id === userId || conv.user_two_id === userId) {
        socket.join(`conv:${conversationId}`);
        logger.debug(`User [${userId}] joined room conv:${conversationId}`);
      }
    } catch (err) {
      logger.error('Error in chat:join handler:', err);
    }
  });

  /**
   * Leave a conversation room
   */
  socket.on('chat:leave', ({ conversationId }) => {
    if (conversationId) {
      socket.leave(`conv:${conversationId}`);
    }
  });

  /**
   * Send a real-time message (text, media, deal card, swap proposal, or wanted inquiry)
   */
  socket.on('chat:message', async (data) => {
    try {
      // SECURITY: Block admin accounts from sending student chat messages
      if (socket.user.role === 'admin') {
        socket.emit('chat:error', { message: 'Administrator accounts cannot send student chat messages.' });
        return;
      }

      const now = Date.now();
      // Remove timestamps older than 60 seconds
      while (messageTimestamps.length > 0 && messageTimestamps[0] < now - 60000) {
        messageTimestamps.shift();
      }

      if (messageTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
        socket.emit('chat:error', { message: 'Rate limit exceeded. Please slow down.' });
        return;
      }

      const {
        conversationId,
        receiverId,
        content,
        isSystemMessage = false,
        swapOfferId,
        transactionId,
        flashRequestId,
        wantedRequestId,
        mediaUrl,
        mediaType
      } = data;

      if (!conversationId) return;
      if (!content && !mediaUrl) return;

      // SECURITY: Validate sender is a member of this conversation
      const conv = await db('conversations').where({ id: conversationId }).first();
      if (!conv) {
        socket.emit('chat:error', { message: 'Conversation not found.' });
        return;
      }
      if (conv.user_one_id !== userId && conv.user_two_id !== userId) {
        socket.emit('chat:error', { message: 'Unauthorized: you are not a participant in this conversation.' });
        return;
      }

      // SECURITY: Validate receiverId is the OTHER participant
      const expectedReceiver = conv.user_one_id === userId ? conv.user_two_id : conv.user_one_id;
      const safeReceiverId = receiverId === expectedReceiver ? receiverId : expectedReceiver;

      // SECURITY: Sanitize content — socket events bypass Express sanitizeInput middleware
      const sanitizedContent = content ? sanitizeString(content) : '';

      if (sanitizedContent && sanitizedContent.length > 3000) {
        socket.emit('chat:error', { message: 'Message exceeds maximum length of 3000 characters.' });
        return;
      }

      messageTimestamps.push(now);

      const effectiveFlashId = flashRequestId || wantedRequestId || null;
      const messagePayload = await createMessage({
        conversationId,
        senderId: userId,
        receiverId: safeReceiverId,
        content: sanitizedContent,
        isSystemMessage,
        swapOfferId,
        transactionId,
        flashRequestId: effectiveFlashId,
        wantedRequestId: effectiveFlashId,
        mediaUrl,
        mediaType
      });

      // Emit to everyone in the conversation room
      io.to(`conv:${conversationId}`).emit('chat:message', messagePayload);

      // Emit real-time notification alert to receiver's personal user room
      io.to(`user:${safeReceiverId}`).emit('notification:new', {
        title: `Message from ${socket.user.name}`,
        message: messagePayload.content,
        type: 'message',
        conversationId,
        senderId: userId,
        senderName: socket.user.name,
        mediaUrl: messagePayload.mediaUrl,
        mediaType: messagePayload.mediaType
      });
    } catch (err) {
      logger.error('Error in chat:message handler:', err);
      socket.emit('chat:error', { message: err.message || 'Failed to send message.' });
    }
  });

  /**
   * Typing indicator
   */
  socket.on('chat:typing', ({ conversationId, isTyping }) => {
    if (conversationId) {
      socket.to(`conv:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId,
        userName: socket.user.name,
        isTyping: Boolean(isTyping)
      });
    }
  });

  /**
   * Mark messages as read
   */
  socket.on('chat:read', async ({ conversationId }) => {
    try {
      if (!conversationId) return;

      await db('messages')
        .where({ conversation_id: conversationId, receiver_id: userId, is_read: false })
        .update({ is_read: true });

      socket.to(`conv:${conversationId}`).emit('chat:read', {
        conversationId,
        userId
      });
    } catch (err) {
      logger.error('Error in chat:read handler:', err);
    }
  });
};
