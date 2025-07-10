/**
 * Firebase Initialization
 * 
 * Este archivo inicializa Firebase para el proyecto CrackTotal
 * Se carga después de firebase-config.js
 */

// Esperar a que firebase-config esté disponible
function waitForFirebaseConfig() {
    return new Promise((resolve) => {
        if (window.firebaseConfig && window.firebaseApp) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.firebaseConfig && window.firebaseApp) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // Timeout después de 10 segundos
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('Firebase config no se cargó en tiempo esperado');
                resolve();
            }, 10000);
        }
    });
}

// Inicializar Firebase cuando esté listo
waitForFirebaseConfig().then(() => {
    console.log('🔥 Firebase inicializado correctamente');
    
    // Verificar servicios disponibles
    if (window.firebaseService) {
        console.log('✅ FirebaseService disponible');
    } else {
        console.warn('⚠️ FirebaseService no está disponible');
    }
    
    // Emitir evento para indicar que Firebase está listo
    window.dispatchEvent(new CustomEvent('firebaseReady'));
});

// Exportar función de verificación
window.checkFirebaseStatus = function() {
    return {
        config: !!window.firebaseConfig,
        app: !!window.firebaseApp,
        service: !!window.firebaseService,
        ready: !!(window.firebaseConfig && window.firebaseApp && window.firebaseService)
    };
}; 