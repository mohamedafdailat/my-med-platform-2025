import express from 'express';
import { createLearningContentRouter } from './src/routes/learningContent.js';
import { createMediaAccessRouter } from './src/routes/mediaAccess.js';
import { canReadSemester, getContentAccess, isContentSemester } from './src/routes/contentAccess.js';
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
import { createUserProfilesRouter, createRequireAdmin } from './src/routes/userProfiles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });

/* =========================================================
   Firebase Admin initialization
========================================================= */

const parseServiceAccount = (rawValue, source) => {
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    throw new Error(
      `Invalid Firebase service account JSON from ${source}`
    );
  }
};

const loadServiceAccount = async () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64'
    ).toString('utf8');

    return parseServiceAccount(decoded, 'FIREBASE_SERVICE_ACCOUNT_BASE64');
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return parseServiceAccount(
      process.env.FIREBASE_SERVICE_ACCOUNT,
      'FIREBASE_SERVICE_ACCOUNT'
    );
  }

  const localServiceAccount = await readFile(
    new URL('./serviceAccountKey.json', import.meta.url),
    'utf8'
  );

  return parseServiceAccount(
    localServiceAccount,
    'backend/serviceAccountKey.json'
  );
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

if (!admin.apps.length) {
  admin.initializeApp(firebaseAppConfig);
}

const db = getFirestore();
const app = express();

// Railway terminates HTTPS at its reverse proxy. Rate limits must use client IPs.
if (process.env.RAILWAY_ENVIRONMENT_ID) {
  app.set('trust proxy', 1);
}

/* =========================================================
   CORS + CSP configuration
========================================================= */

const parseOrigins = (value = '') =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5000',
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.CORS_ORIGIN),
]);

const allowedOriginPatterns = [
  /^https:\/\/[a-z0-9-]+\.railway\.app$/i,
  /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/i,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
];

const firebaseConnectSources = [
  'https://*.googleapis.com',
  'https://*.firebaseio.com',
  'wss://*.firebaseio.com',
  'https://*.firebasedatabase.app',
  'wss://*.firebasedatabase.app',
  'https://*.firebaseapp.com',
  'https://*.firebasestorage.app',
  'https://firebasestorage.googleapis.com',
  'https://storage.googleapis.com',
  'https://www.google-analytics.com',
  'https://analytics.google.com',
  'https://region1.google-analytics.com',
  'https://stats.g.doubleclick.net',
];

const firebaseImageSources = [
  'https://*.googleusercontent.com',
  'https://*.ggpht.com',
  'https://*.firebaseapp.com',
  'https://*.firebasestorage.app',
  'https://firebasestorage.googleapis.com',
  'https://storage.googleapis.com',
  'https://www.google-analytics.com',
  'https://www.googletagmanager.com',
];

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],

        connectSrc: [
          "'self'",
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5000',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:5000',
          ...firebaseConnectSources,
        ],

        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],

        formAction: ["'self'"],

        frameAncestors: ["'self'"],

        frameSrc: [
          "'self'",
          'https://*.firebaseapp.com',
          'https://accounts.google.com',
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
          'https://storage.googleapis.com',
          'https://firebasestorage.googleapis.com',
        ],

        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:',
          ...firebaseImageSources,
        ],

        manifestSrc: ["'self'"],

        mediaSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:',
          'https://*.firebasestorage.app',
          'https://firebasestorage.googleapis.com',
          'https://storage.googleapis.com',
        ],

        objectSrc: ["'none'"],

        scriptSrc: [
          "'self'",
          'https://www.gstatic.com',
          'https://www.googletagmanager.com',
          'https://cdnjs.cloudflare.com',
        ],

        scriptSrcAttr: ["'none'"],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],

        workerSrc: [
          "'self'",
          'blob:',
          'https://cdnjs.cloudflare.com',
        ],
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        allowedOriginPatterns.some((pattern) => pattern.test(origin))
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* =========================================================
   Health checks
========================================================= */

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

