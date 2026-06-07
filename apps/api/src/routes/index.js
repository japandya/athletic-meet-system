const express = require('express');
const authRoutes = require('./auth');
const meetRoutes = require('./meets');
const athleteRoutes = require('./athletes');
const eventRoutes = require('./events');
const registrationRoutes = require('./registrations');
const resultRoutes = require('./results');

const router = express.Router();

// Auth routes (no auth middleware required)
router.use('/auth', authRoutes);

// Protected routes (require auth middleware)
router.use('/meets', meetRoutes);
router.use('/meets/:meetId/athletes', athleteRoutes);
router.use('/meets/:meetId/events', eventRoutes);
router.use('/meets/:meetId/registrations', registrationRoutes);
router.use('/meets/:meetId/results', resultRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
