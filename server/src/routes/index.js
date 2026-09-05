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
const adminAuthRoutes = require('./adminAuth.routes');

// System Health Check
router.get('/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'ok' : 'degraded'
  });
});

const storageService = require('../services/storage.service');
const asyncHandler = require('../utils/asyncHandler');

// File Upload endpoint (single image to Cloudflare R2 / secure storage)
router.post('/upload', authenticate, upload.single('image'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded.', 400));
  }

  const folder = req.body.folder || req.query.folder || 'listings';
  const result = await storageService.uploadBuffer(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    folder
  );

  res.status(201).json({
    status: 'success',
    data: {
      url: result.url,
      key: result.key,
      filename: result.filename,
      size: result.size,
      storage: result.storage
    }
  });
}));

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
router.use('/admin-auth', adminAuthRoutes);

module.exports = router;
