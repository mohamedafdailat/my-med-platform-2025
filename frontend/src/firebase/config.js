import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const missingConfig = requiredConfigKeys.filter((key) => !firebaseConfig[key]);

if (missingConfig.length > 0) {
  throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect before persistence starts Firestore. Fail startup if explicitly
// requested emulators cannot be configured, rather than using cloud services.
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, `http://127.0.0.1:${process.env.REACT_APP_AUTH_EMULATOR_PORT || 9099}`, { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', Number(process.env.REACT_APP_FIRESTORE_EMULATOR_PORT || 8080));
  connectStorageEmulator(storage, '127.0.0.1', Number(process.env.REACT_APP_STORAGE_EMULATOR_PORT || 9199));
}

let analytics = null;

isSupported()
  .then((supported) => {
    if (supported && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    }
  })
  .catch((error) => {
    console.warn('Firebase Analytics initialization skipped:', error);
  });

enableIndexedDbPersistence(db, {
  experimentalTabSynchronization: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
}).catch((error) => {
  if (error.code === 'failed-precondition') {
    console.warn('Firestore persistence unavailable: multiple tabs are open.');
  } else if (error.code === 'unimplemented') {
    console.warn('Firestore persistence unavailable in this browser.');
  } else {
    console.warn('Firestore persistence error:', error);
  }
});

export const enableFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
    return true;
  } catch (error) {
    console.error('Failed to enable Firestore network:', error);
    return false;
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
    return true;
  } catch (error) {
    console.error('Failed to disable Firestore network:', error);
    return false;
  }
};

export const retryFirestoreOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await enableFirestoreNetwork();
      return await operation();
    } catch (error) {
      lastError = error;

      const isNetworkError =
        error.code === 'unavailable' ||
        error.code === 'deadline-exceeded' ||
        error.message?.includes('WebChannel') ||
        error.message?.includes('400');

      if (attempt < maxRetries) {
        if (isNetworkError) {
          try {
            await disableFirestoreNetwork();
            await new Promise((resolve) => setTimeout(resolve, 500));
            await enableFirestoreNetwork();
          } catch (networkError) {
            console.warn('Firestore network reset failed:', networkError);
          }
        }

        const delay = baseDelay * 2 ** (attempt - 1) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

export const createConnectionMonitor = (onStatusChange) => {
  let firestoreConnected = true;

  const updateStatus = () => {
    onStatusChange?.({
      browserOnline: navigator.onLine,
      firestoreConnected,
      overall: navigator.onLine && firestoreConnected,
    });
  };

  const handleOnline = async () => {
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
    try {
      await disableFirestoreNetwork();
    } catch (error) {
      console.warn('Failed to disable Firestore network:', error);
    }
    firestoreConnected = false;
    updateStatus();
  };

  const testConnection = async () => {
    if (!navigator.onLine) return;

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

export const handleFirestoreError = (error, context = '') => {
  console.error(`Firestore error in ${context}:`, error);

  switch (error.code) {
    case 'permission-denied':
      return "Vous n'avez pas les permissions necessaires pour cette action.";
    case 'not-found':
      return "Les donnees demandees n'ont pas ete trouvees.";
    case 'unavailable':
      return 'Le service est temporairement indisponible. Veuillez reessayer.';
    case 'deadline-exceeded':
      return 'La requete a pris trop de temps. Verifiez votre connexion.';
    case 'resource-exhausted':
      return 'Limite de quota atteinte. Veuillez reessayer plus tard.';
    case 'unauthenticated':
      return 'Vous devez etre connecte pour effectuer cette action.';
    default:
      if (error.message?.includes('WebChannel') || error.message?.includes('400')) {
        return 'Probleme de connexion detecte. Verification en cours...';
      }
      return "Une erreur inattendue s'est produite.";
  }
};

export { analytics };
export default app;
