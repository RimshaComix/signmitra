const mongoose = require('mongoose');

const EmergencyProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true
  },
  name: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], 
    required: true 
  },
  allergies: { type: String, default: 'None declared.' },
  criticalMedicalInfo: { type: String, default: 'No chronic conditions declared.' }
}, { timestamps: true });

module.exports = mongoose.model('EmergencyProfile', EmergencyProfileSchema);
