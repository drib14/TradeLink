const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/admin/adminAuth.controller');
const authController = require('../controllers/auth.controller');
const { authenticateAdmin } = require('../middleware/auth');
const { adminAuthLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

router.post('/login', adminAuthLimiter, adminAuthController.login);
router.post('/forgot-password', passwordResetLimiter, adminAuthController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, adminAuthController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticateAdmin, authController.logout);

module.exports = router;
