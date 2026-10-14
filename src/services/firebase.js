import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  limit
} from 'firebase/firestore';

const STORAGE_KEY = 'chronicle_firebase_config';

/**
 * Returns current Firebase config from environment or localStorage.
 */
export function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved Firebase config from localStorage:', e);
  }

  // Default project credentials
  return {
    apiKey: "AIzaSyAYXp3uowuccflToStzw2HWCLx2jJjPm0o",
    authDomain: "chronicle-news-5c973.firebaseapp.com",
    projectId: "chronicle-news-5c973",
    storageBucket: "chronicle-news-5c973.firebasestorage.app",
    messagingSenderId: "488211596442",
    appId: "1:488211596442:web:da199edbf21129c80f8b23",
    measurementId: "G-H445SXXQYP"
  };
}

/**
 * Check if a valid Firebase configuration is active.
 */
export function isFirebaseConfigured() {
  const config = getFirebaseConfig();
  return Boolean(config && config.projectId && config.apiKey);
}

/**
 * Save Firebase configuration to localStorage.
 */
export function saveFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  return true;
}

/**
 * Clear Firebase configuration and reset to local IndexedDB.
 */
export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

let firebaseApp = null;
let firestoreDb = null;

/**
 * Get or initialize Firebase App instance safely.
 */
export function getFirebaseApp() {
  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    return firebaseApp;
  } catch (err) {
    console.error('Failed to initialize Firebase app:', err);
    return null;
  }
}

/**
 * Get or initialize Firestore database.
 */
export function getFirestoreDb() {
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    if (!firestoreDb) {
      firestoreDb = getFirestore(app);
    }
    return firestoreDb;
  } catch (err) {
    console.error('Failed to get Firestore instance:', err);
    return null;
  }
}

/**
 * Test connectivity with Firebase Firestore.
 */
export async function testFirebaseConnection(customConfig = null) {
  try {
    const config = customConfig || getFirebaseConfig();
    if (!config || !config.projectId || !config.apiKey) {
      return { success: false, message: 'Missing API Key or Project ID.' };
    }

    const testApp = !getApps().length 
      ? initializeApp(config) 
      : getApp();
    const testDb = getFirestore(testApp);

    // Attempt a light read from articles collection
    const q = query(collection(testDb, 'articles'), limit(1));
    await getDocs(q);

    return { 
      success: true, 
      message: `Connected successfully to Firestore project "${config.projectId}".` 
    };
  } catch (err) {
    console.error('Firebase connection test error:', err);
    return { 
      success: false, 
      message: err.message || 'Failed to connect to Firebase. Check API keys and Firestore security rules.' 
    };
  }
}
