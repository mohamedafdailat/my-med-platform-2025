import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Loader2,
} from 'lucide-react';

const Login = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isRTL = language === 'ar';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = {
    fr: {
      badge: 'Espace étudiant',
      title: 'Connexion',
      subtitle:
        'Accédez à vos cours, quiz, vidéos, flashcards et à votre tableau de bord personnalisé.',
      email: 'Adresse email',
      emailPlaceholder: 'votre.email@example.com',
      password: 'Mot de passe',
      passwordPlaceholder: 'Votre mot de passe',
      login: 'Se connecter',
      loading: 'Connexion...',
      requiredError: 'Veuillez renseigner votre email et votre mot de passe.',
      invalidEmail: 'Adresse email invalide.',
      invalidCredential: 'Email ou mot de passe incorrect.',
      userNotFound: 'Aucun compte ne correspond à cet email.',
      wrongPassword: 'Mot de passe incorrect.',
      tooManyRequests:
        'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.',
      networkError: 'Problème de connexion réseau. Veuillez réessayer.',
      genericError: 'Échec de la connexion. Veuillez réessayer.',
      noAccount: 'Pas encore inscrit ?',
      register: "S'inscrire",
      forgotPassword: 'Mot de passe oublié ?',
      backHome: 'Retour à l’accueil',
      secureAccess: 'Accès sécurisé',
      secureText:
        'Vos données sont protégées via Firebase Authentication.',
    },
    ar: {
      badge: 'فضاء الطالب',
      title: 'تسجيل الدخول',
      subtitle:
        'ادخل إلى دروسك واختباراتك وفيديوهاتك وبطاقاتك التعليمية ولوحة التحكم الخاصة بك.',
      email: 'البريد الإلكتروني',
      emailPlaceholder: 'your.email@example.com',
      password: 'كلمة المرور',
      passwordPlaceholder: 'كلمة المرور الخاصة بك',
      login: 'تسجيل الدخول',
      loading: 'جاري تسجيل الدخول...',
      requiredError: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
      invalidEmail: 'البريد الإلكتروني غير صحيح.',
      invalidCredential: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      userNotFound: 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني.',
      wrongPassword: 'كلمة المرور غير صحيحة.',
      tooManyRequests:
        'عدد كبير من المحاولات. يرجى الانتظار قليلاً ثم المحاولة مجددًا.',
      networkError: 'مشكلة في الاتصال بالشبكة. يرجى المحاولة مرة أخرى.',
      genericError: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.',
      noAccount: 'ليس لديك حساب؟',
      register: 'إنشاء حساب',
      forgotPassword: 'نسيت كلمة المرور؟',
      backHome: 'العودة إلى الرئيسية',
      secureAccess: 'دخول آمن',
      secureText:
        'بياناتك محمية عبر Firebase Authentication.',
    },
  }[language];

  const getFirebaseErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-email':
        return t.invalidEmail;
      case 'auth/user-not-found':
        return t.userNotFound;
      case 'auth/wrong-password':
        return t.wrongPassword;
      case 'auth/invalid-credential':
        return t.invalidCredential;
      case 'auth/too-many-requests':
        return t.tooManyRequests;
      case 'auth/network-request-failed':
        return t.networkError;
      default:
        return t.genericError;
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setError(t.requiredError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="hidden lg:block">
            <NavLink
              to="/"
              className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium transition-colors mb-8"
            >
              <ArrowLeft
                className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
              {t.backHome}
            </NavLink>

            <div className="bg-white border border-blue-100 rounded-3xl shadow-sm p-10">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                {t.badge}
              </div>

              <h1 className="text-5xl font-bold text-gray-950 mb-6">
                {t.title}
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {t.subtitle}
              </p>

              <div className="rounded-3xl bg-blue-600 text-white p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-6 h-6" aria-hidden="true" />
                  <h2 className="text-xl font-bold">{t.secureAccess}</h2>
                </div>
                <p className="text-blue-50 leading-relaxed">{t.secureText}</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto">
            <div className="lg:hidden mb-6">
              <NavLink
                to="/"
                className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium transition-colors"
              >
                <ArrowLeft
                  className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
                {t.backHome}
              </NavLink>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-6 sm:p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-5">
                  <LogIn className="w-8 h-8" aria-hidden="true" />
                </div>

                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4 lg:hidden">
                  <GraduationCap className="w-4 h-4" aria-hidden="true" />
                  {t.badge}
                </div>

                <h1 className="text-3xl font-bold text-gray-950 mb-3">
                  {t.title}
                </h1>

                <p className="text-gray-600 leading-relaxed lg:hidden">
                  {t.subtitle}
                </p>
              </div>

              {error && (
                <div
                  className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 flex items-start gap-3"
                  role="alert"
                >
                  <AlertCircle
                    className="w-5 h-5 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    {t.email}
                  </label>

                  <div className="relative">
                    <Mail
                      className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${
                        isRTL ? 'right-4' : 'left-4'
                      }`}
                      aria-hidden="true"
                    />

                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t.emailPlaceholder}
                      className={`block w-full py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'
                      }`}
                      autoComplete="email"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-800"
                    >
                      {t.password}
                    </label>

                    <NavLink
                      to="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {t.forgotPassword}
                    </NavLink>
                  </div>

                  <div className="relative">
                    <Lock
                      className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${
                        isRTL ? 'right-4' : 'left-4'
                      }`}
                      aria-hidden="true"
                    />

                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t.passwordPlaceholder}
                      className={`block w-full py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        isRTL ? 'pr-12 pl-12' : 'pl-12 pr-12'
                      }`}
                      autoComplete="current-password"
                      disabled={isLoading}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors ${
                        isRTL ? 'left-4' : 'right-4'
                      }`}
                      aria-label={
                        showPassword
                          ? language === 'fr'
                            ? 'Masquer le mot de passe'
                            : 'إخفاء كلمة المرور'
                          : language === 'fr'
                          ? 'Afficher le mot de passe'
                          : 'إظهار كلمة المرور'
                      }
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-5 h-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-2xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogIn className="w-5 h-5" aria-hidden="true" />
                  )}
                  {isLoading ? t.loading : t.login}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {t.noAccount}{' '}
                  <NavLink
                    to="/register"
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {t.register}
                  </NavLink>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;