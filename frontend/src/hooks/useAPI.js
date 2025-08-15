import { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import api from '/services/api';

const useAPI = () => {
  const { language } = useContext(LanguageContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const get = async (endpoint) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (err) {
      setError(
        language === 'fr'
          ? 'Erreur lors de la récupération des données.'
          : 'خطأ أثناء استرجاع البيانات.'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const post = async (endpoint, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (err) {
      setError(
        language === 'fr'
          ? 'Erreur lors de l\'envoi des données.'
          : 'خطأ أثناء إرسال البيانات.'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const put = async (endpoint, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(endpoint, data);
      return response.data;
    } catch (err) {
      setError(
        language === 'fr'
          ? 'Erreur lors de la mise à jour des données.'
          : 'خطأ أثناء تحديث البيانات.'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const del = async (endpoint) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(endpoint);
      return response.data;
    } catch (err) {
      setError(
        language === 'fr'
          ? 'Erreur lors de la suppression des données.'
          : 'خطأ أثناء حذف البيانات.'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { get, post, put, del, loading, error };
};

export default useAPI;