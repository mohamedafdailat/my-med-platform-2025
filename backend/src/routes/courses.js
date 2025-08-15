const express = require('express');
const { db } = require('../../src/config/firebase'); // Ajuste le chemin
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const courseDoc = await db.collection('courses').doc(req.params.id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    res.json({ id: courseDoc.id, ...courseDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;