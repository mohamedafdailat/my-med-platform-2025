import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const QCMPlayer = ({ qcm, onClose, onComplete }) => {
  const { language } = useLanguage();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(qcm.timeLimit * 60); // en secondes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(true);

  const getLocalizedText = (textObj) => {
    if (typeof textObj === 'string') return textObj;
    return textObj?.[language] || textObj?.fr || textObj?.ar || '';
  };

  // Timer
  useEffect(() => {
    if (!isTimerActive || timeRemaining <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitQCM();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isTimerActive, isSubmitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (isSubmitted) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const calculateResults = useCallback(() => {
    let correctAnswers = 0;
    const detailedResults = qcm.questions.map((question, index) => {
      const userAnswer = answers[index];
      const correctAnswer = question.options.findIndex(option => option.isCorrect);
      const isCorrect = userAnswer === correctAnswer;
      
      if (isCorrect) correctAnswers++;
      
      return {
        questionIndex: index,
        question: question.question,
        userAnswer,
        correctAnswer,
        isCorrect,
        options: question.options,
        explanation: question.explanation
      };
    });

    const score = Math.round((correctAnswers / qcm.questions.length) * 100);
    const passed = score >= qcm.passingScore;

    return {
      totalQuestions: qcm.questions.length,
      correctAnswers,
      incorrectAnswers: qcm.questions.length - correctAnswers,
      score,
      passed,
      detailedResults
    };
  }, [answers, qcm]);

  const handleSubmitQCM = async () => {
    if (isSubmitted) return;
    
    setIsTimerActive(false);
    setIsSubmitted(true);
    
    const results = calculateResults();
    setResults(results);
    
    // Sauvegarder les résultats dans la base de données
    try {
      await addDoc(collection(db, 'qcm_results'), {
        qcmId: qcm.id,
        videoId: qcm.videoId,
        answers,
        results,
        completedAt: new Date().toISOString(),
        timeSpent: (qcm.timeLimit * 60) - timeRemaining
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des résultats:', error);
    }
    
    setShowResults(true);
    onComplete && onComplete(results);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < qcm.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  if (showResults && results) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className={`p-6 rounded-t-xl ${results.passed ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {language === 'fr' ? 'Résultats du QCM' : 'نتائج الاختبار'}
                </h2>
                <p className="text-lg">
                  {results.passed 
                    ? (language === 'fr' ? 'Félicitations! Vous avez réussi!' : 'مبروك! لقد نجحت!')
                    : (language === 'fr' ? 'Vous n\'avez pas atteint le score requis.' : 'لم تحقق النقاط المطلوبة.')
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Résumé des résultats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{results.score}%</div>
                <div className="text-sm text-gray-600">
                  {language === 'fr' ? 'Score' : 'النقاط'}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{results.correctAnswers}</div>
                <div className="text-sm text-gray-600">
                  {language === 'fr' ? 'Correctes' : 'صحيحة'}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{results.incorrectAnswers}</div>
                <div className="text-sm text-gray-600">
                  {language === 'fr' ? 'Incorrectes' : 'خاطئة'}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-600">{results.totalQuestions}</div>
                <div className="text-sm text-gray-600">
                  {language === 'fr' ? 'Total' : 'المجموع'}
                </div>
              </div>
            </div>

            {/* Détail des réponses */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {language === 'fr' ? 'Détail des réponses' : 'تفاصيل الإجابات'}
              </h3>
              {results.detailedResults.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  result.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">
                      {index + 1}. {getLocalizedText(result.question)}
                    </h4>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      result.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {result.isCorrect 
                        ? (language === 'fr' ? 'Correct' : 'صحيح')
                        : (language === 'fr' ? 'Incorrect' : 'خاطئ')
                      }
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {result.options.map((option, optionIndex) => {
                      const isUserAnswer = result.userAnswer === optionIndex;
                      const isCorrectAnswer = result.correctAnswer === optionIndex;
                      
                      return (
                        <div key={optionIndex} className={`p-2 rounded flex items-center ${
                          isCorrectAnswer ? 'bg-green-100 border border-green-300' :
                          isUserAnswer && !isCorrectAnswer ? 'bg-red-100 border border-red-300' :
                          'bg-gray-50'
                        }`}>
                          <span className="mr-3 font-medium">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span className="flex-1">
                            {getLocalizedText(option)}
                          </span>
                          <div className="flex space-x-2">
                            {isUserAnswer && (
                              <span className="text-blue-600 text-sm">
                                {language === 'fr' ? 'Votre réponse' : 'إجابتك'}
                              </span>
                            )}
                            {isCorrectAnswer && (
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {result.explanation && getLocalizedText(result.explanation) && (
                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                      <p className="text-sm">
                        <span className="font-medium">
                          {language === 'fr' ? 'Explication: ' : 'التوضيح: '}
                        </span>
                        {getLocalizedText(result.explanation)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                {language === 'fr' ? 'Fermer' : 'إغلاق'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = qcm.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / qcm.questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-xl text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {getLocalizedText(qcm.title)}
              </h2>
              <p className="text-blue-100">
                {language === 'fr' ? 'Question' : 'السؤال'} {currentQuestionIndex + 1} / {qcm.questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatTime(timeRemaining)}</div>
              <div className="text-sm text-blue-100">
                {language === 'fr' ? 'Temps restant' : 'الوقت المتبقي'}
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 bg-blue-800 rounded-full h-2">
            <div 
              className="bg-blue-300 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">
              {getLocalizedText(currentQuestion.question)}
            </h3>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                  disabled={isSubmitted}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    answers[currentQuestionIndex] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${isSubmitted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{getLocalizedText(option)}</span>
                    {answers[currentQuestionIndex] === index && (
                      <svg className="w-5 h-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question navigation */}
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {qcm.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[index] !== undefined
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {language === 'fr' 
                ? `${Object.keys(answers).length} sur ${qcm.questions.length} questions répondues`
                : `${Object.keys(answers).length} من ${qcm.questions.length} أسئلة تم الإجابة عليها`
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 rounded-b-xl">
          <div className="flex justify-between">
            <div className="flex space-x-3">
              <button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {language === 'fr' ? 'Précédent' : 'السابق'}
              </button>
              
              {currentQuestionIndex < qcm.questions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {language === 'fr' ? 'Suivant' : 'التالي'}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmitQCM}
                  disabled={isSubmitted}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {language === 'fr' ? 'Terminer le QCM' : 'إنهاء الاختبار'}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              {language === 'fr' ? 'Quitter' : 'خروج'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCMPlayer;