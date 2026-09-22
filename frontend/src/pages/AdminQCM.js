// C:\my-med-platform\frontend\src\pages\AdminQCM.js

import SemesterSelect, { validContentSemester } from '../components/SemesterSelect';
import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import {
  PlusCircle,
  FileSpreadsheet,
  Pencil,
  Trash2,
  XCircle,
  CheckCircle,
  HelpCircle,
  Search,
  Video,
  Clock,
  Target,
  RotateCcw,
  Save,
} from 'lucide-react';

const emptyQuestion = {
  question: { fr: '', ar: '' },
  options: [
    { fr: '', ar: '', isCorrect: false },
    { fr: '', ar: '', isCorrect: false },
    { fr: '', ar: '', isCorrect: false },
    { fr: '', ar: '', isCorrect: false },
  ],
  explanation: { fr: '', ar: '' },
  difficulty: 'medium',
};

const emptyQCM = {
  id: null,
  title: { fr: '', ar: '' },
  description: { fr: '', ar: '' },
  videoId: '',
  semester: '',
  questions: [],
  timeLimit: 30,
  passingScore: 60,
  attempts: 3,
  source: 'manual',
  status: 'active',
};

const AdminQCM = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [videos, setVideos] = useState([]);
  const [qcms, setQcms] = useState([]);

  const [newQCM, setNewQCM] = useState(emptyQCM);
  const [currentQuestion, setCurrentQuestion] = useState(emptyQuestion);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQCMId, setEditingQCMId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [videoFilter, setVideoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const t = {
    fr: {
      pageTitle: 'Gestion des QCM',
      subtitle: 'Créez, importez et gérez les QCM liés aux vidéos pédagogiques.',
      newQCM: 'Nouveau QCM',
      editQCM: 'Modifier le QCM',
      createQCM: 'Créer un nouveau QCM',
      existingQCM: 'QCM existants',
      noQCM: 'Aucun QCM créé.',
      loading: 'Chargement...',
      searchPlaceholder: 'Rechercher un QCM...',
      allVideos: 'Toutes les vidéos',
      allStatuses: 'Tous les statuts',
      active: 'Actif',
      inactive: 'Inactif',
      draft: 'Brouillon',
      titleFr: 'Titre en français',
      titleAr: 'Titre en arabe',
      descFr: 'Description en français',
      descAr: 'Description en arabe',
      associatedVideo: 'Vidéo associée',
      selectVideo: 'Sélectionner une vidéo',
      timeLimit: 'Temps limite',
      minutes: 'minutes',
      passingScore: 'Score de réussite',
      attempts: 'Nombre de tentatives',
      status: 'Statut',
      questions: 'Questions',
      importExcel: 'Importer depuis Excel',
      excelFormat:
        'Colonnes attendues : question_fr, question_ar, option1_fr, option1_ar, option2_fr, option2_ar, option3_fr, option3_ar, option4_fr, option4_ar, correct_answer, explanation_fr, explanation_ar, difficulty',
      addManualQuestion: 'Ajouter une question manuellement',
      questionFr: 'Question en français',
      questionAr: 'Question en arabe',
      optionFr: 'Option FR',
      optionAr: 'Option AR',
      correctAnswer: 'Bonne réponse',
      explanationFr: 'Explication en français',
      explanationAr: 'Explication en arabe',
      difficulty: 'Difficulté',
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile',
      addQuestion: 'Ajouter la question',
      addedQuestions: 'Questions ajoutées',
      remove: 'Supprimer',
      cancel: 'Annuler',
      create: 'Créer',
      update: 'Mettre à jour',
      saving: 'En cours...',
      edit: 'Modifier',
      delete: 'Supprimer',
      video: 'Vidéo',
      questionCount: 'Questions',
      score: 'Score',
      createdAt: 'Créé le',
      source: 'Source',
      manual: 'Manuel',
      excel: 'Excel',
      confirmDelete: 'Confirmer la suppression ?',
      errors: {
        loadQCM: 'Erreur lors du chargement des QCM.',
        loadVideos: 'Erreur lors du chargement des vidéos.',
        required:
          'Tous les champs obligatoires doivent être remplis et au moins une question doit être ajoutée.',
        questionRequired: 'La question est requise dans les deux langues.',
        correctRequired: 'Veuillez sélectionner la bonne réponse.',
        optionsRequired: 'Au moins 2 options complètes sont requises.',
        correctOptionEmpty:
          'La bonne réponse sélectionnée doit avoir un texte en français et en arabe.',
        excelRead:
          'Erreur lors de la lecture du fichier Excel. Vérifiez le format.',
        saveQCM: 'Erreur lors de la création ou mise à jour du QCM.',
        deleteQCM: 'Erreur lors de la suppression.',
      },
      success: {
        questionAdded: 'Question ajoutée.',
        excelImported: 'Questions importées depuis Excel.',
        created: 'QCM créé avec succès.',
        updated: 'QCM mis à jour avec succès.',
        deleted: 'QCM supprimé.',
      },
    },
    ar: {
      pageTitle: 'إدارة الاختبارات',
      subtitle: 'أنشئ واستورد وأدر الاختبارات المرتبطة بالفيديوهات التعليمية.',
      newQCM: 'اختبار جديد',
      editQCM: 'تعديل الاختبار',
      createQCM: 'إنشاء اختبار جديد',
      existingQCM: 'الاختبارات الموجودة',
      noQCM: 'لا توجد اختبارات.',
      loading: 'جاري التحميل...',
      searchPlaceholder: 'البحث عن اختبار...',
      allVideos: 'كل الفيديوهات',
      allStatuses: 'كل الحالات',
      active: 'نشط',
      inactive: 'غير نشط',
      draft: 'مسودة',
      titleFr: 'العنوان بالفرنسية',
      titleAr: 'العنوان بالعربية',
      descFr: 'الوصف بالفرنسية',
      descAr: 'الوصف بالعربية',
      associatedVideo: 'الفيديو المرتبط',
      selectVideo: 'اختر فيديو',
      timeLimit: 'الوقت المحدد',
      minutes: 'دقائق',
      passingScore: 'نقاط النجاح',
      attempts: 'عدد المحاولات',
      status: 'الحالة',
      questions: 'الأسئلة',
      importExcel: 'استيراد من Excel',
      excelFormat:
        'الأعمدة المطلوبة: question_fr, question_ar, option1_fr, option1_ar, option2_fr, option2_ar, option3_fr, option3_ar, option4_fr, option4_ar, correct_answer, explanation_fr, explanation_ar, difficulty',
      addManualQuestion: 'إضافة سؤال يدوياً',
      questionFr: 'السؤال بالفرنسية',
      questionAr: 'السؤال بالعربية',
      optionFr: 'الخيار بالفرنسية',
      optionAr: 'الخيار بالعربية',
      correctAnswer: 'الإجابة الصحيحة',
      explanationFr: 'التوضيح بالفرنسية',
      explanationAr: 'التوضيح بالعربية',
      difficulty: 'الصعوبة',
      easy: 'سهل',
      medium: 'متوسط',
      hard: 'صعب',
      addQuestion: 'إضافة السؤال',
      addedQuestions: 'الأسئلة المضافة',
      remove: 'حذف',
      cancel: 'إلغاء',
      create: 'إنشاء',
      update: 'تحديث',
      saving: 'جاري التنفيذ...',
      edit: 'تعديل',
      delete: 'حذف',
      video: 'الفيديو',
      questionCount: 'الأسئلة',
      score: 'النقاط',
      createdAt: 'تاريخ الإنشاء',
      source: 'المصدر',
      manual: 'يدوي',
      excel: 'Excel',
      confirmDelete: 'تأكيد الحذف؟',
      errors: {
        loadQCM: 'خطأ أثناء تحميل الاختبارات.',
        loadVideos: 'خطأ أثناء تحميل الفيديوهات.',
        required:
          'جميع الحقول المطلوبة يجب أن تكون مملوءة ويجب إضافة سؤال واحد على الأقل.',
        questionRequired: 'السؤال مطلوب باللغتين.',
        correctRequired: 'يرجى تحديد الإجابة الصحيحة.',
        optionsRequired: 'مطلوب على الأقل خياران مكتملان.',
        correctOptionEmpty:
          'الإجابة الصحيحة المحددة يجب أن تحتوي على نص بالفرنسية والعربية.',
        excelRead: 'خطأ في قراءة ملف Excel. تحقق من التنسيق.',
        saveQCM: 'خطأ أثناء إنشاء أو تحديث الاختبار.',
        deleteQCM: 'خطأ أثناء الحذف.',
      },
      success: {
        questionAdded: 'تمت إضافة السؤال.',
        excelImported: 'تم استيراد الأسئلة من Excel.',
        created: 'تم إنشاء الاختبار بنجاح.',
        updated: 'تم تحديث الاختبار بنجاح.',
        deleted: 'تم حذف الاختبار.',
      },
    },
  }[language];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVideos(), fetchQCMs()]);
      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const fetchVideos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'videos'));
      const videosList = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setVideos(videosList);
    } catch (err) {
      console.error(err);
      setError(t.errors.loadVideos);
    }
  };

  const fetchQCMs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'qcms'));
      const qcmsList = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setQcms(qcmsList);
    } catch (err) {
      console.error(err);
      setError(t.errors.loadQCM);
    }
  };

  const getLocalizedText = (textObj) => {
    if (!textObj) return '';
    if (typeof textObj === 'string') return textObj;
    return textObj?.[language] || textObj?.fr || textObj?.ar || '';
  };

  const showMessage = (type, message) => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }

    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 4500);
  };

  const resetForm = () => {
    setNewQCM(emptyQCM);
    setCurrentQuestion(emptyQuestion);
    setShowAddForm(false);
    setEditingQCMId(null);
    setError('');
    setSuccess('');
  };

  const startCreate = () => {
    setNewQCM(emptyQCM);
    setCurrentQuestion(emptyQuestion);
    setShowAddForm(true);
    setEditingQCMId(null);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];

          if (!sheetName) {
            throw new Error('No sheet found');
          }

          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          const questions = rows
            .map((row) => {
              const correctIndex = Number(row.correct_answer) - 1;

              const options = [1, 2, 3, 4].map((i) => ({
                fr: String(row[`option${i}_fr`] || '').trim(),
                ar: String(row[`option${i}_ar`] || '').trim(),
                isCorrect: i - 1 === correctIndex,
              }));

              return {
                question: {
                  fr: String(row.question_fr || '').trim(),
                  ar: String(row.question_ar || '').trim(),
                },
                options,
                explanation: {
                  fr: String(row.explanation_fr || '').trim(),
                  ar: String(row.explanation_ar || '').trim(),
                },
                difficulty: row.difficulty || 'medium',
              };
            })
            .filter((question) => {
              const hasQuestion =
                question.question.fr.trim() || question.question.ar.trim();
              const validOptions = question.options.filter(
                (option) => option.fr.trim() && option.ar.trim()
              );

              return hasQuestion && validOptions.length >= 2;
            });

          if (questions.length === 0) {
            throw new Error('No valid questions found');
          }

          resolve(questions);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setSaving(true);
      const questions = await parseExcelFile(file);

      setNewQCM((prev) => ({
        ...prev,
        questions,
        source: 'excel',
      }));

      showMessage('success', t.success.excelImported);
    } catch (err) {
      console.error(err);
      showMessage('error', t.errors.excelRead);
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  const validateCurrentQuestion = () => {
    const questionFr = currentQuestion.question.fr.trim();
    const questionAr = currentQuestion.question.ar.trim();

    if (!questionFr || !questionAr) {
      showMessage('error', t.errors.questionRequired);
      return false;
    }

    const filledOptions = currentQuestion.options.filter(
      (option) => option.fr.trim() && option.ar.trim()
    );

    if (filledOptions.length < 2) {
      showMessage('error', t.errors.optionsRequired);
      return false;
    }

    const correctOption = currentQuestion.options.find(
      (option) => option.isCorrect
    );

    if (!correctOption) {
      showMessage('error', t.errors.correctRequired);
      return false;
    }

    if (!correctOption.fr.trim() || !correctOption.ar.trim()) {
      showMessage('error', t.errors.correctOptionEmpty);
      return false;
    }

    return true;
  };

  const addQuestion = () => {
    if (!validateCurrentQuestion()) return;

    const cleanedQuestion = {
      ...currentQuestion,
      question: {
        fr: currentQuestion.question.fr.trim(),
        ar: currentQuestion.question.ar.trim(),
      },
      options: currentQuestion.options
        .filter((option) => option.fr.trim() && option.ar.trim())
        .map((option) => ({
          fr: option.fr.trim(),
          ar: option.ar.trim(),
          isCorrect: option.isCorrect,
        })),
      explanation: {
        fr: currentQuestion.explanation.fr.trim(),
        ar: currentQuestion.explanation.ar.trim(),
      },
    };

    setNewQCM((prev) => ({
      ...prev,
      questions: [...prev.questions, cleanedQuestion],
      source: prev.source || 'manual',
    }));

    setCurrentQuestion(emptyQuestion);
    showMessage('success', t.success.questionAdded);
  };

  const removeQuestion = (index) => {
    setNewQCM((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleCreateOrUpdateQCM = async (event) => {
    event.preventDefault();

    const titleFr = newQCM.title.fr.trim();
    const titleAr = newQCM.title.ar.trim();

    if (
      !titleFr ||
      !titleAr ||
      !newQCM.videoId ||
      !validContentSemester(newQCM.semester) ||
      newQCM.questions.length === 0
    ) {
      showMessage('error', t.errors.required);
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      const qcmData = {
        title: {
          fr: titleFr,
          ar: titleAr,
        },
        description: {
          fr: newQCM.description.fr.trim(),
          ar: newQCM.description.ar.trim(),
        },
        videoId: newQCM.videoId,
        visibility: 'shared',
        semester: newQCM.semester,
        questions: newQCM.questions,
        timeLimit: Number(newQCM.timeLimit) || 30,
        passingScore: Number(newQCM.passingScore) || 60,
        attempts: Number(newQCM.attempts) || 3,
        source: newQCM.source || 'manual',
        status: newQCM.status || 'active',
        updatedAt: now,
        createdAt: newQCM.createdAt || now,
      };

      if (newQCM.id) {
        await updateDoc(doc(db, 'qcms', newQCM.id), qcmData);

        setQcms((prev) =>
          prev.map((qcm) =>
            qcm.id === newQCM.id ? { ...qcm, ...qcmData } : qcm
          )
        );

        showMessage('success', t.success.updated);
      } else {
        const docRef = await addDoc(collection(db, 'qcms'), qcmData);

        setQcms((prev) => [...prev, { id: docRef.id, ...qcmData }]);
        showMessage('success', t.success.created);
      }

      setNewQCM(emptyQCM);
      setCurrentQuestion(emptyQuestion);
      setShowAddForm(false);
      setEditingQCMId(null);
    } catch (err) {
      console.error(err);
      showMessage('error', t.errors.saveQCM);
    } finally {
      setSaving(false);
    }
  };

  const handleEditQCM = (qcm) => {
    setNewQCM({
      id: qcm.id,
      title: qcm.title || { fr: '', ar: '' },
      description: qcm.description || { fr: '', ar: '' },
      videoId: qcm.videoId || '',
      semester: String(qcm.semester || ''),
      questions: qcm.questions || [],
      timeLimit: qcm.timeLimit || 30,
      passingScore: qcm.passingScore || 60,
      attempts: qcm.attempts || 3,
      source: qcm.source || 'manual',
      status: qcm.status || 'active',
      createdAt: qcm.createdAt,
    });

    setCurrentQuestion(emptyQuestion);
    setShowAddForm(true);
    setEditingQCMId(qcm.id);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteQCM = async (qcmId) => {
    if (!window.confirm(t.confirmDelete)) return;

    try {
      await deleteDoc(doc(db, 'qcms', qcmId));
      setQcms((prev) => prev.filter((qcm) => qcm.id !== qcmId));
      showMessage('success', t.success.deleted);
    } catch (err) {
      console.error(err);
      showMessage('error', t.errors.deleteQCM);
    }
  };

  const filteredQCMs = useMemo(() => {
    return qcms.filter((qcm) => {
      const title = getLocalizedText(qcm.title).toLowerCase();
      const description = getLocalizedText(qcm.description).toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        !search || title.includes(search) || description.includes(search);

      const matchesVideo =
        videoFilter === 'all' || qcm.videoId === videoFilter;

      const matchesStatus =
        statusFilter === 'all' || qcm.status === statusFilter;

      return matchesSearch && matchesVideo && matchesStatus;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qcms, searchTerm, videoFilter, statusFilter, language]);

  const getVideoTitle = (videoId) => {
    const video = videos.find((item) => item.id === videoId);
    return video ? getLocalizedText(video.title) : '-';
  };

  const getDifficultyLabel = (difficulty) => {
    const map = {
      easy: t.easy,
      medium: t.medium,
      hard: t.hard,
    };

    return map[difficulty] || t.medium;
  };

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                <HelpCircle className="h-4 w-4" />
                Admin QCM
              </div>

              <h1 className="text-3xl font-bold md:text-5xl">{t.pageTitle}</h1>
              <p className="mt-4 max-w-3xl text-blue-100">{t.subtitle}</p>
            </div>

            <button
              onClick={startCreate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
            >
              <PlusCircle className="h-5 w-5" />
              {t.newQCM}
            </button>
          </div>
        </header>

        {(error || success) && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {error ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{error || success}</span>
          </div>
        )}

        {showAddForm && (
          <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingQCMId ? t.editQCM : t.createQCM}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {language === 'fr'
                    ? 'Complétez les informations du QCM et ajoutez les questions.'
                    : 'أكمل معلومات الاختبار وأضف الأسئلة.'}
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                <XCircle className="h-4 w-4" />
                {t.cancel}
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateQCM} className="space-y-8">
              <SemesterSelect value={newQCM.semester} onChange={event => setNewQCM(previous => ({ ...previous, semester: event.target.value }))} language={language} allowAll disabled={saving} />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.titleFr} *
                  </label>
                  <input
                    type="text"
                    value={newQCM.title.fr}
                    onChange={(e) =>
                      setNewQCM({
                        ...newQCM,
                        title: { ...newQCM.title, fr: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.titleAr} *
                  </label>
                  <input
                    type="text"
                    value={newQCM.title.ar}
                    onChange={(e) =>
                      setNewQCM({
                        ...newQCM,
                        title: { ...newQCM.title, ar: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.descFr}
                  </label>
                  <textarea
                    value={newQCM.description.fr}
                    onChange={(e) =>
                      setNewQCM({
                        ...newQCM,
                        description: {
                          ...newQCM.description,
                          fr: e.target.value,
                        },
                      })
                    }
                    rows="3"
                    className="w-full rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.descAr}
                  </label>
                  <textarea
                    value={newQCM.description.ar}
                    onChange={(e) =>
                      setNewQCM({
                        ...newQCM,
                        description: {
                          ...newQCM.description,
                          ar: e.target.value,
                        },
                      })
                    }
                    rows="3"
                    className="w-full rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.associatedVideo} *
                  </label>
                  <select
                    value={newQCM.videoId}
                    onChange={(e) =>
                      setNewQCM({ ...newQCM, videoId: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">{t.selectVideo}</option>
                    {videos.map((video) => (
                      <option key={video.id} value={video.id}>
                        {getLocalizedText(video.title)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.timeLimit}
                  </label>
                  <input
                    type="number"
                    value={newQCM.timeLimit}
                    onChange={(e) =>
                      setNewQCM({
                        ...newQCM,
                        timeLimit: Number(e.target.value),
                      })
                    }
                    min="1"
                    className="w-full rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.passingScore}
                  </label>
                  <input
                    type="number"
                    value={newQCM.passingScore}
                    onChange={(e) =>
                      setNewQCM({
                        ...newQCM,
                        passingScore: Number(e.target.value),
                      })
                    }
                    min="1"
                    max="100"
                    className="w-full rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.attempts}
                  </label>
                  <input
                    type="number"
                    value={newQCM.attempts}
                    onChange={(e) =>
                      setNewQCM({
                        ...newQCM,
                        attempts: Number(e.target.value),
                      })
                    }
                    min="1"
                    className="w-full rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  {t.status}
                </label>
                <select
                  value={newQCM.status}
                  onChange={(e) =>
                    setNewQCM({ ...newQCM, status: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 md:w-64 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="active">{t.active}</option>
                  <option value="inactive">{t.inactive}</option>
                  <option value="draft">{t.draft}</option>
                </select>
              </div>

              <section className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                <div className="mb-5 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-700" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {t.questions}
                  </h3>
                </div>

                <div className="mb-6 rounded-2xl border border-dashed border-gray-300 bg-white p-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.importExcel}
                  </label>

                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-300 bg-white p-3"
                  />

                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {t.excelFormat}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h4 className="mb-4 font-bold text-gray-900">
                    {t.addManualQuestion}
                  </h4>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        {t.questionFr}
                      </label>
                      <textarea
                        value={currentQuestion.question.fr}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            question: {
                              ...currentQuestion.question,
                              fr: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-gray-300 p-3"
                        rows="2"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        {t.questionAr}
                      </label>
                      <textarea
                        value={currentQuestion.question.ar}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            question: {
                              ...currentQuestion.question,
                              ar: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-gray-300 p-3"
                        rows="2"
                      />
                    </div>
                  </div>

                  <div className="mb-4 space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 md:grid-cols-[auto_1fr_1fr]"
                      >
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={option.isCorrect}
                            onChange={() => {
                              const updatedOptions =
                                currentQuestion.options.map((opt, i) => ({
                                  ...opt,
                                  isCorrect: i === index,
                                }));

                              setCurrentQuestion({
                                ...currentQuestion,
                                options: updatedOptions,
                              });
                            }}
                          />
                          {String.fromCharCode(65 + index)}
                        </label>

                        <input
                          type="text"
                          placeholder={`${t.optionFr} ${index + 1}`}
                          value={option.fr}
                          onChange={(e) => {
                            const updatedOptions = [
                              ...currentQuestion.options,
                            ];
                            updatedOptions[index] = {
                              ...updatedOptions[index],
                              fr: e.target.value,
                            };

                            setCurrentQuestion({
                              ...currentQuestion,
                              options: updatedOptions,
                            });
                          }}
                          className="rounded-xl border border-gray-300 p-3"
                        />

                        <input
                          type="text"
                          placeholder={`${t.optionAr} ${index + 1}`}
                          value={option.ar}
                          onChange={(e) => {
                            const updatedOptions = [
                              ...currentQuestion.options,
                            ];
                            updatedOptions[index] = {
                              ...updatedOptions[index],
                              ar: e.target.value,
                            };

                            setCurrentQuestion({
                              ...currentQuestion,
                              options: updatedOptions,
                            });
                          }}
                          className="rounded-xl border border-gray-300 p-3"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        {t.explanationFr}
                      </label>
                      <textarea
                        value={currentQuestion.explanation.fr}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            explanation: {
                              ...currentQuestion.explanation,
                              fr: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-gray-300 p-3"
                        rows="2"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        {t.explanationAr}
                      </label>
                      <textarea
                        value={currentQuestion.explanation.ar}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            explanation: {
                              ...currentQuestion.explanation,
                              ar: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-gray-300 p-3"
                        rows="2"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        {t.difficulty}
                      </label>
                      <select
                        value={currentQuestion.difficulty}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            difficulty: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-300 p-3"
                      >
                        <option value="easy">{t.easy}</option>
                        <option value="medium">{t.medium}</option>
                        <option value="hard">{t.hard}</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addQuestion}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {t.addQuestion}
                  </button>
                </div>

                {newQCM.questions.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-bold text-gray-900">
                      {t.addedQuestions} ({newQCM.questions.length})
                    </h4>

                    {newQCM.questions.map((question, index) => (
                      <div
                        key={`${index}-${getLocalizedText(question.question)}`}
                        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                {index + 1}
                              </span>
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                {getDifficultyLabel(question.difficulty)}
                              </span>
                            </div>

                            <p className="font-semibold text-gray-900">
                              {getLocalizedText(question.question)}
                            </p>

                            <div className="mt-3 space-y-1 text-sm">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`rounded-xl px-3 py-2 ${
                                    option.isCorrect
                                      ? 'bg-green-50 font-semibold text-green-700'
                                      : 'bg-gray-50 text-gray-600'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIndex)}.{' '}
                                  {getLocalizedText(option)}
                                  {option.isCorrect && ' ✓'}
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t.remove}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex flex-col justify-end gap-3 md:flex-row">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                  <XCircle className="h-4 w-4" />
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  disabled={saving || newQCM.questions.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  <Save className="h-4 w-4" />
                  {saving
                    ? t.saving
                    : editingQCMId
                      ? t.update
                      : t.create}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t.existingQCM}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredQCMs.length} / {qcms.length}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={videoFilter}
                onChange={(e) => setVideoFilter(e.target.value)}
                className="rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">{t.allVideos}</option>
                {videos.map((video) => (
                  <option key={video.id} value={video.id}>
                    {getLocalizedText(video.title)}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">{t.allStatuses}</option>
                <option value="active">{t.active}</option>
                <option value="inactive">{t.inactive}</option>
                <option value="draft">{t.draft}</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl bg-gray-50 p-10 text-gray-500">
              <RotateCcw className="mr-2 h-5 w-5 animate-spin" />
              {t.loading}
            </div>
          ) : filteredQCMs.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-10 text-center text-gray-500">
              {t.noQCM}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredQCMs.map((qcm) => (
                <article
                  key={qcm.id}
                  className="rounded-3xl border border-gray-100 bg-gray-50 p-5 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            qcm.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : qcm.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {qcm.status === 'active'
                            ? t.active
                            : qcm.status === 'draft'
                              ? t.draft
                              : t.inactive}
                        </span>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {qcm.source === 'excel' ? t.excel : t.manual}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900">
                        {getLocalizedText(qcm.title)}
                      </h3>

                      {getLocalizedText(qcm.description) && (
                        <p className="mt-2 text-gray-600">
                          {getLocalizedText(qcm.description)}
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 md:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-blue-600" />
                          <span>
                            <strong>{t.video}:</strong> {getVideoTitle(qcm.videoId)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-purple-600" />
                          <span>
                            <strong>{t.questionCount}:</strong>{' '}
                            {qcm.questions?.length || 0}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span>
                            <strong>{t.timeLimit}:</strong> {qcm.timeLimit}{' '}
                            {t.minutes}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span>
                            <strong>{t.score}:</strong> {qcm.passingScore}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row gap-2 lg:flex-col">
                      <button
                        onClick={() => handleEditQCM(qcm)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 font-semibold text-white transition hover:bg-yellow-600"
                      >
                        <Pencil className="h-4 w-4" />
                        {t.edit}
                      </button>

                      <button
                        onClick={() => handleDeleteQCM(qcm.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t.delete}
                      </button>
                    </div>
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

export default AdminQCM;