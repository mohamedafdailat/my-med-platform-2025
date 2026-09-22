import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { validSemester } from './SemesterSelect';

const SemesterNotice = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  if (!user || user.customClaims?.role === 'admin' || user.customClaims?.unlimitedAccess === true || validSemester(user.semester)) return null;
  return <p role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
    {language === 'ar' ? 'اختر فصلك الدراسي في ملفك الشخصي للوصول إلى محتواه. لا يمكن تغييره لاحقاً إلا بواسطة المسؤول. ' : 'Choisissez votre semestre dans votre profil pour accéder au contenu correspondant. Seul l’administrateur pourra ensuite le modifier. '}
    <Link to="/profile" className="font-semibold underline">{language === 'ar' ? 'إكمال ملفي الشخصي' : 'Compléter mon profil'}</Link>
  </p>;
};

export default SemesterNotice;
