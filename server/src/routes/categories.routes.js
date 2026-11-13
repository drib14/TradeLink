const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories.controller');
const { authenticateAdmin } = require('../middleware/auth');

router.get('/', categoriesController.getCategories);
router.post('/', authenticateAdmin, categoriesController.createCategory);

module.exports = router;

