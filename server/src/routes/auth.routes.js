const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  changePasswordSchema
} = require('../validations/auth.validation');
const { authLimiter, passwordResetLimiter, resetCodeLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authLimiter, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-code', resetCodeLimiter, passwordResetLimiter, validate(verifyResetCodeSchema), authController.verifyResetCode);
router.post('/reset-password', resetCodeLimiter, passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
