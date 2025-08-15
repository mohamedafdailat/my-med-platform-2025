import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-gray-900 text-white w-64 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out md:hidden z-50`}
    >
      <div className="p-4">
        <button onClick={toggleSidebar} className="text-2xl mb-4">
          ✕
        </button>
        <nav className="space-y-4">
          <Link to="/dashboard" onClick={toggleSidebar} className="block hover:text-blue-300">
            {language === 'fr' ? 'Tableau de bord' : 'لوحة التحكم'}
          </Link>
          <Link to="/courses" onClick={toggleSidebar} className="block hover:text-blue-300">
            {language === 'fr' ? 'Cours' : 'الدورات'}
          </Link>
          <Link to="/videos" onClick={toggleSidebar} className="block hover:text-blue-300">
            {language === 'fr' ? 'Vidéos' : 'الفيديوهات'}
          </Link>
          <Link to="/quizzes" onClick={toggleSidebar} className="block hover:text-blue-300">
            {language === 'fr' ? 'Quiz' : 'الاختبارات'}
          </Link>
          <Link to="/flashcards" onClick={toggleSidebar} className="block hover:text-blue-300">
            {language === 'fr' ? 'Flashcards' : 'بطاقات تعليمية'}
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={toggleSidebar} className="block hover:text-blue-300">
              {language === 'fr' ? 'Admin' : 'الإدارة'}
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;