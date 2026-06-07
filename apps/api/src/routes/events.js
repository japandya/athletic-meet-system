const express = require('express');
const { EventController } = require('../controllers');

const router = express.Router({ mergeParams: true });

// Event CRUD operations
router.post('/', EventController.createEvent);
router.get('/', EventController.getEventsByMeet);
router.get('/:eventId', EventController.getEventById);
router.put('/:eventId', EventController.updateEvent);
router.delete('/:eventId', EventController.deleteEvent);

// Event-specific routes
router.get('/:eventId/stats', EventController.getEventStats);

module.exports = router;
