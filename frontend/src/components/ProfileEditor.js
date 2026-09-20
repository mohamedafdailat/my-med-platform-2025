import React, { useEffect, useState } from 'react';
import { savePersonalProfile } from '../services/profileService';

const ProfileEditor = ({ user, language }) => {
  const ar = language === 'ar';
  const [fields, setFields] = useState({ fullName: '', phoneNumber: '', semester: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    setFields({ fullName: user.fullName || user.displayName || '', phoneNumber: user.phoneNumber || '', semester: String(user.semester || '') });
  }, [user.uid, user.fullName, user.displayName, user.phoneNumber, user.semester]);
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await savePersonalProfile(fields);
      setMessage({ ok: true, text: ar ? 'تم حفظ الملف الشخصي.' : 'Votre profil a été enregistré.' });
    } catch {
      setMessage({ ok: false, text: ar ? 'تعذر الحفظ. تحقق من المعلومات والاتصال ثم أعد المحاولة.' : 'Enregistrement impossible. Vérifiez vos informations et votre connexion, puis réessayez.' });
    } finally { setSaving(false); }
  };
  const change = (event) => setFields((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const inputClass = 'mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
  return (
    <form onSubmit={save} className="space-y-4 border-b border-gray-200 pb-6 mb-6" aria-label={ar ? 'المعلومات الشخصية' : 'Informations personnelles'}>
      <p className="text-sm text-gray-600">{ar ? 'حدّث معلوماتك الدراسية وبيانات الاتصال.' : 'Mettez à jour vos informations et votre semestre d’études.'}</p>
      <label className="block text-sm font-semibold text-gray-700" htmlFor="profile-fullName">
        {ar ? 'الاسم الكامل' : 'Nom complet'}
        <input id="profile-fullName" name="fullName" autoComplete="name" value={fields.fullName} onChange={change} minLength={2} maxLength={100} required disabled={saving} className={inputClass} />
      </label>
      <label className="block text-sm font-semibold text-gray-700" htmlFor="profile-phoneNumber">
        {ar ? 'الهاتف (اختياري)' : 'Téléphone (facultatif)'}
        <input id="profile-phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" value={fields.phoneNumber} onChange={change} maxLength={25} disabled={saving} className={inputClass} />
      </label>
      <label className="block text-sm font-semibold text-gray-700" htmlFor="profile-semester">
        {ar ? 'الفصل الدراسي' : 'Semestre'}
        <select id="profile-semester" name="semester" value={fields.semester} onChange={change} disabled={saving} className={inputClass}>
          <option value="">{ar ? 'غير محدد' : 'Non renseigné'}</option>
          {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{ar ? 'الفصل' : 'Semestre'} {i + 1}</option>)}
        </select>
      </label>
      {message && <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'text-green-700' : 'text-red-700'}>{message.text}</p>}
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {saving ? (ar ? 'جاري الحفظ...' : 'Enregistrement…') : (ar ? 'حفظ الملف الشخصي' : 'Enregistrer mon profil')}
      </button>
    </form>
  );
};
export default ProfileEditor;
