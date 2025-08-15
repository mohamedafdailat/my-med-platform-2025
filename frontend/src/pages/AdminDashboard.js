// C:\my-med-platform\frontend\src\pages\AdminDashboard.js
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { language } = useLanguage();

  return (
    <div className="page-container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Tableau de bord Admin' : 'لوحة التحكم الإدارية'}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/add-video"
          className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
        >
          {language === 'fr' ? 'Ajouter une vidéo' : 'إضافة فيديو'}
        </Link>
        <Link
          to="/admin/users"
          className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center"
        >
          {language === 'fr' ? 'Gérer les utilisateurs' : 'إدارة المستخدمين'}
        </Link>
        <Link
          to="/admin/videos"
          className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-center"
        >
          {language === 'fr' ? 'Gérer les vidéos' : 'إدارة الفيديوهات'}
        </Link>
        <Link
          to="/admin/qcms"
          className="bg-yellow-600 text-white p-4 rounded-lg hover:bg-yellow-700 transition-colors text-center"
        >
          {language === 'fr' ? 'Gérer les QCMs' : 'إدارة الاختبارات'}
        </Link>
        {/* Add more links as needed (e.g., delete, modify stats) */}
      </div>
    </div>
  );
};

export default AdminDashboard;