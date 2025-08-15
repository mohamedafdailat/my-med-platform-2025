const { getCollection, createDocument, updateDocument, deleteDocument } = require('../utils/database');

const getFlashcards = async (req, res) => {
  try {
    const flashcards = await getCollection('flashcards');
    res.status(200).json(flashcards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadFlashcard = async (req, res) => {
  try {
    const { front, back } = req.body;
    const flashcard = await createDocument('flashcards', { front, back });
    res.status(201).json(flashcard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateFlashcard = async (req, res) => {
  try {
    const { flashcardId } = req.params;
    const { front, back } = req.body;
    await updateDocument('flashcards', flashcardId, { front, back });
    res.status(200).json({ message: 'Flashcard mise à jour' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteFlashcard = async (req, res) => {
  try {
    const { flashcardId } = req.params;
    await deleteDocument('flashcards', flashcardId);
    res.status(200).json({ message: 'Flashcard supprimée' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getFlashcards, uploadFlashcard, updateFlashcard, deleteFlashcard };