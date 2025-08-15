import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const RecentActivity = () => {
  const { language } = useLanguage();

  const activities = [
    { id: 1, type: 'video', title: 'Anatomie - Cœur', date: '2025-06-14' },
    { id: 2, type: 'quiz', title: 'Quiz Physiologie', date: '2025-06-13' },
    { id: 3, type: 'flashcard', title: 'Flashcards Pharmacologie', date: '2025-06-12' },
  ];

  return (
    <div className="space-y-4">
      {activities.length > 0 ? (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <li key={activity.id} className="border-b pb-2">
              <p className="text-sm font-medium">
                {language === 'fr' ? (
                  <>
                    {activity.type === 'video' && 'Visionnage de la vidéo : '}
                    {activity.type === 'quiz' && 'Complétion du quiz : '}
                    {activity.type === 'flashcard' && 'Révision des flashcards : '}
                    <span className="font-bold">{activity.title}</span>
                  </>
                ) : (
                  <>
                    {activity.type === 'video' && 'مشاهدة الفيديو: '}
                    {activity.type === 'quiz' && 'إكمال الاختبار: '}
                    {activity.type === 'flashcard' && 'مراجعة البطاقات التعليمية: '}
                    <span className="font-bold">{activity.title}</span>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500">{activity.date}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">
          {language === 'fr' ? 'Aucune activité récente.' : 'لا توجد أنشطة حديثة.'}
        </p>
      )}
    </div>
  );
};

export default RecentActivity;