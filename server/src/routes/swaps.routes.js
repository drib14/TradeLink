const express = require('express');
const router = express.Router();
const swapsController = require('../controllers/swaps.controller');
const { authenticate } = require('../middleware/auth');
const decodeParams = require('../middleware/decodeParams');
const validate = require('../middleware/validate');
const { proposeSwapSchema, respondSwapSchema } = require('../validations/swap.validation');

const { requireVerified } = require('../middleware/rbac');

decodeParams.bindRouter(router);
router.use(authenticate);

router.get('/', swapsController.getSwaps);
router.post('/', requireVerified, validate(proposeSwapSchema), swapsController.proposeSwap);
router.patch('/:id/respond', validate(respondSwapSchema), swapsController.respondToSwap);

module.exports = router;
