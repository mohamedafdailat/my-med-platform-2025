import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import FlashcardGenerator from './FlashcardGenerator';
import QCMPlayer from './QCMPlayer.js';

const getLocalizedText = (textObj, language) => {
  if (typeof textObj === 'string') return textObj;
  if (Array.isArray(textObj)) return textObj;
  return textObj?.[language] || textObj?.fr || '';
};

const normalizeLocalizedArray = (value, language) => {
  const localizedValue = getLocalizedText(value, language);

  if (Array.isArray(localizedValue)) return localizedValue;

  if (typeof localizedValue === 'string' && localizedValue.trim()) {
    return localizedValue
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const VideoPlayer = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [qcms, setQcms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const [selectedQCM, setSelectedQCM] = useState(null);
  const [showQCMPlayer, setShowQCMPlayer] = useState(false);

  const translations = useMemo(
    () => ({
      loading: { fr: 'Chargement...', ar: 'جاري التحميل...' },
      videoNotFound: { fr: 'Vidéo introuvable', ar: 'فيديو غير موجود' },
      loadingError: {
        fr: 'Erreur lors du chargement de la vidéo',
        ar: 'خطأ أثناء تحميل الفيديو',
      },
      noVideoLink: {
        fr: 'Aucun lien vidéo disponible.',
        ar: 'لا يوجد رابط فيديو متاح.',
      },
      videoLoadError: {
        fr: 'Erreur lors du chargement de la vidéo',
        ar: 'خطأ في تحميل الفيديو',
      },
      backToLibrary: {
        fr: 'Retour à la bibliothèque',
        ar: 'العودة إلى المكتبة',
      },
      retry: { fr: 'Réessayer', ar: 'إعادة المحاولة' },
      overview: { fr: 'Aperçu', ar: 'نظرة عامة' },
      flashcards: { fr: 'Cartes Flash', ar: 'البطاقات التعليمية' },
      summary: { fr: 'Résumé', ar: 'الملخص' },
      qcm: { fr: 'QCM', ar: 'اختبار' },
      description: { fr: 'Description', ar: 'الوصف' },
      videoInfo: { fr: 'Informations vidéo', ar: 'معلومات الفيديو' },
      noDescription: {
        fr: 'Aucune description disponible',
        ar: 'لا يوجد وصف متاح',
      },
      noSummary: {
        fr: 'Aucun résumé disponible',
        ar: 'لا يوجد ملخص متاح',
      },
      noFlashcards: {
        fr: 'Aucune carte flash disponible pour cette vidéo',
        ar: 'لا توجد بطاقات تعليمية لهذا الفيديو',
      },
      noQCMs: {
        fr: 'Aucun QCM disponible pour cette vidéo',
        ar: 'لا يوجد اختبار لهذا الفيديو',
      },
      showAnswer: { fr: 'Voir la réponse', ar: 'إظهار الإجابة' },
      hideAnswer: { fr: 'Masquer la réponse', ar: 'إخفاء الإجابة' },
      nextCard: { fr: 'Suivant', ar: 'التالي' },
      prevCard: { fr: 'Précédent', ar: 'السابق' },
      cardOf: { fr: 'de', ar: 'من' },
      duration: { fr: 'Durée', ar: 'المدة' },
      category: { fr: 'Catégorie', ar: 'الفئة' },
      uploadedAt: { fr: 'Ajouté le', ar: 'تاريخ الإضافة' },
      watchOnYoutube: { fr: 'Voir sur YouTube', ar: 'مشاهدة على يوتيوب' },
      share: { fr: 'Partager', ar: 'مشاركة' },
      keyPoints: { fr: 'Points clés', ar: 'النقاط الرئيسية' },
      objectives: {
        fr: "Objectifs d'apprentissage",
        ar: 'أهداف التعلم',
      },
      startQCM: { fr: 'Commencer le QCM', ar: 'بدء الاختبار' },
      questionsCount: { fr: 'questions', ar: 'أسئلة' },
      timeLimit: { fr: 'Temps limite', ar: 'الوقت المحدد' },
      minutes: { fr: 'minutes', ar: 'دقائق' },
      passingScore: { fr: 'Score requis', ar: 'النقاط المطلوبة' },
      attempts: { fr: 'Tentatives', ar: 'المحاولات' },
      difficulty: { fr: 'Difficulté', ar: 'الصعوبة' },
      easy: { fr: 'Facile', ar: 'سهل' },
      medium: { fr: 'Moyen', ar: 'متوسط' },
      hard: { fr: 'Difficile', ar: 'صعب' },
      generateFlashcards: {
        fr: 'Générer des flashcards depuis un PDF',
        ar: 'إنشاء بطاقات تعليمية من PDF',
      },
      question: { fr: 'Question', ar: 'سؤال' },
      answer: { fr: 'Réponse', ar: 'إجابة' },
      back: { fr: 'Retour', ar: 'رجوع' },
      youtube: { fr: 'YouTube', ar: 'يوتيوب' },
      uploadedVideo: { fr: 'Vidéo téléchargée', ar: 'فيديو مرفوع' },
      qcmPreview: { fr: 'Aperçu des questions :', ar: 'لمحة عن الأسئلة:' },
      otherQuestions: { fr: 'autres questions', ar: 'أسئلة أخرى' },
      comingFlashcards: {
        fr: 'Les cartes flash seront bientôt disponibles pour cette vidéo.',
        ar: 'ستتوفر البطاقات التعليمية قريباً لهذا الفيديو.',
      },
      comingQCMs: {
        fr: 'Les QCM seront bientôt disponibles pour cette vidéo.',
        ar: 'ستتوفر الاختبارات قريباً لهذا الفيديو.',
      },
    }),
    []
  );

  const t = useCallback(
    (key) => getLocalizedText(translations[key], language) || key,
    [language, translations]
  );

  const isValidYouTubeId = useCallback(
    (youtubeId) => Boolean(youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(youtubeId)),
    []
  );

  const getYouTubeEmbedUrl = useCallback(
    (youtubeId) => {
      if (!isValidYouTubeId(youtubeId)) return null;
      return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`;
    },
    [isValidYouTubeId]
  );

  const extractYouTubeId = useCallback((url) => {
    if (!url || typeof url !== 'string') return null;

    const patterns = [
      /youtu\.be\/([^#&?]{11})/,
      /youtube\.com\/embed\/([^#&?]{11})/,
      /youtube\.com\/watch\?v=([^#&?]{11})/,
      /youtube\.com\/watch\?.*&v=([^#&?]{11})/,
      /youtube\.com\/shorts\/([^#&?]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) return match[1];
    }

    return null;
  }, []);

  const isYouTubeUrl = useCallback(
    (url) =>
      Boolean(
        url &&
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/.+/i.test(
            url
          )
      ),
    []
  );

  const formatDate = useCallback(
    (timestamp) => {
      if (!timestamp) return '';

      let date;

      if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (Number.isNaN(date.getTime())) return '';

      return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'ar-MA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
    [language]
  );

  const fetchVideoData = useCallback(async () => {
    if (!id) {
      setError(t('videoNotFound'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setVideoError(false);

    try {
      const videoDoc = doc(db, 'videos', id);
      const docSnap = await getDoc(videoDoc);

      if (!docSnap.exists()) {
        setError(t('videoNotFound'));
        return;
      }

      const data = docSnap.data();

      const rawVideoUrl = data.videoUrl || data.youtubeLink || data.url || '';

      if (!rawVideoUrl) {
        setError(t('noVideoLink'));
        return;
      }

      const detectedYoutubeId =
        data.youtubeId || extractYouTubeId(rawVideoUrl) || null;

      const videoData = {
        id: docSnap.id,
        title: data.title || { fr: 'Vidéo sans titre', ar: 'فيديو بدون عنوان' },
        description: data.description || { fr: '', ar: '' },
        summary: data.summary || { fr: '', ar: '' },
        keyPoints: data.keyPoints || { fr: [], ar: [] },
        objectives: data.objectives || { fr: [], ar: [] },
        videoUrl: rawVideoUrl,
        fileName: data.fileName || '',
        fileSize: data.fileSize || 0,
        fileType: data.fileType || '',
        uploadedAt: data.uploadedAt || data.createdAt || null,
        uploadedBy: data.uploadedBy || '',
        category: data.category || 'other',
        duration: data.duration || '',
        type:
          data.type ||
          (detectedYoutubeId || isYouTubeUrl(rawVideoUrl) ? 'youtube' : 'uploaded'),
        youtubeId: detectedYoutubeId,
      };

      if (videoData.youtubeId) {
        videoData.type = 'youtube';
      }

      setVideo(videoData);

      const flashcardsQuery = query(
        collection(db, 'flashcards'),
        where('videoId', '==', id)
      );
      const flashcardsSnapshot = await getDocs(flashcardsQuery);

      const flashcardsData = flashcardsSnapshot.docs
        .map((flashcardDoc) => {
          const flashcard = flashcardDoc.data();

          return {
            id: flashcardDoc.id,
            question:
              flashcard.question ||
              flashcard.front ||
              { fr: '', ar: '' },
            answer:
              flashcard.answer ||
              flashcard.back ||
              { fr: '', ar: '' },
            difficulty: flashcard.difficulty || 'medium',
            category: flashcard.category || videoData.category,
          };
        })
        .filter((card) => getLocalizedText(card.question, language));

      setFlashcards(flashcardsData);
      setCurrentFlashcard(0);
      setShowAnswer(false);

      const qcmsQuery = query(collection(db, 'qcms'), where('videoId', '==', id));
      const qcmsSnapshot = await getDocs(qcmsQuery);

      const qcmsData = qcmsSnapshot.docs.map((qcmDoc) => {
        const qcm = qcmDoc.data();

        return {
          id: qcmDoc.id,
          ...qcm,
          questions: Array.isArray(qcm.questions) ? qcm.questions : [],
          timeLimit: qcm.timeLimit || 10,
          passingScore: qcm.passingScore || 70,
          attempts: qcm.attempts || 0,
        };
      });

      setQcms(qcmsData);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError(`${t('loadingError')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id, t, isYouTubeUrl, extractYouTubeId, language]);

  useEffect(() => {
    fetchVideoData();
  }, [fetchVideoData]);

  const handleVideoError = useCallback(() => {
    setVideoError(true);
  }, []);

  const handleShare = useCallback(async () => {
    if (!video) return;

    try {
      const shareUrl =
        video.type === 'youtube' && video.youtubeId
          ? `https://www.youtube.com/watch?v=${video.youtubeId}`
          : video.videoUrl;

      const shareTitle = getLocalizedText(video.title, language);
      const shareDescription = getLocalizedText(video.description, language);

      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert(language === 'fr' ? 'Lien copié.' : 'تم نسخ الرابط.');
      }
    } catch (shareError) {
      console.error('Erreur lors du partage:', shareError);
    }
  }, [video, language]);

  const nextFlashcard = useCallback(() => {
    if (flashcards.length === 0) return;

    setCurrentFlashcard((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  }, [flashcards.length]);

  const prevFlashcard = useCallback(() => {
    if (flashcards.length === 0) return;

    setCurrentFlashcard(
      (prev) => (prev - 1 + flashcards.length) % flashcards.length
    );
    setShowAnswer(false);
  }, [flashcards.length]);

  const handleNewFlashcards = useCallback(
    async (newDeckOrCards) => {
      const sourceCards = Array.isArray(newDeckOrCards)
        ? newDeckOrCards
        : newDeckOrCards?.cards || newDeckOrCards?.flashcards || [];

      if (!Array.isArray(sourceCards) || sourceCards.length === 0) {
        setShowGenerator(false);
        return;
      }

      const flashcardsWithVideoId = sourceCards.map((card, index) => ({
        ...card,
        videoId: id,
        id: `${id}-flashcard-${Date.now()}-${index}`,
        question: card.question || card.front || { fr: '', ar: '' },
        answer: card.answer || card.back || { fr: '', ar: '' },
        difficulty: card.difficulty || 'medium',
        category: card.category || video?.category || 'other',
      }));

      try {
        await Promise.all(
          flashcardsWithVideoId.map((card) =>
            setDoc(doc(db, 'flashcards', card.id), {
              question: card.question,
              answer: card.answer,
              difficulty: card.difficulty,
              category: card.category,
              videoId: id,
              createdAt: new Date(),
            })
          )
        );

        setFlashcards((prev) => [...prev, ...flashcardsWithVideoId]);
        setShowGenerator(false);
      } catch (saveError) {
        console.error('Erreur sauvegarde flashcards vidéo:', saveError);
      }
    },
    [id, video]
  );

  const handleStartQCM = useCallback((qcm) => {
    setSelectedQCM(qcm);
    setShowQCMPlayer(true);
  }, []);

  const handleQCMComplete = useCallback((results) => {
    console.log('QCM terminé:', results);
  }, []);

  const handleCloseQCM = useCallback(() => {
    setSelectedQCM(null);
    setShowQCMPlayer(false);
  }, []);

  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const renderVideoPlayer = () => {
    if (!video) return null;

    if (video.type === 'youtube' && video.youtubeId) {
      const embedUrl = getYouTubeEmbedUrl(video.youtubeId);

      if (embedUrl && !videoError) {
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              title={getLocalizedText(video.title, language)}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={handleVideoError}
            />
          </div>
        );
      }
    }

    if (video.type === 'uploaded' && video.videoUrl) {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video
            className="w-full h-full"
            controls
            preload="metadata"
            onError={handleVideoError}
          >
            <source src={video.videoUrl} type={video.fileType || 'video/mp4'} />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>

          <p className="text-gray-500 text-lg">
            {videoError ? t('videoLoadError') : t('noVideoLink')}
          </p>
        </div>
      </div>
    );
  };

  const OverviewTab = () => {
    const objectives = normalizeLocalizedArray(video.objectives, language);
    const keyPoints = normalizeLocalizedArray(video.keyPoints, language);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {t('description')}
          </h3>

          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {getLocalizedText(video.description, language) || t('noDescription')}
          </p>
        </div>

        {objectives.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t('objectives')}
            </h3>

            <ul className="space-y-2">
              {objectives.map((objective, index) => (
                <li key={`${objective}-${index}`} className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span className="text-gray-700">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {keyPoints.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              {t('keyPoints')}
            </h3>

            <ul className="space-y-2">
              {keyPoints.map((point, index) => (
                <li key={`${point}-${index}`} className="flex items-start">
                  <span className="text-yellow-500 mr-2 mt-1">★</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t('videoInfo')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {video.category && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">
                  {t('category')}:
                </span>
                <span className="text-sm text-gray-800 bg-blue-100 px-2 py-1 rounded">
                  {video.category}
                </span>
              </div>
            )}

            {video.duration && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">
                  {t('duration')}:
                </span>
                <span className="text-sm text-gray-800">{video.duration}</span>
              </div>
            )}

            {video.uploadedAt && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">
                  {t('uploadedAt')}:
                </span>
                <span className="text-sm text-gray-800">
                  {formatDate(video.uploadedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const FlashcardsTab = () => {
    if (flashcards.length === 0 && !showGenerator) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {t('noFlashcards')}
          </h3>

          <p className="text-gray-600 mb-6">{t('comingFlashcards')}</p>

          <button
            type="button"
            onClick={() => setShowGenerator(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('generateFlashcards')}
          </button>
        </div>
      );
    }

    const currentCard = flashcards[currentFlashcard];

    return (
      <div className="space-y-6">
        {showGenerator && video && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <button
                type="button"
                onClick={() => setShowGenerator(false)}
                className="mr-4 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ←
              </button>

              <h2 className="text-2xl font-bold text-gray-800">
                {t('generateFlashcards')}
              </h2>
            </div>

            <FlashcardGenerator
              onClose={() => setShowGenerator(false)}
              onDeckSaved={handleNewFlashcards}
              initialCategory={video.category}
            />
          </div>
        )}

        {!showGenerator && currentCard && (
          <>
            <div className="text-center">
              <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                {currentFlashcard + 1} {t('cardOf')} {flashcards.length}
              </span>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <h3 className="text-xl font-semibold mb-2">{t('question')}</h3>
                <p className="text-lg leading-relaxed">
                  {getLocalizedText(currentCard.question, language)}
                </p>
              </div>

              <div className="p-6">
                {showAnswer ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-green-800 mb-2">
                        {t('answer')}
                      </h4>

                      <p className="text-green-700 leading-relaxed">
                        {getLocalizedText(currentCard.answer, language)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAnswer(false)}
                      className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      {t('hideAnswer')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('showAnswer')}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={prevFlashcard}
                disabled={flashcards.length <= 1}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← {t('prevCard')}
              </button>

              <button
                type="button"
                onClick={nextFlashcard}
                disabled={flashcards.length <= 1}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('nextCard')} →
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const QCMTab = () => {
    if (qcms.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {t('noQCMs')}
          </h3>

          <p className="text-gray-600">{t('comingQCMs')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {qcms.map((qcmItem) => {
          const questions = Array.isArray(qcmItem.questions)
            ? qcmItem.questions
            : [];

          return (
            <div key={qcmItem.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {getLocalizedText(qcmItem.title, language) ||
                      `QCM ${qcmItem.id}`}
                  </h3>

                  {qcmItem.description && (
                    <p className="text-gray-600 mb-3">
                      {getLocalizedText(qcmItem.description, language)}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-gray-600">
                      {questions.length} {t('questionsCount')}
                    </div>

                    <div className="text-gray-600">
                      {qcmItem.timeLimit || 10} {t('minutes')}
                    </div>

                    <div className="text-gray-600">
                      {qcmItem.passingScore || 70}% {t('passingScore')}
                    </div>

                    <div className="text-gray-600">
                      {qcmItem.attempts || 0} {t('attempts')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartQCM(qcmItem)}
                  disabled={questions.length === 0}
                  className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('startQCM')}
                </button>
              </div>

              {questions.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {t('qcmPreview')}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {questions.slice(0, 6).map((question, qIndex) => (
                      <div key={`${qcmItem.id}-${qIndex}`} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500">
                            Q{qIndex + 1}
                          </span>

                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(
                              question.difficulty
                            )}`}
                          >
                            {t(question.difficulty || 'medium')}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 line-clamp-2">
                          {getLocalizedText(question.question, language)}
                        </p>
                      </div>
                    ))}

                    {questions.length > 6 && (
                      <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
                        <span className="text-sm text-gray-500">
                          +{questions.length - 6} {t('otherQuestions')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const SummaryTab = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {t('summary')}
      </h3>

      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {getLocalizedText(video.summary, language) || t('noSummary')}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-xl text-gray-700 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            ⚠️
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h2>

          <p className="text-gray-600 mb-6">{error || t('videoNotFound')}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={fetchVideoData}
              className="btn-primary flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('retry')}
            </button>

            <NavLink
              to="/videos"
              className="btn-secondary px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t('backToLibrary')}
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      name: t('overview'),
      count: null,
    },
    {
      id: 'flashcards',
      name: `${t('flashcards')} (${flashcards.length})`,
      count: flashcards.length,
    },
    {
      id: 'qcm',
      name: `${t('qcm')} (${qcms.length})`,
      count: qcms.length,
    },
    {
      id: 'summary',
      name: t('summary'),
      count: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div
            className={`bg-gradient-to-r ${
              video.type === 'youtube'
                ? 'from-red-600 to-red-700'
                : 'from-blue-600 to-indigo-700'
            } px-6 py-8`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {getLocalizedText(video.title, language)}
                </h1>

                <div className="flex items-center text-blue-100">
                  <span>{video.type === 'youtube' ? t('youtube') : t('uploadedVideo')}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                {video.type === 'youtube' && video.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                    title={t('watchOnYoutube')}
                  >
                    ▶
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                  title={t('share')}
                >
                  ↗
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {renderVideoPlayer()}
        </div>

        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-8 px-6 min-w-max" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'flashcards' && <FlashcardsTab />}
            {activeTab === 'qcm' && <QCMTab />}
            {activeTab === 'summary' && <SummaryTab />}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <NavLink
            to="/videos"
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('backToLibrary')}
          </NavLink>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t('back')}
          </button>
        </div>
      </div>

      {showQCMPlayer && selectedQCM && (
        <QCMPlayer
          qcm={selectedQCM}
          onClose={handleCloseQCM}
          onComplete={handleQCMComplete}
        />
      )}
    </div>
  );
};

export default VideoPlayer;