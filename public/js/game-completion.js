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
 * Muestra una notificación tipo toast al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, info, warning)
 * @param {number} duration - Duración en ms (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  // Verificar si existe una función global para mostrar notificaciones
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, type);
    return;
  }
  
  try {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `game-toast toast-${type}`;
    
    // Añadir ícono según el tipo
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    // Establecer contenido
    toast.innerHTML = `
      <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
      <div class="toast-message">${message}</div>
    `;
    
    // Aplicar estilos
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '250px';
    toast.style.padding = '12px 15px';
    toast.style.borderRadius = '8px';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    toast.style.animation = 'fadeInUp 0.3s ease forwards';
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease';
    
    // Colores según el tipo
    if (type === 'success') {
      toast.style.background = 'rgba(34, 197, 94, 0.95)';
      toast.style.color = 'white';
    } else if (type === 'error') {
      toast.style.background = 'rgba(239, 68, 68, 0.95)';
      toast.style.color = 'white';
    } else if (type === 'warning') {
      toast.style.background = 'rgba(245, 158, 11, 0.95)';
      toast.style.color = 'white';
    } else {
      toast.style.background = 'rgba(59, 130, 246, 0.95)';
      toast.style.color = 'white';
    }
    
    // Añadir al DOM
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);
    
    // Eliminar después de la duración especificada
    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  } catch (error) {
    console.error('Error al mostrar notificación:', error);
  }
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

// Función para actualizar el dashboard con los nuevos datos
function refreshDashboardData(gameType) {
  console.log('📊 Actualizando datos del dashboard para:', gameType);
  const startTime = performance.now();
  
  try {
    // Verificar que existen las funciones necesarias
    const loadUserDataAndGameFn = 
      window.loadUserDataAndGame || 
      (window.apiClient && (() => {
        console.log('Usando apiClient como fallback para loadUserDataAndGame');
        const userIP = localStorage.getItem('userIP');
        if (userIP) {
          window.apiClient.getOrCreateUser(userIP);
        }
      }));
      
    const loadRankingFn = 
      window.loadRanking || 
      (window.apiClient && ((gameType) => {
        console.log('Usando apiClient como fallback para loadRanking');
        return window.apiClient.getGlobalRanking(gameType);
      }));
      
    const loadUserStatsFn = 
      window.loadUserStats || 
      (window.apiClient && ((gameType) => {
        console.log('Usando apiClient como fallback para loadUserStats');
        const userIP = localStorage.getItem('userIP');
        if (userIP) {
          return window.apiClient.getUserProfile(userIP, gameType);
        }
      }));
      
    const loadAchievementsFn = 
      window.loadAchievements || 
      (window.apiClient && ((gameType) => {
        console.log('Usando apiClient como fallback para loadAchievements');
        const userIP = localStorage.getItem('userIP');
        if (userIP) {
          return window.apiClient.getUserAchievements(userIP, gameType);
        }
      }));
    
    // Obtener tipo de juego actual (o usar pasala-che como fallback)
    const currentGame = gameType || window.currentGame || 'pasala-che';
    
    // Obtener userIP desde localStorage
    const userIP = localStorage.getItem('userIP');
    if (!userIP) {
      console.warn('🚨 No se encontró userIP en localStorage. Es posible que algunas funciones no trabajen correctamente.');
    }
    
    // Actualizar cada sección si las funciones existen
    if (loadUserDataAndGameFn) {
      console.log('Actualizando perfil de usuario y datos del juego');
      loadUserDataAndGameFn(currentGame);
    } else {
      console.warn('⚠️ Función loadUserDataAndGame no encontrada');
    }
    
    if (loadRankingFn) {
      console.log('Actualizando ranking');
      loadRankingFn(currentGame);
    } else {
      console.warn('⚠️ Función loadRanking no encontrada');
    }
    
    if (loadUserStatsFn) {
      console.log('Actualizando estadísticas');
      loadUserStatsFn(currentGame);
    } else {
      console.warn('⚠️ Función loadUserStats no encontrada');
    }
    
    if (loadAchievementsFn) {
      console.log('Actualizando logros');
      loadAchievementsFn(currentGame);
    } else {
      console.warn('⚠️ Función loadAchievements no encontrada');
    }
    
    const endTime = performance.now();
    console.log(`✅ Dashboard actualizado en ${Math.round(endTime - startTime)}ms`);
    
    // Mostrar notificación de actualización
    showToast('Dashboard actualizado', 'success');
    
    // Indicar que se ha actualizado
    window.lastDashboardUpdateTime = Date.now();
    return true;
  } catch (error) {
    console.error('❌ Error al actualizar dashboard:', error);
    showToast('Error al actualizar dashboard', 'error');
    return false;
  } finally {
    window.isUpdatingDashboard = false;
  }
}

