const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/admin/adminAuth.controller');
const authController = require('../controllers/auth.controller');
const { authenticateAdmin } = require('../middleware/auth');
const { adminAuthLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const {
  adminLoginSchema,
  adminForgotPasswordSchema,
  adminResetPasswordSchema
} = require('../validations/auth.validation');

router.post('/login', adminAuthLimiter, validate(adminLoginSchema), adminAuthController.login);
router.post('/forgot-password', passwordResetLimiter, validate(adminForgotPasswordSchema), adminAuthController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(adminResetPasswordSchema), adminAuthController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authenticateAdmin, authController.getMe);
router.post('/logout', authenticateAdmin, authController.logout);

module.exports = router;
