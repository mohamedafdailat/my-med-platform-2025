import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const { language } = useLanguage();

  const isRTL = language === 'ar';

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = useMemo(
    () =>
      ({
        fr: {
          title: 'Mot de passe oublié ?',
          subtitle:
            'Entrez l’adresse email associée à votre compte. Nous vous enverrons un lien pour créer un nouveau mot de passe.',
          emailLabel: 'Adresse email',
          emailPlaceholder: 'exemple@email.com',
          send: 'Envoyer le lien',
          sending: 'Envoi en cours...',
          backLogin: 'Retour à la connexion',
          helperTitle: 'Conseil',
          helperText:
            'Si vous ne recevez rien dans quelques minutes, vérifiez votre dossier spam ou assurez-vous que l’adresse email est correcte.',
          success:
            'Lien de réinitialisation envoyé. Vérifiez votre boîte de réception ou vos spams.',
          requiredEmail: 'L’email est requis.',
          invalidEmail: 'Veuillez entrer une adresse email valide.',
          errors: {
            'auth/user-not-found': 'Aucun compte n’est associé à cet email.',
            'auth/invalid-email': 'Format d’email invalide.',
            'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
            'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre réseau.',
            'auth/operation-not-allowed':
              'La réinitialisation par email est désactivée. Contactez le support.',
            default: 'Une erreur s’est produite. Veuillez réessayer.',
          },
        },
        ar: {
          title: 'هل نسيت كلمة المرور؟',
          subtitle:
            'أدخل البريد الإلكتروني المرتبط بحسابك. سنرسل لك رابطاً لإنشاء كلمة مرور جديدة.',
          emailLabel: 'البريد الإلكتروني',
          emailPlaceholder: 'example@email.com',
          send: 'إرسال الرابط',
          sending: 'جاري الإرسال...',
          backLogin: 'العودة إلى تسجيل الدخول',
          helperTitle: 'نصيحة',
          helperText:
            'إذا لم يصلك أي بريد خلال دقائق، تحقق من مجلد الرسائل غير المرغوب فيها أو تأكد من صحة البريد الإلكتروني.',
          success:
            'تم إرسال رابط إعادة تعيين كلمة المرور. تحقق من بريدك الوارد أو البريد العشوائي.',
          requiredEmail: 'البريد الإلكتروني مطلوب.',
          invalidEmail: 'يرجى إدخال بريد إلكتروني صالح.',
          errors: {
            'auth/user-not-found': 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني.',
            'auth/invalid-email': 'تنسيق البريد الإلكتروني غير صالح.',
            'auth/too-many-requests': 'محاولات كثيرة جداً. حاول مرة أخرى لاحقاً.',
            'auth/network-request-failed': 'خطأ في الاتصال. تحقق من شبكتك.',
            'auth/operation-not-allowed':
              'إعادة التعيين عبر البريد الإلكتروني معطلة. اتصل بالدعم.',
            default: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
          },
        },
      }[language] || {}),
    [language]
  );

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    setError('');
    setMessage('');

    if (!normalizedEmail) {
      setError(t.requiredEmail);
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setError(t.invalidEmail);
      return;
    }

    setLoading(true);

    try {
      await resetPassword(normalizedEmail);
      setMessage(t.success);
      setEmail('');
    } catch (err) {
      console.error('Reset Password Error:', err?.code, err?.message);
      setError(t.errors[err?.code] || t.errors.default);
    } finally {
      setLoading(false);
    }
  };

  const hasAlert = Boolean(message || error);

  return (
    <main
      className={`min-h-[calc(100vh-12rem)] bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center px-4 py-12 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck className="h-9 w-9" aria-hidden="true" />
            </div>

            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100">{t.subtitle}</p>
          </div>

          <div className="px-8 py-7">
            {hasAlert && (
              <div
                className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
                  message
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
                role="alert"
                aria-live="assertive"
                id={message ? 'success-message' : 'error-message'}
              >
                {message ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                )}
                <p className="text-sm font-medium leading-6">{message || error}</p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              aria-busy={loading}
              aria-describedby={hasAlert ? (message ? 'success-message' : 'error-message') : undefined}
              className="space-y-5"
            >
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                  {t.emailLabel}
                </label>

                <div className="relative">
                  <Mail
                    className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${
                      isRTL ? 'right-4' : 'left-4'
                    }`}
                    aria-hidden="true"
                  />

                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError('');
                      if (message) setMessage('');
                    }}
                    placeholder={t.emailPlaceholder}
                    disabled={loading}
                    autoComplete="email"
                    className={`w-full rounded-2xl border bg-white py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 ${
                      isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'
                    } ${error ? 'border-red-300' : 'border-gray-300'}`}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'error-message' : undefined}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    {t.sending}
                  </>
                ) : (
                  t.send
                )}
              </button>
            </form>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
              <p className="mb-1 font-semibold text-gray-800">{t.helperTitle}</p>
              <p className="leading-6">{t.helperText}</p>
            </div>

            <div className="mt-6 text-center">
              <NavLink
                to="/login"
                className="inline-flex items-center justify-center gap-2 font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
              >
                {!isRTL && <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
                {t.backLogin}
                {isRTL && <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" />}
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;