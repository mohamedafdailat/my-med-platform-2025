// Local browser testing only: no dotenv, service-account files, or production fallback.
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:19099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:18080';
const { createRequire } = require('node:module');
const path = require('node:path');
const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
const admin = backendRequire('firebase-admin');
const express = backendRequire('express');
const cors = backendRequire('cors');
(async () => {
  const firebase = admin.initializeApp({ projectId: 'demo-medplatform-audit' });
  const db = firebase.firestore();
  const auth = firebase.auth();
  const { createUserProfilesRouter } = await import('../backend/src/routes/userProfiles.js');
  const { createLearningContentRouter } = await import('../backend/src/routes/learningContent.js');
  const app = express();
  app.use(cors({ origin: ['http://127.0.0.1:3180', 'http://localhost:3180'] }));
  app.use(express.json());
  const authenticate = async (req, res, next) => {
    try { req.user = await auth.verifyIdToken(req.headers.authorization?.replace('Bearer ', ''), true); next(); }
    catch { res.status(401).json({ error: 'Authentification requise' }); }
  };
  app.use('/api/users', createUserProfilesRouter({ auth, db, authenticate }));
  app.use('/api/quizzes', createLearningContentRouter({ auth, db, authenticate }));
  app.listen(5180, '127.0.0.1', () => console.log('Local demo API: http://127.0.0.1:5180'));
})();
