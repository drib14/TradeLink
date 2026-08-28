const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generates a cryptographically secure 4-digit code (e.g. 1000 - 9999)
 * @returns {string} 4-digit numeric code
 */
function generate4DigitCode() {
  return crypto.randomInt(1000, 10000).toString();
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
