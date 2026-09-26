const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const aiController = require('../controllers/ai.controller');

// All AI routes require authentication and are rate-limited to avoid token exhaustion
router.use(authenticate);
router.use(aiLimiter);

// Listing safety & academic integrity check
router.post('/moderate', aiController.moderateListing);

// Barter / swap fairness evaluation
router.post('/estimate-barter', aiController.estimateBarter);

// Student listing autofill draft
router.post('/autofill', aiController.autofillListing);

// Campus safe meetup zone suggestions
router.post('/safe-meetup', aiController.suggestSafeMeetup);

// Transaction dispute summary dossier
router.post('/dispute-summary', aiController.summarizeDispute);

module.exports = router;
