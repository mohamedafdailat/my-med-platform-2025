import React, { useState, useEffect } from 'react';

const FlashcardStudyMode = () => {
  const [language, setLanguage] = useState('fr');
  const [currentDeck, setCurrentDeck] = useState(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState('sequential'); // sequential, random, spaced
  const [shuffledCards, setShuffledCards] = useState([]);
  const [studyStats, setStudyStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
    startTime: null
  });
  const [cardProgress, setCardProgress] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  // Exemple de deck avec flashcards
  const sampleDeck = {
    id: 1,
    title: 'Anatomie du Système Cardiovasculaire',
    category: 'anatomy',
    difficulty: 'medium',
    flashcards: [
      {
        id: 1,
        question: { fr: "Combien de cavités le cœur possède-t-il?", ar: "كم عدد حجرات القلب؟" },
        answer: { fr: "Le cœur possède quatre cavités: deux oreillettes et deux ventricules.", ar: "يحتوي القلب على أربع حجرات: أذينان وبطينان." }
      },
      {
        id: 2,
        question: { fr: "Quelle est la fonction de l'oreillette droite?", ar: "ما هي وظيفة الأذين الأيمن؟" },
        answer: { fr: "L'oreillette droite reçoit le sang désoxygéné provenant du corps.", ar: "يستقبل الأذين الأيمن الدم غير المؤكسج من الجسم." }
      },
      {
        id: 3,
        question: { fr: "Où se situe la valve tricuspide?", ar: "أين تقع الصمام ثلاثي الشرف؟" },
        answer: { fr: "La valve tricuspide se situe entre l'oreillette droite et le ventricule droit.", ar: "يقع الصمام ثلاثي الشرف بين الأذين الأيمن والبطين الأيمن." }
      },
      {
        id: 4,
        question: { fr: "Quelle est la différence entre circulation pulmonaire et systémique?", ar: "ما الفرق بين الدورة الدموية الرئوية والجهازية؟" },
        answer: { fr: "La circulation pulmonaire va du cœur aux poumons, la circulation systémique va du cœur au reste du corps.", ar: "الدورة الرئوية تذهب من القلب إلى الرئتين، والدورة الجهازية تذهب من القلب إلى باقي الجسم." }
      },
      {
        id: 5,
        question: { fr: "Quelles sont les quatre valves cardiaques?", ar: "ما هي الصمامات القلبية الأربعة؟" },
        answer: { fr: "Valve tricuspide, valve pulmonaire, valve mitrale et valve aortique.", ar: "الصمام ثلاثي الشرف، الصمام الرئوي، الصمام التاجي والصمام الأبهري." }
      }
    ]
  };

  const translations = {
    studyMode: { fr: 'Mode Étude', ar: 'وضع الدراسة' },
    backToDeck: { fr: 'Retour aux decks', ar: 'العودة للمجموعات' },
    sequential: { fr: 'Séquentiel', ar: 'تسلسلي' },
    random: { fr: 'Aléatoire', ar: 'عشوائي' },
    spaced: { fr: 'Répétition espacée', ar: 'تكرار متباعد' },
    showAnswer: { fr: 'Voir la réponse', ar: 'إظهار الإجابة' },
    hideAnswer: { fr: 'Masquer la réponse', ar: 'إخفاء الإجابة' },
    nextCard: { fr: 'Suivant', ar: 'التالي' },
    prevCard: { fr: 'Précédent', ar: 'السابق' },
    difficulty: { fr: 'Difficulté', ar: 'الصعوبة' },
    easy: { fr: 'Facile', ar: 'سهل' },
    medium: { fr: 'Moyen', ar: 'متوسط' },
    hard: { fr: 'Difficile', ar: 'صعب' },
    again: { fr: 'À revoir', ar: 'مراجعة مرة أخرى' },
    good: { fr: 'Correct', ar: 'صحيح' },
    cardOf: { fr: 'de', ar: 'من' },
    progress: { fr: 'Progression', ar: 'التقدم' },
    statistics: { fr: 'Statistiques', ar: 'الإحصائيات' },
    correct: { fr: 'Correctes', ar: 'صحيحة' },
    incorrect: { fr: 'Incorrectes', ar: 'خاطئة' },
    timeSpent: { fr: 'Temps passé', ar: 'الوقت المستغرق' },
    accuracy: { fr: 'Précision', ar: 'الدقة' },
    studyComplete: { fr: 'Étude terminée !', ar: 'انتهت الدراسة!' },
    congratulations: { fr: 'Félicitations !', ar: 'تهانينا!' },
    studyAgain: { fr: 'Étudier à nouveau', ar: 'ادرس مرة أخرى' },
    reviewMistakes: { fr: 'Revoir les erreurs', ar: 'مراجعة الأخطاء' },
    minutes: { fr: 'minutes', ar: 'دقائق' },
    seconds: { fr: 'secondes', ar: 'ثواني' },
    shuffle: { fr: 'Mélanger', ar: 'خلط' },
    reset: { fr: 'Recommencer', ar: 'إعادة البدء' },
    settings: { fr: 'Paramètres', ar: 'الإعدادات' },
    autoFlip: { fr: 'Retournement automatique', ar: 'قلب تلقائي' },
    timer: { fr: 'Minuteur', ar: 'مؤقت' },
    soundEffects: { fr: 'Effets sonores', ar: 'المؤثرات الصوتية' }
  };

  const t = (key) => translations[key]?.[language] || translations[key]?.fr || key;

  useEffect(() => {
    setCurrentDeck(sampleDeck);
    setShuffledCards(sampleDeck.flashcards);
    setCardProgress(new Array(sampleDeck.flashcards.length).fill('new'));
    setStudyStats(prev => ({ ...prev, startTime: Date.now(), total: sampleDeck.flashcards.length }));
  }, []);

  const shuffleCards = () => {
    const shuffled = [...currentDeck.flashcards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentCard(0);
    setShowAnswer(false);
  };

  const resetStudy = () => {
    setCurrentCard(0);
    setShowAnswer(false);
    setCardProgress(new Array(currentDeck.flashcards.length).fill('new'));
    setStudyStats({
      correct: 0,
      incorrect: 0,
      total: currentDeck.flashcards.length,
      startTime: Date.now()
    });
    setIsComplete(false);
  };

  const markCard = (difficulty) => {
    const newProgress = [...cardProgress];
    newProgress[currentCard] = difficulty;
    setCardProgress(newProgress);

    const newStats = { ...studyStats };
    if (difficulty === 'good') {
      newStats.correct++;
    } else if (difficulty === 'again') {
      newStats.incorrect++;
    }
    setStudyStats(newStats);

    // Passer à la carte suivante
    if (currentCard < shuffledCards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    } else {
      setIsComplete(true);
    }
  };

  const nextCard = () => {
    if (currentCard < shuffledCards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setShowAnswer(false);
    }
  };

  const getTimeSpent = () => {
    if (!studyStats.startTime) return '0s';
    const seconds = Math.floor((Date.now() - studyStats.startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}${t('minutes')} ${seconds % 60}${t('seconds')}`;
    }
    return `${seconds}${t('seconds')}`;
  };

  const getAccuracy = () => {
    const total = studyStats.correct + studyStats.incorrect;
    if (total === 0) return 0;
    return Math.round((studyStats.correct / total) * 100);
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-orange-500';
      case 'again': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  if (!currentDeck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du deck...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('congratulations')}</h1>
            <h2 className="text-xl text-gray-600 mb-8">{t('studyComplete')}</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{shuffledCards.length}</div>
                <div className="text-sm text-gray-600">Cartes étudiées</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{studyStats.correct}</div>
                <div className="text-sm text-gray-600">{t('correct')}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{studyStats.incorrect}</div>
                <div className="text-sm text-gray-600">{t('incorrect')}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{getAccuracy()}%</div>
                <div className="text-sm text-gray-600">{t('accuracy')}</div>
              </div>
            </div>

            <p className="text-gray-600 mb-8">
              {t('timeSpent')}: {getTimeSpent()}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetStudy}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('studyAgain')}
              </button>
              <button
                onClick={() => {/* Retour à la liste */}}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {t('backToDeck')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCardData = shuffledCards[currentCard];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <button
                onClick={() => {/* Retour à la liste */}}
                className="mr-4 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{currentDeck.title}</h1>
                <p className="text-sm text-gray-600">
                  {currentCard + 1} {t('cardOf')} {shuffledCards.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={shuffleCards}
                className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                title={t('shuffle')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={resetStudy}
                className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                title={t('reset')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('progress')}</span>
              <span className="text-sm text-gray-600">{Math.round(((currentCard + 1) / shuffledCards.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentCard + 1) / shuffledCards.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Indicateurs de progression des cartes */}
          <div className="flex flex-wrap gap-1 mt-4">
            {cardProgress.map((status, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${getProgressColor(status)} ${
                  index === currentCard ? 'ring-2 ring-blue-400' : ''
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Statistiques en temps réel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{studyStats.correct}</div>
            <div className="text-sm text-gray-600">{t('correct')}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{studyStats.incorrect}</div>
            <div className="text-sm text-gray-600">{t('incorrect')}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{getAccuracy()}%</div>
            <div className="text-sm text-gray-600">{t('accuracy')}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{getTimeSpent().split(t('minutes'))[0] || '0'}</div>
            <div className="text-sm text-gray-600">{t('minutes')}</div>
          </div>
        </div>

        {/* Carte flash */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Question</h2>
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                {t(currentDeck.difficulty)}
              </span>
            </div>
            <p className="text-xl leading-relaxed">
              {currentCardData.question[language] || currentCardData.question.fr}
            </p>
          </div>
          
          <div className="p-8">
            {showAnswer ? (
              <div className="space-y-6">
                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-green-800 mb-3">Réponse</h3>
                  <p className="text-green-700 text-lg leading-relaxed">
                    {currentCardData.answer[language] || currentCardData.answer.fr}
                  </p>
                </div>

                {/* Boutons d'évaluation */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => markCard('again')}
                    className="flex-1 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {t('again')}
                  </button>
                  <button
                    onClick={() => markCard('hard')}
                    className="flex-1 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {t('hard')}
                  </button>
                  <button
                    onClick={() => markCard('medium')}
                    className="flex-1 py-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('medium')}
                  </button>
                  <button
                    onClick={() => markCard('good')}
                    className="flex-1 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {t('good')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {t('showAnswer')}
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevCard}
            disabled={currentCard === 0}
            className="flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t('prevCard')}
          </button>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="text-lg font-medium">{currentCard + 1}</span>
            <span>/</span>
            <span className="text-lg">{shuffledCards.length}</span>
          </div>
          
          <button
            onClick={nextCard}
            disabled={currentCard === shuffledCards.length - 1}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('nextCard')}
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardStudyMode;