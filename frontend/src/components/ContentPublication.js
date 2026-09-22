import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import SemesterSelect, { validContentSemester } from './SemesterSelect';
import ContentSemesterEditor from './ContentSemesterEditor';

const ContentPublication = ({ collectionName, item, language, onUpdated }) => {
  const ar = language === 'ar';
  const [semester, setSemester] = useState(validContentSemester(item.semester) ? String(item.semester) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const shared = item.visibility === 'shared';
  const update = async () => {
    if (!shared && !validContentSemester(semester)) return;
    setBusy(true); setError('');
    try {
      await updateDoc(doc(db, collectionName, item.id), shared ? { visibility: 'private' } : { visibility: 'shared', semester });
      await onUpdated();
    } catch {
      setError(ar ? 'تعذر تحديث النشر.' : 'Impossible de modifier la publication.');
    } finally { setBusy(false); }
  };
  return <div className="mt-3 space-y-2 border-t pt-3">
    {shared && <ContentSemesterEditor collectionName={collectionName} item={item} language={language} onUpdated={onUpdated} />}
    {!shared && <SemesterSelect id={`publish-${collectionName}-${item.id}`} value={semester} onChange={event => setSemester(event.target.value)} allowAll language={language} disabled={busy} />}
    <button type="button" onClick={update} disabled={busy || (!shared && !validContentSemester(semester))} className="text-sm font-semibold text-blue-700 disabled:opacity-50">
      {shared ? (ar ? 'جعله شخصياً' : 'Rendre personnel') : (ar ? 'نشر في المكتبة' : 'Publier dans la bibliothèque')}
    </button>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
};

export default ContentPublication;
