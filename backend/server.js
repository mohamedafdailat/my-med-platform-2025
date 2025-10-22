import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

// Configuration Firebase pour Railway
let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  // En production (Railway), utiliser les variables d'environnement
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
} else {
  // En développement local, utiliser le fichier JSON
  try {
    serviceAccount = JSON.parse(
      await readFile(new URL('./serviceAccountKey.json', import.meta.url), 'utf8')
    );
  } catch (error) {
    console.error('❌ Erreur de lecture du fichier serviceAccountKey.json:', error.message);
    console.log('⚠️  Assurez-vous que le fichier existe en développement local');
    process.exit(1);
  }
}

// Initialiser Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialisé avec succès');
} catch (error) {
  console.error('❌ Erreur d\'initialisation de Firebase Admin:', error.message);
  process.exit(1);
}

const db = getFirestore();
const app = express();

// CORS Configuration - Support pour Railway
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  /\.railway\.app$/, // Permet tous les domaines Railway
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Origine bloquée par CORS: ${origin}`);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(helmet({
  contentSecurityPolicy: false, // Désactiver si vous utilisez des iframes
}));

// Rate limiting - Plus permissif en développement
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use(limiter);

// Health check endpoint pour Railway
app.get('/health', (req, res) => {
  const firebaseConfigured = !!(
    process.env.FIREBASE_PROJECT_ID || 
    serviceAccount?.project_id
  );
  
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    firebase_configured: firebaseConfigured,
    firebase_project: process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id || 'unknown'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Medical Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /health',
      'GET /api/quizzes',
      'GET /api/quizzes/generated',
      'POST /api/quizzes',
      'POST /api/quizzes/:id/attempt',
      'GET /api/videos',
      'POST /api/videos',
      'GET /api/courses',
      'POST /api/courses'
    ]
  });
});

// Authentication Middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentification requise', details: 'Aucun token fourni' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentification requise', details: 'Format de token invalide' });
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error.message);
    res.status(401).json({ 
      error: 'Token invalide', 
      details: process.env.NODE_ENV === 'production' ? 'Authentification échouée' : error.message 
    });
  }
};

// Get all quizzes
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzesRef = db.collection('quizzes');
    const q = quizzesRef.where('status', '==', 'active').orderBy('createdAt', 'desc').limit(50);
    const snapshot = await q.get();
    const quizzes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(quizzes);
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz:', error);
    if (error.code === 9 && error.details?.includes('requires an index')) {
      res.status(500).json({ 
        error: 'Index Firestore requis', 
        details: 'Créez l\'index Firestore nécessaire',
        indexUrl: error.details.match(/https:\/\/[^\s]+/)?.[0]
      });
    } else {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
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
    res.status(200).json(quizzes);
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz générés:', error);
    if (error.code === 9 && error.details?.includes('requires an index')) {
      res.status(500).json({ 
        error: 'Index Firestore requis',
        indexUrl: error.details.match(/https:\/\/[^\s]+/)?.[0]
      });
    } else {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
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
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
    res.status(201).json({ id: docRef.id, ...quizData });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du quiz:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Submit quiz attempt
app.post('/api/quizzes/:id/attempt', authenticate, [
  body('answers').isArray({ min: 1 }).withMessage('Les réponses sont requises'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const docRef = db.collection('quizzes').doc(req.params.id);
    const quizSnap = await docRef.get();
    
    if (!quizSnap.exists) {
      return res.status(404).json({ error: 'Quiz non trouvé' });
    }

    const quiz = quizSnap.data();
    let score = 0;
    const updatedAnswers = req.body.answers.map((answer) => {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      
      if (!question) {
        return { ...answer, isCorrect: false };
      }
      
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

    res.status(200).json({ score, answers: updatedAnswers });
  } catch (error) {
    console.error('Erreur lors de la soumission de la tentative:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Route pour ajouter une vidéo
app.post('/api/videos', authenticate, [
  body('title').notEmpty().withMessage('Le titre est requis'),
  body('youtubeLink').notEmpty().withMessage('Le lien YouTube est requis'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, youtubeLink } = req.body;
    const videoIdMatch = youtubeLink.match(/[?&]v=([^&]+)/) || youtubeLink.match(/youtube\.com\/embed\/([^?]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Lien YouTube invalide' });
    }

    const videoData = {
      title,
      description: description || '',
      youtubeId: videoId,
      createdAt: new Date().toISOString(),
      uploadedBy: req.user.uid,
    };

    const docRef = await db.collection('videos').add(videoData);
    res.status(201).json({ id: docRef.id, ...videoData });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la vidéo:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Route pour récupérer les vidéos
app.get('/api/videos', async (req, res) => {
  try {
    const snapshot = await db.collection('videos').get();
    const videos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(videos);
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Route pour récupérer les cours
app.get('/api/courses', async (req, res) => {
  try {
    const snapshot = await db.collection('courses').get();
    const courses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(courses);
  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Route pour ajouter un cours
app.post('/api/courses', authenticate, [
  body('title').notEmpty().withMessage('Le titre est requis'),
  body('category').notEmpty().withMessage('La catégorie est requise'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
    res.status(201).json({ id: docRef.id, ...courseData });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du cours:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Erreur serveur', 
    message: process.env.NODE_ENV === 'production' ? 'Une erreur est survenue' : err.message 
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`📝 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id || 'local'}`);
  console.log(`🌍 CORS autorisé pour:`, allowedOrigins);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt gracieux du serveur...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt gracieux du serveur...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});