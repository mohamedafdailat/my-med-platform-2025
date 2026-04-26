import axios from 'axios';

const normalizeBaseURL = (url) => {
  if (!url) {
    return '/api';
  }

  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const apiBaseURL = normalizeBaseURL(
  process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '')
);

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
