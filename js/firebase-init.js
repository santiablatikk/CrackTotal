// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- Importar la configuración desde el archivo local --- 
// Asegúrate de haber creado 'firebase-config-local.js' siguiendo el .example
import { firebaseConfig } from './firebase-config-local.js';

// Your web app's Firebase configuration
// MOVED TO firebase-config-local.js
/*
const firebaseConfig = {
  apiKey: "AIzaSyA_3ZRD8ffWsRCSFgyZ3ach4hmrM19gYr4", // REMOVED - DO NOT COMMIT KEYS
  authDomain: "cracktotal-cd2e7.firebaseapp.com",
  projectId: "cracktotal-cd2e7",
  storageBucket: "cracktotal-cd2e7.appspot.com",
  messagingSenderId: "210391454350",
  appId: "1:210391454350:web:ec36c626aca23e80562fdf",
  measurementId: "G-5XP3T1RTH7" // REMOVED
};
*/

// Initialize Firebase
let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app); // Initialize Firestore
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase:", error);
    // Mostrar un mensaje al usuario podría ser útil aquí
    alert("Error al inicializar la conexión con la base de datos. Por favor, verifica la configuración local (firebase-config-local.js) y recarga la página.");
    // Podrías deshabilitar funcionalidad aquí o mostrar un estado de error permanente
    db = null; // Asegurarse de que db es null si falla
}

// const analytics = getAnalytics(app); // Uncomment if you need Analytics
// const auth = getAuth(app); // Uncomment if you need Authentication


// Export the necessary Firebase services
// Exportar db solo si la inicialización fue exitosa
export { db /*, auth */ }; // Add other exports like auth if needed 