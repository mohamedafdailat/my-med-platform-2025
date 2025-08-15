import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import FlashcardGenerator from './FlashcardGenerator';
import { 
  ChevronLeft, ChevronRight, Eye, RotateCcw, Shuffle, Home,
  CheckCircle, XCircle, AlertCircle, Clock, Trophy, Target 
} from 'lucide-react';

const Flashcards = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // View management
  const [view, setView] = useState('list');
  const [selectedDeck, setSelectedDeck] = useState(null);

  // Listing state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customDecks, setCustomDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Player state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [studyStats, setStudyStats] = useState({
    correct: 0, incorrect: 0, skipped: 0, startTime: Date.now(), cardProgress: []
  });
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);

  const translations = {
    title: { fr: 'Jeu de Flashcards', ar: 'مجموعة البطاقات التعليمية' },
    subtitle: { fr: 'Réviser avec des flashcards.', ar: 'مراجعة باستخدام البطاقات التعليمية.' },
    searchPlaceholder: { fr: 'Rechercher un deck...', ar: 'ابحث عن مجموعة...' },
    createFromPDF: { fr: 'Générer depuis PDF', ar: 'إنشاء من PDF' },
    study: { fr: 'Étudier', ar: 'دراسة' },
    cards: { fr: 'cartes', ar: 'بطاقات' },
    delete: { fr: 'Supprimer', ar: 'حذف' },
    noDecks: { fr: 'Aucun deck trouvé.', ar: 'لم يتم العثور على مجموعات.' },
    myDecks: { fr: 'Mes decks personnalisés', ar: 'مجموعاتي المخصصة' },
    defaultDecks: { fr: 'Decks par défaut', ar: 'المجموعات الافتراضية' },
    createdOn: { fr: 'Créé le', ar: 'تم إنشاؤه في' },
    difficulty: { fr: 'Difficulté', ar: 'الصعوبة' },
    easy: { fr: 'Facile', ar: 'سهل' },
    medium: { fr: 'Moyen', ar: 'متوسط' },
    hard: { fr: 'Difficile', ar: 'صعب' },
    subscriptionRequired: { fr: 'Un abonnement payant est requis.', ar: 'مطلوب اشتراك مدفوع.' },
    loading: { fr: 'Chargement...', ar: 'جاري التحميل...' },
    confirmDelete: { fr: 'Êtes-vous sûr de vouloir supprimer ce deck ?', ar: 'هل أنت متأكد من حذف هذه المجموعة؟' },
    deleteError: { fr: 'Erreur lors de la suppression', ar: 'خطأ في الحذف' },
    noCardsError: { fr: 'Ce deck ne contient aucune carte.', ar: 'هذه المجموعة لا تحتوي على بطاقات.' },
    invalidFormat: { fr: 'Erreur: Format de cartes invalide.', ar: 'خطأ: تنسيق البطاقات غير صالح.' },
    next: { fr: 'Suivant', ar: 'التالي' },
    prev: { fr: 'Précédent', ar: 'السابق' },
    showAnswer: { fr: 'Voir la réponse', ar: 'إظهار الإجابة' },
    hideAnswer: { fr: 'Masquer la réponse', ar: 'إخفاء الإجابة' },
    finish: { fr: 'Terminer', ar: 'إنهاء' },
    back: { fr: 'Retour', ar: 'رجوع' },
    reset: { fr: 'Recommencer', ar: 'إعادة البدء' },
    shuffle: { fr: 'Mélanger', ar: 'خلط' },
    question: { fr: 'Question', ar: 'سؤال' },
    answer: { fr: 'Réponse', ar: 'إجابة' },
    correct: { fr: 'Correct', ar: 'صحيح' },
    incorrect: { fr: 'Incorrect', ar: 'خاطئ' },
    skip: { fr: 'Passer', ar: 'تخطي' },
    progress: { fr: 'Progression', ar: 'التقدم' },
    statistics: { fr: 'Statistiques', ar: 'الإحصائيات' },
    timeSpent: { fr: 'Temps passé', ar: 'الوقت المستغرق' },
    accuracy: { fr: 'Précision', ar: 'الدقة' },
    studyComplete: { fr: 'Étude terminée !', ar: 'انتهت الدراسة!' },
    congratulations: { fr: 'Félicitations !', ar: 'تهانينا!' },
    studyAgain: { fr: 'Étudier à nouveau', ar: 'ادرس مرة أخرى' },
    autoAdvance: { fr: 'Avancement automatique', ar: 'التقدم التلقائي' },
    category: { fr: 'Catégorie', ar: 'الفئة' },
    cardOf: { fr: 'de', ar: 'من' },
    minutes: { fr: 'min', ar: 'د' },
    seconds: { fr: 's', ar: 'ث' }
  };

  // Suppress ESLint warning for static translations object
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const t = useCallback((key) => translations[key]?.[language] || translations[key]?.fr || key, [language]);

  const defaultFlashcardDecks = [
    {
      id: 'default-1',
      title: t('Anatomie Humaine'),
      description: t('Apprenez les principaux termes d\'anatomie.'),
      thumbnail: 'https://www.docdeclic.fr/uploads/1587477264_3ea943e53a43e6383b3e.png',
      cards: [
        { id: 'card-anatomy-1', front: t('Qu\'est-ce que le cœur ?'), back: t('Organe musculaire qui pompe le sang dans tout le corps'), difficulty: 'medium', category: 'anatomy' },
        { id: 'card-anatomy-2', front: t('Où se trouve le foie ?'), back: t('Dans la partie supérieure droite de l\'abdomen'), difficulty: 'medium', category: 'anatomy' },
      ],
      category: 'anatomy',
      type: 'default',
      difficulty: 'medium',
      cardCount: 2,
    },
    {
      id: 'default-3',
      title: t('Pharmacologie'),
      description: t('Revisez les noms et usages des médicaments.'),
      thumbnail: 'https://cdn.slidesharecdn.com/ss_thumbnails/lesantibiotiquesi-171209223412-thumbnail.jpg?width=640&height=640&fit=bounds',
      cards: [
        { id: 'card-pharma-1', front: t('Qu\'est-ce que le paracétamol ?'), back: t('Analgésique et antipyrétique'), difficulty: 'hard', category: 'pharmacology' },
        { id: 'card-pharma-2', front: t('Usage de l\'aspirine ?'), back: t('Anti-inflammatoire et anticoagulant'), difficulty: 'hard', category: 'pharmacology' },
      ],
      category: 'pharmacology',
      type: 'default',
      difficulty: 'hard',
      cardCount: 2,
    },
  ];

  const categories = [
    { id: 'all', label: t('Tous') },
    { id: 'anatomy', label: t('Anatomie') },
    { id: 'physiology', label: t('Physiologie') },
    { id: 'pharmacology', label: t('Pharmacologie') },
    { id: 'general', label: t('Général') },
    { id: 'clinical', label: t('Pratique clinique') },
    { id: 'public_health', label: t('Santé publique') },
    { id: 'terminology', label: t('Terminologie') },
    { id: 'other', label: t('Autre') },
  ];

  const isAdmin = useCallback((user) => {
    return user?.role === 'admin' || user?.customClaims?.role === 'admin' || user?.email === 'admin_1@medplatform.com';
  }, []);

  const isAuthenticatedAndPaid = useCallback(() => {
    if (authLoading || !user) return false;
    const isStudent = user?.role === 'student' || user?.customClaims?.role === 'student' || (!user?.role && !user?.customClaims?.role);
    return isAdmin(user) || (isStudent && user.subscriptionStatus === 'paid');
  }, [authLoading, user, isAdmin]);

  const transformFlashcardData = useCallback((firestoreCard) => {
    if (!firestoreCard) return null;
    let front = t('Question non disponible');
    let back = t('Réponse non disponible');
    if (firestoreCard.question && firestoreCard.answer) {
      front = typeof firestoreCard.question === 'object' ? firestoreCard.question[language] || firestoreCard.question.fr || firestoreCard.question : firestoreCard.question;
      back = typeof firestoreCard.answer === 'object' ? firestoreCard.answer[language] || firestoreCard.answer.fr || firestoreCard.answer : firestoreCard.answer;
    } else if (firestoreCard.front && firestoreCard.back) {
      front = typeof firestoreCard.front === 'object' ? firestoreCard.front[language] || firestoreCard.front.fr || firestoreCard.front : firestoreCard.front;
      back = typeof firestoreCard.back === 'object' ? firestoreCard.back[language] || firestoreCard.back.fr || firestoreCard.back : firestoreCard.back;
    }
    return front && back && front !== t('Question non disponible') && back !== t('Réponse non disponible')
      ? { id: firestoreCard.id || `card-${Math.random().toString(36).substr(2, 9)}`, front, back, difficulty: firestoreCard.difficulty || 'medium', category: firestoreCard.category || 'general' }
      : null;
  }, [language, t]);

  const removeDuplicateDecks = useCallback((decks) => {
    const seen = new Map();
    return decks.reduce((uniqueDecks, currentDeck) => {
      if (!currentDeck) return uniqueDecks;
      const key = `${currentDeck.title}-${currentDeck.ownerId || 'default'}`;
      const existingDeck = seen.get(key);
      if (!existingDeck) {
        seen.set(key, currentDeck);
        return [...uniqueDecks, currentDeck];
      }
      if (currentDeck.cards.length > existingDeck.cards.length) {
        seen.set(key, currentDeck);
        return uniqueDecks.map(deck => deck.title === currentDeck.title && deck.ownerId === currentDeck.ownerId ? currentDeck : deck);
      }
      return uniqueDecks;
    }, []);
  }, []);

  useEffect(() => {
    const fetchCustomDecks = async () => {
      setLoading(true);
      try {
        if (!isAuthenticatedAndPaid()) {
          setCustomDecks([]);
          setLoading(false);
          return;
        }
        const auth = getAuth();
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setCustomDecks([]);
          setLoading(false);
          return;
        }
        const q = query(collection(db, 'flashcards'), where('ownerId', '==', userId));
        const querySnapshot = await getDocs(q);
        const decks = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          let transformedCards = [];
          if (data.flashcards && Array.isArray(data.flashcards)) {
            transformedCards = data.flashcards.map(card => transformFlashcardData(card)).filter(card => card !== null);
          } else if (data.cards && Array.isArray(data.cards)) {
            transformedCards = data.cards.map(card => transformFlashcardData(card)).filter(card => card !== null);
          }
          if (transformedCards.length === 0) return null;
          const semester = data.semester || (user?.semester ? user.semester : null);
          if (!isAdmin(user) && semester && user?.semester !== semester) return null;
          return {
            id: doc.id,
            title: data.title || t('Deck sans titre'),
            description: data.description || '',
            category: data.category || 'general',
            difficulty: data.difficulty || 'medium',
            cardCount: transformedCards.length,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            cards: transformedCards,
            type: 'custom',
            ownerId: data.ownerId,
            semester: semester,
            thumbnail: data.thumbnail || 'https://placehold.co/400x300?text=Flashcard+Deck',
          };
        }));
        const filteredDecks = decks.filter(deck => deck !== null);
        const uniqueDecks = removeDuplicateDecks(filteredDecks);
        setCustomDecks(uniqueDecks);
        setError('');
      } catch (error) {
        setError(t('Erreur lors du chargement des decks personnalisés'));
        setCustomDecks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomDecks();
  }, [isAuthenticatedAndPaid, language, t, transformFlashcardData, removeDuplicateDecks, user, isAdmin]);

  const handleDeckSaved = useCallback((newDeck) => {
    if (!isAuthenticatedAndPaid()) {
      alert(t('subscriptionRequired'));
      return;
    }
    const transformedCards = newDeck.flashcards
      ? newDeck.flashcards.map(card => transformFlashcardData(card)).filter(card => card !== null)
      : [];
    if (transformedCards.length === 0) {
      alert(t('noCardsError'));
      return;
    }
    const transformedDeck = {
      ...newDeck,
      id: newDeck.id || `custom-${Math.random().toString(36).substr(2, 9)}`,
      title: newDeck.title || t('Deck sans titre'),
      description: newDeck.description || '',
      category: newDeck.category || 'general',
      difficulty: newDeck.difficulty || 'medium',
      cards: transformedCards,
      type: 'custom',
      ownerId: user?.uid || 'anonymous',
      cardCount: transformedCards.length,
      createdAt: new Date(),
      thumbnail: newDeck.thumbnail || 'https://placehold.co/400x300?text=Flashcard+Deck',
      semester: user?.semester || null,
    };
    const isDuplicate = customDecks.some(deck => deck.id === transformedDeck.id);
    if (!isDuplicate) {
      setCustomDecks(prev => [...prev, transformedDeck]);
    }
  }, [isAuthenticatedAndPaid, t, transformFlashcardData, customDecks, user]);

  const handleStudyDeck = useCallback((deck) => {
    if (!isAuthenticatedAndPaid() && deck.type === 'custom') {
      alert(t('subscriptionRequired'));
      return;
    }
    if (!deck.cards || deck.cards.length === 0) {
      alert(t('noCardsError'));
      return;
    }
    const hasValidCards = deck.cards.every(card => card.front && card.back && typeof card.front === 'string' && typeof card.back === 'string');
    if (!hasValidCards) {
      alert(t('invalidFormat'));
      return;
    }
    setSelectedDeck(deck);
    setShuffledIndices(deck.cards.map((_, index) => index));
    setStudyStats({ correct: 0, incorrect: 0, skipped: 0, startTime: Date.now(), cardProgress: new Array(deck.cards.length).fill('unseen') });
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setIsShuffled(false);
    setStudyComplete(false);
    setView('play');
  }, [isAuthenticatedAndPaid, t]);

  const handleDeleteDeck = useCallback(async (deckId) => {
    if (!isAuthenticatedAndPaid()) {
      alert(t('subscriptionRequired'));
      return;
    }
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteDoc(doc(db, 'flashcards', deckId));
        setCustomDecks(prev => prev.filter(deck => deck.id !== deckId));
      } catch (error) {
        alert(t('deleteError'));
      }
    }
  }, [isAuthenticatedAndPaid, t]);

  const allDecks = [...customDecks, ...defaultFlashcardDecks];
  const filteredDecks = allDecks
    .filter(deck => selectedCategory === 'all' || deck.category === selectedCategory)
    .filter(deck => deck.title.toLowerCase().includes(searchQuery.toLowerCase()) || (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase())));

  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [language]);

  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Player functions
  const handleNext = useCallback(() => {
    if (!selectedDeck) return;
    const nextIndex = currentCardIndex + 1;
    if (nextIndex < selectedDeck.cards.length) {
      setCurrentCardIndex(nextIndex);
      setShowAnswer(false);
    } else {
      setStudyComplete(true);
    }
  }, [currentCardIndex, selectedDeck]);

  const handlePrevious = useCallback(() => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  }, [currentCardIndex]);

  const handleCardResponse = useCallback((response) => {
    const newStats = { ...studyStats };
    const newProgress = [...newStats.cardProgress];
    newProgress[currentCardIndex] = response;
    switch (response) {
      case 'correct': newStats.correct++; break;
      case 'incorrect': newStats.incorrect++; break;
      case 'skip': newStats.skipped++; break;
      default: break; // Handle unexpected response
    }
    newStats.cardProgress = newProgress;
    setStudyStats(newStats);
    if (autoAdvance || response !== 'skip') {
      setTimeout(() => handleNext(), 500);
    }
  }, [studyStats, currentCardIndex, autoAdvance, handleNext]);

  const shuffleCards = useCallback(() => {
    if (!selectedDeck) return;
    const indices = [...Array(selectedDeck.cards.length).keys()];
    const shuffled = indices.sort(() => Math.random() - 0.5);
    setShuffledIndices(shuffled);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setIsShuffled(true);
  }, [selectedDeck]);

  const resetStudy = useCallback(() => {
    if (!selectedDeck) return;
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setIsShuffled(false);
    setStudyComplete(false);
    setShuffledIndices(selectedDeck.cards.map((_, index) => index));
    setStudyStats({
      correct: 0, incorrect: 0, skipped: 0, startTime: Date.now(),
      cardProgress: new Array(selectedDeck.cards.length).fill('unseen')
    });
  }, [selectedDeck]);

  const getTimeSpent = useCallback(() => {
    const seconds = Math.floor((Date.now() - studyStats.startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}${t('minutes')} ${remainingSeconds}${t('seconds')}` : `${seconds}${t('seconds')}`;
  }, [studyStats.startTime, t]);

  const getAccuracy = useCallback(() => {
    const total = studyStats.correct + studyStats.incorrect;
    return total === 0 ? 0 : Math.round((studyStats.correct / total) * 100);
  }, [studyStats]);

  const getProgressColor = useCallback((status) => {
    switch (status) {
      case 'correct': return 'bg-green-500';
      case 'incorrect': return 'bg-red-500';
      case 'skip': return 'bg-yellow-500';
      case 'unseen': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (view !== 'play' || studyComplete) return;
      switch (e.key) {
        case ' ': case 'Enter': e.preventDefault(); setShowAnswer(!showAnswer); break;
        case 'ArrowLeft': e.preventDefault(); handlePrevious(); break;
        case 'ArrowRight': e.preventDefault(); handleNext(); break;
        case '1': e.preventDefault(); if (showAnswer) handleCardResponse('incorrect'); break;
        case '2': e.preventDefault(); if (showAnswer) handleCardResponse('skip'); break;
        case '3': e.preventDefault(); if (showAnswer) handleCardResponse('correct'); break;
        default: break; // Handle unexpected key
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [view, showAnswer, handleNext, handlePrevious, handleCardResponse, studyComplete]);

  const Card = ({ deck }) => {
    const cardCount = deck.cards ? deck.cards.length : deck.cardCount || 0;
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {deck.thumbnail && (
          <div className="h-48 bg-gray-200 overflow-hidden">
            <img src={deck.thumbnail} alt={deck.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.backgroundColor = '#e5e7eb'; }} />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-800 line-clamp-2">{deck.title}</h3>
            {deck.type === 'custom' && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{t('Personnalisé')}</span>}
          </div>
          {deck.description && <p className="text-gray-600 text-sm mb-4 line-clamp-2">{deck.description}</p>}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">{cardCount} {t('cards')}</span>
            {deck.difficulty && <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(deck.difficulty)}`}>{t(deck.difficulty)}</span>}
          </div>
          {deck.createdAt && <p className="text-xs text-gray-400 mb-4">{t('createdOn')} {formatDate(deck.createdAt)}</p>}
          <div className="flex gap-2">
            <button onClick={() => handleStudyDeck(deck)} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={cardCount === 0}>{t('study')}</button>
            {deck.type === 'custom' && <button onClick={() => handleDeleteDeck(deck.id)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
          </div>
        </div>
      </div>
    );
  };

  if (view === 'generate') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button onClick={() => setView('list')} className="mr-4 p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"><svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
            <h1 className="text-2xl font-bold text-gray-800">{t('Générateur de Flashcards')}</h1>
          </div>
          <FlashcardGenerator onClose={() => setView('list')} onDeckSaved={handleDeckSaved} />
        </div>
      </div>
    );
  }

  if (view === 'play' && selectedDeck) {
    const currentCard = selectedDeck.cards[shuffledIndices[currentCardIndex]];
    const isLastCard = currentCardIndex === selectedDeck.cards.length - 1;
    const progressPercentage = ((currentCardIndex + 1) / selectedDeck.cards.length) * 100;

    if (studyComplete) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('congratulations')}</h1>
              <h2 className="text-xl text-gray-600 mb-8">{t('studyComplete')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{selectedDeck.cards.length}</div>
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
              <p className="text-gray-600 mb-8">{t('timeSpent')}: {getTimeSpent()}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={resetStudy} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{t('studyAgain')}</button>
                <button onClick={() => setView('list')} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">{t('back')}</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg mb-6 p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center">
                <button onClick={() => setView('list')} className="mr-4 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><Home className="w-5 h-5 text-gray-600" /></button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{selectedDeck.title}</h1>
                  <p className="text-sm text-gray-600">{currentCardIndex + 1} {t('cardOf')} {selectedDeck.cards.length}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{t(selectedDeck.difficulty)}</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{t(selectedDeck.category)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={shuffleCards} className={`p-2 rounded-lg transition-colors ${isShuffled ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`} title={t('shuffle')}><Shuffle className="w-5 h-5" /></button>
                <button onClick={resetStudy} className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors" title={t('reset')}><RotateCcw className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{t('progress')}</span>
                <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-4">
              {studyStats.cardProgress.map((status, index) => (
                <div key={index} className={`w-3 h-3 rounded-full ${getProgressColor(status)} ${index === currentCardIndex ? 'ring-2 ring-blue-400' : ''}`} title={`Card ${index + 1}: ${status}`} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{studyStats.correct}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center"><CheckCircle className="w-4 h-4 mr-1" />{t('correct')}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{studyStats.incorrect}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center"><XCircle className="w-4 h-4 mr-1" />{t('incorrect')}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{getAccuracy()}%</div>
              <div className="text-sm text-gray-600 flex items-center justify-center"><Target className="w-4 h-4 mr-1" />{t('accuracy')}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.floor((Date.now() - studyStats.startTime) / 60000)}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center"><Clock className="w-4 h-4 mr-1" />{t('minutes')}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t('question')}</h2>
                <div className="text-sm opacity-75">{currentCardIndex + 1} / {selectedDeck.cards.length}</div>
              </div>
              <p className="text-lg leading-relaxed">{currentCard.front}</p>
            </div>
            <div className="p-8">
              {showAnswer ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center"><CheckCircle className="w-5 h-5 mr-2" />{t('answer')}</h3>
                    <p className="text-green-700 text-lg leading-relaxed">{currentCard.back}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button onClick={() => handleCardResponse('incorrect')} className="flex items-center justify-center py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"><XCircle className="w-5 h-5 mr-2" />{t('incorrect')} <span className="text-sm ml-2">(1)</span></button>
                    <button onClick={() => handleCardResponse('skip')} className="flex items-center justify-center py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"><AlertCircle className="w-5 h-5 mr-2" />{t('skip')} <span className="text-sm ml-2">(2)</span></button>
                    <button onClick={() => handleCardResponse('correct')} className="flex items-center justify-center py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"><CheckCircle className="w-5 h-5 mr-2" />{t('correct')} <span className="text-sm ml-2">(3)</span></button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAnswer(true)} className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium flex items-center justify-center"><Eye className="w-6 h-6 mr-2" />{t('showAnswer')} <span className="text-sm ml-2">(Space)</span></button>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrevious} disabled={currentCardIndex === 0} className="flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-5 h-5 mr-2" />{t('prev')}</button>
            <div className="flex items-center gap-4">
              <label className="flex items-center text-sm text-gray-600"><input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} className="mr-2" />{t('autoAdvance')}</label>
            </div>
            <button onClick={isLastCard ? () => setView('list') : handleNext} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {isLastCard ? <><Trophy className="w-5 h-5 mr-2" />{t('finish')}</> : <>{t('next')}<ChevronRight className="w-5 h-5 ml-2" /></>}
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600"><strong>Raccourcis clavier:</strong> Space/Enter = Afficher réponse | ←/→ = Navigation | 1/2/3 = Évaluer</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('title')}</h1>
          <p className="text-xl text-gray-600">{t('subtitle')}</p>
          {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <input type="text" placeholder={t('searchPlaceholder')} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {categories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
            </div>
            <button onClick={() => { if (isAuthenticatedAndPaid()) setView('generate'); else alert(t('subscriptionRequired')); }} className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50" disabled={!isAuthenticatedAndPaid()}><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>{t('createFromPDF')}</button>
          </div>
        </div>
        {customDecks.length > 0 && isAuthenticatedAndPaid() && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="w-1 h-8 bg-green-600 mr-4"></div>
              <h2 className="text-2xl font-bold text-gray-800">{t('myDecks')}</h2>
              <span className="ml-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">{customDecks.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {customDecks.filter(deck => selectedCategory === 'all' || deck.category === selectedCategory).filter(deck => deck.title.toLowerCase().includes(searchQuery.toLowerCase()) || (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()))).map(deck => <Card key={deck.id} deck={deck} />)}
            </div>
          </div>
        )}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-blue-600 mr-4"></div>
            <h2 className="text-2xl font-bold text-gray-800">{t('defaultDecks')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {defaultFlashcardDecks.filter(deck => selectedCategory === 'all' || deck.category === selectedCategory).filter(deck => deck.title.toLowerCase().includes(searchQuery.toLowerCase()) || deck.description.toLowerCase().includes(searchQuery.toLowerCase())).map(deck => <Card key={deck.id} deck={deck} />)}
          </div>
        </div>
        {loading || authLoading ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        ) : !isAuthenticatedAndPaid() && customDecks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('noDecks')}</h3>
            <p className="text-gray-600 mb-6">{t('subscriptionRequired')}</p>
            <button onClick={() => navigate('/subscription')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{t('S\'abonner')}</button>
          </div>
        ) : filteredDecks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('noDecks')}</h3>
            <p className="text-gray-600 mb-6">{t('Créez votre premier deck en téléchargeant un PDF ou modifiez vos critères de recherche.')}</p>
            <button onClick={() => { if (isAuthenticatedAndPaid()) setView('generate'); else alert(t('subscriptionRequired')); }} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" disabled={!isAuthenticatedAndPaid()}>{t('createFromPDF')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcards;