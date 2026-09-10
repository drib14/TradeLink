const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/admin/adminAuth.controller');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, adminAuthController.login);
router.post('/forgot-password', passwordResetLimiter, adminAuthController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, adminAuthController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
