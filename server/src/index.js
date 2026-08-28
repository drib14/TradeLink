const http = require('http');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const xss = require('xss-clean');

const env = require('./config/env');
const corsOptions = require('./config/cors');
const db = require('./config/db');
const logger = require('./utils/logger');
const AppError = require('./utils/AppError');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const initializeSocket = require('./socket');

const app = express();
const server = http.createServer(app);

// 1. Security Headers (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false // Disable CSP for API backend or customize as needed
  })
);

// 2. CORS
app.use(cors(corsOptions));

// 3. Request Logging
app.use(requestLogger);

// 4. Body Parsers & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 5. Data Sanitization & HTTP Parameter Pollution Protection
app.use(xss());
app.use(hpp());

// 6. General API Rate Limiting
app.use('/api', apiLimiter);

// 7. Static Uploads Folder
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 8. Root Welcome & Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'TradeLink Backend API',
    version: '1.0.0',
    university: 'University of Cebu',
    campuses: [
      'UC Main', 'UC Banilad', 'UC LM', 'UC METC',
      'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center', 'UC PRI'
    ],
    documentation: '/api/health',
    status: 'online'
  });
});

// 9. Mount Main API Routes
app.use('/api', apiRoutes);

// 10. Handle 404 for Unmatched Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// 11. Global Error Handler
app.use(errorHandler);

// 12. Initialize Real-Time WebSocket Server
const io = initializeSocket(server);
app.set('io', io);

// 13. Start HTTP + Socket Server
const PORT = env.port;
server.listen(PORT, async () => {
  logger.info('=======================================================');
  logger.info(`TradeLink Server listening on port ${PORT} [${env.env}]`);
  logger.info(`Base API URL: http://localhost:${PORT}/api`);
  logger.info(`CORS Allowed: ${env.clientUrl}`);
  logger.info('=======================================================');

  // Test database connection at startup
  const dbHealth = await db.testConnection();
  if (dbHealth.ok) {
    logger.info(`MySQL Database connected successfully [${env.db.database}]`);
  } else {
    logger.warn(`MySQL Database connection warning: ${dbHealth.error}`);
    logger.warn(`Make sure MySQL server is running on ${env.db.host}:${env.db.port}`);
  }
});

// Graceful Shutdown
const shutdown = () => {
  logger.info('Shutting down TradeLink server gracefully...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    await db.destroy();
    logger.info('Database connections closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { app, server };
