// C:\my-med-platform\frontend\src\pages\AdminDashboard.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle,
  CreditCard,
  FileQuestion,
  LayoutDashboard,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AdminDashboard = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [statsData, setStatsData] = useState({
    users: 0,
    paidUsers: 0,
    videos: 0,
    courses: 0,
    qcms: 0,
    flashcards: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  const t = useMemo(
    () =>
      ({
        fr: {
          title: 'Tableau de bord Admin',
          subtitle:
            'Gérez les contenus, les utilisateurs, les vidéos, les cours, les quiz et les ressources pédagogiques de MedPlatform Maroc.',
          welcome: 'Espace administrateur',
          quickActions: 'Actions rapides',
          overview: 'Vue d’ensemble',
          contentManagement: 'Gestion du contenu',
          usersAndAccess: 'Utilisateurs & accès',
          platform: 'Plateforme',
          addVideo: 'Ajouter une vidéo',
          addVideoDesc: 'Importer une vidéo locale ou ajouter un lien YouTube.',
          manageVideos: 'Gérer les vidéos',
          manageVideosDesc: 'Consulter, désactiver ou supprimer les vidéos publiées.',
          manageUsers: 'Gérer les utilisateurs',
          manageUsersDesc: 'Modifier les rôles, les statuts et les abonnements.',
          manageQcms: 'Gérer les QCM',
          manageQcmsDesc: 'Créer, importer, modifier ou supprimer les évaluations.',
          manageCourses: 'Gérer les cours',
          manageCoursesDesc: 'Ajouter des cours, PDF, modules et catégories.',
          flashcards: 'Flashcards',
          flashcardsDesc: 'Créer ou superviser les cartes de révision.',
          settings: 'Paramètres',
          settingsDesc: 'Configurer les options générales de la plateforme.',
          statsUsers: 'Utilisateurs',
          statsPaidUsers: 'Abonnés payants',
          statsVideos: 'Vidéos',
          statsCourses: 'Cours',
          statsQuizzes: 'QCM',
          statsFlashcards: 'Flashcards',
          activeContent: 'Contenu actif',
          refresh: 'Actualiser',
          loading: 'Chargement...',
          open: 'Ouvrir',
          secureNotice:
            'Important : l’interface admin doit être protégée dans les routes React, mais aussi dans les règles Firestore et Storage.',
          statsError:
            'Impossible de charger certaines statistiques. Vérifiez la connexion Firebase ou les règles Firestore.',
          adminTipTitle: 'Conseil admin',
          adminTip:
            'Avant de publier un contenu, vérifiez le titre FR/AR, la catégorie, le statut actif et la visibilité côté étudiant.',
          lastUpdate: 'Dernière actualisation',
        },
        ar: {
          title: 'لوحة التحكم الإدارية',
          subtitle:
            'إدارة المحتوى والمستخدمين والفيديوهات والدروس والاختبارات والموارد التعليمية في MedPlatform Maroc.',
          welcome: 'مساحة الإدارة',
          quickActions: 'إجراءات سريعة',
          overview: 'نظرة عامة',
          contentManagement: 'إدارة المحتوى',
          usersAndAccess: 'المستخدمون والصلاحيات',
          platform: 'المنصة',
          addVideo: 'إضافة فيديو',
          addVideoDesc: 'رفع فيديو محلي أو إضافة رابط YouTube.',
          manageVideos: 'إدارة الفيديوهات',
          manageVideosDesc: 'عرض أو تعطيل أو حذف الفيديوهات المنشورة.',
          manageUsers: 'إدارة المستخدمين',
          manageUsersDesc: 'تعديل الأدوار والحالات والاشتراكات.',
          manageQcms: 'إدارة الاختبارات',
          manageQcmsDesc: 'إنشاء أو استيراد أو تعديل أو حذف الاختبارات.',
          manageCourses: 'إدارة الدروس',
          manageCoursesDesc: 'إضافة الدروس وملفات PDF والوحدات والفئات.',
          flashcards: 'البطاقات التعليمية',
          flashcardsDesc: 'إنشاء أو متابعة بطاقات المراجعة.',
          settings: 'الإعدادات',
          settingsDesc: 'تكوين الخيارات العامة للمنصة.',
          statsUsers: 'المستخدمون',
          statsPaidUsers: 'المشتركون',
          statsVideos: 'الفيديوهات',
          statsCourses: 'الدروس',
          statsQuizzes: 'الاختبارات',
          statsFlashcards: 'البطاقات',
          activeContent: 'المحتوى النشط',
          refresh: 'تحديث',
          loading: 'جاري التحميل...',
          open: 'فتح',
          secureNotice:
            'مهم: يجب حماية واجهة الإدارة في مسارات React وكذلك في قواعد Firestore و Storage.',
          statsError:
            'تعذر تحميل بعض الإحصائيات. تحقق من اتصال Firebase أو قواعد Firestore.',
          adminTipTitle: 'نصيحة للإدارة',
          adminTip:
            'قبل نشر أي محتوى، تحقق من العنوان بالفرنسية والعربية، والفئة، والحالة النشطة، والظهور للطالب.',
          lastUpdate: 'آخر تحديث',
        },
      }[language] || {}),
    [language]
  );

  const [lastUpdated, setLastUpdated] = useState('');

  const countCollection = async (collectionName, filterActive = false) => {
    try {
      const ref = collection(db, collectionName);
      const q = filterActive ? query(ref, where('status', '==', 'active')) : ref;
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (err) {
      console.error(`Erreur stats ${collectionName}:`, err);
      return null;
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      setError('');

      const [
        usersCount,
        paidUsersCount,
        videosCount,
        coursesCount,
        qcmsCount,
        flashcardsCount,
      ] = await Promise.all([
        countCollection('users'),
        getDocs(query(collection(db, 'users'), where('subscriptionStatus', '==', 'paid')))
          .then((snap) => snap.size)
          .catch((err) => {
            console.error('Erreur stats paid users:', err);
            return null;
          }),
        countCollection('videos', true),
        countCollection('courses', true),
        countCollection('qcms', true),
        countCollection('flashcards', true),
      ]);

      const hasError = [
        usersCount,
        paidUsersCount,
        videosCount,
        coursesCount,
        qcmsCount,
        flashcardsCount,
      ].some((value) => value === null);

      if (hasError) {
        setError(t.statsError);
      }

      setStatsData({
        users: usersCount ?? 0,
        paidUsers: paidUsersCount ?? 0,
        videos: videosCount ?? 0,
        courses: coursesCount ?? 0,
        qcms: qcmsCount ?? 0,
        flashcards: flashcardsCount ?? 0,
      });

      const now = new Date();
      setLastUpdated(
        language === 'fr'
          ? now.toLocaleString('fr-FR')
          : now.toLocaleString('ar-MA')
      );
    } catch (err) {
      console.error('Erreur globale fetchStats:', err);
      setError(t.statsError);
    } finally {
      setLoadingStats(false);
    }
  }, [language, t.statsError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const stats = useMemo(
    () => [
      {
        label: t.statsUsers,
        value: statsData.users,
        icon: Users,
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-100',
      },
      {
        label: t.statsPaidUsers,
        value: statsData.paidUsers,
        icon: CreditCard,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-100',
      },
      {
        label: t.statsVideos,
        value: statsData.videos,
        icon: Video,
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-100',
      },
      {
        label: t.statsCourses,
        value: statsData.courses,
        icon: BookOpen,
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-100',
      },
      {
        label: t.statsQuizzes,
        value: statsData.qcms,
        icon: FileQuestion,
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-100',
      },
      {
        label: t.statsFlashcards,
        value: statsData.flashcards,
        icon: Brain,
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-100',
      },
    ],
    [statsData, t]
  );

  const adminCards = useMemo(
    () => [
      {
        section: t.quickActions,
        items: [
          {
            title: t.addVideo,
            description: t.addVideoDesc,
            to: '/admin/add-video',
            icon: PlusCircle,
            color: 'from-blue-600 to-indigo-700',
            badge: '+',
          },
          {
            title: t.manageVideos,
            description: t.manageVideosDesc,
            to: '/admin/videos',
            icon: Video,
            color: 'from-purple-600 to-fuchsia-700',
            badge: statsData.videos,
          },
        ],
      },
      {
        section: t.contentManagement,
        items: [
          {
            title: t.manageCourses,
            description: t.manageCoursesDesc,
            to: '/admin/courses',
            icon: BookOpen,
            color: 'from-green-600 to-emerald-700',
            badge: statsData.courses,
          },
          {
            title: t.manageQcms,
            description: t.manageQcmsDesc,
            to: '/admin/qcms',
            icon: FileQuestion,
            color: 'from-yellow-500 to-orange-600',
            badge: statsData.qcms,
          },
          {
            title: t.flashcards,
            description: t.flashcardsDesc,
            to: '/admin/flashcards',
            icon: Brain,
            color: 'from-cyan-600 to-blue-700',
            badge: statsData.flashcards,
          },
          {
            title: language === 'fr' ? 'Bibliothèque des flashcards' : 'مكتبة البطاقات',
            description: language === 'fr' ? 'Consulter les decks personnels et gérer les contenus partagés.' : 'عرض المجموعات الشخصية وإدارة المحتوى المشترك.',
            to: '/flashcards',
            icon: Brain,
            color: 'from-cyan-600 to-blue-700',
          },
          {
            title: language === 'fr' ? 'Bibliothèque des quiz' : 'مكتبة الاختبارات',
            description: language === 'fr' ? 'Consulter les quiz et gérer leur visibilité.' : 'عرض الاختبارات وإدارة ظهورها.',
            to: '/quizzes',
            icon: FileQuestion,
            color: 'from-yellow-500 to-orange-600',
          },
        ],
      },
      {
        section: t.usersAndAccess,
        items: [
          {
            title: t.manageUsers,
            description: t.manageUsersDesc,
            to: '/admin/users',
            icon: Users,
            color: 'from-rose-600 to-red-700',
            badge: statsData.users,
          },
          {
            title: t.settings,
            description: t.settingsDesc,
            to: '/settings',
            icon: Settings,
            color: 'from-gray-700 to-slate-900',
            badge: '⚙',
          },
        ],
      },
    ],
    [statsData, t, language]
  );

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 to-indigo-50 px-4 py-10 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <header className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-700 p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                {t.welcome}
              </div>

              <h1 className="flex items-center gap-3 text-3xl font-bold md:text-5xl">
                <LayoutDashboard className="h-9 w-9" />
                {t.title}
              </h1>

              <p className="mt-4 max-w-3xl text-blue-100">
                {t.subtitle}
              </p>

              {lastUpdated && (
                <p className="mt-4 text-sm text-blue-100/80">
                  {t.lastUpdate} : {lastUpdated}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4 md:items-end">
              <div className="hidden rounded-3xl bg-white/10 p-6 backdrop-blur md:block">
                <BarChart3 className="h-20 w-20 text-white/80" />
              </div>

              <button
                onClick={fetchStats}
                disabled={loadingStats}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCcw className="h-5 w-5" />
                )}
                {t.refresh}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <section className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </section>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className={`rounded-3xl border ${stat.border} bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.label}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {loadingStats ? (
                        <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-gray-200" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>

                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.bg}`}
                  >
                    <Icon className={`h-7 w-7 ${stat.text}`} />
                  </div>
                </div>

                <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t.activeContent}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-blue-800">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{t.secureNotice}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-green-100 bg-green-50 p-5 text-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">{t.adminTipTitle}</p>
                <p className="mt-1 text-sm font-medium">{t.adminTip}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-10">
          {adminCards.map((group) => (
            <section key={group.section}>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                {group.section}
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className={`h-2 bg-gradient-to-r ${item.color}`} />

                      <div className="p-6">
                        <div className="mb-5 flex items-start justify-between">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r ${item.color} text-white shadow-lg`}
                          >
                            <Icon className="h-7 w-7" />
                          </div>

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
                            {loadingStats && typeof item.badge === 'number'
                              ? '...'
                              : item.badge}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900">
                          {item.title}
                        </h3>

                        <p className="mt-2 min-h-[48px] text-sm leading-relaxed text-gray-500">
                          {item.description}
                        </p>

                        <div className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-700">
                          {t.open}
                          <ArrowRight
                            className={`h-4 w-4 transition group-hover:translate-x-1 ${
                              isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
