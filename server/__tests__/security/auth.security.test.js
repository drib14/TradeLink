const jwt = require('jsonwebtoken');
const { authenticate } = require('../../src/middleware/auth');
const { createTestToken } = require('../helpers/authHelper');
const env = require('../../src/config/env');

describe('Security Test: Authentication & Token Integrity', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should block requests with missing authorization token', async () => {
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Authentication required');
  });

  it('should block forged tokens signed with an invalid secret key', async () => {
    const forgedToken = jwt.sign(
      { userId: 'usr_hacker_001', role: 'admin', campus: 'UC Main' },
      'fake_attacker_secret_key_99999'
    );

    req.headers['authorization'] = `Bearer ${forgedToken}`;

    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Invalid authentication token');
  });

  it('should block expired tokens', async () => {
    const expiredToken = createTestToken(
      { userId: 'usr_test_123' },
      { expiresIn: '-10s' }
    );

    req.headers['authorization'] = `Bearer ${expiredToken}`;

    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('session has expired');
  });

  it('should block tokens with invalid signature algorithms like "none"', () => {
    const noneAlgorithmToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiJ1c3JfdGVzdCIsInJvbGUiOiJhZG1pbiJ9.';
    expect(() => {
      jwt.verify(noneAlgorithmToken, env.jwt.accessSecret);
    }).toThrow();
  });
});
