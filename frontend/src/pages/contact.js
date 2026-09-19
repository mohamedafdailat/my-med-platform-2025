import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Headphones,
} from 'lucide-react';

const Contact = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const translations = {
    fr: {
      title: 'Nous contacter',
      subtitle:
        'Une question, un problème technique ou besoin d’aide sur votre apprentissage médical ? Notre équipe est là pour vous accompagner.',
      badge: 'Support MedPlatform Maroc',
      contactInfo: 'Informations de contact',
      formTitle: 'Envoyer un message',
      formDescription:
        'Remplissez le formulaire ci-dessous. Votre messagerie s’ouvrira avec un email prêt à envoyer.',
      name: 'Nom complet',
      email: 'Adresse email',
      subject: 'Sujet',
      message: 'Message',
      namePlaceholder: 'Votre nom',
      emailPlaceholder: 'votre.email@example.com',
      subjectPlaceholder: 'Ex : Problème avec mon abonnement',
      messagePlaceholder: 'Décrivez votre demande...',
      send: 'Préparer l’email',
      sending: 'Préparation...',
      success: 'Votre message est prêt dans votre application email.',
      requiredError: 'Veuillez remplir tous les champs obligatoires.',
      emailError: 'Veuillez saisir une adresse email valide.',
      messageLengthError: 'Le message doit contenir au moins 10 caractères.',
      emailLabel: 'Email',
      phoneLabel: 'Téléphone',
      addressLabel: 'Adresse',
      address: 'Casablanca, Maroc',
      responseTimeTitle: 'Délai de réponse',
      responseTimeText: 'Nous essayons de répondre dans les plus brefs délais.',
      back: 'Retour à l’accueil',
      terms: 'Termes et Conditions',
      privacy: 'Politique de confidentialité',
      required: 'obligatoire',
      characters: 'caractères',
    },
    ar: {
      title: 'تواصل معنا',
      subtitle:
        'هل لديك سؤال أو مشكلة تقنية أو تحتاج إلى مساعدة في التعلم الطبي؟ فريقنا هنا لمساعدتك.',
      badge: 'دعم MedPlatform Maroc',
      contactInfo: 'معلومات التواصل',
      formTitle: 'إرسال رسالة',
      formDescription:
        'املأ النموذج أدناه. سيتم فتح تطبيق البريد الإلكتروني برسالة جاهزة للإرسال.',
      name: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      subject: 'الموضوع',
      message: 'الرسالة',
      namePlaceholder: 'اسمك',
      emailPlaceholder: 'your.email@example.com',
      subjectPlaceholder: 'مثال: مشكلة في الاشتراك',
      messagePlaceholder: 'اكتب طلبك هنا...',
      send: 'تحضير البريد الإلكتروني',
      sending: 'جاري التحضير...',
      success: 'تم تجهيز رسالتك في تطبيق البريد الإلكتروني.',
      requiredError: 'يرجى ملء جميع الحقول المطلوبة.',
      emailError: 'يرجى إدخال بريد إلكتروني صحيح.',
      messageLengthError: 'يجب أن تحتوي الرسالة على 10 أحرف على الأقل.',
      emailLabel: 'البريد الإلكتروني',
      phoneLabel: 'الهاتف',
      addressLabel: 'العنوان',
      address: 'الدار البيضاء، المغرب',
      responseTimeTitle: 'مدة الرد',
      responseTimeText: 'نحاول الرد في أقرب وقت ممكن.',
      back: 'العودة إلى الرئيسية',
      terms: 'الشروط والأحكام',
      privacy: 'سياسة الخصوصية',
      required: 'إجباري',
      characters: 'حرف',
    },
  };

  const t = translations[language] || translations.fr;

  const CONTACT_EMAIL = 'support@medplatform.ma';
  const CONTACT_PHONE = '+212 6 46 56 97 88';

  const contactCards = [
    {
      id: 'email',
      icon: Mail,
      label: t.emailLabel,
      value: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
    },
    {
      id: 'phone',
      icon: Phone,
      label: t.phoneLabel,
      value: CONTACT_PHONE,
      href: `tel:${CONTACT_PHONE.replace(/\s+/g, '')}`,
    },
    {
      id: 'address',
      icon: MapPin,
      label: t.addressLabel,
      value: t.address,
      href: null,
    },
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError('');
    setMessageSent(false);
  };

  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    if (!name || !email || !subject || !message) {
      return t.requiredError;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return t.emailError;
    }

    if (message.length < 10) {
      return t.messageLengthError;
    }

    return '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const subject = encodeURIComponent(`[MedPlatform Maroc] ${formData.subject.trim()}`);

    const body = encodeURIComponent(
      `${language === 'fr' ? 'Nom' : 'الاسم'} : ${formData.name.trim()}\n` +
        `${language === 'fr' ? 'Email' : 'البريد الإلكتروني'} : ${formData.email.trim()}\n\n` +
        `${language === 'fr' ? 'Message' : 'الرسالة'} :\n${formData.message.trim()}`
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    setTimeout(() => {
      setMessageSent(true);
      setIsSubmitting(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    }, 700);
  };

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <NavLink
              to="/"
              className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium transition-colors"
              aria-label={t.back}
            >
              <ArrowLeft
                className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
              {t.back}
            </NavLink>
          </div>

          <header className="bg-white border border-blue-100 rounded-3xl shadow-sm p-8 sm:p-10 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-5">
                  <Headphones className="w-4 h-4" aria-hidden="true" />
                  {t.badge}
                </div>

                <h1 className="text-3xl sm:text-5xl font-bold text-gray-950 mb-5">
                  {t.title}
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                  {t.subtitle}
                </p>
              </div>

              <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shrink-0">
                <MessageCircle className="w-10 h-10" aria-hidden="true" />
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <aside className="lg:col-span-2 space-y-6">
              <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-7">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">
                  {t.contactInfo}
                </h2>

                <div className="space-y-4">
                  {contactCards.map((item) => {
                    const Icon = item.icon;

                    const content = (
                      <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900 hover:bg-blue-100 transition-colors">
                        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-blue-700" aria-hidden="true" />
                        </div>

                        <div className="min-w-0">
                          <strong className="block text-sm">{item.label}</strong>
                          <span className="break-words text-sm sm:text-base">
                            {item.value}
                          </span>
                        </div>
                      </div>
                    );

                    return item.href ? (
                      <a
                        key={item.id}
                        href={item.href}
                        aria-label={`${item.label}: ${item.value}`}
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={item.id}>{content}</div>
                    );
                  })}
                </div>
              </section>

              <section className="bg-blue-600 text-white rounded-3xl shadow-lg p-6 sm:p-7">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6" aria-hidden="true" />
                  <h2 className="text-xl font-bold">{t.responseTimeTitle}</h2>
                </div>

                <p className="text-blue-50 leading-relaxed">{t.responseTimeText}</p>
              </section>

              <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-7">
                <div className="flex flex-col gap-3">
                  <NavLink
                    to="/terms"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-gray-800 hover:bg-gray-50 transition-colors font-semibold"
                  >
                    <FileText className="w-5 h-5" aria-hidden="true" />
                    {t.terms}
                  </NavLink>

                  <NavLink
                    to="/privacy"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-gray-800 hover:bg-gray-50 transition-colors font-semibold"
                  >
                    <FileText className="w-5 h-5" aria-hidden="true" />
                    {t.privacy}
                  </NavLink>
                </div>
              </section>
            </aside>

            <section className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {t.formTitle}
                </h2>

                <p className="text-gray-600 leading-relaxed">{t.formDescription}</p>
              </div>

              {messageSent && (
                <div
                  className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 flex items-start gap-3"
                  role="status"
                >
                  <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                  <p>{t.success}</p>
                </div>
              )}

              {error && (
                <div
                  className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 flex items-start gap-3"
                  role="alert"
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-gray-800 mb-2"
                    >
                      {t.name}{' '}
                      <span className="text-red-500" aria-label={t.required}>
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t.namePlaceholder}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-800 mb-2"
                    >
                      {t.email}{' '}
                      <span className="text-red-500" aria-label={t.required}>
                        *
                      </span>
                    </label>

                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t.emailPlaceholder}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    {t.subject}{' '}
                    <span className="text-red-500" aria-label={t.required}>
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t.subjectPlaceholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <label
                      htmlFor="message"
                      className="block text-sm font-semibold text-gray-800"
                    >
                      {t.message}{' '}
                      <span className="text-red-500" aria-label={t.required}>
                        *
                      </span>
                    </label>

                    <span className="text-xs text-gray-500">
                      {formData.message.length} {t.characters}
                    </span>
                  </div>

                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t.messagePlaceholder}
                    rows={7}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-2xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                  <Send className="w-5 h-5" aria-hidden="true" />
                  {isSubmitting ? t.sending : t.send}
                </button>
              </form>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;