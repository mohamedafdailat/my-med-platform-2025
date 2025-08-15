import api from './api';

export const getChatbotResponse = async (message) => {
  try {
    // Simuler une réponse IA (à remplacer par une API comme OpenAI/Claude)
    return { response: `Réponse au message : "${message}"` };
    // const response = await api.post('/ai/chatbot', { message });
    // return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getTutorExplanation = async (topic) => {
  try {
    // Simuler une explication IA
    return { explanation: `Explication sur "${topic}" : Contenu éducatif simulé.` };
    // const response = await api.post('/ai/tutor', { topic });
    // return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getRecommendations = async (userId) => {
  try {
    // Simuler des recommandations
    const mockRecommendations = [
      { id: 1, type: 'video', title: 'Anatomie - Système Nerveux', url: '/videos/4' },
      { id: 2, type: 'quiz', title: 'Quiz sur la Pharmacologie', url: '/quizzes/2' },
    ];
    return mockRecommendations;
    // const response = await api.get(`/ai/recommendations/${userId}`);
    // return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};