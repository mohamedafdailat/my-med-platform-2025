import ContentPublication from '../components/ContentPublication';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import FlashcardGenerator from './FlashcardGenerator';
import { getVisibleDocuments } from '../services/contentService';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Shuffle,
  Home,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Trophy,
  Target,
  Plus,
  Trash2,
  Search,
  BookOpen,
} from 'lucide-react';

const LOCAL_THUMBNAILS = {
  anatomy: '/image1.png',
  physiology: '/image2.png',
  pharmacology: '/image3.png',
  general: '/image4.png',
  clinical: '/image5.png',
  public_health: '/image6.png',
  terminology: '/image7.png',
  other: '/image8.png',
};

const TRANSLATIONS = {
  fr: {
    title: 'Flashcards médicales',
    subtitle: 'Révisez efficacement avec des decks interactifs et des cartes générées par IA.',
    searchPlaceholder: 'Rechercher un deck...',
    createFromPDF: 'Générer depuis PDF',
    study: 'Étudier',
    cards: 'cartes',
    delete: 'Supprimer',
    noDecks: 'Aucun deck trouvé.',
    myDecks: 'Mes decks personnalisés',
    defaultDecks: 'Bibliothèque partagée',
    createdOn: 'Créé le',
    difficulty: 'Difficulté',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    subscriptionRequired: 'Un abonnement payant est requis.',
    loading: 'Chargement...',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce deck ?',
    deleteError: 'Erreur lors de la suppression.',
    loadError: 'Erreur lors du chargement des decks personnalisés.',
    noCardsError: 'Ce deck ne contient aucune carte.',
    invalidFormat: 'Erreur : format de cartes invalide.',
    next: 'Suivant',
    prev: 'Précédent',
    showAnswer: 'Voir la réponse',
    hideAnswer: 'Masquer la réponse',
    finish: 'Terminer',
    back: 'Retour',
    reset: 'Recommencer',
    shuffle: 'Mélanger',
    question: 'Question',
    answer: 'Réponse',
    correct: 'Correct',
    incorrect: 'Incorrect',
    skip: 'Passer',
    progress: 'Progression',
    timeSpent: 'Temps passé',
    accuracy: 'Précision',
    studyComplete: 'Étude terminée !',
    congratulations: 'Félicitations !',
    studyAgain: 'Étudier à nouveau',
    autoAdvance: 'Avancement automatique',
    category: 'Catégorie',
    cardOf: 'sur',
    minutes: 'min',
    seconds: 's',
    subscribe: 'S’abonner',
    personalized: 'Personnalisé',
    default: 'Par défaut',
    deckWithoutTitle: 'Deck sans titre',
    questionUnavailable: 'Question non disponible',
    answerUnavailable: 'Réponse non disponible',
    keyboardShortcuts:
      'Raccourcis : Space/Enter = afficher la réponse | ←/→ = navigation | 1/2/3 = évaluer',
    noResultMessage:
      'Aucun deck ne correspond à votre recherche. Modifiez vos critères ou générez un deck depuis un PDF.',
    anatomy: 'Anatomie',
    physiology: 'Physiologie',
    pharmacology: 'Pharmacologie',
    general: 'Général',
    clinical: 'Pratique clinique',
    public_health: 'Santé publique',
    terminology: 'Terminologie',
    other: 'Autre',
    all: 'Tous',
    humanAnatomy: 'Anatomie humaine',
    humanAnatomyDesc: 'Apprenez les principaux termes et structures anatomiques.',
    pharmacologyDeck: 'Pharmacologie',
    pharmacologyDeckDesc: 'Révisez les médicaments, indications et mécanismes d’action.',
    physiologyDeck: 'Physiologie respiratoire',
    physiologyDeckDesc: 'Comprenez les bases du fonctionnement respiratoire.',
  },
  ar: {
    title: 'البطاقات التعليمية الطبية',
    subtitle: 'راجع بفعالية من خلال مجموعات تفاعلية وبطاقات مولدة بالذكاء الاصطناعي.',
    searchPlaceholder: 'ابحث عن مجموعة...',
    createFromPDF: 'إنشاء من PDF',
    study: 'دراسة',
    cards: 'بطاقات',
    delete: 'حذف',
    noDecks: 'لم يتم العثور على مجموعات.',
    myDecks: 'مجموعاتي المخصصة',
    defaultDecks: 'المكتبة المشتركة',
    createdOn: 'تم إنشاؤه في',
    difficulty: 'الصعوبة',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    subscriptionRequired: 'مطلوب اشتراك مدفوع.',
    loading: 'جاري التحميل...',
    confirmDelete: 'هل أنت متأكد من حذف هذه المجموعة؟',
    deleteError: 'خطأ أثناء الحذف.',
    loadError: 'خطأ أثناء تحميل المجموعات المخصصة.',
    noCardsError: 'هذه المجموعة لا تحتوي على بطاقات.',
    invalidFormat: 'خطأ: تنسيق البطاقات غير صالح.',
    next: 'التالي',
    prev: 'السابق',
    showAnswer: 'إظهار الإجابة',
    hideAnswer: 'إخفاء الإجابة',
    finish: 'إنهاء',
    back: 'رجوع',
    reset: 'إعادة البدء',
    shuffle: 'خلط',
    question: 'سؤال',
    answer: 'إجابة',
    correct: 'صحيح',
    incorrect: 'خاطئ',
    skip: 'تخطي',
    progress: 'التقدم',
    timeSpent: 'الوقت المستغرق',
    accuracy: 'الدقة',
    studyComplete: 'انتهت الدراسة!',
    congratulations: 'تهانينا!',
    studyAgain: 'الدراسة مرة أخرى',
    autoAdvance: 'التقدم التلقائي',
    category: 'الفئة',
    cardOf: 'من',
    minutes: 'د',
    seconds: 'ث',
    subscribe: 'الاشتراك',
    personalized: 'مخصص',
    default: 'افتراضي',
    deckWithoutTitle: 'مجموعة بدون عنوان',
    questionUnavailable: 'السؤال غير متوفر',
    answerUnavailable: 'الإجابة غير متوفرة',
    keyboardShortcuts:
      'اختصارات: Space/Enter = إظهار الإجابة | ←/→ = التنقل | 1/2/3 = التقييم',
    noResultMessage:
      'لا توجد مجموعة توافق البحث. غيّر معايير البحث أو أنشئ مجموعة من PDF.',
    anatomy: 'التشريح',
    physiology: 'علم وظائف الأعضاء',
    pharmacology: 'علم الأدوية',
    general: 'عام',
    clinical: 'الممارسة السريرية',
    public_health: 'الصحة العامة',
    terminology: 'المصطلحات',
    other: 'أخرى',
    all: 'الكل',
    humanAnatomy: 'التشريح البشري',
    humanAnatomyDesc: 'تعلم المصطلحات والبنيات التشريحية الأساسية.',
    pharmacologyDeck: 'علم الأدوية',
    pharmacologyDeckDesc: 'راجع الأدوية والاستطبابات وآليات العمل.',
    physiologyDeck: 'فيزيولوجيا الجهاز التنفسي',
    physiologyDeckDesc: 'افهم أساسيات عمل الجهاز التنفسي.',
  },
};

