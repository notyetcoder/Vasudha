
import admin from 'firebase-admin';

let db: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;

// This logic runs once when the server starts.
if (!admin.apps.length) {
  console.log("--- Firebase Admin Initialization ---");
  try {
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID is not set in the environment variables.');
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('FIREBASE_CLIENT_EMAIL is not set in the environment variables.');
    }
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('FIREBASE_PRIVATE_KEY is not set in the environment variables.');
    }
    
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    console.log("Initializing Firebase Admin SDK...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");

    db = admin.firestore();
    auth = admin.auth();
    console.log("Firestore and Auth instances obtained successfully.");

  } catch (error: any) {
    console.error("!!! FIREBASE ADMIN INITIALIZATION FAILED !!!");
    console.error("This is a critical error. The server will not be able to connect to Firebase services.");
    console.error("Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are correctly set in your .env file or hosting environment.", error.message);
    db = undefined;
    auth = undefined;
  }
} else {
    console.log("Firebase Admin SDK already initialized.");
    db = admin.firestore();
    auth = admin.auth();
}


export { db, auth };
