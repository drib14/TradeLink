const db = require('../config/db');
const logger = require('../utils/logger');
const { createMessage } = require('../services/message.service');

module.exports = (io, socket) => {
  const userId = socket.user.id;

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
   * Send a real-time message (text and/or media)
   */
  socket.on('chat:message', async (data) => {
    try {
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
        mediaUrl,
        mediaType
      } = data;

      if (!conversationId) return;
      if (!content && !mediaUrl) return;

      if (content && content.length > 2000) {
        socket.emit('chat:error', { message: 'Message exceeds maximum length of 2000 characters.' });
        return;
      }

      messageTimestamps.push(now);

      const messagePayload = await createMessage({
        conversationId,
        senderId: userId,
        receiverId,
        content,
        isSystemMessage,
        swapOfferId,
        transactionId,
        mediaUrl,
        mediaType
      });

      // Emit to everyone in the conversation room
      io.to(`conv:${conversationId}`).emit('chat:message', messagePayload);

      // Emit real-time notification alert to receiver's personal user room
      io.to(`user:${receiverId}`).emit('notification:new', {
        title: `Message from ${socket.user.name}`,
        message: messagePayload.content,
        type: 'message',
        conversationId,
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
