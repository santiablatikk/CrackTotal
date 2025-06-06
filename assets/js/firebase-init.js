// Importar funciones necesarias
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Importar la función para obtener la configuración
import { getFirebaseConfig } from './firebase-config.js';

let app;
let dbInstance = null; // Renombrado para evitar conflicto con la variable 'db' exportada
let authInstance = null; // Renombrado para evitar conflicto con la variable 'auth' exportada
let firebaseUser = null; // Para almacenar el usuario autenticado

// Bandera para asegurar que la inicialización y autenticación solo ocurran una vez
let isFirebaseInitializing = false;
let firebaseInitializationPromise = null;

async function initializeFirebase() {
  if (isFirebaseInitializing) {
    return firebaseInitializationPromise;
  }
  isFirebaseInitializing = true;

  firebaseInitializationPromise = (async () => {
    try {
      const firebaseConfig = await getFirebaseConfig();

      if (!firebaseConfig || !firebaseConfig.apiKey) {
        console.error("❌ Configuración de Firebase inválida o no cargada desde firebase-config.js");
        throw new Error("Configuración de Firebase inválida");
      }

      console.log("🔥 Inicializando Firebase con la configuración obtenida...");
      
      // Inicializar Firebase SOLO SI no ha sido inicializada antes
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApp(); // Obtener la instancia existente si ya fue inicializada
      }
      
      dbInstance = getFirestore(app);
      authInstance = getAuth(app);
      
      console.log("✅ Firebase App inicializada correctamente.");
      console.log("📋 Project ID:", app.options.projectId);

      // Devolver una promesa que se resuelva cuando la autenticación esté lista
      return new Promise((resolve, reject) => {
        onAuthStateChanged(authInstance, (user) => {
          if (user) {
            firebaseUser = user;
            console.log("👤 Usuario autenticado:", user.isAnonymous ? "Anónimo" : user.uid);
            resolve({ app, db: dbInstance, auth: authInstance, user: firebaseUser });
          } else {
            console.log("🔑 No hay usuario. Intentando autenticación anónima...");
            signInAnonymously(authInstance)
              .then((anonUserCredential) => {
                firebaseUser = anonUserCredential.user;
                console.log("👤 Usuario anónimo autenticado:", firebaseUser.uid);
                resolve({ app, db: dbInstance, auth: authInstance, user: firebaseUser });
              })
              .catch((error) => {
                console.error("❌ Error en autenticación anónima:", error);
                
                // FALLBACK: Aunque falle la autenticación anónima, permitir 
                // que la app funcione en modo solo lectura
                console.warn("⚠️ Funcionando en modo solo lectura debido a error de autenticación");
                
                // Crear un objeto usuario simulado para evitar errores en otras partes del código
                firebaseUser = {
                  uid: 'guest_' + Date.now(),
                  isAnonymous: true,
                  displayName: 'Invitado',
                  readOnly: true
                };
                
                // Resolver con los datos disponibles
                resolve({ 
                  app, 
                  db: dbInstance, 
                  auth: authInstance, 
                  user: firebaseUser,
                  readOnly: true
                });
              });
          }
        }, (error) => {
            // Error en el observador de estado de autenticación
            console.error("❌ Error en onAuthStateChanged:", error);
            
            // FALLBACK para error en onAuthStateChanged
            console.warn("⚠️ Funcionando en modo solo lectura debido a error en observador de autenticación");
            firebaseUser = {
              uid: 'guest_' + Date.now(),
              isAnonymous: true,
              displayName: 'Invitado',
              readOnly: true
            };
            
            resolve({ 
              app, 
              db: dbInstance, 
              auth: authInstance, 
              user: firebaseUser,
              readOnly: true
            });
        });
      });

    } catch (error) {
      console.error("❌ Error CRÍTICO inicializando Firebase en firebase-init.js:", error);
      // Despachar un evento de error si es necesario para otras partes de la app
      window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
      
      // FALLBACK: Proporcionar objetos mock para funcionamiento mínimo
      console.warn("⚠️ Inicializando Firebase en modo de emergencia (datos de demostración)");
      
      // Crear una instancia de Firestore mock 
      const mockDb = createMockFirestore();
      const mockAuth = { currentUser: { uid: 'mock_user', isAnonymous: true } };
      
      return { 
        app: null, 
        db: mockDb, 
        auth: mockAuth, 
        user: { uid: 'mock_user', isAnonymous: true, displayName: 'Usuario Demo' },
        isMock: true
      };
    }
  })();
  return firebaseInitializationPromise;
}

