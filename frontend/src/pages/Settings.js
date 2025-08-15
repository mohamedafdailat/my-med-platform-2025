import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NavLink } from 'react-router-dom'; // Added for navigation

const Settings = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage(); // Destructure setLanguage, which is now available

  const handleLogout = async () => {
    try {
      await logout();
      alert(language === 'fr' ? 'Déconnexion réussie' : 'تم تسجيل الخروج بنجاح');
    } catch (error) {
      alert(language === 'fr' ? 'Erreur lors de la déconnexion' : 'خطأ أثناء تسجيل الخروج');
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value); // Now works with the exposed setLanguage
  };

  if (!user) {
    return <div className="text-center text-red-500">{language === 'fr' ? 'Veuillez vous connecter' : 'يرجى تسجيل الدخول'}</div>;
  }

  return (
    <div className="page-container min-h-[calc(100vh-12rem)] flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          {language === 'fr' ? 'Paramètres' : 'الإعدادات'}
        </h2>
        <div className="settings-section space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">
              {language === 'fr' ? 'Préférences' : 'التفضيلات'}
            </h3>
            <div className="form-group">
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Langue' : 'اللغة'}
              </label>
              <select
                id="language"
                value={language}
                onChange={handleLanguageChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">
              {language === 'fr' ? 'Compte' : 'الحساب'}
            </h3>
            <NavLink
              to="/forgot-password"
              className="block mb-4 text-blue-600 hover:text-blue-800 underline text-sm"
            >
              {language === 'fr' ? 'Mot de passe oublié ?' : 'نسيت كلمة المرور؟'}
            </NavLink>
            <button
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              onClick={handleLogout}
            >
              {language === 'fr' ? 'Se déconnecter' : 'تسجيل الخروج'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;