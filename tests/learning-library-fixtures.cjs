// Reproducible UI fixtures for local emulators only. No dotenv or service-account files.
// Run integration tests first. This preserves their content, including api-private,
// but resets audit-student's quiz attempts for deterministic 0% / 80% examples.
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');

const projectId = 'demo-medplatform-audit';
const password = 'LocalOnly-123456!';
const ids = {
  quizzes: {
    private: 'learning-private', sharedAI: 'learning-shared-ai', predefined: 'learning-predefined',
    otherPrivate: 'learning-other-private', semester2: 'learning-s2', inactive: 'learning-inactive',
  },
  flashcards: {
    private: 'learning-private', shared: 'learning-shared', legacyItems: 'learning-legacy-items',
    legacyFlashcards: 'learning-legacy-flashcards', otherPrivate: 'learning-other-private',
    semester2: 'learning-s2', inactive: 'learning-inactive',
  },
};

async function seedLearningLibrary() {
  // These cannot be redirected through environment variables or CLI parameters.
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:19099';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:18080';
  assert.equal(projectId, 'demo-medplatform-audit');
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:19099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18080');
  const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
  const admin = backendRequire('firebase-admin');
  const app = admin.initializeApp({ projectId }, `learning-library-fixtures-${Date.now()}`);
  const db = app.firestore();
  const auth = app.auth();
  const now = Date.now();
  const ago = days => admin.firestore.Timestamp.fromMillis(now - days * 86400000);

  try {
    for (const [uid, fullName, role, semester] of [
      ['audit-student', 'Salma Benali', 'student', '1'],
      ['audit-other', 'Yassine El Idrissi', 'student', '2'],
      ['audit-teacher', 'Enseignant Démonstration', 'teacher', '2'],
      ['audit-admin', 'Administration Démonstration', 'admin', '1'],
    ]) {
      const identity = { email: `${uid}@example.test`, password, displayName: fullName, disabled: false };
      try { await auth.getUser(uid); await auth.updateUser(uid, identity); }
      catch (error) {
        if (error.code !== 'auth/user-not-found') throw error;
        await auth.createUser({ uid, ...identity });
      }
      await auth.setCustomUserClaims(uid, { role, ...(role === 'admin' ? { adminAccessVersion: 1 } : {}) });
      await db.collection('users').doc(uid).set({
        uid, email: identity.email, fullName, role, semester, unlimitedAccess: false,
        subscriptionStatus: 'paid', subscription: { status: 'paid' },
      }, { merge: true });
    }

    const questions = Array.from({ length: 5 }, (_, index) => ({
      id: `q${index + 1}`, type: 'true_false', correctAnswer: true,
      question: { fr: `Question de démonstration ${index + 1} : une révision régulière aide à apprendre.`, ar: `سؤال تجريبي ${index + 1}: تساعد المراجعة المنتظمة على التعلم.` },
      explanation: { fr: 'Cette question sert uniquement au parcours de démonstration.', ar: 'هذا السؤال مخصص للمسار التجريبي فقط.' },
    }));
    const quizBase = {
      description: { fr: 'Un entraînement de démonstration pour réviser à votre rythme.', ar: 'تدريب تجريبي للمراجعة حسب وتيرتك.' },
      questions, status: 'active', difficulty: 'medium', category: 'anatomy', course: 'Anatomie générale',
      creatorId: 'audit-admin', visibility: 'shared', semester: '1', createdAt: ago(2), type: 'predefined',
    };
    const quizzes = [
      [ids.quizzes.private, { title: 'Quiz personnel : anatomie', creatorId: 'audit-student', visibility: 'private', type: 'ai-generated', difficulty: 'easy', createdAt: ago(0) }],
      [ids.quizzes.sharedAI, { title: { fr: 'Les repères du cœur', ar: 'معالم القلب' }, type: 'ai-generated', category: 'cardiology', difficulty: 'hard', createdAt: ago(1) }],
      [ids.quizzes.predefined, { title: { fr: 'Les fondamentaux en pharmacologie', ar: 'أساسيات علم الأدوية' }, category: 'pharmacology', semester: 'all', difficulty: 'medium', createdAt: ago(3) }],
      [ids.quizzes.otherPrivate, { title: 'Quiz privé d’un autre étudiant', creatorId: 'audit-other', visibility: 'private', semester: '2', type: 'ai-generated' }],
      [ids.quizzes.semester2, { title: { fr: 'Quiz réservé au semestre 2', ar: 'اختبار مخصص للفصل الثاني' }, semester: '2', category: 'physiology' }],
      [ids.quizzes.inactive, { title: 'Quiz inactif de démonstration', status: 'inactive' }],
    ];
    const deckBase = {
      description: { fr: 'Quelques cartes pour une séance de révision ciblée.', ar: 'بطاقات لجلسة مراجعة مركزة.' },
      ownerId: 'audit-admin', visibility: 'shared', semester: '1', status: 'active',
      category: 'anatomy', difficulty: 'medium', createdAt: ago(2),
    };
    const simpleCards = [
      { id: 'card-1', front: 'Quel organe pompe le sang ?', back: 'Le cœur.' },
      { id: 'card-2', question: 'Comment réviser une notion ?', answer: 'Revenir au cours, puis tester sa compréhension.' },
      { id: 'card-3', front: { fr: 'Quel est le but de ce deck ?', ar: 'ما الهدف من هذه المجموعة؟' }, back: { fr: 'Tester le parcours de révision en démonstration.', ar: 'اختبار مسار المراجعة التجريبي.' } },
    ];
    const decks = [
      [ids.flashcards.private, { title: 'Mon carnet d’anatomie', ownerId: 'audit-student', visibility: 'private', cards: simpleCards, createdAt: ago(0) }],
      [ids.flashcards.shared, { title: { fr: 'Comprendre la physiologie', ar: 'فهم علم وظائف الأعضاء' }, category: 'physiology', semester: 'all', cards: simpleCards, difficulty: 'easy', createdAt: ago(1) }],
      [ids.flashcards.legacyItems, {
        title: 'Ancien deck : repères cliniques', category: 42, difficulty: { legacy: true },
        items: [null, 'ancienne carte invalide', {}, { front: { fr: { invalid: true } }, back: 'À ignorer' },
          { prompt: 'À quoi sert cette ancienne carte ?', response: 'À vérifier le format historique items.' },
          { question: 'Un format historique peut-il être lu ?', answer: 'Oui, si la carte contient une question et une réponse valides.' }],
      }],
      [ids.flashcards.legacyFlashcards, { title: { fr: 'Cartes historiques : pharmacologie', ar: 'بطاقات قديمة: علم الأدوية' }, category: 'pharmacology', flashcards: simpleCards.slice(0, 2), difficulty: 'hard', createdAt: ago(4) }],
      [ids.flashcards.otherPrivate, { title: 'Deck privé d’un autre étudiant', ownerId: 'audit-other', visibility: 'private', semester: '2', cards: simpleCards }],
      [ids.flashcards.semester2, { title: { fr: 'Deck réservé au semestre 2', ar: 'مجموعة مخصصة للفصل الثاني' }, semester: '2', cards: simpleCards }],
      [ids.flashcards.inactive, { title: 'Deck inactif de démonstration', status: 'inactive', cards: simpleCards }],
    ];

    const oldAttempts = await db.collection('quiz_attempts').where('userId', '==', 'audit-student').get();
    // The integration suite creates only a small demo dataset. Use small batches
    // here so repeatedly running a browser journey cannot exceed Firestore limits.
    for (let start = 0; start < oldAttempts.docs.length; start += 400) {
      const batch = db.batch();
      oldAttempts.docs.slice(start, start + 400).forEach(document => batch.delete(document.ref));
      await batch.commit();
    }
    const batch = db.batch();
    quizzes.forEach(([id, data]) => batch.set(db.collection('quizzes').doc(id), { ...quizBase, ...data }));
    decks.forEach(([id, data]) => {
      const fixture = { ...deckBase, ...data };
      if (id === ids.flashcards.legacyItems) delete fixture.createdAt;
      batch.set(db.collection('flashcards').doc(id), fixture);
    });
    [
      ['learning-attempt-zero', ids.quizzes.private, 0, 1],
      ['learning-attempt-eighty', ids.quizzes.sharedAI, 80, 0],
    ].forEach(([id, quizId, score, days]) => batch.set(db.collection('quiz_attempts').doc(id), {
      userId: 'audit-student', quizId, score, completedAt: ago(days), timeSpent: 120,
    }));
    batch.set(db.collection('quiz_attempts').doc('learning-attempt-other'), {
      userId: 'audit-other', quizId: ids.quizzes.sharedAI, score: 100, completedAt: ago(0), timeSpent: 90,
    });
    await batch.commit();

    return { projectId, accounts: ['audit-student (paid S1)', 'audit-other (paid S2)', 'audit-teacher (teacher S2)', 'audit-admin (admin v1)'], ids, studentAttempts: [0, 80] };
  } finally { await app.delete(); }
}

module.exports = { seedLearningLibrary, ids };
if (require.main === module) {
  seedLearningLibrary().then(summary => console.log(JSON.stringify(summary, null, 2)))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
