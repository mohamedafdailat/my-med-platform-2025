import api from './api';

export const isProtectedMedia = (url, storagePath) => {
  if (storagePath) return true;
  if (typeof url !== 'string') return false;
  if (url.startsWith('gs://')) return true;
  try {
    const host = new URL(url).hostname;
    return host === 'firebasestorage.googleapis.com' || host === 'storage.googleapis.com' || host.endsWith('.storage.googleapis.com');
  } catch { return false; }
};

export const resolveMediaUrl = async (collectionName, id, url, storagePath) => {
  if (!isProtectedMedia(url, storagePath)) return url;
  const { data } = await api.get(`/${collectionName}/${encodeURIComponent(id)}/media`);
  return data.url;
};
