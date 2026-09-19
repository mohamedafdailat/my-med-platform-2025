import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  CheckCircle,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const Subscription = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isRTL = language === 'ar';

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState('student_plus');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [success, setSuccess] = useState(false);

  const t = useMemo(
    () => ({
      fr: {
        badge: 'Offres étudiantes',
        title: 'Choisissez une formule adaptée à votre rythme',
        subtitle:
          'Cours, vidéos, quiz, flashcards IA et assistant DocBuddy pour réviser la médecine plus efficacement.',
        trusted: 'Pensé pour les étudiants en médecine au Maroc',
        monthly: 'Mensuel',
        annual: 'Annuel',
        saveAnnual: 'Économisez environ 2 mois',
        free: 'Gratuit',
        student: 'Étudiant Plus',
        premium: 'Premium Révision',
        annualPlan: 'Annuel Étudiant',
        freeDesc: 'Pour découvrir la plateforme',
        studentDesc: 'Le meilleur choix pour réviser régulièrement',
        premiumDesc: 'Pour une préparation intensive',
        annualDesc: 'Le plus économique sur l’année',
        mad: 'MAD',
        dhs: 'DHS',
        perMonth: '/ mois',
        perYear: '/ an',
        choosePlan: 'Choisir cette formule',
        currentPlan: 'Formule recommandée',
        popular: 'Le plus populaire',
        bestValue: 'Meilleur prix',
        included: 'Inclus',
        promoTitle: 'Code promo étudiant',
        promoPlaceholder: 'Ex : MEDSTUDENT',
        apply: 'Appliquer',
        invalidPromo: 'Code promo invalide.',
        promoApplied: 'Réduction appliquée',
        paymentErrorTitle: 'Paiement indisponible',
        paymentErrorMessage:
          'Le paiement en ligne n’est pas encore connecté. Vous pouvez garder cette page prête et connecter Stripe, PayPal ou un paiement local ensuite.',
        close: 'Fermer',
        contactUs: 'Nous contacter',
        loginRequired: 'Connectez-vous pour choisir une formule.',
        success: 'Formule sélectionnée avec succès.',
        guarantee: 'Sans engagement sur les formules mensuelles',
        securePayment: 'Paiement sécurisé à connecter',
        studentPrice: 'Prix adaptés aux étudiants',
        support: 'Support pédagogique',
        comparisonTitle: 'Comparatif rapide',
        faqTitle: 'Questions fréquentes',
        termsStart: 'En continuant, vous acceptez nos',
        terms: 'conditions d’utilisation',
        privacy: 'politique de confidentialité',
        backLogin: 'Retour à la connexion',
        freeFeatures: [
          'Accès limité aux cours publics',
          'Quelques quiz de démonstration',
          'Flashcards par défaut',
          'Suivi de progression basique',
        ],
        studentFeatures: [
          'Tous les cours et vidéos',
          'Quiz illimités',
          'Flashcards IA depuis PDF',
          'DocBuddy assistant médical',
          'Tableau de bord étudiant',
          'Sauvegarde de progression',
        ],
        premiumFeatures: [
          'Tout Étudiant Plus',
          'Génération de quiz IA avancée',
          'Plus de flashcards IA',
          'Révisions ciblées par matière',
          'Priorité sur les nouveautés',
          'Support prioritaire',
        ],
        annualFeatures: [
          'Tout Étudiant Plus pendant 12 mois',
          'Prix mensuel réduit',
          'Idéal pour toute l’année universitaire',
          'Accès aux futures mises à jour',
          'Préparation examens et stages',
          'Support inclus',
        ],
        faq: [
          {
            q: 'Puis-je utiliser la plateforme sans payer ?',
            a: 'Oui, une formule gratuite permet de découvrir les cours, quiz et flashcards de base.',
          },
          {
            q: 'Les prix sont-ils en dirhams marocains ?',
            a: 'Oui, les montants sont affichés en MAD / DHS pour être adaptés aux étudiants au Maroc.',
          },
          {
            q: 'Est-ce que DocBuddy remplace un médecin ?',
            a: 'Non. DocBuddy est un assistant pédagogique. Il aide à comprendre les notions médicales, mais ne donne pas de diagnostic définitif.',
          },
        ],
      },
      ar: {
        badge: 'عروض للطلبة',
        title: 'اختر الخطة المناسبة لطريقة دراستك',
        subtitle:
          'دروس، فيديوهات، اختبارات، بطاقات تعليمية بالذكاء الاصطناعي ومساعد DocBuddy لمراجعة الطب بفعالية.',
        trusted: 'مصممة لطلبة الطب في المغرب',
        monthly: 'شهري',
        annual: 'سنوي',
        saveAnnual: 'وفّر تقريباً شهرين',
        free: 'مجاني',
        student: 'طالب بلس',
        premium: 'مراجعة بريميوم',
        annualPlan: 'الخطة السنوية للطالب',
        freeDesc: 'لاكتشاف المنصة',
        studentDesc: 'الخيار الأفضل للمراجعة المنتظمة',
        premiumDesc: 'للتحضير المكثف',
        annualDesc: 'الأوفر خلال السنة',
        mad: 'درهم',
        dhs: 'MAD',
        perMonth: '/ شهر',
        perYear: '/ سنة',
        choosePlan: 'اختيار هذه الخطة',
        currentPlan: 'الخطة المقترحة',
        popular: 'الأكثر اختياراً',
        bestValue: 'أفضل سعر',
        included: 'يشمل',
        promoTitle: 'كود خصم للطلبة',
        promoPlaceholder: 'مثال: MEDSTUDENT',
        apply: 'تطبيق',
        invalidPromo: 'كود الخصم غير صالح.',
        promoApplied: 'تم تطبيق الخصم',
        paymentErrorTitle: 'الدفع غير متاح حالياً',
        paymentErrorMessage:
          'الدفع الإلكتروني غير مربوط بعد. يمكنك الاحتفاظ بهذه الصفحة وربط Stripe أو PayPal أو وسيلة دفع محلية لاحقاً.',
        close: 'إغلاق',
        contactUs: 'تواصل معنا',
        loginRequired: 'يرجى تسجيل الدخول لاختيار خطة.',
        success: 'تم اختيار الخطة بنجاح.',
        guarantee: 'بدون التزام في الخطط الشهرية',
        securePayment: 'دفع آمن سيتم ربطه',
        studentPrice: 'أسعار مناسبة للطلبة',
        support: 'دعم تعليمي',
        comparisonTitle: 'مقارنة سريعة',
        faqTitle: 'أسئلة شائعة',
        termsStart: 'بالمتابعة، فإنك توافق على',
        terms: 'شروط الاستخدام',
        privacy: 'سياسة الخصوصية',
        backLogin: 'العودة إلى تسجيل الدخول',
        freeFeatures: [
          'ولوج محدود للدروس المجانية',
          'بعض الاختبارات التجريبية',
          'بطاقات تعليمية افتراضية',
          'تتبع بسيط للتقدم',
        ],
        studentFeatures: [
          'كل الدروس والفيديوهات',
          'اختبارات غير محدودة',
          'بطاقات تعليمية من PDF بالذكاء الاصطناعي',
          'مساعد طبي DocBuddy',
          'لوحة تحكم الطالب',
          'حفظ التقدم',
        ],
        premiumFeatures: [
          'كل مزايا طالب بلس',
          'إنشاء اختبارات متقدمة بالذكاء الاصطناعي',
          'عدد أكبر من البطاقات التعليمية',
          'مراجعة حسب المادة',
          'أولوية في التحديثات الجديدة',
          'دعم بأولوية',
        ],
        annualFeatures: [
          'كل مزايا طالب بلس لمدة 12 شهراً',
          'سعر شهري مخفض',
          'مثالية للسنة الجامعية كاملة',
          'ولوج للتحديثات القادمة',
          'تحضير للامتحانات والتداريب',
          'دعم مشمول',
        ],
        faq: [
          {
            q: 'هل يمكن استعمال المنصة مجاناً؟',
            a: 'نعم، توجد خطة مجانية لاكتشاف الدروس والاختبارات والبطاقات الأساسية.',
          },
          {
            q: 'هل الأسعار بالدرهم المغربي؟',
            a: 'نعم، الأسعار معروضة بالدرهم المغربي MAD لتناسب الطلبة في المغرب.',
          },
          {
            q: 'هل DocBuddy يعوض الطبيب؟',
            a: 'لا. DocBuddy مساعد تعليمي لفهم المفاهيم الطبية، ولا يقدم تشخيصاً طبياً نهائياً.',
          },
        ],
      },
    }),
    []
  );

  const text = t[language] || t.fr;

  const plans = useMemo(
    () => [
      {
        id: 'free',
        name: text.free,
        description: text.freeDesc,
        monthlyPrice: 0,
        annualPrice: 0,
        period: billingCycle === 'annual' ? text.perYear : text.perMonth,
        badge: null,
        icon: GraduationCap,
        color: 'gray',
        features: text.freeFeatures,
      },
      {
        id: 'student_plus',
        name: text.student,
        description: text.studentDesc,
        monthlyPrice: 49,
        annualPrice: 490,
        period: billingCycle === 'annual' ? text.perYear : text.perMonth,
        badge: text.popular,
        icon: Sparkles,
        color: 'blue',
        features: text.studentFeatures,
      },
      {
        id: 'premium',
        name: text.premium,
        description: text.premiumDesc,
        monthlyPrice: 79,
        annualPrice: 790,
        period: billingCycle === 'annual' ? text.perYear : text.perMonth,
        badge: billingCycle === 'monthly' ? text.currentPlan : null,
        icon: Zap,
        color: 'purple',
        features: text.premiumFeatures,
      },
      {
        id: 'annual_student',
        name: text.annualPlan,
        description: text.annualDesc,
        monthlyPrice: 59,
        annualPrice: 399,
        period: text.perYear,
        badge: text.bestValue,
        icon: ShieldCheck,
        color: 'green',
        features: text.annualFeatures,
        forceAnnual: true,
      },
    ],
    [text, billingCycle]
  );

  const getBasePrice = (plan) => {
    if (plan.forceAnnual) return plan.annualPrice;
    return billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  };

  const getFinalPrice = (plan) => {
    const base = getBasePrice(plan);
    if (base === 0) return 0;
    return Math.round(base * (1 - discount / 100));
  };

  const getMonthlyEquivalent = (plan) => {
    if (plan.forceAnnual || billingCycle === 'annual') {
      return Math.round(getFinalPrice(plan) / 12);
    }
    return getFinalPrice(plan);
  };

  const colorClasses = {
    gray: {
      border: 'border-gray-200',
      badge: 'bg-gray-100 text-gray-700',
      icon: 'bg-gray-100 text-gray-700',
      button: 'bg-gray-800 hover:bg-gray-900 text-white',
      price: 'text-gray-900',
    },
    blue: {
      border: 'border-blue-500',
      badge: 'bg-blue-600 text-white',
      icon: 'bg-blue-100 text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      price: 'text-blue-700',
    },
    purple: {
      border: 'border-purple-300',
      badge: 'bg-purple-600 text-white',
      icon: 'bg-purple-100 text-purple-700',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
      price: 'text-purple-700',
    },
    green: {
      border: 'border-green-500',
      badge: 'bg-green-600 text-white',
      icon: 'bg-green-100 text-green-700',
      button: 'bg-green-600 hover:bg-green-700 text-white',
      price: 'text-green-700',
    },
  };

  const applyPromoCode = () => {
    const code = promoCode.trim().toLowerCase();

    if (!code) return;

    if (code === 'medstudent') {
      setDiscount(20);
      return;
    }

    if (code === 'welcome10') {
      setDiscount(10);
      return;
    }

    if (code === 'exam25') {
      setDiscount(25);
      return;
    }

    setDiscount(0);
    alert(text.invalidPromo);
  };

  const handleSubscription = async (plan) => {
    setPaymentError('');
    setSuccess(false);

    if (!user) {
      navigate('/login', {
        state: {
          from: {
            pathname: '/subscription',
          },
        },
      });
      return;
    }

    if (plan.id === 'free') {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1200);
      return;
    }

    setLoadingPlan(plan.id);

    try {
      const planRouteMap = {
        student_plus: 'etudiant',
        premium: 'premium',
        annual_student: 'annuel',
        free: 'free',
      };

      const routePlan = planRouteMap[plan.id] || plan.id;

      const queryParams = new URLSearchParams({
        discount: String(discount || 0),
        amount: String(getFinalPrice(plan)),
        currency: 'MAD',
        billingCycle: plan.forceAnnual ? 'annual' : billingCycle,
      });

      navigate(`/payment/${routePlan}?${queryParams.toString()}`);
    } catch (error) {
      console.error('Subscription error:', error);
      setPaymentError(error.message || text.paymentErrorMessage);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4 py-12 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      {(paymentError || success) && (
        <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2">
          {paymentError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-xl">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900">{text.paymentErrorTitle}</h3>
                  <p className="mt-1 text-sm text-amber-800">{paymentError}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentError('')}
                      className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200"
                    >
                      {text.close}
                    </button>
                    <NavLink
                      to="/contact"
                      className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                    >
                      {text.contactUs}
                    </NavLink>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentError('')}
                  className="text-amber-700 hover:text-amber-900"
                  aria-label={text.close}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-xl">
              <div className="flex items-center gap-3 text-green-800">
                <CheckCircle className="h-6 w-6" />
                <p className="font-semibold">{text.success}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <section className="mx-auto max-w-6xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
          <GraduationCap className="h-4 w-4" />
          {text.badge}
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight text-gray-900 md:text-6xl">
          {text.title}
        </h1>

        <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-gray-600">
          {text.subtitle}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <Users className="h-4 w-4 text-blue-600" />
            {text.trusted}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            {text.guarantee}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <CreditCard className="h-4 w-4 text-purple-600" />
            {text.securePayment}
          </span>
        </div>

        <div className="mt-10 inline-flex rounded-2xl bg-gray-100 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-xl px-6 py-3 font-semibold transition ${
              billingCycle === 'monthly'
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {text.monthly}
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`rounded-xl px-6 py-3 font-semibold transition ${
              billingCycle === 'annual'
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {text.annual}
            <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              {text.saveAnnual}
            </span>
          </button>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const colors = colorClasses[plan.color];
            const isSelected = selectedPlan === plan.id;
            const price = getFinalPrice(plan);

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border-2 bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl ${
                  isSelected ? colors.border : 'border-gray-200'
                } ${plan.id === 'student_plus' ? 'lg:scale-105' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-bold shadow ${colors.badge}`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${colors.icon}`}>
                  <Icon className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                <p className="mt-2 min-h-[48px] text-sm leading-relaxed text-gray-600">
                  {plan.description}
                </p>

                <div className="mt-6">
                  {discount > 0 && getBasePrice(plan) > 0 && (
                    <div className="mb-1 text-sm text-gray-400 line-through">
                      {getBasePrice(plan)} {text.dhs}
                    </div>
                  )}

                  <div className={`text-4xl font-extrabold ${colors.price}`}>
                    {price === 0 ? '0' : price}
                    <span className="ml-1 text-base font-semibold text-gray-500">{text.dhs}</span>
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    {price === 0 ? text.freeDesc : plan.period}
                  </div>

                  {price > 0 && (plan.forceAnnual || billingCycle === 'annual') && (
                    <div className="mt-2 text-xs font-medium text-green-700">
                      ≈ {getMonthlyEquivalent(plan)} {text.dhs} {text.perMonth}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSubscription(plan);
                  }}
                  disabled={loadingPlan === plan.id}
                  className={`mt-6 w-full rounded-xl px-4 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${colors.button}`}
                >
                  {loadingPlan === plan.id ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {language === 'fr' ? 'Traitement...' : 'جاري المعالجة...'}
                    </span>
                  ) : (
                    text.choosePlan
                  )}
                </button>

                <div className="mt-6 flex-1">
                  <p className="mb-3 font-bold text-gray-900">{text.included}</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm text-gray-700">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-xl rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">🎓 {text.promoTitle}</h2>
          <p className="mt-2 text-sm text-gray-500">
            MEDSTUDENT = 20%, WELCOME10 = 10%, EXAM25 = 25%
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            placeholder={text.promoPlaceholder}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <button
            type="button"
            onClick={applyPromoCode}
            className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            {text.apply}
          </button>
        </div>

        {discount > 0 && (
          <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-center font-semibold text-green-700">
            {text.promoApplied} : -{discount}%
          </div>
        )}
      </section>

      <section className="mx-auto mt-16 max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-gray-900">{text.comparisonTitle}</h2>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: GraduationCap, title: text.studentPrice, desc: '49 MAD / mois dès la formule Étudiant Plus' },
            { icon: Sparkles, title: 'IA intégrée', desc: 'Quiz IA, flashcards IA depuis PDF et assistant DocBuddy' },
            { icon: ShieldCheck, title: text.support, desc: 'Une plateforme pensée pour les révisions médicales' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-center text-3xl font-bold text-gray-900">{text.faqTitle}</h2>

        <div className="mt-8 space-y-4">
          {text.faq.map((item) => (
            <details key={item.q} className="rounded-2xl bg-white p-5 shadow-md">
              <summary className="cursor-pointer font-bold text-gray-900">{item.q}</summary>
              <p className="mt-3 leading-relaxed text-gray-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-4xl text-center">
        <div className="rounded-3xl bg-gray-900 p-8 text-white shadow-xl">
          <div className="mb-4 flex justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>

          <p className="text-lg font-medium">
            {language === 'fr'
              ? 'Une seule plateforme pour centraliser vos cours, vos quiz, vos flashcards et votre progression.'
              : 'منصة واحدة لتجميع الدروس والاختبارات والبطاقات التعليمية وتتبع التقدم.'}
          </p>

          <div className="mt-6 text-sm text-gray-300">
            {text.termsStart}{' '}
            <NavLink to="/terms" className="font-semibold text-white underline">
              {text.terms}
            </NavLink>{' '}
            {language === 'fr' ? 'et notre' : 'و'}{' '}
            <NavLink to="/privacy" className="font-semibold text-white underline">
              {text.privacy}
            </NavLink>
            .
          </div>
        </div>

        <NavLink
          to="/login"
          className="mt-8 inline-flex items-center font-semibold text-blue-700 hover:text-blue-900"
        >
          {isRTL ? text.backLogin : `← ${text.backLogin}`}
        </NavLink>
      </section>
    </main>
  );
};

export default Subscription;