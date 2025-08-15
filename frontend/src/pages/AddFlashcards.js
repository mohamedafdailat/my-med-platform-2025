// C:\my-med-platform\frontend\src\pages/AddFlashcards.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const AddFlashcards = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    question: '',
    answer: '',
    explanation: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.question || !formData.answer) {
      setError(language === 'fr' ? 'Tous les champs requis doivent être remplis.' : 'يجب ملء جميع الحقول المطلوبة.');
      return;
    }

    try {
      await addDoc(collection(db, 'flashcards'), {
        ...formData,
        language: language,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      setSuccess(language === 'fr' ? 'Flashcard ajoutée avec succès !' : 'تمت إضافة البطاقة التعليمية بنجاح !');
      setFormData({ title: '', category: '', question: '', answer: '', explanation: '' });
      setTimeout(() => navigate('/admin/flashcards'), 2000);
    } catch (err) {
      setError(language === 'fr' ? 'Erreur lors de l\'ajout.' : 'خطأ أثناء الإضافة.');
      console.error(err);
    }
  };

  const t = {
    fr: {
      title: 'Titre',
      category: 'Catégorie',
      question: 'Question',
      answer: 'Réponse',
      explanation: 'Explication (optionnel)',
      submit: 'Ajouter la Flashcard',
      error: 'Erreur',
      success: 'Succès',
    },
    ar: {
      title: 'العنوان',
      category: 'الفئة',
      question: 'السؤال',
      answer: 'الإجابة',
      explanation: 'الشرح (اختياري)',
      submit: 'إضافة البطاقة التعليمية',
      error: 'خطأ',
      success: 'نجاح',
    },
  }[language];

  return (
    <div className="page-container min-h-[calc(100vh-12rem)] bg-gradient-to-r from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
          {t.title}
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 text-center mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t.title} *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t.category}</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t.question} *</label>
            <textarea
              name="question"
              value={formData.question}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t.answer} *</label>
            <textarea
              name="answer"
              value={formData.answer}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t.explanation}</label>
            <textarea
              name="explanation"
              value={formData.explanation}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t.submit}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddFlashcards;