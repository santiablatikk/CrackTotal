const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Guardar nueva partida y actualizar estadísticas
async function saveGameData(req, res) {
  try {
    const {
      userId,
      gameType,
      score,
      correctAnswers,
      incorrectAnswers,
      skippedAnswers,
      timeSpent,
      isWin
    } = req.body;
    
    if (!userId || !gameType) {
      return res.status(400).json({ error: 'userId y gameType son obligatorios' });
    }
    
    // Verificar que el usuario existe
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const totalAnswers = (correctAnswers || 0) + (incorrectAnswers || 0) + (skippedAnswers || 0);
    
    // Iniciar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Guardar la partida
      const gameId = uuidv4();
      await connection.query(
        `INSERT INTO games 
        (id, user_id, type, score, correct_answers, incorrect_answers, skipped_answers, 
        total_answers, time_spent, is_win) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [gameId, userId, gameType, score, correctAnswers, incorrectAnswers, skippedAnswers, 
         totalAnswers, timeSpent, isWin]
      );
      
      // 2. Actualizar o crear estadísticas de usuario
      const [existingStats] = await connection.query(
        'SELECT * FROM user_stats WHERE user_id = ? AND game_type = ?',
        [userId, gameType]
      );
      
      if (existingStats.length > 0) {
        // Actualizar estadísticas existentes
        const stats = existingStats[0];
        const updatedGamesPlayed = stats.games_played + 1;
        const updatedGamesWon = stats.games_won + (isWin ? 1 : 0);
        const updatedTotalScore = stats.total_score + (score || 0);
        const updatedHighScore = Math.max(stats.high_score, score || 0);
        const updatedTotalCorrect = stats.total_correct_answers + (correctAnswers || 0);
        const updatedTotalIncorrect = stats.total_incorrect_answers + (incorrectAnswers || 0);
        const updatedTotalAnswers = stats.total_answers + (totalAnswers || 0);
        const updatedTotalTime = stats.total_time_spent + (timeSpent || 0);
        
        // Calcular estadísticas derivadas
        const updatedWinRate = updatedGamesPlayed > 0 
          ? (updatedGamesWon / updatedGamesPlayed) * 100 
          : 0;
        const updatedAccuracy = updatedTotalAnswers > 0 
          ? (updatedTotalCorrect / updatedTotalAnswers) * 100 
          : 0;
        const updatedAvgTime = updatedGamesPlayed > 0 
          ? updatedTotalTime / updatedGamesPlayed 
          : 0;
        
        await connection.query(
          `UPDATE user_stats 
          SET games_played = ?, games_won = ?, total_score = ?, high_score = ?,
          total_correct_answers = ?, total_incorrect_answers = ?, total_answers = ?,
          total_time_spent = ?, win_rate = ?, accuracy = ?, avg_time = ?, last_played = NOW()
          WHERE user_id = ? AND game_type = ?`,
          [updatedGamesPlayed, updatedGamesWon, updatedTotalScore, updatedHighScore,
           updatedTotalCorrect, updatedTotalIncorrect, updatedTotalAnswers,
           updatedTotalTime, updatedWinRate, updatedAccuracy, updatedAvgTime,
           userId, gameType]
        );
      } else {
        // Crear nuevas estadísticas
        const winRate = isWin ? 100 : 0;
        const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
        
        await connection.query(
          `INSERT INTO user_stats 
          (user_id, game_type, games_played, games_won, total_score, high_score,
          total_correct_answers, total_incorrect_answers, total_answers,
          total_time_spent, win_rate, accuracy, avg_time)
          VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, gameType, isWin ? 1 : 0, score, score, 
           correctAnswers, incorrectAnswers, totalAnswers,
           timeSpent, winRate, accuracy, timeSpent]
        );
      }
      
      // 3. Actualizar ranking global
      // Primero obtenemos el puntaje total para el ranking
      const [userTotalStats] = await connection.query(
        'SELECT high_score FROM user_stats WHERE user_id = ? AND game_type = ?',
        [userId, gameType]
      );
      
      const totalScore = userTotalStats.length > 0 ? userTotalStats[0].high_score : score;
      
      // Verificar si ya está en el ranking
      const [existingRanking] = await connection.query(
        'SELECT * FROM global_ranking WHERE user_id = ? AND game_type = ?',
        [userId, gameType]
      );
      
      if (existingRanking.length > 0) {
        // Actualizar posición en el ranking
        const oldRank = existingRanking[0].rank;
        
        await connection.query(
          'UPDATE global_ranking SET score = ?, updated_at = NOW() WHERE user_id = ? AND game_type = ?',
          [totalScore, userId, gameType]
        );
        
        // Recalcular todas las posiciones (esto podría optimizarse en producción)
        await recalculateRankings(connection, gameType, userId, oldRank);
      } else {
        // Insertar nueva entrada en el ranking
        await connection.query(
          'INSERT INTO global_ranking (user_id, game_type, score, rank, rank_change) VALUES (?, ?, ?, 0, 0)',
          [userId, gameType, totalScore]
        );
        
        // Recalcular rankings
        await recalculateRankings(connection, gameType);
      }
      
      // 4. Comprobar logros
      await checkAchievements(connection, userId, gameType);
      
      // Confirmar la transacción
      await connection.commit();
      
      // Obtener los datos actualizados para devolver
      const [updatedStats] = await pool.query(
        'SELECT * FROM user_stats WHERE user_id = ? AND game_type = ?',
        [userId, gameType]
      );
      
      const [updatedRank] = await pool.query(
        'SELECT * FROM global_ranking WHERE user_id = ? AND game_type = ?',
        [userId, gameType]
      );
      
      // Devolver resultados
      return res.status(200).json({
        gameId,
        stats: updatedStats[0],
        ranking: updatedRank[0]
      });
    } catch (err) {
      // Si hay error, revertir la transacción
      await connection.rollback();
      throw err;
    } finally {
      // Liberar la conexión
      connection.release();
    }
  } catch (error) {
    console.error('Error en saveGameData:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Recalcular posiciones en el ranking
async function recalculateRankings(connection, gameType, changedUserId = null, oldRank = null) {
  // Obtener todos los usuarios ordenados por puntaje
  const [allRankings] = await connection.query(
    'SELECT user_id, score FROM global_ranking WHERE game_type = ? ORDER BY score DESC',
    [gameType]
  );
  
  // Actualizar cada posición
  for (let i = 0; i < allRankings.length; i++) {
    const newRank = i + 1;
    const userId = allRankings[i].user_id;
    
    // Calcular cambio de posición para el usuario que cambió
    let rankChange = 0;
    if (changedUserId && userId === changedUserId && oldRank !== null) {
      rankChange = oldRank - newRank; // positivo significa mejora, negativo empeoramiento
    }
    
    // Actualizar ranking
    await connection.query(
      'UPDATE global_ranking SET rank = ?, rank_change = ? WHERE user_id = ? AND game_type = ?',
      [newRank, rankChange, userId, gameType]
    );
  }
}

// Comprobar y actualizar logros
async function checkAchievements(connection, userId, gameType) {
  try {
    // Obtener estadísticas del usuario
    const [userStats] = await connection.query(
      'SELECT * FROM user_stats WHERE user_id = ? AND game_type = ?',
      [userId, gameType]
    );
    
    if (userStats.length === 0) return;
    
    const stats = userStats[0];
    
    // Obtener logros disponibles para este juego o generales
    const [availableAchievements] = await connection.query(
      'SELECT * FROM achievements WHERE game_type IS NULL OR game_type = ?',
      [gameType]
    );
    
    // Comprobar cada logro
    for (const achievement of availableAchievements) {
      // Obtener progreso actual
      const [userAchievement] = await connection.query(
        'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievement.id]
      );
      
      let progress = 0;
      let completed = false;
      
      // Calcular progreso según el tipo de requisito
      switch (achievement.requirement_type) {
        case 'games_played':
          progress = stats.games_played;
          completed = progress >= achievement.requirement_value;
          break;
        case 'games_won':
          progress = stats.games_won;
          completed = progress >= achievement.requirement_value;
          break;
        case 'high_score':
          progress = stats.high_score;
          completed = progress >= achievement.requirement_value;
          break;
        case 'accuracy':
          progress = stats.accuracy;
          completed = progress >= achievement.requirement_value;
          break;
        case 'perfect_game':
          // Comprobar si la última partida fue perfecta
          const [lastGame] = await connection.query(
            'SELECT * FROM games WHERE user_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1',
            [userId, gameType]
          );
          if (lastGame.length > 0 && lastGame[0].incorrect_answers === 0 && lastGame[0].total_answers > 0) {
            progress = 1;
            completed = true;
          }
          break;
        case 'time_spent':
          // Para logros de tiempo, el requisito es completar en MENOS tiempo que el valor
          const [fastGame] = await connection.query(
            'SELECT * FROM games WHERE user_id = ? AND type = ? AND time_spent <= ? LIMIT 1',
            [userId, gameType, achievement.requirement_value]
          );
          if (fastGame.length > 0) {
            progress = 1;
            completed = true;
          }
          break;
      }
      
      // Actualizar o crear entrada de logro
      if (userAchievement.length > 0) {
        // Actualizar progreso existente
        if (!userAchievement[0].completed) {
          await connection.query(
            'UPDATE user_achievements SET progress = ?, completed = ?, unlocked_at = IF(? = TRUE AND completed = FALSE, NOW(), unlocked_at) WHERE user_id = ? AND achievement_id = ?',
            [progress, completed, completed, userId, achievement.id]
          );
        }
      } else {
        // Crear nueva entrada
        await connection.query(
          'INSERT INTO user_achievements (user_id, achievement_id, progress, completed, unlocked_at) VALUES (?, ?, ?, ?, IF(? = TRUE, NOW(), NULL))',
          [userId, achievement.id, progress, completed, completed]
        );
      }
    }
  } catch (error) {
    console.error('Error en checkAchievements:', error);
    throw error;
  }
}

// Obtener información del juego
async function getGameInfo(req, res) {
  try {
    const { gameType } = req.params;
    
    // Aquí podrías obtener información específica del juego desde la base de datos
    // Por ahora, devolvemos datos estáticos según el tipo de juego
    let gameInfo = {};
    
    if (gameType === 'pasala-che') {
      gameInfo = {
        id: 'pasala-che',
        title: 'PASALA CHE',
        description: 'El juego de palabras del fútbol',
        icon: 'fa-circle-notch',
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
          accuracy: 0,
          highScore: 0,
          averageTime: 0
        },
        statLabels: {
          games: 'Partidas Jugadas',
          winRate: 'Palabras Acertadas',
          accuracy: 'Precisión Palabras',
          time: 'Tiempo Promedio'
        },
        highScoreLabel: 'Récord Rosco',
        rankingLabels: {
          score: 'Aciertos',
          games: 'Roscos',
          timeLabel: 'Último Rosco'
        },
        globalLabels: {
          players: 'Jugadores Totales',
          games: 'Roscos Jugados',
          avgScore: 'Promedio Aciertos',
          maxScore: 'Mejor Rosco'
        }
      };
    } else {
      gameInfo = {
        id: 'quien-sabe-mas',
        title: '¿QUIÉN SABE MÁS?',
        description: 'El juego de preguntas del fútbol',
        icon: 'fa-question-circle',
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
          accuracy: 0,
          highScore: 0,
          averageTime: 0
        },
        statLabels: {
          games: 'Partidas Jugadas',
          winRate: 'Tasa de Victoria',
          accuracy: 'Preguntas Correctas',
          time: 'Minutos por Juego'
        },
        highScoreLabel: 'Mejor Puntaje',
        rankingLabels: {
          score: 'Puntos',
          games: 'Partidas',
          timeLabel: 'Última Partida'
        },
        globalLabels: {
          players: 'Jugadores Totales',
          games: 'Partidas Jugadas',
          avgScore: 'Promedio Puntos',
          maxScore: 'Máximo Puntaje'
        }
      };
    }
    
    return res.status(200).json(gameInfo);
  } catch (error) {
    console.error('Error en getGameInfo:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  saveGameData,
  getGameInfo
}; 