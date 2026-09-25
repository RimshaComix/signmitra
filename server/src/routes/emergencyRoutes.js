const express = require('express');
const router = express.Router();
const EmergencyProfile = require('../models/EmergencyProfile');

// 1. GET /api/emergency/profile/:userId - Securely fetch critical medical profile details
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

// 2. POST /api/emergency/profile - Save or fully overwrite an emergency record layer (Upsert operational profile)
router.post('/profile', async (req, res) => {
  try {
    const { userId, name, emergencyContact, bloodGroup, allergies, criticalMedicalInfo } = req.body;

    if (!userId || !name || !emergencyContact || !bloodGroup) {
      return res.status(400).json({ error: 'userId, name, emergencyContact, and bloodGroup are mandatory validation fields.' });
    }

    // Runs a secure atomic look-and-replace update logic (Upsert operation rule)
    const updatedProfile = await EmergencyProfile.findOneAndUpdate(
      { userId },
      {
        name,
        emergencyContact,
        bloodGroup,
        allergies: allergies || 'None declared.',
        criticalMedicalInfo: criticalMedicalInfo || 'No existing conditions declared.'
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json(updatedProfile);
  } catch (error) {
    console.error('[Emergency API Post Error]:', error);
    return res.status(500).json({ error: 'Failed to synchronize critical life-safety details with server vault.' });
  }
});

module.exports = router;
