import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Card from '../components/Card';
import { BookOpen, PlayCircle, Brain } from 'lucide-react';

const Home = () => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const content = {
    fr: {
      title: 'MedPlatform Maroc',
      subtitle: 'Votre plateforme d’apprentissage médical pour étudiants marocains',
      heroTitle: 'Transformez votre avenir médical',
      heroDescription:
        'Accédez à des cours interactifs, quiz, vidéos et flashcards conçus pour les étudiants en médecine au Maroc.',
      featuresTitle: 'Nos fonctionnalités',
      ctaPrimary: 'Commencer maintenant',
      ctaSecondary: 'Explorer les cours',
      welcome: 'Bienvenue sur MedPlatform Maroc ! Commencez votre apprentissage dès aujourd’hui.',
      welcomeUser: (name) => `Bienvenue, ${name} ! Continuez votre apprentissage médical.`,
      profileLink: 'Voir votre profil',
    },
    ar: {
      title: 'منصة ميدبلانتفورم المغرب',
      subtitle: 'منصتكم التعليمية الطبية للطلبة المغاربة',
      heroTitle: 'حوّل مستقبلك الطبي',
      heroDescription:
        'استمتع بالدورات التفاعلية، الاختبارات، الفيديوهات والبطاقات التعليمية المصممة لطلاب الطب في المغرب.',
      featuresTitle: 'ميزاتنا',
      ctaPrimary: 'ابدأ الآن',
      ctaSecondary: 'استكشف الدورات',
      welcome: 'مرحبًا بكم في منصة ميدبلانتفورم المغرب! ابدأ تعلمك اليوم.',
      welcomeUser: (name) => `مرحبًا، ${name}! واصل تعلمك الطبي.`,
      profileLink: 'عرض ملفك الشخصي',
    },
  };

  const features = [
    {
      title: language === 'fr' ? 'Cours interactifs' : 'دورات تفاعلية',
      description: language === 'fr' ? 'Apprenez avec des cours structurés et adaptés à votre rythme.' : 'تعلم من خلال دورات منظمة ومناسبة لوتيرتك.',
      image: 'https://www.docdeclic.fr/uploads/1587477264_3ea943e53a43e6383b3e.png',
      icon: <BookOpen className="w-10 h-10 text-blue-600" aria-hidden="true" />,
      link: '/courses',
    },
    {
      title: language === 'fr' ? 'Quiz dynamiques' : 'اختبارات ديناميكية',
      description: language === 'fr' ? 'Testez vos connaissances en temps réel avec des quiz interactifs.' : 'اختبر معرفتك في الوقت الحقيقي مع اختبارات تفاعلية.',
      image: 'https://s1.studylibfr.com/store/data/003860148_1-191dfeecf95f96625f28d673088726f2.png',
      icon: <Brain className="w-10 h-10 text-blue-600" aria-hidden="true" />,
      link: '/quizzes',
    },
    {
      title: language === 'fr' ? 'Flashcards' : 'بطاقات تعليمية',
      description: language === 'fr' ? 'Mémorisez efficacement avec des flashcards personnalisées.' : 'احفظ بكفاءة باستخدام بطاقات تعليمية مخصصة.',
      image: 'https://cdn.slidesharecdn.com/ss_thumbnails/lesantibiotiquesi-171209223412-thumbnail.jpg?width=640&height=640&fit=bounds',
      icon: <PlayCircle className="w-10 h-10 text-blue-600" aria-hidden="true" />,
      link: '/flashcards',
    },
  ];

  const t = content[language] || content.fr;

  if (loading) {
    return (
      <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="loading-spinner mx-auto" aria-label={language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}></div>
      </main>
    );
  }

  return (
    <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
      <section className="hero-section bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 mb-12 animate-fade-in" aria-labelledby="hero-title">
        <h1 id="hero-title" className="text-4xl font-bold text-gray-900 mb-4">{t.title}</h1>
        <p className="text-lg text-gray-600 mb-6">{t.subtitle}</p>
        <div className="hero-content">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t.heroTitle}</h2>
          <p className="text-gray-600 leading-relaxed mb-6">{t.heroDescription}</p>
          {user ? (
            <p className="text-lg text-blue-600 font-medium mb-6" role="alert" aria-live="assertive">
              {t.welcomeUser(user.displayName || (language === 'fr' ? 'Utilisateur' : 'مستخدم'))}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-6">{t.welcome}</p>
          )}
          <div className="cta-buttons flex flex-col sm:flex-row gap-4">
            {user ? (
              <NavLink
                to="/profile"
                className="btn-primary inline-flex items-center justify-center px-6 py-3 text-white rounded-lg transition-all duration-200"
                aria-label={t.profileLink}
              >
                {t.profileLink}
              </NavLink>
            ) : (
              <NavLink
                to="/register"
                className="btn-primary inline-flex items-center justify-center px-6 py-3 text-white rounded-lg transition-all duration-200"
                aria-label={t.ctaPrimary}
              >
                {t.ctaPrimary}
              </NavLink>
            )}
            <NavLink
              to="/videos"
              className="btn-secondary inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200"
              aria-label={t.ctaSecondary}
            >
              {t.ctaSecondary}
            </NavLink>
          </div>
        </div>
      </section>

      <section className="features-section" aria-labelledby="features-title">
        <h2 id="features-title" className="text-3xl font-bold text-gray-900 mb-8 text-center">{t.featuresTitle}</h2>
        <div className="features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <NavLink
              key={index}
              to={feature.link}
              className="transition-transform duration-200 hover:scale-105"
              aria-label={feature.title}
            >
              <Card
                title={feature.title}
                description={feature.description}
                image={feature.image}
                icon={feature.icon}
                onErrorImage="https://placehold.co/300x200?text=Feature"
              />
            </NavLink>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;