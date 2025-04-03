const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Obtener o crear un usuario usando IP o username
async function getOrCreateUser(req, res) {
  try {
    const { ip, username } = req.body;
    
    if (!ip && !username) {
      return res.status(400).json({ error: 'Se requiere IP o nombre de usuario' });
    }
    
    // Buscar usuario existente por IP
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE ip = ? OR username = ?',
      [ip, username]
    );
    
    if (existingUsers.length > 0) {
      // Usuario encontrado, devolver datos
      return res.status(200).json(existingUsers[0]);
    }
    
    // Crear nuevo usuario
    const userId = uuidv4();
    const newUsername = username || `Jugador_${Math.floor(Math.random() * 10000)}`;
    
    await pool.query(
      'INSERT INTO users (id, username, ip) VALUES (?, ?, ?)',
      [userId, newUsername, ip]
    );
    
    // Obtener el usuario recién creado
    const [newUser] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    return res.status(201).json(newUser[0]);
  } catch (error) {
    console.error('Error en getOrCreateUser:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Obtener perfil de usuario con estadísticas
async function getUserProfile(req, res) {
  try {
    const { userId, gameType } = req.params;
    
    // Obtener usuario
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = users[0];
    
    // Obtener estadísticas del juego
    const [stats] = await pool.query(
      'SELECT * FROM user_stats WHERE user_id = ? AND game_type = ?',
      [userId, gameType]
    );
    
    // Obtener posición en el ranking
    const [rankingData] = await pool.query(
      'SELECT * FROM global_ranking WHERE user_id = ? AND game_type = ?',
      [userId, gameType]
    );
    
    // Combinar datos
    const profile = {
      user,
      stats: stats.length > 0 ? stats[0] : null,
      ranking: rankingData.length > 0 ? rankingData[0] : null,
      // Calcular nivel y XP basado en estadísticas (ejemplo simple)
      level: Math.floor((stats.length > 0 ? stats[0].games_played : 0) / 5) + 1,
      xp: stats.length > 0 ? stats[0].total_score : 0,
      xpForNextLevel: ((Math.floor((stats.length > 0 ? stats[0].games_played : 0) / 5) + 1) * 100)
    };
    
    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error en getUserProfile:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  getOrCreateUser,
  getUserProfile
}; 