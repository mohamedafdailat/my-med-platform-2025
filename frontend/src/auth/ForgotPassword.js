import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NavLink } from 'react-router-dom';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const errorMessages = {
    fr: {
      'auth/user-not-found': 'Aucun compte associé à cet email.',
      'auth/invalid-email': 'Format d’email invalide.',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
      'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre réseau.',
      'auth/operation-not-allowed': 'Réinitialisation par email désactivée. Contactez le support.',
      default: 'Une erreur s’est produite. Veuillez réessayer.',
    },
    ar: {
      'auth/user-not-found': 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني.',
      'auth/invalid-email': 'تنسيق البريد الإلكتروني غير صالح.',
      'auth/too-many-requests': 'محاولات كثيرة جدًا. حاول مرة أخرى لاحقًا.',
      'auth/network-request-failed': 'خطأ في الاتصال. تحقق من شبكتك.',
      'auth/operation-not-allowed': 'إعادة التعيين عبر البريد الإلكتروني معطلة. اتصل بالدعم.',
      default: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError(language === 'fr' ? 'L’email est requis.' : 'البريد الإلكتروني مطلوب.');
      return;
    }
    if (!emailRegex.test(email)) {
      setError(language === 'fr' ? 'Veuillez entrer un email valide.' : 'يرجى إدخال بريد إلكتروني صالح.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await resetPassword(email);
      setMessage(
        language === 'fr'
          ? 'E-mail de réinitialisation envoyé. Vérifiez votre boîte de réception ou vos spams.'
          : 'تم إرسال بريد إلكتروني لإعادة تعيين كلمة المرور. تحقق من بريدك الوارد أو البريد العشوائي.'
      );
      setEmail('');
    } catch (err) {
      console.error('Reset Password Error:', err.code, err.message);
      const errorMsg = errorMessages[language][err.code] || errorMessages[language].default;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="auth-container">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
          {language === 'fr' ? 'Réinitialiser le mot de passe' : 'إعادة تعيين كلمة المرور'}
        </h2>
        {(message || error) && (
          <div
            className={`text-center p-4 rounded-lg mb-6 transition-opacity duration-300 ${
              message ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}
            role="alert"
            aria-live="assertive"
            id={message ? 'success-message' : 'error-message'}
            style={{ opacity: message || error ? 1 : 0 }}
          >
            {message || error}
          </div>
        )}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
          aria-busy={loading}
          aria-describedby={message ? 'success-message' : error ? 'error-message' : undefined}
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {language === 'fr' ? 'Email' : 'البريد الإلكتروني'}
            </label>
            <input
              type="email"
              id="email"
              placeholder={language === 'fr' ? 'Entrez votre email' : 'أدخل بريدك الإلكتروني'}
              className="form-input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'error-message' : undefined}
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
            aria-label={language === 'fr' ? 'Envoyer le lien de réinitialisation' : 'إرسال رابط إعادة التعيين'}
          >
            {loading ? (
              <span className="loading-spinner inline-block"></span>
            ) : language === 'fr' ? (
              'Envoyer'
            ) : (
              'إرسال'
            )}
          </button>
        </form>
        <div className="text-center mt-4">
          <NavLink
            to="/login"
            className="text-blue-600 hover:underline"
            aria-label={language === 'fr' ? 'Retour à la connexion' : 'العودة إلى تسجيل الدخول'}
          >
            {language === 'fr' ? 'Retour à la connexion' : 'العودة إلى تسجيل الدخول'}
          </NavLink>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;