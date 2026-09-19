import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const Payment = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { plan } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cardNumberRef = useRef(null);

  const isRTL = language === 'ar';

  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: '',
    email: user?.email || '',
    billingAddress: '',
    city: '',
    postalCode: '',
    country: 'MA',
    saveCard: false,
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardType, setCardType] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  const t = useMemo(
    () =>
      ({
        fr: {
          title: 'Paiement sécurisé',
          subtitle: 'Finalisez votre abonnement MedPlatform Maroc',
          orderSummary: 'Résumé de commande',
          paymentMethod: 'Méthode de paiement',
          cardInfo: 'Informations de carte',
          billingInfo: 'Informations de facturation',
          cardNumber: 'Numéro de carte',
          expiryDate: 'Date d’expiration',
          cardHolder: 'Nom du titulaire',
          email: 'Adresse email',
          billingAddress: 'Adresse de facturation',
          city: 'Ville',
          postalCode: 'Code postal',
          country: 'Pays',
          saveCard: 'Enregistrer cette carte pour mes prochains paiements',
          acceptTerms: 'J’accepte les conditions générales',
          seeTerms: 'Voir les conditions',
          subtotal: 'Sous-total',
          discount: 'Réduction',
          total: 'Total',
          continue: 'Continuer',
          cancel: 'Annuler',
          loading: 'Traitement en cours...',
          paymentUnavailable: 'Paiement indisponible',
          paymentUnavailableText:
            'Le paiement en ligne n’est pas encore connecté. Vous pouvez garder cette page prête et connecter Stripe, PayPal, CMI, Payzone ou un paiement local ensuite.',
          close: 'Fermer',
          contactUs: 'Nous contacter',
          backSubscription: 'Retour aux abonnements',
          securePayment: 'Paiement sécurisé',
          guarantee: 'Garantie 7 jours',
          studentFriendly: 'Tarif étudiant',
          included: 'Inclus dans votre plan :',
          otherBenefits: 'autres avantages',
          invalidCard: 'Numéro de carte invalide',
          requiredCard: 'Numéro de carte requis',
          requiredExpiry: 'Date d’expiration requise',
          invalidExpiry: 'Format invalide. Utilisez MM/AA',
          expiredCard: 'Carte expirée',
          requiredCvv: 'CVV requis',
          invalidCvv: 'CVV invalide',
          requiredHolder: 'Nom du titulaire requis',
          requiredEmail: 'Email requis',
          invalidEmail: 'Email invalide',
          termsRequired: 'Vous devez accepter les conditions',
          monthlyPlan: 'Plan Mensuel',
          annualPlan: 'Plan Annuel',
          studentPlan: 'Plan Étudiant',
          monthly: '1 mois',
          annual: '12 mois',
          student: '1 mois étudiant',
          monthlyBilling: 'Facturation mensuelle',
          annualBilling: 'Facturation annuelle',
          studentBilling: 'Tarif spécial étudiant',
          saveAnnual: 'Économisez 150 MAD',
          saveStudent: 'Tarif réduit étudiant',
          cardPayment: 'Carte bancaire',
          cardPaymentDesc: 'Visa, Mastercard',
          paypalPayment: 'PayPal',
          paypalPaymentDesc: 'À connecter plus tard',
          localPayment: 'Paiement local',
          localPaymentDesc: 'CMI, Payzone ou virement',
        },
        ar: {
          title: 'دفع آمن',
          subtitle: 'أكمل اشتراكك في MedPlatform Maroc',
          orderSummary: 'ملخص الطلب',
          paymentMethod: 'طريقة الدفع',
          cardInfo: 'معلومات البطاقة',
          billingInfo: 'معلومات الفوترة',
          cardNumber: 'رقم البطاقة',
          expiryDate: 'تاريخ الانتهاء',
          cardHolder: 'اسم حامل البطاقة',
          email: 'البريد الإلكتروني',
          billingAddress: 'عنوان الفوترة',
          city: 'المدينة',
          postalCode: 'الرمز البريدي',
          country: 'البلد',
          saveCard: 'حفظ هذه البطاقة للمدفوعات القادمة',
          acceptTerms: 'أوافق على الشروط والأحكام',
          seeTerms: 'عرض الشروط',
          subtotal: 'المجموع الفرعي',
          discount: 'الخصم',
          total: 'الإجمالي',
          continue: 'متابعة',
          cancel: 'إلغاء',
          loading: 'جاري المعالجة...',
          paymentUnavailable: 'الدفع غير متاح حالياً',
          paymentUnavailableText:
            'الدفع عبر الإنترنت غير متصل بعد. يمكنك الاحتفاظ بهذه الصفحة جاهزة وربط Stripe أو PayPal أو CMI أو Payzone أو وسيلة دفع محلية لاحقاً.',
          close: 'إغلاق',
          contactUs: 'تواصل معنا',
          backSubscription: 'العودة للاشتراكات',
          securePayment: 'دفع آمن',
          guarantee: 'ضمان 7 أيام',
          studentFriendly: 'سعر مناسب للطلاب',
          included: 'مشمول في خطتك:',
          otherBenefits: 'مزايا أخرى',
          invalidCard: 'رقم البطاقة غير صالح',
          requiredCard: 'رقم البطاقة مطلوب',
          requiredExpiry: 'تاريخ الانتهاء مطلوب',
          invalidExpiry: 'تنسيق غير صالح. استخدم MM/YY',
          expiredCard: 'البطاقة منتهية الصلاحية',
          requiredCvv: 'CVV مطلوب',
          invalidCvv: 'CVV غير صالح',
          requiredHolder: 'اسم حامل البطاقة مطلوب',
          requiredEmail: 'البريد الإلكتروني مطلوب',
          invalidEmail: 'البريد الإلكتروني غير صالح',
          termsRequired: 'يجب قبول الشروط',
          monthlyPlan: 'الخطة الشهرية',
          annualPlan: 'الخطة السنوية',
          studentPlan: 'خطة الطالب',
          monthly: 'شهر واحد',
          annual: '12 شهراً',
          student: 'شهر واحد للطلاب',
          monthlyBilling: 'فوترة شهرية',
          annualBilling: 'فوترة سنوية',
          studentBilling: 'سعر خاص للطلاب',
          saveAnnual: 'وفر 150 درهم',
          saveStudent: 'سعر مخفض للطلاب',
          cardPayment: 'بطاقة بنكية',
          cardPaymentDesc: 'Visa, Mastercard',
          paypalPayment: 'PayPal',
          paypalPaymentDesc: 'سيتم ربطه لاحقاً',
          localPayment: 'دفع محلي',
          localPaymentDesc: 'CMI أو Payzone أو تحويل',
        },
      }[language] || {}),
    [language]
  );

  const plans = useMemo(
    () => ({
      mensuel: {
        title: t.monthlyPlan,
        price: 49,
        originalPrice: 59,
        duration: t.monthly,
        billingCycle: t.monthlyBilling,
        features:
          language === 'fr'
            ? [
                'Cours médicaux essentiels',
                'Quiz interactifs',
                'Flashcards générées par IA',
                'Tableau de bord étudiant',
                'Support par email',
              ]
            : [
                'دروس طبية أساسية',
                'اختبارات تفاعلية',
                'بطاقات تعليمية بالذكاء الاصطناعي',
                'لوحة تحكم الطالب',
                'دعم عبر البريد الإلكتروني',
              ],
      },
      annuel: {
        title: t.annualPlan,
        price: 399,
        originalPrice: 588,
        duration: t.annual,
        billingCycle: t.annualBilling,
        savings: t.saveAnnual,
        features:
          language === 'fr'
            ? [
                'Tous les cours médicaux',
                'Quiz et corrections détaillées',
                'Flashcards IA illimitées',
                'Suivi de progression',
                'Accès aux nouveautés',
                'Support prioritaire',
                'Meilleur prix sur 12 mois',
              ]
            : [
                'جميع الدروس الطبية',
                'اختبارات وتصحيح مفصل',
                'بطاقات تعليمية غير محدودة بالذكاء الاصطناعي',
                'تتبع التقدم',
                'الوصول إلى المستجدات',
                'دعم ذو أولوية',
                'أفضل سعر لمدة 12 شهراً',
              ],
      },
      etudiant: {
        title: t.studentPlan,
        price: 29,
        originalPrice: 49,
        duration: t.student,
        billingCycle: t.studentBilling,
        savings: t.saveStudent,
        features:
          language === 'fr'
            ? [
                'Accès aux cours de base',
                'Quiz illimités',
                'Flashcards de révision',
                'Mode bilingue français/arabe',
                'Tarif adapté aux étudiants',
              ]
            : [
                'الوصول إلى الدروس الأساسية',
                'اختبارات غير محدودة',
                'بطاقات مراجعة',
                'وضع ثنائي اللغة فرنسي/عربي',
                'سعر مناسب للطلاب',
              ],
      },
    }),
    [language, t]
  );

  const selectedPlan = plans[plan] || plans.etudiant;

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const discountParam = Number(urlParams.get('discount') || 0);

    if (!Number.isNaN(discountParam) && discountParam > 0) {
      setDiscount(Math.min(discountParam, 80));
    }
  }, [location.search]);

  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user, formData.email]);

  const detectCardType = (number) => {
    const cleanNumber = String(number || '').replace(/\D/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    return '';
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'cardNumber': {
        const cleanCardNumber = String(value || '').replace(/\s/g, '');
        if (!cleanCardNumber) return t.requiredCard;
        if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) return t.invalidCard;
        return '';
      }

      case 'expiryDate': {
        if (!value) return t.requiredExpiry;
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return t.invalidExpiry;

        const [month, year] = value.split('/');
        const expiry = new Date(2000 + Number(year), Number(month), 0, 23, 59, 59);
        if (expiry < new Date()) return t.expiredCard;

        return '';
      }

      case 'cvv':
        if (!value) return t.requiredCvv;
        if (!/^\d{3,4}$/.test(value)) return t.invalidCvv;
        return '';

      case 'cardHolder':
        if (!String(value || '').trim()) return t.requiredHolder;
        return '';

      case 'email':
        if (!value) return t.requiredEmail;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t.invalidEmail;
        return '';

      default:
        return '';
    }
  };

  const formatCardNumber = (value) => {
    const clean = String(value || '').replace(/\D/g, '').slice(0, 19);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value) => {
    const clean = String(value || '').replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
      setCardType(detectCardType(value));
    }

    if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    }

    if (field === 'cvv') {
      formattedValue = String(value || '')
        .replace(/\D/g, '')
        .slice(0, cardType === 'amex' ? 4 : 3);
    }

    if (field === 'postalCode') {
      formattedValue = String(value || '').replace(/\D/g, '').slice(0, 5);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    const fieldError = validateField(field, formattedValue);

    setErrors((prev) => ({
      ...prev,
      [field]: fieldError,
    }));
  };

  const calculateFinalPrice = () => {
    const finalPrice = selectedPlan.price * (1 - discount / 100);
    return Math.max(finalPrice, 0).toFixed(0);
  };

  const validatePaymentForm = () => {
    const newErrors = {};

    if (paymentMethod === 'card') {
      ['cardNumber', 'expiryDate', 'cvv', 'cardHolder'].forEach((field) => {
        const fieldError = validateField(field, formData[field]);
        if (fieldError) newErrors[field] = fieldError;
      });
    }

    const emailError = validateField('email', formData.email);
    if (emailError) newErrors.email = emailError;

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = t.termsRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/payment/${plan || 'etudiant'}${location.search}`)}`);
      return;
    }

    if (!validatePaymentForm()) {
      return;
    }

    setIsProcessing(true);

    window.setTimeout(() => {
      setIsProcessing(false);
      setShowUnavailableModal(true);
    }, 700);
  };

  const getCardIcon = () => {
    const icons = {
      visa: '💳 Visa',
      mastercard: '💳 Mastercard',
      amex: '💳 Amex',
    };

    return icons[cardType] || '💳';
  };

  const paymentMethods = [
    {
      id: 'card',
      icon: '💳',
      title: t.cardPayment,
      description: t.cardPaymentDesc,
    },
    {
      id: 'paypal',
      icon: '🅿️',
      title: 'PayPal',
      description: t.paypalPaymentDesc,
    },
    {
      id: 'local',
      icon: '🏦',
      title: t.localPayment,
      description: t.localPaymentDesc,
    },
  ];

  return (
    <div className={`payment-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="payment-header">
        <p className="payment-kicker">MedPlatform Maroc</p>
        <h1 className="payment-title">{t.title}</h1>
        <p className="payment-subtitle">{t.subtitle}</p>
      </div>

      <div className="payment-content">
        <aside className="order-summary">
          <h2>{t.orderSummary}</h2>

          <div className="plan-card">
            <div>
              <h3>{selectedPlan.title}</h3>
              <p className="plan-duration">{selectedPlan.duration}</p>
              <p className="billing-cycle">{selectedPlan.billingCycle}</p>
            </div>

            {selectedPlan.savings && <div className="savings-badge">{selectedPlan.savings}</div>}
          </div>

          <div className="price-breakdown">
            <div className="price-line">
              <span>{t.subtotal}</span>
              <span className="original-price">{selectedPlan.originalPrice} MAD</span>
            </div>

            <div className="price-line">
              <span>{selectedPlan.title}</span>
              <span>{selectedPlan.price} MAD</span>
            </div>

            {discount > 0 && (
              <div className="price-line">
                <span>
                  {t.discount} ({discount}%)
                </span>
                <span className="discount-amount">
                  -{((selectedPlan.price * discount) / 100).toFixed(0)} MAD
                </span>
              </div>
            )}

            <div className="price-line total-line">
              <span>{t.total}</span>
              <span className="final-price">{calculateFinalPrice()} MAD</span>
            </div>
          </div>

          <div className="features-included">
            <h4>{t.included}</h4>
            <ul>
              {selectedPlan.features.slice(0, 5).map((feature, index) => (
                <li key={`${feature}-${index}`}>✓ {feature}</li>
              ))}

              {selectedPlan.features.length > 5 && (
                <li className="more-features">
                  +{selectedPlan.features.length - 5} {t.otherBenefits}
                </li>
              )}
            </ul>
          </div>

          <div className="security-badges">
            <div className="badge">🔒 {t.securePayment}</div>
            <div className="badge">🎓 {t.studentFriendly}</div>
            <div className="badge">🛡️ {t.guarantee}</div>
          </div>
        </aside>

        <section className="payment-form-container">
          <div className="payment-step">
            <h2>{t.paymentMethod}</h2>

            <div className="method-grid">
              {paymentMethods.map((method) => (
                <button
                  type="button"
                  key={method.id}
                  className={`method-card ${paymentMethod === method.id ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <div className="method-icon">{method.icon}</div>
                  <h3>{method.title}</h3>
                  <p>{method.description}</p>
                </button>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <div className="card-form">
                <h3>{t.cardInfo}</h3>

                <div className="form-group">
                  <label htmlFor="cardNumber">{t.cardNumber}</label>
                  <div className="card-input-wrapper">
                    <input
                      ref={cardNumberRef}
                      id="cardNumber"
                      type="text"
                      className={`form-input ${errors.cardNumber ? 'error' : ''}`}
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(event) => handleInputChange('cardNumber', event.target.value)}
                      maxLength={23}
                    />
                    <div className="card-type-icon">{getCardIcon()}</div>
                  </div>
                  {errors.cardNumber && <span className="error-message">{errors.cardNumber}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expiryDate">{t.expiryDate}</label>
                    <input
                      id="expiryDate"
                      type="text"
                      className={`form-input ${errors.expiryDate ? 'error' : ''}`}
                      placeholder="MM/AA"
                      value={formData.expiryDate}
                      onChange={(event) => handleInputChange('expiryDate', event.target.value)}
                      maxLength={5}
                    />
                    {errors.expiryDate && <span className="error-message">{errors.expiryDate}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="cvv">CVV</label>
                    <input
                      id="cvv"
                      type="text"
                      className={`form-input ${errors.cvv ? 'error' : ''}`}
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(event) => handleInputChange('cvv', event.target.value)}
                      maxLength={4}
                    />
                    {errors.cvv && <span className="error-message">{errors.cvv}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="cardHolder">{t.cardHolder}</label>
                  <input
                    id="cardHolder"
                    type="text"
                    className={`form-input ${errors.cardHolder ? 'error' : ''}`}
                    placeholder={language === 'fr' ? 'Nom complet' : 'الاسم الكامل'}
                    value={formData.cardHolder}
                    onChange={(event) => handleInputChange('cardHolder', event.target.value)}
                  />
                  {errors.cardHolder && <span className="error-message">{errors.cardHolder}</span>}
                </div>
              </div>
            )}

            <div className="billing-form">
              <h3>{t.billingInfo}</h3>

              <div className="form-group">
                <label htmlFor="email">{t.email}</label>
                <input
                  id="email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="exemple@email.com"
                  value={formData.email}
                  onChange={(event) => handleInputChange('email', event.target.value)}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="billingAddress">{t.billingAddress}</label>
                <input
                  id="billingAddress"
                  type="text"
                  className="form-input"
                  placeholder={language === 'fr' ? 'Adresse complète' : 'العنوان الكامل'}
                  value={formData.billingAddress}
                  onChange={(event) => handleInputChange('billingAddress', event.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">{t.city}</label>
                  <input
                    id="city"
                    type="text"
                    className="form-input"
                    placeholder={language === 'fr' ? 'Casablanca' : 'الدار البيضاء'}
                    value={formData.city}
                    onChange={(event) => handleInputChange('city', event.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="postalCode">{t.postalCode}</label>
                  <input
                    id="postalCode"
                    type="text"
                    className="form-input"
                    placeholder="20000"
                    value={formData.postalCode}
                    onChange={(event) => handleInputChange('postalCode', event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="payment-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.saveCard}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      saveCard: event.target.checked,
                    }))
                  }
                />
                <span>{t.saveCard}</span>
              </label>

              <label className="checkbox-label required">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      acceptTerms: event.target.checked,
                    }))
                  }
                />
                <span>
                  {t.acceptTerms}{' '}
                  <NavLink to="/terms" className="terms-link">
                    {t.seeTerms}
                  </NavLink>
                </span>
              </label>

              {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}
            </div>

            <div className="step-actions">
              <button
                type="button"
                onClick={handleContinue}
                className="next-button"
                disabled={isProcessing}
              >
                {isProcessing ? t.loading : `${t.continue} →`}
              </button>

              <NavLink to="/subscription" className="cancel-link">
                {t.cancel}
              </NavLink>
            </div>
          </div>
        </section>
      </div>

      {showUnavailableModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-icon">💳</div>
            <h2>{t.paymentUnavailable}</h2>
            <p>{t.paymentUnavailableText}</p>

            <div className="modal-actions">
              <button type="button" onClick={() => setShowUnavailableModal(false)} className="modal-secondary">
                {t.close}
              </button>

              <button type="button" onClick={() => navigate('/contact')} className="modal-primary">
                {t.contactUs}
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/subscription')}
              className="modal-link"
            >
              {t.backSubscription}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .payment-container {
          max-width: 1120px;
          margin: 0 auto;
          padding: 40px 20px 70px;
          direction: ${isRTL ? 'rtl' : 'ltr'};
        }

        .payment-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .payment-kicker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .payment-title {
          font-size: clamp(2rem, 4vw, 3.2rem);
          color: #0f172a;
          margin-bottom: 10px;
          font-weight: 800;
        }

        .payment-subtitle {
          color: #64748b;
          font-size: 1.1rem;
        }

        .payment-content {
          display: grid;
          grid-template-columns: 0.9fr 1.6fr;
          gap: 28px;
          align-items: start;
        }

        .order-summary,
        .payment-step {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        }

        .order-summary {
          padding: 28px;
          position: sticky;
          top: 24px;
        }

        .order-summary h2,
        .payment-step h2 {
          color: #0f172a;
          font-size: 1.35rem;
          font-weight: 800;
          margin-bottom: 22px;
        }

        .plan-card {
          background: linear-gradient(135deg, #eff6ff, #ecfdf5);
          border: 1px solid #bfdbfe;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 20px;
        }

        .plan-card h3 {
          color: #1d4ed8;
          font-size: 1.25rem;
          margin-bottom: 6px;
          font-weight: 800;
        }

        .plan-duration,
        .billing-cycle {
          color: #475569;
          margin: 4px 0;
        }

        .savings-badge {
          margin-top: 12px;
          display: inline-flex;
          background: #dcfce7;
          color: #166534;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 800;
        }

        .price-breakdown {
          margin: 20px 0;
          padding: 18px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .price-line {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 12px;
          color: #475569;
        }

        .total-line {
          font-weight: 900;
          color: #0f172a;
          font-size: 1.25rem;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px dashed #cbd5e1;
        }

        .original-price {
          text-decoration: line-through;
          color: #94a3b8;
        }

        .discount-amount {
          color: #16a34a;
          font-weight: 800;
        }

        .final-price {
          color: #2563eb;
          font-size: 1.6rem;
        }

        .features-included h4 {
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
        }

        .features-included ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .features-included li {
          color: #334155;
          margin-bottom: 9px;
          line-height: 1.45;
        }

        .more-features {
          color: #2563eb !important;
          font-weight: 800;
        }

        .security-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }

        .badge {
          background: #f1f5f9;
          color: #0f172a;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .payment-form-container {
          min-width: 0;
        }

        .payment-step {
          padding: 28px;
        }

        .method-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }

        .method-card {
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          border-radius: 18px;
          padding: 18px 14px;
          text-align: center;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .method-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
        }

        .method-card.selected {
          border-color: #2563eb;
          background: #eff6ff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .method-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .method-card h3 {
          color: #0f172a;
          font-size: 1rem;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .method-card p {
          color: #64748b;
          font-size: 0.88rem;
        }

        .card-form,
        .billing-form {
          margin-top: 24px;
        }

        .card-form h3,
        .billing-form h3 {
          color: #0f172a;
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          color: #334155;
          margin-bottom: 7px;
          font-weight: 700;
        }

        .card-input-wrapper {
          position: relative;
        }

        .card-type-icon {
          position: absolute;
          right: ${isRTL ? 'auto' : '12px'};
          left: ${isRTL ? '12px' : 'auto'};
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-size: 0.9rem;
        }

        .form-input {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          font-size: 1rem;
          transition: 0.2s ease;
          background: #ffffff;
        }

        .card-input-wrapper .form-input {
          padding-right: ${isRTL ? '14px' : '92px'};
          padding-left: ${isRTL ? '92px' : '14px'};
        }

        .form-input:focus {
          border-color: #2563eb;
          outline: none;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .form-input.error {
          border-color: #dc2626;
          background: #fff7f7;
        }

        .error-message {
          color: #dc2626;
          font-size: 0.87rem;
          margin-top: 6px;
          display: block;
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .payment-options {
          margin: 24px 0;
          display: grid;
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #334155;
          line-height: 1.4;
        }

        .checkbox-label input {
          margin-top: 4px;
          width: 16px;
          height: 16px;
          accent-color: #2563eb;
        }

        .terms-link {
          color: #2563eb;
          font-weight: 800;
          text-decoration: none;
        }

        .terms-link:hover {
          text-decoration: underline;
        }

        .step-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 22px;
        }

        .next-button {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          padding: 13px 24px;
          border: none;
          border-radius: 14px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
          min-width: 180px;
        }

        .next-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 24px rgba(37, 99, 235, 0.25);
        }

        .next-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .cancel-link {
          color: #64748b;
          text-decoration: none;
          font-weight: 800;
        }

        .cancel-link:hover {
          color: #0f172a;
          text-decoration: underline;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.52);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 999;
        }

        .modal-card {
          width: min(480px, 100%);
          background: white;
          border-radius: 24px;
          padding: 28px;
          text-align: center;
          box-shadow: 0 25px 80px rgba(15, 23, 42, 0.25);
        }

        .modal-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #eff6ff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin-bottom: 16px;
        }

        .modal-card h2 {
          color: #0f172a;
          font-size: 1.5rem;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .modal-card p {
          color: #475569;
          line-height: 1.65;
          margin-bottom: 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 14px;
        }

        .modal-primary,
        .modal-secondary {
          border: none;
          padding: 11px 18px;
          border-radius: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .modal-primary {
          background: #2563eb;
          color: white;
        }

        .modal-secondary {
          background: #f1f5f9;
          color: #0f172a;
        }

        .modal-link {
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .payment-content {
            grid-template-columns: 1fr;
          }

          .order-summary {
            position: static;
          }

          .method-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .payment-container {
            padding: 28px 14px 60px;
          }

          .payment-step,
          .order-summary {
            padding: 20px;
            border-radius: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .step-actions,
          .modal-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .next-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Payment;