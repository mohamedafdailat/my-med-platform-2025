import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Rules enforce the same boundaries; filtering only in React is insufficient.
export const getVisibleDocuments = async (name, user, { onlyOwn = false } = {}) => {
  if (!user?.uid) return [];
  const personalCollection = ['quizzes', 'flashcards'].includes(name);
  const institutionalCollection = ['courses', 'videos', 'qcms'].includes(name);
  if (!personalCollection && !institutionalCollection) throw new Error('Unsupported content collection');
  const ref = collection(db, name);
  const ownerField = name === 'quizzes' ? 'creatorId' : 'ownerId';
  if (!onlyOwn && user.customClaims?.role === 'admin') return (await getDocs(ref)).docs;
  const semesters = Array.from({ length: 12 }, (_, index) => String(index + 1));
  const semester = semesters.includes(String(user.semester)) ? String(user.semester) : null;
  const unlimited = user.customClaims?.unlimitedAccess === true;
  const allowedSemesters = [...(semester ? [semester] : []), 'all'];
  const queries = personalCollection ? [query(ref, where(ownerField, '==', user.uid), where('visibility', '==', 'private'))] : [];
  if (!onlyOwn) queries.push(query(ref, ...(personalCollection ? [where('visibility', '==', 'shared')] : []), ...(unlimited ? [] : [where('semester', 'in', allowedSemesters)])));
  const snapshots = await Promise.all(queries.map(q => getDocs(q)));
  return [...new Map(snapshots.flatMap(s => s.docs).map(d => [d.id, d])).values()];
};

export const getOwnQuizAttempts = async (uid) => {
  if (!uid) return [];
  const snapshot = await getDocs(query(collection(db, 'quiz_attempts'), where('userId', '==', uid)));
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
};
