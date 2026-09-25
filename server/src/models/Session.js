const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  domain: { 
    type: String, 
    enum: ['healthcare', 'banking', 'education'], 
    required: true 
  },
  intent: { 
    type: String, 
    required: true,
    trim: true 
  },
  currentState: { 
    type: String, 
    enum: ['collecting', 'review', 'awaiting_confirmation', 'completed', 'cancelled'], 
    default: 'collecting',
    required: true 
  },
  historyStates: [{ 
    type: String 
  }],
  entities: { 
    type: Map, 
    of: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  staffResponse: {
    selectedOption: { type: String, trim: true },
    customText: { type: String, trim: true },
    respondedAt: { type: Date }
  },
  expiresAt: { 
    type: Date, 
    required: true, 
    index: { expires: 0 } 
  } 
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);