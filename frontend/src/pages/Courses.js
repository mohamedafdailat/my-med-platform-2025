import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Card from '../components/Card';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getVisibleDocuments } from '../services/contentService';
import PlaceholderImage from '../components/PlaceholderImage';

const Courses = () => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getLocalizedText = (value, fallback = '') => {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    return value?.[language] || value?.fr || value?.ar || fallback;
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError('');

        const documents = await getVisibleDocuments('courses', user);

        const coursesList = documents
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .filter((course) => course.status !== 'inactive' || user.customClaims?.role === 'admin');

        setCourses(coursesList);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(
          language === 'fr'
            ? 'Erreur lors du chargement des cours.'
            : 'خطأ أثناء تحميل الدروس.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [language, user]);

  const categories = useMemo(
    () => [
      {
        id: 'all',
        label: language === 'fr' ? 'Tous les cours' : 'جميع الدورات',
        icon: '🎓',
      },
      {
        id: 'anatomy',
        label: language === 'fr' ? 'Anatomie' : 'علم التشريح',
        icon: '🫀',
      },
      {
        id: 'physiology',
        label: language === 'fr' ? 'Physiologie' : 'علم وظائف الأعضاء',
        icon: '🧬',
      },
      {
        id: 'pharmacology',
        label: language === 'fr' ? 'Pharmacologie' : 'علم الأدوية',
        icon: '💊',
      },
      {
        id: 'pathology',
        label: language === 'fr' ? 'Pathologie' : 'علم الأمراض',
        icon: '🔬',
      },
      {
        id: 'surgery',
        label: language === 'fr' ? 'Chirurgie' : 'الجراحة',
        icon: '⚕️',
      },
    ],
    [language]
  );

  const getModuleCount = (course) => {
    if (Array.isArray(course.modules)) return course.modules.length;
    if (Array.isArray(course.lessons)) return course.lessons.length;
    if (typeof course.lessons === 'number') return course.lessons;
    if (typeof course.lessonsCount === 'number') return course.lessonsCount;
    return 0;
  };

  const formatDate = (value) => {
    if (!value) return '';

    let date;

    if (typeof value?.toDate === 'function') {
      date = value.toDate();
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'ar-MA');
  };

  const getDifficultyBadge = (level) => {
    const levels = {
      beginner: {
        fr: 'Débutant',
        ar: 'مبتدئ',
        color: 'bg-green-100 text-green-800 border-green-200',
      },
      intermediate: {
        fr: 'Intermédiaire',
        ar: 'متوسط',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      },
      advanced: {
        fr: 'Avancé',
        ar: 'متقدم',
        color: 'bg-red-100 text-red-800 border-red-200',
      },
    };

    const levelData = levels[level] || levels.beginner;

    return {
      label: levelData[language] || levelData.fr,
      color: levelData.color,
    };
  };

  const getCategoryIcon = (category) => {
    const categoryMap = {
      anatomy: 'anatomy',
      physiology: 'physiology',
      pharmacology: 'pharmacology',
      pathology: 'pathology',
      surgery: 'surgery',
    };

    return categoryMap[category] || 'course';
  };

  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        if (selectedCategory === 'all') return true;
        return course.category === selectedCategory;
      })
      .filter((course) => {
        const search = searchQuery.trim().toLowerCase();
        if (!search) return true;

        const title = getLocalizedText(course.title).toLowerCase();
        const description = getLocalizedText(course.description).toLowerCase();
        const category = String(course.category || '').toLowerCase();

        return (
          title.includes(search) ||
          description.includes(search) ||
          category.includes(search)
        );
      });
  }, [courses, selectedCategory, searchQuery, language]);

  const renderCourseImage = (course) => {
    const title = getLocalizedText(
      course.title,
      language === 'fr' ? 'Cours' : 'دورة'
    );

    if (course.thumbnail) {
      return (
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={course.thumbnail}
            alt={title}
            className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
              const fallback = event.currentTarget.parentElement?.querySelector(
                '.course-placeholder-fallback'
              );
              if (fallback) fallback.style.display = 'block';
            }}
          />

          <div className="course-placeholder-fallback hidden">
            <PlaceholderImage
              width={300}
              height={192}
              type={getCategoryIcon(course.category)}
              text={title}
              className="w-full h-48 rounded-lg"
            />
          </div>
        </div>
      );
    }

    return (
      <PlaceholderImage
        width={300}
        height={192}
        type={getCategoryIcon(course.category)}
        text={title}
        className="w-full h-48 rounded-lg transition-transform duration-300 hover:scale-105"
      />
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={`course-skeleton-${index}`}
                  className="bg-gray-200 h-80 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-container ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>

        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          {language === 'fr' ? 'Formation Médicale' : 'التدريب الطبي'}
        </h2>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {language === 'fr'
            ? 'Explorez notre collection complète de cours médicaux interactifs, conçus par des experts pour enrichir vos connaissances professionnelles.'
            : 'استكشف مجموعتنا الشاملة من الدورات الطبية التفاعلية، المصممة من قبل خبراء لإثراء معرفتك المهنية.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8 shadow-sm">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
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
            {error}
          </div>
        </div>
      )}

      <div className="mb-10">
        <div className="mb-8">
          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              placeholder={
                language === 'fr' ? 'Rechercher un cours...' : 'ابحث عن دورة...'
              }
              className="w-full px-6 py-4 pr-12 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:shadow-md"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`flex items-center px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="text-lg mr-2">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 text-center">
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>

          {language === 'fr'
            ? `${filteredCourses.length} cours trouvé${
                filteredCourses.length > 1 ? 's' : ''
              }`
            : `تم العثور على ${filteredCourses.length} دورة`}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => {
            const difficulty = getDifficultyBadge(
              course.difficulty || 'beginner'
            );
            const moduleCount = getModuleCount(course);
            const title = getLocalizedText(
              course.title,
              language === 'fr' ? 'Titre non disponible' : 'العنوان غير متوفر'
            );
            const description = getLocalizedText(
              course.description,
              language === 'fr'
                ? 'Description non disponible'
                : 'الوصف غير متوفر'
            );

            return (
              <Card
                key={course.id}
                title={title}
                description={description}
                image={renderCourseImage(course)}
                action={
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${difficulty.color}`}
                      >
                        {difficulty.label}
                      </span>

                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>

                        {language === 'fr'
                          ? `${moduleCount} module${moduleCount > 1 ? 's' : ''}`
                          : `${moduleCount} وحدة`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      {course.createdAt && (
                        <span className="flex items-center">
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
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatDate(course.createdAt)}
                        </span>
                      )}

                      {course.estimatedDuration && (
                        <span className="flex items-center">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {course.estimatedDuration}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {course.pdfUrl && (
                        <span className="inline-flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          PDF inclus
                        </span>
                      )}

                      {course.hasQuiz && (
                        <span className="inline-flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                          Quiz
                        </span>
                      )}

                      {course.hasVideo && (
                        <span className="inline-flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          Vidéos
                        </span>
                      )}
                    </div>

                    <NavLink
                      to={`/courses/${course.id}`}
                      className="group block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-center py-3 px-6 rounded-xl transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                    >
                      <span className="flex items-center justify-center">
                        {language === 'fr'
                          ? 'Commencer le cours'
                          : 'ابدأ الدورة'}
                      </span>
                    </NavLink>
                  </div>
                }
              />
            );
          })
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'fr'
                ? 'Aucun cours trouvé'
                : 'لم يتم العثور على دورات'}
            </h3>

            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {language === 'fr'
                ? 'Aucun cours ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
                : 'لا توجد دورات تتطابق مع معايير البحث الخاصة بك. حاول تعديل المرشحات.'}
            </p>

            {(searchQuery || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
              >
                {language === 'fr'
                  ? 'Réinitialiser les filtres'
                  : 'إعادة تعيين المرشحات'}
              </button>
            )}
          </div>
        )}
      </div>

      {filteredCourses.length > 6 && (
        <div className="text-center mt-12">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            {language === 'fr' ? 'Retour en haut' : 'العودة إلى الأعلى'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Courses;
