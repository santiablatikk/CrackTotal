// Configuración de Firebase para Crack Total - Modo desarrollo local
// Configuración simplificada para desarrollo sin autenticación

console.log('[FIREBASE CONFIG] Configurando Firebase para desarrollo local...');

// Configuración básica de Firebase (usar la configuración real de tu proyecto)
window.firebaseConfig = {
  apiKey: "AIzaSyAwdugL_lfSMpDgDCV50dMRf4lFc8NQyCM",
  authDomain: "cracktotal-cd2e7.firebaseapp.com", 
  projectId: "cracktotal-cd2e7",
  storageBucket: "cracktotal-cd2e7.appspot.com",
  messagingSenderId: "210391454358",
  appId: "1:210391454358:web:ac3b528aca23a88562fd1f",
  measurementId: "G-5XP3T1RTH7"
};

// Función para verificar si Firebase está disponible
window.isFirebaseAvailable = function() {
  return typeof window.firebase !== 'undefined' && 
         window.firebase.firestore && 
         window.firebase.auth;
};

// Función para inicializar Firebase de forma manual
window.initializeFirebaseManually = function() {
  if (!window.isFirebaseAvailable()) {
    console.error('[FIREBASE CONFIG] Firebase SDK no está cargado');
    return false;
  }

  try {
    // Verificar si ya está inicializado
    if (window.firebase.apps && window.firebase.apps.length > 0) {
      console.log('[FIREBASE CONFIG] Firebase ya está inicializado');
      return true;
    }

    // Inicializar Firebase
    window.firebase.initializeApp(window.firebaseConfig);
    console.log('[FIREBASE CONFIG] ✅ Firebase inicializado correctamente');
    return true;
  } catch (error) {
    console.error('[FIREBASE CONFIG] Error al inicializar Firebase:', error);
    return false;
  }
};

console.log('[FIREBASE CONFIG] ✅ Configuración cargada');

// Este archivo ahora inicializa Firebase automáticamente
// Proporciona la configuración a través de window.firebaseConfig
// Y hace disponible la instancia de Firebase a través de window.firebase

// Para acceder a Firestore: window.firebase.firestore()
// Para acceder a Auth: window.firebase.auth()

// Al usar window, evitamos problemas con los módulos ES6
// Cuando cargamos el script con una etiqueta <script> normal 