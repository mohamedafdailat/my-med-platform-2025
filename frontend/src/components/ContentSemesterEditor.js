import React, { useId, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import SemesterSelect, { validContentSemester } from './SemesterSelect';

// Existing library items can be classified without recreating or deleting them.
export default function ContentSemesterEditor({ collectionName, item, language, onUpdated }) {
  const [semester, setSemester] = useState(validContentSemester(item.semester) ? String(item.semester) : '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const ar = language === 'ar';
  const selectId = useId();
  const save = async () => {
    setBusy(true); setMessage('');
    try {
      await updateDoc(doc(db, collectionName, item.id), { semester });
      await onUpdated?.();
      setMessage(ar ? 'تم الحفظ.' : 'Semestre enregistré.');
    } catch { setMessage(ar ? 'تعذر الحفظ.' : 'Impossible d’enregistrer le semestre.'); }
    finally { setBusy(false); }
  };
  return <div className="my-3 space-y-2">
    {!validContentSemester(item.semester) && <p className="text-xs text-amber-800">{ar ? 'لم يتم تحديد الفصل. مخفي عن الطلاب.' : 'Semestre à définir : masqué aux élèves.'}</p>}
    <SemesterSelect id={selectId} value={semester} onChange={event => setSemester(event.target.value)} language={language} allowAll disabled={busy} />
    <button type="button" onClick={save} disabled={busy || !validContentSemester(semester) || semester === item.semester} className="text-sm font-semibold text-blue-700 disabled:opacity-50">{ar ? 'حفظ الفصل' : 'Enregistrer le semestre'}</button>
    {message && <p role="status" className="text-xs">{message}</p>}
  </div>;
}
