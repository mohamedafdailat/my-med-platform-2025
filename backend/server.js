import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import { getFirestore } from 'firebase-admin/firestore';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();
const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Authentication Middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).send({ error: 'Authentification requise' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).send({ error: 'Token invalide' });
  }
};

// Get all quizzes
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzesRef = db.collection('quizzes');
    const q = quizzesRef.where('status', '==', 'active').orderBy('createdAt', 'desc').limit(50);
    const snapshot = await q.get();
    const quizzes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(quizzes);
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz:', error);
    if (error.code === 9 && error.details?.includes('requires an index')) {
      res.status(500).send({ error: 'Index Firestore requis. Veuillez créer l\'index via le lien fourni dans les logs.' });
    } else {
      res.status(500).send({ error: 'Erreur serveur' });
    }
  }
});

// Get AI-generated quizzes
app.get('/api/quizzes/generated', authenticate, async (req, res) => {
  try {
    const quizzesRef = db.collection('quizzes');
    const q = quizzesRef
      .where('type', '==', 'ai-generated')
      .where('creatorId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(50);
    const snapshot = await q.get();
    const quizzes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(quizzes);
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz générés:', error);
    if (error.code === 9 && error.details?.includes('requires an index')) {
      res.status(500).send({ error: 'Index Firestore requis. Veuillez créer l\'index via le lien fourni dans les logs.' });
    } else {
      res.status(500).send({ error: 'Erreur serveur' });
    }
  }
});

// Save quiz
app.post('/api/quizzes', authenticate, [
  body('title').isObject().withMessage('Le titre doit être un objet avec fr et ar'),
  body('description').isObject().withMessage('La description doit être un objet avec fr et ar'),
  body('category').isString().notEmpty().withMessage('La catégorie est requise'),
  body('questions').isArray({ min: 1 }).withMessage('Au moins une question est requise'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send({ errors: errors.array() });

  try {
    const quizData = {
      ...req.body,
      type: 'ai-generated',
      status: 'active',
      creatorId: req.user.uid,
      createdAt: new Date(),
      attempts: [],
      bestScore: 0,
    };
    const docRef = await db.collection('quizzes').add(quizData);
    res.status(201).send({ id: docRef.id, ...quizData });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du quiz:', error);
    res.status(500).send({ error: 'Erreur serveur' });
  }
});

// Submit quiz attempt
app.post('/api/quizzes/:id/attempt', authenticate, [
  body('answers').isArray({ min: 1 }).withMessage('Les réponses sont requises'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send({ errors: errors.array() });

  try {
    const docRef = db.collection('quizzes').doc(req.params.id);
    const quizSnap = await docRef.get();
    if (!quizSnap.exists) return res.status(404).send({ error: 'Quiz non trouvé' });

    const quiz = quizSnap.data();
    let score = 0;
    const updatedAnswers = req.body.answers.map((answer) => {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      const isCorrect =
        question.type === 'multiple_choice'
          ? answer.userAnswer === question.correctAnswer
          : question.type === 'true_false'
          ? question.correctAnswer === answer.userAnswer
          : question.correctAnswer.fr?.toLowerCase() === answer.userAnswer?.toLowerCase();
      if (isCorrect) score += 100 / quiz.questions.length;
      return { ...answer, isCorrect };
    });

    const newAttempt = {
      userId: req.user.uid,
      score,
      completedAt: new Date(),
      answers: updatedAnswers,
    };

    await docRef.update({
      attempts: [...(quiz.attempts || []), newAttempt],
      bestScore: Math.max(quiz.bestScore || 0, score),
    });

    res.status(200).send({ score });
  } catch (error) {
    console.error('Erreur lors de la soumission de la tentative:', error);
    res.status(500).send({ error: 'Erreur serveur' });
  }
});

// Route pour ajouter une vidéo
app.post('/api/videos', authenticate, [
  body('title').notEmpty().withMessage('Le titre est requis'),
  body('youtubeLink').notEmpty().withMessage('Le lien YouTube est requis'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send({ errors: errors.array() });

  try {
    const { title, description, youtubeLink } = req.body;
    const videoIdMatch = youtubeLink.match(/[?&]v=([^&]+)/) || youtubeLink.match(/youtube\.com\/embed\/([^?]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (!videoId) return res.status(400).send({ error: 'Lien YouTube invalide' });

    const videoData = {
      title,
      description: description || '',
      youtubeId: videoId,
      createdAt: new Date().toISOString(),
      uploadedBy: req.user.uid,
    };

    const docRef = await db.collection('videos').add(videoData);
    res.status(201).send({ id: docRef.id, ...videoData });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la vidéo:', error);
    res.status(500).send({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les vidéos
app.get('/api/videos', async (req, res) => {
  try {
    const snapshot = await db.collection('videos').get();
    const videos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(videos);
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos:', error);
    res.status(500).send({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les cours
app.get('/api/courses', async (req, res) => {
  try {
    const snapshot = await db.collection('courses').get();
    const courses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(courses);
  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error);
    res.status(500).send({ error: 'Erreur serveur' });
  }
});

// Route pour ajouter un cours
app.post('/api/courses', authenticate, [
  body('title').notEmpty().withMessage('Le titre est requis'),
  body('category').notEmpty().withMessage('La catégorie est requise'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send({ errors: errors.array() });

  try {
    const { title, description, lessons, category } = req.body;
    const courseData = {
      title,
      description: description || '',
      lessons: lessons || 0,
      category,
      createdAt: new Date().toISOString(),
      uploadedBy: req.user.uid,
    };

    const docRef = await db.collection('courses').add(courseData);
    res.status(201).send({ id: docRef.id, ...courseData });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du cours:', error);
    res.status(500).send({ error: 'Erreur serveur' });
  }
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});