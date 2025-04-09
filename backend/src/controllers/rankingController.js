/**
 * Controller para endpoints de ranking
 */
const admin = require('firebase-admin');
const db = admin.firestore();
const rankingCollection = db.collection('rankings');

/**
 * Obtiene el ranking global
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
exports.getRanking = async (req, res) => {
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
};

/**
 * Añade una nueva entrada al ranking
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
exports.addRanking = async (req, res) => {
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
}; 