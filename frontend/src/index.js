import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';

// import reportWebVitals from './reportWebVitals'; // Commenté pour éviter l'erreur

// Configuration pour le développement
if (process.env.NODE_ENV === 'development') {
  // Activer les outils de développement React
  if (typeof window !== 'undefined') {
    window.React = React;
  }
}

// Création du root React 18
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendu de l'application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mesure des performances (optionnel)
// Pour mesurer les performances, passez une fonction
// pour logger les résultats (par exemple: reportWebVitals(console.log))
// ou envoyez vers un endpoint d'analytics. En savoir plus: https://bit.ly/CRA-vitals
// reportWebVitals(console.log); // Commenté pour éviter l'erreur

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
  console.error('Erreur globale capturée:', event.error);
  // Ici, vous pourriez envoyer l'erreur vers un service de monitoring
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejetée non gérée:', event.reason);
  // Ici, vous pourriez envoyer l'erreur vers un service de monitoring
});