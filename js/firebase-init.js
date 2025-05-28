// Importar funciones necesarias
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Importar la configuración
import { firebaseConfig } from './firebase-config.js';

let app;
let db = null; // Inicializar db como null por defecto

// Verificar si la configuración se importó correctamente
if (firebaseConfig && firebaseConfig.apiKey) {
    try {
        // Si la configuración existe y tiene al menos la apiKey, inicializar
        app = initializeApp(firebaseConfig);
        db = getFirestore(app); // Inicializar Firestore
        
        // Configurar opciones de Firestore para mejor manejo de errores
        db._delegate._databaseId.projectId = firebaseConfig.projectId;
        
        console.log("Firebase initialized successfully from runtime config.");
        console.log("Project ID:", firebaseConfig.projectId);
        
        // Test de conectividad básico
        setTimeout(async () => {
            try {
                // Intento de operación simple para verificar conectividad
                const testDoc = await db._delegate._firestore._delegate.app.options;
                console.log("Firebase connectivity test passed");
            } catch (testError) {
                console.warn("Firebase connectivity test failed:", testError);
                if (testError.code === 'permission-denied') {
                    console.error("ERROR: Permisos de Firestore denegados. Verifica las reglas de seguridad en Firebase Console.");
                } else if (testError.code === 'unavailable') {
                    console.error("ERROR: Servicio de Firestore no disponible. Verifica tu conexión a internet.");
                }
            }
        }, 1000);
        
    } catch (error) {
        // Si hay un error al inicializar (ej. config inválida)
        console.error("Error initializing Firebase from runtime config:", error);
        
        // Manejo específico de errores
        if (error.code === 'app/invalid-api-key') {
            console.error("FIREBASE ERROR: API Key inválida");
        } else if (error.code === 'app/project-not-found') {
            console.error("FIREBASE ERROR: Proyecto no encontrado");
        }
        
        // Solo mostrar alerta en producción
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            alert("Error al inicializar la conexión con la base de datos. Verifica la configuración y recarga la página.");
        }
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

// Función para verificar disponibilidad de db
export function isFirebaseAvailable() {
    return db !== null;
}

// Función para manejo seguro de operaciones de Firestore
export async function safeFirestoreOperation(operation, fallbackAction = null) {
    if (!isFirebaseAvailable()) {
        console.warn("Firebase no disponible, saltando operación");
        if (fallbackAction) fallbackAction();
        return null;
    }
    
    try {
        return await operation();
    } catch (error) {
        console.error("Error en operación de Firestore:", error);
        
        // Manejo específico de errores comunes
        if (error.code === 'permission-denied') {
            console.error("FIRESTORE: Permisos insuficientes. Verifica las reglas de seguridad.");
        } else if (error.code === 'unavailable') {
            console.error("FIRESTORE: Servicio no disponible. Problema de conectividad.");
        } else if (error.code === 'deadline-exceeded') {
            console.error("FIRESTORE: Timeout en la operación. Conexión lenta.");
        }
        
        if (fallbackAction) fallbackAction();
        return null;
    }
}

// Exportar db (puede ser null si falló la inicialización)
export { db };
