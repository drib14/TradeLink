const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listings.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireVerified } = require('../middleware/rbac');
const decodeParams = require('../middleware/decodeParams');
const validate = require('../middleware/validate');
const {
  createListingSchema,
  updateListingSchema,
  queryListingsSchema,
  reportListingSchema
} = require('../validations/listing.validation');
const { createListingLimiter, reportListingLimiter } = require('../middleware/rateLimiter');

decodeParams.bindRouter(router);

router.get('/', validate(queryListingsSchema, 'query'), listingsController.getListings);
router.get('/:id', optionalAuth, listingsController.getListingById);

router.post(
  '/',
  authenticate,
  requireVerified,
  createListingLimiter,
  validate(createListingSchema),
  listingsController.createListing
);

router.patch('/:id', authenticate, requireVerified, validate(updateListingSchema), listingsController.updateListing);
router.delete('/:id', authenticate, requireVerified, listingsController.deleteListing);
router.post('/:id/boost', authenticate, requireVerified, listingsController.boostListing);
router.patch('/:id/sold', authenticate, requireVerified, listingsController.markAsSold);
router.post(
  '/:id/report',
  authenticate,
  reportListingLimiter,
  validate(reportListingSchema),
  listingsController.reportListing
);

module.exports = router;

