const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware to authenticate requests using JWT Access Tokens
 * Checks Authorization header: Bearer <token>
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    if (env.jwt.adminAccessSecret) {
      try {
        decoded = jwt.verify(token, env.jwt.adminAccessSecret);
      } catch (adminErr) {
        if (err.name === 'TokenExpiredError' || adminErr.name === 'TokenExpiredError') {
          return next(new AppError('Your session has expired. Please refresh token or log in again.', 401));
        }
        return next(new AppError('Invalid authentication token.', 401));
      }
    } else {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your session has expired. Please refresh token or log in again.', 401));
      }
      return next(new AppError('Invalid authentication token.', 401));
    }
  }

  const user = await db('users').where({ id: decoded.userId }).first();
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (user.is_banned) {
    return next(new AppError('This account has been suspended. Contact campus administration.', 403));
  }

  // Token revocation check: if user changed password or revoked session, tokenVersion is bumped
  if (decoded.tokenVersion && user.token_version && decoded.tokenVersion < user.token_version) {
    return next(new AppError('Your session has expired or been revoked. Please log in again.', 401));
  }

  req.user = user;
  next();
});

/**
 * Optional authentication: attaches user if token is valid, but allows guest access
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    const user = await db('users').where({ id: decoded.userId }).first();
    req.user = user && !user.is_banned ? user : null;
  } catch (err) {
    req.user = null;
  }
  next();
});

/**
 * Strict authentication middleware for Admin routes
 * Validates against dedicated JWT_ADMIN_ACCESS_SECRET and confirms admin role and tokenType
 */
const authenticateAdmin = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('Administrator authentication required. Please log in to admin portal.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.adminAccessSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your administrative session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid administrator credentials or token.', 401));
  }

  if (decoded.tokenType !== 'admin' || decoded.role !== 'admin') {
    return next(new AppError('Access denied: Provided token does not have administrator privileges.', 403));
  }

  const user = await db('users').where({ id: decoded.userId }).first();
  if (!user || user.role !== 'admin') {
    return next(new AppError('Administrator account does not exist or has been revoked.', 403));
  }

  if (user.is_banned) {
    return next(new AppError('This administrator account has been deactivated.', 403));
  }

  // Token revocation check for administrators
  if (decoded.tokenVersion && user.token_version && decoded.tokenVersion < user.token_version) {
    return next(new AppError('Your administrative session has expired or been revoked. Please log in again.', 401));
  }

  req.user = user;
  next();
});

module.exports = {
  authenticate,
  optionalAuth,
  authenticateAdmin
};
