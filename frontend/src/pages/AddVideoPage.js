import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const AddVideoPage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  // States pour les formulaires
  const [videoType, setVideoType] = useState('upload'); // 'upload' ou 'youtube'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('other');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Textes multilingues
  const texts = {
    fr: {
      title: 'Ajouter une vidéo',
      videoType: 'Type de vidéo',
      uploadVideo: 'Télécharger un fichier',
      youtubeVideo: 'Lien YouTube',
      videoTitle: 'Titre',
      videoDescription: 'Description',
      youtubeUrl: 'URL YouTube',
      youtubeUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
      videoFile: 'Fichier vidéo (max 100MB)',
      category: 'Catégorie',
      categories: {
        other: 'Autres',
        'general-medicine': 'Médecine générale',
        cardiology: 'Cardiologie',
        pharmacy: 'Pharmacie',
        dentistry: 'Dentaire',
        technology: 'Technologie médicale'
      },
      upload: 'Télécharger',
      uploading: 'Téléchargement...',
      saving: 'Enregistrement...',
      cancel: 'Annuler',
      progress: 'Progression:',
      errors: {
        loginRequired: 'Veuillez vous connecter en tant qu\'admin.',
        allFieldsRequired: 'Tous les champs sont requis.',
        fileSizeLimit: 'Le fichier est trop volumineux (max 100MB).',
        invalidYouTubeUrl: 'URL YouTube invalide.',
        uploadError: 'Erreur lors du téléchargement',
        saveError: 'Erreur lors de l\'enregistrement'
      },
      success: 'Vidéo ajoutée avec succès !'
    },
    ar: {
      title: 'إضافة فيديو',
      videoType: 'نوع الفيديو',
      uploadVideo: 'رفع ملف',
      youtubeVideo: 'رابط يوتيوب',
      videoTitle: 'العنوان',
      videoDescription: 'الوصف',
      youtubeUrl: 'رابط يوتيوب',
      youtubeUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
      videoFile: 'ملف فيديو (الحد الأقصى 100 ميجابايت)',
      category: 'الفئة',
      categories: {
        other: 'أخرى',
        'general-medicine': 'الطب العام',
        cardiology: 'أمراض القلب',
        pharmacy: 'الصيدلة',
        dentistry: 'طب الأسنان',
        technology: 'التكنولوجيا الطبية'
      },
      upload: 'تحميل',
      uploading: 'جاري التحميل...',
      saving: 'جاري الحفظ...',
      cancel: 'إلغاء',
      progress: 'التقدم:',
      errors: {
        loginRequired: 'يرجى تسجيل الدخول كمسؤول.',
        allFieldsRequired: 'جميع الحقول مطلوبة.',
        fileSizeLimit: 'الملف كبير جداً (الحد الأقصى 100 ميجابايت).',
        invalidYouTubeUrl: 'رابط يوتيوب غير صحيح.',
        uploadError: 'خطأ أثناء التحميل',
        saveError: 'خطأ أثناء الحفظ'
      },
      success: 'تم إضافة الفيديو بنجاح!'
    }
  };

  const t = texts[language] || texts.fr;

  // Fonction pour valider l'URL YouTube
  const isValidYouTubeUrl = (url) => {
    if (!url) return false;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  };

  // Fonction pour extraire l'ID YouTube
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError(t.errors.loginRequired);
      return;
    }

    // Validation commune
    if (!title.trim() || !description.trim()) {
      setError(t.errors.allFieldsRequired);
      return;
    }

    // Validation spécifique selon le type
    if (videoType === 'upload') {
      if (!file) {
        setError(t.errors.allFieldsRequired);
        return;
      }
      
      // Vérification de la taille du fichier (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        setError(t.errors.fileSizeLimit);
        return;
      }
    } else if (videoType === 'youtube') {
      if (!youtubeUrl.trim() || !isValidYouTubeUrl(youtubeUrl)) {
        setError(t.errors.invalidYouTubeUrl);
        return;
      }
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      let videoUrl = '';
      let fileName = '';
      let fileSize = 0;
      let fileType = '';

      if (videoType === 'upload') {
        // Upload du fichier vers Firebase Storage
        console.log('Début de l\'upload:', file.name, 'Taille:', file.size, 'Type:', file.type);
        
        const storageRef = ref(storage, `videos/${uuidv4()}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Promesse pour gérer l'upload
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
              console.log('Upload progress:', progress + '%');
            },
            (error) => {
              console.error('Upload error:', error);
              let errorMessage = '';
              
              switch (error.code) {
                case 'storage/unauthorized':
                  errorMessage = language === 'fr' ? 'Accès non autorisé.' : 'غير مصرح بالوصول.';
                  break;
                case 'storage/canceled':
                  errorMessage = language === 'fr' ? 'Upload annulé.' : 'تم إلغاء التحميل.';
                  break;
                case 'storage/unknown':
                  errorMessage = language === 'fr' ? 'Erreur inconnue. Vérifiez votre connexion et réessayez.' : 'خطأ غير معروف. تحقق من اتصالك وحاول مرة أخرى.';
                  break;
                default:
                  errorMessage = `${t.errors.uploadError} : ${error.message}`;
              }
              
              reject(new Error(errorMessage));
            },
            async () => {
              try {
                videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
                fileName = file.name;
                fileSize = file.size;
                fileType = file.type;
                console.log('Upload réussi, URL:', videoUrl);
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      } else {
        // Vidéo YouTube
        videoUrl = youtubeUrl.trim();
        fileName = `YouTube: ${extractYouTubeId(youtubeUrl)}`;
        fileSize = 0;
        fileType = 'youtube';
      }

      // Enregistrement dans Firestore
      console.log('Enregistrement dans Firestore...');
      
      const videoData = {
        title: { fr: title.trim(), ar: title.trim() },
        description: { fr: description.trim(), ar: description.trim() },
        videoUrl,
        fileName,
        fileSize,
        fileType,
        category,
        type: videoType,
        uploadedBy: user.uid,
        uploadedAt: new Date().toISOString(),
        status: 'active',
      };

      // Ajouter l'ID YouTube si c'est une vidéo YouTube
      if (videoType === 'youtube') {
        videoData.youtubeId = extractYouTubeId(youtubeUrl);
      }

      await addDoc(collection(db, 'videos'), videoData);
      
      console.log('Vidéo ajoutée à Firestore');

      // Réinitialisation du formulaire
      setError('');
      setTitle('');
      setDescription('');
      setYoutubeUrl('');
      setFile(null);
      setCategory('other');
      setUploadProgress(0);
      
      // Redirection vers la liste des vidéos
      navigate('/admin/videos');
      
    } catch (err) {
      console.error('Erreur détaillée:', err);
      setError(`${t.errors.saveError} : ${err.message}`);
      setLoading(false);
    }
  };

  const cancelUpload = () => {
    setLoading(false);
    setUploadProgress(0);
    setError('');
  };

  return (
    <div className="page-container max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">
          {t.title}
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection du type de vidéo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t.videoType} *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="upload"
                  checked={videoType === 'upload'}
                  onChange={(e) => setVideoType(e.target.value)}
                  className="mr-2 text-blue-600"
                  disabled={loading}
                />
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  {t.uploadVideo}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="youtube"
                  checked={videoType === 'youtube'}
                  onChange={(e) => setVideoType(e.target.value)}
                  className="mr-2 text-red-600"
                  disabled={loading}
                />
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  {t.youtubeVideo}
                </span>
              </label>
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.videoTitle} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
              disabled={loading}
              placeholder="Titre de la vidéo..."
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.videoDescription} *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows="4"
              required
              disabled={loading}
              placeholder="Description de la vidéo..."
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.category} *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={loading}
            >
              {Object.entries(t.categories).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          {/* Champ conditionnel selon le type */}
          {videoType === 'youtube' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.youtubeUrl} *
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                disabled={loading}
                placeholder={t.youtubeUrlPlaceholder}
              />
              {youtubeUrl && isValidYouTubeUrl(youtubeUrl) && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center text-green-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    URL YouTube valide
                  </div>
                  <div className="mt-2">
                    <img 
                      src={`https://img.youtube.com/vi/${extractYouTubeId(youtubeUrl)}/maxresdefault.jpg`}
                      alt="Aperçu YouTube"
                      className="w-full max-w-xs rounded-md shadow-sm"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${extractYouTubeId(youtubeUrl)}/hqdefault.jpg`;
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.videoFile} *
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                disabled={loading}
              />
              {file && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center text-blue-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {language === 'fr' ? 'Fichier sélectionné:' : 'الملف المحدد:'}
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    📁 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Barre de progression */}
          {loading && videoType === 'upload' && (
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center text-xs text-white font-medium" 
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress > 10 && `${uploadProgress.toFixed(0)}%`}
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                {t.progress} {uploadProgress.toFixed(1)}%
              </p>
            </div>
          )}
          
          {/* Boutons d'action */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center font-medium"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {videoType === 'upload' ? t.uploading : t.saving}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t.upload}
                </>
              )}
            </button>
            
            {loading && (
              <button
                type="button"
                onClick={cancelUpload}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVideoPage;