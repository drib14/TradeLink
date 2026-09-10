const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware factory to check if current user is the owner of a resource or an admin.
 * Attaches the fetched resource to req[resourceName] for performance (avoids re-fetching).
 */
const requireOwnershipOrAdmin = (tableName, idParam = 'id', ownerField = 'seller_id', resourceName = 'resource') => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const resourceId = req.params[idParam];
    const resource = await db(tableName).where({ id: resourceId }).first();

    if (!resource) {
      return next(new AppError('Resource not found.', 404));
    }

    const isOwner = resource[ownerField] === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new AppError('You are not authorized to modify or delete this resource.', 403));
    }

    req[resourceName] = resource;
    next();
  });
};

module.exports = {
  requireOwnershipOrAdmin
};
