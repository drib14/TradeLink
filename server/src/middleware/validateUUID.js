/**
 * UUID v4 format validation middleware
 * Validates :id route params to prevent probing and injection via malformed IDs.
 */
const AppError = require('../utils/AppError');

const VALID_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^[a-zA-Z0-9_-]{1,64}$/i;

/**
 * Middleware factory: validates that one or more named route params are valid identifiers (UUID or safe slug).
 * @param  {...string} paramNames - Route param names to validate (defaults to 'id')
 */
const validateUUID = (...paramNames) => {
  const params = paramNames.length > 0 ? paramNames : ['id'];

  return (req, res, next) => {
    for (const param of params) {
      const value = req.params[param];
      if (value && !VALID_ID_REGEX.test(value)) {
        return next(
          new AppError(`Invalid identifier format for "${param}".`, 400)
        );
      }
    }
    next();
  };
};

module.exports = validateUUID;
