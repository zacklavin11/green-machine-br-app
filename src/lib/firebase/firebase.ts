import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Ensure environment variables are available
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check for missing config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.storageBucket) {
  console.warn("Firebase configuration is incomplete. Check your environment variables.");
}

// Initialize Firebase with explicit singleton pattern
let app;
if (getApps().length === 0) {
  console.log("Initializing Firebase app");
  app = initializeApp(firebaseConfig);
} else {
  console.log("Firebase app already initialized, reusing");
  app = getApp();
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Log config for debugging
if (typeof window !== 'undefined') {
  console.log("Firebase initialized with bucket:", firebaseConfig.storageBucket);
}

// Analytics can only be initialized on the client side
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Analytics failed to initialize:", error);
  }
}

export { app, auth, db, storage, analytics };
