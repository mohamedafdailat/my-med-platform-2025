import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

import { auth, db } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const Register = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();

  const isRTL = language === 'ar';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    semester: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});

  const t = useMemo(
    () =>
      ({
        fr: {
          title: 'Créer un compte',
          subtitle:
            'Rejoignez MedPlatform Maroc et accédez à vos cours, quiz, flashcards et outils de révision médicale.',
          fullName: 'Nom complet',
          fullNamePlaceholder: 'Ex : Mohamed Afdailat',
          email: 'Adresse email',
          emailPlaceholder: 'exemple@email.com',
          phoneNumber: 'Numéro de téléphone',
          phonePlaceholder: '+212 6 12 34 56 78',
          semester: 'Semestre',
          semesterPlaceholder: 'Ex : 1',
          password: 'Mot de passe',
          passwordPlaceholder: 'Minimum 6 caractères',
          confirmPassword: 'Confirmer le mot de passe',
          confirmPasswordPlaceholder: 'Répétez votre mot de passe',
          acceptTermsStart: 'J’accepte les',
          terms: 'conditions générales',
          and: 'et la',
          privacy: 'politique de confidentialité',
          submit: 'Créer mon compte',
          loading: 'Création du compte...',
          alreadyAccount: 'Déjà inscrit ?',
          login: 'Se connecter',
          success: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
          benefitsTitle: 'Avec votre compte, vous pourrez :',
          benefit1: 'Sauvegarder vos quiz et vos résultats',
          benefit2: 'Créer des flashcards avec l’IA',
          benefit3: 'Suivre votre progression par semestre',
          errors: {
            fullNameRequired: 'Nom complet requis.',
            fullNameShort: 'Nom trop court.',
            emailRequired: 'Email requis.',
            emailInvalid: 'Email invalide.',
            phoneRequired: 'Numéro de téléphone requis.',
            phoneInvalid: 'Numéro de téléphone invalide.',
            semesterRequired: 'Semestre requis.',
            semesterInvalid: 'Semestre invalide. Choisissez une valeur entre 1 et 12.',
            passwordRequired: 'Mot de passe requis.',
            passwordShort: 'Le mot de passe doit contenir au moins 6 caractères.',
            confirmRequired: 'Confirmation du mot de passe requise.',
            passwordsMismatch: 'Les mots de passe ne correspondent pas.',
            termsRequired: 'Vous devez accepter les conditions pour continuer.',
            default: 'Échec de l’inscription. Veuillez réessayer.',
            'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse email.',
            'auth/invalid-email': 'Adresse email invalide.',
            'auth/weak-password': 'Mot de passe trop faible.',
            'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
            'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
            'auth/operation-not-allowed':
              'L’inscription par email/mot de passe n’est pas activée dans Firebase.',
          },
        },
        ar: {
          title: 'إنشاء حساب',
          subtitle:
            'انضم إلى MedPlatform Maroc للوصول إلى الدروس والاختبارات والبطاقات التعليمية وأدوات المراجعة الطبية.',
          fullName: 'الاسم الكامل',
          fullNamePlaceholder: 'مثال: محمد أحمد',
          email: 'البريد الإلكتروني',
          emailPlaceholder: 'example@email.com',
          phoneNumber: 'رقم الهاتف',
          phonePlaceholder: '+212 6 12 34 56 78',
          semester: 'الفصل الدراسي',
          semesterPlaceholder: 'مثال: 1',
          password: 'كلمة المرور',
          passwordPlaceholder: 'على الأقل 6 أحرف',
          confirmPassword: 'تأكيد كلمة المرور',
          confirmPasswordPlaceholder: 'أعد كتابة كلمة المرور',
          acceptTermsStart: 'أوافق على',
          terms: 'الشروط والأحكام',
          and: 'و',
          privacy: 'سياسة الخصوصية',
          submit: 'إنشاء حسابي',
          loading: 'جاري إنشاء الحساب...',
          alreadyAccount: 'لديك حساب بالفعل؟',
          login: 'تسجيل الدخول',
          success: 'تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول.',
          benefitsTitle: 'باستخدام حسابك يمكنك:',
          benefit1: 'حفظ الاختبارات والنتائج',
          benefit2: 'إنشاء بطاقات تعليمية بالذكاء الاصطناعي',
          benefit3: 'متابعة تقدمك حسب الفصل الدراسي',
          errors: {
            fullNameRequired: 'الاسم الكامل مطلوب.',
            fullNameShort: 'الاسم قصير جداً.',
            emailRequired: 'البريد الإلكتروني مطلوب.',
            emailInvalid: 'البريد الإلكتروني غير صالح.',
            phoneRequired: 'رقم الهاتف مطلوب.',
            phoneInvalid: 'رقم الهاتف غير صالح.',
            semesterRequired: 'الفصل الدراسي مطلوب.',
            semesterInvalid: 'الفصل الدراسي غير صالح. اختر قيمة بين 1 و 12.',
            passwordRequired: 'كلمة المرور مطلوبة.',
            passwordShort: 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.',
            confirmRequired: 'تأكيد كلمة المرور مطلوب.',
            passwordsMismatch: 'كلمتا المرور غير متطابقتين.',
            termsRequired: 'يجب قبول الشروط للمتابعة.',
            default: 'فشل التسجيل. يرجى المحاولة مرة أخرى.',
            'auth/email-already-in-use': 'يوجد حساب بالفعل بهذا البريد الإلكتروني.',
            'auth/invalid-email': 'البريد الإلكتروني غير صالح.',
            'auth/weak-password': 'كلمة المرور ضعيفة جداً.',
            'auth/network-request-failed': 'خطأ في الشبكة. تحقق من الاتصال.',
            'auth/too-many-requests': 'محاولات كثيرة جداً. حاول لاحقاً.',
            'auth/operation-not-allowed':
              'التسجيل بالبريد الإلكتروني وكلمة المرور غير مفعل في Firebase.',
          },
        },
      }[language] || {}),
    [language]
  );

  const normalizePhone = (value) => value.replace(/[^\d+]/g, '');

  const getPasswordStrength = (password) => {
    let score = 0;

    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
    if (score <= 1) {
      return {
        score: 25,
        label: language === 'fr' ? 'Faible' : 'ضعيفة',
        color: 'bg-red-500',
      };
    }
    if (score <= 3) {
      return {
        score: 60,
        label: language === 'fr' ? 'Moyen' : 'متوسطة',
        color: 'bg-yellow-500',
      };
    }
    return {
      score: 100,
      label: language === 'fr' ? 'Fort' : 'قوية',
      color: 'bg-green-500',
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateField = (field, value, currentData = formData) => {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;

    switch (field) {
      case 'fullName':
        if (!trimmedValue) return t.errors.fullNameRequired;
        if (trimmedValue.length < 3) return t.errors.fullNameShort;
        return '';

      case 'email':
        if (!trimmedValue) return t.errors.emailRequired;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) return t.errors.emailInvalid;
        return '';

      case 'phoneNumber': {
        const phone = normalizePhone(trimmedValue || '');
        if (!phone) return t.errors.phoneRequired;
        if (!/^(\+212|0)?[5-7]\d{8}$/.test(phone)) return t.errors.phoneInvalid;
        return '';
      }

      case 'semester': {
        if (!trimmedValue) return t.errors.semesterRequired;
        const semesterNumber = Number(trimmedValue);
        if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 12) {
          return t.errors.semesterInvalid;
        }
        return '';
      }

      case 'password':
        if (!value) return t.errors.passwordRequired;
        if (value.length < 6) return t.errors.passwordShort;
        return '';

      case 'confirmPassword':
        if (!value) return t.errors.confirmRequired;
        if (value !== currentData.password) return t.errors.passwordsMismatch;
        return '';

      case 'acceptTerms':
        if (!value) return t.errors.termsRequired;
        return '';

      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((field) => {
      const fieldError = validateField(field, formData[field], formData);
      if (fieldError) newErrors[field] = fieldError;
    });

    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      phoneNumber: true,
      semester: true,
      password: true,
      confirmPassword: true,
      acceptTerms: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    const newValue = type === 'checkbox' ? checked : value;

    const updatedData = {
      ...formData,
      [name]: newValue,
    };

    setFormData(updatedData);
    setGeneralError('');
    setSuccessMessage('');

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, newValue, updatedData),
        ...(name === 'password' && touched.confirmPassword
          ? {
              confirmPassword: validateField(
                'confirmPassword',
                updatedData.confirmPassword,
                updatedData
              ),
            }
          : {}),
      }));
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, formData[name], formData),
    }));
  };

  const showToastSuccess = (message) => {
    if (toast?.success) toast.success(message);
  };

  const showToastError = (message) => {
    if (toast?.error) toast.error(message);
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError('');
    setSuccessMessage('');

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const normalizedFullName = formData.fullName.trim();
      const normalizedPhone = formData.phoneNumber.trim();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        formData.password
      );

      const createdUser = userCredential.user;

      await updateProfile(createdUser, {
        displayName: normalizedFullName,
      });

      await setDoc(doc(db, 'users', createdUser.uid), {
        uid: createdUser.uid,
        fullName: normalizedFullName,
        displayName: normalizedFullName,
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        semester: String(formData.semester),
        role: 'student',
        subscriptionStatus: 'unpaid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null,
        provider: 'password',
      });

      setSuccessMessage(t.success);
      showToastSuccess(t.success);

      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        semester: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
      });
      setErrors({});
      setTouched({});

      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { registeredEmail: normalizedEmail },
        });
      }, 1000);
    } catch (err) {
      console.error('Register error:', err?.code, err?.message);

      const message = t.errors[err?.code] || t.errors.default;
      setGeneralError(message);
      showToastError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClass =
    'w-full rounded-2xl border bg-white py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100';

  const inputPaddingClass = isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left';

  const renderIcon = (IconComponent) => (
    <IconComponent
      className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${
        isRTL ? 'right-4' : 'left-4'
      }`}
      aria-hidden="true"
    />
  );

  return (
    <main
      className={`min-h-[calc(100vh-12rem)] bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4 py-12 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2">
        <section className="hidden lg:block">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-800 p-10 text-white shadow-2xl">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              <GraduationCap className="h-9 w-9" aria-hidden="true" />
            </div>

            <h1 className="mb-4 text-4xl font-bold leading-tight">{t.title}</h1>
            <p className="mb-8 text-lg leading-8 text-blue-100">{t.subtitle}</p>

            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                {t.benefitsTitle}
              </h2>

              <ul className="space-y-3 text-blue-50">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{t.benefit1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{t.benefit2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{t.benefit3}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/95 shadow-2xl backdrop-blur">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-center text-white lg:hidden">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                <GraduationCap className="h-9 w-9" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold">{t.title}</h1>
              <p className="mt-3 text-sm leading-6 text-blue-100">{t.subtitle}</p>
            </div>

            <div className="px-6 py-8 sm:px-8">
              <div className="mb-7 hidden text-center lg:block">
                <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
                <p className="mt-2 text-sm leading-6 text-gray-600">{t.subtitle}</p>
              </div>

              {(generalError || successMessage) && (
                <div
                  className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
                    successMessage
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                  role="alert"
                  aria-live="assertive"
                >
                  {successMessage ? (
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  )}
                  <p className="text-sm font-medium leading-6">
                    {successMessage || generalError}
                  </p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.fullName}
                  </label>
                  <div className="relative">
                    {renderIcon(User)}
                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={t.fullNamePlaceholder}
                      disabled={isLoading}
                      autoComplete="name"
                      className={`${inputBaseClass} ${inputPaddingClass} ${
                        errors.fullName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      aria-invalid={Boolean(errors.fullName)}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.email}
                  </label>
                  <div className="relative">
                    {renderIcon(Mail)}
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={t.emailPlaceholder}
                      disabled={isLoading}
                      autoComplete="email"
                      className={`${inputBaseClass} ${inputPaddingClass} ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      aria-invalid={Boolean(errors.email)}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      {t.phoneNumber}
                    </label>
                    <div className="relative">
                      {renderIcon(Phone)}
                      <input
                        id="phoneNumber"
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={t.phonePlaceholder}
                        disabled={isLoading}
                        autoComplete="tel"
                        className={`${inputBaseClass} ${inputPaddingClass} ${
                          errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                        }`}
                        aria-invalid={Boolean(errors.phoneNumber)}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="mt-2 text-sm text-red-600">{errors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="semester" className="mb-2 block text-sm font-semibold text-gray-700">
                      {t.semester}
                    </label>
                    <div className="relative">
                      {renderIcon(GraduationCap)}
                      <input
                        id="semester"
                        type="number"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={t.semesterPlaceholder}
                        min="1"
                        max="12"
                        disabled={isLoading}
                        className={`${inputBaseClass} ${inputPaddingClass} ${
                          errors.semester ? 'border-red-300' : 'border-gray-300'
                        }`}
                        aria-invalid={Boolean(errors.semester)}
                      />
                    </div>
                    {errors.semester && (
                      <p className="mt-2 text-sm text-red-600">{errors.semester}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.password}
                  </label>
                  <div className="relative">
                    {renderIcon(Lock)}
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={t.passwordPlaceholder}
                      disabled={isLoading}
                      autoComplete="new-password"
                      className={`${inputBaseClass} ${inputPaddingClass} ${
                        isRTL ? 'pl-12' : 'pr-12'
                      } ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                      aria-invalid={Boolean(errors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700 ${
                        isRTL ? 'left-4' : 'right-4'
                      }`}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {language === 'fr' ? 'Sécurité :' : 'الأمان:'} {passwordStrength.label}
                      </p>
                    </div>
                  )}

                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    {t.confirmPassword}
                  </label>
                  <div className="relative">
                    {renderIcon(Lock)}
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={t.confirmPasswordPlaceholder}
                      disabled={isLoading}
                      autoComplete="new-password"
                      className={`${inputBaseClass} ${inputPaddingClass} ${
                        isRTL ? 'pl-12' : 'pr-12'
                      } ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                      aria-invalid={Boolean(errors.confirmPassword)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700 ${
                        isRTL ? 'left-4' : 'right-4'
                      }`}
                      aria-label={
                        showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isLoading}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="leading-6">
                      {t.acceptTermsStart}{' '}
                      <NavLink to="/terms" className="font-semibold text-blue-600 hover:underline">
                        {t.terms}
                      </NavLink>{' '}
                      {t.and}{' '}
                      <NavLink to="/privacy" className="font-semibold text-blue-600 hover:underline">
                        {t.privacy}
                      </NavLink>
                      .
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="mt-2 text-sm text-red-600">{errors.acceptTerms}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      {t.loading}
                    </>
                  ) : (
                    t.submit
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                {t.alreadyAccount}{' '}
                <NavLink to="/login" className="font-semibold text-blue-600 hover:underline">
                  {t.login}
                </NavLink>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Register;
