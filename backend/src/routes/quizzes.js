const express = require('express');
const { db } = require('../../src/config/firebase'); // Ajuste le chemin
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const quizDoc = await db.collection('quizzes').doc(req.params.id).get();
    if (!quizDoc.exists) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }
    res.json({ id: quizDoc.id, ...quizDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;