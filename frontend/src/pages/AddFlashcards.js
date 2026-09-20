// C:\my-med-platform\frontend\src\pages\AddFlashcards.js

import React, { useMemo, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  FileText,
  HelpCircle,
  Layers,
  Loader,
  PlusCircle,
  Save,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AddFlashcards = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isRTL = language === 'ar';

  const [formData, setFormData] = useState({
    title: '',
    category: 'anatomy',
    difficulty: 'medium',
    question: '',
    answer: '',
    explanation: '',
    tags: '',
  });

  const [errors, setErrors] = useState({});
  const [globalMessage, setGlobalMessage] = useState({
    type: '',
    text: '',
  });
  const [loading, setLoading] = useState(false);

  const t = useMemo(
    () =>
      ({
        fr: {
          pageTitle: 'Ajouter une flashcard',
          pageSubtitle:
            'Créez une carte de révision claire pour aider les étudiants à mémoriser les notions importantes.',
          back: 'Retour aux flashcards',
          title: 'Titre',
          titlePlaceholder: 'Ex : Anatomie du cœur',
          category: 'Catégorie',
          difficulty: 'Difficulté',
          question: 'Question',
          questionPlaceholder: 'Ex : Quelles sont les quatre cavités du cœur ?',
          answer: 'Réponse',
          answerPlaceholder: 'Ex : Deux oreillettes et deux ventricules.',
          explanation: 'Explication',
          explanationPlaceholder:
            'Ajoutez une explication pédagogique pour aider à comprendre la réponse.',
          tags: 'Tags',
          tagsPlaceholder: 'Ex : cœur, anatomie, circulation',
          submit: 'Ajouter la flashcard',
          saving: 'Enregistrement...',
          required: 'Champ requis',
          loginRequired: 'Vous devez être connecté pour ajouter une flashcard.',
          success: 'Flashcard ajoutée avec succès !',
          saveError: 'Erreur lors de l’ajout de la flashcard.',
          minQuestion: 'La question doit contenir au moins 5 caractères.',
          minAnswer: 'La réponse doit contenir au moins 2 caractères.',
          preview: 'Aperçu',
          front: 'Question',
          backSide: 'Réponse',
          optional: 'optionnel',
          categories: {
            anatomy: 'Anatomie',
            physiology: 'Physiologie',
            pharmacology: 'Pharmacologie',
            pathology: 'Pathologie',
            clinical: 'Pratique clinique',
            terminology: 'Terminologie médicale',
            other: 'Autre',
          },
          difficulties: {
            easy: 'Facile',
            medium: 'Moyen',
            hard: 'Difficile',
          },
        },
        ar: {
          pageTitle: 'إضافة بطاقة تعليمية',
          pageSubtitle:
            'أنشئ بطاقة مراجعة واضحة لمساعدة الطلاب على حفظ المفاهيم المهمة.',
          back: 'العودة إلى البطاقات',
          title: 'العنوان',
          titlePlaceholder: 'مثال: تشريح القلب',
          category: 'الفئة',
          difficulty: 'الصعوبة',
          question: 'السؤال',
          questionPlaceholder: 'مثال: ما هي حجرات القلب الأربع؟',
          answer: 'الإجابة',
          answerPlaceholder: 'مثال: أذينان وبطينان.',
          explanation: 'الشرح',
          explanationPlaceholder:
            'أضف شرحاً تعليمياً لمساعدة الطالب على فهم الإجابة.',
          tags: 'الكلمات المفتاحية',
          tagsPlaceholder: 'مثال: قلب، تشريح، دورة دموية',
          submit: 'إضافة البطاقة',
          saving: 'جاري الحفظ...',
          required: 'حقل مطلوب',
          loginRequired: 'يجب تسجيل الدخول لإضافة بطاقة تعليمية.',
          success: 'تمت إضافة البطاقة التعليمية بنجاح !',
          saveError: 'حدث خطأ أثناء إضافة البطاقة التعليمية.',
          minQuestion: 'يجب أن يحتوي السؤال على 5 أحرف على الأقل.',
          minAnswer: 'يجب أن تحتوي الإجابة على حرفين على الأقل.',
          preview: 'معاينة',
          front: 'السؤال',
          backSide: 'الإجابة',
          optional: 'اختياري',
          categories: {
            anatomy: 'التشريح',
            physiology: 'علم وظائف الأعضاء',
            pharmacology: 'علم الأدوية',
            pathology: 'علم الأمراض',
            clinical: 'الممارسة السريرية',
            terminology: 'المصطلحات الطبية',
            other: 'أخرى',
          },
          difficulties: {
            easy: 'سهل',
            medium: 'متوسط',
            hard: 'صعب',
          },
        },
      }[language] || {}),
    [language]
  );

  const categories = [
    'anatomy',
    'physiology',
    'pharmacology',
    'pathology',
    'clinical',
    'terminology',
    'other',
  ];

  const difficulties = ['easy', 'medium', 'hard'];

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = t.required;
    }

    if (!formData.question.trim()) {
      nextErrors.question = t.required;
    } else if (formData.question.trim().length < 5) {
      nextErrors.question = t.minQuestion;
    }

    if (!formData.answer.trim()) {
      nextErrors.answer = t.required;
    } else if (formData.answer.trim().length < 2) {
      nextErrors.answer = t.minAnswer;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setGlobalMessage({ type: '', text: '' });

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGlobalMessage({ type: '', text: '' });

    if (!user) {
      setGlobalMessage({
        type: 'error',
        text: t.loginRequired,
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      await addDoc(collection(db, 'flashcards'), {
        title: {
          [language]: formData.title.trim(),
          fr: language === 'fr' ? formData.title.trim() : '',
          ar: language === 'ar' ? formData.title.trim() : '',
        },
        question: {
          [language]: formData.question.trim(),
          fr: language === 'fr' ? formData.question.trim() : '',
          ar: language === 'ar' ? formData.question.trim() : '',
        },
        answer: {
          [language]: formData.answer.trim(),
          fr: language === 'fr' ? formData.answer.trim() : '',
          ar: language === 'ar' ? formData.answer.trim() : '',
        },
        explanation: {
          [language]: formData.explanation.trim(),
          fr: language === 'fr' ? formData.explanation.trim() : '',
          ar: language === 'ar' ? formData.explanation.trim() : '',
        },
        category: formData.category,
        difficulty: formData.difficulty,
        tags: tagsArray,
        language,
        createdBy: user.uid,
        ownerId: user.uid,
        visibility: 'shared',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: 'admin-manual',
        status: 'active',
      });

      setGlobalMessage({
        type: 'success',
        text: t.success,
      });

      setFormData({
        title: '',
        category: 'anatomy',
        difficulty: 'medium',
        question: '',
        answer: '',
        explanation: '',
        tags: '',
      });

      setTimeout(() => {
        navigate('/admin/flashcards');
      }, 1200);
    } catch (err) {
      console.error('Erreur ajout flashcard:', err);
      setGlobalMessage({
        type: 'error',
        text: t.saveError,
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `mt-2 w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 ${
      errors[field]
        ? 'border-red-300 bg-red-50 focus:ring-red-200'
        : 'border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-100'
    }`;

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <NavLink
            to="/admin/flashcards"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t.back}
          </NavLink>
        </div>

        <header className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                <Layers className="h-4 w-4" />
                Flashcards
              </div>

              <h1 className="text-3xl font-bold md:text-4xl">{t.pageTitle}</h1>
              <p className="mt-3 max-w-3xl text-blue-100">{t.pageSubtitle}</p>
            </div>

            <div className="hidden rounded-3xl bg-white/10 p-5 md:block">
              <BookOpen className="h-20 w-20 text-white/80" />
            </div>
          </div>
        </header>

        {globalMessage.text && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
              globalMessage.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
            role="alert"
          >
            {globalMessage.type === 'success' ? (
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            )}
            <p className="font-medium">{globalMessage.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <section className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg md:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t.pageTitle}</h2>
                  <p className="text-sm text-gray-500">
                    {language === 'fr'
                      ? 'Les champs marqués avec * sont obligatoires.'
                      : 'الحقول التي تحتوي على * مطلوبة.'}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    {t.title} *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={t.titlePlaceholder}
                    className={inputClass('title')}
                    disabled={loading}
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      {t.category}
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={inputClass('category')}
                      disabled={loading}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {t.categories[category]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      {t.difficulty}
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleChange}
                      className={inputClass('difficulty')}
                      disabled={loading}
                    >
                      {difficulties.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {t.difficulties[difficulty]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    {t.question} *
                  </label>
                  <textarea
                    name="question"
                    value={formData.question}
                    onChange={handleChange}
                    placeholder={t.questionPlaceholder}
                    className={`${inputClass('question')} min-h-[110px] resize-y`}
                    disabled={loading}
                  />
                  {errors.question && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      {errors.question}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t.answer} *
                  </label>
                  <textarea
                    name="answer"
                    value={formData.answer}
                    onChange={handleChange}
                    placeholder={t.answerPlaceholder}
                    className={`${inputClass('answer')} min-h-[110px] resize-y`}
                    disabled={loading}
                  />
                  {errors.answer && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      {errors.answer}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FileText className="h-4 w-4 text-purple-600" />
                    {t.explanation}
                    <span className="text-xs font-normal text-gray-400">
                      ({t.optional})
                    </span>
                  </label>
                  <textarea
                    name="explanation"
                    value={formData.explanation}
                    onChange={handleChange}
                    placeholder={t.explanationPlaceholder}
                    className={`${inputClass('explanation')} min-h-[100px] resize-y`}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    {t.tags}
                    <span className="mx-1 text-xs font-normal text-gray-400">
                      ({t.optional})
                    </span>
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder={t.tagsPlaceholder}
                    className={inputClass('tags')}
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-lg transition ${
                    loading
                      ? 'cursor-not-allowed bg-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      {t.saving}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {t.submit}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="lg:col-span-2">
            <div className="sticky top-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-gray-900">
                <BookOpen className="h-5 w-5 text-blue-600" />
                {t.preview}
              </h2>

              <div className="space-y-5">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                    {t.front}
                  </p>
                  <h3 className="mb-3 text-lg font-bold text-gray-900">
                    {formData.title || t.titlePlaceholder}
                  </h3>
                  <p className="whitespace-pre-wrap text-gray-700">
                    {formData.question || t.questionPlaceholder}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">
                    {t.backSide}
                  </p>
                  <p className="whitespace-pre-wrap font-semibold text-gray-800">
                    {formData.answer || t.answerPlaceholder}
                  </p>

                  {formData.explanation.trim() && (
                    <div className="mt-4 rounded-xl bg-white/70 p-4">
                      <p className="mb-1 text-xs font-bold text-gray-500">
                        {t.explanation}
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-gray-700">
                        {formData.explanation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {t.categories[formData.category]}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {t.difficulties[formData.difficulty]}
                  </span>
                  {formData.tags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default AddFlashcards;
