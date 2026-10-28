const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireStudent } = require('../middleware/rbac');
const transactionsController = require('../controllers/transactions.controller');

const validate = require('../middleware/validate');
const validateUUID = require('../middleware/validateUUID');
const { createTransactionSchema } = require('../validations/transaction.validation');

// All transaction routes require authentication
router.use(authenticate);

// Get user's transactions
router.get('/', transactionsController.getTransactions);

// Create new direct transaction (students only — admins cannot buy/sell)
router.post('/', requireStudent, validate(createTransactionSchema), transactionsController.createTransaction);

// Get transaction by ID
router.get('/:id', validateUUID('id'), transactionsController.getTransactionById);

// Mark transaction completed (both roles can mediate)
router.patch('/:id/complete', validateUUID('id'), transactionsController.completeTransaction);

// Cancel transaction (both roles can mediate)
router.patch('/:id/cancel', validateUUID('id'), transactionsController.cancelTransaction);

// Update status (compatibility endpoint)
router.patch('/:id/status', validateUUID('id'), transactionsController.updateTransactionStatus);

module.exports = router;
