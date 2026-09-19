const request = require('supertest');
const express = require('express');

jest.mock('../../src/config/db', () => {
  const store = new Map();
  const mockKnex = function (table) {
    return {
      where(query) {
        return {
          first() {
            const found = store.get(query.email || query.id);
            return Promise.resolve(found || null);
          },
          update(updates) {
            const found = store.get(query.email || query.id);
            if (found) Object.assign(found, updates);
            return Promise.resolve(1);
          }
        };
      },
      insert(record) {
        store.set(record.email, { ...record });
        store.set(record.id, { ...record });
        return Promise.resolve([1]);
      }
    };
  };
  mockKnex.testConnection = async () => ({ ok: true });
  return mockKnex;
});

const newsletterRoutes = require('../../src/routes/newsletter.routes');
const errorHandler = require('../../src/middleware/errorHandler');

describe('Unit Test: Newsletter Subscription API', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/newsletter', newsletterRoutes);
    app.use(errorHandler);
  });

  it('should reject subscription without an email address (400)', async () => {
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
  });

  it('should reject malformed email strings (400)', async () => {
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
  });

  it('should accept valid student email and enroll subscription (201)', async () => {
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'student.success@uc.edu.ph' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.email).toBe('student.success@uc.edu.ph');
  });

  it('should return 200 with friendly message for already subscribed emails', async () => {
    // First subscription
    await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'existing.member@uc.edu.ph' });

    // Second subscription attempt
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'existing.member@uc.edu.ph' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toMatch(/already subscribed/i);
  });
});
