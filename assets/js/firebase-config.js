// Configuración de Firebase para Crack Total
// Este archivo utiliza el objeto global window para compartir la configuración

// Configuración de Firebase obtenida de tu consola de Firebase
window.firebaseConfig = {
  apiKey: "AIzaSyAwdugL_lfSMpDgDCV50dMRf4lFc8NQyCM", // API Key completa
  authDomain: "cracktotal-cd2e7.firebaseapp.com", // Reemplazado
  projectId: "cracktotal-cd2e7", // Reemplazado
  storageBucket: "cracktotal-cd2e7.appspot.com", // Reemplazado
  messagingSenderId: "210391454358", // Reemplazado
  appId: "1:210391454358:web:ac3b528aca23a88562fd1f", // Reemplazado
  measurementId: "G-5XP3T1RTH7" // Reemplazado
};

/**
 * Inicializa Firebase automáticamente si está disponible
 */
if (window.firebase && !window.firebase.apps?.length) {
  console.log("Inicializando Firebase desde firebase-config.js");
  try {
    window.firebase.initializeApp(window.firebaseConfig);
  } catch (error) {
    console.error("Error al inicializar Firebase:", error);
  }
}

// Este archivo ahora inicializa Firebase automáticamente
// Proporciona la configuración a través de window.firebaseConfig
// Y hace disponible la instancia de Firebase a través de window.firebase

// Para acceder a Firestore: window.firebase.firestore()
// Para acceder a Auth: window.firebase.auth()

// Al usar window, evitamos problemas con los módulos ES6
// Cuando cargamos el script con una etiqueta <script> normal 