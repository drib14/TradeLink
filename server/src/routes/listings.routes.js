const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listings.controller');
const reviewsController = require('../controllers/reviews.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireVerified, requireStudent } = require('../middleware/rbac');
const decodeParams = require('../middleware/decodeParams');
const validate = require('../middleware/validate');
const validateUUID = require('../middleware/validateUUID');
const {
  createListingSchema,
  updateListingSchema,
  queryListingsSchema,
  reportListingSchema
} = require('../validations/listing.validation');
const { createListingLimiter, reportListingLimiter, viewListingLimiter } = require('../middleware/rateLimiter');
const { checkUploadQuota } = require('../middleware/uploadQuota');

decodeParams.bindRouter(router);

router.get('/', validate(queryListingsSchema, 'query'), listingsController.getListings);
router.get('/:id', validateUUID('id'), optionalAuth, listingsController.getListingById);
router.get('/:id/reviews', validateUUID('id'), reviewsController.getListingReviews);
router.post('/:id/reviews', validateUUID('id'), authenticate, requireStudent, reviewsController.createReview);

router.post(
  '/',
  authenticate,
  requireStudent,
  requireVerified,
  checkUploadQuota,
  createListingLimiter,
  validate(createListingSchema),
  listingsController.createListing
);

router.patch(
  '/:id',
  validateUUID('id'),
  authenticate,
  requireStudent,
  requireVerified,
  checkUploadQuota,
  validate(updateListingSchema),
  listingsController.updateListing
);
router.delete('/:id', validateUUID('id'), authenticate, requireStudent, requireVerified, listingsController.deleteListing);
router.patch('/:id/sold', validateUUID('id'), authenticate, requireStudent, requireVerified, listingsController.markAsSold);
router.post('/:id/view', validateUUID('id'), viewListingLimiter, optionalAuth, listingsController.viewListing);
router.post(
  '/:id/report',
  validateUUID('id'),
  authenticate,
  requireStudent,
  reportListingLimiter,
  validate(reportListingSchema),
  listingsController.reportListing
);

module.exports = router;
