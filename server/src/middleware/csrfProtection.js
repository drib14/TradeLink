const crypto = require('crypto');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit cookie CSRF protection middleware
 * Sets a readable XSRF-TOKEN cookie on safe requests if missing
 * Validates header against cookie on state-changing requests
 */
function csrfProtection(req, res, next) {
  const isProduction = env.isProduction || env.env === 'production';

  // 1. Ensure an XSRF-TOKEN cookie exists
  let token = req.cookies && req.cookies['XSRF-TOKEN'];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be readable by client JS to copy into X-XSRF-TOKEN header
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/'
    });
  }

  // 2. Safe methods are allowed through without validation
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // 3. For state-changing methods (POST, PUT, PATCH, DELETE), validate token
  const headerToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];
  const cookieToken = req.cookies && req.cookies['XSRF-TOKEN'];

  // If a cookie token was present with the incoming request, verify header match
  if (cookieToken) {
    if (!headerToken || headerToken !== cookieToken) {
      return next(new AppError('CSRF token validation failed. Please refresh the page and try again.', 403));
    }
  }

  next();
}

/**
 * Dedicated endpoint to retrieve or refresh CSRF token
 */
function getCsrfToken(req, res) {
  const isProduction = env.isProduction || env.env === 'production';
  let token = req.cookies && req.cookies['XSRF-TOKEN'];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/'
    });
  }

  res.status(200).json({
    status: 'success',
    csrfToken: token
  });
}

module.exports = {
  csrfProtection,
  getCsrfToken
};
