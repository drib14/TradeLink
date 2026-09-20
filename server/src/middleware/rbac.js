const AppError = require('../utils/AppError');
const { ROLES } = require('../config/constants');

/**
 * Role-Based Access Control Middleware factory
 * @param  {...string} allowedRoles ('student', 'admin')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have administrative permission to perform this action.', 403)
      );
    }

    next();
  };
};

/**
 * Checks if user is verified student before creating listings / high-trust features
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  // Admins bypass student verification requirement
  if (req.user.role === 'admin') {
    return next();
  }

  // MVP: Verification temporarily disabled for open access to all users
  return next();
};

const { requireStudent } = require('./requireStudent');

/**
 * Convenience shorthand: Requires admin role
 */
const requireAdmin = requireRole('admin');

module.exports = {
  requireRole,
  requireVerified,
  requireStudent,
  requireAdmin
};

