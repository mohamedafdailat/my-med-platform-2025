import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const CoursePlayer = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const [course, setCourse] = useState({
    title: { fr: 'Cours non trouvé', ar: 'الدورة غير موجودة' },
    description: { fr: '', ar: '' },
    lessons: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseDoc = doc(db, 'courses', id);
        const docSnap = await getDoc(courseDoc);
        if (docSnap.exists()) {
          setCourse(docSnap.data());
        }
      } catch (error) {
        console.error('Erreur Firestore:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) {
    return <div>{language === 'fr' ? 'Chargement...' : 'جارٍ التحميل...'}</div>;
  }

  return (
    <div className="page-container">
      <h2 className="text-3xl font-bold mb-6">{course.title[language]}</h2>
      {course.description[language] ? (
        <div className="course-content">
          <p className="text-lg mb-4">{course.description[language]}</p>
          <h3 className="text-xl font-semibold mb-4">
            {language === 'fr' ? 'Leçons' : 'الدروس'}
          </h3>
          <ul className="course-lessons">
            {course.lessons.map((lesson, index) => (
              <li key={index} className="course-lesson">
                <span>{lesson.title[language]}</span>
                <span className="lesson-duration">{lesson.duration}</span>
              </li>
            ))}
          </ul>
          <NavLink to="/courses" className="btn-primary mt-4">
            {language === 'fr' ? 'Retour aux cours' : 'العودة إلى الدورات'}
          </NavLink>
        </div>
      ) : (
        <p className="text-center text-gray-500">
          {language === 'fr' ? 'Désolé, ce cours n’est pas disponible.' : 'عذرًا، هذه الدورة غير متاحة.'}
        </p>
      )}
    </div>
  );
};

export default CoursePlayer;