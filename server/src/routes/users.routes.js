const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireStudent } = require('../middleware/rbac');
const decodeParams = require('../middleware/decodeParams');
const validate = require('../middleware/validate');
const { updateProfileSchema } = require('../validations/auth.validation');

decodeParams.bindRouter(router);

router.patch('/me', authenticate, requireStudent, validate(updateProfileSchema), usersController.updateProfile);
router.get('/me/verification-session', authenticate, requireStudent, usersController.getVerificationSession);
router.get('/me/verification-status', authenticate, usersController.getVerificationStatus);
router.post('/me/verify-id', authenticate, requireStudent, usersController.submitIdVerification);
router.get('/:id', optionalAuth, usersController.getUserProfile);
router.get('/:id/reviews', usersController.getUserReviews);

module.exports = router;
