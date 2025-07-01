// Asumimos que firebase ya está cargado globalmente a través de la carga de scripts

// Variables globales
window.firebaseApp = null;
window.firebaseDb = null;
window.firebaseAuth = null;
window.firebaseUser = null;

// Flag para controlar la inicialización
let isFirebaseInitializing = false;
let firebaseInitializationPromise = null;

// Función para inicializar Firebase
async function initializeFirebase() {
  if (isFirebaseInitializing) {
    return firebaseInitializationPromise;
  }
  
  isFirebaseInitializing = true;
  
  firebaseInitializationPromise = (async () => {
    try {
      console.log("🔥 Inicializando Firebase...");
      
      // Verificar si Firebase está disponible globalmente
      if (!window.firebase) {
        console.error("❌ Firebase no está disponible. Asegúrese de cargar los scripts de Firebase primero.");
        return {
          success: false,
          error: "Firebase no disponible"
        };
      }
      
      // Inicializar Firestore (usando API compat)
      if (!window.firebaseDb && window.firebase.firestore) {
        window.firebaseDb = window.firebase.firestore();
        console.log("📊 Firestore inicializado");
      }
      
      // Inicializar Auth (usando API compat)
      if (!window.firebaseAuth && window.firebase.auth) {
        window.firebaseAuth = window.firebase.auth();
        console.log("🔐 Auth inicializado");
        
        // Intentar autenticación anónima si no hay usuario
        if (!window.firebaseAuth.currentUser) {
          try {
            const userCredential = await window.firebaseAuth.signInAnonymously();
            window.firebaseUser = userCredential.user;
            console.log("👤 Usuario anónimo autenticado:", window.firebaseUser.uid);
          } catch (authError) {
            console.error("❌ Error en autenticación anónima:", authError);
            // Crear usuario simulado para evitar errores
            window.firebaseUser = {
              uid: 'guest_' + Date.now(),
              isAnonymous: true,
              displayName: 'Invitado',
              readOnly: true
            };
          }
        } else {
          window.firebaseUser = window.firebaseAuth.currentUser;
          console.log("👤 Usuario existente:", window.firebaseUser.uid);
        }
      }
      
      return {
        success: true,
        app: window.firebaseApp,
        db: window.firebaseDb,
        auth: window.firebaseAuth,
        user: window.firebaseUser
      };
      
    } catch (error) {
      console.error("❌ Error inicializando Firebase:", error);
      
      // Crear objetos mock para mantener la funcionalidad básica
      window.firebaseUser = {
        uid: 'mock_user_' + Date.now(),
        isAnonymous: true,
        displayName: 'Usuario Demo'
      };
      
      return {
        success: false,
        error: error,
        isMock: true,
        user: window.firebaseUser
      };
    }
  })();
  
  return firebaseInitializationPromise;
}

// Funciones útiles expuestas globalmente
window.ensureFirebaseInitialized = async function() {
  if (!window.firebaseDb || !window.firebaseAuth) {
    return initializeFirebase();
  }
  return Promise.resolve({
    success: true,
    app: window.firebaseApp,
    db: window.firebaseDb,
    auth: window.firebaseAuth,
    user: window.firebaseUser
  });
};

window.isFirebaseAvailable = function() {
  return window.firebase && window.firebaseDb && window.firebaseAuth;
};

window.isUserAuthenticated = function() {
  return window.firebaseUser !== null;
};

window.getCurrentUser = function() {
  return window.firebaseUser;
};

window.safeFirestoreOperation = async function(operation, fallbackAction = null) {
  if (!window.isFirebaseAvailable()) {
    console.warn("Firebase no disponible para esta operación");
    if (fallbackAction) {
      return fallbackAction();
    }
    return null;
  }

  try {
    return await operation();
  } catch (error) {
    console.error("Error en operación de Firestore:", error);
    if (fallbackAction) {
      return fallbackAction();
    }
    return null;
  }
};

// Inicializar Firebase al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔄 Inicializando Firebase automáticamente...");
  window.ensureFirebaseInitialized()
    .then(function(result) {
      console.log("✅ Firebase inicializado:", result.success ? "exitosamente" : "con errores");
      
      // Asegurar que db está disponible globalmente para ranking.js
      if (result.success && result.db) {
        window.db = result.db;
      } else if (window.firebase && window.firebase.firestore) {
        window.db = window.firebase.firestore();
      }
    })
    .catch(function(error) {
      console.error("❌ Error al inicializar Firebase:", error);
    });
});
