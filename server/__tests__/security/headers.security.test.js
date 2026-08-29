const request = require('supertest');
const { app } = require('../../src/index');

describe('Security Test: Security Headers & CORS Policy', () => {
  it('should include secure HTTP headers on root /', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    // Security headers configured by Helmet
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should include correct Cross-Origin-Resource-Policy', async () => {
    const res = await request(app).get('/');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('should allow legitimate client origin in CORS response', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
