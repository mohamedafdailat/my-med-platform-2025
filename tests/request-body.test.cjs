const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { gzipSync } = require('node:zlib');
const { createRequire } = require('node:module');
const path = require('node:path');
const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
const express = backendRequire('express');
let server, base;

before(async () => {
  const { createJsonBodyParser } = await import('../backend/src/middleware/requestBody.js');
  const app = express();
  app.use(createJsonBodyParser());
  app.post('/json', (req, res) => res.json(req.body));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.type }));
  server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });

test('ordinary JSON requests keep working with the original payload limit', async () => {
  const response = await fetch(base + '/json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Révision طب' }) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: 'Révision طب' });
  const oversized = await fetch(base + '/json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'x'.repeat(2 * 1024 * 1024) }) });
  assert.equal(oversized.status, 413);
});

test('compressed requests are rejected before decompression and server stays healthy', async () => {
  const body = gzipSync(Buffer.from(JSON.stringify({ message: 'local regression check' })));
  const response = await fetch(base + '/json', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body });
  assert.equal(response.status, 415);
  assert.equal((await response.json()).error, 'encoding.unsupported');
  const health = await fetch(base + '/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
});
