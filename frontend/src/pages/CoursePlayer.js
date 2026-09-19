import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase/config';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

const CoursePlayer = () => {
  const { id } = useParams();
  const { language } = useLanguage();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedModule, setSelectedModule] = useState(0);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [completedModules, setCompletedModules] = useState([]);

  const isRTL = language === 'ar';

  const getLocalizedText = useCallback(
    (value, fallback = '') => {
      if (!value) return fallback;
      if (typeof value === 'string') return value;
      return value?.[language] || value?.fr || value?.ar || fallback;
    },
    [language]
  );

  const normalizeDate = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = useCallback(
    (value) => {
      const date = normalizeDate(value);
      if (!date) return '';

      return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'ar-MA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
    [language]
  );

  const getCategoryLabel = useCallback(
    (category) => {
      const categories = {
        anatomy: language === 'fr' ? 'Anatomie' : 'تشريح',
        physiology: language === 'fr' ? 'Physiologie' : 'فسيولوجيا',
        pharmacology: language === 'fr' ? 'Pharmacologie' : 'علم الصيدلة',
        pathology: language === 'fr' ? 'Pathologie' : 'علم الأمراض',
        surgery: language === 'fr' ? 'Chirurgie' : 'جراحة',
      };

      return categories[category] || category || '';
    },
    [language]
  );

  const normalizeModules = useCallback(
    (courseData) => {
      const rawModules = Array.isArray(courseData?.modules)
        ? courseData.modules
        : Array.isArray(courseData?.lessons)
        ? courseData.lessons
        : [];

      return rawModules.map((module, index) => {
        if (typeof module === 'string') {
          return {
            id: `module-${index}`,
            title:
              language === 'fr'
                ? `Module ${index + 1}`
                : `الوحدة ${index + 1}`,
            content: module,
            pdfUrl: null,
            videoUrl: null,
          };
        }

        return {
          id: module.id || `module-${index}`,
          title: getLocalizedText(
            module.title,
            language === 'fr'
              ? `Module ${index + 1}`
              : `الوحدة ${index + 1}`
          ),
          content: getLocalizedText(module.content || module.description, ''),
          pdfUrl: module.pdfUrl || module.fileUrl || null,
          videoUrl: module.videoUrl || module.youtubeUrl || null,
        };
      });
    },
    [getLocalizedText, language]
  );

  const fetchRelatedCourses = useCallback(
    async (category, currentCourseId) => {
      try {
        const querySnapshot = await getDocs(
          query(
            collection(db, 'courses'),
            where('category', '==', category),
            where('status', '==', 'active')
          )
        );

        const courses = querySnapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .filter((relatedCourse) => relatedCourse.id !== currentCourseId)
          .slice(0, 3);

        setRelatedCourses(courses);
      } catch (err) {
        console.error('Error fetching related courses:', err);
      }
    },
    []
  );

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError('');

        const courseDoc = await getDoc(doc(db, 'courses', id));

        if (!courseDoc.exists()) {
          setError(
            language === 'fr'
              ? 'Cours non trouvé.'
              : 'الدورة غير موجودة.'
          );
          return;
        }

        const courseData = {
          id: courseDoc.id,
          ...courseDoc.data(),
        };

        if (courseData.status !== 'active') {
          setError(
            language === 'fr'
              ? 'Cours non actif.'
              : 'الدورة غير نشطة.'
          );
          return;
        }

        setCourse(courseData);
        setSelectedModule(0);
        setCompletedModules([]);

        if (courseData.category) {
          await fetchRelatedCourses(courseData.category, courseData.id);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(
          language === 'fr'
            ? 'Erreur lors du chargement du cours.'
            : 'خطأ أثناء تحميل الدورة.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, language, fetchRelatedCourses]);

  const modules = useMemo(() => normalizeModules(course), [course, normalizeModules]);
  const currentModule = modules[selectedModule] || null;

  const progress =
    modules.length > 0
      ? Math.round((completedModules.length / modules.length) * 100)
      : 0;

  const handleModuleComplete = (moduleIndex) => {
    setCompletedModules((prev) => {
      if (prev.includes(moduleIndex)) return prev;
      return [...prev, moduleIndex];
    });
  };

  const getModulePreview = (module) => {
    const content = module?.content || module?.title || '';
    return content.length > 55 ? `${content.substring(0, 55)}...` : content;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded-lg mb-6" />
              <div className="h-32 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-96 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container text-center">
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
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
              type="button"
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
        <p className="text-gray-500">
          {language === 'fr' ? 'Cours non disponible' : 'الدورة غير متاحة'}
        </p>

        <NavLink to="/courses" className="btn-primary mt-4 inline-block">
          {language === 'fr' ? 'Retour aux cours' : 'العودة إلى الدورات'}
        </NavLink>
      </div>
    );
  }

  return (
    <div className={`page-container ${isRTL ? 'rtl' : 'ltr'}`}>
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

          <div className="text-right">
            <div className="text-2xl font-bold mb-1">{modules.length}</div>
            <div className="text-blue-200 text-sm">
              {language === 'fr'
                ? `Module${modules.length > 1 ? 's' : ''}`
                : 'وحدة'}
            </div>

            <div className="mt-2">
              <div className="text-sm text-blue-200 mb-1">
                {language === 'fr' ? 'Progression' : 'التقدم'}: {progress}%
              </div>

              <div className="w-32 bg-blue-400 bg-opacity-30 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {course.pdfUrl && (
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
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
                    {language === 'fr'
                      ? 'Ouvrir dans un nouvel onglet'
                      : 'فتح في علامة تبويب جديدة'}
                  </a>

                  <a
                    href={course.pdfUrl}
                    download
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    {language === 'fr' ? 'Télécharger' : 'تحميل'}
                  </a>
                </div>
              </div>
            </div>
          )}

          {currentModule ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {currentModule.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {language === 'fr'
                      ? `Module ${selectedModule + 1} sur ${modules.length}`
                      : `الوحدة ${selectedModule + 1} من ${modules.length}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleModuleComplete(selectedModule)}
                  className={`text-sm font-medium flex items-center ${
                    completedModules.includes(selectedModule)
                      ? 'text-green-700'
                      : 'text-green-600 hover:text-green-800'
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {completedModules.includes(selectedModule)
                    ? language === 'fr'
                      ? 'Terminé'
                      : 'مكتمل'
                    : language === 'fr'
                    ? 'Marquer comme terminé'
                    : 'وضع علامة مكتمل'}
                </button>
              </div>

              {currentModule.videoUrl && (
                <div className="mb-6">
                  <a
                    href={currentModule.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {language === 'fr'
                      ? 'Voir la vidéo du module'
                      : 'مشاهدة فيديو الوحدة'}
                  </a>
                </div>
              )}

              {currentModule.pdfUrl && (
                <div className="mb-6">
                  <a
                    href={currentModule.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    {language === 'fr'
                      ? 'Ouvrir le PDF du module'
                      : 'فتح ملف PDF للوحدة'}
                  </a>
                </div>
              )}

              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {currentModule.content ||
                    (language === 'fr'
                      ? 'Aucun contenu disponible pour ce module.'
                      : 'لا يوجد محتوى متاح لهذه الوحدة.')}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              {language === 'fr'
                ? 'Aucun module disponible pour ce cours.'
                : 'لا توجد وحدات متاحة لهذه الدورة.'}
            </div>
          )}
        </div>

        <div className="space-y-6">
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
                      key={module.id || index}
                      type="button"
                      onClick={() => setSelectedModule(index)}
                      className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                        selectedModule === index
                          ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {module.title}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 truncate">
                            {getModulePreview(module)}
                          </div>
                        </div>

                        {completedModules.includes(index) && (
                          <svg
                            className="w-4 h-4 text-green-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {language === 'fr'
                    ? 'Aucun module disponible'
                    : 'لا توجد وحدات متاحة'}
                </p>
              )}
            </div>
          </div>

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
                type="button"
                onClick={() => window.print()}
                className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              >
                {language === 'fr' ? 'Imprimer' : 'طباعة'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3">
              {language === 'fr' ? 'Informations' : 'معلومات'}
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {language === 'fr' ? 'Modules :' : 'الوحدات:'}
                </span>
                <span className="font-medium">{modules.length}</span>
              </div>

              {course.category && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {language === 'fr' ? 'Catégorie :' : 'الفئة:'}
                  </span>
                  <span className="font-medium">
                    {getCategoryLabel(course.category)}
                  </span>
                </div>
              )}

              {course.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {language === 'fr' ? 'Créé le :' : 'تم إنشاؤه في:'}
                  </span>
                  <span className="font-medium">
                    {formatDate(course.createdAt)}
                  </span>
                </div>
              )}

              {course.estimatedDuration && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {language === 'fr' ? 'Durée :' : 'المدة:'}
                  </span>
                  <span className="font-medium">
                    {course.estimatedDuration}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">
                  {language === 'fr' ? 'Progression :' : 'التقدم:'}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
            </div>
          </div>

          {relatedCourses.length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  {language === 'fr' ? 'Cours similaires' : 'دورات مماثلة'}
                </h3>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  {relatedCourses.map((relatedCourse) => (
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
                        {language === 'fr'
                          ? 'Voir ce cours →'
                          : 'عرض هذه الدورة ←'}
                      </NavLink>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {modules.length > 0 && (
        <div className="mt-8 flex justify-between items-center">
          <button
            type="button"
            onClick={() =>
              setSelectedModule((prev) => Math.max(0, prev - 1))
            }
            disabled={selectedModule === 0}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {language === 'fr' ? 'Module précédent' : 'الوحدة السابقة'}
          </button>

          <div className="text-sm text-gray-600">
            {selectedModule + 1} {language === 'fr' ? 'sur' : 'من'}{' '}
            {modules.length}
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedModule((prev) =>
                Math.min(modules.length - 1, prev + 1)
              )
            }
            disabled={selectedModule === modules.length - 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {language === 'fr' ? 'Module suivant' : 'الوحدة التالية'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;