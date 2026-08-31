import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

const metaEnv = (import.meta && import.meta.env) ? import.meta.env : {};

const firebaseConfig = {
  apiKey: appletConfig.apiKey || metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyForPreviewEnvironmentSafe123",
  authDomain: appletConfig.authDomain || metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "taskmaster-ai.firebaseapp.com",
  projectId: appletConfig.projectId || metaEnv.VITE_FIREBASE_PROJECT_ID || "taskmaster-ai-demo",
  storageBucket: appletConfig.storageBucket || metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "taskmaster-ai.appspot.com",
  messagingSenderId: appletConfig.messagingSenderId || metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: appletConfig.appId || metaEnv.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
};

const databaseId = appletConfig.firestoreDatabaseId && appletConfig.firestoreDatabaseId !== '(default)'
  ? appletConfig.firestoreDatabaseId
  : undefined;

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
  db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization warning, falling back:", error);
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error("Critical Firebase setup error:", err);
  }
}

export { app, auth, db };

