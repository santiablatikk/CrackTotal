/**
 * Controller para gestión de usuarios
 */
const { db } = require('../utils/firebase');

/**
 * Obtiene los datos del perfil de un usuario
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Se requiere el ID de usuario' });
    }
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Omitir campos sensibles
    const userData = userDoc.data();
    const safeUserData = {
      displayName: userData.displayName || '',
      photoURL: userData.photoURL || '',
      email: userData.email, // Lo incluimos porque ya está autenticado
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin,
      preferences: userData.preferences || {},
      // No incluir contraseñas, tokens, etc.
    };
    
    return res.status(200).json(safeUserData);
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Actualiza los datos del perfil de un usuario
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Validaciones
    if (!userId) {
      return res.status(400).json({ error: 'Se requiere el ID de usuario' });
    }
    
    // Solo permitir actualizar campos específicos (whitelist)
    const allowedFields = ['displayName', 'photoURL', 'preferences'];
    const sanitizedUpdates = {};
    
    // Filtrar solo los campos permitidos
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    });
    
    if (Object.keys(sanitizedUpdates).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos válidos para actualizar' });
    }
    
    // Añadir timestamp de actualización
    sanitizedUpdates.updatedAt = new Date().toISOString();
    
    await db.collection('users').doc(userId).update(sanitizedUpdates);
    
    return res.status(200).json({ 
      message: 'Perfil actualizado correctamente',
      updatedFields: Object.keys(sanitizedUpdates)
    });
  } catch (error) {
    console.error('Error al actualizar perfil de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Guarda las preferencias de usuario
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
exports.saveUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Se requiere el ID de usuario' });
    }
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Las preferencias deben ser un objeto válido' });
    }
    
    // Actualizar solo las preferencias
    await db.collection('users').doc(userId).update({
      preferences: preferences,
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      message: 'Preferencias actualizadas correctamente' 
    });
  } catch (error) {
    console.error('Error al guardar preferencias de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Registra estadísticas de juego para un usuario
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
exports.saveGameStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { gameId, score, timeSpent, completed, level } = req.body;
    
    if (!userId || !gameId) {
      return res.status(400).json({ 
        error: 'Se requiere el ID de usuario y ID del juego' 
      });
    }
    
    // Crear registro de estadísticas
    const timestamp = new Date().toISOString();
    const statsData = {
      gameId,
      timestamp,
      score: score || 0,
      timeSpent: timeSpent || 0,
      completed: completed || false,
      level: level || 1
    };
    
    // Guardar en la colección de estadísticas
    await db.collection('users').doc(userId)
      .collection('gameStats').add(statsData);
    
    // Actualizar estadísticas agregadas
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const totalGames = (userData.totalGames || 0) + 1;
      const totalScore = (userData.totalScore || 0) + (score || 0);
      
      await userRef.update({
        totalGames,
        totalScore,
        lastGamePlayed: {
          gameId,
          timestamp
        }
      });
    }
    
    return res.status(200).json({ 
      message: 'Estadísticas guardadas correctamente' 
    });
  } catch (error) {
    console.error('Error al guardar estadísticas de juego:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}; 