const Flashcards = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const isRTL = language === 'ar';

  const t = useCallback(
    (key) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.fr[key] || key,
    [language]
  );

  const [view, setView] = useState('list');
  const [selectedDeck, setSelectedDeck] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customDecks, setCustomDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [studyStats, setStudyStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    startTime: Date.now(),
    cardProgress: [],
  });
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);

  const categories = useMemo(
    () => [
      { id: 'all', label: t('all') },
      { id: 'anatomy', label: t('anatomy') },
      { id: 'physiology', label: t('physiology') },
      { id: 'pharmacology', label: t('pharmacology') },
      { id: 'general', label: t('general') },
      { id: 'clinical', label: t('clinical') },
      { id: 'public_health', label: t('public_health') },
      { id: 'terminology', label: t('terminology') },
      { id: 'other', label: t('other') },
    ],
    [t]
  );


  const isAdmin = useCallback((currentUser) => {
    return (
      currentUser?.role === 'admin' ||
      currentUser?.customClaims?.role === 'admin'
    );
  }, []);

  const isAuthenticatedAndPaid = useCallback(() => {
    if (authLoading || !user) return false;

    const isStudent =
      user?.role === 'student' ||
      user?.customClaims?.role === 'student' ||
      (!user?.role && !user?.customClaims?.role);

    return isAdmin(user) || user.customClaims?.unlimitedAccess === true || (isStudent && user.subscriptionStatus === 'paid');
  }, [authLoading, user, isAdmin]);

  const normalizeText = useCallback((value, fallback) => {
    if (!value) return fallback;

    if (typeof value === 'string') return value;

    if (typeof value === 'object') {
      return value[language] || value.fr || value.ar || fallback;
    }

    return String(value);
  }, [language]);

  const transformFlashcardData = useCallback(
    (rawCard, index = 0) => {
      if (!rawCard || typeof rawCard !== 'object') return null;

      const front = normalizeText(
        rawCard.question || rawCard.front || rawCard.prompt,
        t('questionUnavailable')
      );

      const back = normalizeText(
        rawCard.answer || rawCard.back || rawCard.response,
        t('answerUnavailable')
      );

      if (
        !front ||
        !back ||
        front === t('questionUnavailable') ||
        back === t('answerUnavailable')
      ) {
        return null;
      }

      return {
        id: rawCard.id || `card-${index}-${Math.random().toString(36).slice(2, 9)}`,
        front,
        back,
        difficulty: rawCard.difficulty || 'medium',
        category: rawCard.category || 'general',
        conceptSource: rawCard.concept_source || rawCard.conceptSource || null,
      };
    },
    [normalizeText, t]
  );

  const getDeckCards = useCallback(
    (data) => {
      const possibleCards = data?.cards || data?.flashcards || data?.items || (data?.question ? [data] : []);
      if (!Array.isArray(possibleCards)) return [];

      return possibleCards
        .map((card, index) => transformFlashcardData(card, index))
        .filter(Boolean);
    },
    [transformFlashcardData]
  );

  const getFirestoreDate = useCallback((value) => {
    if (!value) return new Date();

    if (value?.toDate) return value.toDate();

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, []);

  const removeDuplicateDecks = useCallback((decks) => {
    const seen = new Map();

    decks.forEach((deck) => {
      if (!deck) return;

      const key = deck.id;
      const existing = seen.get(key);

      if (!existing || (deck.cards?.length || 0) > (existing.cards?.length || 0)) {
        seen.set(key, deck);
      }
    });

    return Array.from(seen.values());
  }, []);

  const fetchCustomDecks = useCallback(async () => {
    setLoading(true);

    try {
      if (!isAuthenticatedAndPaid()) {
        setCustomDecks([]);
        setError('');
        return;
      }

      const auth = getAuth();
      const userId = auth.currentUser?.uid || user?.uid;

      if (!userId) {
        setCustomDecks([]);
        setError('');
        return;
      }

      const documents = await getVisibleDocuments('flashcards', user);

      const decks = documents
        .map((snapshot) => {
          const data = snapshot.data();
          const cards = getDeckCards(data);

          if (cards.length === 0) return null;

          const semester = data.semester || null;

          const category = data.category || cards[0]?.category || 'general';

          return {
            id: snapshot.id,
            title: normalizeText(data.title, t('deckWithoutTitle')),
            description: normalizeText(data.description, ''),
            category,
            difficulty: data.difficulty || cards[0]?.difficulty || 'medium',
            cardCount: cards.length,
            createdAt: getFirestoreDate(data.createdAt),
            cards,
            type: 'custom',
            ownerId: data.ownerId || null,
            visibility: data.visibility || 'private',
            semester,
            thumbnail: data.thumbnail || LOCAL_THUMBNAILS[category] || LOCAL_THUMBNAILS.general,
            qualityScore: data.qualityScore || null,
            aiModel: data.aiModel || null,
          };
        })
        .filter(Boolean);

      setCustomDecks(removeDuplicateDecks(decks));
      setError('');
    } catch (fetchError) {
      console.error('Erreur chargement flashcards:', fetchError);
      setCustomDecks([]);
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticatedAndPaid,
    user,
    getDeckCards,
    getFirestoreDate,
    removeDuplicateDecks,
    t,
    normalizeText,
  ]);

  useEffect(() => {
    fetchCustomDecks();
  }, [fetchCustomDecks]);

  const handleDeckSaved = useCallback(
    (newDeck) => {
      if (!isAuthenticatedAndPaid()) {
        alert(t('subscriptionRequired'));
        return;
      }

      const cards = getDeckCards(newDeck);

      if (cards.length === 0) {
        alert(t('noCardsError'));
        return;
      }

      const category = newDeck.category || cards[0]?.category || 'general';

      const transformedDeck = {
        id: newDeck.id || `custom-${Date.now()}`,
        title: newDeck.title || t('deckWithoutTitle'),
        description: newDeck.description || '',
        category,
        difficulty: newDeck.difficulty || cards[0]?.difficulty || 'medium',
        cards,
        type: 'custom',
        ownerId: user?.uid || 'anonymous',
        visibility: 'private',
        cardCount: cards.length,
        createdAt: getFirestoreDate(newDeck.createdAt),
        thumbnail: newDeck.thumbnail || LOCAL_THUMBNAILS[category] || LOCAL_THUMBNAILS.general,
        semester: user?.semester || null,
        qualityScore: newDeck.qualityScore || null,
        aiModel: newDeck.aiModel || null,
      };

      setCustomDecks((prev) => {
        const withoutDuplicate = prev.filter((deck) => deck.id !== transformedDeck.id);
        return [transformedDeck, ...withoutDuplicate];
      });

      setView('list');
    },
    [
      getDeckCards,
      getFirestoreDate,
      isAuthenticatedAndPaid,
      t,
      user,
    ]
  );

  const handleStudyDeck = useCallback(
    (deck) => {
      if (!isAuthenticatedAndPaid() && deck.type === 'custom') {
        alert(t('subscriptionRequired'));
        return;
      }

      if (!deck.cards || deck.cards.length === 0) {
        alert(t('noCardsError'));
        return;
      }

      const hasValidCards = deck.cards.every(
        (card) =>
          card?.front &&
          card?.back &&
          typeof card.front === 'string' &&
          typeof card.back === 'string'
      );

      if (!hasValidCards) {
        alert(t('invalidFormat'));
        return;
      }

      setSelectedDeck(deck);
      setShuffledIndices(deck.cards.map((_, index) => index));
      setStudyStats({
        correct: 0,
        incorrect: 0,
        skipped: 0,
        startTime: Date.now(),
        cardProgress: new Array(deck.cards.length).fill('unseen'),
      });
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setIsShuffled(false);
      setStudyComplete(false);
      setView('play');
    },
    [isAuthenticatedAndPaid, t]
  );

  const handleDeleteDeck = useCallback(
    async (deckId) => {
      if (!isAuthenticatedAndPaid()) {
        alert(t('subscriptionRequired'));
        return;
      }

      if (!window.confirm(t('confirmDelete'))) return;

      try {
        await deleteDoc(doc(db, 'flashcards', deckId));
        setCustomDecks((prev) => prev.filter((deck) => deck.id !== deckId));
      } catch (deleteError) {
        console.error('Erreur suppression flashcard deck:', deleteError);
        alert(t('deleteError'));
      }
    },
    [isAuthenticatedAndPaid, t]
  );

  const allDecks = useMemo(
    () => [...new Map(customDecks.map(deck => [deck.id, deck])).values()],
    [customDecks]
  );

  const filteredDecks = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return allDecks
      .filter((deck) => selectedCategory === 'all' || deck.category === selectedCategory)
      .filter((deck) => {
        if (!search) return true;

        return (
          deck.title?.toLowerCase().includes(search) ||
          deck.description?.toLowerCase().includes(search)
        );
      });
  }, [allDecks, selectedCategory, searchQuery]);

  const visibleCustomDecks = useMemo(
    () => filteredDecks.filter((deck) => deck.visibility !== 'shared'),
    [filteredDecks]
  );

  const visibleDefaultDecks = useMemo(
    () => filteredDecks.filter((deck) => deck.visibility === 'shared'),
    [filteredDecks]
  );

  const formatDate = useCallback(
    (date) => {
      if (!date) return '';

      return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
    [language]
  );

  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getProgressColor = useCallback((status) => {
    switch (status) {
      case 'correct':
        return 'bg-green-500';
      case 'incorrect':
        return 'bg-red-500';
      case 'skip':
        return 'bg-yellow-500';
      case 'unseen':
      default:
        return 'bg-gray-300';
    }
  }, []);

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
      setCurrentCardIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  }, [currentCardIndex]);

  const handleCardResponse = useCallback(
    (response) => {
      if (!selectedDeck) return;

      const realCardIndex = shuffledIndices[currentCardIndex] ?? currentCardIndex;

      setStudyStats((prev) => {
        const newProgress = [...prev.cardProgress];
        const previousStatus = newProgress[realCardIndex];

        const newStats = { ...prev, cardProgress: newProgress };

        if (previousStatus === 'correct') newStats.correct = Math.max(0, newStats.correct - 1);
        if (previousStatus === 'incorrect') newStats.incorrect = Math.max(0, newStats.incorrect - 1);
        if (previousStatus === 'skip') newStats.skipped = Math.max(0, newStats.skipped - 1);

        newProgress[realCardIndex] = response;

        if (response === 'correct') newStats.correct += 1;
        if (response === 'incorrect') newStats.incorrect += 1;
        if (response === 'skip') newStats.skipped += 1;

        return newStats;
      });

      if (autoAdvance || response !== 'skip') {
        setTimeout(() => {
          handleNext();
        }, 450);
      }
    },
    [autoAdvance, currentCardIndex, handleNext, selectedDeck, shuffledIndices]
  );

  const shuffleCards = useCallback(() => {
    if (!selectedDeck) return;

    const indices = [...Array(selectedDeck.cards.length).keys()];

    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    setShuffledIndices(indices);
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
      correct: 0,
      incorrect: 0,
      skipped: 0,
      startTime: Date.now(),
      cardProgress: new Array(selectedDeck.cards.length).fill('unseen'),
    });
  }, [selectedDeck]);

  const getTimeSpent = useCallback(() => {
    const seconds = Math.floor((Date.now() - studyStats.startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}${t('minutes')} ${remainingSeconds}${t('seconds')}`;
    }

    return `${seconds}${t('seconds')}`;
  }, [studyStats.startTime, t]);

  const getAccuracy = useCallback(() => {
    const total = studyStats.correct + studyStats.incorrect;
    return total === 0 ? 0 : Math.round((studyStats.correct / total) * 100);
  }, [studyStats.correct, studyStats.incorrect]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (view !== 'play' || studyComplete) return;

      switch (event.key) {
        case ' ':
        case 'Enter':
          event.preventDefault();
          setShowAnswer((prev) => !prev);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNext();
          break;
        case '1':
          event.preventDefault();
          if (showAnswer) handleCardResponse('incorrect');
          break;
        case '2':
          event.preventDefault();
          if (showAnswer) handleCardResponse('skip');
          break;
        case '3':
          event.preventDefault();
          if (showAnswer) handleCardResponse('correct');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    view,
    showAnswer,
    handleNext,
    handlePrevious,
    handleCardResponse,
    studyComplete,
  ]);

  const DeckCard = ({ deck }) => {
    const cardCount = deck.cards?.length || deck.cardCount || 0;
    const thumbnail = deck.thumbnail || LOCAL_THUMBNAILS[deck.category] || LOCAL_THUMBNAILS.general;

    return (
      <article className="flashcard-deck-card">
        <div className="flashcard-deck-image">
          <img
            src={thumbnail}
            alt={deck.title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = '/image1.png';
            }}
          />
        </div>

        <div className="flashcard-deck-body">
          <div className="flashcard-deck-head">
            <h3>{deck.title}</h3>
            <span className={`deck-type-badge ${deck.type === 'custom' ? 'custom' : ''}`}>
              {deck.visibility === 'shared' ? (language === 'fr' ? 'Partagé' : 'مشترك') : deck.type === 'custom' ? t('personalized') : t('default')}
            </span>
          </div>

          {deck.description && <p className="flashcard-deck-desc">{deck.description}</p>}

          <div className="flashcard-deck-meta">
            <span>{cardCount} {t('cards')}</span>
            <span className={getDifficultyColor(deck.difficulty)}>
              {t(deck.difficulty)}
            </span>
          </div>

          {deck.createdAt && (
            <p className="flashcard-deck-date">
              {t('createdOn')} {formatDate(deck.createdAt)}
            </p>
          )}

          <div className="flashcard-deck-actions">
            <button
              type="button"
              onClick={() => handleStudyDeck(deck)}
              className="btn-primary"
              disabled={cardCount === 0}
            >
              <BookOpen className="w-4 h-4" />
              {t('study')}
            </button>

            {deck.type === 'custom' && (isAdmin(user) || (deck.ownerId === user?.uid && deck.visibility !== 'shared')) && (
              <button
                type="button"
                onClick={() => handleDeleteDeck(deck.id)}
                className="deck-delete-btn"
                aria-label={t('delete')}
                title={t('delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {deck.type === 'custom' && isAdmin(user) && <ContentPublication collectionName="flashcards" item={deck} language={language} onUpdated={fetchCustomDecks} />}
        </div>
      </article>
    );
  };

  if (view === 'generate') {
    return (
      <div className={`flashcards-page ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flashcards-shell">
          <div className="flashcards-topbar">
            <button
              type="button"
              onClick={() => setView('list')}
              className="icon-button"
              aria-label={t('back')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div>
              <h1>{t('createFromPDF')}</h1>
              <p>{t('subtitle')}</p>
            </div>
          </div>

          <FlashcardGenerator
            onClose={() => setView('list')}
            onDeckSaved={handleDeckSaved}
          />
        </div>
      </div>
    );
  }

  if (view === 'play' && selectedDeck) {
    const realCardIndex = shuffledIndices[currentCardIndex] ?? currentCardIndex;
    const currentCard = selectedDeck.cards[realCardIndex];
    const isLastCard = currentCardIndex === selectedDeck.cards.length - 1;
    const progressPercentage = ((currentCardIndex + 1) / selectedDeck.cards.length) * 100;

    if (studyComplete) {
      return (
        <div className={`flashcards-page study-complete-page ${isRTL ? 'rtl' : 'ltr'}`}>
          <div className="study-complete-card">
            <div className="study-complete-icon">
              <Trophy className="w-10 h-10" />
            </div>

            <h1>{t('congratulations')}</h1>
            <h2>{t('studyComplete')}</h2>

            <div className="study-summary-grid">
              <div>
                <strong>{selectedDeck.cards.length}</strong>
                <span>{t('cards')}</span>
              </div>
              <div>
                <strong>{studyStats.correct}</strong>
                <span>{t('correct')}</span>
              </div>
              <div>
                <strong>{studyStats.incorrect}</strong>
                <span>{t('incorrect')}</span>
              </div>
              <div>
                <strong>{getAccuracy()}%</strong>
                <span>{t('accuracy')}</span>
              </div>
            </div>

            <p className="study-time">
              {t('timeSpent')}: {getTimeSpent()}
            </p>

            <div className="study-actions">
              <button type="button" onClick={resetStudy} className="btn-primary">
                {t('studyAgain')}
              </button>
              <button type="button" onClick={() => setView('list')} className="btn-secondary">
                {t('back')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`flashcards-page ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flashcards-shell">
          <section className="study-header-card">
            <div className="study-header-main">
              <button
                type="button"
                onClick={() => setView('list')}
                className="icon-button"
                aria-label={t('back')}
              >
                <Home className="w-5 h-5" />
              </button>

              <div>
                <h1>{selectedDeck.title}</h1>
                <p>
                  {currentCardIndex + 1} {t('cardOf')} {selectedDeck.cards.length}
                </p>

                <div className="study-tags">
                  <span>{t(selectedDeck.difficulty)}</span>
                  <span>{t(selectedDeck.category)}</span>
                  {isShuffled && <span>{t('shuffle')}</span>}
                </div>
              </div>
            </div>

            <div className="study-header-actions">
              <button
                type="button"
                onClick={shuffleCards}
                className={`icon-button ${isShuffled ? 'active' : ''}`}
                title={t('shuffle')}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={resetStudy}
                className="icon-button"
                title={t('reset')}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <div className="study-progress-block">
              <div>
                <span>{t('progress')}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>

              <div className="study-progress-bar">
                <div style={{ width: `${progressPercentage}%` }} />
              </div>

              <div className="study-progress-dots">
                {studyStats.cardProgress.map((status, index) => (
                  <span
                    key={`${status}-${index}`}
                    className={`${getProgressColor(status)} ${
                      index === realCardIndex ? 'current' : ''
                    }`}
                    title={`Card ${index + 1}: ${status}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="study-stats-grid">
            <div>
              <strong>{studyStats.correct}</strong>
              <span><CheckCircle className="w-4 h-4" /> {t('correct')}</span>
            </div>
            <div>
              <strong>{studyStats.incorrect}</strong>
              <span><XCircle className="w-4 h-4" /> {t('incorrect')}</span>
            </div>
            <div>
              <strong>{getAccuracy()}%</strong>
              <span><Target className="w-4 h-4" /> {t('accuracy')}</span>
            </div>
            <div>
              <strong>{getTimeSpent()}</strong>
              <span><Clock className="w-4 h-4" /> {t('timeSpent')}</span>
            </div>
          </section>

          <section className="study-card">
            <div className="study-question">
              <div>
                <h2>{t('question')}</h2>
                <span>{currentCardIndex + 1} / {selectedDeck.cards.length}</span>
              </div>
              <p>{currentCard.front}</p>
            </div>

            <div className="study-answer-zone">
              {showAnswer ? (
                <div className="study-answer">
                  <h3>
                    <CheckCircle className="w-5 h-5" />
                    {t('answer')}
                  </h3>
                  <p>{currentCard.back}</p>

                  {currentCard.conceptSource && (
                    <small>Concept : {currentCard.conceptSource}</small>
                  )}

                  <div className="answer-actions">
                    <button
                      type="button"
                      onClick={() => handleCardResponse('incorrect')}
                      className="answer-btn incorrect"
                    >
                      <XCircle className="w-5 h-5" />
                      {t('incorrect')} <span>(1)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCardResponse('skip')}
                      className="answer-btn skip"
                    >
                      <AlertCircle className="w-5 h-5" />
                      {t('skip')} <span>(2)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCardResponse('correct')}
                      className="answer-btn correct"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {t('correct')} <span>(3)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAnswer(true)}
                  className="show-answer-btn"
                >
                  <Eye className="w-6 h-6" />
                  {t('showAnswer')} <span>(Space)</span>
                </button>
              )}
            </div>
          </section>

          <section className="study-bottom-nav">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentCardIndex === 0}
              className="btn-secondary"
            >
              <ChevronLeft className="w-5 h-5" />
              {t('prev')}
            </button>

            <label className="auto-advance-toggle">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(event) => setAutoAdvance(event.target.checked)}
              />
              {t('autoAdvance')}
            </label>

            <button
              type="button"
              onClick={isLastCard ? () => setStudyComplete(true) : handleNext}
              className="btn-primary"
            >
              {isLastCard ? (
                <>
                  <Trophy className="w-5 h-5" />
                  {t('finish')}
                </>
              ) : (
                <>
                  {t('next')}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </section>

          <p className="keyboard-help">{t('keyboardShortcuts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flashcards-page ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flashcards-shell">
        <header className="flashcards-hero">
          <div>
            <span className="flashcards-kicker">MedPlatform Maroc</span>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isAuthenticatedAndPaid()) {
                setView('generate');
              } else {
                alert(t('subscriptionRequired'));
              }
            }}
            className="btn-primary"
            disabled={!isAuthenticatedAndPaid()}
          >
            <Plus className="w-5 h-5" />
            {t('createFromPDF')}
          </button>
        </header>

        {error && (
          <div className="flashcards-alert">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <section className="flashcards-filters">
          <div className="flashcards-search">
            <Search className="w-5 h-5" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </section>

        {(loading || authLoading) && (
          <section className="flashcards-empty">
            <div className="loading-spinner" />
            <p>{t('loading')}</p>
          </section>
        )}

        {!loading && !authLoading && !isAuthenticatedAndPaid() && customDecks.length === 0 && (
          <section className="flashcards-empty">
            <BookOpen className="w-12 h-12" />
            <h3>{t('noDecks')}</h3>
            <p>{t('subscriptionRequired')}</p>
            <button
              type="button"
              onClick={() => navigate('/subscription')}
              className="btn-primary"
            >
              {t('subscribe')}
            </button>
          </section>
        )}

        {!loading && !authLoading && visibleCustomDecks.length > 0 && (
          <section className="flashcards-section">
            <div className="section-title-row">
              <span className="section-line green" />
              <h2>{t('myDecks')}</h2>
              <strong>{visibleCustomDecks.length}</strong>
            </div>

            <div className="flashcards-grid">
              {visibleCustomDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          </section>
        )}

        {!loading && !authLoading && visibleDefaultDecks.length > 0 && (
          <section className="flashcards-section">
            <div className="section-title-row">
              <span className="section-line blue" />
              <h2>{t('defaultDecks')}</h2>
            </div>

            <div className="flashcards-grid">
              {visibleDefaultDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          </section>
        )}

        {!loading && !authLoading && filteredDecks.length === 0 && (
          <section className="flashcards-empty">
            <BookOpen className="w-12 h-12" />
            <h3>{t('noDecks')}</h3>
            <p>{t('noResultMessage')}</p>
            <button
              type="button"
              onClick={() => {
                if (isAuthenticatedAndPaid()) {
                  setView('generate');
                } else {
                  alert(t('subscriptionRequired'));
                }
              }}
              className="btn-primary"
              disabled={!isAuthenticatedAndPaid()}
            >
              {t('createFromPDF')}
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default Flashcards;
