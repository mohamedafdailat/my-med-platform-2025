import { filterQuizzes, normalizeQuiz, quizCategory, quizCategoryLabel, quizHistory, quizInSpace, quizText, quizTitle, validQuizScore } from './quizzes';

const quiz = (id, changes = {}) => normalizeQuiz(id, { title: id, visibility: 'shared', category: 'anatomy', questions: [{}], ...changes });

test('quiz text and categories keep legacy French and Arabic formats searchable', () => {
  expect(quizText('Anatomie', 'ar')).toBe('Anatomie');
  expect(quizText({ ar: 'القلب' }, 'fr')).toBe('القلب');
  expect(quizText({ fr: {} }, 'fr', 'Sans titre')).toBe('Sans titre');
  expect(quizCategory('médecine_générale')).toBe('general-medicine');
  expect(quizCategory('pharmacie')).toBe('pharmacy');
  expect(filterQuizzes([quiz('cours', { course: { fr: 'Médecine générale' } })], { uid: 'me', language: 'fr', search: 'MEDECINE' })).toHaveLength(1);
  expect(normalizeQuiz('inactive', { status: 'inactive' })).toBeNull();
  expect(normalizeQuiz('bad-array', { questions: {} }).questionCount).toBe(0);
  for (const category of ['constructor', '__proto__', 'toString']) {
    const key = quizCategory(category);
    expect(typeof key).toBe('string');
    expect(quizCategoryLabel(key, {})).toBe(key);
    expect(() => filterQuizzes([quiz('special', { category })], { language: 'fr', categoryNames: {} })).not.toThrow();
  }
});

test('spaces distinguish visibility and ownership independently of AI provenance', () => {
  const sharedAI = quiz('shared-ai', { type: 'ai-generated', creatorId: 'other' });
  const ownStandard = quiz('own-standard', { visibility: 'private', creatorId: 'me' });
  const otherPrivate = quiz('other-private', { visibility: 'private', creatorId: 'other' });
  const list = [sharedAI, ownStandard, otherPrivate];
  expect(filterQuizzes(list, { uid: 'me', language: 'fr', space: 'library', source: 'ai-generated' }).map(item => item.id)).toEqual(['shared-ai']);
  expect(quizInSpace(ownStandard, 'personal', 'me')).toBe(true);
  expect(quizInSpace(otherPrivate, 'personal', 'me')).toBe(false);
  expect(quizInSpace(otherPrivate, 'admin', 'me')).toBe(true);
});

test('history preserves zero scores and excludes malformed values and other users', () => {
  const history = quizHistory([
    { userId: 'me', quizId: 'zero', score: 0 },
    { userId: 'me', quizId: 'next', score: 80 },
    { userId: 'me', quizId: 'next', score: '100' },
    { userId: 'me', quizId: 'without-score', score: null },
    { userId: 'other', quizId: 'private', score: 100 },
    { userId: 'me', score: 50 }, null,
  ], 'me');
  expect(history.completed).toBe(3);
  expect(history.byQuiz.get('zero')).toEqual({ count: 1, bestScore: 0 });
  expect(history.byQuiz.get('next')).toEqual({ count: 2, bestScore: 100 });
  expect(history.byQuiz.get('without-score').bestScore).toBeNull();
  expect(history.average).toBe(60);
  expect(history.byQuiz.has('private')).toBe(false);
  for (const value of [undefined, null, '', '  ', true, [], {}, -1, 101, NaN, Infinity]) expect(validQuizScore(value)).toBeNull();
});

test('completion filters and sorting do not mutate the original catalog or history', () => {
  const list = [quiz('Zulu', { createdAt: '2026-10-01', questions: [{}, {}] }), quiz('Alpha', { createdAt: '2026-10-02' })];
  const history = quizHistory([{ userId: 'me', quizId: 'Alpha', score: 0 }], 'me');
  expect(filterQuizzes(list, { uid: 'me', language: 'fr', progress: 'completed', history: history.byQuiz }).map(item => item.id)).toEqual(['Alpha']);
  expect(filterQuizzes(list, { uid: 'me', language: 'fr', progress: 'todo', history: history.byQuiz }).map(item => item.id)).toEqual(['Zulu']);
  expect(filterQuizzes(list, { uid: 'me', language: 'fr', sort: 'title' }).map(item => item.id)).toEqual(['Alpha', 'Zulu']);
  expect(filterQuizzes(list, { uid: 'me', language: 'fr', sort: 'questions' }).map(item => item.id)).toEqual(['Zulu', 'Alpha']);
  expect(list.map(item => item.id)).toEqual(['Zulu', 'Alpha']);
  expect(history.average).toBe(0);
  const dated = [quiz('missing'), quiz('dated', { createdAt: '2026-10-01' })];
  for (const sort of ['newest', 'oldest']) expect(filterQuizzes(dated, { language: 'fr', sort }).map(item => item.id)).toEqual(['dated', 'missing']);
});

test('title sorting and search use the same localized fallback displayed on untitled cards', () => {
  const list = [quiz('missing', { title: undefined }), quiz('generated', { title: 'Generated quiz' })];
  expect(quizTitle(undefined, 'fr')).toBe('Quiz sans titre');
  expect(quizTitle({}, 'ar')).toBe('اختبار بدون عنوان');
  expect(filterQuizzes(list, { language: 'fr', sort: 'title' }).map(item => item.id)).toEqual(['generated', 'missing']);
  expect(filterQuizzes(list, { language: 'fr', search: 'sans titre' }).map(item => item.id)).toEqual(['missing']);
});
