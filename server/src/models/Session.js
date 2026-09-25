const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  domain: { 
    type: String, 
    enum: ['healthcare', 'banking', 'education'], 
    required: true 
  },
  intent: { 
    type: String, 
    required: true 
  },
  currentState: { 
    type: String, 
    enum: ['collecting', 'review', 'awaiting_confirmation', 'completed', 'cancelled'], 
    default: 'collecting',
    required: true 
  },
  historyStates: [{ 
    type: String 
  }], // Array history to drive exact step-by-step "BACK" operations
  entities: { 
    type: Map, 
    of: mongoose.Schema.Types.Mixed, 
    default: {} 
  }, // Flexible key-value collector for dynamic fields
  staffResponse: {
    selectedOption: { type: String },
    customText: { type: String },
    respondedAt: { type: Date }
  },
  // 🔒 Blueprint Section 13 Privacy Rule: Automatic lifecycle expiration (e.g., expires after 1 hour)
  expiresAt: { 
    type: Date, 
    required: true, 
    index: { expires: 0 } 
  } 
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
