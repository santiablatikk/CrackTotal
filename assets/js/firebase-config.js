// ================================
// CONFIGURACIÓN FIREBASE - CRACKTOTAL
// ================================

// Configuración obtenida de Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAwdop1FPttbvLj_lfdMqpGgDCV5GaUWf4",
  authDomain: "cracktotal-cd2e7.firebaseapp.com",
  projectId: "cracktotal-cd2e7",
  storageBucket: "cracktotal-cd2e7.firebasestorage.app",
  messagingSenderId: "210391454350",
  appId: "1:210391454350:web:ec36c626aca23e80562fdf",
  measurementId: "G-5XP3T1RTH7"
};

// Inicializar Firebase
let firebaseApp;
let db;
let auth;

try {
  // Inicializar Firebase App
  firebaseApp = firebase.initializeApp(firebaseConfig);
  
  // Inicializar servicios
  db = firebase.firestore();
  auth = firebase.auth();
  
  console.log('✅ Firebase inicializado correctamente');
  
  // Exponer a window para uso global
  window.firebaseApp = firebaseApp;
  window.db = db;
  window.auth = auth;
  
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error);
}

// Configurar settings de Firestore
if (db) {
  db.settings({
    merge: true
  });
} 