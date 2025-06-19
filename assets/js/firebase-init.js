/**
 * Inicialización simplificada de Firebase para Crack Total
 * Modo desarrollo - sin autenticación obligatoria
 */

console.log('[FIREBASE INIT] 🚀 Iniciando sistema simplificado...');

// Variables globales para Firebase
window.firebaseApp = null;
window.db = null;
window.auth = null;

// Estado de inicialización
let isInitialized = false;
let initializationPromise = null;

// Función principal de inicialización
async function initializeFirebase() {
    if (isInitialized) {
        console.log('[FIREBASE INIT] Ya está inicializado');
        return Promise.resolve(true);
    }

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = performInitialization();
    return initializationPromise;
}

async function performInitialization() {
    try {
        console.log('[FIREBASE INIT] Verificando Firebase SDK...');
        
        // Verificar que Firebase esté disponible
        if (!window.firebase) {
            throw new Error('Firebase SDK no está cargado');
        }

        // Verificar configuración
        if (!window.firebaseConfig) {
            throw new Error('Configuración de Firebase no encontrada');
        }

        console.log('[FIREBASE INIT] Inicializando app...');
        
        // Inicializar Firebase
        if (!window.firebase.apps || window.firebase.apps.length === 0) {
            window.firebaseApp = window.firebase.initializeApp(window.firebaseConfig);
        } else {
            window.firebaseApp = window.firebase.apps[0];
        }

        // Configurar Firestore
        window.db = window.firebase.firestore();
        console.log('[FIREBASE INIT] ✅ Firestore configurado');

        // Configurar Auth (opcional)
        try {
            window.auth = window.firebase.auth();
            console.log('[FIREBASE INIT] ✅ Auth configurado');
        } catch (authError) {
            console.warn('[FIREBASE INIT] ⚠️ Auth no disponible:', authError);
        }

        // Marcar como inicializado
        isInitialized = true;
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('firebaseReady', {
            detail: { success: true, db: window.db, auth: window.auth }
        }));

        console.log('[FIREBASE INIT] ✅ Inicialización completada');
        return true;

    } catch (error) {
        console.error('[FIREBASE INIT] ❌ Error en inicialización:', error);
        
        // En caso de error, usar datos mock
        setupMockData();
        return false;
    }
}

// Función para configurar datos mock en caso de error
function setupMockData() {
    console.log('[FIREBASE INIT] 🎭 Configurando datos de demostración...');
    
    // Simular base de datos con datos locales
    window.db = {
        collection: function(name) {
            return {
                onSnapshot: function(callback) {
                    console.log('[MOCK DB] Simulando datos para', name);
                    
                    if (name === 'users') {
                        // Datos mock de usuarios
                        const mockUsers = [
                            {
                                id: 'user1',
                                data: () => ({
                                    displayName: 'CrackDemo',
                                    stats: {
                                        pasalache: { played: 10, wins: 8, score: 2500 },
                                        crackrapido: { played: 15, wins: 12, score: 3200 },
                                        quiensabemas: { played: 8, wins: 6, score: 1800 },
                                        mentiroso: { played: 5, wins: 4, score: 1200 }
                                    }
                                })
                            },
                            {
                                id: 'user2',
                                data: () => ({
                                    displayName: 'FutbolFan',
                                    stats: {
                                        pasalache: { played: 12, wins: 9, score: 2800 },
                                        crackrapido: { played: 10, wins: 7, score: 2400 },
                                        quiensabemas: { played: 6, wins: 4, score: 1400 },
                                        mentiroso: { played: 8, wins: 5, score: 1600 }
                                    }
                                })
                            }
                        ];

                        setTimeout(() => {
                            callback({
                                empty: false,
                                size: mockUsers.length,
                                forEach: function(fn) {
                                    mockUsers.forEach(fn);
                                }
                            });
                        }, 1000);
                    } else if (name === 'matches') {
                        // Datos mock de partidas
                        const mockMatches = [
                            {
                                id: 'match1',
                                data: () => ({
                                    gameType: 'pasalache',
                                    playerName: 'CrackDemo',
                                    score: 520,
                                    result: 'victory',
                                    timestamp: { toDate: () => new Date(Date.now() - 3600000) }
                                })
                            }
                        ];

                        setTimeout(() => {
                            callback({
                                empty: false,
                                size: mockMatches.length,
                                forEach: function(fn) {
                                    mockMatches.forEach(fn);
                                }
                            });
                        }, 1000);
                    }
                    
                    return () => {}; // Unsubscribe function
                },
                orderBy: function() { return this; },
                limit: function() { return this; }
            };
        }
    };

    // Marcar como inicializado con mock
    isInitialized = true;

    // Disparar evento con datos mock
    window.dispatchEvent(new CustomEvent('firebaseReady', {
        detail: { success: false, mock: true, db: window.db }
    }));
}

// Función para esperar a que Firebase esté listo
window.waitForFirebase = function(callback, timeout = 10000) {
    if (isInitialized && window.db) {
        callback();
        return;
    }

    const startTime = Date.now();
    
    function check() {
        if (isInitialized && window.db) {
            callback();
            return;
        }
        
        if (Date.now() - startTime > timeout) {
            console.error('[FIREBASE INIT] Timeout esperando Firebase');
            setupMockData();
            callback();
            return;
        }
        
        setTimeout(check, 500);
    }
    
    check();
};

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    setTimeout(initializeFirebase, 100);
}

// También inicializar en load por si acaso
window.addEventListener('load', () => {
    if (!isInitialized) {
        initializeFirebase();
    }
});

console.log('[FIREBASE INIT] 📜 Sistema de inicialización cargado');
