const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfileSchema } = require('../validations/auth.validation');

router.patch('/me', authenticate, validate(updateProfileSchema), usersController.updateProfile);
router.post('/me/verify-id', authenticate, usersController.submitIdVerification);
router.get('/:id', usersController.getUserProfile);
router.get('/:id/reviews', usersController.getUserReviews);

module.exports = router;
