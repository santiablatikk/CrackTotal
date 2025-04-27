// Importar funciones necesarias
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Importar la configuración GENERADA durante el despliegue
// Este archivo será creado por el script 'build-config.js'
import { firebaseConfig } from './firebase-config-runtime.js';

let app;
let db = null; // Inicializar db como null por defecto

// Verificar si la configuración se importó correctamente
if (firebaseConfig && firebaseConfig.apiKey) {
    try {
        // Si la configuración existe y tiene al menos la apiKey, inicializar
        app = initializeApp(firebaseConfig);
        db = getFirestore(app); // Inicializar Firestore
        console.log("Firebase initialized successfully from runtime config.");
    } catch (error) {
        // Si hay un error al inicializar (ej. config inválida)
        console.error("Error initializing Firebase from runtime config:", error);
        alert("Error al inicializar la conexión con la base de datos. Verifica la configuración y recarga la página.");
    }
} else {
    // Si la configuración no se cargó o está incompleta
    console.error("Error: Firebase runtime config is missing or invalid.");
    // Mostrar alerta si no estamos en un entorno local (localhost o 127.0.0.1)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
         alert("Error crítico: La configuración de Firebase no se pudo cargar. Contacta al administrador.");
    } else {
        console.warn("Firebase config not loaded. Ensure 'firebase-config-runtime.js' exists or check build process.");
    }
}

// Exportar db (puede ser null si falló la inicialización)
export { db };
