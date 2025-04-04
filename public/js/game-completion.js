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
 