/**
 * CRACK TOTAL - Game Data Manager
 * Este archivo maneja el almacenamiento y recuperación de datos de juego locales
 * para ambos tipos de juego: PASALA CHE y QUIÉN SABE MÁS
 */

// Constantes para las claves de almacenamiento
const STORAGE_KEYS = {
    // Claves para PASALA CHE
    PASALA_CHE: {
        GAMES_PLAYED: 'pasalaChe_gamesPlayed',
        WINS: 'pasalaChe_wins',
        LOSSES: 'pasalaChe_losses',
        ACCURACY: 'pasalaChe_accuracy',
        HIGH_SCORE: 'pasalaChe_highScore',
        AVG_TIME: 'pasalaChe_avgTime',
        HISTORY: 'pasalaChe_history',
        AVG_LETTERS: 'pasalaChe_avgLetters',
        LETTER_STATS: 'pasalaChe_letterStats'
    },
    // Claves para QUIÉN SABE MÁS
    QUIEN_SABE: {
        GAMES_PLAYED: 'quienSabe_gamesPlayed',
        WINS: 'quienSabe_wins',
        LOSSES: 'quienSabe_losses',
        ACCURACY: 'quienSabe_accuracy',
        HIGH_SCORE: 'quienSabe_highScore',
        AVG_TIME: 'quienSabe_avgTime',
        HISTORY: 'quienSabe_history',
        CATEGORY_STATS: 'quienSabe_categoryStats'
    }
};

