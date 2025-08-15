const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcardController');
const verifyToken = require('../middleware/auth');
const { validateRequest, flashcardSchema } = require('../middleware/validation');

router.get('/', verifyToken, flashcardController.getFlashcards);
router.post('/', verifyToken, validateRequest(flashcardSchema), flashcardController.uploadFlashcard);
router.put('/:flashcardId', verifyToken, validateRequest(flashcardSchema), flashcardController.updateFlashcard);
router.delete('/:flashcardId', verifyToken, flashcardController.deleteFlashcard);

module.exports = router;