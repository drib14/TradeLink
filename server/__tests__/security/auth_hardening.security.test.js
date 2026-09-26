const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../src/config/env');
const { generate4DigitCode, verifyCode } = require('../../src/utils/generateCode');
const { generateTokens } = require('../../src/utils/authHelpers');
const { registerSchema, resetPasswordSchema } = require('../../src/validations/auth.validation');

// Mock db using regular functions so resetMocks in jest.config.js doesn't wipe return values
jest.mock('../../src/config/db', () => {
  return function mockDb(table) {
    return {
      where: function() {
        return {
          first: function() {
            return Promise.resolve({
              id: 'usr-revoke-test',
              role: 'student',
              token_version: 2, // revoked version in DB
              is_banned: false
            });
          }
        };
      }
    };
  };
});

const { authenticate } = require('../../src/middleware/auth');
const db = require('../../src/config/db');
// console.log('DEBUG MOCK DB:', typeof db, db('users'));

describe('Security Test: Hardened Authentication & Attack Prevention', () => {
  describe('Password Complexity Validation', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        studentId: '12345678',
        email: 'john@example.com',
        password: 'Pass1', // too short
        campus: 'UC Main',
        college: 'CCS',
        yearLevel: '3rd Year'
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 8 characters');
    });

    it('should reject passwords lacking uppercase or digits', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        studentId: '12345678',
        email: 'john@example.com',
        password: 'lowercaseonlypassword',
        campus: 'UC Main',
        college: 'CCS',
        yearLevel: '3rd Year'
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('one uppercase letter, one lowercase letter, one number');
    });

    it('should accept strong passwords meeting complexity requirements', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        studentId: '12345678',
        email: 'john@example.com',
        password: 'SecurePassword2026!',
        campus: 'UC Main',
        college: 'CCS',
        yearLevel: '3rd Year'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('Cryptographic Code Generator & Entropy', () => {
    it('should generate a 6-digit numeric verification code (high entropy)', () => {
      const code = generate4DigitCode();
      expect(code).toHaveLength(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
      const numericVal = parseInt(code, 10);
      expect(numericVal).toBeGreaterThanOrEqual(100000);
      expect(numericVal).toBeLessThanOrEqual(999999);
    });

    it('should reject non-6-digit codes in resetPasswordSchema', () => {
      const { error } = resetPasswordSchema.validate({
        email: 'student@example.com',
        code: '1234', // old 4-digit code
        newPassword: 'NewSecurePassword2026!'
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('6 digits');
    });
  });

  describe('Token Version Revocation (Session Invalidation)', () => {
    it('should reject an access token whose tokenVersion is older than user token_version in DB', async () => {
      // Generate token with version 1
      const tokenV1 = jwt.sign(
        { userId: 'usr-revoke-test', role: 'student', campus: 'UC Main', tokenVersion: 1 },
        env.jwt.accessSecret,
        { expiresIn: '15m' }
      );

      const req = {
        headers: { authorization: `Bearer ${tokenV1}` },
        cookies: {}
      };
      const res = {};
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      expect(err.message).toContain('revoked');
    });
  });
});
