const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
const express = backendRequire('express');

// Pure local fakes: these tests never load a service account or call Cloud Storage.
const bucketName = 'demo-medplatform-audit.firebasestorage.app';
const profiles = { student: { semester: '1' }, other: { semester: '2' }, unlimited: { semester: '2' }, admin: {}, disabled: { semester: '1' } };
const accounts = {
  student: { customClaims: { role: 'student' } }, other: { customClaims: { role: 'student' } },
  unlimited: { customClaims: { role: 'student', unlimitedAccess: true } }, admin: { customClaims: { role: 'admin' } },
  disabled: { disabled: true, customClaims: { role: 'student' } },
};
const records = {
  courses: {
    first: { semester: '1', pdfStoragePath: 'courses/pdfs/lecture.pdf' },
    second: { semester: '2', pdfUrl: `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/courses%2Fpdfs%2Fsecond.pdf?alt=media&token=synthetic-obsolete-token` },
    common: { semester: 'all', filePath: 'courses/pdfs/common.pdf' },
    external: { semester: '1', pdfUrl: 'https://example.test/private.pdf' },
    absentFile: { semester: '1', pdfStoragePath: 'courses/pdfs/missing.pdf' },
    noFile: { semester: '1' },
    unclassified: { pdfStoragePath: 'courses/pdfs/lecture.pdf' },
  },
  videos: { first: { semester: '1', storagePath: 'videos/u/lecture.mp4' }, youtube: { semester: '1', videoUrl: 'https://www.youtube.com/watch?v=synthetic' } },
};
const signingCalls = [];
let server, base, resolveMediaPath;

before(async () => {
  const module = await import(pathToFileURL(path.resolve(__dirname, '../backend/src/routes/mediaAccess.js')).href);
  resolveMediaPath = module.resolveMediaPath;
  const db = { collection: name => ({ doc: id => ({ get: async () => {
    const value = name === 'users' ? profiles[id] : records[name]?.[id];
    return { exists: Boolean(value), data: () => value };
  } }) }) };
  const auth = { getUser: async uid => accounts[uid] };
  const bucket = { name: bucketName, file: name => ({
    exists: async () => [!name.endsWith('/missing.pdf')],
    getSignedUrl: async options => {
      signingCalls.push({ name, options });
      return [`https://storage.googleapis.com/${bucketName}/${encodeURIComponent(name)}?X-Goog-Signature=synthetic`];
    },
  }) };
  const authenticate = (req, res, next) => {
    const uid = req.headers.authorization?.replace(/^Bearer /, '');
    if (!accounts[uid]) return res.status(401).json({ error: 'Authentification requise.' });
    req.user = { uid }; next();
  };
  const app = express();
  app.use('/api', module.createMediaAccessRouter({ auth, db, bucket, authenticate }));
  server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });
const request = (uid, route = '/courses/first/media') => fetch(base + route, { headers: uid ? { Authorization: `Bearer ${uid}` } : {} });

test('media denies anonymous, disabled and wrong-semester accounts before signing', async () => {
  const beforeCount = signingCalls.length;
  assert.equal((await request()).status, 401);
  assert.equal((await request('disabled')).status, 403);
  assert.equal((await request('other')).status, 403);
  assert.equal(signingCalls.length, beforeCount);
});

test('media signs only a stored file for ten minutes and never caches the response', async () => {
  const started = Date.now();
  const response = await request('student');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const result = await response.json();
  assert.deepEqual(Object.keys(result).sort(), ['expiresAt', 'url']);
  assert.ok(Date.parse(result.expiresAt) >= started + 600000);
  assert.ok(Date.parse(result.expiresAt) <= Date.now() + 600000);
  assert.ok(!result.url.includes('obsolete-token'));
  const call = signingCalls.at(-1);
  assert.equal(call.name, 'courses/pdfs/lecture.pdf');
  assert.equal(call.options.version, 'v4');
  assert.equal(call.options.action, 'read');
  assert.equal(call.options.expires.toISOString(), result.expiresAt);
});

