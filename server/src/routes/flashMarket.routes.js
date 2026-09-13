const express = require('express');
const router = express.Router();
const flashMarketController = require('../controllers/flashMarket.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const validateUUID = require('../middleware/validateUUID');
const { createFlashRequestSchema } = require('../validations/flashMarket.validation');
const { requireVerified } = require('../middleware/rbac');

router.get('/', flashMarketController.getFlashRequests);
router.post('/', authenticate, requireVerified, validate(createFlashRequestSchema), flashMarketController.createFlashRequest);
router.post('/:id/respond', authenticate, requireVerified, validateUUID, flashMarketController.respondToFlashRequest);
router.patch('/:id/fulfill', authenticate, validateUUID, flashMarketController.fulfillFlashRequest);
router.delete('/:id', authenticate, validateUUID, flashMarketController.deleteFlashRequest);

module.exports = router;
