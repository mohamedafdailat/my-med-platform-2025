// Local UI fixture only. Never loads dotenv, a service account, or production services.
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const projectId = 'demo-medplatform-audit';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:19099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:18080';
assert.equal(projectId, 'demo-medplatform-audit');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:19099');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18080');
const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
const admin = backendRequire('firebase-admin');
const app = admin.initializeApp({ projectId }, 'student-experience-preview-seed');
const db = app.firestore();
const password = 'LocalOnly-123456!';

(async () => {
  try {
    const response = await fetch('http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'audit-admin@example.test', password, returnSecureToken: true }),
    });
    assert.equal(response.status, 200, 'Run the integration suite first to create local demo accounts.');
    const { idToken } = await response.json();
    assert.ok(idToken);
    const paid = await fetch('http://127.0.0.1:5180/api/users/audit-student', {
      method: 'PATCH', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionStatus: 'paid', role: 'student', disabled: false }),
    });
    assert.equal(paid.status, 200, 'The local demo API must be running on port 5180.');
    const now = new Date();
    const ago = days => admin.firestore.Timestamp.fromDate(new Date(now.getTime() - days * 86400000));
    await db.collection('users').doc('audit-student').set({
      uid: 'audit-student', fullName: 'Salma Benali', role: 'student', semester: '1', unlimitedAccess: false,
      stats: { coursesCompleted: 8, quizzesTaken: 12, flashcardsMastered: 45, videosWatched: 6, studyHours: 18.5 },
      progress: { weekly: [1.5, 2, 0.75, 3, 1.25], monthly: [6, 8, 7.5, 10], categories: { anatomy: 5, physiology: 3, pharmacology: 4 } },
    }, { merge: true });
    await app.auth().updateUser('audit-student', { displayName: 'Salma Benali' });
    const fixtures = [
      ['experience-cardio', { title: { fr: 'Comprendre le cycle cardiaque', ar: 'فهم الدورة القلبية' }, description: { fr: 'Un parcours visuel pour revoir les étapes essentielles du cycle cardiaque.', ar: 'مراجعة بصرية للمراحل الأساسية للدورة القلبية.' }, category: 'cardiology', semester: '1', videoUrl: 'https://www.youtube.com/watch?v=demoVideo01', duration: '18 min' }],
      ['experience-pharmacy', { title: { fr: 'Pharmacologie : les bases à retenir', ar: 'أساسيات علم الأدوية' }, description: { fr: 'Retrouvez les notions clés et préparez votre prochaine séance de révision.', ar: 'راجع المفاهيم الأساسية واستعد لجلسة المراجعة القادمة.' }, category: 'pharmacie', semester: '1', youtubeId: 'demoVideo02', videoUrl: 'https://youtu.be/demoVideo02', duration: '12:30' }],
      ['experience-general-upload', { title: { fr: 'Les essentiels de la consultation', ar: 'أساسيات الاستشارة الطبية' }, description: { fr: 'Une vidéo du cours, disponible dans votre espace étudiant.', ar: 'فيديو للدرس متاح في فضاء الطالب.' }, category: 'médecine_générale', semester: '1', storagePath: 'videos/audit-admin/experience-demo.mp4', duration: '9 min' }],
      ['experience-respiration', { title: 'Physiologie : explorer la respiration', description: 'Une capsule courte pour relier vos connaissances et vos révisions.', category: 'physiology', semester: '1', youtubeLink: 'https://www.youtube.com/embed/demoVideo04', duration: '15 min' }],
      ['experience-dental', { title: { fr: 'Anatomie dentaire : repères visuels', ar: 'تشريح الأسنان: معالم بصرية' }, description: { fr: 'Révisez les repères essentiels avec une présentation progressive.', ar: 'راجع المعالم الأساسية من خلال عرض تدريجي.' }, category: 'dentaire', semester: 'all', videoUrl: 'https://www.youtube.com/watch?v=demoVideo05', duration: '11 min' }],
      ['experience-technology', { title: { fr: 'Découvrir l’imagerie médicale', ar: 'اكتشاف التصوير الطبي' }, description: { fr: 'Une introduction visuelle pour enrichir votre culture médicale.', ar: 'مقدمة بصرية لإثراء معارفك الطبية.' }, category: 'technology', semester: '1', videoUrl: 'https://www.youtube.com/shorts/demoVideo06', duration: '7 min' }],
      ['experience-s2-hidden', { title: { fr: 'Vidéo réservée au semestre 2', ar: 'فيديو مخصص للفصل الثاني' }, category: 'médecine_générale', semester: '2', videoUrl: 'https://www.youtube.com/watch?v=demoVideo07', duration: '14 min' }],
      ['experience-inactive-hidden', { title: { fr: 'Vidéo inactive de démonstration', ar: 'فيديو تجريبي غير نشط' }, category: 'general-medicine', semester: '1', status: 'inactive', videoUrl: 'https://www.youtube.com/watch?v=demoVideo08', duration: '10 min' }],
    ];
    const batch = db.batch();
    const oldAttempts = await db.collection('quiz_attempts').where('userId', '==', 'audit-student').get();
    oldAttempts.docs.forEach(document => batch.delete(document.ref));
    fixtures.forEach(([id, data], index) => batch.set(db.collection('videos').doc(id), { status: 'active', uploadedBy: 'audit-admin', uploadedAt: ago(index), ...data }));
    [
      ['experience-anatomy', { fr: 'Anatomie : construire ses repères', ar: 'التشريح: بناء المعالم الأساسية' }, 'anatomy', '1'],
      ['experience-method', { fr: 'Organiser ses révisions médicales', ar: 'تنظيم المراجعة الطبية' }, 'general-medicine', 'all'],
    ].forEach(([id, title, category, semester]) => batch.set(db.collection('courses').doc(id), {
      title, description: { fr: 'Un cours de démonstration pour préparer votre prochaine séance.', ar: 'درس تجريبي للتحضير لجلسة المراجعة القادمة.' },
      category, semester, status: 'active', createdAt: ago(1), uploadedAt: ago(1), pdfStoragePath: 'courses/pdfs/experience-demo.pdf',
    }));
    [
      ['experience-cardio-quiz', { fr: 'Quiz : le cycle cardiaque', ar: 'اختبار: الدورة القلبية' }, 'cardiology', '1'],
      ['experience-basics-quiz', { fr: 'Quiz : les fondamentaux', ar: 'اختبار: الأساسيات' }, 'general-medicine', 'all'],
    ].forEach(([id, title, category, semester]) => batch.set(db.collection('quizzes').doc(id), {
      title, description: { fr: 'Vérifiez vos acquis avec quelques questions de démonstration.', ar: 'راجع معارفك من خلال أسئلة تجريبية.' },
      category, semester, status: 'active', createdAt: ago(1), visibility: 'shared', creatorId: 'audit-admin',
      questions: [{ id: 'q1', type: 'true_false', question: { fr: 'Cette question est un exemple de démonstration.', ar: 'هذا السؤال مثال تجريبي.' }, correctAnswer: true }],
    }));
    [0, 1, 1, 2, 4, 6, 9, 12, 17, 22, 28].forEach((days, index) => batch.set(db.collection('quiz_attempts').doc(`experience-attempt-${index}`), {
      userId: 'audit-student', quizId: index % 2 ? 'experience-cardio-quiz' : 'experience-basics-quiz',
      score: [80, 100, 70, 90, 85][index % 5], completedAt: ago(days), timeSpent: 120 + index * 10,
    }));
    [5, 4, 3, 2, 1].forEach((days, index) => batch.set(db.collection('userProgress').doc('audit-student').collection('history').doc(`experience-${index}`), {
      timestamp: ago(days), coursesCompleted: index + 3, quizzesTaken: index + 7, studyHours: 10 + index * 2,
    }));
    await batch.commit();
    console.log('Seeded local demo only: paid S1 student, stats/history, courses/quizzes/attempts and 8 video fixtures (including S2/inactive controls).');
  } finally { await app.delete(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
