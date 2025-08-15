import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Assure-toi que firebase.js est configuré

const Login = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard'); // Redirige vers le tableau de bord après connexion
    } catch (err) {
      setError(language === 'fr' ? 'Échec de la connexion' : 'فشل تسجيل الدخول');
      console.error(err.message);
    }
  };

  return (
    <div className="auth-container min-h-[calc(100vh-12rem)] bg-gradient-to-r from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <form onSubmit={handleLogin} className="auth-form space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'fr' ? 'Email' : 'البريد الإلكتروني'}
              className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={language === 'fr' ? 'Mot de passe' : 'كلمة المرور'}
              className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
            {language === 'fr' ? 'Se connecter' : 'تسجيل الدخول'}
          </button>
        </form>
        <div className="mt-4 text-center space-y-2">
          <p>
            {language === 'fr' ? 'Pas encore inscrit ? ' : 'ليس لديك حساب؟ '}
            <NavLink to="/register" className="text-blue-500 hover:text-blue-700">S'inscrire</NavLink>
          </p>
          <NavLink to="/forgot-password" className="block text-blue-500 hover:text-blue-700">
            {language === 'fr' ? 'Mot de passe oublié ?' : 'نسيت كلمة المرور؟'}
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Login;