/**
 * Inicialización y configuración de Firebase para Crack Total
 * Compatible con rankings y juegos
 */

console.log('[FIREBASE INIT] Iniciando configuración...');

// Verificar que Firebase esté disponible
if (typeof firebase === 'undefined') {
    console.error('[FIREBASE INIT] Firebase no está disponible. Asegúrate de cargar los scripts de Firebase primero.');
} else {
    console.log('[FIREBASE INIT] Firebase detectado:', firebase);
}

// Función para inicializar Firebase de forma segura
function initializeFirebaseSafely() {
    try {
        // Verificar si ya está inicializado
        if (firebase.apps && firebase.apps.length > 0) {
            console.log('[FIREBASE INIT] Firebase ya está inicializado');
            window.firebaseApp = firebase.apps[0];
            setupFirebaseServices();
            return;
        }

        // Usar la configuración desde firebase-config.js
        if (typeof window.firebaseConfig === 'undefined') {
            console.error('[FIREBASE INIT] No se encontró firebaseConfig. Asegúrate de cargar firebase-config.js primero.');
            return;
        }

        // Inicializar Firebase
        console.log('[FIREBASE INIT] Inicializando Firebase con configuración:', window.firebaseConfig);
        window.firebaseApp = firebase.initializeApp(window.firebaseConfig);
        
        setupFirebaseServices();
        
        console.log('[FIREBASE INIT] ✅ Firebase inicializado correctamente');
        
        // Disparar evento personalizado para notificar que Firebase está listo
        window.dispatchEvent(new CustomEvent('firebaseReady', {
            detail: { app: window.firebaseApp }
        }));
        
    } catch (error) {
        console.error('[FIREBASE INIT] Error al inicializar Firebase:', error);
        
        // Reintentar después de 2 segundos
        setTimeout(() => {
            console.log('[FIREBASE INIT] Reintentando inicialización...');
            initializeFirebaseSafely();
        }, 2000);
    }
}

// Configurar servicios de Firebase
function setupFirebaseServices() {
    try {
        // Configurar Firestore
        window.db = firebase.firestore();
        console.log('[FIREBASE INIT] ✅ Firestore configurado');
        
        // Configurar Auth
        window.auth = firebase.auth();
        console.log('[FIREBASE INIT] ✅ Auth configurado');
        
        // Habilitar autenticación anónima automáticamente
        enableAnonymousAuth();
        
        // Configuración adicional de Firestore
        window.db.enableNetwork().catch(error => {
            console.warn('[FIREBASE INIT] Error al habilitar red:', error);
        });
        
    } catch (error) {
        console.error('[FIREBASE INIT] Error al configurar servicios:', error);
    }
}

// Función para habilitar autenticación anónima
function enableAnonymousAuth() {
    if (!window.auth) {
        console.error('[FIREBASE INIT] Auth no está disponible');
        return;
    }

    // Verificar el estado de autenticación
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('[FIREBASE INIT] Usuario autenticado:', user.isAnonymous ? 'Anónimo' : user.displayName || user.email);
            window.currentUser = user;
        } else {
            console.log('[FIREBASE INIT] No hay usuario autenticado, iniciando sesión anónima...');
            // Autenticar de forma anónima
            window.auth.signInAnonymously()
                .then((userCredential) => {
                    console.log('[FIREBASE INIT] ✅ Autenticación anónima exitosa:', userCredential.user.uid);
                    window.currentUser = userCredential.user;
                })
                .catch((error) => {
                    console.error('[FIREBASE INIT] Error en autenticación anónima:', error);
                });
        }
    });
}

// Función utilitaria para verificar conectividad
function checkFirebaseConnection() {
    if (!window.db) {
        console.error('[FIREBASE INIT] Firestore no está disponible');
        return false;
    }

    return window.db.collection('_test').limit(1).get()
        .then(() => {
            console.log('[FIREBASE INIT] ✅ Conexión a Firestore verificada');
            return true;
        })
        .catch((error) => {
            console.error('[FIREBASE INIT] ❌ Error de conexión a Firestore:', error);
            return false;
        });
}

// Función utilitaria para esperar a que Firebase esté listo
window.waitForFirebase = function(callback, maxAttempts = 10) {
    let attempts = 0;
    
    function check() {
        attempts++;
        
        if (window.firebase && window.db && window.auth) {
            console.log('[FIREBASE INIT] Firebase está listo para usar');
            callback();
            return;
        }
        
        if (attempts >= maxAttempts) {
            console.error('[FIREBASE INIT] Timeout esperando Firebase después de', maxAttempts, 'intentos');
            return;
        }
        
        console.log(`[FIREBASE INIT] Esperando Firebase... intento ${attempts}/${maxAttempts}`);
        setTimeout(check, 500);
    }
    
    check();
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebaseSafely);
} else {
    // Si el DOM ya está listo, inicializar inmediatamente
    initializeFirebaseSafely();
}

// También inicializar cuando la ventana esté completamente cargada (por si acaso)
window.addEventListener('load', () => {
    if (!window.firebaseApp) {
        console.log('[FIREBASE INIT] Inicialización tardía en window.load');
        initializeFirebaseSafely();
    }
});

// Exportar funciones útiles al objeto global
window.FirebaseUtils = {
    checkConnection: checkFirebaseConnection,
    waitForReady: window.waitForFirebase
};

console.log('[FIREBASE INIT] Script cargado, esperando inicialización...');
