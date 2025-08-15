const axios = require('axios');

const getChatbotResponse = async (req, res) => {
  try {
    const { message } = req.body;
    // Simuler une réponse IA (à remplacer par une API comme OpenAI/Claude)
    const response = `Réponse au message : "${message}"`;
    res.status(200).json({ response });
    // Exemple avec une API externe (décommenter et configurer) :
    // const result = await axios.post('https://api.openai.com/v1/chat/completions', {
    //   model: 'gpt-3.5-turbo',
    //   messages: [{ role: 'user', content: message }],
    // }, {
    //   headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    // });
    // res.status(200).json({ response: result.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTutorExplanation = async (req, res) => {
  try {
    const { topic } = req.body;
    // Simuler une explication IA
    const explanation = `Explication sur "${topic}" : Contenu éducatif simulé.`;
    res.status(200).json({ explanation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    // Simuler des recommandations (à implémenter avec un modèle de recommandation)
    const recommendations = [
      { id: '1', type: 'video', title: 'Anatomie - Système Nerveux', url: '/videos/4' },
      { id: '2', type: 'quiz', title: 'Quiz sur la Pharmacologie', url: '/quizzes/2' },
    ];
    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getChatbotResponse, getTutorExplanation, getRecommendations };