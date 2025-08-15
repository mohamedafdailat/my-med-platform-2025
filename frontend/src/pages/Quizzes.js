import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import debounce from 'lodash/debounce';
import { toast } from 'react-toastify';

const Quizzes = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const texts = useMemo(() => ({
    fr: {
      title: 'Bibliothèque de Quiz',
      loading: 'Chargement des quiz...',
      error: 'Erreur lors du chargement des quiz',
      indexError: 'Erreur de requête : un index Firestore est requis. Contactez l\'administrateur ou créez l\'index via la console Firebase.',
      noQuizzes: 'Aucun quiz disponible',
      noResults: 'Aucun résultat trouvé pour votre recherche',
      searchPlaceholder: 'Rechercher des quiz...',
      clearSearch: 'Effacer la recherche',
      categories: {
        all: 'Toutes les catégories',
        cardiology: 'Cardiologie',
        other: 'Autres',
        dentaire: 'Santé dentaire',
        'general-medicine': 'Médecine générale',
        pharmacy: 'Pharmacie',
        technology: 'Technologie médicale',
        anatomy: 'Anatomie',
        physiology: 'Physiologie',
        pharmacology: 'Pharmacologie',
        pathology: 'Pathologie',
        clinical: 'Pratique clinique',
        terminology: 'Terminologie médicale',
      },
      tabs: {
        all: 'Tous',
        aiGenerated: 'Générés par IA',
        predefined: 'Prédéfinis',
      },
      retry: 'Réessayer',
      retrying: 'Tentative de reconnexion...',
      noDescription: 'Aucune description disponible',
      takeQuiz: 'Passer le quiz',
      reviewQuiz: 'Réviser le quiz',
      generateQuiz: 'Générer un quiz',
      refresh: 'Actualiser',
      backToTop: 'Retour en haut',
      categoryLabel: 'Filtrer par catégorie',
      suggestionsLabel: 'Suggestions de recherche',
      stats: {
        totalQuizzes: 'Total des quiz',
        completed: 'Quiz terminés',
        avgScore: 'Score moyen',
        generated: 'Quiz générés',
      },
      difficulty: {
        easy: 'Facile',
        medium: 'Moyen',
        hard: 'Difficile',
      },
      completed: 'Terminé',
      course: 'Cours',
      questions: 'Questions',
    },
    ar: {
      title: 'مكتبة الاختبارات',
      loading: 'جاري تحميل الاختبارات...',
      error: 'خطأ في تحميل الاختبارات',
      indexError: 'خطأ في الاستعلام: يتطلب فهرس Firestore. اتصل بالمسؤول أو قم بإنشاء الفهرس عبر وحدة تحكم Firebase.',
      noQuizzes: 'لا توجد اختبارات متاحة',
      noResults: 'لا توجد نتائج لبحثك',
      searchPlaceholder: 'البحث عن اختبارات...',
      clearSearch: 'مسح البحث',
      categories: {
        all: 'جميع الفئات',
        'general-medicine': 'الطب العام',
        cardiology: 'أمراض القلب',
        pharmacy: 'الصيدلة',
        technology: 'التكنولوجيا الطبية',
        other: 'أخرى',
        dentaire: 'الصحة الفموية',
        anatomy: 'تشريح',
        physiology: 'فسيولوجيا',
        pharmacology: 'علم الصيدلة',
        pathology: 'علم الأمراض',
        clinical: 'الممارسة السريرية',
        terminology: 'المصطلحات الطبية',
      },
      tabs: {
        all: 'الكل',
        aiGenerated: 'مولدة بالذكاء الاصطناعي',
        predefined: 'محددة مسبقًا',
      },
      retry: 'إعادة المحاولة',
      retrying: 'جاري إعادة المحاولة...',
      noDescription: 'لا يوجد وصف متاح',
      takeQuiz: 'إجراء الاختبار',
      reviewQuiz: 'مراجعة الاختبار',
      generateQuiz: 'إنشاء اختبار',
      refresh: 'تحديث',
      backToTop: 'العودة إلى الأعلى',
      categoryLabel: 'تصفية حسب الفئة',
      suggestionsLabel: 'اقتراحات البحث',
      stats: {
        totalQuizzes: 'إجمالي الاختبارات',
        completed: 'الاختبارات المكتملة',
        avgScore: 'متوسط الدرجات',
        generated: 'اختبارات مولدة',
      },
      difficulty: {
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
      },
      completed: 'مكتمل',
      course: 'الدورة',
      questions: 'أسئلة',
    },
  }), [language]);

  const t = texts[language] || texts.fr;
  const isRTL = language === 'ar';

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let quizzesQuery;
      if (selectedTab === 'aiGenerated' && user) {
        quizzesQuery = query(
          collection(db, 'quizzes'),
          where('type', '==', 'ai-generated'),
          where('creatorId', '==', user.uid),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      } else {
        quizzesQuery = query(
          collection(db, 'quizzes'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }
      const querySnapshot = await getDocs(quizzesQuery);
      const processedQuizzes = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || { fr: 'Titre non disponible', ar: 'عنوان غير متاح' },
        description: doc.data().description || { fr: '', ar: '' },
        category: doc.data().category || 'other',
        type: doc.data().type || 'predefined',
        creatorId: doc.data().creatorId || 'anonymous',
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        attempts: doc.data().attempts || [],
        bestScore: doc.data().bestScore || 0,
        difficulty: doc.data().difficulty || 'medium',
        questions: doc.data().questions || [],
        course: doc.data().course || 'Cours non spécifié',
      }));
      setQuizzes(processedQuizzes);
      setRetryCount(0);
    } catch (err) {
      let errorMessage = t.error;
      if (err.code === 'permission-denied') {
        errorMessage += ' (Accès refusé)';
      } else if (err.code === 'unavailable') {
        errorMessage += ' (Service indisponible)';
      } else if (err.message.includes('index')) {
        errorMessage = t.indexError;
        console.error('Index error details:', err.message);
      } else {
        errorMessage += `: ${err.message}`;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [t.error, t.indexError, user, selectedTab]);

  const fetchSuggestions = useCallback(
    debounce(async (term) => {
      if (!term) {
        setSuggestions([]);
        return;
      }
      try {
        // Optimized query: Fetch only quizzes where title or course matches (not supported by Firestore directly for text search)
        // Fallback to client-side filtering for now
        const quizzesQuery = query(
          collection(db, 'quizzes'),
          where('status', '==', 'active'),
          orderBy('title.fr'),
          limit(10) // Increased limit slightly for better suggestions
        );
        const querySnapshot = await getDocs(quizzesQuery);
        const matchingTitles = querySnapshot.docs
          .filter((doc) => {
            const title = doc.data().title?.[language] || doc.data().title?.fr || '';
            const course = doc.data().course || '';
            return (
              title.toLowerCase().includes(term.toLowerCase()) ||
              course.toLowerCase().includes(term.toLowerCase())
            );
          })
          .map((doc) => doc.data().title?.[language] || doc.data().title?.fr)
          .slice(0, 5);
        setSuggestions([...new Set(matchingTitles)]); // Remove duplicates
      } catch (err) {
        console.error('Erreur lors de la récupération des suggestions:', err);
        toast.error(t.error);
      }
    }, 300),
    [language, t.error]
  );

  const handleRetry = useCallback(async () => {
    if (retryCount >= 3) {
      setError(t.error + ' (Nombre maximum de tentatives atteint)');
      toast.error(t.error + ' (Nombre maximum de tentatives atteint)');
      return;
    }
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    const delay = Math.pow(2, retryCount) * 1000;
    setTimeout(() => {
      fetchQuizzes();
    }, delay);
  }, [retryCount, fetchQuizzes, t.error]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSuggestions([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const title = quiz.title[language] || quiz.title.fr || '';
      const description = quiz.description[language] || quiz.description.fr || '';
      const course = quiz.course || '';
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || quiz.category === selectedCategory;
      const matchesTab =
        selectedTab === 'all' ||
        (selectedTab === 'aiGenerated' && quiz.type === 'ai-generated') ||
        (selectedTab === 'predefined' && quiz.type === 'predefined');
      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [quizzes, searchTerm, selectedCategory, selectedTab, language]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(quizzes.map((quiz) => quiz.category));
    return ['all', ...categories].map((cat) => ({
      key: cat,
      label: t.categories[cat] || cat,
    }));
  }, [quizzes, t.categories]);

  const userStats = useMemo(() => {
    if (!user) return { totalQuizzes: 0, completed: 0, avgScore: 0, generated: 0 };
    const userQuizzes = quizzes.filter((quiz) => quiz.attempts.some((attempt) => attempt.userId === user.uid));
    const completed = userQuizzes.length;
    const totalScore = userQuizzes.reduce((sum, quiz) => {
      const userAttempt = quiz.attempts.find((attempt) => attempt.userId === user.uid);
      return sum + (userAttempt?.score || 0);
    }, 0);
    const avgScore = completed ? (totalScore / completed).toFixed(1) : 0;
    const generated = quizzes.filter((quiz) => quiz.creatorId === user.uid && quiz.type === 'ai-generated').length;
    return {
      totalQuizzes: quizzes.length,
      completed,
      avgScore,
      generated,
    };
  }, [quizzes, user]);

  const LoadingComponent = () => (
    <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" aria-label={isRetrying ? t.retrying : t.loading}></div>
        <p className="text-gray-600 text-lg font-medium">{isRetrying ? t.retrying : t.loading}</p>
        {isRetrying && <p className="text-gray-500 text-sm mt-2">Tentative {retryCount}/3</p>}
      </div>
    </main>
  );

  const ErrorComponent = () => (
    <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-500">Erreur de chargement</h3>
        </div>
        <p className="text-red-500 mb-4 text-center">{error}</p>
        <button
          onClick={handleRetry}
          disabled={isRetrying || retryCount >= 3}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-disabled={isRetrying || retryCount >= 3}
          aria-label={isRetrying ? t.retrying : t.retry}
        >
          {isRetrying ? t.retrying : t.retry}
        </button>
      </div>
    </main>
  );

  const QuizCard = ({ quiz }) => {
    const isCompleted = quiz.attempts.some((attempt) => attempt.userId === user?.uid);
    return (
      <div
        className="bg-white rounded-xl shadow-lg p-6 relative group border border-gray-100 hover:shadow-xl transition-all duration-200"
        role="article"
        aria-labelledby={`quiz-title-${quiz.id}`}
      >
        <div className="flex justify-between items-start mb-3">
          <h3
            id={`quiz-title-${quiz.id}`}
            className="font-semibold text-xl text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors"
          >
            {quiz.title[language] || quiz.title.fr}
          </h3>
          {isCompleted && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t.completed}
            </span>
          )}
        </div>
        <p className="text-gray-600 text-base mb-3 line-clamp-2">
          {t.course}: {quiz.course}
        </p>
        <p className="text-gray-600 text-base mb-3 line-clamp-3">
          {quiz.description[language] || quiz.description.fr || t.noDescription}
        </p>
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            {t.categories[quiz.category] || quiz.category}
          </span>
          <span
            className={`px-3 py-1 rounded-full ${
              quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}
          >
            {t.difficulty[quiz.difficulty]}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-500">
            {quiz.type === 'ai-generated' ? t.tabs.aiGenerated : t.tabs.predefined}
          </span>
          <span className="text-gray-500">
            {quiz.questions.length} {t.questions}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-500">
            {new Date(quiz.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'ar-MA')}
          </span>
          {quiz.bestScore > 0 && (
            <span className="text-gray-500">{t.stats.avgScore}: {quiz.bestScore}%</span>
          )}
        </div>
        <div className="flex gap-2">
          <NavLink
            to={`/quizzes/${quiz.id}`}
            className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm"
            aria-label={isCompleted ? t.reviewQuiz : t.takeQuiz}
          >
            <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />
            </svg>
            {isCompleted ? t.reviewQuiz : t.takeQuiz}
          </NavLink>
        </div>
      </div>
    );
  };

  if (loading) return <LoadingComponent />;
  if (error) return <ErrorComponent />;

  return (
    <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`} aria-labelledby="quizzes-title">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h1 id="quizzes-title" className="text-4xl font-bold text-gray-900 mb-4 md:mb-0">{t.title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-lg text-gray-700 font-medium">
              {filteredQuizzes.length} {language === 'fr' ? 'quiz' : 'اختبار'}{filteredQuizzes.length !== 1 ? language === 'fr' ? 'zes' : 'ات' : ''}
            </span>
            <button
              onClick={fetchQuizzes}
              disabled={loading}
              className="p-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200"
              title={t.refresh}
              aria-label={t.refresh}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <NavLink
              to="/quiz-generator"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm"
              aria-label={t.generateQuiz}
            >
              <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.generateQuiz}
            </NavLink>
          </div>
        </div>
        {user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg shadow">
            <div className="text-center">
              <p className="text-gray-600">{t.stats.totalQuizzes}</p>
              <p className="text-xl font-semibold">{userStats.totalQuizzes}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">{t.stats.completed}</p>
              <p className="text-xl font-semibold">{userStats.completed}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">{t.stats.avgScore}</p>
              <p className="text-xl font-semibold">{userStats.avgScore}%</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">{t.stats.generated}</p>
              <p className="text-xl font-semibold">{userStats.generated}</p>
            </div>
          </div>
        )}
      </header>

      <section className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex space-x-2 mb-4 md:mb-0">
            {Object.keys(t.tabs).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label={`${t.categoryLabel}: ${t.tabs[tab]}`}
                aria-pressed={selectedTab === tab}
              >
                {t.tabs[tab]}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <input
              type="search"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchInputRef.current?.focus();
                } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
                  suggestionsRef.current?.children[0]?.focus();
                } else if (e.key === 'Escape') {
                  clearSearch();
                }
              }}
              ref={searchInputRef}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              aria-label={t.searchPlaceholder}
              aria-controls="quizzes-grid"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-all duration-200"
                aria-label={t.clearSearch}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {suggestions.length > 0 && (
              <ul
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-2 max-h-60 overflow-y-auto"
                role="listbox"
                aria-label={t.suggestionsLabel}
              >
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    tabIndex={0}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSuggestionClick(suggestion);
                      if (e.key === 'ArrowDown' && index < suggestions.length - 1) {
                        suggestionsRef.current.children[index + 1].focus();
                      }
                      if (e.key === 'ArrowUp' && index > 0) {
                        suggestionsRef.current.children[index - 1].focus();
                      }
                      if (e.key === 'Escape') clearSearch();
                    }}
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                    role="option"
                    aria-selected={searchTerm === suggestion}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="md:hidden">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              aria-label={t.categoryLabel}
            >
              {uniqueCategories.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="hidden md:flex flex-wrap gap-2">
            {uniqueCategories.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label={`${t.categoryLabel}: ${label}`}
                aria-pressed={selectedCategory === key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="quizzes-grid" aria-live="polite">
        {filteredQuizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <svg className="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              {searchTerm || selectedCategory !== 'all' || selectedTab !== 'all' ? t.noResults : t.noQuizzes}
            </h3>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200"
                aria-label={t.clearSearch}
              >
                {t.clearSearch}
              </button>
            )}
            {selectedTab === 'aiGenerated' && filteredQuizzes.length === 0 && (
              <NavLink
                to="/quiz-generator"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                aria-label={t.generateQuiz}
              >
                {t.generateQuiz}
              </NavLink>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </section>

      {filteredQuizzes.length > 3 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200"
          aria-label={t.backToTop}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </main>
  );
};

export default Quizzes;