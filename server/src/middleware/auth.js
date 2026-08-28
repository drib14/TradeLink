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
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please refresh token or log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }

  const user = await db('users').where({ id: decoded.userId }).first();
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (user.is_banned) {
    return next(new AppError(`Account suspended: ${user.ban_reason || 'Community safety violation.'}`, 403));
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

module.exports = {
  authenticate,
  optionalAuth
};
