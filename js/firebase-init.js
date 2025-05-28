// Importar funciones necesarias
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Importar la función para obtener la configuración
import { getFirebaseConfig } from './firebase-config.js';

let app;
let db = null; // Inicializar db como null por defecto

// IIFE asíncrona para inicializar Firebase
(async () => {
    try {
        const firebaseConfig = await getFirebaseConfig();

        // Verificar si la configuración se obtuvo correctamente
        if (firebaseConfig && firebaseConfig.apiKey) {
            // Si la configuración existe y tiene al menos la apiKey, inicializar
            app = initializeApp(firebaseConfig);
            db = getFirestore(app); // Inicializar Firestore
            
            // Configurar opciones de Firestore para mejor manejo de errores
            // Asegurarse de que db y sus propiedades existen antes de acceder
            if (db && db._delegate && db._delegate._databaseId) {
                db._delegate._databaseId.projectId = firebaseConfig.projectId;
            }
            
            console.log("Firebase initialized successfully from dynamically loaded config.");
            console.log("Project ID:", firebaseConfig.projectId);
            
            // Test de conectividad básico
            setTimeout(async () => {
                try {
                    // Intento de operación simple para verificar conectividad
                    // Asegurarse de que db y sus propiedades existen
                    if (db && db._delegate && db._delegate._firestore && db._delegate._firestore._delegate && db._delegate._firestore._delegate.app) {
                        const testDoc = await db._delegate._firestore._delegate.app.options;
                        console.log("Firebase connectivity test passed");
                    } else {
                        console.warn("Firebase db object not fully initialized for connectivity test.");
                    }
                } catch (testError) {
                    console.warn("Firebase connectivity test failed:", testError);
                    if (testError.code === 'permission-denied') {
                        console.error("ERROR: Permisos de Firestore denegados. Verifica las reglas de seguridad en Firebase Console.");
                    } else if (testError.code === 'unavailable') {
                        console.error("ERROR: Servicio de Firestore no disponible. Verifica tu conexión a internet.");
                    }
                }
            }, 1000);
            
        } else {
            // Si la configuración no se cargó o está incompleta
            console.error("Error: Firebase config is missing or invalid after dynamic load.");
            handleFirebaseLoadError();
        }
    } catch (error) {
        // Si hay un error al obtener la configuración o al inicializar
        console.error("Error initializing Firebase:", error);
        handleFirebaseLoadError(error);
    }
})();

function handleFirebaseLoadError(error = null) {
    // Solo mostrar alerta en producción o si no es un error específico de carga de config
    const errorMessage = error ? error.message : "Configuración no cargada.";
    console.error("Firebase Load Error Helper: ", errorMessage);

    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        alert("Error al inicializar la conexión con la base de datos. Verifica la configuración y recarga la página.");
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
