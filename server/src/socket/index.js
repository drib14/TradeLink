const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const logger = require('../utils/logger');
const registerChatHandler = require('./chatHandler');
const registerNotificationHandler = require('./notificationHandler');
const { isOriginAllowed } = require('../config/cors');

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS policy: Origin not allowed for WebSocket connection.'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token missing.'));
      }

      const decoded = jwt.verify(token, env.jwt.accessSecret);
      const user = await db('users').where({ id: decoded.userId }).first();

      if (!user || user.is_banned) {
        return next(new Error('Authentication error: User invalid or banned.'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected [${socket.user.id}]`);

    // Register handlers
    registerNotificationHandler(io, socket);
    registerChatHandler(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket client disconnected [${socket.user.id}] (Reason: ${reason})`);
    });
  });

  return io;
}

module.exports = initializeSocket;
