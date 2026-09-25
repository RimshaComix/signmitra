const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const crypto = require('crypto');

const Session = require('../src/models/Session');
const sessionRoutes = require('../src/routes/sessionRoutes');

const app = express();
app.use(express.json());
app.use('/api/sessions', sessionRoutes);

// Establish clean sandbox connections before running tests
beforeAll(async () => {
  const url = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/signmitra_test';
  await mongoose.connect(url);
});

// Clear validation table records between test sweeps to prevent cross-contamination
afterEach(async () => {
  await Session.deleteMany({});
});

// Safely close connection channels when testing finishes
afterAll(async () => {
  await mongoose.connection.close();
});

describe('⚙️ SignMitra Stateful Validation Engine Tests', () => {
  
  // Test Case 1: Session Initialization
  test('✅ Should successfully initialize an active, stateful communication channel', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ domain: 'healthcare', intent: 'appointment_request' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('sessionId');
    expect(res.body.currentState).toBe('collecting');
  });

  // Test Case 2: Entity Form Submissions
  test('✅ Should transition status parameters smoothly to REVIEW upon submitting dynamic entities', async () => {
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

  // Test Case 3: Error Checking & Invalid Endpoint Handling
  test('❌ Should return a strict 404 status log if an invalid session id is provided', async () => {
    const res = await request(app)
      .post('/api/sessions/invalid-id-token/transition')
      .send({ action: 'BACK' });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