// Objeto principal que contiene las funciones de datos del juego
const GameData = {
    /**
     * Guarda los datos de una partida completada de PASALA CHE
     * @param {Object} gameData Datos del juego
     * @param {string} gameData.name Nombre del jugador
     * @param {string} gameData.difficulty Dificultad seleccionada
     * @param {number} gameData.score Puntuación total
     * @param {number} gameData.correct Letras correctas
     * @param {number} gameData.wrong Letras incorrectas
     * @param {number} gameData.skipped Letras omitidas
     * @param {number} gameData.timeUsed Tiempo usado
     * @param {boolean} gameData.victory Si el juego fue ganado
     * @param {Array} gameData.letterDetails Detalles de cada letra
     */
    savePasalaCheGame: function(gameData) {
        console.log('Guardando datos de PASALA CHE:', gameData);
        
        try {
            // Obtener estadísticas actuales
            const currentStats = this.getPasalaCheStats();
            
            // Actualizar estadísticas
            const gamesPlayed = currentStats.gamesPlayed + 1;
            const wins = currentStats.wins + (gameData.victory ? 1 : 0);
            const losses = currentStats.losses + (gameData.victory ? 0 : 1);
            
            // Calcular precisión
            const totalLetters = gameData.correct + gameData.wrong;
            const gameAccuracy = totalLetters > 0 ? Math.round((gameData.correct / totalLetters) * 100) : 0;
            
            // Actualizar precisión global (media ponderada)
            const totalAttempts = currentStats.gamesPlayed * (currentStats.accuracy > 0 ? currentStats.accuracy : 0);
            const newAccuracy = Math.round((totalAttempts + gameAccuracy) / gamesPlayed);
            
            // Actualizar tiempo promedio
            const totalTime = currentStats.gamesPlayed * (currentStats.avgTime > 0 ? currentStats.avgTime : 0);
            const newAvgTime = Math.round((totalTime + gameData.timeUsed) / gamesPlayed);
            
            // Actualizar promedio de letras acertadas
            const totalLettersCorrect = currentStats.gamesPlayed * (currentStats.avgLetters > 0 ? currentStats.avgLetters : 0);
            const newAvgLetters = Math.round(((totalLettersCorrect + gameData.correct) / gamesPlayed) * 10) / 10;
            
            // Actualizar record
            const highScore = Math.max(currentStats.highScore, gameData.correct);
            
            // Guardar estadísticas actualizadas
            localStorage.setItem(STORAGE_KEYS.PASALA_CHE.GAMES_PLAYED, gamesPlayed.toString());
            localStorage.setItem(STORAGE_KEYS.PASALA_CHE.WINS, wins.toString());
            localStorage.setItem(STORAGE_KEYS.PASALA_CHE.LOSSES, losses.toString());
            localStorage.setItem(STORAGE_KEYS.PASALA_CHE.ACCURACY, newAccuracy.toString());
            localStorage.setItem(STORAGE_KEYS.PASALA_CHE.HIGH_SCORE, highScore.toString());
            localStorage.setItem(STORAGE_KEYS.PASALA_CHE.AVG_TIME, newAvgTime.toString());
            localStorage.setItem(STORAGE_KEYS.PASALA_CHE.AVG_LETTERS, newAvgLetters.toString());
            
            // Actualizar estadísticas por letra si hay detalles disponibles
            if (gameData.letterDetails && Array.isArray(gameData.letterDetails)) {
                this.updateLetterStats(gameData.letterDetails);
            }
            
            // Guardar en historial
            this.addToGameHistory('pasala-che', gameData);
            
            return true;
        } catch (error) {
            console.error('Error al guardar datos de PASALA CHE:', error);
            return false;
        }
    },
    
    /**
     * Guarda los datos de una partida completada de QUIÉN SABE MÁS
     * @param {Object} gameData Datos del juego
     * @param {string} gameData.name Nombre del jugador
     * @param {string} gameData.difficulty Dificultad seleccionada
     * @param {number} gameData.score Puntuación total
     * @param {number} gameData.correct Respuestas correctas
     * @param {number} gameData.wrong Respuestas incorrectas
     * @param {number} gameData.skipped Preguntas omitidas
     * @param {number} gameData.timeUsed Tiempo usado
     * @param {boolean} gameData.victory Si el juego fue ganado
     * @param {Array} gameData.categoryDetails Detalles por categoría
     */
    saveQuienSabeGame: function(gameData) {
        console.log('Guardando datos de QUIÉN SABE MÁS:', gameData);
        
        try {
            // Obtener estadísticas actuales
            const currentStats = this.getQuienSabeStats();
            
            // Actualizar estadísticas
            const gamesPlayed = currentStats.gamesPlayed + 1;
            const wins = currentStats.wins + (gameData.victory ? 1 : 0);
            const losses = currentStats.losses + (gameData.victory ? 0 : 1);
            
            // Calcular precisión
            const totalQuestions = gameData.correct + gameData.wrong;
            const gameAccuracy = totalQuestions > 0 ? Math.round((gameData.correct / totalQuestions) * 100) : 0;
            
            // Actualizar precisión global (media ponderada)
            const totalAttempts = currentStats.gamesPlayed * (currentStats.accuracy > 0 ? currentStats.accuracy : 0);
            const newAccuracy = Math.round((totalAttempts + gameAccuracy) / gamesPlayed);
            
            // Actualizar tiempo promedio
            const totalTime = currentStats.gamesPlayed * (currentStats.avgTime > 0 ? currentStats.avgTime : 0);
            const newAvgTime = Math.round((totalTime + gameData.timeUsed) / gamesPlayed);
            
            // Actualizar record
            const highScore = Math.max(currentStats.highScore, gameData.score);
            
            // Guardar estadísticas actualizadas
            localStorage.setItem(STORAGE_KEYS.QUIEN_SABE.GAMES_PLAYED, gamesPlayed.toString());
            localStorage.setItem(STORAGE_KEYS.QUIEN_SABE.WINS, wins.toString());
            localStorage.setItem(STORAGE_KEYS.QUIEN_SABE.LOSSES, losses.toString());
            localStorage.setItem(STORAGE_KEYS.QUIEN_SABE.ACCURACY, newAccuracy.toString());
            localStorage.setItem(STORAGE_KEYS.QUIEN_SABE.HIGH_SCORE, highScore.toString());
            localStorage.setItem(STORAGE_KEYS.QUIEN_SABE.AVG_TIME, newAvgTime.toString());
            
            // Actualizar estadísticas por categoría si hay detalles disponibles
            if (gameData.categoryDetails && Array.isArray(gameData.categoryDetails)) {
                this.updateCategoryStats(gameData.categoryDetails);
            }
            
            // Guardar en historial
            this.addToGameHistory('quien-sabe-theme', gameData);
            
            return true;
        } catch (error) {
            console.error('Error al guardar datos de QUIÉN SABE MÁS:', error);
            return false;
        }
    },
    
    /**
     * Actualiza las estadísticas por letra para PASALA CHE
     * @param {Array} letterDetails Detalles de cada letra
     */
    updateLetterStats: function(letterDetails) {
        try {
            // Obtener estadísticas actuales por letra
            let letterStats = {};
            try {
                const savedStats = localStorage.getItem(STORAGE_KEYS.PASALA_CHE.LETTER_STATS);
                if (savedStats) {
                    letterStats = JSON.parse(savedStats);
                }
            } catch (e) {
                console.error('Error al parsear estadísticas por letra:', e);
                letterStats = {};
            }
            
            // Actualizar estadísticas por cada letra en los detalles
            letterDetails.forEach(detail => {
                const letter = detail.letter.toUpperCase();
                if (!letterStats[letter]) {
                    letterStats[letter] = {
                        attempts: 0,
                        correct: 0,
                        accuracy: 0
                    };
                }
                
                letterStats[letter].attempts += 1;
                if (detail.isCorrect) {
                    letterStats[letter].correct += 1;
                }
                
                // Actualizar precisión
                letterStats[letter].accuracy = Math.round(
                    (letterStats[letter].correct / letterStats[letter].attempts) * 100
                );
            });
            
            // Guardar estadísticas actualizadas
            localStorage.setItem(STORAGE_KEYS.PASALA_CHE.LETTER_STATS, JSON.stringify(letterStats));
        } catch (error) {
            console.error('Error al actualizar estadísticas por letra:', error);
        }
    },
    
    /**
     * Actualiza las estadísticas por categoría para QUIÉN SABE MÁS
     * @param {Array} categoryDetails Detalles por categoría
     */
    updateCategoryStats: function(categoryDetails) {
        try {
            // Obtener estadísticas actuales por categoría
            let categoryStats = {};
            try {
                const savedStats = localStorage.getItem(STORAGE_KEYS.QUIEN_SABE.CATEGORY_STATS);
                if (savedStats) {
                    categoryStats = JSON.parse(savedStats);
                }
            } catch (e) {
                console.error('Error al parsear estadísticas por categoría:', e);
                categoryStats = {};
            }
            
            // Actualizar estadísticas por cada categoría en los detalles
            categoryDetails.forEach(detail => {
                const category = detail.category;
                if (!categoryStats[category]) {
                    categoryStats[category] = {
                        attempts: 0,
                        correct: 0,
                        accuracy: 0
                    };
                }
                
                categoryStats[category].attempts += detail.total || 1;
                categoryStats[category].correct += detail.correct || 0;
                
                // Actualizar precisión
                if (categoryStats[category].attempts > 0) {
                    categoryStats[category].accuracy = Math.round(
                        (categoryStats[category].correct / categoryStats[category].attempts) * 100
                    );
                }
            });
            
            // Guardar estadísticas actualizadas
            localStorage.setItem(STORAGE_KEYS.QUIEN_SABE.CATEGORY_STATS, JSON.stringify(categoryStats));
        } catch (error) {
            console.error('Error al actualizar estadísticas por categoría:', error);
        }
    },
    
    /**
     * Añade un juego al historial
     * @param {string} gameType Tipo de juego ('pasala-che' o 'quien-sabe-theme')
     * @param {Object} gameData Datos del juego
     */
    addToGameHistory: function(gameType, gameData) {
        try {
            const historyKey = gameType === 'pasala-che' ? 
                STORAGE_KEYS.PASALA_CHE.HISTORY : 
                STORAGE_KEYS.QUIEN_SABE.HISTORY;
            
            // Obtener historial existente
            let history = [];
            try {
                const savedHistory = localStorage.getItem(historyKey);
                if (savedHistory) {
                    history = JSON.parse(savedHistory);
                    if (!Array.isArray(history)) {
                        history = [];
                    }
                }
            } catch (e) {
                console.error('Error al parsear historial:', e);
                history = [];
            }
            
            // Crear objeto para guardar en historial
            const historyItem = {
                date: new Date().toISOString(),
                score: gameData.score || 0,
                correct: gameData.correct || 0,
                wrong: gameData.wrong || 0,
                skipped: gameData.skipped || 0,
                difficulty: gameData.difficulty || 'normal',
                timeUsed: gameData.timeUsed || 0,
                victory: gameData.victory || false
            };
            
            // Añadir detalles específicos según el tipo de juego
            if (gameType === 'pasala-che' && gameData.letterDetails) {
                historyItem.letterDetails = gameData.letterDetails;
            } else if (gameType === 'quien-sabe-theme' && gameData.categoryDetails) {
                historyItem.categoryDetails = gameData.categoryDetails;
            }
            
            // Añadir al inicio del historial
            history.unshift(historyItem);
            
            // Limitar a 50 juegos
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            // Guardar historial actualizado
            localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (error) {
            console.error('Error al añadir juego al historial:', error);
        }
    },
    
    /**
     * Obtiene las estadísticas actuales para PASALA CHE
     * @returns {Object} Estadísticas
     */
    getPasalaCheStats: function() {
        return {
            gamesPlayed: parseInt(localStorage.getItem(STORAGE_KEYS.PASALA_CHE.GAMES_PLAYED) || '0'),
            wins: parseInt(localStorage.getItem(STORAGE_KEYS.PASALA_CHE.WINS) || '0'),
            losses: parseInt(localStorage.getItem(STORAGE_KEYS.PASALA_CHE.LOSSES) || '0'),
            accuracy: parseInt(localStorage.getItem(STORAGE_KEYS.PASALA_CHE.ACCURACY) || '0'),
            highScore: parseInt(localStorage.getItem(STORAGE_KEYS.PASALA_CHE.HIGH_SCORE) || '0'),
            avgTime: parseInt(localStorage.getItem(STORAGE_KEYS.PASALA_CHE.AVG_TIME) || '0'),
            avgLetters: parseFloat(localStorage.getItem(STORAGE_KEYS.PASALA_CHE.AVG_LETTERS) || '0')
        };
    },
    
    /**
     * Obtiene las estadísticas actuales para QUIÉN SABE MÁS
     * @returns {Object} Estadísticas
     */
    getQuienSabeStats: function() {
        return {
            gamesPlayed: parseInt(localStorage.getItem(STORAGE_KEYS.QUIEN_SABE.GAMES_PLAYED) || '0'),
            wins: parseInt(localStorage.getItem(STORAGE_KEYS.QUIEN_SABE.WINS) || '0'),
            losses: parseInt(localStorage.getItem(STORAGE_KEYS.QUIEN_SABE.LOSSES) || '0'),
            accuracy: parseInt(localStorage.getItem(STORAGE_KEYS.QUIEN_SABE.ACCURACY) || '0'),
            highScore: parseInt(localStorage.getItem(STORAGE_KEYS.QUIEN_SABE.HIGH_SCORE) || '0'),
            avgTime: parseInt(localStorage.getItem(STORAGE_KEYS.QUIEN_SABE.AVG_TIME) || '0')
        };
    },
    
    /**
     * Obtiene el historial para un tipo de juego
     * @param {string} gameType Tipo de juego ('pasala-che' o 'quien-sabe-theme')
     * @returns {Array} Historial de juegos
     */
    getGameHistory: function(gameType) {
        try {
            const historyKey = gameType === 'pasala-che' ? 
                STORAGE_KEYS.PASALA_CHE.HISTORY : 
                STORAGE_KEYS.QUIEN_SABE.HISTORY;
            
            const savedHistory = localStorage.getItem(historyKey);
            if (savedHistory) {
                const history = JSON.parse(savedHistory);
                return Array.isArray(history) ? history : [];
            }
            return [];
        } catch (error) {
            console.error('Error al obtener historial:', error);
            return [];
        }
    },
    
    /**
     * Obtiene las estadísticas por letra para PASALA CHE
     * @returns {Object} Estadísticas por letra
     */
    getLetterStats: function() {
        try {
            const savedStats = localStorage.getItem(STORAGE_KEYS.PASALA_CHE.LETTER_STATS);
            if (savedStats) {
                return JSON.parse(savedStats);
            }
            return {};
        } catch (error) {
            console.error('Error al obtener estadísticas por letra:', error);
            return {};
        }
    },
    
    /**
     * Obtiene las estadísticas por categoría para QUIÉN SABE MÁS
     * @returns {Object} Estadísticas por categoría
     */
    getCategoryStats: function() {
        try {
            const savedStats = localStorage.getItem(STORAGE_KEYS.QUIEN_SABE.CATEGORY_STATS);
            if (savedStats) {
                return JSON.parse(savedStats);
            }
            return {};
        } catch (error) {
            console.error('Error al obtener estadísticas por categoría:', error);
            return {};
        }
    }
};

// Exportar para uso global
window.GameData = GameData; 