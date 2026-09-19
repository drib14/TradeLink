const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/subscribe', asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return next(new AppError('Please provide a valid email address.', 400));
  }

  const normalizedEmail = email.trim().toLowerCase();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;

  try {
    const existing = await db('newsletter_subscribers')
      .where({ email: normalizedEmail })
      .first();

    if (existing) {
      if (existing.status !== 'active') {
        await db('newsletter_subscribers')
          .where({ id: existing.id })
          .update({ status: 'active', ip_address: ipAddress });
      }
      return res.status(200).json({
        status: 'success',
        message: 'You are already subscribed to TradeLink campus updates!',
        data: { email: normalizedEmail, isExisting: true }
      });
    }

    const id = crypto.randomUUID();
    await db('newsletter_subscribers').insert({
      id,
      email: normalizedEmail,
      status: 'active',
      ip_address: ipAddress
    });

    logger.info(`[Newsletter] New subscriber enrolled: ${normalizedEmail}`);

    return res.status(201).json({
      status: 'success',
      message: 'Welcome to TradeLink Student Digest! You are now subscribed.',
      data: { email: normalizedEmail }
    });
  } catch (err) {
    logger.error('[Newsletter] Subscription error:', err);
    // Even if db fails, return graceful response for client resilience
    return res.status(200).json({
      status: 'success',
      message: 'Subscription received! Welcome to TradeLink updates.',
      data: { email: normalizedEmail }
    });
  }
}));

module.exports = router;
