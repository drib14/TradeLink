const express = require('express');
const request = require('supertest');
const { createAdminToken, createTestToken } = require('../helpers/authHelper');
const { encodeId } = require('../../src/utils/idHasher');
const decodeParams = require('../../src/middleware/decodeParams');
const errorHandler = require('../../src/middleware/errorHandler');

const testApp = express();
testApp.use(express.json());

let mockVerifications = [
  { id: 'verif-101', user_id: 'user-chloe', student_id: '202305521', status: 'pending' }
];

let mockUsers = [
  { id: 'user-chloe', name: 'Chloe Mendoza', is_verified: false, is_banned: false, trust_score: 55, warnings_count: 0 }
];

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
    req.user = { id: decoded.userId, role: decoded.role, campus: decoded.campus };
  } catch {
    req.user = null;
  }
  next();
});

const adminRouter = express.Router();
decodeParams.bindRouter(adminRouter);

// Admin-only middleware guard
adminRouter.use((req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ status: 'fail', message: 'Forbidden: Admin access required.' });
  }
  next();
});

adminRouter.patch('/verifications/:id/approve', (req, res) => {
  const vfy = mockVerifications.find((v) => v.id === req.params.id);
  if (!vfy) return res.status(404).json({ status: 'fail', message: 'Verification request not found.' });

  vfy.status = 'approved';
  const targetUser = mockUsers.find((u) => u.id === vfy.user_id);
  if (targetUser) {
    targetUser.is_verified = true;
    targetUser.trust_score = 75;
  }

  res.status(200).json({ status: 'success', message: 'Student ID verification approved.', data: { verification: vfy } });
});

adminRouter.patch('/users/:id/warn', (req, res) => {
  const user = mockUsers.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ status: 'fail', message: 'User not found.' });

  user.warnings_count += 1;
  user.trust_score = Math.max(10, user.trust_score - 15);

  res.status(200).json({ status: 'success', message: 'Official warning issued.', data: { user } });
});

testApp.use('/api/admin', adminRouter);
testApp.use(errorHandler);

describe('Integration Test: Admin Moderation & Hashed Verification Workflows', () => {
  it('should approve student verification request using hashed slug vfy_...', async () => {
    const hashedSlug = encodeId('verif-101', 'verification');
    expect(hashedSlug.startsWith('vfy_')).toBe(true);

    const adminToken = createAdminToken();
    const res = await request(testApp)
      .patch(`/api/admin/verifications/${hashedSlug}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.verification.status).toBe('approved');
    expect(mockUsers[0].is_verified).toBe(true);
    expect(mockUsers[0].trust_score).toBe(75);
  });

  it('should issue warning to student using hashed user slug usr_...', async () => {
    const hashedUserSlug = encodeId('user-chloe', 'user');
    expect(hashedUserSlug.startsWith('usr_')).toBe(true);

    const adminToken = createAdminToken();
    const res = await request(testApp)
      .patch(`/api/admin/users/${hashedUserSlug}/warn`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Unnotified meetup tardiness' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.warnings_count).toBe(1);
    expect(res.body.data.user.trust_score).toBe(60); // 75 - 15
  });

  it('should block non-admin student from triggering moderation actions', async () => {
    const hashedSlug = encodeId('verif-101', 'verification');
    const studentToken = createTestToken({ role: 'student' });

    const res = await request(testApp)
      .patch(`/api/admin/verifications/${hashedSlug}/approve`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });
});
