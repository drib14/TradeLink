const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const AppError = require('../utils/AppError');

// Sub-routers
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const listingsRoutes = require('./listings.routes');
const favoritesRoutes = require('./favorites.routes');
const swapsRoutes = require('./swaps.routes');
const meetupsRoutes = require('./meetups.routes');
const chatRoutes = require('./chat.routes');
const wantedRoutes = require('./wanted.routes');
const reviewsRoutes = require('./reviews.routes');
const notificationsRoutes = require('./notifications.routes');
const adminRoutes = require('./admin.routes');

// System Health Check
router.get('/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'success' : 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealth
  });
});

// File Upload endpoint (single image)
router.post('/upload', authenticate, upload.single('image'), (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded.', 400));
  }

  const relativeUrl = `/uploads/${req.file.destination.split(/[\\/]/).pop()}/${req.file.filename}`;
  res.status(201).json({
    status: 'success',
    data: {
      url: relativeUrl,
      filename: req.file.filename,
      size: req.file.size
    }
  });
});

// Mount domain routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/listings', listingsRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/swaps', swapsRoutes);
router.use('/meetups', meetupsRoutes);
router.use('/chat', chatRoutes);
router.use('/wanted', wantedRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