test('admin and unlimited accounts can read other classified semesters; common content works', async () => {
  assert.equal((await request('unlimited')).status, 200);
  assert.equal((await request('admin')).status, 200);
  assert.equal((await request('other', '/courses/common/media')).status, 200);
  assert.equal((await request('unlimited', '/courses/unclassified/media')).status, 200);
  assert.equal((await request('student', '/courses/unclassified/media')).status, 403);
  assert.equal((await request('admin', '/courses/unclassified/media')).status, 200);
  assert.equal((await request('student', '/videos/first/media')).status, 200);
});

test('media fails closed for missing files, external links, unsupported kinds and IDs', async () => {
  assert.equal((await request('student', '/courses/missing/media')).status, 404);
  assert.equal((await request('student', '/courses/absentFile/media')).status, 404);
  assert.equal((await request('student', '/courses/noFile/media')).status, 404);
  assert.equal((await request('student', '/courses/external/media')).status, 422);
  assert.equal((await request('student', '/videos/youtube/media')).status, 422);
  assert.equal((await request('student', '/users/first/media')).status, 404);
  assert.equal((await request('student', '/courses/a%2Fb/media')).status, 400);
});

test('media resolves supported bucket URL formats and decodes paths exactly once', async () => {
  const resolve = data => resolveMediaPath({ kind: 'courses', data, bucketName });
  const file = 'courses/pdfs/Révision S1.pdf';
  assert.equal(resolve({ pdfUrl: `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(file)}?alt=media&token=ignored` }), file);
  assert.equal(resolve({ pdfUrl: `https://storage.googleapis.com/${bucketName}/courses/pdfs/R%C3%A9vision%20S1.pdf` }), file);
  assert.equal(resolve({ pdfUrl: `https://${bucketName}.storage.googleapis.com/courses/pdfs/R%C3%A9vision%20S1.pdf` }), file);
  assert.equal(resolve({ filePath: file }), file);
  const response = await request('other', '/courses/second/media');
  assert.equal(response.status, 200);
  assert.equal(signingCalls.at(-1).name, 'courses/pdfs/second.pdf');
});

test('media rejects foreign buckets, host confusion, traversal and encoded path ambiguity', () => {
  const invalidUrls = [
    `https://firebasestorage.googleapis.com/v0/b/foreign.example/o/courses%2Fx.pdf`,
    `https://firebasestorage.googleapis.com.evil.test/v0/b/${bucketName}/o/courses%2Fx.pdf`,
    `https://storage.googleapis.com@evil.test/${bucketName}/courses/x.pdf`,
    `https://user:password@storage.googleapis.com/${bucketName}/courses/x.pdf`,
    `http://storage.googleapis.com/${bucketName}/courses/x.pdf`,
    `https://storage.googleapis.com:444/${bucketName}/courses/x.pdf`,
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/courses%2F..%2Fprivate.pdf`,
    `https://storage.googleapis.com/${bucketName}/courses/lesson/../private.pdf`,
    `https://storage.googleapis.com/${bucketName}/courses/%2e%2e/courses/private.pdf`,
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/courses%252Fprivate.pdf`,
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/courses%2F%255cprivate.pdf`,
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/courses%2F%00x.pdf`,
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/videos%2Fprivate.mp4`,
  ];
  for (const pdfUrl of invalidUrls) {
    assert.throws(() => resolveMediaPath({ kind: 'courses', data: { pdfUrl }, bucketName }), { status: 422 });
  }
  for (const pdfStoragePath of ['/courses/x.pdf', 'courses/../private.pdf', 'courses//x.pdf', 'courses/./x.pdf', 'courses/\\x.pdf', 'courses/%2fx.pdf', 'videos/x.mp4', 'https://example.test/x.pdf']) {
    assert.throws(() => resolveMediaPath({ kind: 'courses', data: { pdfStoragePath }, bucketName }), { status: 422 });
  }
});
