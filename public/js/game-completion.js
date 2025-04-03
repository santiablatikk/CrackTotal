/**
 * CRACK TOTAL - Game Completion API
 * Funciones para enviar resultados de juegos y actualizar estadísticas
 */

// Base URL para la API
const apiBaseUrl = '/api';

/**
 * Envía los resultados de un juego PASALA CHE a la API
 * @param {Object} gameData Datos del juego completado
 * @param {number} gameData.correctLetters Cantidad de letras correctas
 * @param {number} gameData.incorrectLetters Cantidad de letras incorrectas
 * @param {Array} gameData.letterDetails Detalles de cada intento de letra
 * @returns {Promise} Promesa que se resuelve con la respuesta de la API
 */
function sendPasalaCheResults(gameData) {
    console.log('Enviando resultados de PASALA CHE:', gameData);
    
    // Crear FormData para enviar los datos
    const formData = new FormData();
    formData.append('correctLetters', gameData.correctLetters);
    formData.append('incorrectLetters', gameData.incorrectLetters);
    formData.append('letterDetails', JSON.stringify(gameData.letterDetails));
    
    // Realizar la petición POST a la API
    return fetch(`${apiBaseUrl}/games/pasala-che/complete`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al enviar resultados');
        }
        return response.json();
    })
    .then(data => {
        console.log('Resultados enviados correctamente:', data);
        
        // Mostrar notificación de XP ganado
        if (data.xpEarned) {
            showXpNotification(data.xpEarned);
        }
        
        return data;
    })
    .catch(error => {
        console.error('Error al enviar resultados:', error);
        showErrorNotification('No se pudieron guardar los resultados');
        throw error;
    });
}

/**
 * Envía los resultados de un juego QUIÉN SABE MÁS a la API
 * @param {Object} gameData Datos del juego completado
 * @param {number} gameData.score Puntuación total
 * @param {number} gameData.correctAnswers Respuestas correctas
 * @param {number} gameData.incorrectAnswers Respuestas incorrectas
 * @param {number} gameData.skippedQuestions Preguntas omitidas
 * @param {number} gameData.totalQuestions Total de preguntas
 * @param {Array} gameData.categoryDetails Detalles de cada pregunta por categoría
 * @returns {Promise} Promesa que se resuelve con la respuesta de la API
 */
function sendQuienSabeMasResults(gameData) {
    console.log('Enviando resultados de QUIÉN SABE MÁS:', gameData);
    
    // Crear FormData para enviar los datos
    const formData = new FormData();
    formData.append('score', gameData.score);
    formData.append('correctAnswers', gameData.correctAnswers);
    formData.append('incorrectAnswers', gameData.incorrectAnswers);
    formData.append('skippedQuestions', gameData.skippedQuestions);
    formData.append('totalQuestions', gameData.totalQuestions);
    
    if (gameData.categoryDetails) {
        formData.append('categoryDetails', JSON.stringify(gameData.categoryDetails));
    }
    
    // Realizar la petición POST a la API
    return fetch(`${apiBaseUrl}/games/quien-sabe-theme/complete`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al enviar resultados');
        }
        return response.json();
    })
    .then(data => {
        console.log('Resultados enviados correctamente:', data);
        
        // Mostrar notificación de XP ganado
        if (data.xpEarned) {
            showXpNotification(data.xpEarned);
        }
        
        return data;
    })
    .catch(error => {
        console.error('Error al enviar resultados:', error);
        showErrorNotification('No se pudieron guardar los resultados');
        throw error;
    });
}

/**
 * Muestra una notificación con los XP ganados
 * @param {number} xpAmount Cantidad de XP ganados
 */
function showXpNotification(xpAmount) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'xp-notification';
    notification.innerHTML = `
        <div class="xp-icon"><i class="fas fa-star"></i></div>
        <div class="xp-text">+${xpAmount} XP</div>
    `;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Eliminar después de un tiempo
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

/**
 * Muestra una notificación de error
 * @param {string} message Mensaje de error
 */
function showErrorNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
        <div class="error-icon"><i class="fas fa-exclamation-circle"></i></div>
        <div class="error-text">${message}</div>
    `;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Eliminar después de un tiempo
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

/**
 * Ejemplo de uso para PASALA CHE:
 * 
 * // Al finalizar un juego de PASALA CHE
 * const gameResults = {
 *     correctLetters: 22,
 *     incorrectLetters: 5,
 *     letterDetails: [
 *         { letter: 'A', word: 'Argentina', isCorrect: true },
 *         { letter: 'B', word: 'Brasil', isCorrect: true },
 *         // ... más letras
 *     ]
 * };
 * 
 * sendPasalaCheResults(gameResults)
 *     .then(() => {
 *         // Redirigir al dashboard o mostrar resumen
 *         window.location.href = '/user-dashboard.html';
 *     });
 */

/**
 * Ejemplo de uso para QUIÉN SABE MÁS:
 * 
 * // Al finalizar un juego de QUIÉN SABE MÁS
 * const quizResults = {
 *     score: 7,
 *     correctAnswers: 12,
 *     incorrectAnswers: 2,
 *     skippedQuestions: 1,
 *     totalQuestions: 15,
 *     categoryDetails: [
 *         { category: 'Historia', question: '¿En qué año...?', answer: '1986', isCorrect: true },
 *         // ... más preguntas
 *     ]
 * };
 * 
 * sendQuienSabeMasResults(quizResults)
 *     .then(() => {
 *         // Redirigir al dashboard o mostrar resumen
 *         window.location.href = '/user-dashboard.html';
 *     });
 */

// Exportar funciones para uso en otros archivos
window.sendPasalaCheResults = sendPasalaCheResults;
window.sendQuienSabeMasResults = sendQuienSabeMasResults;

/**
 * CRACK TOTAL - Sistema de finalización de partida
 * Gestiona la actualización del dashboard de usuario cuando termina una partida
 */

// Evento personalizado para cuando se completa una partida
const GAME_COMPLETED_EVENT = 'game-completed';

// Función para notificar que se ha completado una partida
function notifyGameCompletion(gameData) {
  console.log('Notificando finalización de partida:', gameData);
  
  // Guardar los datos de la partida en localStorage para acceso inmediato
  saveGameDataToLocalStorage(gameData);
  
  // Actualizar las estadísticas de usuario inmediatamente
  updateUserStats(gameData);
  
  // Crear y disparar evento personalizado
  const gameCompletedEvent = new CustomEvent(GAME_COMPLETED_EVENT, { 
    detail: gameData,
    bubbles: true 
  });
  document.dispatchEvent(gameCompletedEvent);
  
  // Comprobar si el dashboard está abierto en otra ventana
  notifyDashboardWindows(gameData);
}

// Guardar datos de la partida en localStorage
function saveGameDataToLocalStorage(gameData) {
  // Obtener IP del usuario o identificador único
  const userIP = localStorage.getItem('userIP') || 'unknown';
  
  // Clave para almacenar las partidas del usuario
  const userGamesKey = `userGames_${userIP}`;
  
  // Recuperar partidas existentes o crear array vacío
  let userGames = [];
  try {
    const savedGames = localStorage.getItem(userGamesKey);
    if (savedGames) {
      userGames = JSON.parse(savedGames);
    }
  } catch (error) {
    console.error('Error al recuperar partidas guardadas:', error);
  }
  
  // Añadir la nueva partida al principio del array
  gameData.timestamp = Date.now();
  userGames.unshift(gameData);
  
  // Limitar a las últimas 10 partidas para no llenar el localStorage
  if (userGames.length > 10) {
    userGames = userGames.slice(0, 10);
  }
  
  // Guardar en localStorage
  try {
    localStorage.setItem(userGamesKey, JSON.stringify(userGames));
  } catch (error) {
    console.error('Error al guardar partidas:', error);
  }
}

// Actualizar estadísticas de usuario
function updateUserStats(gameData) {
  // Obtener IP del usuario o identificador único
  const userIP = localStorage.getItem('userIP') || 'unknown';
  
  // Clave para almacenar las estadísticas del usuario
  const userStatsKey = `userStats_${userIP}_${gameData.gameType}`;
  
  // Recuperar estadísticas existentes o crear objeto vacío
  let userStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    highScore: 0,
    totalCorrectAnswers: 0,
    totalAnswers: 0,
    totalTimeSpent: 0
  };
  
  try {
    const savedStats = localStorage.getItem(userStatsKey);
    if (savedStats) {
      userStats = JSON.parse(savedStats);
    }
  } catch (error) {
    console.error('Error al recuperar estadísticas guardadas:', error);
  }
  
  // Actualizar estadísticas con los datos de la nueva partida
  userStats.gamesPlayed++;
  if (gameData.isWin) {
    userStats.gamesWon++;
  }
  
  userStats.totalScore += gameData.score;
  userStats.highScore = Math.max(userStats.highScore, gameData.score);
  userStats.totalCorrectAnswers += gameData.correctAnswers;
  userStats.totalAnswers += gameData.totalAnswers;
  userStats.totalTimeSpent += gameData.timeSpent;
  
  // Calcular estadísticas derivadas
  userStats.winRate = Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100);
  userStats.accuracy = Math.round((userStats.totalCorrectAnswers / userStats.totalAnswers) * 100);
  userStats.averageTime = Math.round(userStats.totalTimeSpent / userStats.gamesPlayed);
  
  // Guardar en localStorage
  try {
    localStorage.setItem(userStatsKey, JSON.stringify(userStats));
  } catch (error) {
    console.error('Error al guardar estadísticas:', error);
  }
}

// Notificar a otras ventanas del dashboard que hay datos nuevos
function notifyDashboardWindows(gameData) {
  // Usar localStorage como canal de comunicación entre ventanas
  const notificationKey = 'dashboardUpdate';
  localStorage.setItem(notificationKey, JSON.stringify({
    timestamp: Date.now(),
    gameType: gameData.gameType,
    action: 'gameCompleted'
  }));
}

// Escuchar cuando se guarda el resultado de la partida
function setupGameCompletionListener() {
  // Esta función debe ser llamada desde la página del juego
  if (typeof savePlayerData === 'function') {
    // Guardar referencia original a la función
    const originalSavePlayerData = savePlayerData;
    
    // Reemplazar con nuestra versión que notifica el evento
    window.savePlayerData = function(gameData) {
      // Llamar a la función original
      const result = originalSavePlayerData(gameData);
      
      // Notificar que la partida se ha completado
      notifyGameCompletion(gameData);
      
      return result;
    };
    
    console.log('Listener de finalización de partida configurado correctamente');
  } else {
    console.warn('No se encontró la función savePlayerData. El listener de finalización de partida no ha sido configurado.');
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Si estamos en la página del juego, configurar listener
  if (document.getElementById('game-container') || 
      document.querySelector('.game-container') || 
      document.querySelector('.game-screen')) {
    setupGameCompletionListener();
  }
  
  // Si estamos en el dashboard, configurar escucha de actualizaciones
  if (document.querySelector('.user-page-container')) {
    setupDashboardUpdater();
  }
});

// Configurar actualización automática del dashboard
function setupDashboardUpdater() {
  console.log('Configurando actualización automática del dashboard');
  
  // Escuchar eventos de finalización de partida (si la partida termina en esta ventana)
  document.addEventListener(GAME_COMPLETED_EVENT, function(event) {
    console.log('Evento de finalización de partida recibido:', event.detail);
    refreshDashboardData();
  });
  
  // Escuchar cambios en localStorage (si la partida termina en otra ventana)
  window.addEventListener('storage', function(event) {
    if (event.key === 'dashboardUpdate') {
      try {
        const updateData = JSON.parse(event.newValue);
        // Verificar si la actualización es reciente (menos de 5 segundos)
        if (updateData && (Date.now() - updateData.timestamp < 5000)) {
          console.log('Actualización del dashboard recibida desde otra ventana:', updateData);
          refreshDashboardData();
        }
      } catch (error) {
        console.error('Error al procesar actualización del dashboard:', error);
      }
    }
  });
}

// Actualizar datos del dashboard
function refreshDashboardData() {
  console.log('Actualizando datos del dashboard');
  
  // Obtener referencias a las funciones de carga de datos del dashboard
  if (typeof loadUserDataAndGame === 'function') {
    // Recargar datos del usuario y del juego seleccionado
    loadUserDataAndGame(window.currentGame || 'pasala-che');
    
    // Recargar datos específicos según la pestaña activa
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
      const tabId = activeTab.getAttribute('data-tab');
      
      if (tabId === 'ranking' && typeof loadRankingData === 'function') {
        loadRankingData(window.currentGame || 'pasala-che');
      } else if (tabId === 'stats' && typeof loadStatisticsData === 'function') {
        loadStatisticsData(window.currentGame || 'pasala-che');
      } else if (tabId === 'achievements' && typeof loadAchievementsData === 'function') {
        loadAchievementsData(window.currentGame || 'pasala-che');
      }
    }
    
    // Mostrar notificación al usuario
    showUpdateNotification();
  } else {
    console.warn('No se encontró la función loadUserDataAndGame. No se puede actualizar el dashboard.');
  }
}

// Mostrar notificación de actualización
function showUpdateNotification() {
  // Verificar si hay una función existente para mostrar notificaciones
  if (typeof showNotification === 'function') {
    showNotification('¡Dashboard actualizado con los nuevos datos!', 'success');
  } else {
    // Crear notificación propia
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <i class="fas fa-sync-alt"></i>
      <span>Dashboard actualizado con los últimos resultados</span>
    `;
    
    // Estilos para la notificación
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = 'rgba(59, 130, 246, 0.9)';
    notification.style.color = 'white';
    notification.style.padding = '10px 15px';
    notification.style.borderRadius = '8px';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.zIndex = '9999';
    notification.style.transform = 'translateY(-10px)';
    notification.style.opacity = '0';
    notification.style.transition = 'all 0.3s ease';
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.style.transform = 'translateY(0)';
      notification.style.opacity = '1';
    }, 10);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
      notification.style.transform = 'translateY(-10px)';
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
} 