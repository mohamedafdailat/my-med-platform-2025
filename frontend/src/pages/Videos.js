import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import debounce from 'lodash/debounce';

const Videos = () => {
  const { language } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const texts = useMemo(() => ({
    fr: {
      title: 'Bibliothèque Vidéo',
      loading: 'Chargement des vidéos...',
      error: 'Erreur lors du chargement des vidéos',
      noVideos: 'Aucune vidéo disponible',
      noResults: 'Aucun résultat trouvé pour votre recherche',
      searchPlaceholder: 'Rechercher des vidéos...',
      categories: {
        all: 'Toutes les catégories',
        cardiology: 'Cardiologie',
        other: 'Autres',
        dentaire: 'Santé dentaire',
        'general-medicine': 'Médecine générale',
        pharmacy: 'Pharmacie',
        technology: 'Technologie médicale',
      },
      retry: 'Réessayer',
      retrying: 'Tentative de reconnexion...',
      noDescription: 'Aucune description disponible',
      watchVideo: 'Regarder la vidéo',
      shareVideo: 'Partager',
      uploadedVideo: 'Vidéo téléchargée',
      youtubeVideo: 'Vidéo YouTube',
      watchOnYoutube: 'Voir sur YouTube',
      clearSearch: 'Effacer la recherche',
      refresh: 'Actualiser',
      backToTop: 'Retour en haut',
      categoryLabel: 'Filtrer par catégorie',
      suggestionsLabel: 'Suggestions de recherche',
    },
    ar: {
      title: 'مكتبة الفيديو',
      loading: 'جاري تحميل الفيديوهات...',
      error: 'خطأ في تحميل الفيديوهات',
      noVideos: 'لا توجد فيديوهات متاحة',
      noResults: 'لا توجد نتائج لبحثك',
      searchPlaceholder: 'البحث عن الفيديوهات...',
      categories: {
        all: 'جميع الفئات',
        'general-medicine': 'الطب العام',
        cardiology: 'أمراض القلب',
        pharmacy: 'الصيدلة',
        technology: 'التكنولوجيا الطبية',
        other: 'أخرى',
        dentaire: 'الصحة الفموية',
      },
      retry: 'إعادة المحاولة',
      retrying: 'جاري إعادة المحاولة...',
      noDescription: 'لا يوجد وصف متاح',
      watchVideo: 'مشاهدة الفيديو',
      shareVideo: 'مشاركة',
      uploadedVideo: 'فيديو مرفوع',
      youtubeVideo: 'فيديو يوتيوب',
      watchOnYoutube: 'مشاهدة على يوتيوب',
      clearSearch: 'مسح البحث',
      refresh: 'تحديث',
      backToTop: 'العودة إلى الأعلى',
      categoryLabel: 'تصفية حسب الفئة',
      suggestionsLabel: 'اقتراحات البحث',
    },
  }), [language]);

  const t = texts[language] || texts.fr;
  const isRTL = language === 'ar';

  const extractYouTubeId = useCallback((url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url;
  }, []);

  const isYouTubeUrl = useCallback((url) => {
    if (!url) return false;
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);
  }, []);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const videosQuery = query(collection(db, 'videos'), orderBy('uploadedAt', 'desc'), limit(50));
      const querySnapshot = await getDocs(videosQuery);
      const processedVideos = querySnapshot.docs
        .filter((doc) => doc.data().status === 'active')
        .map((doc) => {
          const data = doc.data();
          const category = data.category === 'médecine_générale' || data.category === 'pharmacie' ? 'other' : data.category || 'other';
          const videoData = {
            id: doc.id,
            title: data.title || { fr: 'Titre non disponible', ar: 'عنوان غير متاح' },
            description: data.description || { fr: '', ar: '' },
            uploadedAt: data.uploadedAt,
            uploadedBy: data.uploadedBy,
            fileName: data.fileName || '',
            fileSize: data.fileSize || 0,
            fileType: data.fileType || '',
            category,
          };
          if (data.videoUrl && isYouTubeUrl(data.videoUrl)) {
            const youtubeId = extractYouTubeId(data.videoUrl);
            if (youtubeId) {
              return {
                ...videoData,
                youtubeId,
                videoUrl: data.videoUrl,
                thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
                type: 'youtube',
              };
            }
          } else if (data.videoUrl) {
            return {
              ...videoData,
              videoUrl: data.videoUrl,
              thumbnail: null,
              type: 'uploaded',
            };
          }
          return null;
        })
        .filter((video) => video !== null);
      setVideos(processedVideos);
      setRetryCount(0);
    } catch (err) {
      let errorMessage = t.error;
      if (err.code === 'permission-denied') {
        errorMessage += ' (Accès refusé)';
      } else if (err.code === 'unavailable') {
        errorMessage += ' (Service indisponible)';
      } else {
        errorMessage += `: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [t.error, extractYouTubeId, isYouTubeUrl]);

  const fetchSuggestions = useCallback(
    debounce(async (term) => {
      if (!term) {
        setSuggestions([]);
        return;
      }
      try {
        const videosQuery = query(collection(db, 'videos'), orderBy('title.fr'), limit(5));
        const querySnapshot = await getDocs(videosQuery);
        const matchingTitles = querySnapshot.docs
          .filter((doc) => {
            const title = doc.data().title?.[language] || doc.data().title?.fr || '';
            return title.toLowerCase().includes(term.toLowerCase());
          })
          .map((doc) => doc.data().title?.[language] || doc.data().title?.fr)
          .slice(0, 5);
        setSuggestions(matchingTitles);
      } catch (err) {
        console.error('Erreur lors de la récupération des suggestions:', err);
      }
    }, 300),
    [language]
  );

  const handleRetry = useCallback(async () => {
    if (retryCount >= 3) {
      setError(t.error + ' (Nombre maximum de tentatives atteint)');
      return;
    }
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    const delay = Math.pow(2, retryCount) * 1000;
    setTimeout(() => {
      fetchVideos();
    }, delay);
  }, [retryCount, fetchVideos, t.error]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSuggestions([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const title = video.title[language] || video.title.fr || '';
      const description = video.description[language] || video.description.fr || '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [videos, searchTerm, selectedCategory, language]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(videos.map((video) => video.category));
    return ['all', ...categories].map((cat) => ({
      key: cat,
      label: t.categories[cat] || cat,
    }));
  }, [videos, t.categories]);

  const formatFileSize = useCallback((bytes) => {
    if (!bytes || bytes === 0) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }, []);

  const shareVideo = useCallback(async (video) => {
    try {
      const shareUrl = video.type === 'youtube' && video.youtubeId
        ? `https://www.youtube.com/watch?v=${video.youtubeId}`
        : video.videoUrl;
      if (navigator.share && navigator.canShare({ url: shareUrl })) {
        await navigator.share({
          title: video.title[language] || video.title.fr,
          text: video.description[language] || video.description.fr,
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert(language === 'fr' ? 'Lien copié dans le presse-papiers' : 'تم نسخ الرابط إلى الحافظة');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(language === 'fr' ? 'Lien copié dans le presse-papiers' : 'تم نسخ الرابط إلى الحافظة');
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      alert(language === 'fr' ? 'Erreur lors du partage' : 'خطأ أثناء المشاركة');
    }
  }, [language]);

  const LoadingComponent = () => (
    <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="auth-container">
        <div className="loading-spinner mb-4" aria-label={isRetrying ? t.retrying : t.loading}></div>
        <p className="text-gray-600 text-lg font-medium">{isRetrying ? t.retrying : t.loading}</p>
        {isRetrying && <p className="text-gray-500 text-sm mt-2">Tentative {retryCount}/3</p>}
      </div>
    </main>
  );

  const ErrorComponent = () => (
    <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="auth-container">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-500">Erreur de chargement</h3>
        </div>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          disabled={isRetrying || retryCount >= 3}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          aria-disabled={isRetrying || retryCount >= 3}
        >
          {isRetrying ? t.retrying : t.retry}
        </button>
      </div>
    </main>
  );

  const VideoCard = ({ video }) => (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200">
      <div className="relative">
        {video.type === 'youtube' ? (
          <>
            <iframe
              width="100%"
              height="240"
              src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0`}
              title={video.title[language] || video.title.fr}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="rounded-t-xl"
            />
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center backdrop-blur-sm">
              <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube
            </div>
          </>
        ) : (
          <>
            <video
              width="100%"
              height="240"
              controls
              preload="metadata"
              className="rounded-t-xl bg-black"
              poster={video.thumbnail}
            >
              <source src={video.videoUrl} type={video.fileType || 'video/mp4'} />
              {language === 'fr' ? 'Votre navigateur ne supporte pas la lecture vidéo.' : 'متصفحك لا يدعم تشغيل الفيديو.'}
            </video>
            <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center backdrop-blur-sm">
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              {language === 'fr' ? 'Local' : 'محلي'}
            </div>
          </>
        )}
      </div>
      
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
            {video.title[language] || video.title.fr}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {video.description[language] || video.description.fr || t.noDescription}
          </p>
        </div>

        {/* Info section avec design amélioré */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {t.categories[video.category] || video.category}
            </span>
          </div>
          {video.fileSize > 0 && (
            <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md">
              {formatFileSize(video.fileSize)}
            </span>
          )}
        </div>

        {video.fileName && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-600 flex items-center" title={video.fileName}>
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate font-medium">{video.fileName}</span>
            </p>
          </div>
        )}

        {/* Boutons redessinés */}
        <div className="flex flex-col space-y-3">
          {/* Bouton principal */}
          <NavLink
            to={`/videos/${video.id}`}
            className="group/btn flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
            aria-label={t.watchVideo}
          >
            <svg className="w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.watchVideo}
          </NavLink>

          {/* Boutons secondaires */}
          <div className="flex space-x-2">
            {video.type === 'youtube' && (
              <a
                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group/youtube flex-1 flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 font-medium rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300"
                aria-label={t.watchOnYoutube}
              >
                <svg className="w-4 h-4 mr-2 group-hover/youtube:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="hidden sm:inline">YouTube</span>
              </a>
            )}
            
            <button
              onClick={() => shareVideo(video)}
              className="group/share flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-600 font-medium rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 min-w-[44px]"
              aria-label={t.shareVideo}
            >
              <svg className="w-4 h-4 group-hover/share:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="hidden sm:inline sm:ml-2">{t.shareVideo}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingComponent />;
  if (error) return <ErrorComponent />;

  return (
    <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`} aria-labelledby="videos-title">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h1 id="videos-title" className="text-4xl font-bold text-gray-900 mb-4 md:mb-0">{t.title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-lg text-gray-700 font-medium">
              {filteredVideos.length} {language === 'fr' ? 'vidéo' : 'فيديو'}{filteredVideos.length !== 1 ? language === 'fr' ? 's' : '' : ''}
            </span>
            <button
              onClick={fetchVideos}
              disabled={loading}
              className="btn-secondary p-3"
              title={t.refresh}
              aria-label={t.refresh}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <section className="video-controls mb-6" role="search" aria-label={t.searchPlaceholder}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="search"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchInputRef.current?.focus();
                } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
                  suggestionsRef.current?.children[0]?.focus();
                }
              }}
              ref={searchInputRef}
              className="form-input w-full pl-10 pr-10"
              aria-label={t.searchPlaceholder}
              aria-controls="videos-grid"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="btn-secondary absolute right-3 top-1/2 transform -translate-y-1/2 p-2"
                aria-label={t.clearSearch}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {suggestions.length > 0 && (
              <ul
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-2 max-h-60 overflow-y-auto"
                role="listbox"
                aria-label={t.suggestionsLabel}
              >
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    tabIndex={0}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSuggestionClick(suggestion);
                      if (e.key === 'ArrowDown' && index < suggestions.length - 1) {
                        suggestionsRef.current.children[index + 1].focus();
                      }
                      if (e.key === 'ArrowUp' && index > 0) {
                        suggestionsRef.current.children[index - 1].focus();
                      }
                    }}
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                    role="option"
                    aria-selected={searchTerm === suggestion}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="md:hidden">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input w-full"
              aria-label={t.categoryLabel}
            >
              {uniqueCategories.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="hidden md:flex flex-wrap gap-2">
            {uniqueCategories.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`category-button text-sm ${selectedCategory === key ? 'active' : ''}`}
                aria-label={`${t.categoryLabel}: ${label}`}
                aria-pressed={selectedCategory === key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="videos-grid" aria-live="polite">
        {filteredVideos.length === 0 ? (
          <div className="auth-container text-center py-12">
            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              {searchTerm || selectedCategory !== 'all' ? t.noResults : t.noVideos}
            </h3>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="btn-secondary"
                aria-label={t.clearSearch}
              >
                {t.clearSearch}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>

      {filteredVideos.length > 3 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 btn-primary p-3 rounded-full shadow-lg"
          aria-label={t.backToTop}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </main>
  );
};

export default Videos;