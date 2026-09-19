const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generates a cryptographically secure 6-digit code (e.g. 100000 - 999999)
 * Name kept for backward compatibility but now generates 6-digit codes.
 * @returns {string} 6-digit numeric code
 */
function generate4DigitCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes a 4-digit verification code using bcrypt
 * @param {string} code
 * @returns {Promise<string>}
 */
async function hashCode(code) {
  return bcrypt.hash(code, 10);
}

/**
 * Verifies a code against a hash using timing-safe comparison
 * @param {string} plainCode
 * @param {string} hashedCode
 * @returns {Promise<boolean>}
 */
async function verifyCode(plainCode, hashedCode) {
  if (!plainCode || !hashedCode) return false;
  return bcrypt.compare(plainCode.trim(), hashedCode);
}

module.exports = {
  generate4DigitCode,
  hashCode,
  verifyCode
};
