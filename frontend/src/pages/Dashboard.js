import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { NavLink } from 'react-router-dom';
import { db } from '../firebase/config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { calculateWeeklyProgress, calculateMonthlyProgress, calculateCategoryProgress } from '../utils/progressUtils';
import { getRecommendedContent } from '../utils/recommendationUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('week');
  const [stats, setStats] = useState({
    coursesCompleted: 0,
    quizzesTaken: 0,
    flashcardsMastered: 0,
    videosWatched: 0,
    studyHours: 0,
  });
  const [progress, setProgress] = useState({
    weekly: [],
    monthly: [],
    categories: { anatomy: 0, physiology: 0, pharmacology: 0 },
  });
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchDashboardData = async () => {
        try {
          // Fetch user stats and progress from Firestore
          const userDoc = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setStats(userData.stats || { coursesCompleted: 0, quizzesTaken: 0, flashcardsMastered: 0, videosWatched: 0, studyHours: 0 });

            // Calculate dynamic progress based on user activity
            const weeklyProgress = calculateWeeklyProgress(userData.activity || []);
            const monthlyProgress = calculateMonthlyProgress(userData.activity || []);
            const categoryProgress = calculateCategoryProgress(userData.activity || []);

            setProgress({
              weekly: weeklyProgress,
              monthly: monthlyProgress,
              categories: categoryProgress,
            });

            // Fetch recommended content based on user progress and preferences
            const recs = await getRecommendedContent(user.uid, userData.preferences || {});
            setRecommended(recs);
          }
        } catch (error) {
          console.error('Erreur Firestore:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchDashboardData();
    }
  }, [user]);

  // Update progress data when time filter changes
  useEffect(() => {
    if (user) {
      const fetchFilteredProgress = async () => {
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const activity = userData.activity || [];
          setProgress((prev) => ({
            ...prev,
            weekly: calculateWeeklyProgress(activity),
            monthly: calculateMonthlyProgress(activity),
          }));
        }
      };
      fetchFilteredProgress();
    }
  }, [timeFilter, user]);

  const barData = {
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
        label: language === 'fr' ? 'Heures d’étude' : 'ساعات الدراسة',
        data: timeFilter === 'week' ? progress.weekly : progress.monthly,
        backgroundColor: '#2563eb',
        borderRadius: 4,
      },
    ],
  };

  const doughnutData = {
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
        backgroundColor: ['#2563eb', '#60a5fa', '#bfdbfe'],
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: language === 'fr' ? 'Heures' : 'ساعات' } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: { callbacks: { label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw}%` } },
    },
  };

  if (loading) {
    return <div className="loading-spinner" />;
  }

  return (
    <div className="page-container">
      <h2 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Tableau de bord' : 'لوحة التحكم'}
      </h2>
      <p className="text-lg text-gray-600 mb-6">
        {language === 'fr'
          ? `Bienvenue, ${user?.displayName || 'Utilisateur'} ! Voici vos progrès.`
          : `مرحبًا، ${user?.displayName || 'المستخدم'} ! إليك تقدمك.`}
      </p>

      {/* Statistiques */}
      <div className="features-grid mb-8">
        <div className="dashboard-stat">
          <h3 className="text-xl font-semibold">
            {language === 'fr' ? 'Cours terminés' : 'الدورات المكتملة'}
          </h3>
          <p className="text-2xl text-blue-600">{stats.coursesCompleted}</p>
        </div>
        <div className="dashboard-stat">
          <h3 className="text-xl font-semibold">
            {language === 'fr' ? 'Quiz passés' : 'الاختبارات المجتازة'}
          </h3>
          <p className="text-2xl text-blue-600">{stats.quizzesTaken}</p>
        </div>
        <div className="dashboard-stat">
          <h3 className="text-xl font-semibold">
            {language === 'fr' ? 'Flashcards maîtrisées' : 'البطاقات المتقنة'}
          </h3>
          <p className="text-2xl text-blue-600">{stats.flashcardsMastered}</p>
        </div>
        <div className="dashboard-stat">
          <h3 className="text-xl font-semibold">
            {language === 'fr' ? 'Vidéos regardées' : 'الفيديوهات المشاهدة'}
          </h3>
          <p className="text-2xl text-blue-600">{stats.videosWatched}</p>
        </div>
      </div>

      {/* Filtres temporels */}
      <div className="time-filter mb-4">
        <button
          className={`category-button ${timeFilter === 'week' ? 'active' : ''}`}
          onClick={() => setTimeFilter('week')}
        >
          {language === 'fr' ? 'Semaine' : 'أسبوع'}
        </button>
        <button
          className={`category-button ${timeFilter === 'month' ? 'active' : ''}`}
          onClick={() => setTimeFilter('month')}
        >
          {language === 'fr' ? 'Mois' : 'شهر'}
        </button>
      </div>

      {/* Graphiques */}
      <div className="dashboard-charts mb-8">
        <div className="chart-container">
          <h3 className="text-xl font-semibold mb-4">
            {language === 'fr' ? 'Progression' : 'التقدم'}
            {timeFilter === 'week'
              ? language === 'fr' ? ' hebdomadaire' : ' الأسبوعي'
              : language === 'fr' ? ' mensuelle' : ' الشهري'}
          </h3>
          <Bar data={barData} options={barOptions} />
        </div>
        <div className="chart-container">
          <h3 className="text-xl font-semibold mb-4">
            {language === 'fr' ? 'Répartition par catégorie' : 'التوزيع حسب الفئة'}
          </h3>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      {/* Recommandations */}
      <h3 className="text-xl font-semibold mb-4">
        {language === 'fr' ? 'Recommandations pour vous' : 'توصيات لك'}
      </h3>
      <div className="features-grid">
        {recommended.map((item) => (
          <div key={`${item.type}-${item.id}`} className="recommendation-card">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="recommendation-image"
              loading="lazy"
              onError={(e) => { e.target.src = '/default-thumbnail.jpg'; }}
            />
            <h4 className="text-lg font-semibold">{item.title}</h4>
            <p className="text-gray-600">{item.description}</p>
            <NavLink
              to={
                item.type === 'course'
                  ? `/courses/${item.id}`
                  : item.type === 'quiz'
                  ? `/quizzes/${item.id}`
                  : `/flashcards/${item.id}`
              }
              className="btn-primary mt-2"
            >
              {language === 'fr' ? 'Commencer' : 'ابدأ'}
            </NavLink>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;