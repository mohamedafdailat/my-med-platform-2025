import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

const AITutor = () => {
  const [topic, setTopic] = useState('');
  const [response, setResponse] = useState('');
  const { language } = useContext(LanguageContext);

  // Exemple de réponse statique (à remplacer par une API)
  const getTutorResponse = (selectedTopic) => {
    return language === 'fr'
      ? `Explication sur "${selectedTopic}" : Voici une introduction au sujet. Pour une explication détaillée, veuillez préciser votre question.`
      : `شرح حول "${selectedTopic}" : هذه مقدمة عن الموضوع. للحصول على شرح مفصل، يرجى تحديد سؤالك.`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setResponse(getTutorResponse(topic));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Tuteur IA' : 'معلم ذكاء اصطناعي'}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {language === 'fr' ? 'Sujet médical' : 'موضوع طبي'}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                language === 'fr' ? 'Entrez un sujet (ex. Anatomie)' : 'أدخل موضوعًا (مثل التشريح)'
              }
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200"
          >
            {language === 'fr' ? 'Obtenir une explication' : 'الحصول على شرح'}
          </button>
        </form>
        {response && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <p className="text-sm">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITutor;