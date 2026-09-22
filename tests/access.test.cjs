const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, getDoc, getDocs, collection, deleteDoc, deleteField, query, where } = require('firebase/firestore');
const { ref, uploadBytes, getBytes, deleteObject } = require('firebase/storage');
const { createRequire } = require('node:module');
const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
const admin = backendRequire('firebase-admin');
const express = backendRequire('express');
const projectId = 'demo-medplatform-audit';
let env, app, server, base, student, other, manager, unlimited, auth, db;
const tokens = {};

before(async () => {
  // Hard-coded loopback hosts and demo project prevent accidental production tests.
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:19099';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:18080';
  env = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 18080, rules: fs.readFileSync(path.join(__dirname, '../firebase/firestore.rules'), 'utf8') },
    storage: { host: '127.0.0.1', port: 19199, rules: fs.readFileSync(path.join(__dirname, '../firebase/storage.rules'), 'utf8') },
  });
  await env.clearFirestore();
  app = admin.initializeApp({ projectId }, 'local-access-tests');
  auth = app.auth(); db = app.firestore();
  for (const [uid, role, semester, unlimitedAccess = false] of [
    ['audit-student', 'student', '1'], ['audit-other', 'student', '2'],
    ['audit-admin', 'admin', '1'], ['audit-unlimited', 'student', '1', true],
  ]) {
    try { await auth.deleteUser(uid); } catch {}
    await auth.createUser({ uid, email: `${uid}@example.test`, password: 'LocalOnly-123456!' });
    await auth.setCustomUserClaims(uid, { role, ...(role === 'admin' ? { adminAccessVersion: 1 } : {}), ...(unlimitedAccess ? { unlimitedAccess } : {}) });
    await db.collection('users').doc(uid).set({ uid, email: `${uid}@example.test`, fullName: uid, role, semester, subscriptionStatus: 'unpaid', createdAt: admin.firestore.Timestamp.now() });
    const r = await fetch('http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `${uid}@example.test`, password: 'LocalOnly-123456!', returnSecureToken: true }),
    });
    tokens[uid] = (await r.json()).idToken;
    assert.ok(tokens[uid]);
  }
  student = env.authenticatedContext('audit-student', { email: 'audit-student@example.test', role: 'student' });
  other = env.authenticatedContext('audit-other', { email: 'audit-other@example.test', role: 'student' });
  manager = env.authenticatedContext('audit-admin', { email: 'audit-admin@example.test', role: 'admin', adminAccessVersion: 1 });
  unlimited = env.authenticatedContext('audit-unlimited', { email: 'audit-unlimited@example.test', role: 'student', unlimitedAccess: true });
  const { createUserProfilesRouter } = await import('../backend/src/routes/userProfiles.js');
  const { createLearningContentRouter } = await import('../backend/src/routes/learningContent.js');
  const api = express(); api.use(express.json());
  const authenticate = async (req, res, next) => {
    try { req.user = await auth.verifyIdToken(req.headers.authorization?.replace('Bearer ', ''), true); next(); }
    catch { res.status(401).json({ error: 'unauthorized' }); }
  };
  api.use('/api/users', createUserProfilesRouter({ auth, db, authenticate }));
  api.use('/api/quizzes', createLearningContentRouter({ auth, db, authenticate }));
  server = await new Promise(resolve => { const s = api.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}/api/users`;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (env) await env.cleanup();
  if (app) await app.delete();
});

test('student can read and edit personal fields', async () => {
  const target = doc(student.firestore(), 'users/audit-student');
  await assertSucceeds(getDoc(target));
  await assertSucceeds(updateDoc(target, { fullName: 'Étudiant Test', semester: '1', phoneNumber: '' }));
});
test('student semester is selected once and cannot be reset or expanded', async () => {
  const target = doc(student.firestore(), 'users/audit-student');
  for (const semester of ['2', 'all', '', '13', 1, null, deleteField()]) {
    await assertFails(updateDoc(target, { semester }));
  }
  await assertFails(updateDoc(target, { unlimitedAccess: true }));
  for (const initial of [undefined, '']) {
    const uid = initial === '' ? 'audit-empty-level' : 'audit-missing-level';
    await db.collection('users').doc(uid).set({ uid, ...(initial === '' ? { semester: '' } : {}) });
    const context = env.authenticatedContext(uid, { role: 'student' });
    const profile = doc(context.firestore(), 'users', uid);
    await assertFails(updateDoc(profile, { semester: 'all' }));
    await assertSucceeds(updateDoc(profile, { semester: '3' }));
    await assertFails(updateDoc(profile, { semester: '4' }));
    await assertSucceeds(updateDoc(profile, { fullName: 'Personal fields still editable' }));
  }
});
test('student cannot promote own role or mark own subscription paid', async () => {
  const target = doc(student.firestore(), 'users/audit-student');
  await assertFails(updateDoc(target, { role: 'admin' }));
  await assertFails(updateDoc(target, { subscriptionStatus: 'paid' }));
  await assertFails(updateDoc(target, { subscription: { status: 'paid' } }));
});
test('profile creation enforces identity and initial access', async () => {
  const context = env.authenticatedContext('audit-new', { email: 'audit-new@example.test' });
  const target = doc(context.firestore(), 'users/audit-new');
  const profile = { uid: 'audit-new', email: 'audit-new@example.test', fullName: 'Nouveau Profil', role: 'student', subscriptionStatus: 'unpaid' };
  await assertFails(setDoc(target, { ...profile, role: 'admin' }));
  await assertFails(setDoc(target, { ...profile, email: 'another@example.test' }));
  for (const semester of ['all', '0', '13', 1]) await assertFails(setDoc(target, { ...profile, semester }));
  await assertSucceeds(setDoc(target, profile));
});
test('profiles are private and cannot be deleted by browser clients', async () => {
  await assertFails(getDoc(doc(other.firestore(), 'users/audit-student')));
  await assertFails(getDocs(collection(student.firestore(), 'users')));
  await assertFails(deleteDoc(doc(student.firestore(), 'users/audit-student')));
  await assertSucceeds(getDocs(collection(manager.firestore(), 'users')));
});
test('admin clients cannot bypass server role management', async () => {
  await assertFails(updateDoc(doc(manager.firestore(), 'users/audit-student'), { role: 'admin' }));
});
test('students cannot upload, overwrite, or delete course/video files', async () => {
  const location = 'videos/audit-admin/nested/audit.txt';
  const bytes = new TextEncoder().encode('synthetic content');
  await assertSucceeds(uploadBytes(ref(manager.storage(), location), bytes));
  await assertSucceeds(getBytes(ref(manager.storage(), location)));
  await assertFails(getBytes(ref(student.storage(), location)));
  await assertFails(uploadBytes(ref(student.storage(), location), bytes));
  await assertFails(deleteObject(ref(student.storage(), location)));
  await assertFails(uploadBytes(ref(student.storage(), 'legacy/audit.txt'), bytes));
  await assertFails(uploadBytes(ref(student.storage(), 'courses/pdfs/audit.pdf'), bytes));
});

test('private flashcards and quizzes cannot be read, listed, edited or deleted by another user', async () => {
  for (const [name, owner] of [['flashcards', 'ownerId'], ['quizzes', 'creatorId']]) {
    const data = { [owner]: 'audit-student', visibility: 'private', title: 'Private synthetic content' };
    await assertSucceeds(setDoc(doc(student.firestore(), name, 'private-content'), data));
    await assertSucceeds(getDoc(doc(student.firestore(), name, 'private-content')));
    await assertFails(getDoc(doc(other.firestore(), name, 'private-content')));
    await assertFails(getDocs(collection(other.firestore(), name)));
    await assertFails(updateDoc(doc(other.firestore(), name, 'private-content'), { title: 'Overwrite' }));
    await assertFails(deleteDoc(doc(other.firestore(), name, 'private-content')));
    await assertFails(updateDoc(doc(student.firestore(), name, 'private-content'), { [owner]: 'audit-other' }));
    await assertFails(updateDoc(doc(student.firestore(), name, 'private-content'), { visibility: 'shared' }));
    await assertFails(setDoc(doc(student.firestore(), name, 'forged-owner'), { ...data, [owner]: 'audit-other' }));
    await assertFails(setDoc(doc(student.firestore(), name, 'forged-shared'), { ...data, visibility: 'shared' }));
    await assertSucceeds(getDoc(doc(manager.firestore(), name, 'private-content')));
    await assertSucceeds(setDoc(doc(manager.firestore(), name, 'shared-content'), { ...data, visibility: 'shared', semester: 'all' }));
    await assertSucceeds(getDoc(doc(other.firestore(), name, 'shared-content')));
    await assertSucceeds(getDocs(query(collection(student.firestore(), name), where(owner, '==', 'audit-student'), where('visibility', '==', 'private'))));
    await assertSucceeds(getDocs(query(collection(other.firestore(), name), where('visibility', '==', 'shared'), where('semester', 'in', ['2', 'all']))));
    await assertFails(updateDoc(doc(student.firestore(), name, 'shared-content'), { title: 'Overwrite shared' }));
  }
});

test('QCM results and quiz attempts are private and cannot impersonate another user', async () => {
  await db.collection('qcms').doc('test-qcm').set({ title: 'Synthetic QCM', semester: '1' });
  const result = { userId: 'audit-student', qcmId: 'test-qcm', results: { score: 100 } };
  await assertSucceeds(setDoc(doc(student.firestore(), 'qcm_results', 'own'), result));
  await assertFails(setDoc(doc(student.firestore(), 'qcm_results', 'forged'), { ...result, userId: 'audit-other' }));
  await assertFails(setDoc(doc(other.firestore(), 'qcm_results', 'wrong-level'), { ...result, userId: 'audit-other' }));
  await assertFails(getDoc(doc(other.firestore(), 'qcm_results', 'own')));
  await assertSucceeds(getDoc(doc(manager.firestore(), 'qcm_results', 'own')));
  await db.collection('quiz_attempts').doc('own').set({ userId: 'audit-student', score: 50 });
  await assertSucceeds(getDoc(doc(student.firestore(), 'quiz_attempts', 'own')));
  await assertFails(getDoc(doc(other.firestore(), 'quiz_attempts', 'own')));
  await assertFails(setDoc(doc(student.firestore(), 'quiz_attempts', 'fake-score'), { userId: 'audit-student', score: 100 }));
});

test('new accounts without a role claim can create and read only their own private content', async () => {
  const newcomer = env.authenticatedContext('new-without-claims', { email: 'new@example.test' });
  for (const [name, owner] of [['flashcards', 'ownerId'], ['quizzes', 'creatorId']]) {
    const ref = doc(newcomer.firestore(), name, 'new-account-content');
    await assertSucceeds(setDoc(ref, { [owner]: 'new-without-claims', visibility: 'private' }));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(getDocs(query(collection(newcomer.firestore(), name), where(owner, '==', 'new-without-claims'), where('visibility', '==', 'private'))));
    await assertFails(getDoc(doc(other.firestore(), name, 'new-account-content')));
  }
});

test('institutional content is scoped to the selected semester, with explicit general content', async () => {
  const allSemesters = [...Array.from({ length: 12 }, (_, index) => String(index + 1)), 'all'];
  for (const name of ['courses', 'videos', 'qcms']) {
    for (const semester of ['1', '2', 'all', 'unknown']) {
      await assertSucceeds(setDoc(doc(manager.firestore(), name, 'level-' + semester), { title: 'Synthetic shared content', semester }));
    }
    await assertSucceeds(setDoc(doc(manager.firestore(), name, 'missing-level'), { title: 'Unclassified content' }));
    await assertSucceeds(getDoc(doc(student.firestore(), name, 'level-1')));
    await assertFails(getDoc(doc(student.firestore(), name, 'level-2')));
    await assertSucceeds(getDoc(doc(other.firestore(), name, 'level-2')));
    await assertSucceeds(getDoc(doc(other.firestore(), name, 'level-all')));
    await assertFails(getDoc(doc(student.firestore(), name, 'missing-level')));
    await assertSucceeds(getDoc(doc(unlimited.firestore(), name, 'missing-level')));
    await assertSucceeds(getDoc(doc(unlimited.firestore(), name, 'level-unknown')));
    await assertSucceeds(getDoc(doc(unlimited.firestore(), name, 'level-2')));
    await assertSucceeds(getDoc(doc(manager.firestore(), name, 'missing-level')));
    await assertFails(getDocs(collection(student.firestore(), name)));
    await assertSucceeds(getDocs(query(collection(student.firestore(), name), where('semester', 'in', ['1', 'all']))));
    await assertSucceeds(getDocs(collection(unlimited.firestore(), name)));
    await assertSucceeds(getDocs(collection(manager.firestore(), name)));
    await assertFails(setDoc(doc(student.firestore(), name, 'student-published'), { semester: '1' }));
  }
});

test('ownership never bypasses semester for shared content and unlimited never bypasses privacy', async () => {
  for (const [name, owner] of [['quizzes', 'creatorId'], ['flashcards', 'ownerId'], ['recommendations', 'ownerId']]) {
    const collectionRef = db.collection(name);
    await collectionRef.doc('owned-shared-other-level').set({ [owner]: 'audit-student', visibility: 'shared', semester: '2' });
    await collectionRef.doc('owned-private-other-level').set({ [owner]: 'audit-student', visibility: 'private', semester: '2' });
    await collectionRef.doc('unclassified-shared').set({ [owner]: 'audit-student', visibility: 'shared' });
    await collectionRef.doc('legacy-unclassified').set({ [owner]: 'audit-student' });
    await assertFails(getDoc(doc(student.firestore(), name, 'owned-shared-other-level')));
    await assertSucceeds(getDoc(doc(other.firestore(), name, 'owned-shared-other-level')));
    await assertSucceeds(getDoc(doc(student.firestore(), name, 'owned-private-other-level')));
    await assertFails(getDoc(doc(other.firestore(), name, 'owned-private-other-level')));
    await assertFails(getDoc(doc(unlimited.firestore(), name, 'owned-private-other-level')));
    await assertSucceeds(getDoc(doc(unlimited.firestore(), name, 'owned-shared-other-level')));
    await assertSucceeds(getDoc(doc(unlimited.firestore(), name, 'unclassified-shared')));
    await assertFails(getDoc(doc(student.firestore(), name, 'legacy-unclassified')));
    await assertSucceeds(getDoc(doc(manager.firestore(), name, 'owned-private-other-level')));
    await assertSucceeds(getDocs(query(collection(student.firestore(), name), where(owner, '==', 'audit-student'), where('visibility', '==', 'private'))));
    await assertFails(getDocs(query(collection(student.firestore(), name), where(owner, '==', 'audit-student'))));
  }
});

test('unselected students can see general shared content but cannot invent a level', async () => {
  const newcomer = env.authenticatedContext('missing-profile', { role: 'student', semester: '2' });
  await assertSucceeds(getDoc(doc(newcomer.firestore(), 'courses/level-all')));
  await assertFails(getDoc(doc(newcomer.firestore(), 'courses/level-2')));
  await assertSucceeds(getDocs(query(collection(newcomer.firestore(), 'courses'), where('semester', '==', 'all'))));
});

test('quiz API enforces ownership and stores each result separately from shared content', async () => {
  const quizzes = base.replace('/users', '/quizzes');
  const headers = uid => ({ Authorization: 'Bearer ' + tokens[uid], 'Content-Type': 'application/json' });
  const quiz = { creatorId: 'audit-student', visibility: 'private', status: 'active', title: { fr: 'Private API Quiz' }, questions: [{ id: 'q1', type: 'true_false', question: { fr: 'Le cœur pompe le sang.' }, explanation: { fr: 'Question synthétique.' }, correctAnswer: true }] };
  await db.collection('quizzes').doc('api-private').set(quiz);
  assert.equal((await fetch(quizzes)).status, 401);
  const otherList = await (await fetch(quizzes, { headers: headers('audit-other') })).json();
  assert.ok(!otherList.some(q => q.id === 'api-private'));
  assert.ok((await (await fetch(quizzes, { headers: headers('audit-admin') })).json()).some(q => q.id === 'api-private'));
  const body = JSON.stringify({ answers: [{ questionId: 'q1', userAnswer: true }, { questionId: 'q1', userAnswer: true }], userId: 'audit-other' });
  assert.equal((await fetch(quizzes + '/api-private/attempt', { method: 'POST', headers: headers('audit-other'), body })).status, 403);
  const response = await fetch(quizzes + '/api-private/attempt', { method: 'POST', headers: headers('audit-student'), body });
  assert.equal(response.status, 200);
  const result = await response.json(); assert.equal(result.score, 100);
  const attempt = (await db.collection('quiz_attempts').doc(result.attemptId).get()).data();
  assert.equal(attempt.userId, 'audit-student');
  assert.equal((await db.collection('quizzes').doc('api-private').get()).data().attempts, undefined);
  await db.collection('quizzes').doc('api-private').update({ visibility: 'shared', semester: 'all' });
  assert.equal((await fetch(quizzes + '/api-private/attempt', { method: 'POST', headers: headers('audit-other'), body })).status, 200);
});

test('quiz API enforces semesters for list and attempts, preserving private owner access', async () => {
  const quizzes = base.replace('/users', '/quizzes');
  const headers = uid => ({ Authorization: 'Bearer ' + tokens[uid], 'Content-Type': 'application/json' });
  const questions = [{ id: 'q1', type: 'true_false', correctAnswer: true }];
  const fixtures = [
    ['api-level-1', { visibility: 'shared', semester: '1', creatorId: 'audit-admin' }],
    ['api-level-2', { visibility: 'shared', semester: '2', creatorId: 'audit-student' }],
    ['api-level-all', { visibility: 'shared', semester: 'all', creatorId: 'audit-admin' }],
    ['api-level-missing', { visibility: 'shared', creatorId: 'audit-admin' }],
    ['api-own-private', { visibility: 'private', semester: '2', creatorId: 'audit-student' }],
    ['api-other-private', { visibility: 'private', semester: '1', creatorId: 'audit-other' }],
  ];
  for (const [id, data] of fixtures) await db.collection('quizzes').doc(id).set({ ...data, status: 'active', questions });
  const expected = {
    'audit-student': ['api-level-1', 'api-level-all', 'api-own-private'],
    'audit-other': ['api-level-2', 'api-level-all', 'api-other-private'],
    'audit-unlimited': ['api-level-1', 'api-level-2', 'api-level-all', 'api-level-missing'],
    'audit-admin': fixtures.map(([id]) => id),
  };
  for (const [uid, allowed] of Object.entries(expected)) {
    const response = await fetch(quizzes, { headers: headers(uid) });
    assert.equal(response.status, 200);
    const list = await response.json();
    for (const [id] of fixtures) {
      assert.equal(list.some(item => item.id === id), allowed.includes(id), uid + ' list ' + id);
      const attempt = await fetch(quizzes + '/' + id + '/attempt', {
        method: 'POST', headers: headers(uid), body: JSON.stringify({ answers: [{ questionId: 'q1', userAnswer: true }], semester: 'all' }),
      });
      assert.equal(attempt.status, allowed.includes(id) ? 200 : 403, uid + ' attempt ' + id);
    }
  }
  const created = await fetch(quizzes, {
    method: 'POST', headers: headers('audit-student'), body: JSON.stringify({
      title: { fr: 'Generated private quiz' }, description: { fr: 'Synthetic' }, category: 'test', questions,
      semester: 'all', creatorId: 'audit-other', visibility: 'shared',
    }),
  });
  assert.equal(created.status, 201);
  const data = await created.json();
  assert.equal(data.semester, '1'); assert.equal(data.creatorId, 'audit-student'); assert.equal(data.visibility, 'private');
});

const request = (uid, route = '', method = 'GET', data) => fetch(base + route, {
  method, headers: { ...(uid ? { Authorization: 'Bearer ' + tokens[uid] } : {}), 'Content-Type': 'application/json' },
  ...(data ? { body: JSON.stringify(data) } : {}),
});
test('API rejects anonymous and non-admin list access', async () => {
  assert.equal((await request(null)).status, 401);
  assert.equal((await request('audit-student')).status, 403);
  const response = await request('audit-admin'); assert.equal(response.status, 200);
  assert.ok((await response.json()).users.some(user => user.id === 'audit-student'));
});
test('API protects private profiles and ignores stored identity/role overrides', async () => {
  await db.collection('users').doc('audit-student').update({ uid: 'audit-admin', role: 'admin' });
  const response = await request('audit-student', '/audit-student'); assert.equal(response.status, 200);
  const user = await response.json(); assert.equal(user.uid, 'audit-student'); assert.equal(user.role, 'student');
  assert.equal((await request('audit-student', '/audit-other')).status, 403);
});
test('API rejects forbidden fields, invalid roles, and self-lockout', async () => {
  assert.equal((await request('audit-student', '/audit-other', 'PATCH', { role: 'admin' })).status, 403);
  assert.equal((await request('audit-admin', '/audit-other', 'PATCH', { email: 'other@example.test' })).status, 400);
  assert.equal((await request('audit-admin', '/audit-other', 'PATCH', { role: 'root' })).status, 400);
  assert.equal((await request('audit-admin', '/audit-admin', 'PATCH', { role: 'student' })).status, 409);
  assert.equal((await request('audit-admin', '/audit-admin', 'PATCH', { disabled: true })).status, 409);
  assert.equal((await request('audit-admin', '/audit-other', 'PATCH', { role: 'admin' })).status, 409);
  assert.equal((await request('audit-admin', '/audit-other', 'PATCH', { unlimitedAccess: true })).status, 400);
});
test('only the admin API can change an already selected semester', async () => {
  assert.equal((await request('audit-student', '/audit-student', 'PATCH', { semester: '2' })).status, 403);
  for (const semester of ['', 'all', '13', 2, null]) {
    assert.equal((await request('audit-admin', '/audit-student', 'PATCH', { semester })).status, 400);
  }
  const response = await request('audit-admin', '/audit-student', 'PATCH', { semester: '12' });
  assert.equal(response.status, 200); assert.equal((await response.json()).semester, '12');
  assert.equal((await db.collection('users').doc('audit-student').get()).data().semester, '12');
  await assertFails(updateDoc(doc(student.firestore(), 'users/audit-student'), { semester: '1' }));
  await db.collection('users').doc('audit-student').update({ semester: '1', unlimitedAccess: true });
  const studentProfile = await (await request('audit-student', '/audit-student')).json();
  assert.equal(studentProfile.unlimitedAccess, false);
  const unlimitedProfile = await (await request('audit-unlimited', '/audit-unlimited')).json();
  assert.equal(unlimitedProfile.unlimitedAccess, true);
});
test('API updates role in Auth claims and Firestore together', async () => {
  await auth.setCustomUserClaims('audit-other', { role: 'student', otherClaim: true });
  const r = await request('audit-admin', '/audit-other', 'PATCH', { role: 'teacher' }); assert.equal(r.status, 200);
  const account = await auth.getUser('audit-other');
  assert.equal(account.customClaims.role, 'teacher'); assert.equal(account.customClaims.otherClaim, true);
  assert.equal((await db.collection('users').doc('audit-other').get()).data().role, 'teacher');
});
test('API deactivation is reversible and retains all profile data', async () => {
  assert.equal((await request('audit-admin', '/audit-other', 'PATCH', { disabled: true })).status, 200);
  assert.equal((await auth.getUser('audit-other')).disabled, true);
  assert.equal((await db.collection('users').doc('audit-other').get()).exists, true);
  assert.equal((await request('audit-other', '/audit-other')).status, 401);
  assert.equal((await request('audit-admin', '/audit-other', 'PATCH', { disabled: false })).status, 200);
  assert.equal((await auth.getUser('audit-other')).disabled, false);
});
test('API flags orphan profiles and refuses account mutations', async () => {
  await db.collection('users').doc('audit-orphan').set({ fullName: 'Orphan test' });
  const r = await request('audit-admin', '/audit-orphan'); assert.equal((await r.json()).accountExists, false);
  assert.equal((await request('audit-admin', '/audit-orphan', 'PATCH', { role: 'admin' })).status, 409);
});
test('stale admin tokens cannot retain admin access after demotion', async () => {
  await auth.setCustomUserClaims('audit-admin', { role: 'student' });
  assert.equal((await request('audit-admin')).status, 403);
  await auth.setCustomUserClaims('audit-admin', { role: 'admin', adminAccessVersion: 1 });
});

test('deleted-account tokens and pre-migration admin tokens cannot retain direct access', async () => {
  const uid = 'audit-revoked';
  await db.collection('accountRevocations').doc(uid).set({ revokedAt: admin.firestore.Timestamp.now() });
  await db.collection('flashcards').doc('revoked-private').set({ ownerId: uid, visibility: 'private' });
  const revoked = env.authenticatedContext(uid, { role: 'student', email: `${uid}@example.test` });
  await assertFails(getDoc(doc(revoked.firestore(), 'flashcards/revoked-private')));
  await assertFails(setDoc(doc(revoked.firestore(), 'users', uid), { uid, email: `${uid}@example.test`, role: 'student', subscriptionStatus: 'unpaid', semester: '1' }));
  const staleAdmin = env.authenticatedContext('audit-old-admin', { role: 'admin' });
  await assertFails(getDoc(doc(staleAdmin.firestore(), 'users/audit-student')));
  await assertFails(getDocs(collection(staleAdmin.firestore(), 'quizzes')));
  await assertFails(uploadBytes(ref(staleAdmin.storage(), 'courses/old-admin.pdf'), new Uint8Array([1]), { contentType: 'application/pdf' }));
});
