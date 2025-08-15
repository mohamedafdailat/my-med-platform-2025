const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const verifyToken = require('../middleware/auth');

router.post('/chatbot', verifyToken, aiController.getChatbotResponse);
router.post('/tutor', verifyToken, aiController.getTutorExplanation);
router.get('/recommendations/:userId', verifyToken, aiController.getRecommendations);

module.exports = router;