/* =========================================================
   Auth middleware
========================================================= */

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token, true);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error('Authentication rejected:', error.code || 'auth/invalid-token');
    return res.status(401).json({ error: 'Token invalide' });
  }
};

/* =========================================================
   AI helpers
========================================================= */

app.use('/api/users', createUserProfilesRouter({ auth: admin.auth(), db, authenticate }));
app.use('/api', createMediaAccessRouter({ auth: admin.auth(), db, authenticate,
  bucket: admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`),
}));
const requireAdmin = createRequireAdmin(admin.auth());

const getXaiApiKey = () => process.env.XAI_API_KEY || process.env.XAI_API_KEY_2;

const callXaiChatCompletion = async ({
  model,
  messages,
  temperature = 0.7,
  max_tokens = 500,
  response_format,
}) => {
  const xaiApiKey = getXaiApiKey();

  if (!xaiApiKey) {
    const error = new Error('xAI API key is not configured on the server.');
    error.status = 503;
    throw error;
  }

  const payload = {
    model,
    messages,
    temperature,
    max_tokens,
  };

  if (response_format) {
    payload.response_format = response_format;
  }

  const upstreamResponse = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${xaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await upstreamResponse.text();

  let data = null;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = responseText;
  }

  if (!upstreamResponse.ok) {
    const error = new Error(
      data?.error?.message ||
        data?.error ||
        `xAI provider request failed with status ${upstreamResponse.status}.`
    );
    error.status = upstreamResponse.status;
    error.data = data;
    throw error;
  }

  return data;
};

/* =========================================================
   AI routes
========================================================= */

/**
 * DocBuddy Chat
 * Public route. Uses xAI instead of OpenAI.
 */
// ==================== AI Chat - DocBuddy (xAI Grok) ====================
// ==================== AI Chat - DocBuddy (Groq) ====================
app.post('/api/ai/chat', async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  const GROQ_CHAT_MODEL =
    process.env.GROQ_CHAT_MODEL?.trim() || 'openai/gpt-oss-20b';

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required.' });
  }

  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();

    if (!GROQ_API_KEY) {
      return res.status(503).json({
        error: 'Cle API Groq non configuree sur le serveur.'
      });
    }

    const data = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_CHAT_MODEL,
        messages: [
          {
            role: 'system',
            content: [
              "Tu es DocBuddy, un assistant medical amical et pedagogique pour etudiants en medecine.",
              "Reponds en francais ou en arabe selon la langue de l'utilisateur.",
              "Sois clair, utile, encourageant et prudent. Ne jamais donner de diagnostic medical definitif."
            ].join(' ')
          },
          ...conversationHistory.slice(-12),
          { role: 'user', content: message }
        ],
        temperature: 0.75,
        max_tokens: 600,
      }),
    });

    if (!data.ok) {
      const errorText = await data.text();
      throw new Error(`Groq API error: ${data.status} - ${errorText}`);
    }

    const result = await data.json();
    const botResponse =
      result.choices?.[0]?.message?.content ||
      "Desole, je n'ai pas pu generer de reponse.";

    return res.json({
      response: botResponse,
      provider: 'groq',
      model: GROQ_CHAT_MODEL
    });

  } catch (error) {
    console.error('Groq Chat Error:', error.message);

    const responseBody = {
      error: "Impossible de contacter le service Groq pour le moment."
    };

    if (process.env.NODE_ENV === 'development') {
      responseBody.details = error.message;
    }

    return res.status(502).json(responseBody);
  }
});


app.post('/api/ai/xai-chat', authenticate, async (req, res) => {
  const xaiApiKey = getXaiApiKey();
  const defaultModel = process.env.XAI_CHAT_MODEL || 'grok-3-mini';

  if (!xaiApiKey) {
    return res.status(503).json({
      error: 'xAI API key is not configured on the server.',
    });
  }

  const {
    model,
    messages,
    temperature = 0.5,
    max_tokens = 2500,
    response_format,
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'messages are required.',
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const upstreamResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || defaultModel,
        messages,
        temperature,
        max_tokens,
        ...(response_format ? { response_format } : {}),
      }),
    });

    clearTimeout(timeout);

    const responseText = await upstreamResponse.text();

    let parsed = null;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = null;
    }

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error:
          parsed?.error?.message ||
          parsed?.error ||
          `xAI error ${upstreamResponse.status}`,
        details: parsed || responseText,
      });
    }

    return res.status(200).json(parsed || { raw: responseText });
  } catch (error) {
    console.error('xAI proxy error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'xAI request timeout. Le modèle met trop de temps à répondre.',
      });
    }

    return res.status(502).json({
      error: 'Failed to contact xAI service.',
      details: error.message,
    });
  }
});

/* =========================================================
   Quizzes
========================================================= */

app.use('/api/quizzes', createLearningContentRouter({ auth: admin.auth(), db, authenticate }));

/* =========================================================
   Videos
========================================================= */

app.get('/api/videos', authenticate, async (req, res) => {
  try {
    const contentAccess = await getContentAccess({ auth: admin.auth(), db, uid: req.user.uid });
    const snapshot = await db.collection('videos').get();
    const videos = snapshot.docs.filter(docSnap => canReadSemester(docSnap.data(), contentAccess)).map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    return res.status(200).json(videos);
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post(
  '/api/videos',
  authenticate,
  requireAdmin,
  [
    body('title').notEmpty().withMessage('Le titre est requis'),
    body('youtubeLink').notEmpty().withMessage('Le lien YouTube est requis'),
    body('semester').custom(isContentSemester).withMessage('Choisissez un semestre de 1 à 12 ou all'),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, youtubeLink, semester } = req.body;

      const videoIdMatch =
        youtubeLink.match(/[?&]v=([^&]+)/) ||
        youtubeLink.match(/youtu\.be\/([^?&]+)/) ||
        youtubeLink.match(/youtube\.com\/embed\/([^?&]+)/);

      const youtubeId = videoIdMatch ? videoIdMatch[1] : null;

      if (!youtubeId) {
        return res.status(400).json({ error: 'Lien YouTube invalide' });
      }

      const videoData = {
        semester,
        title,
        description: description || '',
        youtubeId,
        videoUrl: youtubeLink,
        type: 'youtube',
        createdAt: new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user.uid,
      };

      const docRef = await db.collection('videos').add(videoData);

      return res.status(201).json({
        id: docRef.id,
        ...videoData,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de la vidéo:", error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/* =========================================================
   Courses
========================================================= */

app.get('/api/courses', authenticate, async (req, res) => {
  try {
    const contentAccess = await getContentAccess({ auth: admin.auth(), db, uid: req.user.uid });
    const snapshot = await db.collection('courses').get();
    const courses = snapshot.docs.filter(docSnap => canReadSemester(docSnap.data(), contentAccess)).map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    return res.status(200).json(courses);
  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post(
  '/api/courses',
  authenticate,
  requireAdmin,
  [
    body('title').notEmpty().withMessage('Le titre est requis'),
    body('category').notEmpty().withMessage('La catégorie est requise'),
    body('semester').custom(isContentSemester).withMessage('Choisissez un semestre de 1 à 12 ou all'),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, lessons, category, semester } = req.body;

      const courseData = {
        semester,
        title,
        description: description || '',
        lessons: lessons || [],
        category,
        createdAt: new Date().toISOString(),
        uploadedBy: req.user.uid,
      };

      const docRef = await db.collection('courses').add(courseData);

      return res.status(201).json({
        id: docRef.id,
        ...courseData,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout du cours:", error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/* =========================================================
   Frontend build serving
========================================================= */

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
  console.warn(
    'Frontend build not found. Run "npm run build" before serving the full platform.'
  );
}

/* =========================================================
   Server start
========================================================= */

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Le port ${PORT} est déjà utilisé. Ferme l'ancien serveur Node ou change PORT.`
    );
  } else {
    console.error('Erreur serveur:', error);
  }

  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
