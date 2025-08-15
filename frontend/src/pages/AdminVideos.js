// C:\my-med-platform\frontend\src\pages\AdminVideos.js
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { db, storage } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

const AdminVideos = () => {
  const { language } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'videos'));
        const videosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVideos(videosList);
      } catch (err) {
        setError(language === 'fr' ? 'Erreur lors du chargement des vidéos.' : 'خطأ أثناء تحميل الفيديوهات.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [language]);

  const handleDelete = async (videoId, videoUrl) => {
    if (window.confirm(language === 'fr' ? 'Confirmer la suppression ?' : 'تأكيد الحذف؟')) {
      try {
        const storageRef = ref(storage, videoUrl);
        await deleteObject(storageRef);
        await deleteDoc(doc(db, 'videos', videoId));
        setVideos(videos.filter(video => video.id !== videoId));
      } catch (err) {
        setError(language === 'fr' ? 'Erreur lors de la suppression.' : 'خطأ أثناء الحذف.');
        console.error(err);
      }
    }
  };

  return (
    <div className="page-container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Gestion des vidéos' : 'إدارة الفيديوهات'}
      </h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p>{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</p>
      ) : (
        <div className="space-y-4">
          {videos.map(video => (
            <div key={video.id} className="p-4 bg-gray-100 rounded-lg flex justify-between items-center">
              <span>{video.title?.fr || video.title?.ar || 'Sans titre'}</span>
              <button
                onClick={() => handleDelete(video.id, video.videoUrl)}
                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                {language === 'fr' ? 'Supprimer' : 'حذف'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVideos;