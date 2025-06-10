/**
 * validate-deploy.js
 * Este script valida que todos los archivos necesarios estén presentes y correctamente formateados
 * antes de realizar el despliegue de la aplicación.
 */

const fs = require('fs');
const path = require('path');

console.log('Iniciando validación de archivos para despliegue...');

// Archivos críticos que deben existir
const requiredFiles = [
  'server.js',
  'package.json',
  'index.html',
  'games.html',
  'assets/css/base.css'
];

// Validar existencia de archivos críticos
const missingFiles = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    missingFiles.push(file);
  }
}

// Verificar si hay archivos faltantes
if (missingFiles.length > 0) {
  console.error('Error: Faltan archivos críticos para el despliegue:');
  missingFiles.forEach(file => console.error(`  - ${file}`));
  process.exit(1);
}

// Verificar el archivo package.json
try {
  const packageJson = require('./package.json');
  
  // Verificar campos críticos en package.json
  if (!packageJson.name || !packageJson.version || !packageJson.main) {
    console.error('Error: El archivo package.json no contiene campos obligatorios (name, version, main)');
    process.exit(1);
  }

  // Verificar que el script de inicio esté definido
  if (!packageJson.scripts || !packageJson.scripts.start) {
    console.error('Error: El archivo package.json no contiene el script "start"');
    process.exit(1);
  }
} catch (error) {
  console.error('Error al leer el archivo package.json:', error.message);
  process.exit(1);
}

// Verificar que existe la ruta de CSS
let cssExists = false;
try {
  cssExists = fs.existsSync(path.join(__dirname, 'assets/css'));
  if (!cssExists) {
    console.error('Error: Directorio assets/css/ no encontrado');
    process.exit(1);
  }
} catch (error) {
  console.error('Error al verificar el directorio assets/css/:', error.message);
  process.exit(1);
}

// Si llegamos aquí, la validación fue exitosa
console.log('Validación completada exitosamente. El proyecto está listo para ser desplegado.');
process.exit(0); 