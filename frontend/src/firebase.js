// C:\my-med-platform\frontend\src\firebase\config.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDY_l4HbA2tkmTjl8Q9D5oUrqC-NMDxzPw",
  authDomain: "medplatform-maroc.firebaseapp.com",
  projectId: "medplatform-maroc",
  storageBucket: "medplatform-maroc.firebasestorage.app",
  messagingSenderId: "1083925602007",
  appId: "1:1083925602007:web:a7bee366271cb4b108da92",
  measurementId: "G-LGGYKLZFV6"
};

// Initialize Firebase app only if it doesn't exist
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);