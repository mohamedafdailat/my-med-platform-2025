import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import FlashcardGenerator from './FlashcardGenerator';
import QCMPlayer from './QCMPlayer'; // Import du composant QCM

// Move getLocalizedText outside as a regular function
const getLocalizedText = (textObj, language) => {
  if (typeof textObj === 'string') return textObj;
  return textObj?.[language] || textObj?.fr || '';
};

const VideoPlayer = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [video, setVideo] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [qcms, setQcms] = useState([]); // Nouveau state pour les QCMs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedQCM, setSelectedQCM] = useState(null); // QCM sélectionné pour jouer
  const [showQCMPlayer, setShowQCMPlayer] = useState(false); // Afficher le lecteur QCM

  const translations = useMemo(() => ({
    loading: { fr: 'Chargement...', ar: 'جاري التحميل...' },
    videoNotFound: { fr: 'Vidéo introuvable', ar: 'فيديو غير موجود' },
    loadingError: { fr: 'Erreur lors du chargement de la vidéo', ar: 'خطأ أثناء تحميل الفيديو' },
    noVideoLink: { fr: 'Aucun lien vidéo disponible.', ar: 'لا يوجد رابط فيديو متاح.' },
    videoLoadError: { fr: 'Erreur lors du chargement de la vidéo', ar: 'خطأ في تحميل الفيديو' },
    backToLibrary: { fr: 'Retour à la bibliothèque', ar: 'العودة إلى المكتبة' },
    retry: { fr: 'Réessayer', ar: 'إعادة المحاولة' },
    overview: { fr: 'Aperçu', ar: 'نظرة عامة' },
    flashcards: { fr: 'Cartes Flash', ar: 'البطاقات التعليمية' },
    summary: { fr: 'Résumé', ar: 'الملخص' },
    qcm: { fr: 'QCM', ar: 'اختبار' },
    description: { fr: 'Description', ar: 'الوصف' },
    videoInfo: { fr: 'Informations vidéo', ar: 'معلومات الفيديو' },
    noDescription: { fr: 'Aucune description disponible', ar: 'لا يوجد وصف متاح' },
    noSummary: { fr: 'Aucun résumé disponible', ar: 'لا يوجد ملخص متاح' },
    noFlashcards: { fr: 'Aucune carte flash disponible pour cette vidéo', ar: 'لا توجد بطاقات تعليمية لهذا الفيديو' },
    noQCMs: { fr: 'Aucun QCM disponible pour cette vidéo', ar: 'لا يوجد اختبار لهذا الفيديو' },
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
    keyPoints: { fr: 'Points Clés', ar: 'النقاط الرئيسية' },
    objectives: { fr: 'Objectifs d\'apprentissage', ar: 'أهداف التعلم' },
    quiz: { fr: 'Quiz', ar: 'اختبار' },
    takeQuiz: { fr: 'Passer le quiz', ar: 'أجري الاختبار' },
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
    relatedVideos: { fr: 'Vidéos liées', ar: 'فيديوهات ذات صلة' },
    generateFlashcards: { fr: 'Générer des flashcards depuis un PDF', ar: 'إنشاء بطاقات تعليمية من PDF' },
  }), []);

  const t = useCallback((key) => getLocalizedText(translations[key], language), [language, translations]);

  const isValidYouTubeId = useCallback((id) => id && /^[a-zA-Z0-9_-]{11}$/.test(id), []);
  const getYouTubeEmbedUrl = useCallback((youtubeId) => {
    if (!isValidYouTubeId(youtubeId)) return null;
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&showinfo=0`;
  }, [isValidYouTubeId]);
  const extractYouTubeId = useCallback((url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }, []);
  const isYouTubeUrl = useCallback((url) => url && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url), []);
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return '';
    let date;
    if (timestamp?.toDate) date = timestamp.toDate();
    else if (timestamp?.seconds) date = new Date(timestamp.seconds * 1000);
    else date = new Date(timestamp);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'ar-MA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [language]);

  const fetchVideoData = useCallback(async () => {
    if (!id) {
      setError(t('videoNotFound'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const videoDoc = doc(db, 'videos', id);
      const docSnap = await getDoc(videoDoc);
      if (!docSnap.exists()) {
        setError(t('videoNotFound'));
        return;
      }
      const data = docSnap.data();
      if (!data.videoUrl) {
        setError(t('noVideoLink'));
        return;
      }
      const videoData = {
        id: docSnap.id,
        title: data.title || { fr: 'Vidéo sans titre', ar: 'فيديو بدون عنوان' },
        description: data.description || { fr: '', ar: '' },
        summary: data.summary || { fr: '', ar: '' },
        keyPoints: data.keyPoints || { fr: [], ar: [] },
        objectives: data.objectives || { fr: [], ar: [] },
        videoUrl: data.videoUrl,
        fileName: data.fileName || '',
        fileSize: data.fileSize || 0,
        fileType: data.fileType || '',
        uploadedAt: data.uploadedAt,
        uploadedBy: data.uploadedBy,
        category: data.category || 'other',
        duration: data.duration || '',
        type: data.type || (isYouTubeUrl(data.videoUrl) ? 'youtube' : 'uploaded')
      };
      if (videoData.type === 'youtube' || isYouTubeUrl(data.videoUrl)) {
        videoData.youtubeId = data.youtubeId || extractYouTubeId(data.videoUrl);
        videoData.type = 'youtube';
      }
      setVideo(videoData);

      // Récupération des flashcards
      const flashcardsQuery = query(collection(db, 'flashcards'), where('videoId', '==', id));
      const flashcardsSnapshot = await getDocs(flashcardsQuery);
      const flashcardsData = flashcardsSnapshot.docs.map(doc => ({
        id: doc.id,
        question: doc.data().question || { fr: '', ar: '' },
        answer: doc.data().answer || { fr: '', ar: '' },
        difficulty: doc.data().difficulty || 'medium',
        category: doc.data().category || videoData.category
      }));
      setFlashcards(flashcardsData);

      // Récupération des QCMs
      const qcmsQuery = query(collection(db, 'qcms'), where('videoId', '==', id));
      const qcmsSnapshot = await getDocs(qcmsQuery);
      const qcmsData = qcmsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQcms(qcmsData);

    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError(t('loadingError') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, t, isYouTubeUrl, extractYouTubeId]);

  useEffect(() => {
    fetchVideoData();
  }, [fetchVideoData]);

  const handleVideoError = useCallback(() => setVideoError(true), []);
  const handleShare = useCallback(async () => {
    if (!video) return;
    try {
      const shareUrl = video.type === 'youtube' ? `https://www.youtube.com/watch?v=${video.youtubeId}` : video.videoUrl;
      const shareTitle = getLocalizedText(video.title, language);
      if (navigator.share && navigator.canShare) {
        await navigator.share({ title: shareTitle, text: getLocalizedText(video.description, language), url: shareUrl });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  }, [video, language]);

  const nextFlashcard = () => {
    setCurrentFlashcard((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  };

  const prevFlashcard = () => {
    setCurrentFlashcard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setShowAnswer(false);
  };

  const handleNewFlashcards = (newFlashcards) => {
    const flashcardsWithVideoId = newFlashcards.map((card, index) => ({
      ...card,
      videoId: id,
      id: `${id}-flashcard-${Date.now()}-${index}`
    }));
    flashcardsWithVideoId.forEach(async (card) => {
      await setDoc(doc(db, 'flashcards', card.id), {
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty || 'medium',
        category: card.category || video.category || 'other',
        videoId: id,
        createdAt: new Date()
      });
    });
    setFlashcards((prev) => [...prev, ...flashcardsWithVideoId]);
    setShowGenerator(false);
  };

  const handleStartQCM = (qcm) => {
    setSelectedQCM(qcm);
    setShowQCMPlayer(true);
  };

  const handleQCMComplete = (results) => {
    console.log('QCM terminé:', results);
    // Vous pouvez ajouter ici la logique pour traiter les résultats
    // Par exemple, les sauvegarder ou les afficher
  };

  const handleCloseQCM = () => {
    setSelectedQCM(null);
    setShowQCMPlayer(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
    } else if (video.type === 'uploaded' && video.videoUrl) {
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
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">
            {videoError ? t('videoLoadError') : t('noVideoLink')}
          </p>
        </div>
      </div>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('description')}
        </h3>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {getLocalizedText(video.description, language) || t('noDescription')}
          </p>
        </div>
      </div>
      {video.objectives && getLocalizedText(video.objectives, language).length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('objectives')}
          </h3>
          <ul className="space-y-2">
            {getLocalizedText(video.objectives, language).map((objective, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {video.keyPoints && getLocalizedText(video.keyPoints, language).length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {t('keyPoints')}
          </h3>
          <ul className="space-y-2">
            {getLocalizedText(video.keyPoints, language).map((point, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-4 h-4 text-yellow-500 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('videoInfo')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {video.category && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">{t('category')}:</span>
              <span className="text-sm text-gray-800 bg-blue-100 px-2 py-1 rounded">{video.category}</span>
            </div>
          )}
          {video.duration && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">{t('duration')}:</span>
              <span className="text-sm text-gray-800">{video.duration}</span>
            </div>
          )}
          {video.uploadedAt && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">{t('uploadedAt')}:</span>
              <span className="text-sm text-gray-800">{formatDate(video.uploadedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const FlashcardsTab = () => {
    if (flashcards.length === 0 && !showGenerator) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('noFlashcards')}</h3>
          <p className="text-gray-600 mb-6">Les cartes flash seront bientôt disponibles pour cette vidéo.</p>
          <button
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
                onClick={() => setShowGenerator(false)}
                className="mr-4 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-800">{t('generateFlashcards')}</h2>
            </div>
            <FlashcardGenerator
              onClose={() => setShowGenerator(false)}
              onDeckSaved={handleNewFlashcards}
              initialCategory={video.category}
            />
          </div>
        )}
        {!showGenerator && (
          <>
            <div className="text-center">
              <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                {currentFlashcard + 1} {t('cardOf')} {flashcards.length}
              </span>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <h3 className="text-xl font-semibold mb-2">Question</h3>
                <p className="text-lg leading-relaxed">
                  {getLocalizedText(currentCard.question, language)}
                </p>
              </div>
              <div className="p-6">
                {showAnswer ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-green-800 mb-2">Réponse</h4>
                      <p className="text-green-700 leading-relaxed">
                        {getLocalizedText(currentCard.answer, language)}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAnswer(false)}
                      className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      {t('hideAnswer')}
                    </button>
                  </div>
                ) : (
                  <button
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
                onClick={prevFlashcard}
                disabled={flashcards.length <= 1}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                {t('prevCard')}
              </button>
              <button
                onClick={nextFlashcard}
                disabled={flashcards.length <= 1}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('nextCard')}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
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
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('noQCMs')}</h3>
          <p className="text-gray-600">Les QCM seront bientôt disponibles pour cette vidéo.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {qcms.map((qcm, index) => (
          <div key={qcm.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {getLocalizedText(qcm.title, language)}
                </h3>
                {qcm.description && (
                  <p className="text-gray-600 mb-3">
                    {getLocalizedText(qcm.description, language)}
                  </p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {qcm.questions.length} {t('questionsCount')}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {qcm.timeLimit} {t('minutes')}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {qcm.passingScore}% {t('passingScore')}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {qcm.attempts} {t('attempts')}
                  </div>
                </div>
              </div>
              
              <div className="ml-6">
                <button
                  onClick={() => handleStartQCM(qcm)}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('startQCM')}
                </button>
              </div>
            </div>
            
            {/* Aperçu des questions */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {language === 'fr' ? 'Aperçu des questions:' : 'لمحة عن الأسئلة:'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {qcm.questions.slice(0, 6).map((question, qIndex) => (
                  <div key={qIndex} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500">Q{qIndex + 1}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                        {t(question.difficulty)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {getLocalizedText(question.question, language)}
                    </p>
                  </div>
                ))}
                {qcm.questions.length > 6 && (
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
                    <span className="text-sm text-gray-500">
                      +{qcm.questions.length - 6} {language === 'fr' ? 'autres questions' : 'أسئلة أخرى'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const SummaryTab = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {t('summary')}
      </h3>
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {getLocalizedText(video.summary, language) || t('noSummary')}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
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
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || t('videoNotFound')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchVideoData}
              className="btn-primary flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className={`bg-gradient-to-r ${video.type === 'youtube' ? 'from-red-600 to-red-700' : 'from-blue-600 to-indigo-700'} px-6 py-8`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {getLocalizedText(video.title, language)}
                </h1>
                <div className="flex items-center text-blue-100">
                  {video.type === 'youtube' ? (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span>YouTube</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <span>Vidéo téléchargée</span>
                    </>
                  )}
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
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
                <button
                  onClick={handleShare}
                  className="flex items-center px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                  title={t('share')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {renderVideoPlayer()}
        </div>

        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', name: t('overview'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'flashcards', name: `${t('flashcards')} (${flashcards.length})`, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                { id: 'qcm', name: `${t('qcm')} (${qcms.length})`, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'summary', name: t('summary'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                  </svg>
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
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z" />
            </svg>
            {t('backToLibrary')}
          </NavLink>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>
        </div>
      </div>

      {/* Modal QCM Player */}
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