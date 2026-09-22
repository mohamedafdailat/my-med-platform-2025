// C:\my-med-platform\frontend\src\pages\AdminCourses.js

import SemesterSelect, { validContentSemester } from '../components/SemesterSelect';
import ContentSemesterEditor from '../components/ContentSemesterEditor';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Loader,
  PlusCircle,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { db, storage } from '../firebase/config';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  deleteObject,
} from 'firebase/storage';

const MAX_PDF_SIZE_MB = 50;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

const AdminCourses = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    title: { fr: '', ar: '' },
    description: { fr: '', ar: '' },
    category: 'anatomy',
    semester: '',
    difficulty: 'beginner',
    estimatedDuration: '',
    pdfFile: null,
    pdfUrl: '',
    pdfSource: 'url',
    status: 'active',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  const t = useMemo(
    () =>
      ({
        fr: {
          pageTitle: 'Gestion des cours',
          pageSubtitle:
            'Ajoutez, consultez et supprimez les cours disponibles sur la plateforme.',
          addCourse: 'Ajouter un cours',
          courseList: 'Cours existants',
          titleFr: 'Titre en français',
          titleAr: 'Titre en arabe',
          descFr: 'Description en français',
          descAr: 'Description en arabe',
          category: 'Catégorie',
          difficulty: 'Difficulté',
          duration: 'Durée estimée',
          durationPlaceholder: 'Ex : 2h 30min',
          pdfDocument: 'Document PDF',
          pdfSource: 'Source du PDF',
          pdfUrl: 'URL du PDF',
          pdfUrlPlaceholder: 'https://exemple.com/document.pdf',
          uploadPdf: 'Importer un fichier PDF',
          url: 'URL',
          selectedFile: 'Fichier sélectionné',
          addButton: 'Ajouter le cours',
          adding: 'Ajout en cours...',
          loading: 'Chargement...',
          noCourses: 'Aucun cours disponible pour le moment.',
          seePdf: 'Voir le PDF',
          delete: 'Supprimer',
          confirmDelete: 'Confirmer la suppression de ce cours ?',
          requiredBothLanguages:
            'Le titre et la description sont requis dans les deux langues.',
          pdfUrlRequired: 'L’URL du PDF est requise.',
          pdfFileRequired: 'Veuillez sélectionner un fichier PDF.',
          invalidPdf: 'Le fichier doit être un PDF valide.',
          pdfTooLarge: `Le PDF ne doit pas dépasser ${MAX_PDF_SIZE_MB} MB.`,
          loadError: 'Erreur lors du chargement des cours.',
          addError: 'Erreur lors de l’ajout du cours.',
          deleteError: 'Erreur lors de la suppression.',
          addSuccess: 'Cours ajouté avec succès !',
          deleteSuccess: 'Cours supprimé avec succès.',
          uploadProgress: 'Progression upload',
          active: 'Actif',
          inactive: 'Inactif',
          pdfStored: 'PDF stocké',
          pdfExternal: 'PDF externe',
          modules: 'modules',
          categories: {
            anatomy: 'Anatomie',
            physiology: 'Physiologie',
            pharmacology: 'Pharmacologie',
            pathology: 'Pathologie',
            surgery: 'Chirurgie',
            clinical: 'Pratique clinique',
            terminology: 'Terminologie médicale',
            other: 'Autre',
          },
          difficulties: {
            beginner: 'Débutant',
            intermediate: 'Intermédiaire',
            advanced: 'Avancé',
          },
        },
        ar: {
          pageTitle: 'إدارة الدروس',
          pageSubtitle:
            'أضف الدروس، اعرضها، واحذف المحتوى المتاح على المنصة.',
          addCourse: 'إضافة درس',
          courseList: 'الدروس الحالية',
          titleFr: 'العنوان بالفرنسية',
          titleAr: 'العنوان بالعربية',
          descFr: 'الوصف بالفرنسية',
          descAr: 'الوصف بالعربية',
          category: 'الفئة',
          difficulty: 'الصعوبة',
          duration: 'المدة التقديرية',
          durationPlaceholder: 'مثال: ساعتان و30 دقيقة',
          pdfDocument: 'وثيقة PDF',
          pdfSource: 'مصدر PDF',
          pdfUrl: 'رابط PDF',
          pdfUrlPlaceholder: 'https://example.com/document.pdf',
          uploadPdf: 'رفع ملف PDF',
          url: 'رابط',
          selectedFile: 'الملف المحدد',
          addButton: 'إضافة الدرس',
          adding: 'جاري الإضافة...',
          loading: 'جاري التحميل...',
          noCourses: 'لا توجد دروس حالياً.',
          seePdf: 'عرض PDF',
          delete: 'حذف',
          confirmDelete: 'هل تريد تأكيد حذف هذا الدرس؟',
          requiredBothLanguages:
            'العنوان والوصف مطلوبان باللغتين.',
          pdfUrlRequired: 'رابط PDF مطلوب.',
          pdfFileRequired: 'يرجى اختيار ملف PDF.',
          invalidPdf: 'يجب أن يكون الملف بصيغة PDF.',
          pdfTooLarge: `يجب ألا يتجاوز ملف PDF ${MAX_PDF_SIZE_MB} MB.`,
          loadError: 'خطأ أثناء تحميل الدروس.',
          addError: 'خطأ أثناء إضافة الدرس.',
          deleteError: 'خطأ أثناء الحذف.',
          addSuccess: 'تمت إضافة الدرس بنجاح !',
          deleteSuccess: 'تم حذف الدرس بنجاح.',
          uploadProgress: 'تقدم الرفع',
          active: 'نشط',
          inactive: 'غير نشط',
          pdfStored: 'PDF مخزن',
          pdfExternal: 'PDF خارجي',
          modules: 'وحدات',
          categories: {
            anatomy: 'التشريح',
            physiology: 'علم وظائف الأعضاء',
            pharmacology: 'علم الأدوية',
            pathology: 'علم الأمراض',
            surgery: 'الجراحة',
            clinical: 'الممارسة السريرية',
            terminology: 'المصطلحات الطبية',
            other: 'أخرى',
          },
          difficulties: {
            beginner: 'مبتدئ',
            intermediate: 'متوسط',
            advanced: 'متقدم',
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
    'surgery',
    'clinical',
    'terminology',
    'other',
  ];

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  const getLocalizedText = (textObj) => {
    if (typeof textObj === 'string') return textObj;
    return textObj?.[language] || textObj?.fr || textObj?.ar || '';
  };

  const resetForm = () => {
    setNewCourse({
      title: { fr: '', ar: '' },
      description: { fr: '', ar: '' },
      category: 'anatomy',
    semester: '',
      difficulty: 'beginner',
      estimatedDuration: '',
      pdfFile: null,
      pdfUrl: '',
      pdfSource: 'url',
      status: 'active',
    });
    setUploadProgress(0);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const fetchCourses = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Include legacy courses without createdAt so the admin can classify them.
      const snapshot = await getDocs(collection(db, 'courses'));

      const coursesList = snapshot.docs.map((courseDoc) => ({
        id: courseDoc.id,
        ...courseDoc.data(),
      }));

      setCourses(coursesList);
    } catch (err) {
      console.error('Erreur chargement cours:', err);
      showMessage('error', t.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const validateForm = () => {
    if (!validContentSemester(newCourse.semester)) {
      showMessage('error', language === 'ar' ? 'اختر الفصل الدراسي للمحتوى.' : 'Choisissez le semestre de ce cours.');
      return false;
    }
    const titleFr = newCourse.title.fr.trim();
    const titleAr = newCourse.title.ar.trim();
    const descFr = newCourse.description.fr.trim();
    const descAr = newCourse.description.ar.trim();

    if (!titleFr || !titleAr || !descFr || !descAr) {
      showMessage('error', t.requiredBothLanguages);
      return false;
    }

    if (newCourse.pdfSource === 'url') {
      if (!newCourse.pdfUrl.trim()) {
        showMessage('error', t.pdfUrlRequired);
        return false;
      }
    }

    if (newCourse.pdfSource === 'upload') {
      if (!newCourse.pdfFile) {
        showMessage('error', t.pdfFileRequired);
        return false;
      }

      if (newCourse.pdfFile.type !== 'application/pdf') {
        showMessage('error', t.invalidPdf);
        return false;
      }

      if (newCourse.pdfFile.size > MAX_PDF_SIZE_BYTES) {
        showMessage('error', t.pdfTooLarge);
        return false;
      }
    }

    return true;
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();

    setMessage({ type: '', text: '' });

    if (!validateForm()) return;

    setSaving(true);
    setUploadProgress(0);

    try {
      let pdfUrl = '';
      let pdfFileName = '';
      let pdfStoragePath = '';
      let pdfType = newCourse.pdfSource === 'upload' ? 'storage' : 'external';

      if (newCourse.pdfSource === 'url') {
        pdfUrl = newCourse.pdfUrl.trim();
      }

      if (newCourse.pdfSource === 'upload' && newCourse.pdfFile) {
        const safeFileName = newCourse.pdfFile.name.replace(/[^\w.\-() ]/g, '_');
        pdfStoragePath = `courses/pdfs/${Date.now()}_${safeFileName}`;
        const storageRef = ref(storage, pdfStoragePath);

        const uploadTask = uploadBytesResumable(storageRef, newCourse.pdfFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (err) => reject(err),
            async () => {
              pdfUrl = uploadTask.snapshot.ref.toString();
              pdfFileName = newCourse.pdfFile.name;
              resolve();
            }
          );
        });
      }

      const courseData = {
        title: {
          fr: newCourse.title.fr.trim(),
          ar: newCourse.title.ar.trim(),
        },
        description: {
          fr: newCourse.description.fr.trim(),
          ar: newCourse.description.ar.trim(),
        },
        category: newCourse.category,
        visibility: 'shared',
        semester: newCourse.semester,
        difficulty: newCourse.difficulty,
        estimatedDuration: newCourse.estimatedDuration.trim(),
        pdfUrl,
        pdfFileName,
        pdfStoragePath,
        pdfType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: newCourse.status,
        modules: [],
        hasPdf: Boolean(pdfUrl),
        hasQuiz: false,
        hasVideo: false,
      };

      const docRef = await addDoc(collection(db, 'courses'), courseData);

      setCourses((prev) => [
        {
          id: docRef.id,
          ...courseData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      resetForm();
      showMessage('success', t.addSuccess);
    } catch (err) {
      console.error('Erreur ajout cours:', err);
      showMessage('error', `${t.addError} ${err.message || ''}`);
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (course) => {
    const confirmed = window.confirm(t.confirmDelete);
    if (!confirmed) return;

    setMessage({ type: '', text: '' });

    try {
      if (course.pdfStoragePath) {
        try {
          await deleteObject(ref(storage, course.pdfStoragePath));
        } catch (storageError) {
          console.warn('PDF Storage non supprimé:', storageError);
        }
      }

      await deleteDoc(doc(db, 'courses', course.id));
      setCourses((prev) => prev.filter((item) => item.id !== course.id));

      showMessage('success', t.deleteSuccess);
    } catch (err) {
      console.error('Erreur suppression cours:', err);
      showMessage('error', t.deleteError);
    }
  };

  const updateTitle = (lang, value) => {
    setNewCourse((prev) => ({
      ...prev,
      title: {
        ...prev.title,
        [lang]: value,
      },
    }));
  };

  const updateDescription = (lang, value) => {
    setNewCourse((prev) => ({
      ...prev,
      description: {
        ...prev.description,
        [lang]: value,
      },
    }));
  };

  const inputClass =
    'mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100';

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4" />
                Admin
              </div>
              <h1 className="text-3xl font-bold md:text-4xl">{t.pageTitle}</h1>
              <p className="mt-3 max-w-3xl text-blue-100">{t.pageSubtitle}</p>
            </div>

            <div className="rounded-3xl bg-white/10 p-5">
              <FileText className="h-16 w-16 text-white/80" />
            </div>
          </div>
        </header>

        {message.text && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
              message.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
            role="alert"
          >
            {message.type === 'success' ? (
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <section className="mb-10 rounded-3xl border border-gray-100 bg-white p-6 shadow-lg md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t.addCourse}</h2>
              <p className="text-sm text-gray-500">
                {language === 'fr'
                  ? 'Complétez les informations du cours en français et en arabe.'
                  : 'أكمل معلومات الدرس بالفرنسية والعربية.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleAddCourse} className="space-y-6">
            <SemesterSelect value={newCourse.semester} onChange={event => setNewCourse(previous => ({ ...previous, semester: event.target.value }))} language={language} allowAll disabled={saving} />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  {t.titleFr} *
                </label>
                <input
                  type="text"
                  value={newCourse.title.fr}
                  onChange={(e) => updateTitle('fr', e.target.value)}
                  className={inputClass}
                  disabled={saving}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  {t.titleAr} *
                </label>
                <input
                  type="text"
                  value={newCourse.title.ar}
                  onChange={(e) => updateTitle('ar', e.target.value)}
                  className={inputClass}
                  disabled={saving}
                  required
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  {t.descFr} *
                </label>
                <textarea
                  value={newCourse.description.fr}
                  onChange={(e) => updateDescription('fr', e.target.value)}
                  className={`${inputClass} min-h-[110px] resize-y`}
                  disabled={saving}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  {t.descAr} *
                </label>
                <textarea
                  value={newCourse.description.ar}
                  onChange={(e) => updateDescription('ar', e.target.value)}
                  className={`${inputClass} min-h-[110px] resize-y`}
                  disabled={saving}
                  required
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  {t.category}
                </label>
                <select
                  value={newCourse.category}
                  onChange={(e) =>
                    setNewCourse((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className={inputClass}
                  disabled={saving}
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
                  value={newCourse.difficulty}
                  onChange={(e) =>
                    setNewCourse((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  className={inputClass}
                  disabled={saving}
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {t.difficulties[difficulty]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  {t.duration}
                </label>
                <input
                  type="text"
                  value={newCourse.estimatedDuration}
                  onChange={(e) =>
                    setNewCourse((prev) => ({
                      ...prev,
                      estimatedDuration: e.target.value,
                    }))
                  }
                  placeholder={t.durationPlaceholder}
                  className={inputClass}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                <UploadCloud className="h-5 w-5 text-blue-600" />
                {t.pdfDocument}
              </h3>

              <div className="mb-5 flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm">
                  <input
                    type="radio"
                    name="pdfSource"
                    value="url"
                    checked={newCourse.pdfSource === 'url'}
                    onChange={() =>
                      setNewCourse((prev) => ({
                        ...prev,
                        pdfSource: 'url',
                        pdfFile: null,
                      }))
                    }
                    disabled={saving}
                  />
                  {t.url}
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm">
                  <input
                    type="radio"
                    name="pdfSource"
                    value="upload"
                    checked={newCourse.pdfSource === 'upload'}
                    onChange={() =>
                      setNewCourse((prev) => ({
                        ...prev,
                        pdfSource: 'upload',
                        pdfUrl: '',
                      }))
                    }
                    disabled={saving}
                  />
                  {t.uploadPdf}
                </label>
              </div>

              {newCourse.pdfSource === 'url' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    {t.pdfUrl} *
                  </label>
                  <input
                    type="url"
                    value={newCourse.pdfUrl}
                    onChange={(e) =>
                      setNewCourse((prev) => ({
                        ...prev,
                        pdfUrl: e.target.value,
                      }))
                    }
                    placeholder={t.pdfUrlPlaceholder}
                    className={inputClass}
                    disabled={saving}
                  />
                </div>
              )}

              {newCourse.pdfSource === 'upload' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    {t.uploadPdf} *
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) =>
                      setNewCourse((prev) => ({
                        ...prev,
                        pdfFile: e.target.files?.[0] || null,
                      }))
                    }
                    className={inputClass}
                    disabled={saving}
                  />

                  {newCourse.pdfFile && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                      <FileText className="h-4 w-4" />
                      <span>
                        {t.selectedFile}: {newCourse.pdfFile.name} (
                        {(newCourse.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  )}

                  {saving && uploadProgress > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-sm font-medium text-gray-600">
                        <span>{t.uploadProgress}</span>
                        <span>{uploadProgress.toFixed(0)}%</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-gray-200">
                        <div
                          className="h-3 rounded-full bg-blue-600 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-lg transition md:w-auto ${
                saving
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  {t.adding}
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5" />
                  {t.addButton}
                </>
              )}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t.courseList}</h2>
              <p className="text-sm text-gray-500">
                {courses.length} {language === 'fr' ? 'cours' : 'درس'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-gray-600">
              <Loader className="h-5 w-5 animate-spin" />
              {t.loading}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="font-medium text-gray-500">{t.noCourses}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:bg-white hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                            course.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {course.status === 'active' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {course.status === 'active' ? t.active : t.inactive}
                        </span>

                        {course.category && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {t.categories[course.category] || course.category}
                          </span>
                        )}

                        {course.difficulty && (
                          <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
                            {t.difficulties[course.difficulty] ||
                              course.difficulty}
                          </span>
                        )}

                        {course.pdfType && (
                          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                            {course.pdfType === 'storage'
                              ? t.pdfStored
                              : t.pdfExternal}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-900">
                        {getLocalizedText(course.title) ||
                          (language === 'fr' ? 'Sans titre' : 'بدون عنوان')}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        {getLocalizedText(course.description)}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {course.estimatedDuration && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {course.estimatedDuration}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {course.modules?.length || 0} {t.modules}
                        </span>
                      </div>

                      <ContentSemesterEditor collectionName="courses" item={course} language={language} onUpdated={fetchCourses} />
                      {(course.pdfUrl || course.pdfStoragePath) && (
                        <div className="mt-4">
                          <a
                            href={`/courses/${course.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                          >
                            <FileText className="h-4 w-4" />
                            {t.seePdf}
                            {course.pdfFileName ? ` (${course.pdfFileName})` : ''}
                          </a>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(course)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t.delete}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminCourses;
