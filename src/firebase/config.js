import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const metaEnv = (import.meta && import.meta.env) ? import.meta.env : {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyForPreviewEnvironmentSafe123",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "taskmaster-ai.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "taskmaster-ai-demo",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "taskmaster-ai.appspot.com",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
};

let app;
let auth;
let db;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization using fallback configuration:", error);
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
