const db = require('../config/db');
const logger = require('../utils/logger');

module.exports = (io, socket) => {
  const userId = socket.user.id;

  /**
   * Join a private conversation room
   */
  socket.on('chat:join', async ({ conversationId }) => {
    try {
      const conv = await db('conversations').where({ id: conversationId }).first();
      if (!conv) return;

      // Verify user is a participant
      if (conv.participant_a === userId || conv.participant_b === userId) {
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
    socket.leave(`conv:${conversationId}`);
  });

  /**
   * Send a real-time message
   */
  socket.on('chat:message', async (data) => {
    try {
      const { conversationId, receiverId, content, isSystemMessage = false, swapOfferId } = data;
      if (!conversationId || !content || !content.trim()) return;

      const conv = await db('conversations').where({ id: conversationId }).first();
      if (!conv) return;

      if (conv.participant_a !== userId && conv.participant_b !== userId) {
        return;
      }

      const msgId = `msg-${Date.now()}`;
      const newMsg = {
        id: msgId,
        conversation_id: conversationId,
        sender_id: userId,
        receiver_id: receiverId,
        content: content.trim(),
        is_system_message: isSystemMessage,
        swap_offer_id: swapOfferId || null
      };

      await db.transaction(async (trx) => {
        await trx('messages').insert(newMsg);
        await trx('conversations').where({ id: conversationId }).update({
          last_message: content.trim(),
          last_message_at: new Date()
        });
        await trx.raw(
          `INSERT INTO conversation_read_status (conversation_id, user_id, unread_count)
           VALUES (?, ?, 1)
           ON DUPLICATE KEY UPDATE unread_count = unread_count + 1`,
          [conversationId, receiverId]
        );
      });

      const messagePayload = {
        id: msgId,
        conversationId,
        senderId: userId,
        receiverId,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        isSystemMessage,
        swapOfferId
      };

      // Emit to everyone in the conversation room
      io.to(`conv:${conversationId}`).emit('chat:message', messagePayload);

      // Emit notification to receiver's personal user room if not currently inside chat room
      io.to(`user:${receiverId}`).emit('notification:new', {
        title: `Message from ${socket.user.name}`,
        message: content.trim(),
        type: 'message',
        conversationId
      });
    } catch (err) {
      logger.error('Error in chat:message handler:', err);
    }
  });

  /**
   * Typing indicator
   */
  socket.on('chat:typing', ({ conversationId, isTyping }) => {
    socket.to(`conv:${conversationId}`).emit('chat:typing', {
      conversationId,
      userId,
      userName: socket.user.name,
      isTyping
    });
  });

  /**
   * Mark messages as read
   */
  socket.on('chat:read', async ({ conversationId }) => {
    try {
      await db('conversation_read_status')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          unread_count: 0,
          last_read_at: new Date()
        })
        .onConflict(['conversation_id', 'user_id'])
        .merge({
          unread_count: 0,
          last_read_at: new Date()
        });

      socket.to(`conv:${conversationId}`).emit('chat:read', {
        conversationId,
        userId
      });
    } catch (err) {
      logger.error('Error in chat:read handler:', err);
    }
  });
};
