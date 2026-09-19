const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const { authenticate } = require('../middleware/auth');
const { requireStudent } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createReviewSchema } = require('../validations/review.validation');

router.post('/', authenticate, requireStudent, validate(createReviewSchema), reviewsController.createReview);

module.exports = router;
