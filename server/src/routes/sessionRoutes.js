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

    // Set standard session lifecycle data minimization boundary (1 hour TTL)
    const expirationTime = new Date(Date.now() + 60 * 60 * 1000);

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

// 3. POST /api/sessions/:id/transition - Control State Machine updates
router.post('/:id/transition', async (req, res) => {
  try {
    const { action, incomingEntities } = req.body;
    const session = await Session.findOne({ sessionId: req.params.id });

    if (!session) {
      return res.status(404).json({ error: 'Session unavailable.' });
    }

    // Guard: Prevent transitioning cancelled or completed sessions
    if (['completed', 'cancelled'].includes(session.currentState)) {
      return res.status(400).json({ error: `Cannot transition a ${session.currentState} session.` });
    }

    const previousState = session.currentState;

    switch (action) {
      case 'SUBMIT_ENTITY':
        if (incomingEntities) session.entities = incomingEntities;
        session.historyStates.push(previousState);
        session.currentState = 'review';
        break;

      case 'HANDOFF_STAFF':
        session.historyStates.push(previousState);
        session.currentState = 'awaiting_confirmation';
        break;

      case 'BACK':
        if (session.historyStates.length > 0) {
          session.currentState = session.historyStates.pop();
        } else {
          return res.status(400).json({ error: 'No previous state to return to.' });
        }
        break;

      case 'CANCEL':
        session.currentState = 'cancelled';
        break;

      default:
        return res.status(400).json({ error: `Invalid action '${action}' provided.` });
    }

    await session.save();
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process state machine transition.' });
  }
});

// 4. POST /api/sessions/:id/respond - Receive and parse Staff Input choices
router.post('/:id/respond', async (req, res) => {
  try {
    const { selectedOption, customText } = req.body;
    const session = await Session.findOne({ sessionId: req.params.id });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found.' });
    }

    // Guard: Only allow responses during awaiting_confirmation
    if (session.currentState !== 'awaiting_confirmation') {
      return res.status(400).json({ 
        error: `Cannot record response while session is in '${session.currentState}' state.` 
      });
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