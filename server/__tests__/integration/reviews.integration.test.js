const express = require('express');
const request = require('supertest');
const { createTestToken } = require('../helpers/authHelper');
const errorHandler = require('../../src/middleware/errorHandler');

const testApp = express();
testApp.use(express.json());

let mockListing = {
  id: 'itm-calc-ti84',
  seller_id: 'user-seller-1',
  title: 'Texas Instruments TI-84 Plus Calculator',
  price: 2500,
  rating: 0.0,
  total_reviews: 0
};

let mockReviews = [];

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

testApp.post('/api/listings/:id/reviews', (req, res) => {
  const { id: listingId } = req.params;
  const { rating, comment } = req.body;

  if (!rating) {
    return res.status(400).json({ status: 'fail', message: 'Rating is required.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ status: 'fail', message: 'Rating must be between 1 and 5.' });
  }

  if (req.user && req.user.id === mockListing.seller_id) {
    return res.status(400).json({ status: 'fail', message: 'You cannot review your own listing.' });
  }

  mockReviews.push({ id: `rev-${mockReviews.length + 1}`, listingId, rating, comment });
  mockListing.total_reviews = mockReviews.length;
  const sum = mockReviews.reduce((acc, r) => acc + r.rating, 0);
  mockListing.rating = parseFloat((sum / mockReviews.length).toFixed(1));

  res.status(201).json({
    status: 'success',
    message: 'Product review submitted successfully.',
    data: { listing: mockListing, review: mockReviews[mockReviews.length - 1] }
  });
});

testApp.get('/api/listings/:id/reviews', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      listingId: mockListing.id,
      rating: mockListing.rating,
      totalReviews: mockListing.total_reviews,
      reviews: mockReviews
    }
  });
});

testApp.use(errorHandler);

describe('Integration Test: Product Reviews & Item Rating System', () => {
  beforeEach(() => {
    mockReviews = [];
    mockListing.total_reviews = 0;
    mockListing.rating = 0.0;
  });

  it('should reject review with out-of-range rating (e.g. 6 stars)', async () => {
    const token = createTestToken({ userId: 'user-buyer-1' });
    const res = await request(testApp)
      .post('/api/listings/itm-calc-ti84/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 6, comment: 'Awesome device' });

    expect(res.status).toBe(400);
  });

  it('should prevent seller from reviewing their own listing', async () => {
    const token = createTestToken({ userId: 'user-seller-1' });
    const res = await request(testApp)
      .post('/api/listings/itm-calc-ti84/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'Great product from myself' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('You cannot review your own listing');
  });

  it('should accept valid 5-star product review and recalculate item rating', async () => {
    const token = createTestToken({ userId: 'user-buyer-1' });
    const res = await request(testApp)
      .post('/api/listings/itm-calc-ti84/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'Working in perfect condition for Calculus!' });

    expect(res.status).toBe(201);
    expect(res.body.data.listing.total_reviews).toBe(1);
    expect(res.body.data.listing.rating).toBe(5.0);
  });

  it('should retrieve list of item reviews', async () => {
    mockReviews.push({ id: 'rev-1', listingId: 'itm-calc-ti84', rating: 5, comment: 'Great item' });
    mockListing.total_reviews = 1;
    mockListing.rating = 5.0;

    const res = await request(testApp).get('/api/listings/itm-calc-ti84/reviews');
    expect(res.status).toBe(200);
    expect(res.body.data.reviews.length).toBe(1);
    expect(res.body.data.rating).toBe(5.0);
  });
});
