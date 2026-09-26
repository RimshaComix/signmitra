const mongoose = require('mongoose');

const EmergencyProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // 1. Identity & Communication
  name: { type: String, required: true, trim: true },
  preferredName: { type: String, default: '', trim: true },
  age: { type: String, default: '', trim: true },
  primaryLanguage: { type: String, default: 'Indian Sign Language (ISL)', trim: true },
  communicationPreferences: [{ type: String }], // ['ISL', 'Written Notes', 'Visual Pointing']
  requiresInterpreter: { 
    type: String, 
    enum: ['Yes', 'No', 'If available'], 
    default: 'If available' 
  },

  // 2. Critical Medical Data
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], 
    required: true 
  },
  allergies: { type: String, default: 'None declared.', trim: true },
  criticalMedicalInfo: { type: String, default: 'No chronic conditions declared.', trim: true },
  currentMedications: { type: String, default: 'None declared.', trim: true },
  medicalDevices: { type: String, default: 'None declared.', trim: true },

  // 3. Contacts
  emergencyContact: { type: String, required: true, trim: true },
  emergencyContactRelation: { type: String, default: 'Primary Contact', trim: true },
  secondaryContact: { type: String, default: '', trim: true },
  secondaryContactRelation: { type: String, default: 'Secondary Contact', trim: true },

  // 4. Preferred Care
  preferredHospital: { type: String, default: '', trim: true },
  primaryDoctor: { type: String, default: '', trim: true },
  doctorPhone: { type: String, default: '', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('EmergencyProfile', EmergencyProfileSchema);