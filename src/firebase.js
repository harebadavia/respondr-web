// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Import the Firebase Auth module

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdqxTZ7_BdXcV1_7_MUgexTaxDDC4G-Rg",
  authDomain: "respondr-82d2c.firebaseapp.com",
  projectId: "respondr-82d2c",
  storageBucket: "respondr-82d2c.firebasestorage.app",
  messagingSenderId: "597168146233",
  appId: "1:597168146233:web:c4a71adc31b97499748ae8",
  measurementId: "G-L1W605DE2Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Initialize Firebase Authentication

// Export the auth object
export { auth };