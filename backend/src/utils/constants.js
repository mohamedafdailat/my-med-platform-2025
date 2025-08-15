const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

const CONTENT_TYPES = {
  VIDEO: 'video',
  QUIZ: 'quiz',
  FLASHCARD: 'flashcard',
};

const COLLECTIONS = {
  USERS: 'users',
  VIDEOS: 'videos',
  QUIZZES: 'quizzes',
  FLASHCARDS: 'flashcards',
  PROGRESS: 'progress',
};

const ERROR_CODES = {
  NOT_FOUND: 'notFound',
  UNAUTHORIZED: 'unauthorized',
  SERVER_ERROR: 'serverError',
};

module.exports = {
  ROLES,
  CONTENT_TYPES,
  COLLECTIONS,
  ERROR_CODES,
};