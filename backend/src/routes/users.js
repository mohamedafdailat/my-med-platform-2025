const express = require('express');
const { db } = require('../../src/config/firebase'); // Ajuste le chemin
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;