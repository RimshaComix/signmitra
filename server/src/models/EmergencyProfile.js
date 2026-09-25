const mongoose = require('mongoose');

const EmergencyProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  emergencyContact: { 
    type: String, 
    required: true, 
    trim: true 
  },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], 
    required: true 
  },
  allergies: { 
    type: String, 
    default: 'None declared.', 
    trim: true 
  },
  criticalMedicalInfo: { 
    type: String, 
    default: 'No chronic conditions declared.', 
    trim: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('EmergencyProfile', EmergencyProfileSchema);