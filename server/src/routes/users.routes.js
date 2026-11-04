const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireStudent } = require('../middleware/rbac');
const decodeParams = require('../middleware/decodeParams');
const validate = require('../middleware/validate');
const validateUUID = require('../middleware/validateUUID');
const { userReviewsLimiter } = require('../middleware/rateLimiter');
const { updateProfileSchema } = require('../validations/auth.validation');

decodeParams.bindRouter(router);

// Profile routes (supports both /me and mobile /profile)
router.patch('/me', authenticate, requireStudent, validate(updateProfileSchema), usersController.updateProfile);
router.patch('/profile', authenticate, requireStudent, validate(updateProfileSchema), usersController.updateProfile);

router.get('/me/analytics', authenticate, usersController.getUserAnalytics);
router.get('/me/verification-session', authenticate, requireStudent, usersController.getVerificationSession);
router.get('/verification-session', authenticate, requireStudent, usersController.getVerificationSession);
router.get('/me/verification-status', authenticate, usersController.getVerificationStatus);

// Verification submission (supports both /me/verify-id and mobile /verify-id)
router.post('/me/verify-id', authenticate, requireStudent, usersController.submitIdVerification);
router.post('/verify-id', authenticate, requireStudent, usersController.submitIdVerification);

router.get('/:id/analytics', authenticate, validateUUID('id'), usersController.getUserAnalytics);
router.get('/:id', validateUUID('id'), optionalAuth, usersController.getUserProfile);
router.get('/:id/reviews', validateUUID('id'), userReviewsLimiter, usersController.getUserReviews);

module.exports = router;
