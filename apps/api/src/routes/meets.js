const express = require('express');
const { MeetController } = require('../controllers');

const router = express.Router();

// Meet CRUD operations
router.post('/', MeetController.createMeet);
router.get('/', MeetController.getAllMeets);
router.get('/:meetId', MeetController.getMeetById);
router.put('/:meetId', MeetController.updateMeet);

// Meet-specific routes
router.get('/:meetId/dashboard', MeetController.getDashboard);
router.get('/:meetId/leaderboard', MeetController.getLeaderboard);

module.exports = router;
