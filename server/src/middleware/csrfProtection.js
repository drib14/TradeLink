const crypto = require('crypto');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Public routes that do not require an active authenticated session
const EXEMPT_PREFIXES = [
  '/auth/register',
  '/auth/login',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/verify-reset-code',
  '/auth/reset-password',
  '/admin-auth/login',
  '/admin-auth/refresh-token',
  '/admin-auth/forgot-password',
  '/admin-auth/reset-password'
];

/**
 * Double-submit cookie CSRF protection middleware
 * Sets a readable XSRF-TOKEN cookie & header on safe requests if missing
 * Validates header against cookie on state-changing requests
 */
function csrfProtection(req, res, next) {
  const isProduction = env.isProduction || env.env === 'production';

  // 1. Ensure an XSRF-TOKEN exists and expose X-CSRF-Token response header
  let token = req.cookies && req.cookies['XSRF-TOKEN'];
  const sameSiteSetting = (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
  const secureSetting = isProduction || sameSiteSetting === 'none';

  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be readable by client JS to copy into header
      secure: secureSetting,
      sameSite: sameSiteSetting,
      path: '/'
    });
  }

  // Always expose the current CSRF token in response header for cross-origin clients
  res.setHeader('X-CSRF-Token', token);

  // 2. Safe methods are allowed through without validation
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // 3. Exempt public onboarding/auth endpoints that do not have an ambient user session
  const reqPath = req.path || '';
  const isExempt = EXEMPT_PREFIXES.some((prefix) => reqPath.startsWith(prefix) || (req.baseUrl + reqPath).includes(prefix));
  if (isExempt) {
    return next();
  }

  // 4. Inspect request headers and cookies
  const headerToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];
  const cookieToken = req.cookies && req.cookies['XSRF-TOKEN'];
  const authHeader = req.headers['authorization'];
  const hasBearerAuth = Boolean(authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer '));
  const isCookieAuth = Boolean(req.cookies && (req.cookies.accessToken || req.cookies.refreshToken));

  // If request uses Bearer token authorization header, it is immune to standard browser CSRF attacks
  if (hasBearerAuth) {
    // If both tokens were supplied, verify they match; otherwise proceed safely with Bearer auth
    if (headerToken && cookieToken) {
      const headerBuf = Buffer.from(String(headerToken));
      const cookieBuf = Buffer.from(String(cookieToken));
      if (headerBuf.length !== cookieBuf.length || !crypto.timingSafeEqual(headerBuf, cookieBuf)) {
        return next(new AppError('CSRF token validation failed. Please refresh the page and try again.', 403));
      }
    }
    return next();
  }

  // 5. If request relies on cookie authentication or provides an XSRF cookie without Bearer auth, enforce strict match
  if (isCookieAuth || cookieToken) {
    if (!headerToken || !cookieToken) {
      return next(new AppError('CSRF token validation failed. Missing security token.', 403));
    }

    // Constant-time comparison to mitigate timing attacks
    const headerBuf = Buffer.from(String(headerToken));
    const cookieBuf = Buffer.from(String(cookieToken));
    if (headerBuf.length !== cookieBuf.length || !crypto.timingSafeEqual(headerBuf, cookieBuf)) {
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
  const sameSiteSetting = (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
  const secureSetting = isProduction || sameSiteSetting === 'none';

  let token = req.cookies && req.cookies['XSRF-TOKEN'];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      secure: secureSetting,
      sameSite: sameSiteSetting,
      path: '/'
    });
  }

  res.setHeader('X-CSRF-Token', token);
  res.status(200).json({
    status: 'success',
    csrfToken: token
  });
}

module.exports = {
  csrfProtection,
  getCsrfToken
};

