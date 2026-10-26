import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  GraduationCap,
  Layers,
  Play,
  PlayCircle,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import {
  getOwnQuizAttempts,
  getVisibleDocuments,
} from "../services/contentService";
import { hasAdminAccess } from "../utils/access";
import "../styles/student-dashboard.css";

const TEXT = {
  fr: {
    space: "Espace étudiant",
    dashboard: "Vue d’ensemble",
    courses: "Cours",
    videos: "Vidéos",
    quizzes: "Quiz",
    flashcards: "Flashcards",
    profile: "Mon profil",
    navigation: "Navigation étudiant",
    eyebrow: "VOTRE RENDEZ-VOUS AVEC LE SAVOIR",
    hello: "Bonjour",
    student: "à vous",
    title: "Un peu chaque jour.",
    titleAccent: "Beaucoup plus loin.",
    subtitle:
      "Comprendre, s’entraîner, mémoriser. Retrouvez vos ressources et construisez votre propre rythme de révision.",
    semester: "Semestre",
    chooseSemester: "Renseigner mon semestre",
    unlimited: "Accès illimité",
    active: "Abonnement actif",
    inactive: "Découvrir les abonnements",
    start: "Continuer à apprendre",
    nextStep: "VOTRE PROCHAINE ÉTAPE",
    nextTitle: "Faites place à une nouvelle idée.",
    nextDescription:
      "Un cours pour comprendre, un quiz pour vous challenger : à vous de choisir.",
    explore: "Explorer les cours",
    openResource: "Découvrir cette ressource",
    completedCourses: "Cours terminés",
    recordedQuizzes: "Quiz effectués",
    masteredCards: "Cartes maîtrisées",
    watchedVideos: "Vidéos regardées",
    recorded: "Enregistrés sur votre compte",
    notRecorded: "Pas encore de donnée",
    overview: "Vos repères",
    overviewNote: "Votre apprentissage, à votre rythme.",
    actionsTitle: "Et si on avançait aujourd’hui ?",
    actionsSubtitle: "Choisissez votre façon d’apprendre.",
    courseAction: "Comprendre",
    courseDescription: "Explorez les notions et faites le lien avec vos cours.",
    videoAction: "Visualiser",
    videoDescription: "Donnez vie aux notions avec les vidéos pédagogiques.",
    quizAction: "Vous challenger",
    quizDescription: "Testez vos acquis et repérez les notions à revoir.",
    cardAction: "Mémoriser",
    cardDescription: "Réactivez les notions clés avec les flashcards.",
    activity: "Votre rythme de révision",
    activitySubtitle: "Les quiz que vous avez réellement effectués.",
    days7: "7 jours",
    days30: "30 jours",
    periodLabel: "Période des activités",
    attemptsInPeriod: "quiz sur cette période",
    activityCaption: "Nombre de tentatives de quiz par jour",
    dataTable: "Voir les données du graphique",
    date: "Date",
    count: "Quiz effectués",
    noActivity: "Votre prochain quiz est un bon début.",
    noActivityDescription:
      "Vos tentatives apparaîtront ici après un quiz. Chaque session compte, même la première.",
    noPeriodActivity: "Une nouvelle session, à votre rythme.",
    noPeriodActivityDescription:
      "Aucun quiz daté sur cette période. Retrouvez vos résultats précédents dans vos derniers quiz.",
    takeQuiz: "Choisir un quiz",
    activityUnavailable: "Votre activité est indisponible pour le moment.",
    recommendations: "À explorer ensuite",
    recommendationsSubtitle:
      "Une sélection parmi les ressources de votre espace.",
    allCourses: "Tous les cours",
    noResources: "Votre prochain chapitre vous attend.",
    noResourcesDescription:
      "Retrouvez les ressources disponibles dans les cours, les vidéos et les quiz.",
    resourcesUnavailable: "La sélection de ressources n’a pas pu être chargée.",
    courseFallback: "Un cours à découvrir",
    quizFallback: "Un quiz à découvrir",
    courseFallbackDescription:
      "Prenez le temps de comprendre les notions, étape par étape.",
    quizFallbackDescription:
      "Mettez vos connaissances en pratique avec ce quiz.",
    recent: "Vos derniers quiz",
    recentEmpty: "Vos quiz terminés apparaîtront ici.",
    result: "Résultat",
    unknownDate: "Date non renseignée",
    method: "Un rythme qui vous ressemble",
    methodIntro: "Trois façons de faire avancer vos révisions.",
    method1: "Comprenez une notion",
    method2: "Testez ce que vous avez retenu",
    method3: "Réactivez vos connaissances",
    studyHours: "Heures d’étude enregistrées",
    loading: "Chargement de votre espace…",
    partialError:
      "Certaines données n’ont pas pu être actualisées. Les autres éléments restent disponibles.",
    profileError:
      "Votre profil n’a pas pu être chargé. Réessayez dans quelques instants.",
    retry: "Actualiser",
    subscriptionTitle: "Préparez la suite de votre parcours",
    subscriptionDescription:
      "Découvrez les abonnements pour accéder aux cours, vidéos, quiz et flashcards.",
    periodTotal: "Total de la période",
  },
  ar: {
    space: "فضاء الطالب",
    dashboard: "نظرة عامة",
    courses: "الدروس",
    videos: "الفيديوهات",
    quizzes: "الاختبارات",
    flashcards: "البطاقات",
    profile: "ملفي الشخصي",
    navigation: "تنقل الطالب",
    eyebrow: "موعدك مع المعرفة",
    hello: "مرحباً",
    student: "بك",
    title: "خطوة صغيرة كل يوم.",
    titleAccent: "تقدّم أكبر في رحلتك.",
    subtitle:
      "افهم وتدرّب وتذكّر. اكتشف مواردك وابنِ وتيرة المراجعة التي تناسبك.",
    semester: "الفصل الدراسي",
    chooseSemester: "تحديد فصلي الدراسي",
    unlimited: "وصول غير محدود",
    active: "اشتراك مفعّل",
    inactive: "اكتشف الاشتراكات",
    start: "واصل التعلّم",
    nextStep: "خطوتك التالية",
    nextTitle: "امنح فكرة جديدة مكاناً.",
    nextDescription: "درس للفهم واختبار للتدرّب: اختر ما يناسبك.",
    explore: "استكشف الدروس",
    openResource: "اكتشف هذا المورد",
    completedCourses: "الدروس المكتملة",
    recordedQuizzes: "الاختبارات المنجزة",
    masteredCards: "البطاقات المتقنة",
    watchedVideos: "الفيديوهات المشاهدة",
    recorded: "مسجّلة في حسابك",
    notRecorded: "لا توجد بيانات بعد",
    overview: "تقدّمك في لمحة",
    overviewNote: "تعلّم وفق وتيرتك الخاصة.",
    actionsTitle: "ما خطوتك اليوم؟",
    actionsSubtitle: "اختر طريقة التعلّم التي تناسبك.",
    courseAction: "افهم",
    courseDescription: "استكشف المفاهيم واربطها بدروسك.",
    videoAction: "شاهد",
    videoDescription: "اكتشف المفاهيم من خلال الفيديوهات التعليمية.",
    quizAction: "اختبر نفسك",
    quizDescription: "اختبر مكتسباتك وحدّد ما يحتاج إلى مراجعة.",
    cardAction: "تذكّر",
    cardDescription: "راجع المفاهيم الأساسية باستخدام البطاقات.",
    activity: "وتيرة مراجعاتك",
    activitySubtitle: "الاختبارات التي أنجزتها فعلياً.",
    days7: "٧ أيام",
    days30: "٣٠ يوماً",
    periodLabel: "فترة النشاط",
    attemptsInPeriod: "اختبار خلال هذه الفترة",
    activityCaption: "عدد محاولات الاختبارات في كل يوم",
    dataTable: "عرض بيانات الرسم",
    date: "التاريخ",
    count: "الاختبارات المنجزة",
    noActivity: "اختبارك القادم بداية جيدة.",
    noActivityDescription:
      "ستظهر محاولاتك هنا بعد إتمام اختبار. لكل جلسة قيمة، حتى الأولى.",
    noPeriodActivity: "جلسة جديدة وفق وتيرتك.",
    noPeriodActivityDescription:
      "لا توجد اختبارات مؤرّخة خلال هذه الفترة. تجد نتائجك السابقة في آخر اختباراتك.",
    takeQuiz: "اختر اختباراً",
    activityUnavailable: "نشاطك غير متاح في الوقت الحالي.",
    recommendations: "اكتشف خطوتك التالية",
    recommendationsSubtitle: "مجموعة مختارة من موارد فضائك.",
    allCourses: "جميع الدروس",
    noResources: "فصلك القادم بانتظارك.",
    noResourcesDescription:
      "اكتشف الموارد المتاحة في الدروس والفيديوهات والاختبارات.",
    resourcesUnavailable: "تعذّر تحميل مجموعة الموارد.",
    courseFallback: "درس للاكتشاف",
    quizFallback: "اختبار للاكتشاف",
    courseFallbackDescription: "افهم المفاهيم خطوة بخطوة.",
    quizFallbackDescription: "طبّق معارفك من خلال هذا الاختبار.",
    recent: "آخر اختباراتك",
    recentEmpty: "ستظهر اختباراتك المكتملة هنا.",
    result: "النتيجة",
    unknownDate: "التاريخ غير محدّد",
    method: "وتيرة تناسبك",
    methodIntro: "ثلاث خطوات لتطوير مراجعاتك.",
    method1: "افهم مفهوماً",
    method2: "اختبر ما تذكّرته",
    method3: "راجع معارفك",
    studyHours: "ساعات الدراسة المسجّلة",
    loading: "جارٍ تحميل فضائك…",
    partialError: "تعذّر تحديث بعض البيانات. تبقى العناصر الأخرى متاحة.",
    profileError: "تعذّر تحميل ملفك الشخصي. يرجى المحاولة بعد قليل.",
    retry: "تحديث",
    subscriptionTitle: "استعدّ للخطوة التالية في رحلتك",
    subscriptionDescription:
      "اكتشف الاشتراكات للوصول إلى الدروس والفيديوهات والاختبارات والبطاقات.",
    periodTotal: "مجموع الفترة",
  },
};

