import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight, Trophy, CheckCircle, XCircle, Eye, EyeOff, Save, RotateCcw, BookOpen } from 'lucide-react';

const QuizPlayer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(null);

  const translations = {
    fr: {
      loading: 'Chargement du quiz...',
      error: 'Erreur lors du chargement du quiz',
      question: 'Question',
      nextQuestion: 'Question suivante',
      previousQuestion: 'Question précédente',
      submitQuiz: 'Terminer le quiz',
      results: 'Résultats',
      score: 'Score',
      timeSpent: 'Temps passé',
      correct: 'Correct',
      incorrect: 'Incorrect',
      accuracy: 'Précision',
      saveQuiz: 'Sauvegarder le quiz',
      newQuiz: 'Nouveau quiz',
      backToQuizzes: 'Retour aux quiz',
      minutes: 'min',
      seconds: 's',
      congratulations: 'Félicitations !',
      quizComplete: 'Quiz terminé !',
      yourScore: 'Votre score',
      reviewAnswers: 'Revoir les réponses',
      showExplanation: 'Voir l\'explication',
      hideExplanation: 'Masquer l\'explication',
      explanation: 'Explication',
      trueLabel: 'Vrai',
      falseLabel: 'Faux',
      answerPlaceholder: 'Tapez votre réponse ici...',
      questionsAnswered: 'questions répondues',
      progress: 'Progression',
    },
    ar: {
      loading: 'جاري تحميل الاختبار...',
      error: 'خطأ في تحميل الاختبار',
      question: 'سؤال',
      nextQuestion: 'السؤال التالي',
      previousQuestion: 'السؤال السابق',
      submitQuiz: 'إنهاء الاختبار',
      results: 'النتائج',
      score: 'النتيجة',
      timeSpent: 'الوقت المستغرق',
      correct: 'صحيح',
      incorrect: 'خاطئ',
      accuracy: 'الدقة',
      saveQuiz: 'حفظ الاختبار',
      newQuiz: 'اختبار جديد',
      backToQuizzes: 'العودة إلى الاختبارات',
      minutes: 'د',
      seconds: 'ث',
      congratulations: 'تهانينا !',
      quizComplete: 'انتهى الاختبار !',
      yourScore: 'نتيجتك',
      reviewAnswers: 'مراجعة الإجابات',
      showExplanation: 'إظهار التفسير',
      hideExplanation: 'إخفاء التفسير',
      explanation: 'التفسير',
      trueLabel: 'صحيح',
      falseLabel: 'خاطئ',
      answerPlaceholder: 'اكتب إجابتك هنا...',
      questionsAnswered: 'أسئلة مُجابة',
      progress: 'التقدم',
    },
  };

  const t = translations[language] || translations.fr;
  const isRTL = language === 'ar';

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'quizzes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setQuiz({ id: docSnap.id, ...docSnap.data() });
        setQuizStartTime(Date.now());
      } else {
        setError(t.error + ' (Quiz non trouvé)');
        toast.error(t.error + ' (Quiz non trouvé)');
      }
    } catch (err) {
      setError(t.error + `: ${err.message}`);
      toast.error(t.error + `: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id, t.error]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleAnswerSelect = (questionId, answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const calculateResults = () => {
    if (!quiz) return { score: 0, total: 0, percentage: 0, timeSpent: 0 };
    let correct = 0;
    const total = quiz.questions.length;

    quiz.questions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      if (userAnswer !== undefined) {
        if (question.type === 'multiple_choice' && userAnswer === question.correctAnswer) {
          correct++;
        } else if (question.type === 'true_false' && userAnswer === question.correctAnswer) {
          correct++;
        } else if (
          question.type === 'short_answer' &&
          userAnswer?.toLowerCase()?.trim() === question.correctAnswer[language]?.toLowerCase()?.trim()
        ) {
          correct++;
        }
      }
    });

    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const timeSpent = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;

    return { score: correct, total, percentage, timeSpent };
  };

  const submitQuiz = async () => {
    setShowResults(true);
    const results = calculateResults();

    if (user) {
      try {
        const docRef = doc(db, 'quizzes', id);
        const newAttempt = {
          userId: user.uid,
          score: results.percentage,
          completedAt: new Date(),
          answers: userAnswers,
        };
        await updateDoc(docRef, {
          attempts: [...(quiz.attempts || []), newAttempt],
          bestScore: Math.max(quiz.bestScore || 0, results.percentage),
        });
        toast.success(language === 'fr' ? 'Quiz soumis avec succès !' : 'تم إرسال الاختبار بنجاح!');
      } catch (error) {
        console.error('Erreur lors de la soumission du quiz:', error);
        toast.error(language === 'fr' ? 'Erreur lors de la soumission' : 'خطأ أثناء الإرسال');
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setShowExplanations(false);
    setQuizStartTime(Date.now());
  };

  if (loading) {
    return (
      <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" aria-label={t.loading}></div>
          <p className="text-gray-600 text-lg font-medium">{t.loading}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-500">Erreur</h3>
          </div>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/quizzes')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            aria-label={t.backToQuizzes}
          >
            {t.backToQuizzes}
          </button>
        </div>
      </main>
    );
  }

  if (!quiz) return null;

  const renderQuizStep = () => {
    if (showResults) {
      const results = calculateResults();
      const timeMinutes = Math.floor(results.timeSpent / 60);
      const timeSeconds = results.timeSpent % 60;

      return (
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Trophy className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">{t.congratulations}</h1>
            <h2 className="text-2xl text-gray-600 mb-10">{t.quizComplete}</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-3xl font-semibold text-center mb-10">{t.yourScore}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="text-4xl font-bold text-blue-600 mb-2">{results.score}/{results.total}</div>
                <p className="text-gray-600 font-medium">{t.score}</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="text-4xl font-bold text-green-600 mb-2">{results.percentage}%</div>
                <p className="text-gray-600 font-medium">{t.accuracy}</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="text-4xl font-bold text-purple-600 mb-2">{results.score}</div>
                <p className="text-gray-600 font-medium">{t.correct}</p>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-xl">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {timeMinutes > 0 ? `${timeMinutes}${t.minutes} ` : ''}{timeSeconds}{t.seconds}
                </div>
                <p className="text-gray-600 font-medium">{t.timeSpent}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                {showExplanations ? <EyeOff className="w-5 h-5 mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
                {showExplanations ? t.hideExplanation : t.reviewAnswers}
              </button>
              <button
                onClick={resetQuiz}
                className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                {t.newQuiz}
              </button>
              <button
                onClick={() => navigate('/quizzes')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl"
                aria-label={t.backToQuizzes}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                {t.backToQuizzes}
              </button>
            </div>
          </div>

          {showExplanations && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold mb-8 flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-indigo-600" />
                {t.reviewAnswers}
              </h3>
              <div className="space-y-6">
                {quiz.questions.map((question, index) => {
                  const userAnswer = userAnswers[question.id];
                  const isCorrect =
                    question.type === 'multiple_choice'
                      ? userAnswer === question.correctAnswer
                      : question.type === 'true_false'
                      ? userAnswer === question.correctAnswer
                      : userAnswer?.toLowerCase()?.trim() === question.correctAnswer[language]?.toLowerCase()?.trim();

                  return (
                    <div
                      key={question.id}
                      className={`p-6 rounded-xl border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">Question {index + 1}</h4>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isCorrect ? `✓ ${t.correct}` : `✗ ${t.incorrect}`}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4 text-lg">{question.question[language] || question.question.fr}</p>
                      {question.type === 'multiple_choice' && (
                        <div className="mb-4">
                          {question.options[language]?.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg mb-2 ${
                                optIndex === question.correctAnswer
                                  ? 'bg-green-100 border border-green-300'
                                  : optIndex === userAnswer
                                  ? 'bg-red-100 border border-red-300'
                                  : 'bg-gray-100'
                              }`}
                            >
                              <span className="font-medium mr-3">{String.fromCharCode(65 + optIndex)}.</span>
                              {option}
                              {optIndex === question.correctAnswer && <span className="ml-2 text-green-600">✓</span>}
                              {optIndex === userAnswer && optIndex !== question.correctAnswer && (
                                <span className="ml-2 text-red-600">✗</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === 'true_false' && (
                        <div className="mb-4">
                          <p className="text-gray-600">
                            <strong>Votre réponse:</strong> {userAnswer ? t.trueLabel : t.falseLabel}
                          </p>
                          <p className="text-gray-600">
                            <strong>Réponse correcte:</strong> {question.correctAnswer ? t.trueLabel : t.falseLabel}
                          </p>
                        </div>
                      )}
                      {question.type === 'short_answer' && (
                        <div className="mb-4">
                          <p className="text-gray-600">
                            <strong>Votre réponse:</strong> {userAnswer || 'Pas de réponse'}
                          </p>
                          <p className="text-gray-600">
                            <strong>Réponse correcte:</strong> {question.correctAnswer[language] || question.correctAnswer.fr}
                          </p>
                        </div>
                      )}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-blue-800 mb-2">{t.explanation}</h5>
                        <p className="text-blue-700">{question.explanation[language] || question.explanation.fr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{quiz.title[language] || quiz.title.fr}</h1>
            <div className="text-lg text-gray-600 font-medium">
              {currentQuestionIndex + 1} / {quiz.questions.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-700 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
          <div className="text-sm text-gray-500 text-center">
            {t.progress}: {Object.keys(userAnswers).length} / {quiz.questions.length} {t.questionsAnswered}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold">{t.question} {currentQuestionIndex + 1}</h3>
              <div className="flex gap-2">
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">{t[quiz.difficulty]}</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">{t[quiz.category]}</span>
              </div>
            </div>
            <p className="text-xl leading-relaxed">{currentQuestion.question[language] || currentQuestion.question.fr}</p>
          </div>

          <div className="p-8">
            {currentQuestion.type === 'multiple_choice' && (
              <div className="space-y-4">
                {currentQuestion.options[language]?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                    className={`w-full text-left p-5 border-2 rounded-xl transition-all duration-200 text-lg ${
                      userAnswers[currentQuestion.id] === index
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:shadow-md'
                    }`}
                    aria-label={option}
                  >
                    <span className="font-bold mr-4 text-xl">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            )}
            {currentQuestion.type === 'true_false' && (
              <div className="space-y-4">
                <button
                  onClick={() => handleAnswerSelect(currentQuestion.id, true)}
                  className={`w-full text-left p-5 border-2 rounded-xl transition-all duration-200 text-lg ${
                    userAnswers[currentQuestion.id] === true
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-md transform scale-105'
                      : 'border-gray-300 hover:border-green-400 hover:bg-gray-50 hover:shadow-md'
                  }`}
                  aria-label={t.trueLabel}
                >
                  <CheckCircle className="w-6 h-6 inline mr-4" />
                  <span className="text-xl font-semibold">{t.trueLabel}</span>
                </button>
                <button
                  onClick={() => handleAnswerSelect(currentQuestion.id, false)}
                  className={`w-full text-left p-5 border-2 rounded-xl transition-all duration-200 text-lg ${
                    userAnswers[currentQuestion.id] === false
                      ? 'border-red-500 bg-red-50 text-red-700 shadow-md transform scale-105'
                      : 'border-gray-300 hover:border-red-400 hover:bg-gray-50 hover:shadow-md'
                  }`}
                  aria-label={t.falseLabel}
                >
                  <XCircle className="w-6 h-6 inline mr-4" />
                  <span className="text-xl font-semibold">{t.falseLabel}</span>
                </button>
              </div>
            )}
            {currentQuestion.type === 'short_answer' && (
              <div>
                <textarea
                  value={userAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                  placeholder={t.answerPlaceholder}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg resize-none"
                  rows={5}
                  aria-label={t.answerPlaceholder}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg font-semibold"
            aria-label={t.previousQuestion}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            {t.previousQuestion}
          </button>
          <div className="flex items-center space-x-3">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-200 ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white transform scale-110 shadow-lg'
                    : userAnswers[quiz.questions[index].id] !== undefined
                    ? 'bg-green-100 text-green-600 border-2 border-green-300 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-300'
                }`}
                aria-label={`Question ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          {isLastQuestion ? (
            <button
              onClick={submitQuiz}
              disabled={Object.keys(userAnswers).length !== quiz.questions.length}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl"
              aria-label={t.submitQuiz}
            >
              <Trophy className="w-5 h-5 mr-2" />
              {t.submitQuiz}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
              disabled={!userAnswers[currentQuestion.id] && userAnswers[currentQuestion.id] !== false}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl"
              aria-label={t.nextQuestion}
            >
              {t.nextQuestion}
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 ${isRTL ? 'rtl' : 'ltr'}`} aria-labelledby="quiz-title">
      <div className="container mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/quizzes')}
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg"
            aria-label={t.backToQuizzes}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            {t.backToQuizzes}
          </button>
        </div>
        {renderQuizStep()}
      </div>
    </main>
  );
};

export default QuizPlayer;