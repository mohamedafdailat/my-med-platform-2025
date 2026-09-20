import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Rules enforce the same boundaries; filtering only in React is insufficient.
export const getVisibleDocuments = async (name, user, { onlyOwn = false } = {}) => {
  if (!user?.uid) return [];
  const ref = collection(db, name);
  const ownerField = name === 'quizzes' ? 'creatorId' : 'ownerId';
  if (!onlyOwn && user.customClaims?.role === 'admin') return (await getDocs(ref)).docs;
  const queries = [query(ref, where(ownerField, '==', user.uid))];
  if (!onlyOwn) queries.push(query(ref, where('visibility', '==', 'shared')));
  const snapshots = await Promise.all(queries.map(q => getDocs(q)));
  return [...new Map(snapshots.flatMap(s => s.docs).map(d => [d.id, d])).values()];
};

export const getOwnQuizAttempts = async (uid) => {
  if (!uid) return [];
  const snapshot = await getDocs(query(collection(db, 'quiz_attempts'), where('userId', '==', uid)));
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
};
