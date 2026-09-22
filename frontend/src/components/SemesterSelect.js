import React from 'react';

export const validSemester = (value) => /^(?:[1-9]|1[0-2])$/.test(String(value || ''));
export const validContentSemester = (value) => value === 'all' || validSemester(value);

const SemesterSelect = ({ value, onChange, language = 'fr', allowAll = false, disabled = false, id = 'content-semester', required = true }) => (
  <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
    {language === 'ar' ? 'الفصل الدراسي' : 'Semestre'}
    <select id={id} name="semester" value={value || ''} onChange={onChange} disabled={disabled} required={required} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900 disabled:bg-gray-100">
      <option value="">{language === 'ar' ? 'اختر الفصل الدراسي' : 'Choisir un semestre'}</option>
      {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={String(index + 1)}>S{index + 1}</option>)}
      {allowAll && <option value="all">{language === 'ar' ? 'محتوى عام لجميع الفصول' : 'Contenu général — tous les semestres'}</option>}
    </select>
  </label>
);

export default SemesterSelect;
