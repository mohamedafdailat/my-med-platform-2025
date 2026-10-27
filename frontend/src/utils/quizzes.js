import { toDate } from './dates';

export const quizText = (value, language, fallback = '') => {
  if (typeof value === 'string') return value.trim() ? value : fallback;
  return [value?.[language], value?.fr, value?.ar].find(text => typeof text === 'string' && text.trim()) || fallback;
};
export const quizTitle = (value, language) => quizText(value, language, language === 'ar' ? 'اختبار بدون عنوان' : 'Quiz sans titre');
export const quizSearchText = value => String(value || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
export const quizCategory = value => {
  const key = typeof value === 'string' ? quizSearchText(value).replace(/[\s_]+/g, '-') : 'other';
  const aliases = { 'medecine-generale': 'general-medicine', pharmacie: 'pharmacy', cardiologie: 'cardiology', anatomie: 'anatomy', physiologie: 'physiology', pharmacologie: 'pharmacology', pathologie: 'pathology', 'sante-dentaire': 'dentaire', 'technologie-medicale': 'technology', autres: 'other' };
  return Object.prototype.hasOwnProperty.call(aliases, key) ? aliases[key] : key || 'other';
};
export const quizCategoryLabel = (key, labels = {}) => Object.prototype.hasOwnProperty.call(labels, key) && typeof labels[key] === 'string' ? labels[key] : key;
const quizDate = value => { try { return toDate(value); } catch { return null; } };
export const normalizeQuiz = (id, value = {}) => {
  if (!value || typeof value !== 'object' || value.status === 'inactive') return null;
  return {
    id, title: value.title, description: value.description, course: value.course,
    creatorId: typeof value.creatorId === 'string' ? value.creatorId : '',
    visibility: ['private', 'shared'].includes(value.visibility) ? value.visibility : 'unclassified',
    semester: value.semester, category: quizCategory(value.category),
    type: value.type === 'ai-generated' ? 'ai-generated' : 'standard',
    difficulty: ['easy', 'medium', 'hard'].includes(value.difficulty) ? value.difficulty : null,
    questionCount: Array.isArray(value.questions) ? value.questions.length : 0,
    createdAt: quizDate(value.createdAt),
  };
};
export const validQuizScore = value => {
  if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return null;
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
};
// Scores belong to individual server-recorded attempts, never the shared quiz.
export const quizHistory = (attempts, uid) => {
  const byQuiz = new Map();
  const scores = [];
  for (const attempt of Array.isArray(attempts) ? attempts : []) {
    if (!attempt || attempt.userId !== uid || typeof attempt.quizId !== 'string' || !attempt.quizId) continue;
    const score = validQuizScore(attempt.score);
    const previous = byQuiz.get(attempt.quizId) || { count: 0, bestScore: null };
    byQuiz.set(attempt.quizId, { count: previous.count + 1, bestScore: score === null ? previous.bestScore : previous.bestScore === null ? score : Math.max(score, previous.bestScore) });
    if (score !== null) scores.push(score);
  }
  return { byQuiz, completed: byQuiz.size, average: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null };
};
export const quizInSpace = (quiz, space, uid) => {
  if (space === 'library') return quiz.visibility === 'shared';
  if (space === 'personal') return quiz.visibility === 'private' && quiz.creatorId === uid;
  if (space === 'admin') return quiz.visibility !== 'shared' && !(quiz.visibility === 'private' && quiz.creatorId === uid);
  return true;
};
export const filterQuizzes = (quizzes, { language, search = '', space = 'all', category = 'all', source = 'all', progress = 'all', sort = 'newest', uid, history = new Map(), categoryNames = {} }) => {
  const term = quizSearchText(search);
  return quizzes.filter(quiz => {
    const completed = history.has(quiz.id);
    return quizInSpace(quiz, space, uid) && (category === 'all' || quiz.category === category)
      && (source === 'all' || quiz.type === source) && (progress === 'all' || (progress === 'completed' ? completed : !completed))
      && quizSearchText([quizTitle(quiz.title, language), quizText(quiz.description, language), quizText(quiz.course, language), quizCategoryLabel(quiz.category, categoryNames)].join(' ')).includes(term);
  }).sort((a, b) => {
    if (sort === 'title') return quizTitle(a.title, language).localeCompare(quizTitle(b.title, language), language === 'ar' ? 'ar' : 'fr');
    if (sort === 'questions') return b.questionCount - a.questionCount || a.id.localeCompare(b.id);
    if (!a.createdAt || !b.createdAt) return a.createdAt ? -1 : b.createdAt ? 1 : a.id.localeCompare(b.id);
    const difference = b.createdAt.getTime() - a.createdAt.getTime();
    return (sort === 'oldest' ? -difference : difference) || a.id.localeCompare(b.id);
  });
};
