import { getYouTubeId, localizedVideoText, normalizeVideo, normalizeVideoCategory, videoSearchText } from './videos';

describe('video compatibility and safe previews', () => {
  test.each(['https://www.youtube.com/watch?feature=shared&v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ?t=3', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'https://m.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'])('recognizes supported YouTube source %s', value => expect(getYouTubeId(value)).toBe('dQw4w9WgXcQ'));
  test.each(['https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'https://evil.test/youtube.com/embed/dQw4w9WgXcQ', 'javascript:alert(1)', 'https://youtube.com/watch?v=invalid', null, {}])('rejects malformed or untrusted source %s', value => expect(getYouTubeId(value)).toBeNull());
  test('supports legacy localized strings and missing translations', () => {
    expect(localizedVideoText('Anatomie', 'fr')).toBe('Anatomie');
    expect(localizedVideoText({ ar: 'القلب' }, 'fr')).toBe('القلب');
    expect(localizedVideoText({ fr: 123 }, 'fr', 'Sans titre')).toBe('Sans titre');
    expect(videoSearchText('  MÉDECINE  ')).toBe('medecine');
  });
  test('keeps legacy specialities in their actual category', () => {
    expect(normalizeVideoCategory('médecine_générale')).toBe('general-medicine');
    expect(normalizeVideoCategory('pharmacie')).toBe('pharmacy');
  });
  test('keeps protected videos discoverable without exposing raw media links', () => {
    const video = normalizeVideo('private-video', { storagePath: 'videos/protected.mp4', videoUrl: 'https://storage.googleapis.com/bucket/video?token=private', title: 'Cours' });
    expect(video.type).toBe('uploaded'); expect(video.id).toBe('private-video');
    expect(video).not.toHaveProperty('videoUrl'); expect(video).not.toHaveProperty('storagePath');
    expect(normalizeVideo('hidden', { status: 'inactive', youtubeId: 'dQw4w9WgXcQ' })).toBeNull();
    expect(normalizeVideo('missing', {})).toBeNull();
  });
});
