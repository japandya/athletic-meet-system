const express = require('express');
const { RegistrationController } = require('../controllers');

const router = express.Router({ mergeParams: true });

// Registration CRUD operations
router.post('/', RegistrationController.createRegistration);
router.get('/event/:eventId', RegistrationController.getRegistrationsByEvent);
router.get('/:registrationId', RegistrationController.getRegistrationById);
router.put('/:registrationId', RegistrationController.updateRegistration);
router.delete('/:registrationId', RegistrationController.deleteRegistration);

module.exports = router;
