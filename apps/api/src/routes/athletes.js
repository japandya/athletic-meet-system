const express = require('express');
const { AthleteController } = require('../controllers');

const router = express.Router({ mergeParams: true });

// Athlete CRUD operations
router.post('/', AthleteController.createAthlete);
router.get('/', AthleteController.getAthletesByMeet);
router.get('/:athleteId', AthleteController.getAthleteById);
router.put('/:athleteId', AthleteController.updateAthlete);
router.delete('/:athleteId', AthleteController.deleteAthlete);

// Athlete-specific routes
router.post('/auth', AthleteController.authenticateAthlete);
router.post('/access-codes/generate', AthleteController.generateAccessCodes);

module.exports = router;
