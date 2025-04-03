const { pool } = require('../config/db');

// Obtener ranking global para un juego específico
async function getGlobalRanking(req, res) {
  try {
    const { gameType } = req.params;
    const { filter = 'global', page = 1, limit = 10 } = req.query;
    
    // Calcular offset para paginación
    const offset = (page - 1) * limit;
    
    // Construir consulta según el filtro
    let query = '';
    let countQuery = '';
    let queryParams = [];
    
    switch (filter) {
      case 'weekly':
        // Ranking semanal (partidas de la última semana)
        query = `
          SELECT gr.*, u.username, 
                 COALESCE(us.games_played, 0) as games_played,
                 COALESCE(DATE_FORMAT(us.last_played, '%Y-%m-%d'), '') as last_played
          FROM global_ranking gr
          INNER JOIN users u ON gr.user_id = u.id
          LEFT JOIN user_stats us ON gr.user_id = us.user_id AND us.game_type = ?
          WHERE gr.game_type = ?
          AND EXISTS (
            SELECT 1 FROM games g 
            WHERE g.user_id = gr.user_id AND g.type = ? 
            AND g.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          )
          ORDER BY gr.score DESC
          LIMIT ? OFFSET ?
        `;
        countQuery = `
          SELECT COUNT(*) as total
          FROM global_ranking gr
          WHERE gr.game_type = ?
          AND EXISTS (
            SELECT 1 FROM games g 
            WHERE g.user_id = gr.user_id AND g.type = ? 
            AND g.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          )
        `;
        queryParams = [gameType, gameType, gameType, parseInt(limit), offset];
        break;
        
      case 'monthly':
        // Ranking mensual (partidas del último mes)
        query = `
          SELECT gr.*, u.username, 
                 COALESCE(us.games_played, 0) as games_played,
                 COALESCE(DATE_FORMAT(us.last_played, '%Y-%m-%d'), '') as last_played
          FROM global_ranking gr
          INNER JOIN users u ON gr.user_id = u.id
          LEFT JOIN user_stats us ON gr.user_id = us.user_id AND us.game_type = ?
          WHERE gr.game_type = ?
          AND EXISTS (
            SELECT 1 FROM games g 
            WHERE g.user_id = gr.user_id AND g.type = ? 
            AND g.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          )
          ORDER BY gr.score DESC
          LIMIT ? OFFSET ?
        `;
        countQuery = `
          SELECT COUNT(*) as total
          FROM global_ranking gr
          WHERE gr.game_type = ?
          AND EXISTS (
            SELECT 1 FROM games g 
            WHERE g.user_id = gr.user_id AND g.type = ? 
            AND g.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          )
        `;
        queryParams = [gameType, gameType, gameType, parseInt(limit), offset];
        break;
        
      default:
        // Ranking global (todos los tiempos)
        query = `
          SELECT gr.*, u.username, 
                 COALESCE(us.games_played, 0) as games_played,
                 COALESCE(DATE_FORMAT(us.last_played, '%Y-%m-%d'), '') as last_played
          FROM global_ranking gr
          INNER JOIN users u ON gr.user_id = u.id
          LEFT JOIN user_stats us ON gr.user_id = us.user_id AND us.game_type = ?
          WHERE gr.game_type = ?
          ORDER BY gr.score DESC
          LIMIT ? OFFSET ?
        `;
        countQuery = `
          SELECT COUNT(*) as total
          FROM global_ranking gr
          WHERE gr.game_type = ?
        `;
        queryParams = [gameType, gameType, parseInt(limit), offset];
        break;
    }
    
    // Ejecutar consulta para obtener resultados paginados
    const [rows] = await pool.query(query, queryParams);
    
    // Ejecutar consulta para obtener el total de registros
    const [countResult] = await pool.query(
      countQuery, 
      filter === 'global' ? [gameType] : [gameType, gameType]
    );
    
    // Formatear resultados
    const players = rows.map(row => {
      // Calcular días desde la última partida
      let daysAgo = 0;
      if (row.last_played) {
        const lastPlayedDate = new Date(row.last_played);
        const today = new Date();
        const diffTime = Math.abs(today - lastPlayedDate);
        daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Generar un color aleatorio para el avatar (para visualización)
      const avatarColor = getAvatarColor(row.username);
      const avatar = row.username.charAt(0).toUpperCase();
      
      return {
        rank: row.rank,
        rankChange: row.rank_change,
        name: row.username,
        score: row.score,
        gamesPlayed: row.games_played,
        lastActive: daysAgo,
        avatar,
        avatarColor,
        isCurrentUser: false // Esto se actualizará en el front-end
      };
    });
    
    // Calcular la paginación
    const totalCount = countResult[0].total;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Devolver resultados formateados
    return res.status(200).json({
      players,
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      filter
    });
  } catch (error) {
    console.error('Error en getGlobalRanking:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Obtener estadísticas globales
async function getGlobalStats(req, res) {
  try {
    const { gameType } = req.params;
    
    // Obtener estadísticas globales
    const [totalPlayersResult] = await pool.query(
      'SELECT COUNT(DISTINCT user_id) as total FROM user_stats WHERE game_type = ?',
      [gameType]
    );
    
    const [totalGamesResult] = await pool.query(
      'SELECT COUNT(*) as total FROM games WHERE type = ?',
      [gameType]
    );
    
    const [avgScoreResult] = await pool.query(
      'SELECT AVG(score) as avg_score FROM games WHERE type = ?',
      [gameType]
    );
    
    const [maxScoreResult] = await pool.query(
      'SELECT MAX(score) as max_score FROM games WHERE type = ?',
      [gameType]
    );
    
    // Formatear resultados
    const stats = {
      totalPlayers: totalPlayersResult[0].total || 0,
      totalGames: totalGamesResult[0].total || 0,
      avgScore: Math.round(avgScoreResult[0].avg_score || 0),
      maxScore: maxScoreResult[0].max_score || 0
    };
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error en getGlobalStats:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Obtener top 3 jugadores
async function getTopPlayers(req, res) {
  try {
    const { gameType } = req.params;
    
    // Obtener top 3 jugadores
    const [rows] = await pool.query(
      `SELECT gr.rank, gr.score, u.username
       FROM global_ranking gr
       INNER JOIN users u ON gr.user_id = u.id
       WHERE gr.game_type = ?
       ORDER BY gr.score DESC
       LIMIT 3`,
      [gameType]
    );
    
    // Formatear resultados
    const players = rows.map(row => {
      return {
        rank: row.rank,
        name: row.username,
        score: row.score,
        avatar: row.username.charAt(0).toUpperCase()
      };
    });
    
    return res.status(200).json(players);
  } catch (error) {
    console.error('Error en getTopPlayers:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Buscar jugadores por nombre
async function searchPlayers(req, res) {
  try {
    const { gameType } = req.params;
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
    }
    
    // Buscar jugadores por nombre
    const [rows] = await pool.query(
      `SELECT gr.*, u.username, 
              COALESCE(us.games_played, 0) as games_played,
              COALESCE(DATE_FORMAT(us.last_played, '%Y-%m-%d'), '') as last_played
       FROM global_ranking gr
       INNER JOIN users u ON gr.user_id = u.id
       LEFT JOIN user_stats us ON gr.user_id = us.user_id AND us.game_type = ?
       WHERE gr.game_type = ? AND u.username LIKE ?
       ORDER BY gr.score DESC
       LIMIT 10`,
      [gameType, gameType, `%${term}%`]
    );
    
    // Formatear resultados
    const players = rows.map(row => {
      // Calcular días desde la última partida
      let daysAgo = 0;
      if (row.last_played) {
        const lastPlayedDate = new Date(row.last_played);
        const today = new Date();
        const diffTime = Math.abs(today - lastPlayedDate);
        daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Generar un color aleatorio para el avatar (para visualización)
      const avatarColor = getAvatarColor(row.username);
      const avatar = row.username.charAt(0).toUpperCase();
      
      return {
        rank: row.rank,
        rankChange: row.rank_change,
        name: row.username,
        score: row.score,
        gamesPlayed: row.games_played,
        lastActive: daysAgo,
        avatar,
        avatarColor,
        isCurrentUser: false // Esto se actualizará en el front-end
      };
    });
    
    // Devolver resultados
    return res.status(200).json({
      players,
      searchTerm: term
    });
  } catch (error) {
    console.error('Error en searchPlayers:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Función auxiliar para generar un color de avatar basado en el nombre de usuario
function getAvatarColor(username) {
  // Generar un color basado en el nombre de usuario para que sea consistente
  const hash = Array.from(username).reduce(
    (hash, char) => char.charCodeAt(0) + ((hash << 5) - hash), 0
  );
  
  // Generar componentes HSL para un color más agradable visualmente
  const h = Math.abs(hash) % 360;
  const s = 70 + (Math.abs(hash) % 30); // Saturación entre 70% y 100%
  const l = 40 + (Math.abs(hash) % 20); // Luminosidad entre 40% y 60%
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}

module.exports = {
  getGlobalRanking,
  getGlobalStats,
  getTopPlayers,
  searchPlayers
}; 