// C:\my-med-platform\frontend\src\pages/AdminCourses.js
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { db, storage } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AdminCourses = () => {
  const { language } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ 
    title: { fr: '', ar: '' }, 
    description: { fr: '', ar: '' },
    pdfFile: null,
    pdfUrl: '',
    pdfSource: 'url' // 'url' or 'upload'
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const coursesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(coursesList);
      } catch (err) {
        setError(language === 'fr' ? 'Erreur lors du chargement des cours.' : 'خطأ أثناء تحميل الدروس.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [language]);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title.fr || !newCourse.title.ar || !newCourse.description.fr || !newCourse.description.ar) {
      setError(language === 'fr' ? 'Tous les champs sont requis dans les deux langues.' : 'جميع الحقول مطلوبة بكلا اللغتين.');
      return;
    }

    // Validate PDF source
    if (newCourse.pdfSource === 'url' && !newCourse.pdfUrl.trim()) {
      setError(language === 'fr' ? 'L\'URL du PDF est requise.' : 'رابط PDF مطلوب.');
      return;
    }
    if (newCourse.pdfSource === 'upload' && !newCourse.pdfFile) {
      setError(language === 'fr' ? 'Veuillez sélectionner un fichier PDF.' : 'يرجى اختيار ملف PDF.');
      return;
    }

    try {
      setUploading(true);
      let pdfUrl = '';

      if (newCourse.pdfSource === 'url') {
        pdfUrl = newCourse.pdfUrl.trim();
      } else if (newCourse.pdfSource === 'upload' && newCourse.pdfFile) {
        // Upload file to Firebase Storage
        const timestamp = Date.now();
        const fileName = `courses/${timestamp}_${newCourse.pdfFile.name}`;
        const storageRef = ref(storage, fileName);
        
        const snapshot = await uploadBytes(storageRef, newCourse.pdfFile);
        pdfUrl = await getDownloadURL(snapshot.ref);
      }

      const courseData = {
        title: newCourse.title,
        description: newCourse.description,
        pdfUrl: pdfUrl,
        pdfFileName: newCourse.pdfFile ? newCourse.pdfFile.name : '',
        createdAt: new Date().toISOString(),
        status: 'active',
        modules: [] // Initialize empty modules array
      };
      
      const docRef = await addDoc(collection(db, 'courses'), courseData);
      
      // Update local state
      setCourses([...courses, { id: docRef.id, ...courseData }]);
      setNewCourse({ 
        title: { fr: '', ar: '' }, 
        description: { fr: '', ar: '' },
        pdfFile: null,
        pdfUrl: '',
        pdfSource: 'url'
      });
      setError('');
    } catch (err) {
      setError(language === 'fr' ? 'Erreur lors de l\'ajout.' : 'خطأ أثناء الإضافة.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm(language === 'fr' ? 'Confirmer la suppression ?' : 'تأكيد الحذف؟')) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        setCourses(courses.filter(course => course.id !== courseId));
      } catch (err) {
        setError(language === 'fr' ? 'Erreur lors de la suppression.' : 'خطأ أثناء الحذف.');
        console.error(err);
      }
    }
  };

  // Helper function to get text in current language
  const getLocalizedText = (textObj) => {
    if (typeof textObj === 'string') return textObj;
    return textObj?.[language] || textObj?.fr || textObj?.ar || '';
  };

  return (
    <div className="page-container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Gestion des cours' : 'إدارة الدروس'}
      </h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <form onSubmit={handleAddCourse} className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'fr' ? 'Titre (Français)' : 'العنوان (فرنسي)'}
            </label>
            <input
              type="text"
              value={newCourse.title.fr}
              onChange={(e) => setNewCourse({ 
                ...newCourse, 
                title: { ...newCourse.title, fr: e.target.value }
              })}
              placeholder={language === 'fr' ? 'Titre en français' : 'العنوان بالفرنسية'}
              className="block w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        
        {/* PDF Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">
            {language === 'fr' ? 'Document PDF' : 'وثيقة PDF'}
          </h3>
          
          {/* PDF Source Selection */}
          <div className="mb-4">
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="pdfSource"
                  value="url"
                  checked={newCourse.pdfSource === 'url'}
                  onChange={(e) => setNewCourse({ 
                    ...newCourse, 
                    pdfSource: e.target.value,
                    pdfFile: null 
                  })}
                  className="mr-2"
                />
                {language === 'fr' ? 'URL' : 'رابط'}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="pdfSource"
                  value="upload"
                  checked={newCourse.pdfSource === 'upload'}
                  onChange={(e) => setNewCourse({ 
                    ...newCourse, 
                    pdfSource: e.target.value,
                    pdfUrl: '' 
                  })}
                  className="mr-2"
                />
                {language === 'fr' ? 'Upload fichier' : 'رفع ملف'}
              </label>
            </div>
          </div>

          {/* URL Input */}
          {newCourse.pdfSource === 'url' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {language === 'fr' ? 'URL du PDF' : 'رابط PDF'}
              </label>
              <input
                type="url"
                value={newCourse.pdfUrl}
                onChange={(e) => setNewCourse({ 
                  ...newCourse, 
                  pdfUrl: e.target.value
                })}
                placeholder={language === 'fr' ? 'https://example.com/document.pdf' : 'https://example.com/document.pdf'}
                className="block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          {/* File Upload */}
          {newCourse.pdfSource === 'upload' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {language === 'fr' ? 'Fichier PDF' : 'ملف PDF'}
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setNewCourse({ 
                  ...newCourse, 
                  pdfFile: e.target.files[0]
                })}
                className="block w-full p-2 border border-gray-300 rounded-md"
              />
              {newCourse.pdfFile && (
                <p className="text-sm text-gray-600 mt-1">
                  {language === 'fr' ? 'Fichier sélectionné:' : 'الملف المحدد:'} {newCourse.pdfFile.name}
                </p>
              )}
            </div>
          )}
        </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'fr' ? 'Titre (Arabe)' : 'العنوان (عربي)'}
            </label>
            <input
              type="text"
              value={newCourse.title.ar}
              onChange={(e) => setNewCourse({ 
                ...newCourse, 
                title: { ...newCourse.title, ar: e.target.value }
              })}
              placeholder={language === 'fr' ? 'Titre en arabe' : 'العنوان بالعربية'}
              className="block w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'fr' ? 'Description (Français)' : 'الوصف (فرنسي)'}
            </label>
            <textarea
              value={newCourse.description.fr}
              onChange={(e) => setNewCourse({ 
                ...newCourse, 
                description: { ...newCourse.description, fr: e.target.value }
              })}
              placeholder={language === 'fr' ? 'Description en français' : 'الوصف بالفرنسية'}
              className="block w-full p-2 border border-gray-300 rounded-md"
              rows="3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'fr' ? 'Description (Arabe)' : 'الوصف (عربي)'}
            </label>
            <textarea
              value={newCourse.description.ar}
              onChange={(e) => setNewCourse({ 
                ...newCourse, 
                description: { ...newCourse.description, ar: e.target.value }
              })}
              placeholder={language === 'fr' ? 'Description en arabe' : 'الوصف بالعربية'}
              className="block w-full p-2 border border-gray-300 rounded-md"
              rows="3"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={uploading}
          className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {uploading 
            ? (language === 'fr' ? 'Ajout en cours...' : 'جاري الإضافة...')
            : (language === 'fr' ? 'Ajouter un cours' : 'إضافة درس')
          }
        </button>
      </form>
      
      {loading ? (
        <p>{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</p>
      ) : (
        <div className="space-y-4">
          {courses.map(course => (
            <div key={course.id} className="p-4 bg-gray-100 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">
                    {getLocalizedText(course.title)}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {getLocalizedText(course.description)}
                  </p>
                  {course.pdfUrl && (
                    <div className="mt-2">
                      <a 
                        href={course.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {language === 'fr' ? 'Voir le PDF' : 'عرض PDF'}
                        {course.pdfFileName && ` (${course.pdfFileName})`}
                      </a>
                    </div>
                  )}
                  {course.modules && course.modules.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">
                        {language === 'fr' ? 'Modules:' : 'الوحدات:'}
                      </span>
                      <ul className="text-sm text-gray-600 mt-1">
                        {course.modules.map((module, index) => (
                          <li key={index} className="ml-4">
                            • {getLocalizedText(module)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 ml-4"
                >
                  {language === 'fr' ? 'Supprimer' : 'حذف'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCourses;