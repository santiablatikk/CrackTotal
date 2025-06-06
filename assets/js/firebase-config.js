// Configuración de Firebase para Crack Total
// Este archivo redirige a la configuración apropiada

// Configuración de Firebase obtenida de tu consola de Firebase
const firebaseCredentials = {
  apiKey: "AIzaSyAwdugL_lfSMpDgDCV50dMRf4lFc8NQyCM", // API Key completa
  authDomain: "cracktotal-cd2e7.firebaseapp.com", // Reemplazado
  projectId: "cracktotal-cd2e7", // Reemplazado
  storageBucket: "cracktotal-cd2e7.appspot.com", // Reemplazado
  messagingSenderId: "210391454358", // Reemplazado
  appId: "1:210391454358:web:ac3b528aca23a88562fd1f", // Reemplazado
  measurementId: "G-5XP3T1RTH7" // Reemplazado
};

/**
 * Devuelve la configuración de Firebase.
 * @returns {Promise<object>} La configuración de Firebase.
 */
export async function getFirebaseConfig() {
  // Por ahora, usamos la misma configuración para local y producción.
  // Si necesitas configuraciones diferentes más adelante, podemos modificar esta lógica.
  console.log("Usando configuración de Firebase proporcionada.");
  return firebaseCredentials;
}

// ESTE ARCHIVO NO DEBE LLAMAR A initializeApp().
// La inicialización se hará en firebase-init.js.

// Exporta únicamente la función getFirebaseConfig
// ¡NO inicialices Firebase aquí!
// Esto evita duplicar la inicialización y conflictos en otros archivos.

// Si tienes otras variables o funciones que exportar, asegúrate de que la sintaxis sea:
// export const miVariable = ...;
// export function miFuncion() { ... }; 