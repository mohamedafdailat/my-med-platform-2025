import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import { getFirestore } from 'firebase-admin/firestore';
import { access, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });

const parseServiceAccount = (rawValue, source) => {
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    throw new Error(`Invalid Firebase service account JSON from ${source}: ${error.message}`);
  }
};

const loadServiceAccount = async () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    return parseServiceAccount(decoded, 'FIREBASE_SERVICE_ACCOUNT_BASE64');
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT, 'FIREBASE_SERVICE_ACCOUNT');
  }

  const localServiceAccount = await readFile(new URL('./serviceAccountKey.json', import.meta.url), 'utf8');
  return parseServiceAccount(localServiceAccount, 'backend/serviceAccountKey.json');
};

const serviceAccount = await loadServiceAccount();

const firebaseAppConfig = {
  credential: admin.credential.cert(serviceAccount),
};

if (process.env.FIREBASE_DATABASE_URL) {
  firebaseAppConfig.databaseURL = process.env.FIREBASE_DATABASE_URL;
}

if (process.env.FIREBASE_STORAGE_BUCKET) {
  firebaseAppConfig.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
}

admin.initializeApp(firebaseAppConfig);

const db = getFirestore();
const app = express();

const parseOrigins = (value = '') =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.CORS_ORIGIN),
]);

const allowedOriginPatterns = [
  /^https:\/\/[a-z0-9-]+\.railway\.app$/i,
  /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/i,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
];

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || allowedOriginPatterns.some((pattern) => pattern.test(origin))) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'medplatform-backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'medplatform-backend',
    timestamp: new Date().toISOString(),
  });
});

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

app.post('/api/ai/xai-chat', authenticate, async (req, res) => {
  const xaiApiKey = process.env.XAI_API_KEY || process.env.XAI_API_KEY_2;

  if (!xaiApiKey) {
    return res.status(503).json({ error: 'xAI API key is not configured on the server.' });
  }

  const {
    model,
    messages,
    temperature,
    max_tokens,
    response_format,
  } = req.body;

  if (!model || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'model and messages are required.' });
  }

  try {
    const upstreamResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        response_format,
      }),
    });

    const responseText = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get('content-type') || 'application/json';
    return res.status(upstreamResponse.status).type(contentType).send(responseText);
  } catch (error) {
    console.error('xAI proxy error:', error);
    return res.status(502).json({ error: 'Failed to contact xAI service.' });
  }
});

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
const frontendBuildPath = path.resolve(__dirname, '../frontend/build');
const frontendIndexPath = path.join(frontendBuildPath, 'index.html');

try {
  await access(frontendIndexPath);
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }

    return res.sendFile(frontendIndexPath);
  });
} catch {
  console.warn('Frontend build not found. Run "npm run build" before serving the full platform.');
}

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
