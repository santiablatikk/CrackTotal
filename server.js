// server.js
const express = require('express');
const path = require('path');
// const fs = require('fs').promises; // Ya no usaremos fs para el ranking

// --- Configuración Firebase Admin ---
const admin = require('firebase-admin');

// --- Cargar credenciales desde variable de entorno ---
let serviceAccount;
const firebaseConfigEnv = process.env.FIREBASE_CONFIG;

if (!firebaseConfigEnv) {
  console.error('¡Error Fatal! La variable de entorno FIREBASE_CONFIG no está definida.');
  console.error('Asegúrate de configurar esta variable en tu entorno de despliegue (Render).');
  // En un entorno local, podrías intentar cargar el archivo .json como fallback si existe,
  // pero en producción es mejor fallar si la variable no está.
  // Para desarrollo local podrías usar algo como:
  // try { serviceAccount = require('./firebase-service-account.json'); } catch (e) { /* no hacer nada si no existe */ }
  // if (!serviceAccount) process.exit(1); // Salir si no hay credenciales
  process.exit(1); // Salir si no hay credenciales en producción/despliegue
}

try {
  serviceAccount = JSON.parse(firebaseConfigEnv);
  // Render maneja bien las variables de entorno multilínea, pero por si acaso,
  // nos aseguramos que las nuevas líneas en la clave privada estén correctas.
  if (serviceAccount.private_key) {
     serviceAccount.private_key = serviceAccount.private_key.replace(/\n/g, '\n');
  }
  console.log("Credenciales de Firebase cargadas correctamente desde variable de entorno.");
} catch (error) {
  console.error('Error al parsear FIREBASE_CONFIG. Asegúrate que sea un JSON válido:', error);
  process.exit(1); // Salir si la configuración es inválida
}
// --- Fin Cargar credenciales ---


// Asegúrate de que el nombre del archivo coincida con el que descargaste - COMENTARIO OBSOLETO
// const serviceAccount = require('./firebase-service-account.json'); // YA NO SE USA ESTA LÍNEA

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount) // Usamos el objeto parseado
});

const db = admin.firestore(); // Instancia de Firestore
const rankingCollection = db.collection('rankings'); // Nombre de la colección en Firestore
// --- Fin Configuración Firebase Admin ---

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Define la carpeta que contiene los archivos estáticos
const publicDirectoryPath = path.join(__dirname, 'public');
// const rankingFilePath = path.join(__dirname, 'ranking_data.json'); // Ya no se usa

/* --- Funciones Auxiliares Firestore (reemplazan read/write Ranking) --- */

// Ya no necesitamos funciones específicas para leer/escribir el archivo JSON.
// Interactuaremos directamente con Firestore en las rutas API.

/* --- Fin Funciones Auxiliares --- */

// --- API Endpoints --- 

// GET /api/ranking - Obtener el ranking global desde Firestore
app.get('/api/ranking', async (req, res) => {
  try {
    const snapshot = await rankingCollection
                           .orderBy('score', 'desc') // Ordenar por score descendente
                           .limit(100) // Limitar a los 100 mejores
                           .get();

    if (snapshot.empty) {
      console.log('No se encontraron documentos en el ranking.');
      return res.json([]); // Devolver array vacío si no hay datos
    }

    const ranking = [];
    snapshot.forEach(doc => {
        // Añadimos el ID del documento por si acaso, y los datos
        ranking.push({ id: doc.id, ...doc.data() }); 
    });

    res.json(ranking);

  } catch (error) {
    console.error("Error al obtener ranking desde Firestore:", error);
    res.status(500).json({ message: "Error al obtener el ranking", error: error.message });
  }
});

// POST /api/ranking - Añadir una nueva entrada al ranking en Firestore
app.post('/api/ranking', async (req, res) => {
  try {
    const newEntry = req.body;
    console.log('Recibida nueva entrada para ranking Firestore:', newEntry);

    // Validación básica (mantener o mejorar)
    if (!newEntry || typeof newEntry.score !== 'number' || !newEntry.name || !newEntry.date) {
      return res.status(400).json({ message: "Datos de entrada inválidos" });
    }

    // Limpiar/Sanitizar datos 
    newEntry.name = String(newEntry.name).substring(0, 30); 
    // Asegurar que la fecha sea un Timestamp de Firestore para mejor ordenamiento/query
    try {
       // Intentar convertir la fecha ISO string (o Date) a Timestamp de Firestore
       newEntry.date = admin.firestore.Timestamp.fromDate(new Date(newEntry.date));
    } catch (dateError) {
       console.warn('Error al convertir fecha a Timestamp, usando servidor actual:', dateError);
       newEntry.date = admin.firestore.FieldValue.serverTimestamp(); // Usar fecha del servidor como fallback
    }
    
    // Añadir la nueva entrada a la colección. Firestore asignará un ID automático.
    const docRef = await rankingCollection.add(newEntry);

    console.log('Entrada añadida al ranking Firestore con ID:', docRef.id);
    res.status(201).json({ message: "Entrada añadida al ranking", entryId: docRef.id });

    // Opcional: Limpieza periódica de entradas antiguas o de baja puntuación 
    // (más complejo, se podría hacer con Cloud Functions o un script aparte)

  } catch (error) {
    console.error("Error al procesar POST /api/ranking Firestore:", error);
    res.status(500).json({ message: "Error al guardar en el ranking", error: error.message });
  }
});

// --- Servir Archivos Estáticos --- 
app.use(express.static(publicDirectoryPath));

// --- Ruta Catch-all --- 
app.get('*', (req, res) => {
  const mainHtmlFile = 'portal.html';
  res.sendFile(path.join(publicDirectoryPath, mainHtmlFile), (err) => {
    if (err) {
      console.error(`Error al enviar archivo catch-all (${mainHtmlFile}):`, err);
      if (!res.headersSent) {
           res.status(404).send('Recurso no encontrado.');
      }
    }
  });
});

app.listen(port, () => {
  // Ya no necesitamos inicializar el archivo JSON
  console.log(`Servidor iniciado en http://localhost:${port}`);
  console.log(`Sirviendo archivos estáticos desde: ${publicDirectoryPath}`);
  console.log('Conectado a Firestore para el ranking.');
});
