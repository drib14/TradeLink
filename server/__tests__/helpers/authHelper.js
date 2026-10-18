const jwt = require('jsonwebtoken');
const env = require('../../src/config/env');

function createTestToken(payload = {}, options = {}) {
  const defaults = {
    userId: 'usr_test_student_123',
    role: 'student',
    campus: 'UC Main',
    tokenType: 'student'
  };

  const secret = options.secret || env.jwt.accessSecret;
  const expiresIn = options.expiresIn || '1h';
  const issuer = options.issuer !== undefined ? options.issuer : 'tradelink-api';
  const audience = options.audience !== undefined ? options.audience : 'tradelink-client';

  const signOptions = { expiresIn };
  if (issuer) signOptions.issuer = issuer;
  if (audience) signOptions.audience = audience;

  return jwt.sign({ ...defaults, ...payload }, secret, signOptions);
}

function createAdminToken(payload = {}, options = {}) {
  return createTestToken(
    {
      userId: 'usr_test_admin_999',
      role: 'admin',
      campus: 'UC Main',
      tokenType: 'admin',
      ...payload
    },
    options
  );
}

module.exports = {
  createTestToken,
  createAdminToken
};
