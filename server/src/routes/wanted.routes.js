const express = require('express');
const router = express.Router();
const wantedController = require('../controllers/wanted.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createWantedSchema } = require('../validations/wanted.validation');

const { requireVerified } = require('../middleware/rbac');

router.get('/', wantedController.getWantedRequests);
router.post('/', authenticate, requireVerified, validate(createWantedSchema), wantedController.createWantedRequest);
router.post('/:id/respond', authenticate, requireVerified, wantedController.respondToWanted);
router.patch('/:id/fulfill', authenticate, wantedController.fulfillWanted);
router.delete('/:id', authenticate, wantedController.deleteWanted);

module.exports = router;
