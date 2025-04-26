// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Importar configuración de Firebase para producción
import { firebaseConfig } from './firebase-config-prod.js';

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
    alert("Error al inicializar la conexión con la base de datos. Por favor, verifica la configuración de Firebase y recarga la página.");
    // Podrías deshabilitar funcionalidad aquí o mostrar un estado de error permanente
    db = null; // Asegurarse de que db es null si falla
}

// const analytics = getAnalytics(app); // Uncomment if you need Analytics
// const auth = getAuth(app); // Uncomment if you need Authentication

// Export the necessary Firebase services
export { db /*, auth */ }; // Add other exports like auth if needed 