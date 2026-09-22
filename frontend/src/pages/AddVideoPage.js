import SemesterSelect, { validContentSemester } from '../components/SemesterSelect';
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  FileVideo,
  Link as LinkIcon,
  Loader2,
  PlayCircle,
  Save,
  UploadCloud,
  Video,
  X,
  Youtube,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, storage } from '../firebase';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const AddVideoPage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const uploadTaskRef = useRef(null);

  const isRTL = language === 'ar';

  const [videoType, setVideoType] = useState('upload');
  const [formData, setFormData] = useState({
    titleFr: '',
    titleAr: '',
    descriptionFr: '',
    descriptionAr: '',
    youtubeUrl: '',
    category: 'general-medicine',
    level: 'beginner',
    semester: '',
    duration: '',
    isPremium: false,
  });

  const [file, setFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const texts = useMemo(
    () =>
      ({
        fr: {
          pageTitle: 'Ajouter une vidéo',
          subtitle:
            'Ajoutez une vidéo pédagogique à la bibliothèque MedPlatform Maroc.',
          back: 'Retour aux vidéos',
          typeTitle: 'Source de la vidéo',
          uploadVideo: 'Importer un fichier',
          uploadHint: 'MP4, WebM, MOV. Taille maximale : 100 MB.',
          youtubeVideo: 'Lien YouTube',
          youtubeHint: 'Ajoutez une vidéo déjà publiée sur YouTube.',
          titleFr: 'Titre en français',
          titleAr: 'Titre en arabe',
          descriptionFr: 'Description en français',
          descriptionAr: 'Description en arabe',
          titleFrPlaceholder: 'Ex : Introduction à l’anatomie cardiaque',
          titleArPlaceholder: 'مثال: مقدمة في تشريح القلب',
          descriptionFrPlaceholder: 'Décrivez le contenu de la vidéo...',
          descriptionArPlaceholder: 'اكتب وصفاً لمحتوى الفيديو...',
          youtubeUrl: 'URL YouTube',
          youtubeUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
          videoFile: 'Fichier vidéo',
          chooseFile: 'Choisir une vidéo',
          replaceFile: 'Remplacer le fichier',
          selectedFile: 'Fichier sélectionné',
          category: 'Catégorie',
          level: 'Niveau',
          semester: 'Semestre',
          semesterPlaceholder: 'Ex : 1',
          duration: 'Durée estimée',
          durationPlaceholder: 'Ex : 12 min',
          isPremium: 'Contenu premium',
          isPremiumHint: 'Réservé aux utilisateurs abonnés.',
          upload: 'Ajouter la vidéo',
          uploading: 'Téléchargement...',
          saving: 'Enregistrement...',
          cancel: 'Annuler',
          cancelUpload: 'Annuler l’upload',
          progress: 'Progression',
          preview: 'Aperçu',
          youtubeValid: 'URL YouTube valide',
          youtubeInvalid: 'URL YouTube invalide',
          noFile: 'Aucun fichier sélectionné',
          success: 'Vidéo ajoutée avec succès !',
          required: 'Champ requis.',
          categories: {
            'general-medicine': 'Médecine générale',
            anatomy: 'Anatomie',
            physiology: 'Physiologie',
            pharmacology: 'Pharmacologie',
            pathology: 'Pathologie',
            cardiology: 'Cardiologie',
            dentistry: 'Dentaire',
            surgery: 'Chirurgie',
            clinical: 'Pratique clinique',
            technology: 'Technologie médicale',
            other: 'Autres',
          },
          levels: {
            beginner: 'Débutant',
            intermediate: 'Intermédiaire',
            advanced: 'Avancé',
          },
          errors: {
            loginRequired: 'Veuillez vous connecter.',
            adminRequired: 'Accès réservé aux administrateurs.',
            titleRequired: 'Le titre français ou arabe est requis.',
            descriptionRequired: 'La description française ou arabe est requise.',
            fileRequired: 'Veuillez sélectionner un fichier vidéo.',
            invalidFileType: 'Le fichier sélectionné doit être une vidéo.',
            fileSizeLimit: `Le fichier est trop volumineux. Maximum ${MAX_VIDEO_SIZE_MB} MB.`,
            invalidYouTubeUrl: 'URL YouTube invalide.',
            semesterInvalid: 'Le semestre doit être compris entre 1 et 12.',
            uploadError: 'Erreur lors du téléchargement.',
            saveError: 'Erreur lors de l’enregistrement.',
            cancelled: 'Upload annulé.',
          },
        },
        ar: {
          pageTitle: 'إضافة فيديو',
          subtitle: 'أضف فيديو تعليمي إلى مكتبة MedPlatform Maroc.',
          back: 'العودة إلى الفيديوهات',
          typeTitle: 'مصدر الفيديو',
          uploadVideo: 'رفع ملف',
          uploadHint: 'MP4 أو WebM أو MOV. الحد الأقصى: 100 ميجابايت.',
          youtubeVideo: 'رابط YouTube',
          youtubeHint: 'أضف فيديو منشوراً على YouTube.',
          titleFr: 'العنوان بالفرنسية',
          titleAr: 'العنوان بالعربية',
          descriptionFr: 'الوصف بالفرنسية',
          descriptionAr: 'الوصف بالعربية',
          titleFrPlaceholder: 'Ex : Introduction à l’anatomie cardiaque',
          titleArPlaceholder: 'مثال: مقدمة في تشريح القلب',
          descriptionFrPlaceholder: 'اكتب وصفاً بالفرنسية...',
          descriptionArPlaceholder: 'اكتب وصفاً لمحتوى الفيديو...',
          youtubeUrl: 'رابط YouTube',
          youtubeUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
          videoFile: 'ملف الفيديو',
          chooseFile: 'اختيار فيديو',
          replaceFile: 'تغيير الملف',
          selectedFile: 'الملف المحدد',
          category: 'الفئة',
          level: 'المستوى',
          semester: 'الفصل الدراسي',
          semesterPlaceholder: 'مثال: 1',
          duration: 'المدة التقريبية',
          durationPlaceholder: 'مثال: 12 دقيقة',
          isPremium: 'محتوى مدفوع',
          isPremiumHint: 'مخصص للمشتركين.',
          upload: 'إضافة الفيديو',
          uploading: 'جاري الرفع...',
          saving: 'جاري الحفظ...',
          cancel: 'إلغاء',
          cancelUpload: 'إلغاء الرفع',
          progress: 'التقدم',
          preview: 'معاينة',
          youtubeValid: 'رابط YouTube صالح',
          youtubeInvalid: 'رابط YouTube غير صالح',
          noFile: 'لم يتم اختيار أي ملف',
          success: 'تمت إضافة الفيديو بنجاح!',
          required: 'هذا الحقل مطلوب.',
          categories: {
            'general-medicine': 'الطب العام',
            anatomy: 'علم التشريح',
            physiology: 'علم وظائف الأعضاء',
            pharmacology: 'علم الأدوية',
            pathology: 'علم الأمراض',
            cardiology: 'أمراض القلب',
            dentistry: 'طب الأسنان',
            surgery: 'الجراحة',
            clinical: 'الممارسة السريرية',
            technology: 'التكنولوجيا الطبية',
            other: 'أخرى',
          },
          levels: {
            beginner: 'مبتدئ',
            intermediate: 'متوسط',
            advanced: 'متقدم',
          },
          errors: {
            loginRequired: 'يرجى تسجيل الدخول.',
            adminRequired: 'الوصول مخصص للمسؤولين فقط.',
            titleRequired: 'العنوان بالفرنسية أو العربية مطلوب.',
            descriptionRequired: 'الوصف بالفرنسية أو العربية مطلوب.',
            fileRequired: 'يرجى اختيار ملف فيديو.',
            invalidFileType: 'يجب أن يكون الملف المحدد فيديو.',
            fileSizeLimit: `حجم الملف كبير جداً. الحد الأقصى ${MAX_VIDEO_SIZE_MB} ميجابايت.`,
            invalidYouTubeUrl: 'رابط YouTube غير صالح.',
            semesterInvalid: 'يجب أن يكون الفصل الدراسي بين 1 و 12.',
            uploadError: 'خطأ أثناء رفع الفيديو.',
            saveError: 'خطأ أثناء الحفظ.',
            cancelled: 'تم إلغاء الرفع.',
          },
        },
      }[language] || {}),
    [language]
  );

  const t = texts;

  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;

    const patterns = [
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) return match[1];
    }

    return null;
  };

  const isValidYouTubeUrl = (url) => Boolean(extractYouTubeId(url.trim()));

  const youtubeId = extractYouTubeId(formData.youtubeUrl);
  const youtubePreviewUrl = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : '';

  const validateForm = () => {
    const newErrors = {};

    const hasTitle = formData.titleFr.trim() || formData.titleAr.trim();
    const hasDescription =
      formData.descriptionFr.trim() || formData.descriptionAr.trim();

    if (!user) {
      newErrors.general = t.errors.loginRequired;
    }

    // Garde cette condition si seuls les admins peuvent ajouter des vidéos.
    // Si tu veux autoriser tous les utilisateurs connectés, supprime ce bloc.
    if (user && !isAdmin) {
      newErrors.general = t.errors.adminRequired;
    }

    if (!hasTitle) {
      newErrors.title = t.errors.titleRequired;
    }

    if (!hasDescription) {
      newErrors.description = t.errors.descriptionRequired;
    }

    if (!validContentSemester(formData.semester)) {
      newErrors.semester = t.errors.semesterInvalid;
    }

    if (videoType === 'upload') {
      if (!file) {
        newErrors.file = t.errors.fileRequired;
      } else if (!file.type.startsWith('video/')) {
        newErrors.file = t.errors.invalidFileType;
      } else if (file.size > MAX_VIDEO_SIZE_BYTES) {
        newErrors.file = t.errors.fileSizeLimit;
      }
    }

    if (videoType === 'youtube') {
      if (!formData.youtubeUrl.trim() || !isValidYouTubeUrl(formData.youtubeUrl)) {
        newErrors.youtubeUrl = t.errors.invalidYouTubeUrl;
      }
    }

    setErrors(newErrors);
    setGeneralError(newErrors.general || '');

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: '',
      title: field === 'titleFr' || field === 'titleAr' ? '' : prev.title,
      description:
        field === 'descriptionFr' || field === 'descriptionAr'
          ? ''
          : prev.description,
    }));

    setGeneralError('');
    setSuccessMessage('');
  };

  const handleVideoTypeChange = (type) => {
    if (loading) return;

    setVideoType(type);
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');
    setUploadProgress(0);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setFile(null);
    setLocalPreviewUrl('');
    setErrors((prev) => ({ ...prev, file: '' }));
    setGeneralError('');
    setSuccessMessage('');

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('video/')) {
      setErrors((prev) => ({
        ...prev,
        file: t.errors.invalidFileType,
      }));
      return;
    }

    if (selectedFile.size > MAX_VIDEO_SIZE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        file: t.errors.fileSizeLimit,
      }));
      return;
    }

    setFile(selectedFile);
    setLocalPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const resetForm = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setFormData({
      titleFr: '',
      titleAr: '',
      descriptionFr: '',
      descriptionAr: '',
      youtubeUrl: '',
      category: 'general-medicine',
      level: 'beginner',
      semester: '',
      duration: '',
      isPremium: false,
    });
    setFile(null);
    setLocalPreviewUrl('');
    setErrors({});
    setGeneralError('');
    setUploadProgress(0);
  };

  const buildLocalizedField = (fr, ar) => ({
    fr: fr.trim() || ar.trim(),
    ar: ar.trim() || fr.trim(),
  });

  const saveVideoToFirestore = async ({
    videoUrl,
    fileName,
    fileSize,
    fileType,
    storagePath = '',
  }) => {
    const title = buildLocalizedField(formData.titleFr, formData.titleAr);
    const description = buildLocalizedField(
      formData.descriptionFr,
      formData.descriptionAr
    );

    const videoData = {
      title,
      description,
      videoUrl,
      fileName,
      fileSize,
      fileType,
      storagePath,
      category: formData.category,
      level: formData.level,
      semester: formData.semester,
      visibility: 'shared',
      duration: formData.duration.trim(),
      type: videoType,
      isPremium: Boolean(formData.isPremium),
      uploadedBy: user.uid,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
    };

    if (videoType === 'youtube') {
      videoData.youtubeId = youtubeId;
      videoData.thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    await addDoc(collection(db, 'videos'), videoData);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setGeneralError('');
    setSuccessMessage('');
    setUploadProgress(0);

    try {
      if (videoType === 'youtube') {
        await saveVideoToFirestore({
          videoUrl: formData.youtubeUrl.trim(),
          fileName: `YouTube:${youtubeId}`,
          fileSize: 0,
          fileType: 'youtube',
        });

        setSuccessMessage(t.success);
        resetForm();

        setTimeout(() => {
          navigate('/admin/videos');
        }, 700);

        return;
      }

      const safeFileName = file.name.replace(/[^\w.\-() ]+/g, '_');
      const storagePath = `videos/${user.uid}/${uuidv4()}-${safeFileName}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          originalName: file.name,
          category: formData.category,
        },
      });

      uploadTaskRef.current = uploadTask;

      const uploadedVideoUrl = await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (uploadError) => {
            console.error('Firebase upload error:', uploadError);

            if (uploadError.code === 'storage/canceled') {
              reject(new Error(t.errors.cancelled));
              return;
            }

            if (uploadError.code === 'storage/unauthorized') {
              reject(
                new Error(
                  language === 'fr'
                    ? 'Accès Storage non autorisé. Vérifiez les règles Firebase Storage.'
                    : 'الوصول إلى Storage غير مصرح به. تحقق من قواعد Firebase Storage.'
                )
              );
              return;
            }

            reject(
              new Error(
                uploadError.message
                  ? `${t.errors.uploadError} ${uploadError.message}`
                  : t.errors.uploadError
              )
            );
          },
          async () => {
            try {
              resolve(uploadTask.snapshot.ref.toString());
            } catch (downloadError) {
              reject(downloadError);
            }
          }
        );
      });

      await saveVideoToFirestore({
        videoUrl: uploadedVideoUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath,
      });

      setSuccessMessage(t.success);
      resetForm();

      setTimeout(() => {
        navigate('/admin/videos');
      }, 700);
    } catch (err) {
      console.error('Add video error:', err);
      setGeneralError(err.message || t.errors.saveError);
    } finally {
      setLoading(false);
      uploadTaskRef.current = null;
    }
  };

  const cancelUpload = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
    }

    setLoading(false);
    setUploadProgress(0);
    setGeneralError(t.errors.cancelled);
  };

  const TypeCard = ({ type, icon, title, hint }) => {
    const selected = videoType === type;

    return (
      <button
        type="button"
        onClick={() => handleVideoTypeChange(type)}
        disabled={loading}
        className={`rounded-2xl border p-5 text-left transition ${
          selected
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
        } ${isRTL ? 'text-right' : 'text-left'}`}
      >
        <div className="mb-3 flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {icon}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{hint}</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4 py-10 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <NavLink
            to="/admin/videos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t.back}
          </NavLink>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <Video className="h-8 w-8" aria-hidden="true" />
                </div>
                <h1 className="text-3xl font-bold">{t.pageTitle}</h1>
                <p className="mt-2 max-w-2xl text-blue-100">{t.subtitle}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8" noValidate>
            {(generalError || successMessage) && (
              <div
                className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
                  successMessage
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
                role="alert"
              >
                {successMessage ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{successMessage || generalError}</p>
              </div>
            )}

            <section className="mb-8">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                {t.typeTitle}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <TypeCard
                  type="upload"
                  title={t.uploadVideo}
                  hint={t.uploadHint}
                  icon={<UploadCloud className="h-6 w-6" />}
                />
                <TypeCard
                  type="youtube"
                  title={t.youtubeVideo}
                  hint={t.youtubeHint}
                  icon={<Youtube className="h-6 w-6" />}
                />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.titleFr}
                  </label>
                  <input
                    type="text"
                    value={formData.titleFr}
                    onChange={(e) => handleChange('titleFr', e.target.value)}
                    disabled={loading}
                    placeholder={t.titleFrPlaceholder}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.titleAr}
                  </label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) => handleChange('titleAr', e.target.value)}
                    disabled={loading}
                    placeholder={t.titleArPlaceholder}
                    dir="rtl"
                    className={`w-full rounded-2xl border px-4 py-3 text-right outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.descriptionFr}
                  </label>
                  <textarea
                    value={formData.descriptionFr}
                    onChange={(e) =>
                      handleChange('descriptionFr', e.target.value)
                    }
                    disabled={loading}
                    placeholder={t.descriptionFrPlaceholder}
                    rows="4"
                    className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.descriptionAr}
                  </label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) =>
                      handleChange('descriptionAr', e.target.value)
                    }
                    disabled={loading}
                    placeholder={t.descriptionArPlaceholder}
                    rows="4"
                    dir="rtl"
                    className={`w-full rounded-2xl border px-4 py-3 text-right outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      {t.category}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      disabled={loading}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      {Object.entries(t.categories).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      {t.level}
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) => handleChange('level', e.target.value)}
                      disabled={loading}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      {Object.entries(t.levels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <SemesterSelect value={formData.semester} onChange={(event) => handleChange('semester', event.target.value)} language={language} allowAll disabled={loading} />
                    {errors.semester && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.semester}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      {t.duration}
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => handleChange('duration', e.target.value)}
                      disabled={loading}
                      placeholder={t.durationPlaceholder}
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isPremium}
                    onChange={(e) => handleChange('isPremium', e.target.checked)}
                    disabled={loading}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    <span className="font-semibold">{t.isPremium}</span>
                    <span className="block text-gray-500">{t.isPremiumHint}</span>
                  </span>
                </label>

                {videoType === 'youtube' ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      {t.youtubeUrl}
                    </label>
                    <div className="relative">
                      <LinkIcon
                        className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${
                          isRTL ? 'right-4' : 'left-4'
                        }`}
                      />
                      <input
                        type="url"
                        value={formData.youtubeUrl}
                        onChange={(e) =>
                          handleChange('youtubeUrl', e.target.value)
                        }
                        disabled={loading}
                        placeholder={t.youtubeUrlPlaceholder}
                        className={`w-full rounded-2xl border py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                          isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'
                        } ${errors.youtubeUrl ? 'border-red-300' : 'border-gray-300'}`}
                      />
                    </div>

                    {errors.youtubeUrl && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.youtubeUrl}
                      </p>
                    )}

                    {formData.youtubeUrl && (
                      <div
                        className={`mt-3 rounded-2xl border p-4 ${
                          youtubeId
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div
                          className={`mb-3 flex items-center gap-2 text-sm font-semibold ${
                            youtubeId ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {youtubeId ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <AlertCircle className="h-5 w-5" />
                          )}
                          {youtubeId ? t.youtubeValid : t.youtubeInvalid}
                        </div>

                        {youtubeId && (
                          <div>
                            <p className="mb-2 text-xs text-gray-600">
                              YouTube ID: {youtubeId}
                            </p>
                            <img
                              src={youtubePreviewUrl}
                              alt={t.preview}
                              className="w-full rounded-xl border border-white shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      {t.videoFile}
                    </label>

                    <label
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                        errors.file
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <UploadCloud className="mb-3 h-10 w-10 text-blue-600" />
                      <span className="font-semibold text-gray-900">
                        {file ? t.replaceFile : t.chooseFile}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        {t.uploadHint}
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        disabled={loading}
                        className="hidden"
                      />
                    </label>

                    {errors.file && (
                      <p className="mt-2 text-sm text-red-600">{errors.file}</p>
                    )}

                    {file && (
                      <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
                          <FileVideo className="h-5 w-5" />
                          {t.selectedFile}
                        </div>
                        <p className="text-sm text-blue-700">{file.name}</p>
                        <p className="text-xs text-blue-600">
                          {formatFileSize(file.size)} · {file.type}
                        </p>

                        {localPreviewUrl && (
                          <video
                            src={localPreviewUrl}
                            controls
                            className="mt-4 max-h-64 w-full rounded-xl bg-black"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {loading && videoType === 'upload' && (
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="mb-2 flex justify-between text-sm font-semibold text-gray-700">
                      <span>{t.progress}</span>
                      <span>{uploadProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {videoType === 'upload' ? t.uploading : t.saving}
                  </>
                ) : (
                  <>
                    {videoType === 'upload' ? (
                      <UploadCloud className="h-5 w-5" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    {t.upload}
                  </>
                )}
              </button>

              {loading ? (
                <button
                  type="button"
                  onClick={cancelUpload}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-6 py-3 font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <X className="h-5 w-5" />
                  {t.cancelUpload}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/admin/videos')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <X className="h-5 w-5" />
                  {t.cancel}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default AddVideoPage;
