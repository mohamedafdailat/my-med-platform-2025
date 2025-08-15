import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../contexts/LanguageContext';

const Quiz = () => {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);

  // Données d'exemple (à remplacer par une API)
  const questions = [
    {
      id: 1,
      text: language === 'fr' ? 'Quel est le muscle principal du cœur ?' : 'ما هي العضلة الرئيسية للقلب؟',
      options: ['Myocarde', 'Péricarde', 'Endocarde', 'Diaphragme'],
      correctAnswer: 'Myocarde',
    },
    {
      id: 2,
      text: language === 'fr' ? 'Quelle est la fonction des alvéoles pulmonaires ?' : 'ما هي وظيفة الحويصلات الرئوية؟',
      options: ['Filtrer le sang', 'Échanger les gaz', 'Produire du mucus', 'Contracter les poumons'],
      correctAnswer: 'Échanger les gaz',
    },
  ];

  const handleAnswer = (answer) => {
    setAnswers([...answers, answer]);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      navigate('/quiz-results', { state: { answers, questions } });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Quiz' : 'اختبار'}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'fr' ? `Question ${currentQuestion + 1} / ${questions.length}` : `السؤال ${currentQuestion + 1} / ${questions.length}`}
        </h2>
        <p className="mb-4">{questions[currentQuestion].text}</p>
        <div className="grid grid-cols-1 gap-4">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;