const NAVIGATION = [
  { to: "/dashboard", label: "dashboard", icon: BarChart3 },
  { to: "/courses", label: "courses", icon: BookOpen },
  { to: "/videos", label: "videos", icon: PlayCircle },
  { to: "/quizzes", label: "quizzes", icon: Brain },
  { to: "/flashcards", label: "flashcards", icon: Layers },
];

// Unknown tracking values must not be shown as measured zeroes.
const metric = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    typeof value === "boolean"
  )
    return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const asDate = (value) => {
  if (!value) return null;
  const date =
    typeof value.toDate === "function"
      ? value.toDate()
      : typeof value.seconds === "number"
        ? new Date(value.seconds * 1000)
        : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const localText = (value, language, fallback) => {
  if (typeof value === "string" && value.trim()) return value;
  for (const locale of [language, "fr", "ar"]) {
    if (typeof value?.[locale] === "string" && value[locale].trim())
      return value[locale];
  }
  return fallback;
};

const dayKey = (date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const DashboardSidebar = ({ t }) => (
  <aside className="sd-sidebar">
    <div className="sd-space-label">
      <span className="sd-brand-mark">
        <GraduationCap size={21} aria-hidden="true" />
      </span>
      {t.space}
    </div>
    <nav className="sd-navigation" aria-label={t.navigation}>
      {NAVIGATION.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/dashboard"}
          className={({ isActive }) =>
            `sd-nav-link${isActive ? " is-active" : ""}`
          }
        >
          <Icon size={19} aria-hidden="true" />
          <span>{t[label]}</span>
          <ChevronRight
            size={15}
            className="sd-nav-chevron sd-directional"
            aria-hidden="true"
          />
        </NavLink>
      ))}
    </nav>
    <NavLink to="/profile" className="sd-profile-link">
      <Settings2 size={18} aria-hidden="true" />
      {t.profile}
    </NavLink>
    <div className="sd-sidebar-note" aria-hidden="true">
      <span className="sd-small-orbit">
        <Sparkles size={21} />
      </span>
      <p>
        {t.title}
        <br />
        <strong>{t.titleAccent}</strong>
      </p>
    </div>
  </aside>
);

