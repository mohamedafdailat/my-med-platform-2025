import api from './api';

export const getQuizzes = async () => {
  try {
    // Simuler un appel API
    const mockQuizzes = [
      { id: 1, title: 'Quiz Anatomie', questions: [{ id: 1, text: 'Quel est le muscle principal du cœur ?', options: ['Myocarde', 'Péricarde', 'Endocarde', 'Diaphragme'], correctAnswer: 'Myocarde' }] },
      { id: 2, title: 'Quiz Physiologie', questions: [{ id: 1, text: 'Quelle est la fonction des alvéoles ?', options: ['Filtrer le sang', 'Échanger les gaz', 'Produire du mucus', 'Contracter les poumons'], correctAnswer: 'Échanger les gaz' }] },
    ];
    return mockQuizzes;
    // const response = await api.get('/quizzes');
    // return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const submitQuiz = async (quizId, answers) => {
  try {
    // Simuler un appel API
    return { score: Math.floor(Math.random() * 100), total: 100 };
    // const response = await api.post(`/quizzes/${quizId}/submit`, { answers });
    // return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const uploadQuiz = async (title, questions) => {
  try {
    // Simuler un appel API
    return { message: 'Quiz chargé avec succès.', title };
    // const response = await api.post('/quizzes', { title, questions });
    // return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};