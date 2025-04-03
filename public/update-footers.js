/**
 * Script para actualizar automáticamente todos los archivos HTML
 * y añadir el script global-footer.js antes del cierre del body
 */

const fs = require('fs');
const path = require('path');

// Función recursiva para encontrar todos los archivos HTML
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Función para añadir el script global-footer.js a un archivo HTML
function addGlobalFooterScript(filePath) {
  console.log(`Procesando: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Si el archivo ya tiene el script, no hacer nada
  if (content.includes('global-footer.js')) {
    console.log(`  - Ya incluye global-footer.js`);
    return;
  }
  
  // Determinar la ruta relativa correcta al script
  const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'js')).replace(/\\/g, '/');
  const scriptPath = relativePath ? `${relativePath}/global-footer.js` : 'js/global-footer.js';
  
  // Insertar el script antes del cierre del body
  let updatedContent;
  if (content.includes('</body>')) {
    updatedContent = content.replace('</body>', `<!-- Script para el footer global -->\n<script src="${scriptPath}"></script>\n</body>`);
  } else {
    console.log(`  - No se encontró la etiqueta </body>`);
    return;
  }
  
  // Escribir el contenido actualizado
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`  - Script añadido correctamente`);
}

// Directorio principal donde buscar archivos HTML
const publicDir = __dirname;

// Encontrar todos los archivos HTML
const htmlFiles = findHtmlFiles(publicDir);
console.log(`Se encontraron ${htmlFiles.length} archivos HTML`);

// Actualizar cada archivo HTML
htmlFiles.forEach(addGlobalFooterScript);

console.log('Proceso completado.'); 