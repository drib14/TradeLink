const express = require('express');
const router = express.Router();
const env = require('../config/env');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const AppError = require('../utils/AppError');
const storageService = require('../services/storage.service');
const asyncHandler = require('../utils/asyncHandler');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { checkUploadQuota } = require('../middleware/uploadQuota');

// Sub-routers
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const listingsRoutes = require('./listings.routes');
const swapsRoutes = require('./swaps.routes');
const transactionsRoutes = require('./transactions.routes');
const chatRoutes = require('./chat.routes');
const flashMarketRoutes = require('./flashMarket.routes');
const reviewsRoutes = require('./reviews.routes');
const adminRoutes = require('./admin.routes');
const adminAuthRoutes = require('./adminAuth.routes');
const aiRoutes = require('./ai.routes');
const categoriesRoutes = require('./categories.routes');

// System Health Check
router.get('/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'ok' : 'degraded',
    timestamp: new Date().toISOString()
  });
});

// Media Upload status check
router.get('/upload/status', authenticate, asyncHandler(async (req, res) => {
  const status = await storageService.testCloudinaryConnection();
  res.status(200).json({
    status: 'success',
    data: status
  });
}));

// File / Media Upload endpoint (supports images and videos, streams directly to Cloudinary)
router.post('/upload', authenticate, checkUploadQuota, uploadLimiter, upload.array('image', 5), asyncHandler(async (req, res, next) => {
  const uploadedFiles = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
  if (uploadedFiles.length === 0) {
    return next(new AppError('No file uploaded.', 400));
  }

  const folder = req.body.folder || req.query.folder || 'listings';
  const uploadResults = await Promise.all(
    uploadedFiles.map((f) =>
      storageService.uploadBuffer(f.buffer, f.originalname, f.mimetype, folder)
    )
  );

  const primary = uploadResults[0];

  res.status(201).json({
    status: 'success',
    data: {
      url: primary.url,
      key: primary.key,
      filename: primary.filename,
      mediaType: primary.mediaType || 'image',
      size: primary.size,
      storage: primary.storage,
      files: uploadResults.map((r) => ({
        url: r.url,
        key: r.key,
        filename: r.filename,
        mediaType: r.mediaType || 'image',
        size: r.size,
        storage: r.storage
      }))
    }
  });
}));

// Mount domain routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/listings', listingsRoutes);
router.use('/swaps', swapsRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/chat', chatRoutes);
router.use('/flash-market', flashMarketRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/admin', adminRoutes);
router.use('/admin-auth', adminAuthRoutes);
router.use('/ai', aiRoutes);
router.use('/categories', categoriesRoutes);

module.exports = router;