// Función para crear un mock de Firestore con datos de demostración
function createMockFirestore() {
  // Implementación básica que proporciona una interfaz similar a Firestore
  // con datos de demostración para ranking y partidas
  return {
    // Método collection que devuelve un objeto con métodos comunes
    collection: (collectionName) => {
      return {
        // Implementación de los métodos que se usan en la app
        doc: (id) => ({ 
          get: () => Promise.resolve({ exists: false, data: () => null }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve()
        }),
        // Otros métodos que devuelven datos de demostración según la colección
        where: () => ({ 
          orderBy: () => ({
            limit: () => ({
              get: () => Promise.resolve({
                docs: getMockDocuments(collectionName)
              })
            })
          })
        }),
        orderBy: () => ({
          limit: () => ({
            get: () => Promise.resolve({
              docs: getMockDocuments(collectionName)
            })
          })
        })
      };
    }
  };
}

// Función que devuelve documentos de demostración según la colección
function getMockDocuments(collectionName) {
  const mockData = {
    users: [
      { id: 'mock1', displayName: 'Demo User 1', score: 1200, wins: 5, losses: 2 },
      { id: 'mock2', displayName: 'Demo User 2', score: 950, wins: 3, losses: 1 }
    ],
    rankings: [
      { id: 'rank1', userId: 'mock1', displayName: 'Demo User 1', score: 1200, gameType: 'pasalache' },
      { id: 'rank2', userId: 'mock2', displayName: 'Demo User 2', score: 950, gameType: 'pasalache' }
    ],
    matches: [
      { id: 'match1', userId: 'mock1', playerName: 'Demo User 1', score: 300, result: 'victory' },
      { id: 'match2', userId: 'mock2', playerName: 'Demo User 2', score: 250, result: 'defeat' }
    ]
  };
  
  return (mockData[collectionName] || []).map(doc => ({
    id: doc.id,
    data: () => doc
  }));
}

// Exportar una función que devuelve la promesa de inicialización
// Otros módulos pueden llamar a esta función y usar .then() para acceder a db y auth
export const ensureFirebaseInitialized = async () => {
  if (!authInstance || !dbInstance) { // Si no están seteadas, inicializar
    return initializeFirebase();
  }
  // Si ya están inicializadas, devolver las instancias directamente en una promesa resuelta
  return Promise.resolve({ app, db: dbInstance, auth: authInstance, user: firebaseUser }); 
};

// Para compatibilidad con scripts que puedan buscar db y auth directamente después de la carga del módulo
// Es mejor que los módulos usen `ensureFirebaseInitialized().then(({ db, auth }) => { ... })`
let db, auth;
ensureFirebaseInitialized().then(instances => {
  db = instances.db;
  auth = instances.auth;
  console.log("Firebase db y auth disponibles para exportación directa (después de promesa).");
  // Disparar evento global de que Firebase está listo, después de la autenticación
  window.dispatchEvent(new CustomEvent('firebaseReady', {
    detail: { db, auth, user: instances.user }
  }));
}).catch(error => {
  console.error("Error finalizando la inicialización de Firebase para exportación directa:", error);
  window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
});

export { db, auth };

// Funciones de utilidad que dependen de la inicialización
export function isFirebaseAvailable() {
    return dbInstance !== null && authInstance !== null && firebaseUser !== null;
}

export function isUserAuthenticated() {
    return firebaseUser !== null;
}

export function getCurrentUser() {
    return firebaseUser;
}

// Función para manejo seguro de operaciones de Firestore
export async function safeFirestoreOperation(operation, fallbackAction = null) {
    if (!isFirebaseAvailable()) {
        console.warn("🔥 Firebase no disponible, saltando operación");
        if (fallbackAction) fallbackAction();
        return null;
    }
    
    try {
        return await operation();
    } catch (error) {
        console.error("🚫 Error en operación de Firestore:", error.code, error.message);
        
        // Manejo específico de errores comunes
        if (error.code === 'permission-denied') {
            console.error("🚫 FIRESTORE: Permisos insuficientes. Posibles soluciones:");
            console.error("   1. Habilitar autenticación anónima en Firebase Console");
            console.error("   2. Ajustar reglas de seguridad de Firestore");
            console.error("   3. Verificar configuración del proyecto");
        } else if (error.code === 'unavailable') {
            console.error("🌐 FIRESTORE: Servicio no disponible. Verifica conectividad");
        } else if (error.code === 'deadline-exceeded') {
            console.error("⏱️ FIRESTORE: Timeout en la operación. Conexión lenta");
        } else if (error.code === 'failed-precondition') {
            console.error("⚙️ FIRESTORE: Reglas de seguridad muy restrictivas");
        }
        
        if (fallbackAction) fallbackAction();
        return null;
    }
}

// Exponer funciones útiles para debugging en el objeto window
if (typeof window !== 'undefined') {
    window.isFirebaseAvailable = isFirebaseAvailable;
    window.isUserAuthenticated = isUserAuthenticated;
    window.getCurrentUser = getCurrentUser;
    window.safeFirestoreOperation = safeFirestoreOperation;
}
