import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { auth } from '../firebase/config';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { language, setLanguage } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérifier le rôle admin à partir des custom claims
  useEffect(() => {
    const checkAdminRole = async () => {
      if (user && auth.currentUser) {
        try {
          const idTokenResult = await auth.currentUser.getIdTokenResult();
          const userRole = idTokenResult.claims.role;
          console.log('User role from token:', userRole); // Debug
          setIsAdmin(userRole === 'admin');
        } catch (error) {
          console.error('Erreur lors de la vérification du rôle:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkAdminRole();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img src="/footer.png" alt="MedPlatform Maroc Logo" className="h-8 w-auto object-contain" />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/dashboard" className="hover:text-blue-200">
            {language === 'fr' ? 'Tableau de bord' : 'لوحة التحكم'}
          </Link>
          <Link to="/courses" className="hover:text-blue-200">
            {language === 'fr' ? 'Cours' : 'الدروس'}
          </Link>
          <Link to="/videos" className="hover:text-blue-200">
            {language === 'fr' ? 'Vidéos' : 'الفيديوهات'}
          </Link>
          <Link to="/quizzes" className="hover:text-blue-200">
            {language === 'fr' ? 'Quiz' : 'الاختبارات'}
          </Link>
          <Link to="/flashcards" className="hover:text-blue-200">
            {language === 'fr' ? 'Flashcards' : 'البطاقات التعليمية'}
          </Link>
          
          {/* Bouton Admin avec vérification du rôle */}
          {!loading && isAdmin && (
            <Link to="/admin" className="hover:text-blue-200 bg-red-500 px-2 py-1 rounded">
              {language === 'fr' ? 'Admin' : 'إدارة'}
            </Link>
          )}
          
          {/* Debug temporaire - à supprimer après test */}
          {user && !loading && (
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
              Role: {isAdmin ? 'admin' : 'user'}
            </span>
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-blue-500 text-white border-none rounded px-2 py-1"
          >
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>

          {/* User Profile / Login */}
          {user ? (
            <div className="flex items-center space-x-2">
              <Link to="/profile" className="hover:text-blue-200">
                {user.displayName || user.email || 'Profil'}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
              >
                {language === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded">
              {language === 'fr' ? 'Connexion' : 'تسجيل الدخول'}
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <nav className="px-4 py-2 space-y-2">
          <Link to="/dashboard" className="block hover:text-blue-200">
            {language === 'fr' ? 'Tableau de bord' : 'لوحة التحكم'}
          </Link>
          <Link to="/courses" className="block hover:text-blue-200">
            {language === 'fr' ? 'Cours' : 'الدروس'}
          </Link>
          <Link to="/videos" className="block hover:text-blue-200">
            {language === 'fr' ? 'Vidéos' : 'الفيديوهات'}
          </Link>
          <Link to="/quizzes" className="block hover:text-blue-200">
            {language === 'fr' ? 'Quiz' : 'الاختبارات'}
          </Link>
          <Link to="/flashcards" className="block hover:text-blue-200">
            {language === 'fr' ? 'Flashcards' : 'البطاقات التعليمية'}
          </Link>
          {!loading && isAdmin && (
            <Link to="/admin" className="block hover:text-blue-200 bg-red-500 px-2 py-1 rounded w-fit">
              {language === 'fr' ? 'Admin' : 'إدارة'}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;