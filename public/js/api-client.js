// Funciones de fallback para datos locales
function getLocalUser(ip, username) {
  // Intentamos obtener datos del usuario desde localStorage
  const profileKey = `profile_${ip}`;
  let userData = {
    id: ip,
    username: username || 'Jugador',
    level: 1,
    xp: 0,
    totalXp: 100,
    createdAt: new Date().toISOString()
  };
  
  try {
    const savedData = localStorage.getItem(profileKey);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Combinar datos guardados con los valores predeterminados
      userData = { ...userData, ...parsedData };
    }
  } catch (error) {
    console.error('Error al leer datos de usuario locales:', error);
  }
  
  return userData;
}

function getLocalUserStats(userId, gameType) {
  try {
    // Si tenemos una función global, la usamos (desde user-dashboard.js)
    if (typeof window.getLocalUserStats === 'function') {
      return window.getLocalUserStats(userId, gameType);
    }
    
    const statsKey = `userStats_${userId}_${gameType}`;
    const savedStats = localStorage.getItem(statsKey);
    
    if (savedStats) {
      return JSON.parse(savedStats);
    }
    
    // Estadísticas por defecto
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      highScore: 0,
      totalCorrectAnswers: 0,
      totalAnswers: 0,
      winRate: 0,
      accuracy: 0
    };
  } catch (error) {
    console.error('Error al obtener estadísticas locales:', error);
    return null;
  }
}

function getLocalRanking(gameType) {
  try {
    // Si tenemos una función global, la usamos (desde user-dashboard.js)
    if (typeof window.getLocalRanking === 'function') {
      return window.getLocalRanking(gameType);
    }
    
    // Generamos un ranking local con datos de ejemplo
    const ranking = {
      players: [],
      currentPage: 1,
      totalPages: 1,
      totalPlayers: 5,
      totalGames: 10,
      avgScore: 50,
      maxScore: 100
    };
    
    // Generar algunos jugadores de ejemplo
    for (let i = 1; i <= 5; i++) {
      ranking.players.push({
        rank: i,
        name: `Jugador ${i}`,
        score: 100 - (i * 10),
        gamesPlayed: 5 - (i % 3),
        lastActive: i
      });
    }
    
    // Intentar añadir al jugador actual
    const userId = localStorage.getItem('userIP');
    const username = localStorage.getItem('username') || 'Jugador';
    
    if (userId) {
      // Añadir al jugador actual en una posición aleatoria
      const randomPosition = Math.floor(Math.random() * ranking.players.length);
      ranking.players.splice(randomPosition, 0, {
        rank: randomPosition + 1,
        name: username,
        score: 75,
        gamesPlayed: 3,
        lastActive: 0,
        isCurrentUser: true
      });
      
      // Actualizar rangos
      ranking.players.forEach((player, index) => {
        player.rank = index + 1;
      });
    }
    
    return ranking;
  } catch (error) {
    console.error('Error al generar ranking local:', error);
    return null;
  }
}

function getLocalTopPlayers(gameType) {
  try {
    // Si tenemos una función global, la usamos (desde user-dashboard.js)
    if (typeof window.getLocalTopPlayers === 'function') {
      return window.getLocalTopPlayers(gameType);
    }
    
    // Obtener el ranking completo y tomar los primeros 3 jugadores
    const ranking = getLocalRanking(gameType);
    return ranking.players.slice(0, 3);
  } catch (error) {
    console.error('Error al obtener top jugadores locales:', error);
    return [];
  }
}

function getLocalGlobalStats(gameType) {
  try {
    // Si tenemos una función global, la usamos (desde user-dashboard.js)
    if (typeof window.getLocalGlobalStats === 'function') {
      return window.getLocalGlobalStats(gameType);
    }
    
    return {
      totalPlayers: 100,
      totalGames: 500,
      avgScore: 75,
      maxScore: 150
    };
  } catch (error) {
    console.error('Error al obtener estadísticas globales locales:', error);
    return null;
  }
}

function getLocalUserAchievements(userId, gameType) {
  try {
    // Si tenemos una función global, la usamos (desde user-dashboard.js)
    if (typeof window.getLocalUserAchievements === 'function') {
      return window.getLocalUserAchievements(userId, gameType);
    }
    
    // Intentar leer logros guardados en localStorage
    const achievementsKey = `userAchievements_${userId}`;
    const savedAchievements = localStorage.getItem(achievementsKey);
    
    if (savedAchievements) {
      return JSON.parse(savedAchievements);
    }
    
    // Devolver algunos logros de ejemplo por defecto
    return [
      {
        id: 'first-game',
        title: 'Primera Partida',
        description: 'Jugar tu primera partida',
        icon: 'gamepad',
        status: 'unlocked',
        progress: 100,
        reward: '10 XP'
      },
      {
        id: 'win-streak',
        title: 'Racha Ganadora',
        description: 'Gana 3 partidas seguidas',
        icon: 'fire',
        status: 'in-progress',
        progress: 33,
        reward: '50 XP'
      },
      {
        id: 'perfect-game',
        title: 'Partida Perfecta',
        description: 'Completa una partida sin errores',
        icon: 'star',
        status: 'locked',
        progress: 0,
        reward: '100 XP'
      }
    ];
  } catch (error) {
    console.error('Error al obtener logros locales:', error);
    return [];
  }
}

