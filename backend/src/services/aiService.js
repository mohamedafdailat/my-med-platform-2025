const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const getChatbotResponse = async (message) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error(`Erreur réponse chatbot : ${error.message}`);
  }
};

const getTutorExplanation = async (topic) => {
  try {
    const prompt = `Expliquez le sujet médical "${topic}" de manière claire et concise pour un étudiant en médecine.`;
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error(`Erreur explication tuteur : ${error.message}`);
  }
};

const getRecommendations = async (userId) => {
  try {
    // Simuler des recommandations basées sur l'historique (à implémenter avec Firestore)
    const mockRecommendations = [
      { id: '1', type: 'video', title: 'Anatomie - Système Nerveux', url: '/videos/4' },
      { id: '2', type: 'quiz', title: 'Quiz sur la Pharmacologie', url: '/quizzes/2' },
    ];
    return mockRecommendations;
  } catch (error) {
    throw new Error(`Erreur recommandations : ${error.message}`);
  }
};

module.exports = { getChatbotResponse, getTutorExplanation, getRecommendations };