function setupDashboardUpdater() {
  console.log('📡 Configurando actualizador del dashboard');
  
  try {
    // Verificar si hay actualizaciones recientes al cargar la página
    checkForRecentUpdates();
    
    // Escuchar el evento de juego completado (mismo window)
    window.addEventListener(GAME_COMPLETED_EVENT, (event) => {
      console.log('🎮 Evento de juego completado detectado en esta ventana', event);
      if (window.isUpdatingDashboard) {
        console.log('Actualización en progreso, ignorando evento');
        return;
      }
      
      window.isUpdatingDashboard = true;
      const gameType = event.detail?.gameType || window.currentGame || 'pasala-che';
      refreshDashboardData(gameType);
    });
    
    // Escuchar eventos de localStorage (otros windows)
    window.addEventListener('storage', (event) => {
      if (event.key === 'lastGameCompletion') {
        try {
          console.log('🔄 Detectado juego completado en otra ventana');
          
          // Verificar si la actualización es reciente (menos de 30 segundos)
          const data = JSON.parse(event.newValue);
          const timestamp = data.timestamp || 0;
          const now = Date.now();
          const secondsAgo = (now - timestamp) / 1000;
          
          if (secondsAgo <= 30) {
            console.log(`🕒 Actualización de ${Math.round(secondsAgo)}s atrás`);
            
            if (window.isUpdatingDashboard) {
              console.log('Actualización en progreso, ignorando evento');
              return;
            }
            
            window.isUpdatingDashboard = true;
            const gameType = data.gameType || window.currentGame || 'pasala-che';
            refreshDashboardData(gameType);
          } else {
            console.log(`🕒 Ignorando actualización antigua de ${Math.round(secondsAgo)}s atrás`);
          }
        } catch (error) {
          console.error('Error al procesar evento de storage:', error);
        }
      }
    });
    
    // Verificar periódicamente si hay actualizaciones recientes (backup)
    setInterval(checkForRecentUpdates, 5000);
    
    console.log('✅ Actualizador del dashboard configurado correctamente');
  } catch (error) {
    console.error('❌ Error al configurar el actualizador del dashboard:', error);
  }
}

// Función para verificar si hay actualizaciones recientes en localStorage
function checkForRecentUpdates() {
  try {
    const lastCompletionStr = localStorage.getItem('lastGameCompletion');
    if (!lastCompletionStr) return;
    
    const data = JSON.parse(lastCompletionStr);
    const timestamp = data.timestamp || 0;
    const now = Date.now();
    const secondsAgo = (now - timestamp) / 1000;
    
    // Si hay una actualización reciente (menos de 15 segundos) y no estamos actualizando ya
    if (secondsAgo <= 15 && !window.isUpdatingDashboard) {
      console.log(`🔄 Detectada actualización reciente (${Math.round(secondsAgo)}s atrás)`);
      
      window.isUpdatingDashboard = true;
      const gameType = data.gameType || window.currentGame || 'pasala-che';
      refreshDashboardData(gameType);
    }
  } catch (error) {
    console.error('Error al verificar actualizaciones recientes:', error);
  }
}

function setupGameCompletionListener() {
  console.log('🎮 Configurando detector de fin de juego');
  
  try {
    // Si ya existe savePlayerData, lo reemplazamos inmediatamente
    if (window.savePlayerData) {
      console.log('Función savePlayerData encontrada, configurando interceptor');
      setupSavePlayerDataInterceptor();
      return;
    }
    
    // Si no, verificamos periódicamente hasta que esté disponible
    console.log('Esperando a que la función savePlayerData esté disponible...');
    
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      
      if (window.savePlayerData) {
        console.log(`✅ savePlayerData encontrado después de ${checkCount} intentos`);
        clearInterval(checkInterval);
        setupSavePlayerDataInterceptor();
      } else if (checkCount >= 10) {
        console.warn('⚠️ No se pudo encontrar savePlayerData después de 10 intentos');
        clearInterval(checkInterval);
      } else {
        console.log(`Intento ${checkCount}: Esperando función savePlayerData...`);
      }
    }, 1000);
  } catch (error) {
    console.error('❌ Error al configurar detector de fin de juego:', error);
  }
}

function setupSavePlayerDataInterceptor() {
  // Guardar referencia a la función original
  const originalSavePlayerData = window.savePlayerData;
  
  // Reemplazar con nuestra versión que notifica al completar
  window.savePlayerData = function(gameData) {
    // Llamar a la función original primero
    const result = originalSavePlayerData.apply(this, arguments);
    
    // Luego notificar que el juego ha sido completado
    console.log('🎮 Juego completado detectado en savePlayerData:', gameData);
    notifyGameCompletion(gameData);
    
    // Devolver el resultado original
    return result;
  };
  
  console.log('✅ Interceptor de savePlayerData configurado correctamente');
}

// Inicializar con un retardo para asegurar que todos los scripts se han cargado
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando sistema de actualización de dashboard...');
  
  setTimeout(() => {
    // Si estamos en la página del juego, configurar listener
    if (document.getElementById('game-container') || 
        document.querySelector('.game-container') || 
        document.querySelector('.game-screen')) {
      console.log('Detectada página del juego. Configurando listener...');
      setupGameCompletionListener();
    }
    
    // Si estamos en el dashboard, configurar escucha de actualizaciones
    if (document.querySelector('.user-page-container')) {
      console.log('Detectado dashboard de usuario. Configurando actualizador...');
      setupDashboardUpdater();
    }
  }, 1000);
});

// Exponer funciones principales a nivel global
window.gameCompletion = {
  notifyGameCompletion,
  refreshDashboardData,
  setupDashboardUpdater,
  setupGameCompletionListener,
  showToast
}; 