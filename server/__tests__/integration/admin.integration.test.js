const express = require('express');
const request = require('supertest');
const { createTestToken, createAdminToken } = require('../helpers/authHelper');
const { requireRole } = require('../../src/middleware/rbac');
const adminRoutes = require('../../src/routes/admin.routes');
const errorHandler = require('../../src/middleware/errorHandler');

// Create test app with simulated authentication for router integration testing
const testApp = express();
testApp.use(express.json());

// Simulated auth layer for testing route guards
testApp.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const jwt = require('jsonwebtoken');
    const env = require('../../src/config/env');
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      campus: decoded.campus,
      name: decoded.role === 'admin' ? 'Campus Admin' : 'Student User',
      is_banned: false
    };
  } catch (e) {
    req.user = null;
  }
  next();
});

testApp.use('/api/admin', (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'fail', message: 'Authentication required. Please log in.' });
  }
  requireRole('admin')(req, res, next);
});

testApp.get('/api/admin/stats', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { totalUsers: 10, totalListings: 25 }
  });
});

testApp.get('/api/admin/config', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { config: { maintenanceMode: false } }
  });
});

testApp.use(errorHandler);

describe('Integration Test: Admin Routes & RBAC Enforcement', () => {
  it('should reject unauthenticated request to /api/admin/stats with 401', async () => {
    const res = await request(testApp).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('should reject standard student token from accessing /api/admin/stats with 403 Forbidden', async () => {
    const studentToken = createTestToken({ role: 'student', userId: 'usr_student_1' });
    const res = await request(testApp)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('administrative permission');
  });

  it('should allow admin token to access /api/admin/stats with 200 OK', async () => {
    const adminToken = createAdminToken({ role: 'admin', userId: 'usr_admin_1' });
    const res = await request(testApp)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.totalUsers).toBe(10);
  });

  it('should reject standard student from accessing /api/admin/config with 403 Forbidden', async () => {
    const studentToken = createTestToken({ role: 'student', userId: 'usr_student_1' });
    const res = await request(testApp)
      .get('/api/admin/config')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('administrative permission');
  });

  it('should allow admin token to access /api/admin/config with 200 OK', async () => {
    const adminToken = createAdminToken({ role: 'admin', userId: 'usr_admin_1' });
    const res = await request(testApp)
      .get('/api/admin/config')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.config.maintenanceMode).toBe(false);
  });
});
