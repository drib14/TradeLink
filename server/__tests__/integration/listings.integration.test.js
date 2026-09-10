const express = require('express');
const request = require('supertest');
const { createTestToken } = require('../helpers/authHelper');
const { encodeId } = require('../../src/utils/idHasher');
const decodeParams = require('../../src/middleware/decodeParams');
const errorHandler = require('../../src/middleware/errorHandler');

const testApp = express();
testApp.use(express.json());

// Mock in-memory database of listings
const mockListings = [
  {
    id: 'list-101',
    title: 'Casio FX-991ES Plus 2nd Edition',
    description: 'Crisp scientific calculator with sliding hard case.',
    price: 850,
    original_srp: 1450,
    trade_mode: 'buy_sell',
    category: 'Electronics',
    condition: 'Like New',
    seller_id: 'user-alex',
    seller_name: 'Alex Rivera',
    seller_campus: 'UC Main',
    is_sold: false
  },
  {
    id: 'list-102',
    title: 'Nursing Duty Scrubs Set (Size M)',
    description: 'UC Banilad official college of nursing scrub suit.',
    price: 450,
    original_srp: 900,
    trade_mode: 'swap',
    category: 'Uniforms',
    condition: 'Gently Used',
    seller_id: 'user-maria',
    seller_name: 'Maria Santos',
    seller_campus: 'UC Banilad',
    is_sold: false
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
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      campus: decoded.campus,
      is_verified: true
    };
  } catch {
    req.user = null;
  }
  next();
});

// Mount listings router with decodeParams
const listingsRouter = express.Router();
decodeParams.bindRouter(listingsRouter);

listingsRouter.get('/', (req, res) => {
  let results = [...mockListings];
  if (req.query.campus) {
    results = results.filter((l) => l.seller_campus === req.query.campus);
  }
  if (req.query.tradeMode) {
    results = results.filter((l) => l.trade_mode === req.query.tradeMode);
  }
  res.status(200).json({ status: 'success', data: { listings: results, count: results.length } });
});

listingsRouter.get('/:id', (req, res) => {
  const listing = mockListings.find((l) => l.id === req.params.id);
  if (!listing) {
    return res.status(404).json({ status: 'fail', message: 'Listing not found.' });
  }
  res.status(200).json({ status: 'success', data: { listing } });
});

testApp.use('/api/listings', listingsRouter);
testApp.use(errorHandler);

describe('Integration Test: Marketplace Listings & Hashed URL Lookup', () => {
  it('should retrieve listing using internal ID list-101', async () => {
    const res = await request(testApp).get('/api/listings/list-101');
    expect(res.status).toBe(200);
    expect(res.body.data.listing.title).toContain('Casio');
  });

  it('should resolve listing seamlessly using hashed URL slug itm_...', async () => {
    const hashedSlug = encodeId('list-101', 'listing');
    expect(hashedSlug.startsWith('itm_')).toBe(true);

    const res = await request(testApp).get(`/api/listings/${hashedSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.listing.id).toBe('list-101');
    expect(res.body.data.listing.title).toContain('Casio');
  });

  it('should filter listings accurately by UC Campus (e.g. UC Banilad)', async () => {
    const res = await request(testApp).get('/api/listings?campus=UC Banilad');
    expect(res.status).toBe(200);
    expect(res.body.data.listings.length).toBe(1);
    expect(res.body.data.listings[0].seller_campus).toBe('UC Banilad');
  });

  it('should filter listings by trade mode (e.g. swap)', async () => {
    const res = await request(testApp).get('/api/listings?tradeMode=swap');
    expect(res.status).toBe(200);
    expect(res.body.data.listings.length).toBe(1);
    expect(res.body.data.listings[0].trade_mode).toBe('swap');
  });

  it('should return 404 for non-existent hashed or unhashed listing ID', async () => {
    const nonExistentHashed = encodeId('list-999999', 'listing');
    const res = await request(testApp).get(`/api/listings/${nonExistentHashed}`);
    expect(res.status).toBe(404);
  });
});
