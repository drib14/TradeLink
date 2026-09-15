const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listings.controller');
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
const { createListingLimiter, reportListingLimiter, apiLimiter } = require('../middleware/rateLimiter');

decodeParams.bindRouter(router);

router.get('/', validate(queryListingsSchema, 'query'), listingsController.getListings);
router.get('/:id', validateUUID('id'), optionalAuth, listingsController.getListingById);

router.post(
  '/',
  authenticate,
  requireStudent,
  requireVerified,
  createListingLimiter,
  validate(createListingSchema),
  listingsController.createListing
);

router.patch('/:id', validateUUID('id'), authenticate, requireStudent, requireVerified, validate(updateListingSchema), listingsController.updateListing);
router.delete('/:id', validateUUID('id'), authenticate, requireStudent, requireVerified, listingsController.deleteListing);
router.patch('/:id/sold', validateUUID('id'), authenticate, requireStudent, requireVerified, listingsController.markAsSold);
router.post('/:id/view', validateUUID('id'), apiLimiter, listingsController.viewListing);
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
