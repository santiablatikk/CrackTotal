// Configuración de Firebase para Crack Total
// Este archivo redirige a la configuración apropiada

// Importar la configuración de producción
export { firebaseConfig } from './firebase-config-prod.js';

// Opcional: Detectar entorno y usar configuración local si es necesario
// if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
//     export { firebaseConfig } from './firebase-config-runtime.js';
// } else {
//     export { firebaseConfig } from './firebase-config-prod.js';
// } 