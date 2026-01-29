import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Safe environment variable access with fallback
const getEnvVar = (key: string): string => {
  try {
    // Try import.meta.env first (Vite)
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key] as string;
    }
    // Fallback to process.env (Node/CRA)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    console.warn(`Failed to access env var ${key}:`, e);
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
};

console.log("🔥 Firebase Config Loaded:", {
  hasApiKey: !!firebaseConfig.apiKey,
  apiKeyLength: firebaseConfig.apiKey?.length || 0,
  projectId: firebaseConfig.projectId
});

// Validate config before initializing
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.length < 10) {
  console.error('❌ Firebase API Key is invalid or missing!');
  console.error('Current config:', firebaseConfig);
  throw new Error('Firebase configuration is incomplete. Please check your .env file.');
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const ensureAnonymousUser = async () => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
};
