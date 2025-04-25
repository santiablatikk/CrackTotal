// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_3ZRD8ffWsRCSFgyZ3ach4hmrM19gYr4", // Replace with your actual API key if different
  authDomain: "cracktotal-cd2e7.firebaseapp.com",
  projectId: "cracktotal-cd2e7",
  storageBucket: "cracktotal-cd2e7.appspot.com",
  messagingSenderId: "210391454350",
  appId: "1:210391454350:web:ec36c626aca23e80562fdf",
  measurementId: "G-5XP3T1RTH7" // Replace if you use Analytics and it's different
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Uncomment if you need Analytics
// const auth = getAuth(app); // Uncomment if you need Authentication
const db = getFirestore(app); // Initialize Firestore

// Export the necessary Firebase services
export { db /*, auth */ }; // Add other exports like auth if needed 