const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listings.controller');
const { authenticate } = require('../middleware/auth');
const { requireVerified } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createListingSchema,
  updateListingSchema,
  queryListingsSchema,
  reportListingSchema
} = require('../validations/listing.validation');
const { createListingLimiter } = require('../middleware/rateLimiter');

router.get('/', validate(queryListingsSchema, 'query'), listingsController.getListings);
router.get('/:id', listingsController.getListingById);

router.post(
  '/',
  authenticate,
  requireVerified,
  createListingLimiter,
  validate(createListingSchema),
  listingsController.createListing
);

router.patch('/:id', authenticate, validate(updateListingSchema), listingsController.updateListing);
router.delete('/:id', authenticate, listingsController.deleteListing);
router.post('/:id/boost', authenticate, listingsController.boostListing);
router.patch('/:id/sold', authenticate, listingsController.markAsSold);
router.post('/:id/report', authenticate, validate(reportListingSchema), listingsController.reportListing);

module.exports = router;
