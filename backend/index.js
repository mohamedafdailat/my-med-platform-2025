const express = require('express');
const cors = require('cors');
const { auth, db, storage } = require('./src/config/firebase.js');
const dotenv = require('dotenv');
const authRoutes = require('./src/routes/auth');
const videoRoutes = require('./src/routes/videos');
const quizRoutes = require('./src/routes/quizzes');
const courseRoutes = require('./src/routes/courses');
const flashcardRoutes = require('./src/routes/flashcards');
const aiRoutes = require('./src/routes/ai');
const userRoutes = require('./src/routes/users');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur est survenue sur le serveur.' });
});

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur MedPlatform Maroc API' });
});
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});