const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const crypto = require('crypto');
const Session = require('../src/models/Session');
const sessionRoutes = require('../src/routes/sessionRoutes');

const app = express();
app.use(express.json());
app.use('/api/sessions', sessionRoutes);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/signmitra_test');
});

afterEach(async () => {
  await Session.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('SignMitra Core State Machine Edge-Case Verification', () => {

  // Edge Case 1: Verifying step regression logic
  test('Should successfully regress back to previous collecting state when executing BACK action', async () => {
    const historicalSession = new Session({
      sessionId: crypto.randomUUID(),
      domain: 'healthcare',
      intent: 'appointment_request',
      currentState: 'review',
      historyStates: ['collecting'],
      expiresAt: new Date(Date.now() + 60000)
    });
    await historicalSession.save();

    const res = await request(app)
      .post(`/api/sessions/${historicalSession.sessionId}/transition`)
      .send({ action: 'BACK' });

    expect(res.statusCode).toBe(200);
    expect(res.body.currentState).toBe('collecting');
    expect(res.body.historyStates.length).toBe(0);
  });

  // Edge Case 2: Pipeline termination
  test('Should instantly terminate interaction pipeline when CANCEL intercept is triggered', async () => {
    const activeSession = new Session({
      sessionId: crypto.randomUUID(),
      domain: 'banking',
      intent: 'card_problem',
      currentState: 'awaiting_confirmation',
      historyStates: ['collecting', 'review'],
      expiresAt: new Date(Date.now() + 60000)
    });
    await activeSession.save();

    const res = await request(app)
      .post(`/api/sessions/${activeSession.sessionId}/transition`)
      .send({ action: 'CANCEL' });

    expect(res.statusCode).toBe(200);
    expect(res.body.currentState).toBe('cancelled');
  });

  // Edge Case 3: Immutability guard on terminal states
  test('Should reject transitions on an already cancelled session', async () => {
    const cancelledSession = new Session({
      sessionId: crypto.randomUUID(),
      domain: 'banking',
      intent: 'card_problem',
      currentState: 'cancelled',
      expiresAt: new Date(Date.now() + 60000)
    });
    await cancelledSession.save();

    const res = await request(app)
      .post(`/api/sessions/${cancelledSession.sessionId}/transition`)
      .send({ action: 'BACK' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // Edge Case 4: Reverting when history stack is empty
  test('Should return 400 when attempting BACK on an empty history stack', async () => {
    const freshSession = new Session({
      sessionId: crypto.randomUUID(),
      domain: 'healthcare',
      intent: 'appointment_request',
      currentState: 'collecting',
      historyStates: [],
      expiresAt: new Date(Date.now() + 60000)
    });
    await freshSession.save();

    const res = await request(app)
      .post(`/api/sessions/${freshSession.sessionId}/transition`)
      .send({ action: 'BACK' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});