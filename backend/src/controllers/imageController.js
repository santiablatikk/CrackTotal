/**
 * Controller para optimización de imágenes
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Cache para imágenes optimizadas
const IMAGE_CACHE = new Map();
const PUBLIC_PATH = path.join(__dirname, '../../../public');

/**
 * Asegura que un directorio exista, creándolo si es necesario
 * @param {string} directoryPath - Ruta del directorio a verificar/crear
 * @return {Promise<boolean>} - True si existe o se creó correctamente
 */
async function ensureDirectoryExists(directoryPath) {
  try {
    if (!fs.existsSync(directoryPath)) {
      await fs.promises.mkdir(directoryPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error(`Error al crear directorio ${directoryPath}:`, error);
    return false;
  }
}

/**
 * Optimiza una imagen bajo demanda
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
exports.optimizeImage = async (req, res) => {
  try {
    const { src, width, quality = 80 } = req.query;
    
    // Validación básica
    if (!src) {
      return res.status(400).json({ error: 'Se requiere el parámetro src' });
    }
    
    // Crear una clave única para esta configuración de imagen
    const cacheKey = `${src}-${width || 'auto'}-${quality}`;
    
    // Verificar si ya está en el cache
    if (IMAGE_CACHE.has(cacheKey)) {
      return res.sendFile(IMAGE_CACHE.get(cacheKey));
    }
    
    const imagePath = path.join(PUBLIC_PATH, src);
    
    // Verificar si la imagen original existe
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    
    // Preparar directorio para imágenes optimizadas
    const optimizedDir = path.join(PUBLIC_PATH, 'img', 'optimized');
    if (!(await ensureDirectoryExists(optimizedDir))) {
      return res.status(500).json({ error: 'Error al crear directorio para imágenes optimizadas' });
    }
    
    // Generar nombre de archivo optimizado
    const fileName = path.basename(imagePath);
    const fileExt = path.extname(fileName);
    const optimizedFileName = `${path.basename(fileName, fileExt)}-${width || 'auto'}-${quality}${fileExt}`;
    const optimizedPath = path.join(optimizedDir, optimizedFileName);
    
    // Si ya existe la imagen optimizada, devolverla
    if (fs.existsSync(optimizedPath)) {
      // Guardar en cache
      IMAGE_CACHE.set(cacheKey, optimizedPath);
      return res.sendFile(optimizedPath);
    }
    
    // Optimizar la imagen con sharp
    try {
      let pipeline = sharp(imagePath);
      
      if (width) {
        pipeline = pipeline.resize(parseInt(width));
      }
      
      // Detectar el formato de salida según la extensión
      const ext = fileExt.toLowerCase();
      if (ext === '.png') {
        pipeline = pipeline.png({ quality: parseInt(quality) });
      } else if (ext === '.webp') {
        pipeline = pipeline.webp({ quality: parseInt(quality) });
      } else if (ext === '.avif') {
        pipeline = pipeline.avif({ quality: parseInt(quality) });
      } else {
        pipeline = pipeline.jpeg({ quality: parseInt(quality) });
      }
      
      await pipeline.toFile(optimizedPath);
      
      // Guardar en cache y devolver
      IMAGE_CACHE.set(cacheKey, optimizedPath);
      return res.sendFile(optimizedPath);
    } catch (error) {
      console.error('Error al optimizar la imagen:', error);
      // Fallback a la imagen original si hay error
      return res.sendFile(imagePath);
    }
  } catch (error) {
    console.error('Error en el endpoint de optimización de imágenes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}; 