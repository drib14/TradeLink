const { serializeUser } = require('../serializers/userSerializer');

/**
 * Strips sensitive fields like password_hash, reset_code_hash, refresh_token_hash from user object
 * and returns clean camelCase format.
 * @param {Object} user
 * @returns {Object} sanitized user
 */
function sanitizeUser(user) {
  return serializeUser(user);
}

module.exports = {
  sanitizeUser,
  serializeUser
};
