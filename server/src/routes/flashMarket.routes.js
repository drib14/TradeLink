const express = require('express');
const router = express.Router();
const flashMarketController = require('../controllers/flashMarket.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const validateUUID = require('../middleware/validateUUID');
const { createFlashRequestSchema } = require('../validations/flashMarket.validation');
const { requireVerified, requireStudent } = require('../middleware/rbac');

router.get('/', flashMarketController.getFlashRequests);
router.post('/', authenticate, requireStudent, requireVerified, validate(createFlashRequestSchema), flashMarketController.createFlashRequest);
router.post('/:id/respond', authenticate, requireStudent, requireVerified, validateUUID('id'), flashMarketController.respondToFlashRequest);
router.patch('/:id/fulfill', authenticate, requireStudent, validateUUID('id'), flashMarketController.fulfillFlashRequest);
router.delete('/:id', authenticate, requireStudent, validateUUID('id'), flashMarketController.deleteFlashRequest);

module.exports = router;
