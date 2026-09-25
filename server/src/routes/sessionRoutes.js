const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Session = require('../models/Session');

// 1. POST /api/sessions - Initialize a clean, stateful communication channel
router.post('/', async (req, res) => {
  try {
    const { domain, intent } = req.body;
    
    if (!domain || !intent) {
      return res.status(400).json({ error: 'Domain and Intent parameters are required.' });
    }

    // Set standard session lifecycle data minimization boundary (e.g., deletes in 1 hour)
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);

    const newSession = new Session({
      sessionId: crypto.randomUUID(),
      domain,
      intent,
      currentState: 'collecting',
      historyStates: [],
      entities: {},
      expiresAt: expirationTime
    });

    await newSession.save();
    return res.status(201).json(newSession);
  } catch (error) {
    console.error('[SignMitra API Error]:', error);
    return res.status(500).json({ error: 'Failed to initialize communication pipeline.' });
  }
});

// 2. GET /api/sessions/:id - Fetch an ongoing interaction state card
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) {
      return res.status(404).json({ error: 'Active session not found or expired.' });
    }
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Server database lookup failure.' });
  }
});

// 3. POST /api/sessions/:id/transition - Control State Machine updates (EDIT, BACK, SUBMIT)
router.post('/:id/transition', async (req, res) => {
  try {
    const { action, incomingEntities } = req.body;
    const session = await Session.findOne({ sessionId: req.params.id });

    if (!session) {
      return res.status(404).json({ error: 'Session unavailable.' });
    }

    // Store historical state snapshot to power structural "BACK" execution flows safely
    const previousState = session.currentState;

    if (action === 'SUBMIT_ENTITY') {
      if (incomingEntities) session.entities = incomingEntities;
      session.historyStates.push(previousState);
      session.currentState = 'review';
    } 
    else if (action === 'HANDOFF_STAFF') {
      session.historyStates.push(previousState);
      session.currentState = 'awaiting_confirmation';
    }
    else if (action === 'BACK') {
      if (session.historyStates.length > 0) {
        const nextTargetState = session.historyStates.pop();
        session.currentState = nextTargetState;
      }
    } 
    else if (action === 'CANCEL') {
      session.currentState = 'cancelled';
    }

    await session.save();
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process state machine transition.' });
  }
});

// 4. POST /api/sessions/:id/respond - Receive and parse Two-Way Staff Input choices
router.post('/:id/respond', async (req, res) => {
  try {
    const { selectedOption, customText } = req.body;
    const session = await Session.findOne({ sessionId: req.params.id });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found.' });
    }

    if (!selectedOption && !customText) {
      return res.status(400).json({ error: 'A valid staff response choice or custom text override must be provided.' });
    }

    session.historyStates.push(session.currentState);
    session.currentState = 'completed';
    session.staffResponse = {
      selectedOption: selectedOption || 'Custom Response Option',
      customText: customText || null,
      respondedAt: new Date()
    };

    await session.save();
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record employee feedback parameters.' });
  }
});

module.exports = router;
