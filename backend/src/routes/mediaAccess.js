import express from 'express';
import { canReadSemester, getContentAccess } from './contentAccess.js';

const URL_LIFETIME_MS = 10 * 60 * 1000;

const mediaError = (status, message) => Object.assign(new Error(message), { status });

const checkedPath = (value, kind) => {
  if (typeof value !== 'string' || !value.startsWith(`${kind}/`) ||
      Buffer.byteLength(value, 'utf8') > 1024 || /[\\\u0000-\u001f\u007f]/.test(value) ||
      // Decode a URL exactly once. Ambiguous encoded paths are never reinterpreted.
      /%[0-9a-f]{2}/i.test(value) || value.split('/').some(part => !part || part === '.' || part === '..')) {
    throw mediaError(422, 'Chemin de fichier non pris en charge.');
  }
  return value;
};

// Only database-owned paths in the configured bucket are eligible for signing.
// A URL supplied by the browser can never select a bucket, host or file.
export const resolveMediaPath = ({ kind, data, bucketName }) => {
  if (!['courses', 'videos'].includes(kind) || typeof bucketName !== 'string' || !bucketName) {
    throw mediaError(422, 'Source de fichier non prise en charge.');
  }
  const storedPath = data[kind === 'courses' ? 'pdfStoragePath' : 'storagePath'] || data.filePath;
  if (storedPath) return checkedPath(storedPath, kind);
  const source = data[kind === 'courses' ? 'pdfUrl' : 'videoUrl'];
  if (!source) throw mediaError(404, 'Aucun fichier disponible.');
  if (typeof source !== 'string' || source !== source.trim() || /[\\\u0000-\u0020\u007f]/.test(source)) {
    throw mediaError(422, 'Source de fichier non prise en charge.');
  }
  // URL parsers normalize dot segments before exposing pathname. Reject those
  // spellings before parsing rather than signing a different normalized object.
  const rawUrlPath = source.split(/[?#]/, 1)[0];
  if (rawUrlPath.split('/').some(segment => /^(?:\.|%2e){1,2}$/i.test(segment))) {
    throw mediaError(422, 'Source de fichier non prise en charge.');
  }
  let url;
  try { url = new URL(source); }
  catch { throw mediaError(422, 'Source de fichier non prise en charge.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) {
    throw mediaError(422, 'Source de fichier non prise en charge.');
  }
  let encodedPath;
  let encodedBucket;
  if (url.hostname === 'firebasestorage.googleapis.com') {
    const match = /^\/v0\/b\/([^/]+)\/o\/(.+)$/.exec(url.pathname);
    if (match) [, encodedBucket, encodedPath] = match;
  } else if (url.hostname === 'storage.googleapis.com') {
    const match = /^\/([^/]+)\/(.+)$/.exec(url.pathname);
    if (match) [, encodedBucket, encodedPath] = match;
  } else if (url.hostname === `${bucketName}.storage.googleapis.com`) {
    encodedBucket = bucketName;
    encodedPath = url.pathname.slice(1);
  }
  try {
    if (!encodedPath || decodeURIComponent(encodedBucket) !== bucketName) {
      throw new Error('Unsupported bucket');
    }
    return checkedPath(decodeURIComponent(encodedPath), kind);
  } catch {
    throw mediaError(422, 'Source de fichier non prise en charge.');
  }
};

export const createMediaAccessRouter = ({ auth, db, bucket, authenticate }) => {
  const router = express.Router();
  router.get('/:kind(courses|videos)/:id/media', authenticate, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const { kind, id } = req.params;
      if (id.includes('/') || !id) return res.status(400).json({ error: 'Identifiant invalide.' });
      const access = await getContentAccess({ auth, db, uid: req.user.uid });
      const snapshot = await db.collection(kind).doc(id).get();
      if (!snapshot.exists) return res.status(404).json({ error: 'Contenu introuvable.' });
      const data = snapshot.data();
      if (!canReadSemester(data, access)) return res.status(403).json({ error: 'Accès à ce contenu interdit.' });
      const filePath = resolveMediaPath({ kind, data, bucketName: bucket.name });
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      if (!exists) return res.status(404).json({ error: 'Fichier introuvable.' });
      const expiresAt = new Date(Date.now() + URL_LIFETIME_MS);
      const [url] = await file.getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt });
      return res.json({ url, expiresAt: expiresAt.toISOString() });
    } catch (error) {
      const status = [400, 403, 404, 422].includes(error.status) ? error.status : 500;
      // Do not log filenames, signed URLs, credentials or upstream error objects.
      if (status === 500) console.error('Media URL creation failed.');
      return res.status(status).json({ error: status === 500 ? 'Impossible de préparer le fichier.' : error.message });
    }
  });
  return router;
};
