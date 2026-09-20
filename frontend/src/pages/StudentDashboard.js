// StudentDashboard.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  BarChart3,
  BookOpen,
  Brain,
  Clock,
  GraduationCap,
  Home,
  Layers,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const DEFAULT_STATS = {
  coursesCompleted: 0,
  quizzesTaken: 0,
  flashcardsMastered: 0,
  videosWatched: 0,
  studyHours: 0,
};

const DEFAULT_PROGRESS = {
  weekly: [0, 0, 0, 0, 0],
  monthly: [0, 0, 0, 0],
  categories: {
    anatomy: 0,
    physiology: 0,
    pharmacology: 0,
  },
};

const RECOMMENDATION_IMAGES = ['/image1.png', '/image2.png', '/image3.png'];

const clampArray = (value, length) => {
  if (!Array.isArray(value)) return Array(length).fill(0);
  return Array.from({ length }, (_, index) => Number(value[index] || 0));
};

const timestampToDate = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;

  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);

  return null;
};

const getLocalizedText = (value, language, fallback = '') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value?.[language] || value?.fr || fallback;
};

const Sidebar = ({ language }) => {
  const items = [
    {
      path: '/dashboard',
      label: language === 'fr' ? 'Tableau de bord' : 'لوحة التحكم',
      icon: BarChart3,
    },
    {
      path: '/courses',
      label: language === 'fr' ? 'Cours' : 'الدورات',
      icon: BookOpen,
    },
    {
      path: '/videos',
      label: language === 'fr' ? 'Vidéos' : 'الفيديوهات',
      icon: PlayCircle,
    },
    {
      path: '/quizzes',
      label: language === 'fr' ? 'Quiz' : 'الاختبارات',
      icon: Brain,
    },
    {
      path: '/flashcards',
      label: language === 'fr' ? 'Flashcards' : 'البطاقات',
      icon: Layers,
    },
  ];

  return (
    <aside className="sidebar student-dashboard-sidebar">
      <h3 className="sidebar-title">
        {language === 'fr' ? 'Espace étudiant' : 'فضاء الطالب'}
      </h3>

      <nav aria-label={language === 'fr' ? 'Navigation étudiant' : 'تنقل الطالب'}>
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

const EmptyChart = ({ language }) => (
  <div className="dashboard-empty-chart">
    <TrendingUp className="w-8 h-8" aria-hidden="true" />
    <p>
      {language === 'fr'
        ? 'Aucune donnée disponible pour le moment.'
        : 'لا توجد بيانات متاحة حاليا.'}
    </p>
  </div>
);

const StudentDashboard = () => {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [timeFilter, setTimeFilter] = useState('week');
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [evolutionData, setEvolutionData] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isRTL = language === 'ar';

  const t = useMemo(
    () => ({
      pageTitle: language === 'fr' ? 'Tableau de bord étudiant' : 'لوحة الطالب',
      pageSubtitle:
        language === 'fr'
          ? 'Suivez votre progression, vos révisions et vos activités académiques.'
          : 'تابع تقدمك ومراجعاتك وأنشطتك الأكاديمية.',
      welcome:
        language === 'fr'
          ? `Bienvenue, ${user?.displayName || user?.email || 'Utilisateur'}`
          : `مرحبًا، ${user?.displayName || user?.email || 'المستخدم'}`,
      currentLevel:
        language === 'fr'
          ? `Semestre ${user?.semester || '-'}`
          : `الفصل الدراسي ${user?.semester || '-'}`,
      activePlan:
        language === 'fr'
          ? user?.subscriptionStatus === 'paid'
            ? 'Abonnement actif'
            : 'Abonnement non actif'
          : user?.subscriptionStatus === 'paid'
          ? 'الاشتراك مفعل'
          : 'الاشتراك غير مفعل',
      coursesCompleted: language === 'fr' ? 'Cours terminés' : 'الدروس المكتملة',
      quizzesTaken: language === 'fr' ? 'Quiz passés' : 'الاختبارات المنجزة',
      flashcardsMastered:
        language === 'fr' ? 'Flashcards maîtrisées' : 'البطاقات المتقنة',
      videosWatched: language === 'fr' ? 'Vidéos regardées' : 'الفيديوهات المشاهدة',
      studyHours: language === 'fr' ? 'Heures d’étude' : 'ساعات الدراسة',
      week: language === 'fr' ? 'Semaine' : 'أسبوع',
      month: language === 'fr' ? 'Mois' : 'شهر',
      progress: language === 'fr' ? 'Progression' : 'التقدم',
      weekly: language === 'fr' ? 'hebdomadaire' : 'الأسبوعي',
      monthly: language === 'fr' ? 'mensuelle' : 'الشهري',
      categorySplit: language === 'fr' ? 'Répartition par matière' : 'التوزيع حسب المادة',
      evolution: language === 'fr' ? 'Évolution de vos progrès' : 'تطور تقدمك',
      history:
        language === 'fr'
          ? 'Historique des dernières activités'
          : 'سجل آخر الأنشطة',
      recommendations:
        language === 'fr' ? 'Recommandations académiques' : 'توصيات أكاديمية',
      quickActions: language === 'fr' ? 'Actions rapides' : 'إجراءات سريعة',
      start: language === 'fr' ? 'Commencer' : 'ابدأ',
      continue: language === 'fr' ? 'Continuer' : 'متابعة',
      refresh: language === 'fr' ? 'Réessayer' : 'إعادة المحاولة',
      loading: language === 'fr' ? 'Chargement du tableau de bord...' : 'جاري تحميل اللوحة...',
      notAuthenticated:
        language === 'fr'
          ? 'Utilisateur non authentifié.'
          : 'المستخدم غير مسجل الدخول.',
      userDocMissing:
        language === 'fr'
          ? 'Profil utilisateur non trouvé. Les données par défaut sont affichées.'
          : 'لم يتم العثور على ملف المستخدم. يتم عرض البيانات الافتراضية.',
      loadingError:
        language === 'fr'
          ? 'Une erreur est survenue lors du chargement des données.'
          : 'حدث خطأ أثناء تحميل البيانات.',
      permissionDenied:
        language === 'fr'
          ? 'Permissions insuffisantes pour accéder aux données.'
          : 'صلاحيات غير كافية للوصول إلى البيانات.',
      unavailable:
        language === 'fr'
          ? 'Service temporairement indisponible. Veuillez réessayer.'
          : 'الخدمة غير متاحة مؤقتًا. يرجى المحاولة لاحقًا.',
      noRecommendations:
        language === 'fr'
          ? 'Aucune recommandation disponible pour le moment.'
          : 'لا توجد توصيات متاحة حاليا.',
    }),
    [language, user]
  );

  const statCards = useMemo(
    () => [
      {
        label: t.coursesCompleted,
        value: stats.coursesCompleted,
        icon: GraduationCap,
        helper: language === 'fr' ? 'Progression cours' : 'تقدم الدروس',
      },
      {
        label: t.quizzesTaken,
        value: stats.quizzesTaken,
        icon: Brain,
        helper: language === 'fr' ? 'Évaluation active' : 'تقييم نشط',
      },
      {
        label: t.flashcardsMastered,
        value: stats.flashcardsMastered,
        icon: Layers,
        helper: language === 'fr' ? 'Révision espacée' : 'مراجعة متباعدة',
      },
      {
        label: t.videosWatched,
        value: stats.videosWatched,
        icon: PlayCircle,
        helper: language === 'fr' ? 'Apprentissage vidéo' : 'تعلم بالفيديو',
      },
      {
        label: t.studyHours,
        value: stats.studyHours,
        icon: Clock,
        helper: language === 'fr' ? 'Temps total' : 'الوقت الإجمالي',
      },
    ],
    [stats, t, language]
  );

  const quickActions = useMemo(
    () => [
      {
        to: '/courses',
        title: language === 'fr' ? 'Reprendre un cours' : 'متابعة درس',
        description:
          language === 'fr'
            ? 'Continuez votre parcours académique.'
            : 'واصل مسارك الأكاديمي.',
        icon: BookOpen,
      },
      {
        to: '/quizzes',
        title: language === 'fr' ? 'Faire un quiz' : 'إنجاز اختبار',
        description:
          language === 'fr'
            ? 'Testez vos connaissances rapidement.'
            : 'اختبر معارفك بسرعة.',
        icon: Target,
      },
      {
        to: '/flashcards',
        title: language === 'fr' ? 'Réviser les flashcards' : 'مراجعة البطاقات',
        description:
          language === 'fr'
            ? 'Renforcez votre mémorisation.'
            : 'عزز الحفظ والاستيعاب.',
        icon: Layers,
      },
    ],
    [language]
  );

  const buildFallbackRecommendations = useCallback(
    () => [
      {
        id: 'courses',
        type: 'course',
        title: language === 'fr' ? 'Explorer les cours disponibles' : 'استكشاف الدروس المتاحة',
        description:
          language === 'fr'
            ? 'Accédez aux cours structurés par matière.'
            : 'اطلع على الدروس المنظمة حسب المادة.',
        to: '/courses',
        image: RECOMMENDATION_IMAGES[0],
      },
      {
        id: 'quizzes',
        type: 'quiz',
        title: language === 'fr' ? 'S’entraîner avec les quiz' : 'التدرب بالاختبارات',
        description:
          language === 'fr'
            ? 'Mesurez votre niveau avec des quiz interactifs.'
            : 'قِس مستواك من خلال اختبارات تفاعلية.',
        to: '/quizzes',
        image: RECOMMENDATION_IMAGES[1],
      },
      {
        id: 'flashcards',
        type: 'flashcard',
        title: language === 'fr' ? 'Réviser avec les flashcards' : 'المراجعة بالبطاقات',
        description:
          language === 'fr'
            ? 'Mémorisez les notions clés efficacement.'
            : 'احفظ المفاهيم الأساسية بفعالية.',
        to: '/flashcards',
        image: RECOMMENDATION_IMAGES[2],
      },
    ],
    [language]
  );

  const fetchRecommendations = useCallback(async () => {
    const fallback = buildFallbackRecommendations();

    try {
      const coursesQuery = query(collection(db, 'courses'), limit(2));
      const quizzesQuery = query(collection(db, 'quizzes'), where('visibility', '==', 'shared'), limit(2));

      const [coursesSnap, quizzesSnap] = await Promise.allSettled([
        getDocs(coursesQuery),
        getDocs(quizzesQuery),
      ]);

      const items = [];

      if (coursesSnap.status === 'fulfilled') {
        coursesSnap.value.docs.forEach((courseDoc) => {
          const data = courseDoc.data();

          items.push({
            id: courseDoc.id,
            type: 'course',
            title: getLocalizedText(data.title, language, language === 'fr' ? 'Cours' : 'درس'),
            description: getLocalizedText(
              data.description,
              language,
              language === 'fr'
                ? 'Cours recommandé pour votre progression.'
                : 'درس موصى به لتقدمك.'
            ),
            to: `/courses/${courseDoc.id}`,
          });
        });
      }

      if (quizzesSnap.status === 'fulfilled') {
        quizzesSnap.value.docs.forEach((quizDoc) => {
          const data = quizDoc.data();

          items.push({
            id: quizDoc.id,
            type: 'quiz',
            title: getLocalizedText(data.title, language, language === 'fr' ? 'Quiz' : 'اختبار'),
            description: getLocalizedText(
              data.description,
              language,
              language === 'fr'
                ? 'Quiz recommandé pour tester vos connaissances.'
                : 'اختبار موصى به لتقييم معرفتك.'
            ),
            to: `/quizzes/${quizDoc.id}`,
          });
        });
      }

      const finalRecommendations = items.length > 0 ? items.slice(0, 3) : fallback;

      setRecommended(
        finalRecommendations.map((item, index) => ({
          ...item,
          image: RECOMMENDATION_IMAGES[index] || RECOMMENDATION_IMAGES[0],
        }))
      );
    } catch {
      setRecommended(fallback);
    }
  }, [buildFallbackRecommendations, language]);

  const fetchDashboardData = useCallback(async () => {
    if (authLoading) return;

    if (!user?.uid) {
      setError(t.notAuthenticated);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const userStats = data.stats || {};
        const userProgress = data.progress || {};

        setStats({
          coursesCompleted: Number(userStats.coursesCompleted || 0),
          quizzesTaken: Number(userStats.quizzesTaken || 0),
          flashcardsMastered: Number(userStats.flashcardsMastered || 0),
          videosWatched: Number(userStats.videosWatched || 0),
          studyHours: Number(userStats.studyHours || 0),
        });

        setProgress({
          weekly: clampArray(userProgress.weekly, 5),
          monthly: clampArray(userProgress.monthly, 4),
          categories: {
            anatomy: Number(userProgress.categories?.anatomy || 0),
            physiology: Number(userProgress.categories?.physiology || 0),
            pharmacology: Number(userProgress.categories?.pharmacology || 0),
          },
        });
      } else {
        setStats(DEFAULT_STATS);
        setProgress(DEFAULT_PROGRESS);
        setError(t.userDocMissing);
      }

      const evolutionRef = collection(db, 'userProgress', user.uid, 'history');
      const evolutionQuery = query(evolutionRef, orderBy('timestamp', 'desc'), limit(10));
      const evolutionSnap = await getDocs(evolutionQuery);

      const history = evolutionSnap.docs
        .map((historyDoc) => {
          const data = historyDoc.data();
          const date = timestampToDate(data.timestamp);

          return {
            date: date
              ? date.toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR', {
                  day: '2-digit',
                  month: 'short',
                })
              : language === 'fr'
              ? 'Date inconnue'
              : 'تاريخ غير معروف',
            coursesCompleted: Number(data.coursesCompleted || 0),
            quizzesTaken: Number(data.quizzesTaken || 0),
            studyHours: Number(data.studyHours || 0),
          };
        })
        .reverse();

      setEvolutionData(history);
      await fetchRecommendations();
    } catch (err) {
      let message = t.loadingError;

      if (err?.code === 'permission-denied') {
        message = t.permissionDenied;
      } else if (err?.code === 'unavailable') {
        message = t.unavailable;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authLoading, fetchRecommendations, language, t, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    }),
    []
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
          },
        },
      },
    }),
    []
  );

  const barData = useMemo(
    () => ({
      labels:
        timeFilter === 'week'
          ? [
              language === 'fr' ? 'Lun' : 'الإثنين',
              language === 'fr' ? 'Mar' : 'الثلاثاء',
              language === 'fr' ? 'Mer' : 'الأربعاء',
              language === 'fr' ? 'Jeu' : 'الخميس',
              language === 'fr' ? 'Ven' : 'الجمعة',
            ]
          : [
              language === 'fr' ? 'Sem 1' : 'أسبوع 1',
              language === 'fr' ? 'Sem 2' : 'أسبوع 2',
              language === 'fr' ? 'Sem 3' : 'أسبوع 3',
              language === 'fr' ? 'Sem 4' : 'أسبوع 4',
            ],
      datasets: [
        {
          label: t.studyHours,
          data: timeFilter === 'week' ? progress.weekly : progress.monthly,
          backgroundColor: '#2563eb',
          borderRadius: 10,
        },
      ],
    }),
    [language, progress, t.studyHours, timeFilter]
  );

  const doughnutData = useMemo(
    () => ({
      labels: [
        language === 'fr' ? 'Anatomie' : 'تشريح',
        language === 'fr' ? 'Physiologie' : 'فسيولوجيا',
        language === 'fr' ? 'Pharmacologie' : 'علم الصيدلة',
      ],
      datasets: [
        {
          data: [
            progress.categories.anatomy,
            progress.categories.physiology,
            progress.categories.pharmacology,
          ],
          backgroundColor: ['#2563eb', '#10b981', '#f59e0b'],
          borderWidth: 0,
        },
      ],
    }),
    [language, progress.categories]
  );

  const evolutionLineData = useMemo(
    () => ({
      labels: evolutionData.map((item) => item.date),
      datasets: [
        {
          label: t.coursesCompleted,
          data: evolutionData.map((item) => item.coursesCompleted),
          borderColor: '#2563eb',
          backgroundColor: '#2563eb',
          tension: 0.35,
          fill: false,
        },
        {
          label: t.quizzesTaken,
          data: evolutionData.map((item) => item.quizzesTaken),
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          tension: 0.35,
          fill: false,
        },
        {
          label: t.studyHours,
          data: evolutionData.map((item) => item.studyHours),
          borderColor: '#f59e0b',
          backgroundColor: '#f59e0b',
          tension: 0.35,
          fill: false,
        },
      ],
    }),
    [evolutionData, t]
  );

  const hasBarData =
    (timeFilter === 'week' ? progress.weekly : progress.monthly).some((value) => value > 0);

  const hasDoughnutData = Object.values(progress.categories).some((value) => value > 0);
  const hasEvolutionData = evolutionData.length > 0;

  if (loading || authLoading) {
    return (
      <div className="dashboard-layout">
        <Sidebar language={language} />
        <main className="main-content-area">
          <section className="page-container student-dashboard-page">
            <div className="dashboard-loading">
              <div className="loading-spinner" aria-hidden="true" />
              <p>{t.loading}</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`dashboard-layout ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar language={language} />

      <main className="main-content-area">
        <section className="page-container student-dashboard-page">
          <div className="student-dashboard-hero">
            <div>
              <div className="home-badge dashboard-badge">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>{language === 'fr' ? 'Suivi académique' : 'تتبع أكاديمي'}</span>
              </div>

              <h1>{t.pageTitle}</h1>
              <p>{t.pageSubtitle}</p>

              <div className="dashboard-user-meta">
                <span>{t.welcome}</span>
                <span>{t.currentLevel}</span>
                <span>{t.activePlan}</span>
              </div>
            </div>

            <div className="dashboard-hero-card" aria-hidden="true">
              <Home className="w-8 h-8" />
              <strong>{language === 'fr' ? 'Votre espace' : 'مساحتك'}</strong>
              <span>{language === 'fr' ? 'Progression centralisée' : 'تقدم مركزي'}</span>
            </div>
          </div>

          {error && (
            <div className="dashboard-alert" role="alert">
              <p>{error}</p>
              <button type="button" onClick={fetchDashboardData}>
                {t.refresh}
              </button>
            </div>
          )}

          <div className="dashboard-stats-grid">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <article key={card.label} className="dashboard-stat">
                  <div className="dashboard-stat-icon">
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3>{card.label}</h3>
                    <p>{card.value}</p>
                    <span>{card.helper}</span>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>{t.quickActions}</h2>
                <p>
                  {language === 'fr'
                    ? 'Accédez rapidement aux fonctionnalités principales.'
                    : 'ادخل بسرعة إلى الوظائف الأساسية.'}
                </p>
              </div>
            </div>

            <div className="dashboard-actions-grid">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <NavLink key={action.to} to={action.to} className="dashboard-action-card">
                    <Icon className="w-7 h-7" aria-hidden="true" />
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                  </NavLink>
                );
              })}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>
                  {t.progress} {timeFilter === 'week' ? t.weekly : t.monthly}
                </h2>
                <p>
                  {language === 'fr'
                    ? 'Analysez votre rythme de travail.'
                    : 'حلّل وتيرة عملك.'}
                </p>
              </div>

              <div className="time-filter">
                <button
                  type="button"
                  className={`category-button ${timeFilter === 'week' ? 'active' : ''}`}
                  onClick={() => setTimeFilter('week')}
                >
                  {t.week}
                </button>
                <button
                  type="button"
                  className={`category-button ${timeFilter === 'month' ? 'active' : ''}`}
                  onClick={() => setTimeFilter('month')}
                >
                  {t.month}
                </button>
              </div>
            </div>

            <div className="dashboard-charts">
              <article className="chart-container">
                <h3>
                  {t.progress} {timeFilter === 'week' ? t.weekly : t.monthly}
                </h3>
                <div className="dashboard-chart-box">
                  {hasBarData ? (
                    <Bar data={barData} options={chartOptions} />
                  ) : (
                    <EmptyChart language={language} />
                  )}
                </div>
              </article>

              <article className="chart-container">
                <h3>{t.categorySplit}</h3>
                <div className="dashboard-chart-box">
                  {hasDoughnutData ? (
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  ) : (
                    <EmptyChart language={language} />
                  )}
                </div>
              </article>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>{t.evolution}</h2>
                <p>{t.history}</p>
              </div>
            </div>

            <div className="evolution-dashboard">
              <div className="dashboard-chart-box dashboard-chart-large">
                {hasEvolutionData ? (
                  <Line data={evolutionLineData} options={chartOptions} />
                ) : (
                  <EmptyChart language={language} />
                )}
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>{t.recommendations}</h2>
                <p>
                  {language === 'fr'
                    ? 'Suggestions pour continuer votre apprentissage.'
                    : 'اقتراحات لمواصلة التعلم.'}
                </p>
              </div>
            </div>

            {recommended.length === 0 ? (
              <div className="dashboard-empty-state">{t.noRecommendations}</div>
            ) : (
              <div className="features-grid dashboard-recommendations">
                {recommended.map((item, index) => (
                  <article key={`${item.type}-${item.id}`} className="recommendation-card">
                    <img
                      src={item.image || RECOMMENDATION_IMAGES[index] || '/image1.png'}
                      alt={item.title}
                      className="recommendation-image"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/image2.png';
                      }}
                    />

                    <div className="recommendation-content">
                      <span className="recommendation-type">{item.type}</span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>

                      <NavLink to={item.to} className="btn-primary">
                        {t.start}
                      </NavLink>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
