const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest, registerSchema, loginSchema } = require('../middleware/validation');

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

module.exports = router;