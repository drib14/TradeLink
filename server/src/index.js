const http = require('http');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');

const env = require('./config/env');
const corsOptions = require('./config/cors');
const db = require('./config/db');
const logger = require('./utils/logger');
const AppError = require('./utils/AppError');
const requestLogger = require('./middleware/requestLogger');
const sanitizeInput = require('./middleware/sanitizeInput');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const initializeSocket = require('./socket');
const storageService = require('./services/storage.service');
const { autoInitDatabase } = require('./config/dbInit');

const { v4: uuidv4 } = require('uuid');
const { csrfProtection, getCsrfToken } = require('./middleware/csrfProtection');

const app = express();
const server = http.createServer(app);

// Enable trust proxy — trust only the first proxy (prevents IP spoofing for rate limiters)
app.set('trust proxy', 1);

// 1. Security Headers (Helmet)
app.use(
  helmet({
    xFrameOptions: { action: 'sameorigin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https:"],
        connectSrc: ["'self'", "https://res.cloudinary.com", "wss:", "ws:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    permissionsPolicy: {
      features: {
        camera: ["'self'"],
        microphone: ["'none'"],
        geolocation: ["'none'"],
        payment: ["'none'"]
      }
    }
  })
);

// 2. Request Correlation ID & Core Security Headers
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (env.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// 3. CORS
app.use(cors(corsOptions));

// 4. Request Logging
app.use(requestLogger);

// 5. Body Parsers & Signed Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.cookieSecret));

// 6. Data Sanitization & HTTP Parameter Pollution Protection
app.use(sanitizeInput);
app.use(hpp());

// 7. General API Rate Limiting
app.use('/api', apiLimiter);

// 8. Static Uploads Folder (with nosniff to prevent MIME-type sniffing attacks)
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  next();
}, express.static(path.resolve(__dirname, '../uploads')));

// 9. Root Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 10. CSRF Token Endpoint & Double-Submit Protection
app.get('/api/csrf-token', getCsrfToken);
app.use('/api', csrfProtection);

// 11. Mount Main API Routes
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

// 13. Start HTTP + Socket Server (Only when run directly, not when required by tests)
const HOST = env.host || '0.0.0.0';
const PORT = env.port;
if (require.main === module) {
  server.listen(PORT, HOST, async () => {
    logger.info('=======================================================');
    logger.info(`TradeLink Server listening on ${HOST}:${PORT} [${env.env}]`);
    logger.info(`Base API URL: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api`);
    logger.info('IP Whitelist: 0.0.0.0 (All incoming IPs and origins allowed)');
    logger.info('=======================================================');

    // Test database connection at startup and auto-initialize schema & seed
    const dbHealth = await db.testConnection();
    if (dbHealth.ok) {
      logger.info(`MySQL Database connected successfully [${env.db.database}]`);
      await autoInitDatabase();
    } else {
      logger.warn(`MySQL Database connection warning: ${dbHealth.error}`);
      logger.warn(`Make sure MySQL server is running on ${env.db.host}:${env.db.port}`);
    }

    // Check media storage status (Cloudinary / secure fallback)
    const storageHealth = await storageService.testCloudinaryConnection();
    if (storageHealth.ok && storageHealth.storage === 'cloudinary') {
      logger.info(`Cloudinary Object Storage active [Cloud: ${storageHealth.cloudName}]`);
    } else {
      logger.info(`Media Storage: ${storageHealth.message}`);
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
}

module.exports = { app, server, io };

