// Configuración de Firebase para Crack Total
// Este archivo redirige a la configuración apropiada

// Detectar entorno y usar configuración local o de producción
let firebaseConfig;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Entorno local: usar firebase-config-local.js
    const localConfig = await import('./firebase-config-local.js');
    firebaseConfig = localConfig.firebaseConfig;
    console.log("Usando configuración de Firebase LOCAL.");
} else {
    // Entorno de producción (u otro): usar firebase-config-prod.js
    const prodConfig = await import('./firebase-config-prod.js');
    firebaseConfig = prodConfig.firebaseConfig;
    console.log("Usando configuración de Firebase de PRODUCCIÓN.");
}

export { firebaseConfig }; 