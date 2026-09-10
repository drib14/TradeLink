const request = require('supertest');
const { app } = require('../../src/index');
const { isOriginAllowed } = require('../../src/config/cors');

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

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should reject unauthorized origins not in the whitelist', async () => {
    const unauthorizedOrigin = 'http://malicious-attacker.com';
    const res = await request(app)
      .get('/')
      .set('Origin', unauthorizedOrigin);

    expect(res.status).toBe(403);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.body.message).toMatch(/CORS policy violation/i);
  });

  it('should handle preflight OPTIONS requests securely for allowed origins', async () => {
    const res = await request(app)
      .options('/')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should reject preflight OPTIONS requests for unauthorized origins', async () => {
    const res = await request(app)
      .options('/')
      .set('Origin', 'http://evil-site.com')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.status).toBe(403);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should allow requests without an Origin header (mobile apps, curl, server-to-server)', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('isOriginAllowed validator should accurately whitelist allowed domains and block others', () => {
    expect(isOriginAllowed(undefined)).toBe(true);
    expect(isOriginAllowed(null)).toBe(true);
    expect(isOriginAllowed('')).toBe(true);
    expect(isOriginAllowed('http://localhost:5173')).toBe(true);
    expect(isOriginAllowed('http://localhost:5173/')).toBe(true);
    expect(isOriginAllowed('http://127.0.0.1:5173')).toBe(true);
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(isOriginAllowed('http://unauthorized-domain.com')).toBe(false);
    expect(isOriginAllowed('https://random-phishing-site.xyz')).toBe(false);
  });
});
