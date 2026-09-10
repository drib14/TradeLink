const jwt = require('jsonwebtoken');
const env = require('../../src/config/env');

function createTestToken(payload = {}, options = {}) {
  const defaults = {
    userId: 'usr_test_student_123',
    role: 'student',
    campus: 'UC Main'
  };

  const secret = options.secret || env.jwt.accessSecret;
  const expiresIn = options.expiresIn || '1h';

  return jwt.sign({ ...defaults, ...payload }, secret, { expiresIn });
}

function createAdminToken(payload = {}) {
  return createTestToken({
    userId: 'usr_test_admin_999',
    role: 'admin',
    campus: 'UC Main',
    ...payload
  });
}

module.exports = {
  createTestToken,
  createAdminToken
};
