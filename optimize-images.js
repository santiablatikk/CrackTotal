/**
 * Script para optimizar todas las imágenes del proyecto
 * 
 * Uso:
 * node optimize-images.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

// Configuración
const config = {
  inputDir: path.join(__dirname, 'public'),
  outputDir: path.join(__dirname, 'public/img/optimized'),
  quality: 80,
  maxWidth: 1200,
  extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  excludeDirs: ['optimized', 'node_modules']
};

// Estadísticas
const stats = {
  processed: 0,
  optimized: 0,
  errors: 0,
  totalSaved: 0
};

// Función principal
async function optimizeImages() {
  console.log('🖼️ Comenzando optimización de imágenes...');
  
  // Asegurar que exista el directorio de salida
  try {
    await mkdir(config.outputDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error(`Error al crear directorio: ${err.message}`);
      process.exit(1);
    }
  }
  
  // Empezar a buscar y optimizar
  await processDirectory(config.inputDir);
  
  // Mostrar estadísticas
  console.log('\n📊 Estadísticas de optimización:');
  console.log(`✅ Imágenes procesadas: ${stats.processed}`);
  console.log(`🔍 Imágenes optimizadas: ${stats.optimized}`);
  console.log(`❌ Errores: ${stats.errors}`);
  console.log(`💾 Espacio ahorrado: ${formatBytes(stats.totalSaved)}`);
}

// Procesar un directorio recursivamente
async function processDirectory(directory) {
  // Leer contenido del directorio
  let items;
  try {
    items = await readdir(directory);
  } catch (err) {
    console.error(`Error al leer directorio ${directory}: ${err.message}`);
    return;
  }
  
  // Procesar cada elemento
  for (const item of items) {
    const fullPath = path.join(directory, item);
    let stats;
    
    try {
      stats = await stat(fullPath);
    } catch (err) {
      console.error(`Error al obtener información de ${fullPath}: ${err.message}`);
      continue;
    }
    
    // Si es un directorio, procesar recursivamente (excepto los excluidos)
    if (stats.isDirectory()) {
      const dirName = path.basename(fullPath);
      if (!config.excludeDirs.includes(dirName)) {
        await processDirectory(fullPath);
      }
      continue;
    }
    
    // Si es un archivo de imagen, optimizar
    const ext = path.extname(fullPath).toLowerCase();
    if (config.extensions.includes(ext)) {
      await optimizeImage(fullPath, stats.size);
    }
  }
}

// Optimizar una imagen individual
async function optimizeImage(imagePath, originalSize) {
  // Incrementar contador
  stats.processed++;
  
  // Calcular ruta de salida
  const relativePath = path.relative(config.inputDir, imagePath);
  const outputPath = path.join(config.outputDir, relativePath);
  
  // Crear directorio de salida si no existe
  const outputDir = path.dirname(outputPath);
  try {
    await mkdir(outputDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error(`Error al crear directorio de salida: ${err.message}`);
      stats.errors++;
      return;
    }
  }
  
  // Procesar la imagen
  try {
    console.log(`Procesando: ${relativePath}`);
    
    // Crear pipeline de sharp
    let pipeline = sharp(imagePath);
    const metadata = await pipeline.metadata();
    
    // Redimensionar si es mayor que el ancho máximo
    if (metadata.width > config.maxWidth) {
      pipeline = pipeline.resize(config.maxWidth);
    }
    
    // Optimizar según el formato
    const ext = path.extname(imagePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: config.quality });
    } else if (ext === '.png') {
      pipeline = pipeline.png({ quality: config.quality });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: config.quality });
    } else if (ext === '.gif') {
      pipeline = pipeline.gif();
    }
    
    // Guardar imagen optimizada
    await pipeline.toFile(outputPath);
    
    // Obtener tamaño del archivo optimizado
    const optimizedStats = await stat(outputPath);
    const saved = originalSize - optimizedStats.size;
    
    // Actualizar estadísticas
    if (saved > 0) {
      stats.optimized++;
      stats.totalSaved += saved;
      console.log(`  Optimizado: ${formatBytes(originalSize)} → ${formatBytes(optimizedStats.size)} (${formatBytes(saved)} ahorrados)`);
    } else {
      console.log(`  Sin cambios: ${formatBytes(originalSize)}`);
    }
  } catch (err) {
    console.error(`  Error al procesar ${imagePath}: ${err.message}`);
    stats.errors++;
  }
}

// Utilidad para formatear bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Ejecutar script
optimizeImages().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
}); 