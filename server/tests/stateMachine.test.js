// server/tests/stateMachine.test.js
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
afterEach(async () => { await Session.deleteMany({}); });
afterAll(async () => { await mongoose.connection.close(); });

describe('🧬 SignMitra Core State Machine Edge-Case Verification', () => {

  // Edge Case: Verifying the "BACK" button step regression logic works perfectly
  test('🔄 Should successfully regress back to previous collecting states when executing BACK action', async () => {
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
    expect(res.body.historyStates.length).toBe(0); // History must pop cleanly
  });

  // Edge Case: Ensuring Cancel flags drop active threads instantly
  test('🛑 Should instantly terminate interaction pipeline when CANCEL intercept is triggered', async () => {
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
});
