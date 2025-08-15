import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../contexts/LanguageContext';

const Recommendations = () => {
  const { language } = useContext(LanguageContext);

  // Données d'exemple (à remplacer par une API)
  const recommendations = [
    {
      id: 1,
      type: 'video',
      title: 'Anatomie - Système Nerveux',
      url: '/videos/4',
    },
    {
      id: 2,
      type: 'quiz',
      title: 'Quiz sur la Pharmacologie',
      url: '/quizzes/2',
    },
    {
      id: 3,
      type: 'flashcard',
      title: 'Flashcards de Pathologie',
      url: '/flashcards/2',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Recommandations Personnalisées' : 'توصيات مخصصة'}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'fr' ? 'Contenu suggéré pour vous' : 'محتوى مقترح لك'}
        </h2>
        {recommendations.length > 0 ? (
          <ul className="space-y-4">
            {recommendations.map((item) => (
              <li key={item.id} className="border-b pb-2">
                <Link
                  to={item.url}
                  className="text-blue-500 hover:underline font-medium"
                >
                  {language === 'fr'
                    ? `${item.type === 'video' ? 'Vidéo' : item.type === 'quiz' ? 'Quiz' : 'Flashcards'} : ${item.title}`
                    : `${item.type === 'video' ? 'فيديو' : item.type === 'quiz' ? 'اختبار' : 'بطاقات تعليمية'} : ${item.title}`}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            {language === 'fr'
              ? 'Aucune recommandation pour le moment.'
              : 'لا توجد توصيات في الوقت الحالي.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default Recommendations;