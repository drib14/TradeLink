const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites.controller');
const { authenticate } = require('../middleware/auth');
const { favoriteToggleLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

router.get('/', favoritesController.getFavorites);
router.post('/:listingId/toggle', favoriteToggleLimiter, favoritesController.toggleFavorite);

module.exports = router;
