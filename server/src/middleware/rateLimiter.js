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

// Listing report rate limiter (prevent report spam / harassment)
const reportListingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 reports per hour
  message: {
    status: 'fail',
    message: 'Too many reports submitted. Please wait before reporting again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Favorite toggle rate limiter
const favoriteToggleLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // max 60 toggles per minute
  message: {
    status: 'fail',
    message: 'Too many favorite actions. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Reset code verification limiter (anti-brute-force on 6-digit codes)
const resetCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 code verification attempts per 15 minutes
  message: {
    status: 'fail',
    message: 'Too many verification code attempts. Please wait 15 minutes before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Upload endpoint rate limiter (prevent storage abuse)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // max 30 uploads per hour per IP
  message: {
    status: 'fail',
    message: 'Upload limit reached. Please wait before uploading more files.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Listing view count limiter (prevents automated view inflation)
const viewListingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 view recordings per minute per IP
  message: {
    status: 'fail',
    message: 'Too many view requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin authentication limiter (strict anti-brute-force)
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per IP
  message: {
    status: 'fail',
    message: 'Too many admin authentication attempts. Access locked for 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Chat message rate limiter (REST path — WebSocket has its own limiter)
const chatMessageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // max 60 messages per minute
  message: {
    status: 'fail',
    message: 'Message rate limit exceeded. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// AI features rate limiter (prevent token exhaustion / cost spam)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // max 20 AI queries per minute per IP
  message: {
    status: 'fail',
    message: 'AI request limit reached. Please wait a moment before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// User reviews query limiter
const userReviewsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // max 60 reviews fetch requests per minute per IP
  message: {
    status: 'fail',
    message: 'Too many reviews requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  apiLimiter,
  createListingLimiter,
  reportListingLimiter,
  favoriteToggleLimiter,
  resetCodeLimiter,
  uploadLimiter,
  viewListingLimiter,
  adminAuthLimiter,
  chatMessageLimiter,
  aiLimiter,
  userReviewsLimiter
};

