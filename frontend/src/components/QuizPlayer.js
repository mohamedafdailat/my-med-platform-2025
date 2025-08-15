import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const QuizPlayer = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const [quiz, setQuiz] = useState({
    title: { fr: 'Quiz non trouvé', ar: 'الاختبار غير موجود' },
    question: { fr: '', ar: '' },
    options: [],
    explanation: { fr: '', ar: '' },
  });
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizDoc = doc(db, 'quizzes', id);
        const docSnap = await getDoc(quizDoc);
        if (docSnap.exists()) {
          setQuiz(docSnap.data());
        }
      } catch (error) {
        console.error('Erreur Firestore:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleExplain = () => {
    setShowExplanation(true);
  };

  if (loading) {
    return <div>{language === 'fr' ? 'Chargement...' : 'جارٍ التحميل...'}</div>;
  }

  return (
    <div className="page-container">
      <h2 className="text-3xl font-bold mb-6">{quiz.title[language]}</h2>
      {quiz.question[language] ? (
        <div className="quiz-content">
          <p className="text-lg mb-4">{quiz.question[language]}</p>
          <div className="quiz-options">
            {quiz.options.map((option, index) => (
              <button
                key={index}
                className="quiz-option btn-secondary"
                onClick={() => alert(language === 'fr' ? 'Réponse enregistrée !' : 'تم تسجيل الإجابة !')}
              >
                {option[language]}
              </button>
            ))}
          </div>
          <button className="btn-primary mt-4" onClick={handleExplain}>
            {language === 'fr' ? 'Expliquer' : 'شرح'}
          </button>
          {showExplanation && (
            <div className="quiz-explanation mt-4 p-4 bg-gray-100 rounded-lg">
              <p>{quiz.explanation[language]}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500">
          {language === 'fr' ? 'Désolé, ce quiz n’est pas disponible.' : 'عذرًا، هذا الاختبار غير متاح.'}
        </p>
      )}
    </div>
  );
};

export default QuizPlayer;