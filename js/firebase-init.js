// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let firebaseConfig;
let app;
let db;

try {
    // Intenta importar la configuración local (para desarrollo)
    const localConfigModule = await import('./firebase-config-local.js');
    firebaseConfig = localConfigModule.firebaseConfig;
    console.log("Using local Firebase config.");
} catch (e) {
    // Si falla la importación local (estamos en producción), usa variables de entorno
    console.log("Local config not found, attempting to use environment variables.");
    // --- ¡¡¡IMPORTANTE!!! ---
    // Esto asume que las variables de entorno están disponibles en `import.meta.env`.
    // Esto es común con Vite, pero puede NO funcionar en otros setups o directamente en Render sin un paso de build.
    // Verifica cómo Render expone las variables de entorno a tu frontend.
    // ¡¡¡Exponer API Key en el frontend es un RIESGO DE SEGURIDAD!!!
    // Considera alternativas como un backend o funciones serverless.
    firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Opcional
    };

    // Verifica que las variables de entorno se cargaron
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error("Firebase environment variables not found!");
        alert("Error crítico: No se pudo cargar la configuración de Firebase desde las variables de entorno.");
        firebaseConfig = null; // Previene inicialización con config incompleta
    }
}

// Initialize Firebase solo si tenemos una configuración válida
if (firebaseConfig) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app); // Initialize Firestore
        console.log("Firebase initialized successfully.");
        // const analytics = getAnalytics(app); // Uncomment if you need Analytics
        // const auth = getAuth(app); // Uncomment if you need Authentication
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        alert("Error al inicializar Firebase. Verifica la consola para más detalles.");
        db = null; // Asegurarse de que db es null si falla la inicialización
    }
} else {
    console.error("Firebase configuration is missing. Initialization skipped.");
    db = null;
}

// Export the necessary Firebase services (db might be null if initialization failed)
export { db /*, auth */ }; // Add other exports like auth if needed 