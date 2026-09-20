const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, getDoc, getDocs, collection, deleteDoc, query, where } = require('firebase/firestore');
const { ref, uploadBytes, getBytes, deleteObject } = require('firebase/storage');
const { createRequire } = require('node:module');
const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
const admin = backendRequire('firebase-admin');
const express = backendRequire('express');
const projectId = 'demo-medplatform-audit';
let env, app, server, base, student, other, manager, auth, db;
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
  for (const [uid, role] of [['audit-student', 'student'], ['audit-other', 'student'], ['audit-admin', 'admin']]) {
    try { await auth.deleteUser(uid); } catch {}
    await auth.createUser({ uid, email: `${uid}@example.test`, password: 'LocalOnly-123456!' });
    await auth.setCustomUserClaims(uid, { role });
    await db.collection('users').doc(uid).set({ uid, email: `${uid}@example.test`, fullName: uid, role, subscriptionStatus: 'unpaid', createdAt: admin.firestore.Timestamp.now() });
    const r = await fetch('http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `${uid}@example.test`, password: 'LocalOnly-123456!', returnSecureToken: true }),
    });
    tokens[uid] = (await r.json()).idToken;
    assert.ok(tokens[uid]);
  }
  student = env.authenticatedContext('audit-student', { email: 'audit-student@example.test', role: 'student' });
  other = env.authenticatedContext('audit-other', { email: 'audit-other@example.test', role: 'student' });
  manager = env.authenticatedContext('audit-admin', { email: 'audit-admin@example.test', role: 'admin' });
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
  await assertSucceeds(updateDoc(target, { fullName: 'Étudiant Test', semester: '4', phoneNumber: '' }));
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
  await assertSucceeds(getBytes(ref(student.storage(), location)));
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
    await assertSucceeds(setDoc(doc(manager.firestore(), name, 'shared-content'), { ...data, visibility: 'shared' }));
    await assertSucceeds(getDoc(doc(other.firestore(), name, 'shared-content')));
    await assertSucceeds(getDocs(query(collection(student.firestore(), name), where(owner, '==', 'audit-student'))));
    await assertSucceeds(getDocs(query(collection(other.firestore(), name), where('visibility', '==', 'shared'))));
    await assertFails(updateDoc(doc(student.firestore(), name, 'shared-content'), { title: 'Overwrite shared' }));
  }
});

test('QCM results and quiz attempts are private and cannot impersonate another user', async () => {
  await db.collection('qcms').doc('test-qcm').set({ title: 'Synthetic QCM' });
  const result = { userId: 'audit-student', qcmId: 'test-qcm', results: { score: 100 } };
  await assertSucceeds(setDoc(doc(student.firestore(), 'qcm_results', 'own'), result));
  await assertFails(setDoc(doc(student.firestore(), 'qcm_results', 'forged'), { ...result, userId: 'audit-other' }));
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
    await assertSucceeds(getDocs(query(collection(newcomer.firestore(), name), where(owner, '==', 'new-without-claims'))));
    await assertFails(getDoc(doc(other.firestore(), name, 'new-account-content')));
  }
});

test('quiz API enforces ownership and stores each result separately from shared content', async () => {
  const quizzes = base.replace('/users', '/quizzes');
  const headers = uid => ({ Authorization: 'Bearer ' + tokens[uid], 'Content-Type': 'application/json' });
  const quiz = { creatorId: 'audit-student', visibility: 'private', status: 'active', title: { fr: 'Private API Quiz' }, questions: [{ id: 'q1', type: 'true_false', correctAnswer: true }] };
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
  await db.collection('quizzes').doc('api-private').update({ visibility: 'shared' });
  assert.equal((await fetch(quizzes + '/api-private/attempt', { method: 'POST', headers: headers('audit-other'), body })).status, 200);
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
  await auth.setCustomUserClaims('audit-admin', { role: 'admin' });
});
