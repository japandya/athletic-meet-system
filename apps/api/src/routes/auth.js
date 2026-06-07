const express = require('express');
const { AuthController } = require('../controllers');

const router = express.Router();

router.post('/register', AuthController.registerOrganizer);
router.post('/login', AuthController.loginOrganizer);
router.get('/profile', AuthController.getProfile);

module.exports = router;
