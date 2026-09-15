const AppError = require('../utils/AppError');

/**
 * Middleware: Blocks administrator accounts from student-only marketplace features.
 * Admins must use the dedicated /api/admin/* routes for management actions.
 *
 * Apply this to all routes that only students should access:
 * - Creating / editing / deleting listings
 * - Proposing / responding to swaps
 * - Creating transactions (buying)
 * - Sending chat messages
 * - Submitting reviews
 * - Creating flash market requests
 * - Updating student profile / ID verification
 */
const requireStudent = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  if (req.user.role === 'admin') {
    return next(
      new AppError(
        'Administrator accounts cannot perform student marketplace actions. Please use the TradeLink Administration Portal.',
        403
      )
    );
  }

  next();
};

module.exports = { requireStudent };
