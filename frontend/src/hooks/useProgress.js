import { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import api from '/services/api';

const useProgress = () => {
  const { language } = useContext(LanguageContext);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProgress = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      // Simuler un appel API (à remplacer par un appel réel)
      const mockProgress = {
        courses: 75,
        videos: 60,
        quizzes: 85,
        flashcards: 45,
      };
      setProgress(mockProgress);
      // const response = await api.get(`/progress/${userId}`);
      // setProgress(response.data);
    } catch (err) {
      setError(
        language === 'fr'
          ? 'Erreur lors de la récupération des progrès.'
          : 'خطأ أثناء استرجاع التقدم.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (userId, type, value) => {
    setLoading(true);
    setError(null);
    try {
      // Simuler un appel API
      setProgress((prev) => ({ ...prev, [type]: value }));
      // const response = await api.put(`/progress/${userId}`, { type, value });
      // setProgress(response.data);
    } catch (err) {
      setError(
        language === 'fr'
          ? 'Erreur lors de la mise à jour des progrès.'
          : 'خطأ أثناء تحديث التقدم.'
      );
    } finally {
      setLoading(false);
    }
  };

  return { progress, loading, error, fetchProgress, updateProgress };
};

export default useProgress;