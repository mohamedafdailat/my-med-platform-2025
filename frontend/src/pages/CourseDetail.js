import React from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { NavLink } from 'react-router-dom'; // Ensure this is included

const CourseDetail = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const courses = [
    { id: 1, title: language === 'fr' ? 'Cours : Anatomie humaine' : 'دورة: التشريح البشري', description: language === 'fr' ? 'Introduction complète à l’anatomie humaine.' : 'مقدمة شاملة للتشريح البشري.', thumbnail: 'https://www.docdeclic.fr/uploads/1587477264_3ea943e53a43e6383b3e.png', lessons: 12, category: 'anatomy' },
    { id: 2, title: language === 'fr' ? 'Cours : Physiologie de base' : 'دورة: الفسيولوجيا الأساسية', description: language === 'fr' ? 'Découvrez les fonctions du corps humain.' : 'اكتشف وظائف الجسم البشري.', thumbnail: 'https://s1.studylibfr.com/store/data/003860148_1-191dfeecf95f96625f28d673088726f2.png', lessons: 10, category: 'physiology' },
    { id: 3, title: language === 'fr' ? 'Cours : Pharmacologie clinique' : 'دورة: الصيدلة السريرية', description: language === 'fr' ? 'Étude des médicaments et leurs applications.' : 'دراسة الأدوية وتطبيقاتها.', thumbnail: 'https://cdn.slidesharecdn.com/ss_thumbnails/lesantibiotiquesi-171209223412-thumbnail.jpg?width=640&height=640&fit=bounds', lessons: 15, category: 'pharmacology' },
  ];

  const course = courses.find(c => c.id === parseInt(id));

  if (!course) {
    return (
      <div className="page-container text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">{language === 'fr' ? 'Cours non trouvé' : 'الدورة غير موجودة'}</h2>
        <p className="text-gray-600 mt-4">{language === 'fr' ? 'Vérifiez l\'ID du cours ou retournez à la liste.' : 'تحقق من معرف الدورة أو عُد إلى القائمة.'}</p>
        <NavLink to="/courses" className="btn-primary mt-6 inline-block">{language === 'fr' ? 'Retour aux cours' : 'العودة إلى الدورات'}</NavLink>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row gap-6">
        <img src={course.thumbnail} alt={course.title} className="w-full md:w-1/3 rounded-lg shadow-md" />
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-4">{course.title}</h2>
          <p className="text-gray-700 mb-4">{course.description}</p>
          <div className="mb-4">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded">{language === 'fr' ? 'Catégorie' : 'الفئة'}: {course.category}</span>
            <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">{language === 'fr' ? `${course.lessons} leçons` : `${course.lessons} دروس`}</span>
          </div>
          <NavLink to="/courses" className="btn-secondary mt-4 inline-block">{language === 'fr' ? 'Retour à la liste' : 'العودة إلى القائمة'}</NavLink>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;