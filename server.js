// server.js - Servidor Express optimizado para PASALA CHE
const express = require('express');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

/**
 * CONFIGURACIÓN GENERAL DEL SERVIDOR
 */
// Constantes y variables globales
const PORT = process.env.PORT || 3000;
const PUBLIC_PATH = path.join(__dirname, 'public');
const IMAGE_CACHE = new Map();
const STATIC_CACHE_TIME = process.env.STATIC_CACHE_TIME || '1d'; // Tiempo de caché para archivos estáticos

// --- Carga de credenciales Firebase optimizado ---
let serviceAccount;
try {
  const firebaseConfigEnv = process.env.FIREBASE_CONFIG;
  if (!firebaseConfigEnv) {
    // Para desarrollo local, intentar cargar el archivo JSON como fallback
    serviceAccount = require('./firebase-service-account.json');
    console.log("Credenciales de Firebase cargadas desde archivo local.");
  } else {
    serviceAccount = JSON.parse(firebaseConfigEnv);
    // Asegurar que las nuevas líneas en la clave privada estén correctas
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    console.log("Credenciales de Firebase cargadas correctamente desde variable de entorno.");
  }
} catch (error) {
  console.error('Error al cargar credenciales Firebase:', error);
  process.exit(1);
}

// Inicialización de Firebase
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const rankingCollection = db.collection('rankings');

/**
 * CONFIGURACIÓN DE EXPRESS
 */
const app = express();

// Middleware básico
app.use(express.json());

// Middleware de seguridad básica
app.use((req, res, next) => {
  // Establecer encabezados de seguridad básicos
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Añadir encabezados anti-caché para archivos HTML, JS y CSS
  const ext = path.extname(req.path).toLowerCase();
  if (ext === '.html' || ext === '.js' || ext === '.css' || req.path === '/') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // Agregar un parámetro de versión dinámico
    if (req.path.endsWith('.js') || req.path.endsWith('.css')) {
      const originalUrl = req.url;
      // Si aún no tiene un parámetro de versión, añadirlo
      if (!originalUrl.includes('v=')) {
        const separator = originalUrl.includes('?') ? '&' : '?';
        // Usar timestamp actual como versión
        const version = Date.now();
        req.url = `${originalUrl}${separator}v=${version}`;
      }
    }
  }
  
  next();
});

/**
 * FUNCIONES AUXILIARES
 */

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
 * API ENDPOINTS
 */

// GET /api/optimize-image - Optimización de imágenes bajo demanda
app.get('/api/optimize-image', async (req, res) => {
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
      const sharp = require('sharp');
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
});

// GET /api/ranking - Obtener el ranking global
app.get('/api/ranking', async (req, res) => {
  try {
    const snapshot = await rankingCollection
                           .orderBy('score', 'desc')
                           .limit(100)
                           .get();

    if (snapshot.empty) {
      return res.json([]);
    }

    const ranking = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(ranking);
  } catch (error) {
    console.error("Error al obtener ranking:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ranking - Añadir entrada al ranking
app.post('/api/ranking', async (req, res) => {
  try {
    const newEntry = req.body;
    
    // Validación de datos
    if (!newEntry || typeof newEntry.score !== 'number' || !newEntry.name) {
      return res.status(400).json({ error: "Datos de entrada inválidos" });
    }

    // Sanitizar datos
    newEntry.name = String(newEntry.name).substring(0, 30);
    
    // Asegurar que haya una fecha válida
    try {
      newEntry.date = newEntry.date 
        ? admin.firestore.Timestamp.fromDate(new Date(newEntry.date))
        : admin.firestore.FieldValue.serverTimestamp();
      
      // Agregar timestamp para facilitar comparaciones
      newEntry.timestamp = Date.now();
    } catch (dateError) {
      console.warn("Error con el formato de fecha, usando timestamp del servidor");
      newEntry.date = admin.firestore.FieldValue.serverTimestamp();
      newEntry.timestamp = Date.now();
    }
    
    const docRef = await rankingCollection.add(newEntry);
    res.status(201).json({ entryId: docRef.id });
  } catch (error) {
    console.error("Error al guardar ranking:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS Y RUTAS
 */

// Crear un archivo de versión para forzar recarga en clientes
const VERSION_FILE_PATH = path.join(PUBLIC_PATH, 'version.json');
fs.writeFileSync(
  VERSION_FILE_PATH,
  JSON.stringify({
    version: Date.now().toString(),
    buildTime: new Date().toISOString(),
    forceRefresh: true
  })
);
console.log('Archivo de versión creado para forzar actualización en clientes.');

// Middleware para garantizar conexiones seguras
app.enable('trust proxy');
app.use((req, res, next) => {
  res.setHeader('X-Force-Reload', 'true');
  // Encabezados anti-caché super agresivos
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Agregar la marca de tiempo a los recursos estáticos para evitar caché
  if (req.url.match(/\.(js|css|html)$/)) {
    req.url = req.url.replace(/\?.*|$/, match => {
      const timestamp = Date.now();
      return (match ? '&' : '?') + 'v=' + timestamp;
    });
  }
  
  next();
});

// Endpoint para verificar si hay actualizaciones disponibles
app.get('/api/check-updates', (req, res) => {
  // Leer el archivo de versión
  try {
    const versionData = JSON.parse(fs.readFileSync(VERSION_FILE_PATH));
    res.json(versionData);
  } catch (error) {
    res.json({
      version: Date.now().toString(),
      buildTime: new Date().toISOString(),
      forceRefresh: true
    });
  }
});

// Servir archivos estáticos con caché
app.use(express.static(PUBLIC_PATH, {
  maxAge: (req, res) => {
    const ext = path.extname(req.path).toLowerCase();
    // No almacenar en caché archivos HTML, JS o CSS
    if (ext === '.html' || ext === '.js' || ext === '.css') {
      return 0; // Sin caché
    }
    // Caché normal para imágenes y otros archivos
    return STATIC_CACHE_TIME;
  },
  setHeaders: (res, path, stat) => {
    const ext = path.toLowerCase();
    // Configurar headers para HTML, JS y CSS
    if (ext.endsWith('.html') || ext.endsWith('.js') || ext.endsWith('.css')) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
  }
}));

// Ruta catch-all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, 'portal.html'));
});

/**
 * INICIALIZACIÓN DEL SERVIDOR
 */
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log(`Sirviendo archivos estáticos desde: ${PUBLIC_PATH}`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
});
