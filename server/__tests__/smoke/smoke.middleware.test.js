const { apiLimiter, authLimiter } = require('../../src/middleware/rateLimiter');
const sanitizeInput = require('../../src/middleware/sanitizeInput');
const errorHandler = require('../../src/middleware/errorHandler');
const { authenticate, optionalAuth } = require('../../src/middleware/auth');
const { requireRole, requireVerified } = require('../../src/middleware/rbac');
const { encodeId, decodeId } = require('../../src/utils/idHasher');
const AppError = require('../../src/utils/AppError');

describe('Tier 2: Server Middleware & Utility Smoke Tests', () => {
  describe('1. Rate Limiter', () => {
    it('apiLimiter should export an Express middleware function', () => {
      expect(typeof apiLimiter).toBe('function');
      expect(apiLimiter.length).toBeGreaterThanOrEqual(2); // (req, res, next)
    });

    it('authLimiter should export an Express middleware function', () => {
      expect(typeof authLimiter).toBe('function');
      expect(authLimiter.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('2. Sanitizer', () => {
    it('should pass clean input through unchanged', () => {
      const req = {
        body: { title: 'Clean Calculus Book', price: 250 },
        query: { campus: 'Main' },
        params: { id: '123' }
      };
      const res = {};
      const next = jest.fn();

      sanitizeInput(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.title).toBe('Clean Calculus Book');
      expect(req.body.price).toBe(250);
      expect(req.query.campus).toBe('Main');
    });

    it('should strip script tags and javascript: vectors from nested objects', () => {
      const req = {
        body: {
          description: '<script>alert("xss")</script>Selling this item',
          nested: {
            evilUrl: 'javascript:alert(1)',
            safeText: 'Hello world'
          }
        }
      };
      const res = {};
      const next = jest.fn();

      sanitizeInput(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.description).toBe('Selling this item');
      expect(req.body.nested.evilUrl).toBe('alert(1)');
      expect(req.body.nested.safeText).toBe('Hello world');
    });
  });

  describe('3. Error Handler', () => {
    it('should format AppError into structured JSON with appropriate status code', () => {
      const err = new AppError('Resource not found', 404);
      const req = { method: 'GET', originalUrl: '/api/items/unknown' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
          message: 'Resource not found'
        })
      );
    });

    it('should handle unhandled errors as 500 without leaking stack traces in response body', () => {
      const genericErr = new Error('Database connection crashed unexpectedly');
      const req = { method: 'POST', originalUrl: '/api/swaps' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      errorHandler(genericErr, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      const responsePayload = res.json.mock.calls[0][0];
      expect(responsePayload.status).toBe('error');
      expect(responsePayload).not.toHaveProperty('stack');
    });
  });

  describe('4. Auth Middleware', () => {
    it('authenticate should reject requests missing an Authorization header or cookie with 401', async () => {
      const req = { headers: {}, cookies: {} };
      const res = {};
      let caughtError = null;
      const next = jest.fn((err) => {
        caughtError = err;
      });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(caughtError).toBeInstanceOf(AppError);
      expect(caughtError.statusCode).toBe(401);
      expect(caughtError.message).toMatch(/Authentication required/i);
    });

    it('optionalAuth should attach null user and allow guest request when no token is present', async () => {
      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledWith(); // called with no error
      expect(req.user).toBeNull();
    });
  });

  describe('5. RBAC Middleware', () => {
    it('requireRole should reject a student user attempting admin action with 403', () => {
      const adminMiddleware = requireRole('admin');
      const req = { user: { id: 'u1', role: 'student' } };
      const res = {};
      let caughtError = null;
      const next = jest.fn((err) => {
        caughtError = err;
      });

      adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(caughtError).toBeInstanceOf(AppError);
      expect(caughtError.statusCode).toBe(403);
    });

    it('requireVerified should reject an unverified student with 403', () => {
      const req = { user: { id: 'u2', role: 'student', is_verified: false } };
      const res = {};
      let caughtError = null;
      const next = jest.fn((err) => {
        caughtError = err;
      });

      requireVerified(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(caughtError).toBeInstanceOf(AppError);
      expect(caughtError.statusCode).toBe(403);
      expect(caughtError.message).toMatch(/verification required/i);
    });
  });

  describe('6. ID Hashing Utility', () => {
    it('should successfully roundtrip encode and decode for user, listing, swap, and meetup IDs', () => {
      const testCases = [
        { raw: 'usr_1001', type: 'user', expectedPrefix: 'usr_' },
        { raw: 'listing_9876', type: 'listing', expectedPrefix: 'itm_' },
        { raw: 'swap_42', type: 'swap', expectedPrefix: 'swp_' },
        { raw: 'meetup_555', type: 'meetup', expectedPrefix: 'mtp_' }
      ];

      for (const { raw, type, expectedPrefix } of testCases) {
        const encoded = encodeId(raw, type);
        expect(encoded.startsWith(expectedPrefix)).toBe(true);
        const decoded = decodeId(encoded);
        expect(decoded).toBe(raw);
      }
    });

    it('should return raw ID unchanged for unhashed legacy IDs', () => {
      expect(decodeId('12345')).toBe('12345');
      expect(decodeId('legacy-item-uuid')).toBe('legacy-item-uuid');
      expect(decodeId('')).toBe('');
      expect(decodeId(null)).toBe(null);
    });
  });
});
