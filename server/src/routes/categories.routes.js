const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', categoriesController.getCategories);
router.post('/', authenticate, categoriesController.createCategory);

module.exports = router;

