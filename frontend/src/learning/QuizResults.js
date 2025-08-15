import React, { useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LanguageContext } from '../contexts/LanguageContext';

const QuizResults = () => {
  const { language } = useContext(LanguageContext);
  const { state } = useLocation();
  const { answers, questions } = state || { answers: [], questions: [] };

  const score = answers.reduce((acc, answer, index) => {
    return answer === questions[index].correctAnswer ? acc + 1 : acc;
  }, 0);
  const percentage = ((score / questions.length) * 100).toFixed(2);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Résultats du Quiz' : 'نتائج الاختبار'}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'fr'
            ? `Votre score : ${score} / ${questions.length} (${percentage}%)`
            : `نتيجتك: ${score} / ${questions.length} (${percentage}%)`}
        </h2>
        <ul className="space-y-4">
          {questions.map((question, index) => (
            <li key={question.id} className="border-b pb-2">
              <p className="font-medium">{question.text}</p>
              <p className="text-sm">
                {language === 'fr' ? 'Votre réponse : ' : 'إجابتك: '}
                <span className={answers[index] === question.correctAnswer ? 'text-green-500' : 'text-red-500'}>
                  {answers[index]}
                </span>
              </p>
              {answers[index] !== question.correctAnswer && (
                <p className="text-sm">
                  {language === 'fr' ? 'Réponse correcte : ' : 'الإجابة الصحيحة: '}
                  <span className="text-green-500">{question.correctAnswer}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Link
            to="/quizzes"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
          >
            {language === 'fr' ? 'Retour aux Quiz' : 'العودة إلى الاختبارات'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;