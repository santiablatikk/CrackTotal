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
 * CrackTotal - Game Completion Handler
 * Este archivo se encarga de manejar la actualización de logros cuando un juego termina
 */

// Se ejecuta cuando el documento está listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Game Completion Handler cargado');
    
    // Verificar si venimos de terminar un juego
    const fromGame = new URLSearchParams(window.location.search).get('fromGame');
    
    if (fromGame === 'true') {
        console.log('Detectada redirección desde el juego. Procesando datos de partida.');
        processGameCompletion();
    }
});

/**
 * Procesa la finalización de un juego y desbloquea logros
 */
function processGameCompletion() {
    // Intentar obtener datos de la última partida
    try {
        const lastGameStatsStr = localStorage.getItem('lastGameStats');
        
        if (!lastGameStatsStr) {
            console.log('No se encontraron datos de la última partida');
            return;
        }
        
        const gameStats = JSON.parse(lastGameStatsStr);
        console.log('Datos de la última partida:', gameStats);
        
        // Desbloquear logros basados en los datos de la partida
        unlockAchievementsBasedOnGame(gameStats);
        
        // Después de procesar, eliminar los datos para evitar procesamiento duplicado
        localStorage.removeItem('lastGameStats');
        
    } catch (error) {
        console.error('Error al procesar la finalización del juego:', error);
    }
}

/**
 * Desbloquea logros basados en los datos de la partida
 * @param {Object} gameStats - Datos de la partida completada
 */
function unlockAchievementsBasedOnGame(gameStats) {
    // Verificar si la función global de desbloqueo existe
    if (typeof window.unlockAchievement !== 'function') {
        console.error('La función de desbloqueo de logros no está disponible');
        return;
    }
    
    // Desbloquear logro de primer juego
    unlockAchievement('first_game');
    
    // Si es victoria, desbloquear logro correspondiente
    if (gameStats.endCondition === 'victory') {
        console.log('Victoria detectada, desbloqueando logros correspondientes');
        
        // Si es un juego perfecto (sin errores)
        if (gameStats.incorrect === 0) {
            console.log('Juego perfecto detectado');
            unlockAchievement('perfect_game');
        }
        
        // Otros logros basados en condiciones de victoria
        const totalAnswers = gameStats.correct + gameStats.incorrect + gameStats.skipped;
        if (totalAnswers >= 20) {
            unlockAchievement('completion_master');
        }
    }
    
    // Desbloquear logros basados en respuestas correctas
    if (gameStats.correct >= 5) {
        unlockAchievement('streak_5');
    }
    
    if (gameStats.correct >= 10) {
        unlockAchievement('streak_10');
    }
    
    // Comprobar la hora del día para desbloquear logros específicos por tiempo
    const currentHour = new Date().getHours();
    
    // Jugador nocturno (entre las 11pm y 5am)
    if (currentHour >= 23 || currentHour < 5) {
        unlockAchievement('night_owl');
    }
    
    // Jugador madrugador (entre las 5am y 8am)
    if (currentHour >= 5 && currentHour < 8) {
        unlockAchievement('early_bird');
    }
    
    // Actualizar la interfaz del dashboard si estamos en la pestaña de logros
    updateAchievementsUIIfVisible();
}

/**
 * Actualiza la UI de logros si la pestaña está visible
 */
function updateAchievementsUIIfVisible() {
    const achievementsTab = document.querySelector('.tab[data-tab="achievements"]');
    
    if (achievementsTab && achievementsTab.classList.contains('active')) {
        console.log('Actualizando UI de logros');
        
        // Si existe la función loadAchievements de logros.html, usarla
        if (typeof loadAchievements === 'function') {
            loadAchievements('all');
        }
        // Si estamos en el dashboard y existe loadAchievementsData, usarla
        else if (typeof loadAchievementsData === 'function') {
            const currentGame = window.currentGame || 'pasala-che';
            loadAchievementsData(currentGame);
        }
    }
} 