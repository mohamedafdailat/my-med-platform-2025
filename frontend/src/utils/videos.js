export const localizedVideoText = (value, language, fallback = '') => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return fallback;
  return [value[language], value.fr, value.ar].find(text => typeof text === 'string' && text.trim()) || fallback;
};

export const getYouTubeId = (value) => {
  if (typeof value !== 'string') return null;
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    let id;
    if (host === 'youtu.be' || host === 'www.youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
      const parts = url.pathname.split('/');
      id = url.pathname === '/watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live', 'v'].includes(parts[1]) ? parts[2] : null;
    }
    return typeof id === 'string' && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
};

export const normalizeVideoCategory = (value) => {
  if (typeof value !== 'string' || !value.trim()) return 'other';
  const key = value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s_]+/g, '-');
  return ({ 'medecine-generale': 'general-medicine', pharmacie: 'pharmacy', cardiologie: 'cardiology', 'sante-dentaire': 'dentaire', 'technologie-medicale': 'technology', autres: 'other' })[key] || key;
};

export const videoSearchText = value => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export const normalizeVideo = (id, data = {}) => {
  if (data.status === 'inactive') return null;
  const source = data.videoUrl || data.youtubeLink || data.url || '';
  const youtubeId = getYouTubeId(data.youtubeId) || getYouTubeId(source);
  if (!youtubeId && !source && !data.storagePath && !data.filePath) return null;
  // The player resolves protected media. Cards and sharing never expose its raw URL.
  return { id, title: data.title, description: data.description, category: normalizeVideoCategory(data.category), uploadedAt: data.uploadedAt || data.createdAt, semester: data.semester, duration: typeof data.duration === 'string' ? data.duration : '', youtubeId, type: youtubeId ? 'youtube' : 'uploaded' };
};
