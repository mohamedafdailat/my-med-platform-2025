import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Card from '../components/Card';
import {
  BookOpen,
  PlayCircle,
  Brain,
  Stethoscope,
  GraduationCap,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

const Home = () => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();

  const isRTL = language === 'ar';

  const content = useMemo(
    () => ({
      fr: {
        title: 'MedPlatform Maroc',
        subtitle: 'La plateforme médicale interactive pensée pour les étudiants en médecine au Maroc.',
        heroTitle: 'Apprenez la médecine autrement',
        heroDescription:
          'Accédez à des cours structurés, vidéos pédagogiques, quiz intelligents et flashcards pour progresser avec méthode, renforcer votre mémorisation et préparer vos examens efficacement.',
        featuresTitle: 'Nos fonctionnalités',
        ctaPrimary: 'Commencer maintenant',
        ctaSecondary: 'Explorer les cours',
        welcome:
          'Bienvenue sur MedPlatform Maroc. Commencez votre apprentissage médical dès aujourd’hui.',
        welcomeUser: (name) =>
          `Bienvenue, ${name} ! Continuez votre apprentissage médical.`,
        profileLink: 'Voir votre profil',
        statCourses: 'Cours et ressources',
        statQuiz: 'Quiz interactifs',
        statAccess: 'Accès étudiant',
        badge: 'Formation médicale interactive',
        trust1: 'Contenu structuré',
        trust2: 'Révision active',
        trust3: 'Progression suivie',
        dashboardTitle: 'Dashboard étudiant',
        dashboardSubtitle: 'Progression, quiz, cours',
        medicine: 'Médecine',
        revision: 'Révision',
        coursesTitle: 'Cours interactifs',
        coursesDescription:
          'Apprenez avec des cours structurés, clairs et adaptés à votre rythme.',
        quizzesTitle: 'Quiz dynamiques',
        quizzesDescription:
          'Testez vos connaissances avec des quiz interactifs, ciblés et utiles pour vos révisions.',
        flashcardsTitle: 'Flashcards',
        flashcardsDescription:
          'Mémorisez efficacement grâce à des cartes de révision personnalisées.',
        loading: 'Chargement...',
        defaultUser: 'Utilisateur',
        statsLabel: 'Statistiques de MedPlatform Maroc',
      },
      ar: {
        title: 'منصة ميدبلاتفورم المغرب',
        subtitle: 'منصة طبية تفاعلية موجهة لطلبة الطب في المغرب.',
        heroTitle: 'تعلّم الطب بطريقة أفضل',
        heroDescription:
          'استفد من دروس منظمة، فيديوهات تعليمية، اختبارات ذكية وبطاقات مراجعة لمساعدتك على التقدم، تقوية الحفظ والاستعداد للامتحانات بفعالية.',
        featuresTitle: 'ميزات المنصة',
        ctaPrimary: 'ابدأ الآن',
        ctaSecondary: 'استكشف الدورات',
        welcome: 'مرحبًا بكم في منصة ميدبلاتفورم المغرب. ابدأ تعلمك الطبي اليوم.',
        welcomeUser: (name) => `مرحبًا، ${name}! واصل تعلمك الطبي.`,
        profileLink: 'عرض ملفك الشخصي',
        statCourses: 'دروس وموارد',
        statQuiz: 'اختبارات تفاعلية',
        statAccess: 'ولوج للطلبة',
        badge: 'تعليم طبي تفاعلي',
        trust1: 'محتوى منظم',
        trust2: 'مراجعة فعالة',
        trust3: 'تتبع التقدم',
        dashboardTitle: 'لوحة الطالب',
        dashboardSubtitle: 'تقدم، اختبارات، دروس',
        medicine: 'الطب',
        revision: 'مراجعة',
        coursesTitle: 'دورات تفاعلية',
        coursesDescription: 'تعلم من خلال دروس منظمة وواضحة ومناسبة لوتيرتك.',
        quizzesTitle: 'اختبارات ديناميكية',
        quizzesDescription: 'اختبر معرفتك من خلال اختبارات تفاعلية وموجهة.',
        flashcardsTitle: 'بطاقات تعليمية',
        flashcardsDescription: 'احفظ بفعالية باستعمال بطاقات مراجعة مخصصة.',
        loading: 'جاري التحميل...',
        defaultUser: 'مستخدم',
        statsLabel: 'إحصائيات منصة ميدبلاتفورم المغرب',
      },
    }),
    []
  );

  const t = content[language] || content.fr;

  const features = useMemo(
    () => [
      {
        title: t.coursesTitle,
        description: t.coursesDescription,
        image: '/image4.png',
        icon: <BookOpen className="w-10 h-10 text-blue-600" aria-hidden="true" />,
        link: '/courses',
      },
      {
        title: t.quizzesTitle,
        description: t.quizzesDescription,
        image: '/image5.png',
        icon: <Brain className="w-10 h-10 text-blue-600" aria-hidden="true" />,
        link: '/quizzes',
      },
      {
        title: t.flashcardsTitle,
        description: t.flashcardsDescription,
        image: '/image5.png',
        icon: <PlayCircle className="w-10 h-10 text-blue-600" aria-hidden="true" />,
        link: '/flashcards',
      },
    ],
    [t]
  );

  const trustItems = useMemo(
    () => [t.trust1, t.trust2, t.trust3],
    [t.trust1, t.trust2, t.trust3]
  );

  if (loading) {
    return (
      <main className={`home-page ${isRTL ? 'rtl' : 'ltr'}`}>
        <div
          className="loading-spinner mx-auto"
          role="status"
          aria-label={t.loading}
        />
      </main>
    );
  }

  const displayName = user?.displayName || user?.email || t.defaultUser;

  return (
    <main className={`home-page ${isRTL ? 'rtl' : 'ltr'}`}>
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="home-hero-content">
          <div className="home-badge">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{t.badge}</span>
          </div>

          <h1 id="hero-title">{t.title}</h1>
          <p className="home-subtitle">{t.subtitle}</p>

          <div className="home-hero-copy">
            <h2>{t.heroTitle}</h2>
            <p>{t.heroDescription}</p>
          </div>

          {user ? (
            <p className="home-welcome" role="status" aria-live="polite">
              {t.welcomeUser(displayName)}
            </p>
          ) : (
            <p className="home-welcome">{t.welcome}</p>
          )}

          <div className="cta-buttons">
            {user ? (
              <NavLink to="/profile" className="btn-primary" aria-label={t.profileLink}>
                {t.profileLink}
              </NavLink>
            ) : (
              <NavLink to="/register" className="btn-primary" aria-label={t.ctaPrimary}>
                {t.ctaPrimary}
              </NavLink>
            )}

            <NavLink to="/courses" className="btn-secondary" aria-label={t.ctaSecondary}>
              {t.ctaSecondary}
            </NavLink>
          </div>

          <div className="home-trust-row" aria-label={t.badge}>
            {trustItems.map((item) => (
              <span key={item}>
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="home-hero-visual" aria-hidden="true">
          <div className="home-visual-card home-visual-main">
            <img src="/image4.png" alt="" />
            <div>
              <strong>{t.dashboardTitle}</strong>
              <span>{t.dashboardSubtitle}</span>
            </div>
          </div>

          <div className="home-visual-card home-visual-floating">
            <Stethoscope className="w-8 h-8" aria-hidden="true" />
            <span>{t.medicine}</span>
          </div>

          <div className="home-visual-card home-visual-floating second">
            <GraduationCap className="w-8 h-8" aria-hidden="true" />
            <span>{t.revision}</span>
          </div>
        </div>
      </section>

      <section className="home-stats" aria-label={t.statsLabel}>
        <div>
          <strong>+50</strong>
          <span>{t.statCourses}</span>
        </div>

        <div>
          <strong>+200</strong>
          <span>{t.statQuiz}</span>
        </div>

        <div>
          <strong>24/7</strong>
          <span>{t.statAccess}</span>
        </div>
      </section>

      <section className="features-section" aria-labelledby="features-title">
        <h2 id="features-title">{t.featuresTitle}</h2>

        <div className="features-grid">
          {features.map((feature) => (
            <NavLink
              key={feature.link}
              to={feature.link}
              className="feature-link"
              aria-label={feature.title}
            >
              <Card
                title={feature.title}
                description={feature.description}
                image={feature.image}
                icon={feature.icon}
                onErrorImage="/image5.png"
              />
            </NavLink>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;