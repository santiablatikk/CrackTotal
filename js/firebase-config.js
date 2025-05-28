// Configuración de Firebase para Crack Total
// Este archivo redirige a la configuración apropiada

// Función asíncrona para obtener la configuración de Firebase dinámicamente
async function getFirebaseConfig() {
    let firebaseConfig;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Entorno local: usar firebase-config-local.js
        const localConfigModule = await import('./firebase-config-local.js');
        firebaseConfig = localConfigModule.firebaseConfig;
        console.log("Usando configuración de Firebase LOCAL.");
    } else {
        // Entorno de producción (u otro): usar firebase-config-prod.js
        const prodConfigModule = await import('./firebase-config-prod.js');
        firebaseConfig = prodConfigModule.firebaseConfig;
        console.log("Usando configuración de Firebase de PRODUCCIÓN.");
    }
    return firebaseConfig;
}

export { getFirebaseConfig }; 