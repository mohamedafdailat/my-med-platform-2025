// StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
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
import { NavLink } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend);

const Sidebar = ({ language }) => {
  const sidebarItems = [
    { path: '/dashboard', label: language === 'fr' ? 'Tableau de bord' : 'لوحة التحكم' },
    { path: '/courses', label: language === 'fr' ? 'Cours' : 'الدورات' },
    { path: '/quizzes', label: language === 'fr' ? 'Quiz' : 'الاختبارات' },
    { path: '/flashcards', label: language === 'fr' ? 'Cartes mémoire' : 'البطاقات' },
  ];

  return (
    <div className="sidebar">
      <h3 className="sidebar-title">
        {language === 'fr' ? 'Menu' : 'قائمة'}
      </h3>
      <nav>
        {sidebarItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

const StudentDashboard = () => {
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
    weekly: [0, 0, 0, 0, 0],
    monthly: [0, 0, 0, 0],
    categories: { anatomy: 0, physiology: 0, pharmacology: 0 },
  });
  const [evolutionData, setEvolutionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchData = async () => {
      if (!user?.uid) {
        if (isMounted) {
          setError('Utilisateur non authentifié');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);

        if (isMounted) {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userStats = data.stats || {};
            setStats({
              coursesCompleted: userStats.coursesCompleted || 0,
              quizzesTaken: userStats.quizzesTaken || 0,
              flashcardsMastered: userStats.flashcardsMastered || 0,
              videosWatched: userStats.videosWatched || 0,
              studyHours: userStats.studyHours || 0,
            });

            const userProgress = data.progress || {};
            setProgress({
              weekly: userProgress.weekly || [0, 0, 0, 0, 0],
              monthly: userProgress.monthly || [0, 0, 0, 0],
              categories: {
                anatomy: userProgress.categories?.anatomy || 0,
                physiology: userProgress.categories?.physiology || 0,
                pharmacology: userProgress.categories?.pharmacology || 0,
              },
            });
          } else {
            setError('Document utilisateur non trouvé');
            return;
          }
        }

        const evolutionRef = collection(db, 'userProgress', user.uid, 'history');
        const q = query(evolutionRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        if (isMounted) {
          if (querySnapshot.empty) {
            setEvolutionData([]);
          } else {
            const history = querySnapshot.docs.map(doc => {
              const docData = doc.data();
              let dateStr = 'Date inconnue';
              if (docData.timestamp) {
                if (typeof docData.timestamp.toDate === 'function') {
                  dateStr = docData.timestamp.toDate().toLocaleDateString();
                } else if (docData.timestamp instanceof Date) {
                  dateStr = docData.timestamp.toLocaleDateString();
                } else if (typeof docData.timestamp === 'string') {
                  dateStr = new Date(docData.timestamp).toLocaleDateString();
                }
              }
              return {
                date: dateStr,
                coursesCompleted: docData.coursesCompleted || 0,
                quizzesTaken: docData.quizzesTaken || 0,
                studyHours: docData.studyHours || 0,
              };
            });
            setEvolutionData(history.slice(0, 10));
          }
        }
      } catch (error) {
        if (isMounted) {
          let errorMsg = 'Une erreur est survenue lors du chargement des données.';
          if (error.code === 'permission-denied') {
            errorMsg = 'Permissions insuffisantes pour accéder aux données.';
          } else if (error.code === 'unavailable') {
            errorMsg = 'Service temporairement indisponible. Veuillez réessayer.';
          }
          setError(errorMsg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
        label: language === 'fr' ? 'Heures d\'étude' : 'ساعات الدراسة',
        data: timeFilter === 'week' ? progress.weekly : progress.monthly,
        backgroundColor: '#2563eb',
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
          progress.categories?.anatomy || 0,
          progress.categories?.physiology || 0,
          progress.categories?.pharmacology || 0,
        ],
        backgroundColor: ['#2563eb', '#60a5fa', '#bfdbfe'],
      },
    ],
  };

  const evolutionLineData = {
    labels: evolutionData.map(item => item.date),
    datasets: [
      {
        label: language === 'fr' ? 'Cours terminés' : 'الدورات المكتملة',
        data: evolutionData.map(item => item.coursesCompleted),
        borderColor: '#2563eb',
        fill: false,
      },
      {
        label: language === 'fr' ? 'Quiz passés' : 'الاختبارات المجتازة',
        data: evolutionData.map(item => item.quizzesTaken),
        borderColor: '#60a5fa',
        fill: false,
      },
      {
        label: language === 'fr' ? 'Heures d\'étude' : 'ساعات الدراسة',
        data: evolutionData.map(item => item.studyHours),
        borderColor: '#bfdbfe',
        fill: false,
      },
    ],
  };

  const recommended = [
    {
      id: 1,
      type: 'course',
      title: language === 'fr' ? 'Cours : Anatomie avancée' : 'دورة: التشريح المتقدم',
      description: language === 'fr' ? 'Approfondissez vos connaissances en anatomie.' : 'تعمق في معرفتك بالتشريح.',
      thumbnail: 'https://www.docdeclic.fr/uploads/1587477264_3ea943e53a43e6383b3e.png',
    },
    {
      id: 2,
      type: 'quiz',
      title: language === 'fr' ? 'Quiz : Pharmacologie' : 'اختبار: علم الصيدلة',
      description: language === 'fr' ? 'Testez vos connaissances sur les médicaments.' : 'اختبر معرفتك بالأدوية.',
      thumbnail: 'https://s1.studylibfr.com/store/data/003860148_1-191dfeecf95f96625f28d673088726f2.png',
    },
    {
      id: 3,
      type: 'flashcard',
      title: language === 'fr' ? 'Deck : Termes d\'anatomie' : 'مجموعة: مصطلحات التشريح',
      description: language === 'fr' ? 'Apprenez les termes clés d\'anatomie.' : 'تعلم مصطلحات التشريح الرئيسية.',
      thumbnail: 'https://cdn.slidesharecdn.com/ss_thumbnails/lesantibiotiquesi-171209223412-thumbnail.jpg?width=640&height=640&fit=bounds',
    },
  ];

  if (loading) {
    return <div className="text-center">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <h2>Erreur</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar language={language} />
      <div className="main-content-area">
        <div className="page-container">
          <h2 className="text-3xl font-bold mb-6">
            {language === 'fr' ? 'Tableau de bord Étudiant' : 'لوحة التحكم الطالب'}
          </h2>
          <p className="text-lg text-gray-500 mb-6">
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
              <p className="text-2xl text-blue-900">{stats.coursesCompleted}</p>
            </div>
            <div className="dashboard-stat">
              <h3 className="text-xl font-semibold">
                {language === 'fr' ? 'Quiz passés' : 'الاختبارات المجتازة'}
              </h3>
              <p className="text-2xl text-blue-900">{stats.quizzesTaken}</p>
            </div>
            <div className="dashboard-stat">
              <h3 className="text-xl font-semibold">
                {language === 'fr' ? 'Flashcards maîtrisées' : 'البطاقات المتقنة'}
              </h3>
              <p className="text-2xl text-blue-900">{stats.flashcardsMastered}</p>
            </div>
            <div className="dashboard-stat">
              <h3 className="text-xl font-semibold">
                {language === 'fr' ? 'Vidéos regardées' : 'الفيديوهات المشاهدة'}
              </h3>
              <p className="text-2xl text-blue-900">{stats.videosWatched}</p>
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
                {language === 'fr' ? 'Progression'
                  : 'التقدم'}
                {timeFilter === 'week'
                  ? language === 'fr' ? ' hebdomadaire' : ' الأسبوعي'
                  : language === 'fr' ? ' mensuelle' : ' الشهري'}
              </h3>
              <Bar data={barData} options={{ responsive: true }} />
            </div>
            <div className="chart-container">
              <h3 className="text-xl font-semibold mb-4">
                {language === 'fr' ? 'Répartition par catégorie' : 'التوزيع حسب الفئة'}
              </h3>
              <Doughnut data={doughnutData} options={{ responsive: true }} />
            </div>
          </div>

          {/* Evolution Dashboard */}
          <h3 className="text-xl font-semibold mb-4">
            {language === 'fr' ? 'Évolution de vos progrès' : 'تطور تقدمك'}
          </h3>
          <div className="evolution-dashboard mb-8">
            <Line data={evolutionLineData} options={{ responsive: true, maintainAspectRatio: false }} />
            <div className="mt-4 text-sm text-gray-500">
              {language === 'fr' ? 'Historique des 10 derniers jours' : 'تاريخ آخر 10 أيام'}
            </div>
          </div>

          {/* Recommandations */}
          <h3 className="text-xl font-semibold mb-4">
            {language === 'fr' ? 'Recommandations pour vous' : 'توصيات لك'}
          </h3>
          <div className="features-grid">
            {recommended.map((item) => (
              <div key={`${item.type}-${item.id}`} className="recommendation-card">
                <img src={item.thumbnail} alt={item.title} className="recommendation-image" loading="lazy" />
                <h4 className="text-lg font-semibold">{item.title}</h4>
                <p className="text-gray-500">{item.description}</p>
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
      </div>
    </div>
  );
};

export default StudentDashboard;