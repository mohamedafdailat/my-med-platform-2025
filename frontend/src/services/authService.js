import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import api from './api';

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Simuler un appel API pour récupérer le rôle (à implémenter avec Firestore)
    const response = { ...user, role: 'student' }; // Rôle statique pour l'exemple
    localStorage.setItem('token', await user.getIdToken());
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const register = async ({ name, email, password, role }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });
    // Simuler un appel API pour enregistrer le rôle (à implémenter avec Firestore)
    const response = { ...user, role };
    localStorage.setItem('token', await user.getIdToken());
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('token');
  } catch (error) {
    throw new Error(error.message);
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateUser = async (userId, updates) => {
  try {
    // Simuler un appel API pour mettre à jour l'utilisateur
    const response = await api.put(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};