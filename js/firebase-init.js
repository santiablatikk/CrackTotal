// Importar funciones necesarias
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Define firebaseConfig - Intenta leer desde variables de entorno PRIMERO
// Estas claves (ej. VITE_API_KEY) deben coincidir con las que definas en Render
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID // Opcional
};

// Comprobar si alguna variable esencial falta (solo para despliegue)
// En local, podríamos tener un fallback, pero en Render deben existir
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

let app;
let db = null; // Inicializar db como null

if (missingKeys.length > 0 && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Si faltan claves y NO estamos en local, muestra error grave
    console.error("Error: Faltan variables de entorno de Firebase:", missingKeys.join(', '));
    alert(`Error de configuración: Faltan variables de Firebase (${missingKeys.join(', ')}). El sitio no puede inicializar la base de datos.`);
    // Aquí podrías deshabilitar funciones o mostrar un mensaje permanente
} else {
    // Si estamos en local o todas las claves están presentes, intenta inicializar
    try {
        // Si estamos en local y faltan variables, intenta cargar el archivo local
        // NOTA: Esto requiere que uses un bundler como Vite para que import.meta.env funcione bien.
        // Si usas archivos estáticos directos, esta parte local es más compleja.
        // Por ahora, nos centramos en que funcione en Render con Variables de Entorno.

        // Limpiar valores undefined antes de inicializar
        for (const key in firebaseConfig) {
            if (firebaseConfig[key] === undefined) {
                delete firebaseConfig[key]; // Eliminar claves sin valor
            }
        }

        if (Object.keys(firebaseConfig).length >= requiredKeys.length) {
             app = initializeApp(firebaseConfig);
             db = getFirestore(app); // Initialize Firestore
             console.log("Firebase initialized successfully using environment variables.");
        } else {
             // Fallback muy básico si faltan variables (más útil en local si tuvieras el import)
             console.warn("Firebase config incomplete from environment variables. Database might not work.");
             // Aquí podrías intentar importar desde './firebase-config-local.js' si tuvieras un entorno local configurado para ello
        }

    } catch (error) {
        console.error("Error initializing Firebase:", error);
        alert("Error al inicializar la conexión con la base de datos. Verifica las variables de entorno en Render y recarga la página.");
    }
}

// Exportar db (puede ser null si falló la inicialización)
export { db };
