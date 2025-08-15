import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase/config';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState(0);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const courseDoc = await getDoc(doc(db, 'courses', id));
        
        if (courseDoc.exists() && courseDoc.data().status === 'active') {
          const courseData = { id: courseDoc.id, ...courseDoc.data() };
          setCourse(courseData);
          
          // Fetch related courses in the same category
          if (courseData.category) {
            await fetchRelatedCourses(courseData.category, id);
          }
        } else {
          setError(language === 'fr' ? 'Cours non trouvé ou non actif' : 'الدورة غير موجودة أو غير نشطة');
        }
      } catch (err) {
        setError(language === 'fr' ? 'Erreur lors du chargement du cours' : 'خطأ أثناء تحميل الدورة');
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, language]);

  const fetchRelatedCourses = async (category, currentCourseId) => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'courses'),
          where('category', '==', category),
          where('status', '==', 'active')
        )
      );
      
      const courses = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(course => course.id !== currentCourseId)
        .slice(0, 3); // Limit to 3 related courses
      
      setRelatedCourses(courses);
    } catch (err) {
      console.error('Error fetching related courses:', err);
    }
  };

  // Helper function to get localized text
  const getLocalizedText = (textObj) => {
    if (typeof textObj === 'string') return textObj;
    return textObj?.[language] || textObj?.fr || textObj?.ar || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return language === 'fr' 
      ? date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('ar-MA');
  };

  const handleModuleComplete = (moduleIndex) => {
    const newProgress = Math.max(progress, ((moduleIndex + 1) / (course.modules?.length || 1)) * 100);
    setProgress(newProgress);
  };

  const getCategoryLabel = (category) => {
    const categories = {
      anatomy: language === 'fr' ? 'Anatomie' : 'تشريح',
      physiology: language === 'fr' ? 'Physiologie' : 'فسيولوجيا',
      pharmacology: language === 'fr' ? 'Pharmacologie' : 'علم الصيدلة',
      pathology: language === 'fr' ? 'Pathologie' : 'علم الأمراض',
      surgery: language === 'fr' ? 'Chirurgie' : 'جراحة',
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container text-center">
        <div className="max-w-md mx-auto">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {language === 'fr' ? 'Cours non trouvé' : 'الدورة غير موجودة'}
          </h2>
          <p className="text-red-500 mb-6">{error}</p>
          <div className="space-y-3">
            <NavLink 
              to="/courses" 
              className="block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {language === 'fr' ? 'Retour aux cours' : 'العودة إلى الدورات'}
            </NavLink>
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {language === 'fr' ? 'Recharger la page' : 'إعادة تحميل الصفحة'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-container text-center">
        <p className="text-gray-500">{language === 'fr' ? 'Cours non disponible' : 'الدورة غير متاحة'}</p>
        <NavLink to="/courses" className="btn-primary mt-4">
          {language === 'fr' ? 'Retour aux cours' : 'العودة إلى الدورات'}
        </NavLink>
      </div>
    );
  }

  const modules = course.modules || [];
  const currentModule = modules[selectedModule];

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <NavLink to="/courses" className="hover:text-blue-600">
            {language === 'fr' ? 'Cours' : 'الدورات'}
          </NavLink>
          <span>/</span>
          <span className="font-medium text-gray-900">
            {getLocalizedText(course.title)}
          </span>
        </div>
      </nav>

      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2 mb-2">
              {course.category && (
                <span className="bg-blue-500 bg-opacity-50 px-2 py-1 rounded-full text-xs font-medium">
                  {getCategoryLabel(course.category)}
                </span>
              )}
              {course.createdAt && (
                <span className="text-blue-200 text-sm">
                  {formatDate(course.createdAt)}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {getLocalizedText(course.title)}
            </h1>
            <p className="text-blue-100 text-lg">
              {getLocalizedText(course.description)}
            </p>
          </div>
          
          {/* Course Stats */}
          <div className="text-right">
            <div className="text-2xl font-bold mb-1">
              {modules.length}
            </div>
            <div className="text-blue-200 text-sm">
              {language === 'fr' 
                ? `Module${modules.length > 1 ? 's' : ''}` 
                : `وحدة`
              }
            </div>
            {progress > 0 && (
              <div className="mt-2">
                <div className="text-sm text-blue-200 mb-1">
                  {language === 'fr' ? 'Progression' : 'التقدم'}: {Math.round(progress)}%
                </div>
                <div className="w-32 bg-blue-400 bg-opacity-30 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Content */}
        <div className="lg:col-span-2">
          {/* PDF Viewer */}
          {course.pdfUrl && (
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {language === 'fr' ? 'Document du cours' : 'وثيقة الدورة'}
                </h3>
              </div>
              <div className="p-4">
                <iframe
                  src={course.pdfUrl}
                  className="w-full h-96 border-0 rounded"
                  title={getLocalizedText(course.title)}
                />
                <div className="flex items-center justify-between mt-4">
                  <a
                    href={course.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {language === 'fr' ? 'Ouvrir dans un nouvel onglet' : 'فتح في علامة تبويب جديدة'}
                  </a>
                  <a
                    href={course.pdfUrl}
                    download
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {language === 'fr' ? 'Télécharger' : 'تحميل'}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Module Content */}
          {currentModule && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  {language === 'fr' ? `Module ${selectedModule + 1}` : `الوحدة ${selectedModule + 1}`}
                </h3>
                <button
                  onClick={() => handleModuleComplete(selectedModule)}
                  className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {language === 'fr' ? 'Marquer comme terminé' : 'وضع علامة مكتمل'}
                </button>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {getLocalizedText(currentModule)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Module Navigation */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {language === 'fr' ? 'Plan du cours' : 'خطة الدورة'}
              </h3>
            </div>
            <div className="p-4">
              {modules.length > 0 ? (
                <div className="space-y-2">
                  {modules.map((module, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedModule(index)}
                      className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                        selectedModule === index
                          ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {language === 'fr' ? `Module ${index + 1}` : `الوحدة ${index + 1}`}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 truncate">
                            {getLocalizedText(module).substring(0, 50)}...
                          </div>
                        </div>
                        {progress >= ((index + 1) / modules.length) * 100 && (
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {language === 'fr' ? 'Aucun module disponible' : 'لا توجد وحدات متاحة'}
                </p>
              )}
            </div>
          </div>

          {/* Course Actions */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="space-y-3">
              <NavLink 
                to="/courses" 
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-center py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              >
                {language === 'fr' ? 'Retour aux cours' : 'العودة إلى الدورات'}
              </NavLink>
              
              {course.pdfUrl && (
                <a
                  href={course.pdfUrl}
                  download
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
                >
                  {language === 'fr' ? 'Télécharger le PDF' : 'تحميل PDF'}
                </a>
              )}
              
              <button
                onClick={() => window.print()}
                className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              >
                {language === 'fr' ? 'Imprimer' : 'طباعة'}
              </button>
            </div>
          </div>

          {/* Course Info */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3">
              {language === 'fr' ? 'Informations' : 'معلومات'}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {language === 'fr' ? 'Modules:' : 'الوحدات:'}
                </span>
                <span className="font-medium">{modules.length}</span>
              </div>
              
              {course.category && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {language === 'fr' ? 'Catégorie:' : 'الفئة:'}
                  </span>
                  <span className="font-medium">{getCategoryLabel(course.category)}</span>
                </div>
              )}
              
              {course.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {language === 'fr' ? 'Créé le:' : 'تم إنشاؤه في:'}
                  </span>
                  <span className="font-medium">{formatDate(course.createdAt)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {language === 'fr' ? 'Progression:' : 'التقدم:'}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Related Courses */}
          {relatedCourses.length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  {language === 'fr' ? 'Cours similaires' : 'دورات مماثلة'}
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {relatedCourses.map(relatedCourse => (
                    <div
                      key={relatedCourse.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors duration-200"
                    >
                      <h4 className="font-medium text-sm mb-1">
                        {getLocalizedText(relatedCourse.title)}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {getLocalizedText(relatedCourse.description)}
                      </p>
                      <NavLink
                        to={`/courses/${relatedCourse.id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        {language === 'fr' ? 'Voir ce cours →' : 'عرض هذه الدورة ←'}
                      </NavLink>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={() => setSelectedModule(Math.max(0, selectedModule - 1))}
          disabled={selectedModule === 0}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {language === 'fr' ? 'Module précédent' : 'الوحدة السابقة'}
        </button>
        
        <div className="text-sm text-gray-600">
          {modules.length > 0 && (
            <>
              {selectedModule + 1} {language === 'fr' ? 'sur' : 'من'} {modules.length}
            </>
          )}
        </div>
        
        <button
          onClick={() => setSelectedModule(Math.min(modules.length - 1, selectedModule + 1))}
          disabled={selectedModule === modules.length - 1}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {language === 'fr' ? 'Module suivant' : 'الوحدة التالية'}
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CoursePlayer;