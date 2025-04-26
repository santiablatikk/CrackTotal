// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Importar la configuración directamente (asegúrate que el archivo existe y está correcto)
// Para producción, podrías tener un firebase-config-prod.js y ajustar la importación
// ¡ASEGÚRATE DE RESTRINGIR LA API KEY EN LA CONSOLA DE FIREBASE/GOOGLE CLOUD!
import { firebaseConfig } from './firebase-config-prod.js'; // <-- Cambia a tu archivo de config de producción

// Initialize Firebase
let app;
let db;

try {
    if (!firebaseConfig || !firebaseConfig.apiKey) {
        throw new Error("Configuración de Firebase no encontrada o inválida.");
    }
    app = initializeApp(firebaseConfig);
    db = getFirestore(app); // Initialize Firestore
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase:", error);
    alert("Error crítico al inicializar la conexión con la base de datos. Funcionalidad limitada.");
    db = null; // Asegurarse de que db es null si falla
}

// Export the necessary Firebase services
export { db /*, auth */ }; // Add other exports like auth if needed 