function searchLocalPlayers(gameType, term) {
  try {
    // Obtener el ranking completo
    const ranking = getLocalRanking(gameType);
    
    // Filtrar jugadores cuyo nombre coincida con el término
    const results = ranking.players.filter(player => 
      player.name.toLowerCase().includes(term.toLowerCase())
    );
    
    return {
      players: results,
      count: results.length,
      term: term
    };
  } catch (error) {
    console.error('Error al buscar jugadores localmente:', error);
    return { players: [], count: 0, term: term };
  }
}

function saveGameDataLocally(gameData) {
  try {
    const userIP = gameData.userId || localStorage.getItem('userIP');
    if (!userIP) {
      console.error('No se pudo guardar partida: falta userId');
      return false;
    }
    
    // Preparar datos de la partida para almacenamiento local
    const gameHistoryEntry = {
      gameType: gameData.gameType,
      score: gameData.score,
      correctAnswers: gameData.correctAnswers,
      incorrectAnswers: gameData.incorrectAnswers || 0,
      skippedAnswers: gameData.skippedAnswers || 0,
      timeSpent: gameData.timeSpent,
      timestamp: Date.now(),
      isWin: gameData.isWin
    };
    
    // Guardar en historial
    const historyKey = `gameHistory_${userIP}`;
    let history = [];
    
    try {
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        history = JSON.parse(savedHistory);
      }
    } catch (e) {
      console.error('Error al leer historial:', e);
    }
    
    // Añadir nueva partida
    history.unshift(gameHistoryEntry);
    
    // Limitar a 50 partidas
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    
    // Guardar historial actualizado
    localStorage.setItem(historyKey, JSON.stringify(history));
    
    // Actualizar estadísticas
    updateLocalUserStats(userIP, gameData);
    
    return true;
  } catch (error) {
    console.error('Error al guardar partida localmente:', error);
    return false;
  }
}

function updateLocalUserStats(userIP, gameData) {
  try {
    // Clave para las estadísticas del usuario en este juego
    const statsKey = `userStats_${userIP}_${gameData.gameType}`;
    
    // Cargar estadísticas existentes o crear nuevas
    let stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      highScore: 0,
      totalCorrectAnswers: 0,
      totalAnswers: 0,
      winRate: 0,
      accuracy: 0,
      averageTime: 0,
      totalTimeSpent: 0
    };
    
    try {
      const savedStats = localStorage.getItem(statsKey);
      if (savedStats) {
        stats = { ...stats, ...JSON.parse(savedStats) };
      }
    } catch (e) {
      console.error('Error al leer estadísticas guardadas:', e);
    }
    
    // Actualizar estadísticas
    stats.gamesPlayed++;
    stats.totalScore += gameData.score || 0;
    stats.highScore = Math.max(stats.highScore, gameData.score || 0);
    stats.totalCorrectAnswers += gameData.correctAnswers || 0;
    stats.totalAnswers += gameData.totalAnswers || 
                          (gameData.correctAnswers || 0) + 
                          (gameData.incorrectAnswers || 0) + 
                          (gameData.skippedAnswers || 0);
    stats.totalTimeSpent += gameData.timeSpent || 0;
    
    if (gameData.isWin) {
      stats.gamesWon++;
    }
    
    // Calcular estadísticas derivadas
    stats.winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
    stats.accuracy = stats.totalAnswers > 0 ? Math.round((stats.totalCorrectAnswers / stats.totalAnswers) * 100) : 0;
    stats.averageTime = stats.gamesPlayed > 0 ? Math.round(stats.totalTimeSpent / stats.gamesPlayed) : 0;
    
    // Guardar estadísticas actualizadas
    localStorage.setItem(statsKey, JSON.stringify(stats));
    
    console.log('Estadísticas locales actualizadas:', stats);
    return true;
  } catch (error) {
    console.error('Error al actualizar estadísticas locales:', error);
    return false;
  }
}

// Exportar funciones para uso global
window.apiClient = {
  getGameInfo,
  getOrCreateUser,
  getUserProfile,
  saveGameData,
  getGlobalRanking,
  getGlobalStats,
  getTopPlayers,
  searchPlayers,
  getUserAchievements,
  // Funciones de fallback
  getLocalUser,
  getLocalUserStats,
  getLocalRanking,
  getLocalTopPlayers,
  getLocalGlobalStats,
  getLocalUserAchievements,
  searchLocalPlayers,
  saveGameDataLocally,
  updateLocalUserStats,
  checkApiAvailability
}; 