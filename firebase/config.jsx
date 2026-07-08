import { initializeApp, getApps, getApp } from "firebase/app";  // Import getApps and getApp
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtDRO6z-61fvUYZMZYTpr9ohOzf3Mmfsw",
  authDomain: "diabetic-retinopathyy.firebaseapp.com",
  projectId: "diabetic-retinopathyy",
  storageBucket: "diabetic-retinopathyy.appspot.com", // Fix the storage bucket URL
  messagingSenderId: "321863243919",
  appId: "1:321863243919:web:e527fbd123f031a5fef8fa",
  measurementId: "G-6VRF6QQ01M",
};

// Initialize Firebase (only if it hasn't been initialized yet)
let app, db, auth;

if (typeof window !== "undefined") {
  try {
    // Check if any Firebase apps are already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);  // Initialize Firebase app only if no apps exist
    } else {
      app = getApp();  // Get the already initialized app
    }

    // Initialize Firestore and Auth services
    db = getFirestore(app);
    auth = getAuth(app);

    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

export { app, db, auth };
