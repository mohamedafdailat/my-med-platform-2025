// firebase/config.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableNetwork, 
  disableNetwork,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

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
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase app initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase');
}

// Initialize services with error handling
let auth, db, storage, analytics;

try {
  auth = getAuth(app);
  console.log('Firebase Auth initialized');
} catch (error) {
  console.error('Firebase Auth initialization error:', error);
  throw error;
}

try {
  db = getFirestore(app);
  console.log('Firestore initialized');
  
  // Enable offline persistence with multi-tab synchronization
  enableIndexedDbPersistence(db, {
    experimentalTabSynchronization: true,
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  }).catch((error) => {
    console.warn('Firestore persistence error:', error);
    if (error.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open or incompatible browser state. Using memory cache.');
    } else if (error.code === 'unimplemented') {
      console.warn('Persistence not available: Browser does not support IndexedDB. Using memory cache.');
    }
  });
  
} catch (error) {
  console.error('Firestore initialization error:', error);
  throw error;
}

try {
  storage = getStorage(app);
  console.log('Firebase Storage initialized');
} catch (error) {
  console.error('Firebase Storage initialization error:', error);
  throw error;
}

// Initialize Analytics only if supported
try {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    } else {
      console.log('Firebase Analytics not supported in this environment');
    }
  });
} catch (error) {
  console.warn('Firebase Analytics initialization error:', error);
}

// Connection management utilities
export const enableFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
    console.log('Firestore network enabled');
    return true;
  } catch (error) {
    console.error('Failed to enable Firestore network:', error);
    return false;
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
    console.log('Firestore network disabled');
    return true;
  } catch (error) {
    console.error('Failed to disable Firestore network:', error);
    return false;
  }
};

// Enhanced retry utility with connection management
export const retryFirestoreOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await enableFirestoreNetwork();
      const result = await operation();
      console.log(`Firestore operation succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Firestore operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      const isNetworkError = error.code === 'unavailable' || 
                           error.code === 'deadline-exceeded' || 
                           error.message.includes('WebChannel') ||
                           error.message.includes('400');
      
      if (attempt < maxRetries) {
        if (isNetworkError) {
          console.log('Network error detected, attempting to reset connection');
          try {
            await disableFirestoreNetwork();
            await new Promise(resolve => setTimeout(resolve, 500));
            await enableFirestoreNetwork();
          } catch (networkError) {
            console.warn('Network reset failed:', networkError);
          }
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`Firestore operation failed after ${maxRetries} attempts:`, lastError);
  throw lastError;
};

// Connection status monitoring
export const createConnectionMonitor = (onStatusChange) => {
  let isOnline = navigator.onLine;
  let firestoreConnected = true;
  
  const updateStatus = () => {
    const currentStatus = {
      browserOnline: navigator.onLine,
      firestoreConnected,
      overall: navigator.onLine && firestoreConnected
    };
    onStatusChange?.(currentStatus);
  };

  const handleOnline = async () => {
    console.log('Browser came online');
    isOnline = true;
    try {
      await enableFirestoreNetwork();
      firestoreConnected = true;
    } catch (error) {
      console.error('Failed to reconnect Firestore:', error);
      firestoreConnected = false;
    }
    updateStatus();
  };

  const handleOffline = async () => {
    console.log('Browser went offline');
    isOnline = false;
    try {
      await disableFirestoreNetwork();
    } catch (error) {
      console.warn('Failed to disable Firestore network:', error);
    }
    firestoreConnected = false;
    updateStatus();
  };

  const testConnection = async () => {
    if (!isOnline) return;
    
    try {
      await enableFirestoreNetwork();
      firestoreConnected = true;
    } catch (error) {
      console.warn('Firestore connection test failed:', error);
      firestoreConnected = false;
    }
    updateStatus();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  const connectionInterval = setInterval(testConnection, 30000);
  updateStatus();
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    clearInterval(connectionInterval);
  };
};

// Enhanced error handling for common Firestore errors
export const handleFirestoreError = (error, context = '') => {
  console.error(`Firestore error in ${context}:`, error);
  
  switch (error.code) {
    case 'permission-denied':
      return 'Vous n\'avez pas les permissions nécessaires pour cette action.';
    case 'not-found':
      return 'Les données demandées n\'ont pas été trouvées.';
    case 'unavailable':
      return 'Le service est temporairement indisponible. Veuillez réessayer.';
    case 'deadline-exceeded':
      return 'La requête a pris trop de temps. Vérifiez votre connexion.';
    case 'resource-exhausted':
      return 'Limite de quota atteinte. Veuillez réessayer plus tard.';
    case 'unauthenticated':
      return 'Vous devez être connecté pour effectuer cette action.';
    default:
      if (error.message?.includes('WebChannel') || error.message?.includes('400')) {
        return 'Problème de connexion détecté. Vérification en cours...';
      }
      return 'Une erreur inattendue s\'est produite.';
  }
};

// Development emulators (uncomment for local development)
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to emulators:', error);
  }
}

export { auth, db, storage, analytics };
export default app;