
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// FIREBASE CONFIGURATION
// Project: Tray Holdings (tray-7ab9a)
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyATovSHzuqyS1Xvvv_84AWPaPyXMYdmXgc",
  authDomain: "tray-7ab9a.firebaseapp.com",
  projectId: "tray-7ab9a",
  storageBucket: "tray-7ab9a.firebasestorage.app",
  messagingSenderId: "556790084426",
  appId: "1:556790084426:web:c24f28372b034391dec7b3",
  measurementId: "G-WTLPHG2E8G"
};

// Initialize Firebase
// We wrap this in a try-catch to prevent the app from crashing if network issues occur
let app;
let auth;
let db;
let googleProvider;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
} catch (e) {
    console.error("Error initializing Firebase:", e);
}

export { auth, db, googleProvider };
