import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const Subscription = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [showComparison, setShowComparison] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [testimonials, setTestimonials] = useState([]);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Gestion du succès
    if (urlParams.get('success')) {
      setSuccess(true);
      const timer = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(timer);
    }

    // Gestion des erreurs de paiement
    if (urlParams.get('payment_error')) {
      setPaymentError({
        code: urlParams.get('error_code') || 'PAYMENT_FAILED',
        message: urlParams.get('error_message') || 'Une erreur est survenue lors du paiement'
      });
    }

    loadTestimonials();
  }, []);

  const loadTestimonials = () => {
    const mockTestimonials = [
      {
        id: 1,
        name: language === 'fr' ? 'Dr. Sarah Martin' : 'د. سارة مارتن',
        specialty: language === 'fr' ? 'Cardiologue' : 'طبيب قلب',
        comment: language === 'fr' 
          ? 'Cette plateforme a révolutionné ma formation continue. Les cours sont excellents!'
          : 'لقد غيرت هذه المنصة تعليمي المستمر. الدورات ممتازة!',
        rating: 5,
        avatar: '👩‍⚕️'
      },
      {
        id: 2,
        name: language === 'fr' ? 'Dr. Ahmed Benali' : 'د. أحمد بن علي',
        specialty: language === 'fr' ? 'Neurologue' : 'طبيب أعصاب',
        comment: language === 'fr'
          ? 'Les flashcards et quiz sont parfaits pour réviser. Je recommande vivement!'
          : 'البطاقات التعليمية والاختبارات مثالية للمراجعة. أنصح بشدة!',
        rating: 5,
        avatar: '👨‍⚕️'
      }
    ];
    setTestimonials(mockTestimonials);
  };

  const applyPromoCode = () => {
    setLoading(true);
    setTimeout(() => {
      if (promoCode.toLowerCase() === 'medstudent') {
        setDiscount(30);
      } else if (promoCode.toLowerCase() === 'welcome20') {
        setDiscount(20);
      } else {
        alert(t.invalidPromo);
      }
      setLoading(false);
    }, 1000);
  };

  const calculatePrice = (originalPrice) => {
    if (discount > 0) {
      return (originalPrice * (1 - discount / 100)).toFixed(2);
    }
    return originalPrice;
  };

  const handleSubscription = async (planType) => {
    setLoading(true);
    setPaymentError(null);

    try {
      // Vérifier si l'utilisateur est connecté
      if (!user) {
        navigate('/login?redirect=' + encodeURIComponent('/subscription'));
        return;
      }

      // Simulation d'appel API pour créer une session de paiement
      const response = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          planType,
          discount,
          promoCode,
          userId: user.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Rediriger vers la page d'erreur avec les détails
        const errorParams = new URLSearchParams({
          error: data.error_code || 'PAYMENT_SESSION_FAILED',
          error_description: data.message || 'Impossible de créer la session de paiement'
        });
        
        navigate(`/payment-error?${errorParams.toString()}`);
        return;
      }

      // Rediriger vers la page de paiement ou vers Stripe/PayPal
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        navigate(`/payment/${planType}?session_id=${data.session_id}&discount=${discount}`);
      }

    } catch (error) {
      console.error('Subscription error:', error);
      
      // Gestion des différents types d'erreurs
      let errorCode = 'NETWORK_ERROR';
      let errorMessage = 'Erreur de connexion. Veuillez vérifier votre connexion internet.';

      if (error.name === 'TypeError') {
        errorCode = 'NETWORK_ERROR';
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
      } else if (error.message.includes('timeout')) {
        errorCode = 'TIMEOUT_ERROR';
        errorMessage = 'La requête a pris trop de temps. Veuillez réessayer.';
      }

      setPaymentError({
        code: errorCode,
        message: errorMessage
      });

    } finally {
      setLoading(false);
    }
  };

  const handlePaymentErrorRetry = () => {
    setPaymentError(null);
  };

  const redirectToPaymentError = () => {
    const errorParams = new URLSearchParams({
      error: paymentError.code,
      error_description: paymentError.message
    });
    navigate(`/payment-error?${errorParams.toString()}`);
  };

  const t = {
    fr: {
      title: 'Choisissez Votre Plan',
      subtitle: 'Accédez à plus de 500 heures de contenu médical premium',
      description: 'Rejoignez plus de 10,000 professionnels de santé qui font confiance à notre plateforme.',
      monthly: 'Plan Mensuel',
      monthlyDesc: 'Parfait pour essayer notre plateforme',
      annual: 'Plan Annuel',
      annualDesc: 'Le meilleur rapport qualité-prix',
      student: 'Plan Étudiant',
      studentDesc: 'Tarif spécial pour les étudiants en médecine',
      priceMonthly: '29.99',
      priceAnnual: '299.99',
      priceStudent: '19.99',
      currency: '€',
      save: 'Économisez 17%',
      subscribe: 'Choisir ce plan',
      terms: 'En vous abonnant, vous acceptez nos ',
      termsLink: 'conditions générales',
      success: 'Abonnement réussi !',
      back: 'Retour à la connexion',
      mostPopular: 'Le plus populaire',
      features: 'Fonctionnalités incluses :',
      feature1: '✓ Accès illimité à tous les cours',
      feature2: '✓ Flashcards interactives',
      feature3: '✓ Quiz et évaluations',
      feature4: '✓ Certificats de formation',
      feature5: '✓ Support 24/7',
      feature6: '✓ Mise à jour continue du contenu',
      promoCode: 'Code promo',
      applyPromo: 'Appliquer',
      comparison: 'Comparer les plans',
      testimonials: 'Ce que disent nos utilisateurs',
      invalidPromo: 'Code promo invalide',
      loading: 'Chargement...',
      guarantee: '🛡️ Garantie satisfait ou remboursé 30 jours'
    },
    ar: {
      title: 'اختر خطتك',
      subtitle: 'احصل على أكثر من 500 ساعة من المحتوى الطبي المتميز',
      description: 'انضم إلى أكثر من 10,000 من المهنيين الصحيين الذين يثقون في منصتنا.',
      monthly: 'خطة شهرية',
      monthlyDesc: 'مثالية لتجربة منصتنا',
      annual: 'خطة سنوية',
      annualDesc: 'أفضل قيمة مقابل المال',
      student: 'خطة الطلاب',
      studentDesc: 'سعر خاص لطلاب الطب',
      priceMonthly: '29.99',
      priceAnnual: '299.99',
      priceStudent: '19.99',
      currency: '€',
      save: 'وفر 17%',
      subscribe: 'اختر هذه الخطة',
      terms: 'بالاشتراك، تقبل شروطنا ',
      termsLink: 'الشروط والأحكام',
      success: 'تم الاشتراك بنجاح!',
      back: 'العودة إلى تسجيل الدخول',
      mostPopular: 'الأكثر شعبية',
      features: 'الميزات المتضمنة:',
      feature1: '✓ وصول غير محدود لجميع الدورات',
      feature2: '✓ بطاقات تعليمية تفاعلية',
      feature3: '✓ اختبارات وتقييمات',
      feature4: '✓ شهادات التدريب',
      feature5: '✓ دعم 24/7',
      feature6: '✓ تحديث مستمر للمحتوى',
      promoCode: 'كود الخصم',
      applyPromo: 'تطبيق',
      comparison: 'مقارنة الخطط',
      testimonials: 'ماذا يقول مستخدمونا',
      invalidPromo: 'كود خصم غير صالح',
      loading: 'جاري التحميل...',
      guarantee: '🛡️ ضمان استرداد المال لمدة 30 يومًا'
    },
  }[language];

  return (
    <div className={`page-container min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* Affichage des erreurs de paiement */}
      {paymentError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Erreur de paiement
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>{paymentError.message}</p>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handlePaymentErrorRetry}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={redirectToPaymentError}
                    className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                  >
                    Voir les solutions
                  </button>
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <button
                  onClick={handlePaymentErrorRetry}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Fermer</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 font-medium">✅ {t.success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="pt-20 pb-12 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4 text-gray-800 leading-tight">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 mb-6">{t.subtitle}</p>
          <p className="text-lg text-gray-500 mb-8">{t.description}</p>
          
          <div className="flex justify-center items-center space-x-4 mb-8">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {['👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '👨‍🔬', '👩‍🔬'].map((emoji, i) => (
                  <div key={i} className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white">
                    <span>{emoji}</span>
                  </div>
                ))}
              </div>
              <span className="ml-3 text-gray-600">+10,000 professionnels</span>
            </div>
          </div>

          {/* Plan Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {t.monthly}
              </button>
              <button
                onClick={() => setSelectedPlan('annual')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedPlan === 'annual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {t.annual}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Plan Mensuel */}
          <div className={`bg-white rounded-2xl shadow-lg p-8 border-2 ${selectedPlan === 'monthly' ? 'border-blue-500 transform scale-105' : 'border-gray-200'} hover:shadow-xl transition-all duration-300`}>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t.monthly}</h3>
              <p className="text-gray-600 mb-6">{t.monthlyDesc}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-600">
                  {discount > 0 && (
                    <span className="text-lg text-gray-400 line-through mr-2">
                      {t.priceMonthly}{t.currency}
                    </span>
                  )}
                  {calculatePrice(29.99)}{t.currency}
                </span>
                <span className="text-gray-500 block">/mois</span>
              </div>

              <button
                onClick={() => handleSubscription('mensuel')}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all mb-6 ${
                  loading 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.loading}
                  </span>
                ) : (
                  t.subscribe
                )}
              </button>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-gray-800">{t.features}</p>
              <div className="text-sm text-gray-600 space-y-2">
                <p>{t.feature1}</p>
                <p>{t.feature2}</p>
                <p>{t.feature3}</p>
                <p>{t.feature5}</p>
              </div>
            </div>
          </div>

          {/* Plan Annuel - Most Popular */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-blue-500 transform scale-105 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                {t.mostPopular}
              </span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t.annual}</h3>
              <p className="text-gray-600 mb-4">{t.annualDesc}</p>
              <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                {t.save}
              </span>
              
              <div className="my-6">
                <span className="text-5xl font-bold text-blue-600">
                  {discount > 0 && (
                    <span className="text-lg text-gray-400 line-through mr-2">
                      {t.priceAnnual}{t.currency}
                    </span>
                  )}
                  {calculatePrice(299.99)}{t.currency}
                </span>
                <span className="text-gray-500 block">/an</span>
                <span className="text-sm text-gray-400">~{(calculatePrice(299.99)/12).toFixed(2)}{t.currency}/mois</span>
              </div>

              <button
                onClick={() => handleSubscription('annuel')}
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg font-semibold transition-all mb-6 shadow-lg ${
                  loading 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.loading}
                  </span>
                ) : (
                  t.subscribe
                )}
              </button>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-gray-800">{t.features}</p>
              <div className="text-sm text-gray-600 space-y-2">
                <p>{t.feature1}</p>
                <p>{t.feature2}</p>
                <p>{t.feature3}</p>
                <p>{t.feature4}</p>
                <p>{t.feature5}</p>
                <p>{t.feature6}</p>
              </div>
            </div>
          </div>

          {/* Plan Étudiant */}
          <div className={`bg-white rounded-2xl shadow-lg p-8 border-2 ${selectedPlan === 'student' ? 'border-green-500 transform scale-105' : 'border-gray-200'} hover:shadow-xl transition-all duration-300`}>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t.student}</h3>
              <p className="text-gray-600 mb-6">{t.studentDesc}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-green-600">
                  {discount > 0 && (
                    <span className="text-lg text-gray-400 line-through mr-2">
                      {t.priceStudent}{t.currency}
                    </span>
                  )}
                  {calculatePrice(19.99)}{t.currency}
                </span>
                <span className="text-gray-500 block">/mois</span>
              </div>

              <button
                onClick={() => handleSubscription('etudiant')}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all mb-6 ${
                  loading 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.loading}
                  </span>
                ) : (
                  t.subscribe
                )}
              </button>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-gray-800">{t.features}</p>
              <div className="text-sm text-gray-600 space-y-2">
                <p>{t.feature1}</p>
                <p>{t.feature2}</p>
                <p>{t.feature3}</p>
                <p>{t.feature5}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Code Promo */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-center">🎉 {t.promoCode}</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="MEDSTUDENT, WELCOME20..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={applyPromoCode}
                disabled={loading || !promoCode}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.applyPromo}
              </button>
            </div>
            {discount > 0 && (
              <div className="mt-3 text-center text-green-600 font-semibold">
                🎉 Réduction de {discount}% appliquée !
              </div>
            )}
          </div>
        </div>

        {/* Garantie */}
        <div className="mt-12 text-center">
          <p className="text-lg font-semibold text-gray-700">{t.guarantee}</p>
        </div>

        {/* Témoignages */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">{t.testimonials}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{testimonial.avatar}</span>
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.specialty}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 italic">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced error handling section */}
        {paymentError && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-2">Erreur de traitement</h3>
                <p className="text-red-700 mb-4">{paymentError.message}</p>
                <div className="space-y-2">
                  <button
                    onClick={handlePaymentErrorRetry}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={redirectToPaymentError}
                    className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                  >
                    Voir toutes les solutions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Success Message */}
        <div className="text-center mt-12">
          <div className="text-gray-500 mb-6">
            {t.terms}
            <NavLink to="/terms" className="text-blue-600 hover:text-blue-800 underline ml-1">
              {t.termsLink}
            </NavLink>
            .
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-6 py-4 rounded-lg mb-6 transition-opacity duration-500">
              ✅ {t.success}
            </div>
          )}

          <NavLink to="/login" className="inline-flex items-center text-blue-600 hover:text-blue-800 underline font-medium">
            ← {t.back}
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Subscription;