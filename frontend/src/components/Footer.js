import React, { useContext, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../contexts/LanguageContext';
import { ArrowUp, Mail, Phone, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  const { language } = useContext(LanguageContext);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const footerText = {
    fr: {
      aboutTitle: 'À propos',
      aboutDesc: 'MedPlatform Maroc est une plateforme éducative pour les étudiants en médecine, offrant des cours, vidéos, quiz et flashcards.',
      quickLinks: 'Liens rapides',
      contact: 'Contact',
      phone: 'Téléphone: +212 6 46 56 97 88',
      email: 'Email: contact@medplatform.ma',
      copyright: 'Tous droits réservés.',
      newsletter: 'Abonnez-vous à notre newsletter',
      subscribe: 'S’abonner',
      placeholder: 'Entrez votre email',
      terms: 'Conditions d’utilisation',
      privacy: 'Politique de confidentialité',
      backToTop: 'Retour en haut',
      successMessage: 'Abonnement réussi ! Vérifiez votre boîte de réception.',
      errorMessage: 'Veuillez entrer un email valide.',
    },
    ar: {
      aboutTitle: 'حول المنصة',
      aboutDesc: 'منصة ميدبلانتفورم المغرب هي منصة تعليمية لطلاب الطب، تقدم دورات، فيديوهات، اختبارات، وبطاقات تعليمية.',
      quickLinks: 'روابط سريعة',
      contact: 'اتصل بنا',
      phone: 'الهاتف: +212 6 46 56 97 88',
      email: 'البريد الإلكتروني: contact@medplatform.ma',
      copyright: 'جميع الحقوق محفوظة.',
      newsletter: 'اشترك في نشرتنا الإخبارية',
      subscribe: 'الاشتراك',
      placeholder: 'أدخل بريدك الإلكتروني',
      terms: 'شروط الاستخدام',
      privacy: 'سياسة الخصوصية',
      backToTop: 'العودة إلى الأعلى',
      successMessage: 'تم الاشتراك بنجاح! تحقق من بريدك الإلكتروني.',
      errorMessage: 'يرجى إدخال بريد إلكتروني صالح.',
    },
  };

  const t = footerText[language] || footerText.fr;
  const isRTL = language === 'ar';

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert(t.errorMessage);
        return;
      }

      setIsSubmitting(true);
      // Simulate API call (no actual form submission due to sandbox restrictions)
      setTimeout(() => {
        alert(t.successMessage);
        setEmail('');
        setIsSubmitting(false);
      }, 1000);
    },
    [email, isSubmitting, t]
  );

  const handleKeyDown = useCallback(
    (e, action) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        action();
      }
    },
    []
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <footer
      className={`bg-gradient-to-r from-gray-900 to-blue-800 text-white py-12 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* About */}
          <div className="col-span-1">
            <Link
              to="/"
              className="flex items-center mb-4 transition-transform duration-200 hover:scale-105"
              aria-label={t.aboutTitle}
            >
              <img
                src="/logo-horizontal.png"
                alt="MedPlatform Maroc Logo"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/150x50?text=MedPlatform';
                }}
              />
            </Link>
            <h3 className="text-xl font-bold mb-4 text-blue-200">{t.aboutTitle}</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{t.aboutDesc}</p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-4 text-blue-200">{t.quickLinks}</h3>
            <ul className="text-sm space-y-3">
              {[
                { to: '/courses', label: language === 'fr' ? 'Cours' : 'الدورات' },
                { to: '/videos', label: language === 'fr' ? 'Vidéos' : 'الفيديوهات' },
                { to: '/quizzes', label: language === 'fr' ? 'Quiz' : 'الاختبارات' },
                {
                  to: '/flashcards',
                  label: language === 'fr' ? 'Flashcards' : 'البطاقات التعليمية',
                },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-gray-400 hover:text-blue-300 hover:underline transition-all duration-200"
                    aria-label={item.label}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-4 text-blue-200">{t.contact}</h3>
            <p className="text-sm text-gray-300 space-y-2">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" aria-hidden="true" />
                <a
                  href="mailto:contact@medplatform.ma"
                  className="hover:text-blue-300 transition-all duration-200"
                  aria-label={t.email}
                >
                  contact@medplatform.ma
                </a>
              </span>
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4" aria-hidden="true" />
                {t.phone}
              </span>
            </p>
          </div>

          {/* Newsletter */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-4 text-blue-200">{t.newsletter}</h3>
            <div
              role="form"
              aria-labelledby="newsletter-title"
              onSubmit={handleSubmit}
              onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
            >
              <label htmlFor="newsletter-email" className="sr-only">
                {t.placeholder}
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.placeholder}
                className="w-full p-3 mb-3 text-gray-800 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/90 transition-all duration-200"
                disabled={isSubmitting}
                aria-required="true"
              />
              <button
                type="button"
                onClick={handleSubmit}
                onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={isSubmitting}
                aria-label={t.subscribe}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  t.subscribe
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="mt-12 flex justify-center space-x-6">
          {[
            {
              href: 'https://facebook.com/medplatformma',
              icon: Facebook,
              label: language === 'fr' ? 'Suivez-nous sur Facebook' : 'تابعنا على فيسبوك',
            },
            {
              href: 'https://twitter.com/medplatformma',
              icon: Twitter,
              label: language === 'fr' ? 'Suivez-nous sur Twitter' : 'تابعنا على تويتر',
            },
            {
              href: 'https://instagram.com/medplatformma',
              icon: Instagram,
              label: language === 'fr' ? 'Suivez-nous sur Instagram' : 'تابعنا على إنستغرام',
            },
          ].map((social) => (
            <a
              key={social.href}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-300 hover:scale-110 transition-all duration-200 relative group"
              aria-label={social.label}
            >
              <social.icon className="w-6 h-6" aria-hidden="true" />
              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs bg-gray-800 text-white px-2 py-1 rounded-md">
                {social.label}
              </span>
            </a>
          ))}
        </div>

        {/* Legal Links and Back to Top */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400 border-t border-gray-700 pt-6">
          <div className="flex space-x-4">
            <Link
              to="/terms"
              className="hover:text-blue-300 hover:underline transition-all duration-200"
              aria-label={t.terms}
            >
              {t.terms}
            </Link>
            <Link
              to="/privacy"
              className="hover:text-blue-300 hover:underline transition-all duration-200"
              aria-label={t.privacy}
            >
              {t.privacy}
            </Link>
          </div>
          <button
            onClick={scrollToTop}
            onKeyDown={(e) => handleKeyDown(e, scrollToTop)}
            className="mt-4 sm:mt-0 flex items-center gap-2 text-gray-400 hover:text-blue-300 transition-all duration-200"
            aria-label={t.backToTop}
          >
            <ArrowUp className="w-5 h-5" aria-hidden="true" />
            {t.backToTop}
          </button>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} MedPlatform Maroc. {t.copyright}
        </div>
      </div>
    </footer>
  );
};

export default Footer;