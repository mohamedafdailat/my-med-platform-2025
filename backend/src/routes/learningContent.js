import express from 'express';

export const createLearningContentRouter = ({ auth, db, authenticate }) => {
  const router = express.Router();
  router.use(authenticate);
  const handle = (action) => async (req, res, next) => {
    try { await action(req, res); } catch (error) { next(error); }
  };
  const isAdmin = async (uid) => {
    const account = await auth.getUser(uid);
    return !account.disabled && account.customClaims?.role === 'admin';
  };
  const canRead = (quiz, uid, administrator) => administrator || quiz.creatorId === uid || quiz.visibility === 'shared';
  const list = async (req, res, onlyOwn = false) => {
    const ref = db.collection('quizzes');
    const administrator = !onlyOwn && await isAdmin(req.user.uid);
    const snapshots = administrator ? [await ref.get()] : await Promise.all([
      ref.where('creatorId', '==', req.user.uid).get(),
      ...(onlyOwn ? [] : [ref.where('visibility', '==', 'shared').get()]),
    ]);
    const docs = [...new Map(snapshots.flatMap(s => s.docs).map(d => [d.id, d])).values()];
    const quizzes = docs.filter(d => d.data().status !== 'inactive' && (!onlyOwn || d.data().type === 'ai-generated')).map(doc => {
      const { attempts, bestScore, ...data } = doc.data();
      return { ...data, id: doc.id };
    });
    res.json(quizzes);
  };
  router.get('/', handle((req, res) => list(req, res)));
  router.get('/generated', handle((req, res) => list(req, res, true)));
  router.post('/', handle(async (req, res) => {
    const { title, description, category, questions, difficulty = 'medium', course = '' } = req.body || {};
    if (!title || typeof title !== 'object' || !description || typeof description !== 'object' ||
        typeof category !== 'string' || !Array.isArray(questions) || !questions.length || questions.length > 100) {
      return res.status(400).json({ error: 'Quiz invalide.' });
    }
    const data = { title, description, category, questions, difficulty, course,
      creatorId: req.user.uid, visibility: 'private', type: 'ai-generated', status: 'active', createdAt: new Date() };
    const doc = await db.collection('quizzes').add(data);
    return res.status(201).json({ ...data, id: doc.id });
  }));
  router.post('/:id/attempt', handle(async (req, res) => {
    const answers = req.body?.answers;
    if (!Array.isArray(answers) || !answers.length || answers.length > 100 || answers.some(a => !a || typeof a !== 'object')) {
      return res.status(400).json({ error: 'Réponses invalides.' });
    }
    const ref = db.collection('quizzes').doc(req.params.id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return res.status(404).json({ error: 'Quiz introuvable.' });
    const quiz = snapshot.data();
    if (!canRead(quiz, req.user.uid, await isAdmin(req.user.uid))) return res.status(403).json({ error: 'Accès à ce quiz interdit.' });
    if (!Array.isArray(quiz.questions) || !quiz.questions.length) return res.status(400).json({ error: 'Ce quiz ne contient aucune question.' });
    const language = req.body.language === 'ar' ? 'ar' : 'fr';
    let correct = 0;
    // Iterate the questions, not supplied answers: duplicate answers cannot inflate scores.
    const results = quiz.questions.map((question, index) => {
      const id = question.id ?? String(index);
      const answer = answers.find(a => String(a.questionId) === String(id));
      const actual = answer?.userAnswer ?? null;
      const expected = question.type === 'short_answer' && typeof question.correctAnswer === 'object'
        ? question.correctAnswer?.[language] || question.correctAnswer?.fr : question.correctAnswer;
      const isCorrect = actual !== null && expected !== undefined && (question.type === 'short_answer'
        ? String(actual).trim().toLowerCase() === String(expected).trim().toLowerCase() : actual === expected);
      if (isCorrect) correct++;
      return { questionId: id, userAnswer: actual, isCorrect };
    });
    const score = Math.round(correct * 100 / quiz.questions.length);
    const attempt = { quizId: snapshot.id, userId: req.user.uid, score, answers: results, completedAt: new Date(),
      timeSpent: Math.min(28800, Math.max(0, Number(req.body.timeSpent) || 0)) };
    const doc = await db.collection('quiz_attempts').add(attempt);
    return res.json({ score, attemptId: doc.id });
  }));
  router.use((error, req, res, next) => {
    console.error('Learning content API failed:', error.code || error.name);
    res.status(500).json({ error: 'Impossible de traiter cette demande.' });
  });
  return router;
};
