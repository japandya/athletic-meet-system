const express = require('express');
const { ResultController } = require('../controllers');

const router = express.Router({ mergeParams: true });

// Result CRUD operations
router.post('/', ResultController.createResult);
router.get('/event/:eventId', ResultController.getResultsByEvent);
router.get('/:resultId', ResultController.getResultById);
router.put('/:resultId', ResultController.updateResult);
router.delete('/:resultId', ResultController.deleteResult);

module.exports = router;
