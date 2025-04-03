/**
 * Cliente para conectar con la API del backend
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Obtener información del juego
async function getGameInfo(gameType) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameType}/info`);
    if (!response.ok) {
      throw new Error('Error al obtener información del juego');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getGameInfo:', error);
    // Fallback a datos locales si hay error
    return null;
  }
}

// Obtener o crear usuario
async function getOrCreateUser(ip, username) {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ip, username }),
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener/crear usuario');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getOrCreateUser:', error);
    return null;
  }
}

// Obtener perfil de usuario
async function getUserProfile(userId, gameType) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile/${gameType}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener perfil de usuario');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getUserProfile:', error);
    return null;
  }
}

// Guardar datos de una partida
async function saveGameData(gameData) {
  try {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });
    
    if (!response.ok) {
      throw new Error('Error al guardar datos de la partida');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en saveGameData:', error);
    return null;
  }
}

// Obtener ranking global
async function getGlobalRanking(gameType, filter = 'global', page = 1) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameType}/ranking?filter=${filter}&page=${page}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener ranking global');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getGlobalRanking:', error);
    return null;
  }
}

// Obtener estadísticas globales
async function getGlobalStats(gameType) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameType}/global-stats`);
    
    if (!response.ok) {
      throw new Error('Error al obtener estadísticas globales');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getGlobalStats:', error);
    return null;
  }
}

// Obtener top jugadores
async function getTopPlayers(gameType) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameType}/top-players`);
    
    if (!response.ok) {
      throw new Error('Error al obtener top jugadores');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getTopPlayers:', error);
    return null;
  }
}

// Buscar jugadores
async function searchPlayers(gameType, term) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameType}/ranking/search?term=${encodeURIComponent(term)}`);
    
    if (!response.ok) {
      throw new Error('Error al buscar jugadores');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en searchPlayers:', error);
    return null;
  }
}

// Obtener logros del usuario
async function getUserAchievements(userId, gameType) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/achievements/${gameType}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener logros del usuario');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getUserAchievements:', error);
    return null;
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
  getUserAchievements
}; 