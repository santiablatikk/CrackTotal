const fs = require('fs'); // Módulo para manejar archivos (viene con Node.js)
const path = require('path'); // Módulo para manejar rutas (viene con Node.js)

console.log("Generating firebase-config-runtime.js...");

// Define la configuración leyendo las variables de entorno de Render
// Los nombres process.env.VITE_... deben coincidir con los que pusiste en Render
const config = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
  measurementId: process.env.VITE_MEASUREMENT_ID || undefined // Usa undefined si no existe
};

// Filtrar claves que no tengan valor (undefined)
const cleanConfig = Object.entries(config).reduce((acc, [key, value]) => {
    if (value !== undefined) {
        acc[key] = value;
    }
    return acc;
}, {});


// Crear el contenido del archivo JS que se usará en el navegador
// Usamos JSON.stringify para formatear el objeto correctamente
const configContent = `// Auto-generado por build-config.js en Render
export const firebaseConfig = ${JSON.stringify(cleanConfig, null, 2)};
`;

// Ruta donde se guardará el archivo generado (DENTRO de la carpeta 'js')
const outputPath = path.join(__dirname, 'js', 'firebase-config-runtime.js');

// Escribir el archivo
try {
  // Asegurarse de que el directorio js exista (aunque debería)
  const dirPath = path.dirname(outputPath);
  if (!fs.existsSync(dirPath)){
      fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(outputPath, configContent, 'utf8');
  console.log(`Firebase config written successfully to ${outputPath}`);
} catch (error) {
  console.error(`Error writing Firebase config file: ${error}`);
  process.exit(1); // Salir con código de error si falla
}
