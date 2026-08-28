const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', favoritesController.getFavorites);
router.post('/:listingId/toggle', favoritesController.toggleFavorite);

module.exports = router;
