const express = require('express');
const router = express.Router();
const wantedController = require('../controllers/wanted.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createWantedSchema } = require('../validations/wanted.validation');

router.get('/', wantedController.getWantedRequests);
router.post('/', authenticate, validate(createWantedSchema), wantedController.createWantedRequest);
router.post('/:id/respond', authenticate, wantedController.respondToWanted);
router.patch('/:id/fulfill', authenticate, wantedController.fulfillWanted);
router.delete('/:id', authenticate, wantedController.deleteWanted);

module.exports = router;
