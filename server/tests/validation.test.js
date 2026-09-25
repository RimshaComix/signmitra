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
  const url = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/signmitra_test';
  await mongoose.connect(url);
});

afterEach(async () => {
  await Session.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('SignMitra Stateful Validation Engine Tests', () => {

  // Test Case 1: Session Initialization
  test('Should successfully initialize an active, stateful communication channel', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ domain: 'healthcare', intent: 'appointment_request' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('sessionId');
    expect(res.body.currentState).toBe('collecting');
    expect(res.body).toHaveProperty('expiresAt');
  });

  // Test Case 2: Validation rejection on missing parameters
  test('Should reject session initialization without domain or intent', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ domain: 'healthcare' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // Test Case 3: Entity Form Submissions
  test('Should transition status smoothly to REVIEW upon submitting dynamic entities', async () => {
    const initialSession = new Session({
      sessionId: crypto.randomUUID(),
      domain: 'healthcare',
      intent: 'appointment_request',
      currentState: 'collecting',
      expiresAt: new Date(Date.now() + 60000)
    });
    await initialSession.save();

    const res = await request(app)
      .post(`/api/sessions/${initialSession.sessionId}/transition`)
      .send({
        action: 'SUBMIT_ENTITY',
        incomingEntities: { doctor: 'Cardiologist', date: '2026-10-02' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.currentState).toBe('review');
    expect(res.body.entities.doctor).toBe('Cardiologist');
  });

  // Test Case 4: Staff Response in valid state
  test('Should accept staff response and reach completed state when awaiting confirmation', async () => {
    const session = new Session({
      sessionId: crypto.randomUUID(),
      domain: 'healthcare',
      intent: 'appointment_request',
      currentState: 'awaiting_confirmation',
      historyStates: ['collecting', 'review'],
      expiresAt: new Date(Date.now() + 60000)
    });
    await session.save();

    const res = await request(app)
      .post(`/api/sessions/${session.sessionId}/respond`)
      .send({ selectedOption: 'Confirm 10:30 AM Slot' });

    expect(res.statusCode).toBe(200);
    expect(res.body.currentState).toBe('completed');
    expect(res.body.staffResponse.selectedOption).toBe('Confirm 10:30 AM Slot');
  });

  // Test Case 5: Reject Staff Response in invalid state
  test('Should reject staff response if session is not in awaiting_confirmation state', async () => {
    const session = new Session({
      sessionId: crypto.randomUUID(),
      domain: 'healthcare',
      intent: 'appointment_request',
      currentState: 'collecting',
      expiresAt: new Date(Date.now() + 60000)
    });
    await session.save();

    const res = await request(app)
      .post(`/api/sessions/${session.sessionId}/respond`)
      .send({ selectedOption: 'Confirm 10:30 AM Slot' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // Test Case 6: Invalid Endpoint Handling
  test('Should return a 404 status if an invalid session id is provided', async () => {
    const res = await request(app)
      .post('/api/sessions/invalid-id-token/transition')
      .send({ action: 'BACK' });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});