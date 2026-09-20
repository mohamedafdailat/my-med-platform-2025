import { updateProfile } from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const savePersonalProfile = async ({ fullName, phoneNumber, semester }) => {
  const account = auth.currentUser;
  if (!account) throw new Error('Authentification requise.');
  const fields = {
    fullName: fullName.trim(),
    displayName: fullName.trim(),
    phoneNumber: phoneNumber.trim(),
    semester: String(semester),
    updatedAt: serverTimestamp(),
  };
  if (fields.fullName.length < 2 || fields.fullName.length > 100 || fields.phoneNumber.length > 25 ||
      (fields.semester !== '' && !/^(?:[1-9]|1[0-2])$/.test(fields.semester))) {
    throw new Error('Informations de profil invalides.');
  }
  const ref = doc(db, 'users', account.uid);
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(ref);
    if (current.exists()) transaction.update(ref, fields);
    else transaction.set(ref, {
      ...fields, uid: account.uid, email: account.email,
      role: 'student', subscriptionStatus: 'unpaid',
      createdAt: serverTimestamp(), provider: 'password',
    });
  });
  await updateProfile(account, { displayName: fields.fullName });
};
