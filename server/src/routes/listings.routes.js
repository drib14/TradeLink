const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listings.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireVerified } = require('../middleware/rbac');
const decodeParams = require('../middleware/decodeParams');
const validate = require('../middleware/validate');
const validateUUID = require('../middleware/validateUUID');
const {
  createListingSchema,
  updateListingSchema,
  queryListingsSchema,
  reportListingSchema
} = require('../validations/listing.validation');
const { createListingLimiter, reportListingLimiter } = require('../middleware/rateLimiter');

decodeParams.bindRouter(router);

router.get('/', validate(queryListingsSchema, 'query'), listingsController.getListings);
router.get('/:id', validateUUID('id'), optionalAuth, listingsController.getListingById);

router.post(
  '/',
  authenticate,
  requireVerified,
  createListingLimiter,
  validate(createListingSchema),
  listingsController.createListing
);

router.patch('/:id', validateUUID('id'), authenticate, requireVerified, validate(updateListingSchema), listingsController.updateListing);
router.delete('/:id', validateUUID('id'), authenticate, requireVerified, listingsController.deleteListing);
router.post('/:id/boost', validateUUID('id'), authenticate, requireVerified, listingsController.boostListing);
router.patch('/:id/sold', validateUUID('id'), authenticate, requireVerified, listingsController.markAsSold);
router.post('/:id/view', validateUUID('id'), listingsController.viewListing);
router.post(
  '/:id/report',
  validateUUID('id'),
  authenticate,
  reportListingLimiter,
  validate(reportListingSchema),
  listingsController.reportListing
);

module.exports = router;
