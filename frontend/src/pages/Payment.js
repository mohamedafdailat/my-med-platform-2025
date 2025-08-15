import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

// Hypothetical AuthContext for user authentication
const AuthContext = React.createContext();

const Payment = () => {
  const { language } = useLanguage();
  const { plan } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cardNumberRef = useRef();

  // State management with real-time validation and error handling
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: '',
    email: '',
    billingAddress: '',
    city: '',
    postalCode: '',
    country: 'MA',
    saveCard: false,
    acceptTerms: false
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardType, setCardType] = useState('');
  const [showSummary, setShowSummary] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [step, setStep] = useState(1);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [userEnteredCode, setUserEnteredCode] = useState('');
  const [timer, setTimer] = useState(120);
  const [error, setError] = useState(null); // Added for local error display

  // Access user from AuthContext
  const { user } = useContext(AuthContext);

  // Fetch discount from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const discountParam = urlParams.get('discount');
    if (discountParam) {
      setDiscount(parseInt(discountParam));
    }
  }, [location]);

  // Timer for security code
  useEffect(() => {
    if (step === 3 && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setSecurityCode(''); // Reset code if timer expires
    }
  }, [step, timer]);

  const plans = {
    mensuel: { 
      price: 29.99, 
      originalPrice: 39.99,
      duration: language === 'fr' ? '1 mois' : 'شهر واحد',
      billingCycle: language === 'fr' ? 'Facturation mensuelle' : 'فوترة شهرية',
      features: language === 'fr' ? [
        'Accès complet à tous les cours médicaux',
        'Quiz interactifs et évaluations',
        'Flashcards personnalisées',
        'Support technique 24/7',
        'Certificats de formation',
        'Application mobile incluse'
      ] : [
        'وصول كامل لجميع الدورات الطبية',
        'اختبارات تفاعلية وتقييمات',
        'بطاقات تعليمية مخصصة',
        'دعم فني على مدار الساعة',
        'شهادات التدريب',
        'تطبيق الجوال مضمن'
      ]
    },
    annuel: { 
      price: 299.99, 
      originalPrice: 479.88,
      duration: language === 'fr' ? '12 mois' : '12 شهرًا',
      billingCycle: language === 'fr' ? 'Facturation annuelle' : 'فوترة سنوية',
      savings: language === 'fr' ? 'Économisez 179€ (37%)' : 'وفر 179€ (37%)',
      features: language === 'fr' ? [
        'Tous les avantages du plan mensuel',
        'Accès aux webinaires exclusifs',
        'Mentorat personnalisé inclus',
        'Contenu premium et mises à jour',
        'Accès prioritaire aux nouvelles fonctionnalités',
        'Garantie satisfait ou remboursé 30 jours',
        'Support prioritaire VIP'
      ] : [
        'جميع مزايا الخطة الشهرية',
        'وصول للندوات الحصرية',
        'إرشاد شخصي مضمن',
        'محتوى متميز وتحديثات',
        'وصول أولوي للميزات الجديدة',
        'ضمان استرداد المال لمدة 30 يومًا',
        'دعم VIP ذو أولوية'
      ]
    },
    etudiant: {
      price: 19.99,
      originalPrice: 29.99,
      duration: language === 'fr' ? '1 mois' : 'شهر واحد',
      billingCycle: language === 'fr' ? 'Tarif étudiant spécial' : 'سعر خاص للطلاب',
      savings: language === 'fr' ? 'Réduction étudiante 33%' : 'خصم الطلاب 33%',
      features: language === 'fr' ? [
        'Accès complet aux cours de base',
        'Quiz et flashcards illimités',
        'Support email prioritaire',
        'Certificats de participation',
        'Groupes d\'étude virtuels'
      ] : [
        'وصول كامل للدورات الأساسية',
        'اختبارات وبطاقات تعليمية غير محدودة',
        'دعم بريد إلكتروني ذو أولوية',
        'شهادات المشاركة',
        'مجموعات دراسة افتراضية'
      ]
    }
  };

  const selectedPlan = plans[plan] || plans.mensuel;

  // Card type detection
  const detectCardType = (number) => {
    const cleanNumber = number.replace(/\D/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6/.test(cleanNumber)) return 'discover';
    return '';
  };

  // Advanced real-time validation
  const validateField = (field, value) => {
    let error = '';
    switch (field) {
      case 'cardNumber':
        const cleanCardNumber = value.replace(/\s/g, '');
        if (!cleanCardNumber) {
          error = language === 'fr' ? 'Numéro de carte requis' : 'رقم البطاقة مطلوب';
        } else if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
          error = language === 'fr' ? 'Numéro de carte invalide' : 'رقم البطاقة غير صالح';
        }
        break;
      case 'expiryDate':
        if (!value) {
          error = language === 'fr' ? 'Date d\'expiration requise' : 'تاريخ الانتهاء مطلوب';
        } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
          error = language === 'fr' ? 'Format invalide (MM/AA)' : 'تنسيق غير صالح (MM/AA)';
        } else {
          const [month, year] = value.split('/');
          const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
          if (expiry < new Date()) {
            error = language === 'fr' ? 'Carte expirée' : 'البطاقة منتهية الصلاحية';
          }
        }
        break;
      case 'cvv':
        if (!value) {
          error = language === 'fr' ? 'CVV requis' : 'CVV مطلوب';
        } else if (value.length < 3 || value.length > 4) {
          error = language === 'fr' ? 'CVV invalide' : 'CVV غير صالح';
        }
        break;
      case 'cardHolder':
        if (!value.trim()) {
          error = language === 'fr' ? 'Nom du titulaire requis' : 'اسم حامل البطاقة مطلوب';
        } else if (value.trim().length < 2) {
          error = language === 'fr' ? 'Nom trop court' : 'الاسم قصير جداً';
        }
        break;
      case 'email':
        if (!value) {
          error = language === 'fr' ? 'Email requis' : 'البريد الإلكتروني مطلوب';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = language === 'fr' ? 'Email invalide' : 'بريد إلكتروني غير صالح';
        }
        break;
      case 'securityCode':
        if (!value || value.length !== 6) {
          error = language === 'fr' ? 'Code de sécurité invalide' : 'رمز الأمان غير صالح';
        }
        break;
    }
    return error;
  };

  // Intelligent field formatting
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
      setCardType(detectCardType(value));
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, cardType === 'amex' ? 4 : 3);
    } else if (field === 'postalCode') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 5);
    } else if (field === 'userEnteredCode') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 6);
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Real-time validation
    const error = validateField(field, formattedValue);
    setErrors(prev => ({
      ...prev,
      [field]: error || (field === 'userEnteredCode' ? validateField('securityCode', formattedValue) : '')
    }));
  };

  const calculateFinalPrice = () => {
    const basePrice = selectedPlan.price;
    const discountAmount = (basePrice * discount) / 100;
    return (basePrice - discountAmount).toFixed(2);
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (paymentMethod === 'card') {
        ['cardNumber', 'expiryDate', 'cvv', 'cardHolder'].forEach(field => {
          const error = validateField(field, formData[field]);
          if (error) newErrors[field] = error;
        });
      }
      const emailError = validateField('email', formData.email);
      if (emailError) newErrors.email = emailError;
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = language === 'fr' 
          ? 'Vous devez accepter les conditions' 
          : 'يجب قبول الشروط';
      }
    } else if (currentStep === 3) {
      if (!userEnteredCode || userEnteredCode !== securityCode) {
        newErrors.securityCode = language === 'fr' 
          ? 'Code de sécurité incorrect' 
          : 'رمز الأمان غير صحيح';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      if (step === 1) {
        setSecurityCode(Math.floor(100000 + Math.random() * 900000).toString());
        setTimer(120);
      } else if (step === 3 && validateStep(3)) {
        handlePayment();
      }
      setStep(prev => prev + 1);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null); // Clear any previous error

    try {
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          paymentMethod,
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          cardHolder: formData.cardHolder,
          email: formData.email,
          amount: calculateFinalPrice()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Rediriger vers la page d'erreur avec les détails
        const errorParams = new URLSearchParams({
          error: result.error_code || 'PAYMENT_FAILED',
          error_description: result.message || 'Une erreur est survenue lors du traitement du paiement'
        });
        navigate(`/payment-error?${errorParams.toString()}`);
        return;
      }

      // Paiement réussi
      navigate('/subscription?success=true', { 
        state: { 
          plan: plan,
          amount: calculateFinalPrice(),
          method: paymentMethod
        } 
      });
    } catch (error) {
      console.error('Payment error:', error);
      
      // Rediriger vers la page d'erreur générique
      const errorParams = new URLSearchParams({
        error: 'NETWORK_ERROR',
        error_description: 'Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.'
      });
      navigate(`/payment-error?${errorParams.toString()}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendCode = () => {
    setSecurityCode(Math.floor(100000 + Math.random() * 900000).toString());
    setTimer(120);
    setUserEnteredCode('');
  };

  // Current date and time
  const currentDateTime = new Date('2025-08-14T01:12:00+01:00'); // Updated to current date and time
  const formattedDateTime = language === 'fr'
    ? currentDateTime.toLocaleString('fr-FR', { timeZone: 'Africa/Algiers', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : currentDateTime.toLocaleString('ar-MA', { timeZone: 'Africa/Algiers', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const t = {
    fr: {
      title: 'Paiement Sécurisé',
      subtitle: 'Finalisez votre abonnement en toute sécurité',
      orderSummary: 'Résumé de commande',
      paymentMethod: 'Méthode de paiement',
      cardInfo: 'Informations de carte',
      billingInfo: 'Informations de facturation',
      securityVerification: 'Vérification de sécurité',
      cardNumber: 'Numéro de carte',
      expiryDate: 'Date d\'expiration',
      cardHolder: 'Nom du titulaire',
      email: 'Adresse email',
      billingAddress: 'Adresse de facturation',
      city: 'Ville',
      postalCode: 'Code postal',
      country: 'Pays',
      saveCard: 'Enregistrer cette carte',
      acceptTerms: 'J\'accepte les conditions générales',
      subtotal: 'Sous-total',
      discount: 'Réduction',
      total: 'Total',
      processing: 'Traitement en cours...',
      nextStep: 'Continuer',
      payNow: 'Payer maintenant',
      cancel: 'Annuler',
      guarantee: 'Garantie satisfait ou remboursé 30 jours',
      securePayment: 'Paiement 100% sécurisé',
      securityCodeSent: 'Code de sécurité envoyé à votre email',
      enterSecurityCode: 'Saisissez le code de sécurité',
      verifyCode: 'Vérifier le code',
      resendCode: 'Renvoyer le code',
      timeRemaining: 'Temps restant',
      paymentSuccess: 'Paiement réussi !',
      redirecting: 'Redirection vers votre compte...',
      minutes: 'min',
      seconds: 'sec',
      updated: 'Mis à jour le',
      errorTitle: 'Erreur de paiement'
    },
    ar: {
      title: 'دفع آمن',
      subtitle: 'أكمل اشتراكك بأمان',
      orderSummary: 'ملخص الطلب',
      paymentMethod: 'طريقة الدفع',
      cardInfo: 'معلومات البطاقة',
      billingInfo: 'معلومات الفوترة',
      securityVerification: 'التحقق الأمني',
      cardNumber: 'رقم البطاقة',
      expiryDate: 'تاريخ الانتهاء',
      cardHolder: 'اسم حامل البطاقة',
      email: 'عنوان البريد الإلكتروني',
      billingAddress: 'عنوان الفوترة',
      city: 'المدينة',
      postalCode: 'الرمز البريدي',
      country: 'البلد',
      saveCard: 'حفظ هذه البطاقة',
      acceptTerms: 'أوافق على الشروط والأحكام',
      subtotal: 'المجموع الفرعي',
      discount: 'الخصم',
      total: 'الإجمالي',
      processing: 'جاري المعالجة...',
      nextStep: 'متابعة',
      payNow: 'ادفع الآن',
      cancel: 'إلغاء',
      guarantee: 'ضمان استرداد المال لمدة 30 يومًا',
      securePayment: 'دفع آمن 100%',
      securityCodeSent: 'تم إرسال رمز الأمان إلى بريدك الإلكتروني',
      enterSecurityCode: 'أدخل رمز الأمان',
      verifyCode: 'التحقق من الرمز',
      resendCode: 'إعادة إرسال الرمز',
      timeRemaining: 'الوقت المتبقي',
      paymentSuccess: 'تم الدفع بنجاح!',
      redirecting: 'جاري التوجيه إلى حسابك...',
      minutes: 'دقيقة',
      seconds: 'ثانية',
      updated: 'تم التحديث في',
      errorTitle: 'خطأ في الدفع'
    }
  }[language];

  const getCardIcon = () => {
    const icons = {
      visa: '💳 Visa',
      mastercard: '💳 Mastercard',
      amex: '💳 Amex',
      discover: '💳 Discover'
    };
    return icons[cardType] || '💳';
  };

  // Local error display
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {t.errorTitle}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/payment-error')}
                className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
              >
                {language === 'fr' ? 'Voir les solutions' : 'عرض الحلول'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`payment-container ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header with progress */}
      <div className="payment-header">
        <h1 className="payment-title">{t.title}</h1>
        <p className="payment-subtitle">{t.subtitle}</p>
        
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>{t.paymentMethod}</span>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>{t.securityVerification}</span>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>✓</span>
          </div>
        </div>
      </div>

      <div className="payment-content">
        {/* Order Summary - Sticky */}
        <div className="order-summary">
          <h2>{t.orderSummary}</h2>
          
          <div className="plan-card">
            <h3>
              {language === 'fr' ? `Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : `خطة ${plan}`}
            </h3>
            <p className="plan-duration">{selectedPlan.duration}</p>
            <p className="billing-cycle">{selectedPlan.billingCycle}</p>
            {selectedPlan.savings && (
              <div className="savings-badge">🔥 {selectedPlan.savings}</div>
            )}
          </div>

          <div className="price-breakdown">
            <div className="price-line">
              <span>{t.subtotal}</span>
              <span className="original-price">{selectedPlan.originalPrice}€</span>
            </div>
            {discount > 0 && (
              <div className="price-line">
                <span>{t.discount} ({discount}%)</span>
                <span className="discount-amount">-{((selectedPlan.price * discount) / 100).toFixed(2)}€</span>
              </div>
            )}
            <div className="price-line total-line">
              <span>{t.total}</span>
              <span className="final-price">{calculateFinalPrice()}€</span>
            </div>
          </div>

          <div className="features-included">
            <h4>{language === 'fr' ? 'Inclus dans votre plan :' : 'مشمول في خطتك:'}</h4>
            <ul>
              {selectedPlan.features.slice(0, 4).map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
              {selectedPlan.features.length > 4 && (
                <li className="more-features">
                  +{selectedPlan.features.length - 4} {language === 'fr' ? 'autres avantages' : 'مزايا أخرى'}
                </li>
              )}
            </ul>
          </div>

          <div className="security-badges">
            <div className="badge">🔒 SSL</div>
            <div className="badge">🛡️ {t.securePayment}</div>
            <div className="badge">💰 {t.guarantee}</div>
          </div>
          <p className="update-info text-sm text-gray-500 mt-2">
            {t.updated}: {formattedDateTime}
          </p>
        </div>

        {/* Main Payment Form */}
        <div className="payment-form-container">
          {/* Step 1: Payment Information */}
          {step === 1 && (
            <div className="payment-step">
              <div className="payment-methods">
                <h2>{t.paymentMethod}</h2>
                <div className="method-grid">
                  <div 
                    className={`method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="method-icon">💳</div>
                    <h3>{language === 'fr' ? 'Carte bancaire' : 'بطاقة بنكية'}</h3>
                    <p>{language === 'fr' ? 'Visa, Mastercard, AMEX' : 'فيزا، ماستركارد، أمكس'}</p>
                  </div>
                  <div 
                    className={`method-card ${paymentMethod === 'paypal' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    <div className="method-icon">🅿️</div>
                    <h3>PayPal</h3>
                    <p>{language === 'fr' ? 'Paiement sécurisé via PayPal' : 'دفع آمن عبر PayPal'}</p>
                  </div>
                  <div 
                    className={`method-card ${paymentMethod === 'apple' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('apple')}
                  >
                    <div className="method-icon">🍎</div>
                    <h3>Apple Pay</h3>
                    <p>{language === 'fr' ? 'Paiement rapide et sécurisé' : 'دفع سريع وآمن'}</p>
                  </div>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="card-form">
                  <h3>{t.cardInfo}</h3>
                  <div className="form-group">
                    <label>{t.cardNumber}</label>
                    <div className="card-input-wrapper">
                      <input
                        ref={cardNumberRef}
                        type="text"
                        className={`form-input ${errors.cardNumber ? 'error' : ''}`}
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        maxLength={19}
                      />
                      <div className="card-type-icon">{getCardIcon()}</div>
                    </div>
                    {errors.cardNumber && <span className="error-message">{errors.cardNumber}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t.expiryDate}</label>
                      <input
                        type="text"
                        className={`form-input ${errors.expiryDate ? 'error' : ''}`}
                        placeholder="MM/AA"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                        maxLength={5}
                      />
                      {errors.expiryDate && <span className="error-message">{errors.expiryDate}</span>}
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="text"
                        className={`form-input ${errors.cvv ? 'error' : ''}`}
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                        maxLength={cardType === 'amex' ? 4 : 3}
                      />
                      {errors.cvv && <span className="error-message">{errors.cvv}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.cardHolder}</label>
                    <input
                      type="text"
                      className={`form-input ${errors.cardHolder ? 'error' : ''}`}
                      placeholder={language === 'fr' ? 'Nom complet' : 'الاسم الكامل'}
                      value={formData.cardHolder}
                      onChange={(e) => handleInputChange('cardHolder', e.target.value)}
                    />
                    {errors.cardHolder && <span className="error-message">{errors.cardHolder}</span>}
                  </div>
                </div>
              )}

              <div className="billing-form">
                <h3>{t.billingInfo}</h3>
                <div className="form-group">
                  <label>{t.email}</label>
                  <input
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="exemple@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label>{t.billingAddress}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={language === 'fr' ? 'Adresse complète' : 'العنوان الكامل'}
                    value={formData.billingAddress}
                    onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t.city}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === 'fr' ? 'Casablanca' : 'الدار البيضاء'}
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.postalCode}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="20000"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="payment-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.saveCard}
                    onChange={(e) => setFormData(prev => ({ ...prev, saveCard: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  {t.saveCard}
                </label>
                <label className="checkbox-label required">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  {t.acceptTerms} <NavLink to="/terms">{language === 'fr' ? 'Voir les conditions' : 'عرض الشروط'}</NavLink>
                </label>
                {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}
              </div>

              <div className="step-actions">
                <button 
                  onClick={handleNextStep}
                  className="next-button"
                  disabled={isProcessing}
                >
                  {t.nextStep} →
                </button>
                <NavLink to="/subscription" className="cancel-link">{t.cancel}</NavLink>
              </div>
            </div>
          )}

          {/* Step 2: Processing */}
          {step === 2 && (
            <div className="processing-step">
              <div className="processing-animation">
                <div className="loading-spinner"></div>
                <h3>{t.processing}</h3>
                <p>{language === 'fr' ? 'Vérification de vos informations...' : 'جاري التحقق من معلوماتك...'}</p>
              </div>
            </div>
          )}

          {/* Step 3: Security Verification */}
          {step === 3 && !paymentSuccess && (
            <div className="security-step">
              <h3>{t.securityVerification}</h3>
              <p>{t.securityCodeSent}</p>
              <div className="form-group">
                <label>{t.enterSecurityCode}</label>
                <input
                  type="text"
                  className={`form-input ${errors.securityCode ? 'error' : ''}`}
                  placeholder="123456"
                  value={userEnteredCode}
                  onChange={(e) => handleInputChange('userEnteredCode', e.target.value)}
                  maxLength={6}
                />
                {errors.securityCode && <span className="error-message">{errors.securityCode}</span>}
              </div>
              <p>{t.timeRemaining}: {Math.floor(timer / 60)} {t.minutes} {timer % 60} {t.seconds}</p>
              {timer > 0 ? (
                <button 
                  onClick={handleResendCode}
                  className="resend-button"
                  disabled={timer > 0}
                >
                  {t.resendCode}
                </button>
              ) : (
                <p className="resend-note">{language === 'fr' ? 'Le code a expiré. Veuillez demander un nouveau.' : 'انتهى الرمز. يرجى طلب جديد.'}</p>
              )}
              <div className="step-actions">
                <button 
                  onClick={handleNextStep}
                  className="next-button"
                  disabled={isProcessing || !securityCode}
                >
                  {t.verifyCode} →
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="back-button"
                >
                  ← {language === 'fr' ? 'Retour' : 'رجوع'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment Success */}
          {paymentSuccess && (
            <div className="success-step">
              <div className="success-animation">
                <div className="success-checkmark">✓</div>
                <h3>{t.paymentSuccess}</h3>
                <p>{t.redirecting}</p>
                <div className="loading-spinner small"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .payment-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: 'Arial', sans-serif;
          direction: ${language === 'ar' ? 'rtl' : 'ltr'};
        }

        .rtl .method-grid, .rtl .form-row, .rtl .step-actions {
          direction: ltr;
        }

        .payment-header {
          text-align: center;
          margin-bottom: 40px;
          animation: fadeIn 0.5s ease-in;
        }

        .payment-title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .payment-subtitle {
          color: #27ae60;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .progress-bar {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          position: relative;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .progress-step {
          flex: 1;
          text-align: center;
          color: #95a5a6;
          font-size: 0.9rem;
        }

        .progress-step.active {
          color: #27ae60;
          font-weight: 600;
        }

        .step-number {
          width: 30px;
          height: 30px;
          background: #ecf0f1;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 5px;
          transition: background 0.3s ease;
        }

        .progress-step.active .step-number {
          background: #27ae60;
          color: white;
        }

        .payment-content {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 40px;
          align-items: start;
        }

        .order-summary {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          position: sticky;
          top: 20px;
        }

        .plan-card h3 {
          color: #3498db;
          font-size: 1.3rem;
          margin-bottom: 5px;
        }

        .plan-duration, .billing-cycle {
          color: #7f8c8d;
          font-size: 1rem;
          margin: 5px 0;
        }

        .savings-badge {
          background: #e74c3c;
          color: white;
          padding: 5px 10px;
          border-radius: 10px;
          display: inline-block;
          font-size: 0.9rem;
          margin-top: 10px;
        }

        .price-breakdown {
          margin: 20px 0;
        }

        .price-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .total-line {
          font-weight: 700;
          color: #27ae60;
          font-size: 1.2rem;
          border-top: 1px solid #e0e0e0;
          padding-top: 10px;
        }

        .original-price {
          text-decoration: line-through;
          color: #95a5a6;
        }

        .discount-amount {
          color: #e74c3c;
        }

        .features-included ul {
          list-style: none;
          padding: 0;
        }

        .features-included li {
          color: #27ae60;
          margin-bottom: 8px;
        }

        .more-features {
          color: #3498db;
        }

        .security-badges {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .badge {
          background: #27ae60;
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .update-info {
          font-style: italic;
          text-align: center;
        }

        .payment-form-container {
          padding: 20px;
        }

        .payment-step, .security-step, .success-step {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          animation: slideUp 0.5s ease-out;
        }

        .payment-methods h2, .card-form h3, .billing-form h3, .security-step h3 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }

        .method-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .method-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .method-card:hover {
          background: #ecf0f1;
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .method-card.selected {
          background: #27ae60;
          color: white;
        }

        .method-card.selected:hover {
          background: #219653;
        }

        .method-icon {
          font-size: 2rem;
          margin-bottom: 10px;
        }

        .card-form, .billing-form {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          color: #34495e;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .card-input-wrapper {
          position: relative;
        }

        .card-type-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #7f8c8d;
        }

        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-input:focus {
          border-color: #27ae60;
          outline: none;
        }

        .form-input.error {
          border-color: #e74c3c;
        }

        .error-message {
          color: #e74c3c;
          font-size: 0.9rem;
          margin-top: 5px;
          display: block;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .payment-options {
          margin: 20px 0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          color: #34495e;
          margin-bottom: 10px;
        }

        .checkbox-label input {
          margin-right: 10px;
        }

        .checkmark {
          width: 18px;
          height: 18px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 4px;
          margin-right: 8px;
          position: relative;
          transition: all 0.3s ease;
        }

        .checkbox-label input:checked ~ .checkmark {
          background: #27ae60;
          border-color: #27ae60;
        }

        .checkbox-label input:checked ~ .checkmark:after {
          content: '';
          position: absolute;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          top: 2px;
          left: 6px;
        }

        .required .checkmark {
          border-color: #e74c3c;
        }

        .step-actions {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }

        .next-button, .back-button {
          background: #27ae60;
          color: white;
          padding: 12px 25px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .next-button:hover:not(:disabled), .back-button:hover {
          background: #219653;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
        }

        .next-button:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }

        .cancel-link {
          color: #e74c3c;
          text-decoration: none;
          font-weight: 600;
          align-self: center;
        }

        .cancel-link:hover {
          text-decoration: underline;
        }

        .processing-step, .security-step, .success-step {
          text-align: center;
          padding: 40px;
        }

        .processing-animation, .success-animation {
          animation: fadeIn 0.5s ease-in;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #ffffff40;
          border-top: 4px solid #27ae60;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .loading-spinner.small {
          width: 20px;
          height: 20px;
          margin: 0 auto;
        }

        .success-checkmark {
          font-size: 3rem;
          color: #27ae60;
          margin-bottom: 20px;
        }

        .security-step p {
          color: #34495e;
          margin-bottom: 15px;
        }

        .resend-button {
          background: #3498db;
          color: white;
          padding: 8px 15px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .resend-button:hover {
          background: #2980b9;
        }

        .resend-note {
          color: #e74c3c;
          font-size: 0.9rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 768px) {
          .payment-content {
            grid-template-columns: 1fr;
          }

          .order-summary {
            position: static;
            margin-bottom: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .method-grid {
            grid-template-columns: 1fr;
          }

          .step-actions {
            flex-direction: column;
            gap: 10px;
          }

          .next-button, .back-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// Auth Provider (to be used in a parent component, e.g., App.js)
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Example user state, replace with your auth logic

  useEffect(() => {
    // Simulate fetching user from auth service
    const fetchUser = async () => {
      // Replace with actual auth logic (e.g., from localStorage, API, etc.)
      const mockUser = {
        role: 'user',
        subscriptionStatus: 'free' // Example: 'free', 'paid', etc.
      };
      setUser(mockUser);
    };
    fetchUser();
  }, []);

  const checkSubscriptionAccess = (requiredFeature) => {
    if (!user) {
      throw new Error('USER_NOT_AUTHENTICATED');
    }

    if (user.role === 'admin') {
      return true; // Admin has access to everything
    }

    if (user.subscriptionStatus !== 'paid') {
      // Throw a specific error
      const error = new Error('SUBSCRIPTION_REQUIRED');
      error.details = {
        feature: requiredFeature,
        userStatus: user.subscriptionStatus,
        redirectUrl: '/subscription'
      };
      throw error;
    }

    return true;
  };

  return (
    <AuthContext.Provider value={{ user, checkSubscriptionAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export both components
export { AuthProvider, Payment as default };