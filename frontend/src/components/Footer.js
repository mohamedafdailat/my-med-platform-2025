import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ArrowUp,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Send,
} from 'lucide-react';

const Footer = () => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRTL = language === 'ar';

  const footerText = useMemo(
    () => ({
      fr: {
        aboutTitle: 'À propos',
        aboutDesc:
          'MedPlatform Maroc accompagne les étudiants en médecine avec des cours, vidéos, quiz et flashcards pensés pour apprendre efficacement.',
        quickLinks: 'Liens rapides',
        contact: 'Contact',
        phone: '+212 6 46 56 97 88',
        email: 'contact@medplatform.ma',
        copyright: 'Tous droits réservés.',
        newsletter: 'Newsletter',
        newsletterDesc: 'Recevez les nouveautés, quiz et ressources utiles.',
        subscribe: 'S’abonner',
        placeholder: 'Votre email',
        terms: 'Conditions d’utilisation',
        privacy: 'Politique de confidentialité',
        backToTop: 'Retour en haut',
        successMessage: 'Abonnement réussi ! Vérifiez votre boîte de réception.',
        errorMessage: 'Veuillez entrer un email valide.',
        brandLabel: 'MedPlatform Maroc',
        socialFacebook: 'Suivez-nous sur Facebook',
        socialTwitter: 'Suivez-nous sur Twitter',
        socialInstagram: 'Suivez-nous sur Instagram',
      },
      ar: {
        aboutTitle: 'حول المنصة',
        aboutDesc:
          'منصة ميدبلاتفورم المغرب تساعد طلبة الطب عبر دروس، فيديوهات، اختبارات وبطاقات تعليمية لتعلم أكثر فعالية.',
        quickLinks: 'روابط سريعة',
        contact: 'اتصل بنا',
        phone: '+212 6 46 56 97 88',
        email: 'contact@medplatform.ma',
        copyright: 'جميع الحقوق محفوظة.',
        newsletter: 'النشرة الإخبارية',
        newsletterDesc: 'توصل بالجديد، الاختبارات والموارد المفيدة.',
        subscribe: 'الاشتراك',
        placeholder: 'بريدك الإلكتروني',
        terms: 'شروط الاستخدام',
        privacy: 'سياسة الخصوصية',
        backToTop: 'العودة إلى الأعلى',
        successMessage: 'تم الاشتراك بنجاح! تحقق من بريدك الإلكتروني.',
        errorMessage: 'يرجى إدخال بريد إلكتروني صالح.',
        brandLabel: 'ميدبلاتفورم المغرب',
        socialFacebook: 'تابعنا على فيسبوك',
        socialTwitter: 'تابعنا على تويتر',
        socialInstagram: 'تابعنا على إنستغرام',
      },
    }),
    []
  );

  const t = footerText[language] || footerText.fr;

  const quickLinks = useMemo(
    () => [
      { to: '/courses', label: language === 'fr' ? 'Cours' : 'الدورات' },
      { to: '/videos', label: language === 'fr' ? 'Vidéos' : 'الفيديوهات' },
      { to: '/quizzes', label: language === 'fr' ? 'Quiz' : 'الاختبارات' },
      {
        to: '/flashcards',
        label: language === 'fr' ? 'Flashcards' : 'البطاقات التعليمية',
      },
    ],
    [language]
  );

  const socialLinks = useMemo(
    () => [
      {
        href: 'https://facebook.com/medplatformma',
        icon: Facebook,
        label: t.socialFacebook,
      },
      {
        href: 'https://twitter.com/medplatformma',
        icon: Twitter,
        label: t.socialTwitter,
      },
      {
        href: 'https://instagram.com/medplatformma',
        icon: Instagram,
        label: t.socialInstagram,
      },
    ],
    [t]
  );

  const validateEmail = useCallback((value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (isSubmitting) return;

      if (!validateEmail(email)) {
        alert(t.errorMessage);
        return;
      }

      setIsSubmitting(true);

      setTimeout(() => {
        alert(t.successMessage);
        setEmail('');
        setIsSubmitting(false);
      }, 800);
    },
    [email, isSubmitting, t, validateEmail]
  );

  const handleKeyDown = useCallback((event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action(event);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <footer className={`site-footer ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <section className="site-footer-brand" aria-label={t.aboutTitle}>
            <Link to="/" className="site-footer-logo-link" aria-label={t.brandLabel}>
              <img
                src="/logo-horizontal.png"
                alt="MedPlatform Maroc Logo"
                className="site-footer-logo"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/footer.png';
                }}
              />
            </Link>

            <h3>{t.aboutTitle}</h3>
            <p>{t.aboutDesc}</p>
          </section>

          <section aria-label={t.quickLinks}>
            <h3>{t.quickLinks}</h3>
            <ul className="site-footer-list">
              {quickLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label={t.contact}>
            <h3>{t.contact}</h3>
            <ul className="site-footer-list">
              <li>
                <a href={`mailto:${t.email}`} className="site-footer-contact-link">
                  <Mail className="site-footer-icon" aria-hidden="true" />
                  <span>{t.email}</span>
                </a>
              </li>

              <li className="site-footer-contact-link">
                <Phone className="site-footer-icon" aria-hidden="true" />
                <span>{t.phone}</span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="newsletter-title">
            <h3 id="newsletter-title">{t.newsletter}</h3>
            <p className="site-footer-newsletter-desc">{t.newsletterDesc}</p>

            <form className="site-footer-newsletter" onSubmit={handleSubmit}>
              <label htmlFor="newsletter-email" className="sr-only">
                {t.placeholder}
              </label>

              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.placeholder}
                disabled={isSubmitting}
                aria-required="true"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                aria-label={t.subscribe}
              >
                {isSubmitting ? (
                  <span className="site-footer-spinner" aria-hidden="true" />
                ) : (
                  <>
                    <Send className="site-footer-icon" aria-hidden="true" />
                    <span>{t.subscribe}</span>
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        <div className="site-footer-socials" aria-label="Social media">
          {socialLinks.map((social) => {
            const Icon = social.icon;

            return (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                title={social.label}
              >
                <Icon aria-hidden="true" />
              </a>
            );
          })}
        </div>

        <div className="site-footer-bottom">
          <div className="site-footer-legal">
            <Link to="/terms">{t.terms}</Link>
            <Link to="/privacy">{t.privacy}</Link>
          </div>

          <button
            type="button"
            className="site-footer-top"
            onClick={scrollToTop}
            onKeyDown={(event) => handleKeyDown(event, scrollToTop)}
            aria-label={t.backToTop}
          >
            <ArrowUp className="site-footer-icon" aria-hidden="true" />
            <span>{t.backToTop}</span>
          </button>
        </div>

        <div className="site-footer-copy">
          © {new Date().getFullYear()} MedPlatform Maroc. {t.copyright}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
