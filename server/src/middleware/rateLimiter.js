const rateLimit = require('express-rate-limit');

// Strict limiter for authentication attempts (anti-brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 login/register requests per IP
  message: {
    status: 'fail',
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 password reset requests per hour
  message: {
    status: 'fail',
    message: 'Too many password reset requests. Please check your inbox or try again in an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API request limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // max 120 requests per minute
  message: {
    status: 'fail',
    message: 'Rate limit exceeded. Please slow down your requests.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Listing creation rate limiter
const createListingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // max 20 posts per hour
  message: {
    status: 'fail',
    message: 'Listing creation limit reached. Please wait before posting more items.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  apiLimiter,
  createListingLimiter
};
