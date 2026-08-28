const AppError = require('../utils/AppError');

/**
 * Role-Based Access Control Middleware factory
 * @param  {...string} allowedRoles ('student', 'admin', 'superadmin')
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

  // Admins and Superadmins bypass student verification requirement
  if (['admin', 'superadmin'].includes(req.user.role)) {
    return next();
  }

  if (!req.user.is_verified) {
    return next(
      new AppError(
        'Student ID verification required. Please upload your valid University of Cebu ID to unlock this feature.',
        403
      )
    );
  }

  next();
};

module.exports = {
  requireRole,
  requireVerified
};
