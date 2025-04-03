const { pool } = require('../config/db');

// Obtener todos los logros disponibles
async function getAllAchievements(req, res) {
  try {
    const { gameType } = req.params;
    
    // Obtener todos los logros para el juego específico o generales
    const [rows] = await pool.query(
      'SELECT * FROM achievements WHERE game_type IS NULL OR game_type = ? ORDER BY category, id',
      [gameType]
    );
    
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error en getAllAchievements:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Obtener logros de un usuario
async function getUserAchievements(req, res) {
  try {
    const { userId, gameType } = req.params;
    
    // Obtener todos los logros disponibles
    const [allAchievements] = await pool.query(
      'SELECT * FROM achievements WHERE game_type IS NULL OR game_type = ? ORDER BY category, id',
      [gameType]
    );
    
    // Obtener los logros desbloqueados por el usuario
    const [userAchievements] = await pool.query(
      `SELECT ua.*, a.name, a.description, a.icon, a.category, a.requirement_type, a.requirement_value, a.xp_reward
       FROM user_achievements ua
       INNER JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ?`,
      [userId]
    );
    
    // Mapear los resultados
    const achievements = allAchievements.map(achievement => {
      // Buscar si el usuario tiene este logro
      const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
      
      // Si el usuario tiene el logro, devolver la información combinada
      if (userAchievement) {
        return {
          ...achievement,
          unlocked: userAchievement.completed,
          progress: userAchievement.progress,
          max_progress: achievement.requirement_value,
          percentage: Math.min(100, Math.round((userAchievement.progress / achievement.requirement_value) * 100)),
          unlocked_at: userAchievement.completed ? userAchievement.unlocked_at : null
        };
      }
      
      // Si el usuario no tiene el logro, devolver el logro como bloqueado
      return {
        ...achievement,
        unlocked: false,
        progress: 0,
        max_progress: achievement.requirement_value,
        percentage: 0,
        unlocked_at: null
      };
    });
    
    // Organizar los logros por categoría
    const categorizedAchievements = {};
    
    achievements.forEach(achievement => {
      const category = achievement.category || 'general';
      
      if (!categorizedAchievements[category]) {
        categorizedAchievements[category] = [];
      }
      
      categorizedAchievements[category].push(achievement);
    });
    
    // Calcular resumen
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    
    // Devolver resultados
    return res.status(200).json({
      achievements: categorizedAchievements,
      stats: {
        unlocked: unlockedCount,
        total: totalCount,
        percentage: Math.round((unlockedCount / totalCount) * 100)
      }
    });
  } catch (error) {
    console.error('Error en getUserAchievements:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  getAllAchievements,
  getUserAchievements
}; 