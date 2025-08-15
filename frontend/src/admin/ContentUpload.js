import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const ContentUpload = () => {
  const { user } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('video');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setMessage(
        language === 'fr'
          ? 'Veuillez sélectionner un fichier.'
          : 'يرجى اختيار ملف.'
      );
      return;
    }
    // Simuler un upload (à remplacer par une API)
    setMessage(
      language === 'fr'
        ? `Contenu "${title}" (${type}) chargé avec succès.`
        : `تم رفع المحتوى "${title}" (${type}) بنجاح.`
    );
    setTitle('');
    setType('video');
    setFile(null);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">
          {language === 'fr' ? 'Accès non autorisé.' : 'غير مصرح بالوصول.'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Charger du Contenu' : 'رفع المحتوى'}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {message && <p className="text-green-500 mb-4">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {language === 'fr' ? 'Titre' : 'العنوان'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {language === 'fr' ? 'Type de contenu' : 'نوع المحتوى'}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="video">{language === 'fr' ? 'Vidéo' : 'فيديو'}</option>
              <option value="quiz">{language === 'fr' ? 'Quiz' : 'اختبار'}</option>
              <option value="flashcard">{language === 'fr' ? 'Flashcard' : 'بطاقة تعليمية'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {language === 'fr' ? 'Fichier' : 'الملف'}
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              accept={type === 'video' ? 'video/*' : type === 'quiz' ? '.json' : '.txt'}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200"
          >
            {language === 'fr' ? 'Charger' : 'رفع'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContentUpload;