const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const transactionsController = require('../controllers/transactions.controller');

// All transaction routes require authentication
router.use(authenticate);

// Get user's transactions
router.get('/', transactionsController.getTransactions);

// Create new direct transaction
router.post('/', transactionsController.createTransaction);

// Get transaction by ID
router.get('/:id', transactionsController.getTransactionById);

// Mark transaction completed
router.patch('/:id/complete', transactionsController.completeTransaction);

// Cancel transaction
router.patch('/:id/cancel', transactionsController.cancelTransaction);

// Update status (compatibility endpoint)
router.patch('/:id/status', transactionsController.updateTransactionStatus);

// Compatibility endpoints for previous meetup routes
router.post('/:id/verify', transactionsController.completeTransaction);

module.exports = router;
