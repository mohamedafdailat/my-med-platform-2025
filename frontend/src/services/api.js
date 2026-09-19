import axios from 'axios';
import { auth } from '../firebase/config';

/**
 * Normalise l'URL backend pour toujours finir sur /api.
 *
 * Exemples :
 * - undefined en dev  => http://localhost:5000/api
 * - undefined en prod => /api
 * - http://localhost:5000 => http://localhost:5000/api
 * - http://localhost:5000/api => http://localhost:5000/api
 */
const normalizeBaseURL = (url) => {
  const fallback =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : '';

  const rawUrl = (url || fallback).trim();

  if (!rawUrl) {
    return '/api';
  }

  const withoutTrailingSlash = rawUrl.replace(/\/+$/, '');

  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

const apiBaseURL = normalizeBaseURL(
  process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL
);

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Récupère le token Firebase si l'utilisateur est connecté.
 * Fallback localStorage gardé uniquement pour compatibilité avec l'ancien code.
 */
const getAuthToken = async () => {
  try {
    if (auth?.currentUser) {
      return await auth.currentUser.getIdToken();
    }

    return localStorage.getItem('token');
  } catch (error) {
    console.warn('Impossible de récupérer le token Firebase:', error);
    return localStorage.getItem('token');
  }
};

/**
 * Intercepteur request :
 * ajoute automatiquement Authorization: Bearer <token>
 */
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Intercepteur response :
 * rend les erreurs plus lisibles côté composants.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    const message =
      data?.message ||
      data?.error?.message ||
      data?.error ||
      error.message ||
      'Erreur réseau inconnue';

    const enhancedError = new Error(message);

    enhancedError.status = status;
    enhancedError.data = data;
    enhancedError.originalError = error;

    if (process.env.NODE_ENV === 'development') {
      console.error('API error:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        status,
        data,
        message,
      });
    }

    return Promise.reject(enhancedError);
  }
);

export const API_BASE_URL = apiBaseURL;

export default api;
