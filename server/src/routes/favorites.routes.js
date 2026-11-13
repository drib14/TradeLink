const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites.controller');
const { authenticate } = require('../middleware/auth');
const { requireStudent } = require('../middleware/rbac');
const decodeParams = require('../middleware/decodeParams');
const validateUUID = require('../middleware/validateUUID');

decodeParams.bindRouter(router);
router.use(authenticate, requireStudent);

router.get('/', favoritesController.getFavorites);
router.post('/:id/toggle', validateUUID('id'), favoritesController.toggleFavorite);

module.exports = router;
