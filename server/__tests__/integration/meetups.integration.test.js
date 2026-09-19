const express = require('express');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createTestToken } = require('../helpers/authHelper');
const { encodeId } = require('../../src/utils/idHasher');
const decodeParams = require('../../src/middleware/decodeParams');
const errorHandler = require('../../src/middleware/errorHandler');

const testApp = express();
testApp.use(express.json());

// In-memory test meetup state
let mockMeetup = {
  id: 'mtp-501',
  listing_id: 'list-101',
  listing_title: 'Casio Calculator',
  seller_id: 'user-alex',
  buyer_id: 'user-ken',
  campus: 'UC Main',
  landmark_spot: 'Main Lobby Guard Post',
  scheduled_time: new Date(Date.now() + 3600000).toISOString(),
  final_price: 750,
  verification_code_hash: '', // will set in beforeAll
  status: 'scheduled'
};

beforeAll(async () => {
  mockMeetup.verification_code_hash = await bcrypt.hash('4829', 10);
});

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

const meetupsRouter = express.Router();
decodeParams.bindRouter(meetupsRouter);

meetupsRouter.get('/:id', (req, res) => {
  if (req.params.id !== mockMeetup.id) {
    return res.status(404).json({ status: 'fail', message: 'Meetup transaction not found.' });
  }
  res.status(200).json({ status: 'success', data: { meetup: mockMeetup } });
});

meetupsRouter.post('/:id/verify', async (req, res) => {
  if (req.params.id !== mockMeetup.id) {
    return res.status(404).json({ status: 'fail', message: 'Meetup not found.' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ status: 'fail', message: 'Verification code is required.' });
  }

  const isMatch = await bcrypt.compare(String(code), mockMeetup.verification_code_hash);
  if (!isMatch) {
    return res.status(400).json({ status: 'fail', message: 'Invalid verification code.' });
  }

  mockMeetup.status = 'completed';
  res.status(200).json({ status: 'success', message: 'Meetup successfully verified and completed!', data: { meetup: mockMeetup } });
});

testApp.use('/api/meetups', meetupsRouter);
testApp.use(errorHandler);

describe('Integration Test: Campus Meetups & Verification Confirmation', () => {
  it('should retrieve meetup details using hashed token mtp_...', async () => {
    const hashedSlug = encodeId('mtp-501', 'meetup');
    expect(hashedSlug.startsWith('mtp_')).toBe(true);

    const token = createTestToken({ userId: 'user-alex' });
    const res = await request(testApp)
      .get(`/api/meetups/${hashedSlug}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.meetup.id).toBe('mtp-501');
    expect(res.body.data.meetup.landmark_spot).toBe('Main Lobby Guard Post');
  });

  it('should reject incorrect 4-digit OTP code', async () => {
    const hashedSlug = encodeId('mtp-501', 'meetup');
    const token = createTestToken({ userId: 'user-alex' });

    const res = await request(testApp)
      .post(`/api/meetups/${hashedSlug}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '0000' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid verification code');
  });

  it('should complete meetup on correct 4-digit verification code (4829)', async () => {
    const hashedSlug = encodeId('mtp-501', 'meetup');
    const token = createTestToken({ userId: 'user-alex' });

    const res = await request(testApp)
      .post(`/api/meetups/${hashedSlug}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '4829' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.meetup.status).toBe('completed');
  });
});
