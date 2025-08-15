const aiService = require('../services/aiService');

const getChatbotResponse = async (req, res) => {
  try {
    const { message } = req.body;
    const response = await aiService.getChatbotResponse(message);
    res.status(200).json({ response });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTutorExplanation = async (req, res) => {
  try {
    const { topic } = req.body;
    const explanation = await aiService.getTutorExplanation(topic);
    res.status(200).json({ explanation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const recommendations = await aiService.getRecommendations(userId);
    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getChatbotResponse, getTutorExplanation, getRecommendations };