const StudentDashboard = () => {
  const { language } = useLanguage();
  const { user, loading: authLoading, profileError } = useAuth();
  const t = TEXT[language] || TEXT.fr;
  const locale = language === "ar" ? "ar-MA" : "fr-FR";
  const [period, setPeriod] = useState(7);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState({
    owner: null,
    accessKey: null,
    attempts: null,
    resources: [],
    failures: [],
    loading: true,
  });
  const uid = user?.uid;
  const role = user?.customClaims?.role;
  const adminAccessVersion = user?.customClaims?.adminAccessVersion;
  const administrator = hasAdminAccess(user?.customClaims);
  const unlimited = user?.customClaims?.unlimitedAccess === true;
  const canAccess =
    administrator || unlimited || user?.subscriptionStatus === "paid";
  const semester = user?.semester;
  const accessKey = JSON.stringify([
    uid,
    role,
    adminAccessVersion,
    unlimited,
    canAccess,
    semester,
  ]);

  useEffect(() => {
    if (authLoading || !uid) return undefined;
    let cancelled = false;
    setData({
      owner: uid,
      accessKey,
      attempts: null,
      resources: [],
      failures: [],
      loading: true,
    });
    const accessUser = {
      uid,
      semester,
      customClaims: { role, adminAccessVersion, unlimitedAccess: unlimited },
    };
    const load = async () => {
      // Failures stay independent: a failed catalog read cannot hide own activity.
      const results = await Promise.allSettled([
        getOwnQuizAttempts(uid),
        ...(canAccess
          ? [
              getVisibleDocuments("courses", accessUser),
              getVisibleDocuments("quizzes", accessUser),
            ]
          : []),
      ]);
      if (cancelled) return;
      const failures = [];
      let attempts = null;
      if (results[0].status === "fulfilled") {
        attempts = results[0].value
          .map((attempt) => ({
            ...attempt,
            date: asDate(attempt.completedAt),
            score: metric(attempt.score),
          }))
          .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
      } else failures.push("attempts");
      const resources = [];
      results.slice(1).forEach((result, index) => {
        if (result.status !== "fulfilled") {
          failures.push("resources");
          return;
        }
        const type = index === 0 ? "course" : "quiz";
        result.value
          .filter((snapshot) => snapshot.data().status !== "inactive")
          .slice(0, 3)
          .forEach((snapshot) => {
            resources.push({
              ...snapshot.data(),
              id: snapshot.id,
              type,
              to: `/${type === "course" ? "courses" : "quizzes"}/${encodeURIComponent(snapshot.id)}`,
            });
          });
      });
      const courses = resources.filter(
        (resource) => resource.type === "course",
      );
      const quizzes = resources.filter((resource) => resource.type === "quiz");
      const selection = Array.from({ length: 3 }, (_, index) => [
        courses[index],
        quizzes[index],
      ])
        .flat()
        .filter(Boolean)
        .slice(0, 3);
      setData({
        owner: uid,
        accessKey,
        attempts,
        resources: selection,
        failures,
        loading: false,
      });
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [
    uid,
    role,
    adminAccessVersion,
    unlimited,
    canAccess,
    semester,
    authLoading,
    refresh,
    accessKey,
  ]);

  // Prevent an old account or old entitlement's responses from appearing.
  const currentData =
    data.owner === uid && data.accessKey === accessKey
      ? data
      : { attempts: null, resources: [], failures: [], loading: true };
  const attempts = currentData.attempts;
  const resources = currentData.resources;
  const loading = authLoading || currentData.loading;
  const stats = user?.stats || {};
  const formatNumber = (value) =>
    value === null
      ? "—"
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
          value,
        );
  const formatDate = (date) =>
    date
      ? date.toLocaleDateString(locale, { day: "numeric", month: "short" })
      : t.unknownDate;
  const resourceTitle = (resource) =>
    localText(
      resource.title,
      language,
      resource.type === "course" ? t.courseFallback : t.quizFallback,
    );
  const name =
    typeof user?.displayName === "string"
      ? user.displayName.trim().split(/\s+/)[0] || t.student
      : t.student;
  const nextResource = resources[0];
  const statCards = [
    {
      key: "courses",
      title: t.completedCourses,
      value: metric(stats.coursesCompleted),
      icon: BookOpen,
    },
    {
      key: "quizzes",
      title: t.recordedQuizzes,
      value: attempts ? attempts.length : null,
      icon: Brain,
    },
    {
      key: "flashcards",
      title: t.masteredCards,
      value: metric(stats.flashcardsMastered),
      icon: Layers,
    },
    {
      key: "videos",
      title: t.watchedVideos,
      value: metric(stats.videosWatched),
      icon: PlayCircle,
    },
  ];
  const actions = [
    {
      to: "/courses",
      title: t.courseAction,
      type: t.courses,
      description: t.courseDescription,
      icon: BookOpen,
      color: "blue",
    },
    {
      to: "/videos",
      title: t.videoAction,
      type: t.videos,
      description: t.videoDescription,
      icon: Play,
      color: "violet",
    },
    {
      to: "/quizzes",
      title: t.quizAction,
      type: t.quizzes,
      description: t.quizDescription,
      icon: Brain,
      color: "teal",
    },
    {
      to: "/flashcards",
      title: t.cardAction,
      type: t.flashcards,
      description: t.cardDescription,
      icon: Layers,
      color: "amber",
    },
  ];

  const activity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const counts = new Map();
    (attempts || []).forEach((attempt) => {
      if (attempt.date)
        counts.set(
          dayKey(attempt.date),
          (counts.get(dayKey(attempt.date)) || 0) + 1,
        );
    });
    return Array.from({ length: period }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - period + index + 1);
      return { date, count: counts.get(dayKey(date)) || 0 };
    });
  }, [attempts, period]);
  const activityTotal = activity.reduce((total, day) => total + day.count, 0);
  const activityMax = Math.max(1, ...activity.map((day) => day.count));
  const hasError = profileError || currentData.failures.length > 0;

  return (
    <div
      className="student-space"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <div className="sd-layout">
        <DashboardSidebar t={t} />
        <div className="sd-content" aria-busy={loading}>
          <div className="sd-topline">
            <p>
              <span className="sd-greeting-dot" />
              {t.hello},
              <strong>
                <bdi>{name}</bdi>
              </strong>
            </p>
            <span>
              <GraduationCap size={16} aria-hidden="true" />
              {t.space}
            </span>
          </div>
          <section className="sd-hero" aria-labelledby="sd-title">
            <div className="sd-hero-copy">
              <span className="sd-eyebrow">
                <Sparkles size={14} aria-hidden="true" />
                {t.eyebrow}
              </span>
              <h1 id="sd-title">
                {t.title}
                <span>{t.titleAccent}</span>
              </h1>
              <p>{t.subtitle}</p>
              <div className="sd-hero-actions">
                <NavLink
                  className="sd-button sd-button-light"
                  to={canAccess ? "/courses" : "/subscription"}
                >
                  {canAccess ? t.start : t.inactive}
                  <ArrowRight
                    size={17}
                    className="sd-directional"
                    aria-hidden="true"
                  />
                </NavLink>
                <NavLink className="sd-semester-link" to="/profile">
                  <GraduationCap size={17} aria-hidden="true" />
                  {semester
                    ? `${t.semester} ${String(semester).replace(/^S/i, "")}`
                    : t.chooseSemester}
                </NavLink>
              </div>
            </div>
            <div className="sd-next-card">
              <div className="sd-next-icon">
                <BookOpen size={24} aria-hidden="true" />
                <span aria-hidden="true">
                  <Sparkles size={13} />
                </span>
              </div>
              <span className="sd-next-label">{t.nextStep}</span>
              <h2>
                {nextResource ? resourceTitle(nextResource) : t.nextTitle}
              </h2>
              <p>
                {nextResource
                  ? localText(
                      nextResource.description,
                      language,
                      nextResource.type === "course"
                        ? t.courseFallbackDescription
                        : t.quizFallbackDescription,
                    )
                  : t.nextDescription}
              </p>
              <NavLink
                to={
                  canAccess ? nextResource?.to || "/courses" : "/subscription"
                }
              >
                {canAccess
                  ? nextResource
                    ? t.openResource
                    : t.explore
                  : t.inactive}
                <ArrowRight
                  size={16}
                  className="sd-directional"
                  aria-hidden="true"
                />
              </NavLink>
            </div>
          </section>
          {hasError && (
            <div className="sd-alert" role="alert">
              <ShieldCheck size={19} aria-hidden="true" />
              <p>{profileError ? t.profileError : t.partialError}</p>
              <button
                type="button"
                onClick={() =>
                  profileError
                    ? window.location.reload()
                    : setRefresh((value) => value + 1)
                }
                disabled={loading}
              >
                <RefreshCw size={15} aria-hidden="true" />
                {t.retry}
              </button>
            </div>
          )}
          {loading && (
            <p className="sd-loading" role="status">
              <RefreshCw size={16} aria-hidden="true" />
              {t.loading}
            </p>
          )}
          <section className="sd-overview" aria-labelledby="sd-overview-title">
            <div className="sd-section-heading sd-heading-compact">
              <h2 id="sd-overview-title">{t.overview}</h2>
              <p>{t.overviewNote}</p>
            </div>
            <div className="sd-stat-grid">
              {statCards.map(({ key, title, value, icon: Icon }) => (
                <article className={`sd-stat sd-stat-${key}`} key={key}>
                  <span className="sd-stat-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="sd-stat-value">{formatNumber(value)}</span>
                  <h3>{title}</h3>
                  <p>{value === null ? t.notRecorded : t.recorded}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="sd-section" aria-labelledby="sd-actions-title">
            <div className="sd-section-heading">
              <div>
                <h2 id="sd-actions-title">{t.actionsTitle}</h2>
                <p>{t.actionsSubtitle}</p>
              </div>
            </div>
            <div className="sd-action-grid">
              {actions.map(
                ({ to, title, type, description, icon: Icon, color }) => (
                  <NavLink
                    className={`sd-action sd-action-${color}`}
                    to={to}
                    key={to}
                  >
                    <span className="sd-action-top">
                      <span className="sd-action-icon">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <ArrowRight
                        size={17}
                        className="sd-action-arrow sd-directional"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="sd-action-type">{type}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </NavLink>
                ),
              )}
            </div>
          </section>
          <div className="sd-lower-grid">
            <div className="sd-main-column">
              <section
                className="sd-panel sd-activity-panel"
                aria-labelledby="sd-activity-title"
              >
                <div className="sd-section-heading">
                  <div>
                    <h2 id="sd-activity-title">
                      <Activity size={19} aria-hidden="true" />
                      {t.activity}
                    </h2>
                    <p>{t.activitySubtitle}</p>
                  </div>
                  <div
                    className="sd-period"
                    role="group"
                    aria-label={t.periodLabel}
                  >
                    {[7, 30].map((days) => (
                      <button
                        type="button"
                        key={days}
                        aria-pressed={period === days}
                        onClick={() => setPeriod(days)}
                      >
                        {days === 7 ? t.days7 : t.days30}
                      </button>
                    ))}
                  </div>
                </div>
                {loading ? (
                  <div className="sd-chart-placeholder" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                ) : attempts === null ? (
                  <div className="sd-empty">
                    <Activity size={27} aria-hidden="true" />
                    <h3>{t.activityUnavailable}</h3>
                    <button
                      className="sd-text-button"
                      type="button"
                      onClick={() => setRefresh((value) => value + 1)}
                    >
                      {t.retry}
                      <RefreshCw size={14} aria-hidden="true" />
                    </button>
                  </div>
                ) : activityTotal === 0 ? (
                  <div className="sd-empty">
                    <span className="sd-empty-symbol">
                      <BarChart3 size={29} aria-hidden="true" />
                    </span>
                    <h3>
                      {attempts.length ? t.noPeriodActivity : t.noActivity}
                    </h3>
                    <p>
                      {attempts.length
                        ? t.noPeriodActivityDescription
                        : t.noActivityDescription}
                    </p>
                    <NavLink
                      className="sd-button sd-button-primary"
                      to="/quizzes"
                    >
                      {t.takeQuiz}
                      <ArrowRight
                        size={15}
                        className="sd-directional"
                        aria-hidden="true"
                      />
                    </NavLink>
                  </div>
                ) : (
                  <>
                    <div className="sd-activity-total">
                      <strong>{formatNumber(activityTotal)}</strong>
                      <span>{t.attemptsInPeriod}</span>
                    </div>
                    <div
                      className="sd-chart"
                      role="img"
                      aria-label={`${t.activityCaption}. ${t.periodTotal} : ${formatNumber(activityTotal)}`}
                    >
                      <div className="sd-chart-grid" aria-hidden="true">
                        <span>{formatNumber(activityMax)}</span>
                        <span>{formatNumber(0)}</span>
                      </div>
                      <div className="sd-chart-bars" aria-hidden="true">
                        {activity.map(({ date, count }, index) => (
                          <div
                            className={`sd-chart-column${count ? " has-value" : ""}`}
                            key={dayKey(date)}
                          >
                            <div className="sd-chart-track">
                              <span
                                title={`${formatDate(date)} : ${formatNumber(count)}`}
                                style={{
                                  height: `${(count / activityMax) * 100}%`,
                                }}
                              />
                            </div>
                            <small>
                              {period === 7
                                ? date.toLocaleDateString(locale, {
                                    weekday: "short",
                                  })
                                : index % 5 === 0 || index === period - 1
                                  ? date.getDate()
                                  : ""}
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                    <details className="sd-data-details">
                      <summary>{t.dataTable}</summary>
                      <table>
                        <caption>{t.activityCaption}</caption>
                        <thead>
                          <tr>
                            <th scope="col">{t.date}</th>
                            <th scope="col">{t.count}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activity.map(({ date, count }) => (
                            <tr key={dayKey(date)}>
                              <th scope="row">{formatDate(date)}</th>
                              <td>{formatNumber(count)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  </>
                )}
              </section>
              <section
                className="sd-section sd-explore-section"
                aria-labelledby="sd-resources-title"
              >
                <div className="sd-section-heading">
                  <div>
                    <h2 id="sd-resources-title">{t.recommendations}</h2>
                    <p>{t.recommendationsSubtitle}</p>
                  </div>
                  <NavLink className="sd-inline-link" to="/courses">
                    {t.allCourses}
                    <ArrowRight
                      size={15}
                      className="sd-directional"
                      aria-hidden="true"
                    />
                  </NavLink>
                </div>
                {!canAccess ? (
                  <div className="sd-subscription-card">
                    <ShieldCheck size={25} aria-hidden="true" />
                    <div>
                      <h3>{t.subscriptionTitle}</h3>
                      <p>{t.subscriptionDescription}</p>
                    </div>
                    <NavLink className="sd-inline-link" to="/subscription">
                      {t.inactive}
                      <ArrowRight
                        size={15}
                        className="sd-directional"
                        aria-hidden="true"
                      />
                    </NavLink>
                  </div>
                ) : resources.length ? (
                  <div className="sd-resource-list">
                    {resources.map((resource, index) => (
                      <NavLink
                        className={`sd-resource sd-resource-${resource.type}`}
                        key={`${resource.type}-${resource.id}`}
                        to={resource.to}
                      >
                        <span className="sd-resource-art" aria-hidden="true">
                          {resource.type === "course" ? (
                            <BookOpen size={29} />
                          ) : (
                            <Brain size={29} />
                          )}
                          <span>{String(index + 1).padStart(2, "0")}</span>
                        </span>
                        <div className="sd-resource-copy">
                          <span className="sd-resource-type">
                            {resource.type === "course" ? t.courses : t.quizzes}
                          </span>
                          <h3>{resourceTitle(resource)}</h3>
                          <p>
                            {localText(
                              resource.description,
                              language,
                              resource.type === "course"
                                ? t.courseFallbackDescription
                                : t.quizFallbackDescription,
                            )}
                          </p>
                        </div>
                        <span className="sd-resource-open">
                          <ArrowRight
                            size={18}
                            className="sd-directional"
                            aria-hidden="true"
                          />
                        </span>
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <div className="sd-catalog-empty">
                    <BookOpen size={25} aria-hidden="true" />
                    <h3>
                      {currentData.failures.includes("resources")
                        ? t.resourcesUnavailable
                        : t.noResources}
                    </h3>
                    <p>{t.noResourcesDescription}</p>
                  </div>
                )}
              </section>
            </div>
            <div className="sd-aside-column">
              <section
                className="sd-panel sd-method"
                aria-labelledby="sd-method-title"
              >
                <span className="sd-method-badge">
                  <Target size={20} aria-hidden="true" />
                </span>
                <h2 id="sd-method-title">{t.method}</h2>
                <p>{t.methodIntro}</p>
                <ol>
                  {[
                    { title: t.method1, to: "/courses" },
                    { title: t.method2, to: "/quizzes" },
                    { title: t.method3, to: "/flashcards" },
                  ].map((step, index) => (
                    <li key={step.to}>
                      <NavLink to={step.to}>
                        <span>{index + 1}</span>
                        {step.title}
                        <ChevronRight
                          size={15}
                          className="sd-directional"
                          aria-hidden="true"
                        />
                      </NavLink>
                    </li>
                  ))}
                </ol>
                {metric(stats.studyHours) !== null && (
                  <div className="sd-study-time">
                    <Clock3 size={18} aria-hidden="true" />
                    <strong>{formatNumber(metric(stats.studyHours))}</strong>
                    <span>{t.studyHours}</span>
                  </div>
                )}
              </section>
              <section
                className="sd-panel sd-recent"
                aria-labelledby="sd-recent-title"
              >
                <h2 id="sd-recent-title">
                  {t.recent}
                  <span>
                    <Check size={15} aria-hidden="true" />
                  </span>
                </h2>
                {attempts?.length ? (
                  <ol>
                    {attempts.slice(0, 4).map((attempt) => {
                      const quiz = resources.find(
                        (resource) =>
                          resource.type === "quiz" &&
                          resource.id === attempt.quizId,
                      );
                      const score =
                        attempt.score !== null && attempt.score <= 100
                          ? `${formatNumber(attempt.score)} %`
                          : "—";
                      return (
                        <li key={attempt.id}>
                          <span className="sd-attempt-icon">
                            <Brain size={17} aria-hidden="true" />
                          </span>
                          <div>
                            <strong>
                              {quiz ? resourceTitle(quiz) : t.quizzes}
                            </strong>
                            <time dateTime={attempt.date?.toISOString()}>
                              {formatDate(attempt.date)}
                            </time>
                          </div>
                          <span
                            className="sd-score"
                            aria-label={`${t.result} : ${score}`}
                          >
                            {score}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="sd-recent-empty">
                    {attempts === null && !loading
                      ? t.activityUnavailable
                      : t.recentEmpty}
                  </p>
                )}
              </section>
              <div className="sd-access-note">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>
                  {administrator || unlimited
                    ? t.unlimited
                    : canAccess
                      ? t.active
                      : t.inactive}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
