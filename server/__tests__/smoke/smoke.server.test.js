const request = require('supertest');
const { app } = require('../../src/index');

describe('Tier 1: Server API Smoke Tests', () => {
  describe('1. Server Boot & Health', () => {
    it('GET / should return status ok with 200', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });

    it('GET /api/health should respond with system health status (200 or 503)', async () => {
      const res = await request(app).get('/api/health');
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('status');
      expect(['ok', 'degraded']).toContain(res.body.status);
    });

    it('should include Helmet security headers on all responses', async () => {
      const res = await request(app).get('/');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['x-download-options']).toBe('noopen');
      expect(res.headers['x-permitted-cross-domain-policies']).toBe('none');
    });
  });

  describe('2. Auth Routes Smoke', () => {
    it('POST /api/auth/register should reject empty body with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    it('POST /api/auth/login should reject missing password with 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ studentId: '123456' });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    it('POST /api/auth/refresh-token should reject missing token with 401', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/refresh token missing/i);
    });

    it('GET /api/auth/me should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/authentication required/i);
    });

    it('POST /api/auth/forgot-password should reject invalid email with 400', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('3. Listings Routes Smoke', () => {
    it('GET /api/listings should return 200 with listings collection (or 500/503 if DB offline)', async () => {
      const res = await request(app).get('/api/listings');
      expect([200, 500, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.status).toBe('success');
        expect(Array.isArray(res.body.data?.listings || res.body.data)).toBe(true);
      }
    });

    it('GET /api/listings/:id should return 404 for non-existent listing (or 500/503 if DB offline)', async () => {
      const res = await request(app).get('/api/listings/itm_nonexistent99999');
      expect([404, 500, 503]).toContain(res.status);
      if (res.status === 404) {
        expect(res.body.status).toBe('fail');
      }
    });

    it('POST /api/listings should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/listings')
        .send({ title: 'Test Item', price: 100 });
      expect(res.status).toBe(401);
    });
  });

  describe('4. Swap Routes Smoke', () => {
    it('GET /api/swaps should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/swaps');
      expect(res.status).toBe(401);
    });

    it('POST /api/swaps should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/swaps')
        .send({ listingId: 'itm_123' });
      expect(res.status).toBe(401);
    });
  });

  describe('6. Chat Routes Smoke', () => {
    it('GET /api/chat/conversations should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/chat/conversations');
      expect(res.status).toBe(401);
    });

    it('POST /api/chat/messages should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/chat/messages')
        .send({ message: 'Hello' });
      expect(res.status).toBe(401);
    });
  });

  describe('7. Transactions Routes Smoke', () => {
    it('GET /api/transactions should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(401);
    });

    it('POST /api/transactions should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .send({ listingId: 'list-123' });
      expect(res.status).toBe(401);
    });
  });

  describe('8. Flash Market Routes Smoke', () => {
    it('GET /api/flash-market should return 200 for public requests feed (or 500/503 if DB offline)', async () => {
      const res = await request(app).get('/api/flash-market');
      expect([200, 500, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.status).toBe('success');
      }
    });

    it('POST /api/flash-market should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/flash-market')
        .send({ itemTitle: 'Calculator' });
      expect(res.status).toBe(401);
    });
  });

  describe('9. Reviews Routes Smoke', () => {
    it('POST /api/reviews should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send({ rating: 5, comment: 'Great trader' });
      expect(res.status).toBe(401);
    });
  });

  describe('10. Transactions Status Route Smoke', () => {
    it('PATCH /api/transactions/:id/status should reject unauthenticated request with 401', async () => {
      const res = await request(app).patch('/api/transactions/tx-123/status').send({ status: 'completed' });
      expect(res.status).toBe(401);
    });
  });

  describe('11. Admin Routes Smoke', () => {
    it('GET /api/admin/announcements should return 200 for public bulletins (or 500/503 if DB offline)', async () => {
      const res = await request(app).get('/api/admin/announcements');
      expect([200, 500, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.status).toBe('success');
      }
    });

    it('GET /api/admin/config should return 200 for public system config (or 500/503 if DB offline)', async () => {
      const res = await request(app).get('/api/admin/config');
      expect([200, 500, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.status).toBe('success');
      }
    });

    it('GET /api/admin/stats should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });
  });

  describe('12. Users Routes Smoke', () => {
    it('PATCH /api/users/me should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .send({ name: 'Jane Doe' });
      expect(res.status).toBe(401);
    });

    it('GET /api/users/:id should return 404 for non-existent user (or 500/503 if DB offline)', async () => {
      const res = await request(app).get('/api/users/usr_nonexistent99999');
      expect([404, 500, 503]).toContain(res.status);
      if (res.status === 404) {
        expect(res.body.status).toBe('fail');
      }
    });
  });

  describe('13. 404 Catch-All Smoke', () => {
    it('GET /api/nonexistent-route should return 404 with structured error', async () => {
      const res = await request(app).get('/api/nonexistent-route-smoke-test');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/Route not found/i);
    });
  });

  describe('14. Upload Route Smoke', () => {
    it('POST /api/upload should reject unauthenticated request with 401', async () => {
      const res = await request(app).post('/api/upload');
      expect(res.status).toBe(401);
    });
  });
});
