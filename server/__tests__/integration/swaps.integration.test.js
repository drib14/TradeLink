const express = require('express');
const request = require('supertest');
const { createTestToken } = require('../helpers/authHelper');
const { encodeId } = require('../../src/utils/idHasher');
const decodeParams = require('../../src/middleware/decodeParams');
const errorHandler = require('../../src/middleware/errorHandler');

const testApp = express();
testApp.use(express.json());

let mockSwaps = [
  {
    id: 'swap-801',
    target_listing_id: 'list-101',
    offered_listing_id: 'list-102',
    proposer_id: 'user-maria',
    recipient_id: 'user-alex',
    cash_top_up: 200,
    status: 'pending'
  }
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

const swapsRouter = express.Router();
decodeParams.bindRouter(swapsRouter);

swapsRouter.get('/:id', (req, res) => {
  const swap = mockSwaps.find((s) => s.id === req.params.id);
  if (!swap) {
    return res.status(404).json({ status: 'fail', message: 'Swap proposal not found.' });
  }
  res.status(200).json({ status: 'success', data: { swap } });
});

swapsRouter.patch('/:id/respond', (req, res) => {
  const swap = mockSwaps.find((s) => s.id === req.params.id);
  if (!swap) {
    return res.status(404).json({ status: 'fail', message: 'Swap proposal not found.' });
  }

  const { action } = req.body;
  if (!['accept', 'reject', 'counter'].includes(action)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid action.' });
  }

  swap.status = action === 'accept' ? 'accepted' : 'rejected';
  res.status(200).json({ status: 'success', message: `Swap proposal ${swap.status}.`, data: { swap } });
});

testApp.use('/api/swaps', swapsRouter);
testApp.use(errorHandler);

describe('Integration Test: Barter / Swap Engine & Hashed Links', () => {
  it('should retrieve swap proposal details using hashed slug swp_...', async () => {
    const hashedSlug = encodeId('swap-801', 'swap');
    expect(hashedSlug.startsWith('swp_')).toBe(true);

    const token = createTestToken({ userId: 'user-alex' });
    const res = await request(testApp)
      .get(`/api/swaps/${hashedSlug}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.swap.id).toBe('swap-801');
    expect(res.body.data.swap.cash_top_up).toBe(200);
  });

  it('should accept swap proposal and update status to accepted', async () => {
    const hashedSlug = encodeId('swap-801', 'swap');
    const token = createTestToken({ userId: 'user-alex' });

    const res = await request(testApp)
      .patch(`/api/swaps/${hashedSlug}/respond`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'accept' });

    expect(res.status).toBe(200);
    expect(res.body.data.swap.status).toBe('accepted');
  });

  it('should reject invalid action strings', async () => {
    const hashedSlug = encodeId('swap-801', 'swap');
    const token = createTestToken({ userId: 'user-alex' });

    const res = await request(testApp)
      .patch(`/api/swaps/${hashedSlug}/respond`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'invalid_action' });

    expect(res.status).toBe(400);
  });
});
