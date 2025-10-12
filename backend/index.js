import express from 'express';
import cors from 'cors';
import { auth, db, storage } from './src/config/firebase.js';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import videoRoutes from './src/routes/videos.js';
import quizRoutes from './src/routes/quizzes.js';
import courseRoutes from './src/routes/courses.js';
import flashcardRoutes from './src/routes/flashcards.js';
import aiRoutes from './src/routes/ai.js';
import userRoutes from './src/routes/users.js';

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
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});