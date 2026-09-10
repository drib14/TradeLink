const express = require('express');
const request = require('supertest');
const { createTestToken } = require('../helpers/authHelper');
const { calculateTrustScore, isEligibleForProMerchant } = require('../../src/utils/trustScore');
const errorHandler = require('../../src/middleware/errorHandler');

const testApp = express();
testApp.use(express.json());

let mockUser = {
  id: 'user-alex',
  is_verified: true,
  completed_trades: 9,
  rating: 4.8,
  total_reviews: 8,
  punctuality_rate: 95,
  warnings_count: 0,
  trust_score: 82,
  is_pro_merchant: false
};

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

testApp.post('/api/reviews', (req, res) => {
  const { targetUserId, rating } = req.body;
  if (!targetUserId || !rating) {
    return res.status(400).json({ status: 'fail', message: 'Target user and rating are required.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ status: 'fail', message: 'Rating must be between 1 and 5.' });
  }

  // Update user stats and recalculate score
  mockUser.completed_trades += 1;
  mockUser.total_reviews += 1;
  mockUser.trust_score = calculateTrustScore(mockUser);
  mockUser.is_pro_merchant = isEligibleForProMerchant(mockUser);

  res.status(201).json({
    status: 'success',
    message: 'Review submitted successfully.',
    data: { user: mockUser }
  });
});

testApp.use(errorHandler);

describe('Integration Test: Reviews & Dynamic Trust Score Calculation', () => {
  it('should reject review with out-of-range rating (e.g. 6 stars)', async () => {
    const token = createTestToken();
    const res = await request(testApp)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetUserId: 'user-alex', rating: 6 });

    expect(res.status).toBe(400);
  });

  it('should accept valid 5-star review, recalculate trust score, and unlock Pro Merchant status', async () => {
    const token = createTestToken();
    const res = await request(testApp)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetUserId: 'user-alex', rating: 5, comment: 'Great campus seller, very punctual!' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.completed_trades).toBe(10);
    expect(res.body.data.user.trust_score).toBeGreaterThanOrEqual(85);
    expect(res.body.data.user.is_pro_merchant).toBe(true);
  });
});
