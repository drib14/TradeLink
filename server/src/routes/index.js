const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const AppError = require('../utils/AppError');
const storageService = require('../services/storage.service');
const asyncHandler = require('../utils/asyncHandler');

// Sub-routers
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const listingsRoutes = require('./listings.routes');
const swapsRoutes = require('./swaps.routes');
const transactionsRoutes = require('./transactions.routes');
const chatRoutes = require('./chat.routes');
const wantedRoutes = require('./wanted.routes');
const reviewsRoutes = require('./reviews.routes');
const adminRoutes = require('./admin.routes');
const adminAuthRoutes = require('./adminAuth.routes');

// System Health Check
router.get('/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'ok' : 'degraded'
  });
});

// File / Media Upload endpoint (supports images and videos, streams to Cloudinary)
router.post('/upload', authenticate, upload.any(), asyncHandler(async (req, res, next) => {
  const file = (req.files && req.files[0]) || req.file;
  if (!file) {
    return next(new AppError('No file uploaded.', 400));
  }

  const folder = req.body.folder || req.query.folder || 'listings';
  const result = await storageService.uploadBuffer(
    file.buffer,
    file.originalname,
    file.mimetype,
    folder
  );

  res.status(201).json({
    status: 'success',
    data: {
      url: result.url,
      key: result.key,
      filename: result.filename,
      mediaType: result.mediaType || 'image',
      size: result.size,
      storage: result.storage
    }
  });
}));

// Mount domain routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/listings', listingsRoutes);
router.use('/swaps', swapsRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/meetups', transactionsRoutes); // Compatibility alias
router.use('/chat', chatRoutes);
router.use('/wanted', wantedRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/admin', adminRoutes);
router.use('/admin-auth', adminAuthRoutes);

module.exports = router;
