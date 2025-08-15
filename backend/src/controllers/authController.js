const { auth, db } = require('../config/firebase');
const { createDocument } = require('../utils/database');

const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });
    await createDocument('users', {
      id: userRecord.uid,
      email,
      displayName,
      role: 'student',
      stats: { coursesCompleted: 0, quizzesTaken: 0, flashcardsMastered: 0, videosWatched: 0, studyHours: 0 },
      progress: { weekly: [0, 0, 0, 0, 0], monthly: [0, 0, 0, 0], categories: { anatomy: 0, physiology: 0, pharmacology: 0 } },
      createdAt: db.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ uid: userRecord.uid, email, displayName });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    res.json({ message: 'Connexion gérée côté client' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { register, login };