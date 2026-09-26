const express = require('express');
const router = express.Router();
const EmergencyProfile = require('../models/EmergencyProfile');

// 1. GET /api/emergency/profile/:userId
router.get('/profile/:userId', async (req, res) => {
  try {
    const profile = await EmergencyProfile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ message: 'No emergency profile configured for this user account.' });
    }
    return res.json(profile);
  } catch (error) {
    console.error('[Emergency API Get Error]:', error);
    return res.status(500).json({ error: 'Failed to look up medical archive data.' });
  }
});

// 2. POST /api/emergency/profile (Atomic Upsert)
router.post('/profile', async (req, res) => {
  try {
    const {
      userId,
      name,
      preferredName,
      age,
      primaryLanguage,
      communicationPreferences,
      requiresInterpreter,
      bloodGroup,
      allergies,
      criticalMedicalInfo,
      currentMedications,
      medicalDevices,
      emergencyContact,
      emergencyContactRelation,
      secondaryContact,
      secondaryContactRelation,
      preferredHospital,
      primaryDoctor,
      doctorPhone
    } = req.body;

    if (!userId || !name || !emergencyContact || !bloodGroup) {
      return res.status(400).json({
        error: 'userId, name, emergencyContact, and bloodGroup are mandatory fields.'
      });
    }

    const updatedProfile = await EmergencyProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        name: name.trim(),
        preferredName: preferredName?.trim() || '',
        age: age?.trim() || '',
        primaryLanguage: primaryLanguage?.trim() || 'Indian Sign Language (ISL)',
        communicationPreferences: communicationPreferences || ['ISL', 'Written Notes'],
        requiresInterpreter: requiresInterpreter || 'If available',
        bloodGroup,
        allergies: allergies?.trim() || 'None declared.',
        criticalMedicalInfo: criticalMedicalInfo?.trim() || 'No existing conditions declared.',
        currentMedications: currentMedications?.trim() || 'None declared.',
        medicalDevices: medicalDevices?.trim() || 'None declared.',
        emergencyContact: emergencyContact.trim(),
        emergencyContactRelation: emergencyContactRelation?.trim() || 'Primary Contact',
        secondaryContact: secondaryContact?.trim() || '',
        secondaryContactRelation: secondaryContactRelation?.trim() || 'Secondary Contact',
        preferredHospital: preferredHospital?.trim() || '',
        primaryDoctor: primaryDoctor?.trim() || '',
        doctorPhone: doctorPhone?.trim() || ''
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(updatedProfile);
  } catch (error) {
    console.error('[Emergency API Post Error]:', error);
    return res.status(500).json({
      error: 'Failed to synchronize critical life-safety details with server vault.'
    });
  }
});

module.exports = router;