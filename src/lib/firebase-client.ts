
// Important: This file is used for CLIENT-SIDE Firebase initialization.
// It should not contain any server-side secrets.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBODfA4mTZxkno2tryYzG055CmtR1NudME",
  authDomain: "vasudha-connect.firebaseapp.com",
  projectId: "vasudha-connect",
  storageBucket: "vasudha-connect.appspot.com",
  messagingSenderId: "373041037520",
  appId: "1:373041037520:web:6a857ade975afa37569ed5"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
