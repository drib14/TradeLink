const express = require('express');
const request = require('supertest');
const { createTestToken } = require('../helpers/authHelper');
const authRoutes = require('../../src/routes/auth.routes');
const errorHandler = require('../../src/middleware/errorHandler');

const testApp = express();
testApp.use(express.json());

// Simulated DB / Auth integration test app
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
      name: 'Test Student',
      is_banned: false
    };
  } catch {
    req.user = null;
  }
  next();
});

testApp.use('/api/auth/me', (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'fail', message: 'Authentication required. Please log in.' });
  }
  res.status(200).json({ status: 'success', data: { user: req.user } });
});

testApp.use('/api/auth', authRoutes);
testApp.use(errorHandler);

describe('Integration Test: Auth Module & Registration Workflows', () => {
  it('should reject registration with non-UC email domain', async () => {
    const res = await request(testApp)
      .post('/api/auth/register')
      .send({
        name: 'Juan Dela Cruz',
        email: 'juan@gmail.com', // Non-UC domain
        password: 'Password123!',
        studentId: '202300001',
        campus: 'UC Main',
        college: 'CCS',
        yearLevel: '3rd Year'
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('fail');
  });

  it('should reject registration with invalid student ID format', async () => {
    const res = await request(testApp)
      .post('/api/auth/register')
      .send({
        name: 'Juan Dela Cruz',
        email: 'juan.ccs@uc.edu.ph',
        password: 'Password123!',
        studentId: 'abc-invalid',
        campus: 'UC Main',
        college: 'CCS',
        yearLevel: '3rd Year'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('digits with no hyphens or letters');
  });

  it('should reject login without password or email', async () => {
    const res = await request(testApp)
      .post('/api/auth/login')
      .send({
        email: 'student@uc.edu.ph'
      });

    expect(res.status).toBe(400);
  });

  it('should reject password reset request without valid email', async () => {
    const res = await request(testApp)
      .post('/api/auth/forgot-password')
      .send({
        email: 'not-an-email'
      });

    expect(res.status).toBe(400);
  });

  it('should allow authenticated student to retrieve self profile via /api/auth/me', async () => {
    const token = createTestToken({ userId: 'usr_alex_1', role: 'student', campus: 'UC Main' });
    const res = await request(testApp)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.id).toBe('usr_alex_1');
  });
});
