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
        LETTER_STATS: 'pasalaChe_letterStats',
        ACHIEVEMENTS: 'pasalaChe_achievements' // Nueva clave para logros
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
        CATEGORY_STATS: 'quienSabe_categoryStats',
        ACHIEVEMENTS: 'quienSabe_achievements' // Nueva clave para logros
    }
};

// Sistema de logros
if (!window.GAME_ACHIEVEMENTS) {
  window.GAME_ACHIEVEMENTS = {
    victory_first: {
      id: 'victory_first',
      title: 'Primera Victoria',
      description: 'Completaste tu primer rosco con éxito.',
      icon: 'fas fa-trophy',
      type: 'victory',
      condition: (stats) => stats.result === 'victory'
    },
    perfect_game: {
      id: 'perfect_game',
      title: 'Perfección',
      description: 'Completaste un rosco sin errores ni pasadas.',
      icon: 'fas fa-star',
      type: 'perfect',
      condition: (stats) => stats.perfectGame && stats.result === 'victory'
    },
    speed_demon: {
      id: 'speed_demon',
      title: 'Velocista',
      description: 'Completaste un rosco en menos de la mitad del tiempo asignado.',
      icon: 'fas fa-bolt',
      type: 'fast',
      condition: (stats) => stats.result === 'victory' && stats.totalTimePlayed < (stats.maxTimeLimit * 0.5)
    },
    no_hints: {
      id: 'no_hints',
      title: 'Sin Ayuda',
      description: 'Completaste un rosco sin usar ninguna pista.',
      icon: 'fas fa-lightbulb',
      type: 'noHelp',
      condition: (stats) => stats.noHelp && stats.result === 'victory'
    },
    hardcore: {
      id: 'hardcore',
      title: 'Nivel Experto',
      description: 'Ganaste en modo difícil.',
      icon: 'fas fa-fire',
      type: 'hard',
      condition: (stats) => stats.result === 'victory' && stats.difficulty === 'dificil'
    },
    almost_there: {
      id: 'almost_there',
      title: 'Casi Perfecto',
      description: 'Se acabó el tiempo, pero respondiste más del 70% correctamente.',
      icon: 'fas fa-hourglass-end',
      type: 'perseverance',
      condition: (stats) => stats.result === 'timeout' && stats.correctAnswers > (stats.remainingQuestions + stats.correctAnswers) * 0.7
    },
    try_again: {
      id: 'try_again',
      title: 'Nunca Te Rindas',
      description: 'Perdiste, pero no te des por vencido.',
      icon: 'fas fa-redo',
      type: 'defeat',
      condition: (stats) => stats.result === 'defeat'
    }
  };
}

// Objeto principal que contiene las funciones de datos del juego
const GameData = {
    // Exponer la lista de logros
    GAME_ACHIEVEMENTS: GAME_ACHIEVEMENTS,
    
    /**
     * Obtiene los logros desbloqueados por el jugador
     * @returns {Array} Array con los IDs de los logros desbloqueados
     */
    getUnlockedAchievements: function() {
        try {
            let allAchievements = [];
            
            // Primero intentar obtener del nuevo formato de array
            const pasalaCheArrayAchievements = localStorage.getItem(STORAGE_KEYS.PASALA_CHE.ACHIEVEMENTS + '_array');
            if (pasalaCheArrayAchievements) {
                const pasalaCheArrayUnlocked = JSON.parse(pasalaCheArrayAchievements);
                if (Array.isArray(pasalaCheArrayUnlocked) && pasalaCheArrayUnlocked.length > 0) {
                    allAchievements = [...pasalaCheArrayUnlocked];
                    console.log('Logros obtenidos del formato array:', allAchievements);
                    return allAchievements;
                }
            }
            
            // Si no encontramos nada en el nuevo formato, probamos con el formato antiguo
            // Obtener logros desbloqueados de PASALA CHE formato objeto
            const pasalaCheAchievements = localStorage.getItem(STORAGE_KEYS.PASALA_CHE.ACHIEVEMENTS);
            if (pasalaCheAchievements) {
                try {
                    const pasalaCheObj = JSON.parse(pasalaCheAchievements);
                    // Si es un objeto, extraer las claves como IDs de logros
                    if (pasalaCheObj && typeof pasalaCheObj === 'object' && !Array.isArray(pasalaCheObj)) {
                        const pasalaCheUnlocked = Object.keys(pasalaCheObj);
                        if (pasalaCheUnlocked.length > 0) {
                            allAchievements = [...pasalaCheUnlocked];
                            console.log('Logros obtenidos del formato objeto:', allAchievements);
                            
                            // Guardar en el nuevo formato para próximas consultas
                            this.migrateAchievementsToArray(allAchievements);
                            
                            return allAchievements;
                        }
                    }
                    // Si es un array, usarlo directamente
                    else if (Array.isArray(pasalaCheObj) && pasalaCheObj.length > 0) {
                        allAchievements = [...pasalaCheObj];
                        console.log('Logros obtenidos del formato array en clave antigua:', allAchievements);
                        
                        // Guardar en el nuevo formato para próximas consultas
                        this.migrateAchievementsToArray(allAchievements);
                        
                        return allAchievements;
                    }
                } catch (e) {
                    console.error('Error al analizar logros de PASALA CHE:', e);
                }
            }
            
            // Obtener logros desbloqueados de QUIÉN SABE MÁS
            const quienSabeAchievements = localStorage.getItem(STORAGE_KEYS.QUIEN_SABE.ACHIEVEMENTS);
            const quienSabeUnlocked = quienSabeAchievements ? JSON.parse(quienSabeAchievements) : [];
            
            // Combinar con los encontrados hasta ahora
            if (quienSabeUnlocked.length > 0) {
                allAchievements = [...allAchievements, ...quienSabeUnlocked];
            }
            
            // Eliminar duplicados y devolver
            return [...new Set(allAchievements)];
            
        } catch (error) {
            console.error('Error al obtener logros desbloqueados:', error);
            return [];
        }
    },
    
    /**
     * Migra los logros al nuevo formato de array
     * @param {Array} achievementIds IDs de logros a migrar
     * @private
     */
    migrateAchievementsToArray: function(achievementIds) {
        if (!Array.isArray(achievementIds) || achievementIds.length === 0) return;
        
        try {
            localStorage.setItem(STORAGE_KEYS.PASALA_CHE.ACHIEVEMENTS + '_array', JSON.stringify(achievementIds));
            console.log('Logros migrados al nuevo formato array:', achievementIds);
        } catch (error) {
            console.error('Error al migrar logros al formato array:', error);
        }
    },
    
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
    },

    /**
     * Actualiza las estadísticas de Pasala Che después de una partida
     * @param {Object} gameResult - Resultados de la partida
     * @param {boolean} gameResult.victory - Si la partida fue ganada
     * @param {number} gameResult.correctAnswers - Número de respuestas correctas
     * @param {number} gameResult.timeLeft - Tiempo restante al finalizar
     * @param {number} gameResult.score - Puntaje obtenido
     * @param {boolean} gameResult.perfect - Si fue una partida perfecta (sin errores)
     * @returns {boolean} - Éxito de la operación
     */
    updatePasalaCheStats: function(gameResult) {
        console.log('[Debug] updatePasalaCheStats - Processing game result:', gameResult);
        
        try {
            // Obtener datos actuales
            let userData;
            try {
                userData = Utils.getUserData();
                console.log('[Debug] updatePasalaCheStats - Got userData:', userData ? 'success' : 'undefined/null');
            } catch (dataError) {
                console.error('[Debug] updatePasalaCheStats - Error getting user data:', dataError);
                // Crear un nuevo objeto userData si no existe
                userData = {
                    stats: {},
                    games: {},
                    achievements: []
                };
                console.log('[Debug] updatePasalaCheStats - Created new userData object');
            }
            
            // Asegurar que existe la estructura de datos
            if (!userData.stats) userData.stats = {};
            if (!userData.stats.pasalache) userData.stats.pasalache = {};
            if (!userData.games) userData.games = {};
            if (!userData.games.pasalache) userData.games.pasalache = [];
            
            console.log('[Debug] updatePasalaCheStats - Data structure verified');
            
            // Referencia a las estadísticas para simplificar
            const stats = userData.stats.pasalache;
            
            // Actualizar estadísticas generales
            stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
            stats.wins = (stats.wins || 0) + (gameResult.victory ? 1 : 0);
            stats.totalCorrect = (stats.totalCorrect || 0) + gameResult.correctAnswers;
            
            // Actualizar máximo de letras correctas
            if (!stats.maxCorrect || gameResult.correctAnswers > stats.maxCorrect) {
                stats.maxCorrect = gameResult.correctAnswers;
            }
            
            // Actualizar mejor tiempo (solo si ganó)
            if (gameResult.victory && (!stats.bestTime || gameResult.timeLeft > stats.bestTime)) {
                stats.bestTime = gameResult.timeLeft;
            }
            
            // Actualizar juegos perfectos
            if (gameResult.perfect) {
                stats.perfectGames = (stats.perfectGames || 0) + 1;
            }
            
            console.log('[Debug] updatePasalaCheStats - Stats updated:', stats);
            
            // Preparar objeto de partida para el historial
            const gameData = {
                date: new Date().toISOString(),
                victory: gameResult.victory,
                timeLeft: gameResult.timeLeft,
                score: gameResult.score || 0,
                correctAnswers: gameResult.correctAnswers
            };
            
            // Guardar partida en historial
            userData.games.pasalache.unshift(gameData);
            
            // Mantener solo últimas 20 partidas
            if (userData.games.pasalache.length > 20) {
                userData.games.pasalache = userData.games.pasalache.slice(0, 20);
            }
            
            // Verificar y actualizar logros
            this.checkPasalaCheAchievements(userData, gameResult);
            
            // Guardar cambios
            const saveResult = Utils.saveUserData(userData);
            console.log('[Debug] updatePasalaCheStats - Save operation result:', saveResult);
            
            if (saveResult) {
                // Establecer bandera para actualizar perfil
                localStorage.setItem('gameJustCompleted', 'true');
                localStorage.setItem('lastGameCompletionTimestamp', Date.now().toString());
                console.log('[Debug] updatePasalaCheStats - Profile update flag set');
                
                // Disparar evento
                const event = new CustomEvent('gameDataSaved', { 
                    detail: { gameType: 'pasalaChe', timestamp: Date.now() } 
                });
                document.dispatchEvent(event);
            }
            
            return saveResult;
        } catch (error) {
            console.error("[Debug] Error updating Pasala Che stats:", error);
            return false;
        }
    },
    
    /**
     * Actualiza las estadísticas de "¿Quién Sabe Más?" después de una partida
     * @param {Object} gameResult - Resultados de la partida
     * @param {string} gameResult.level - Nivel de dificultad
     * @param {number} gameResult.correctAnswers - Número de respuestas correctas
     * @param {number} gameResult.totalQuestions - Total de preguntas
     * @param {number} gameResult.score - Puntaje obtenido
     * @param {number} gameResult.writtenAnswers - Respuestas escritas (opcional)
     * @param {number} gameResult.fiftyFiftyUsed - Comodines 50/50 usados (opcional)
     * @returns {boolean} - Éxito de la operación
     */
    updateQuienSabeStats: function(gameResult) {
        try {
            // Obtener datos actuales
            const userData = Utils.getUserData();
            
            // Asegurar que existe la estructura de datos
            if (!userData.stats) userData.stats = {};
            if (!userData.stats.quiensabe) userData.stats.quiensabe = {};
            if (!userData.games) userData.games = {};
            if (!userData.games.quiensabe) userData.games.quiensabe = [];
            
            // Referencia a las estadísticas para simplificar
            const stats = userData.stats.quiensabe;
            
            // Actualizar estadísticas generales
            stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
            
            // Actualizar puntaje máximo
            if (!stats.highScore || gameResult.score > stats.highScore) {
                stats.highScore = gameResult.score;
            }
            
            // Actualizar puntaje total
            stats.totalScore = (stats.totalScore || 0) + gameResult.score;
            
            // Actualizar respuestas correctas
            stats.totalCorrect = (stats.totalCorrect || 0) + gameResult.correctAnswers;
            
            // Actualizar respuestas escritas
            if (gameResult.writtenAnswers) {
                stats.writtenAnswers = (stats.writtenAnswers || 0) + gameResult.writtenAnswers;
            }
            
            // Actualizar comodines usados
            if (gameResult.fiftyFiftyUsed) {
                stats.fiftyFiftyUsed = (stats.fiftyFiftyUsed || 0) + gameResult.fiftyFiftyUsed;
            }
            
            // Guardar partida en historial
            userData.games.quiensabe.unshift({
                date: new Date().toISOString(),
                level: gameResult.level || 'Normal',
                correctAnswers: gameResult.correctAnswers,
                totalQuestions: gameResult.totalQuestions,
                score: gameResult.score,
                writtenAnswers: gameResult.writtenAnswers || 0,
                fiftyFiftyUsed: gameResult.fiftyFiftyUsed || 0
            });
            
            // Mantener solo últimas 20 partidas
            if (userData.games.quiensabe.length > 20) {
                userData.games.quiensabe = userData.games.quiensabe.slice(0, 20);
            }
            
            // Verificar y actualizar logros
            this.checkQuienSabeAchievements(userData, gameResult);
            
            // Guardar cambios
            return Utils.saveUserData(userData);
        } catch (error) {
            console.error("Error actualizando estadísticas de ¿Quién Sabe Más?:", error);
            return false;
        }
    },
    
    /**
     * Verifica y actualiza los logros de Pasala Che
     * @param {Object} userData - Datos completos del usuario
     * @param {Object} gameResult - Resultados de la partida actual
     */
    checkPasalaCheAchievements: function(userData, gameResult) {
        // Asegurar que existe el array de logros
        if (!userData.achievements) userData.achievements = [];
        
        // Lista de logros posibles para Pasala Che
        const achievements = [
            {
                id: 'pasalache_win_1',
                condition: () => userData.stats.pasalache.wins >= 1,
                description: 'Debut Ganador (Pasala Che)'
            },
            {
                id: 'pasalache_perfect_1',
                condition: () => userData.stats.pasalache.perfectGames >= 1,
                description: '¡Perfecto! (Pasala Che)'
            },
            {
                id: 'pasalache_streak_3',
                condition: () => {
                    // Verificar si las últimas 3 partidas fueron victorias
                    const games = userData.games.pasalache;
                    return games.length >= 3 && 
                           games[0].victory && 
                           games[1].victory && 
                           games[2].victory;
                },
                description: 'Racha Ganadora'
            },
            {
                id: 'pasalache_speed_30',
                condition: () => gameResult.victory && gameResult.timeLeft >= 30,
                description: 'Rápido y Preciso'
            },
            {
                id: 'pasalache_games_10',
                condition: () => userData.stats.pasalache.gamesPlayed >= 10,
                description: 'Jugador Fiel'
            }
        ];
        
        // Verificar cada logro
        achievements.forEach(achievement => {
            // Verificar si ya tiene el logro
            const hasAchievement = userData.achievements.some(a => a.id === achievement.id);
            
            // Si no lo tiene y cumple la condición, agregarlo
            if (!hasAchievement && achievement.condition()) {
                userData.achievements.push({
                    id: achievement.id,
                    date: new Date().toISOString(),
                    name: achievement.description
                });
                
                // Notificar por consola (para depuración)
                console.log(`¡Logro desbloqueado!: ${achievement.description}`);
            }
        });
        
        // También verificar logros globales
        this.checkGlobalAchievements(userData);
    },
    
    /**
     * Verifica y actualiza los logros de ¿Quién Sabe Más?
     * @param {Object} userData - Datos completos del usuario
     * @param {Object} gameResult - Resultados de la partida actual
     */
    checkQuienSabeAchievements: function(userData, gameResult) {
        // Asegurar que existe el array de logros
        if (!userData.achievements) userData.achievements = [];
        
        // Lista de logros posibles para ¿Quién Sabe Más?
        const achievements = [
            {
                id: 'quien_sabe_win_1',
                condition: () => gameResult.score > 0,
                description: 'Debut Victorioso (¿QS+?)'
            },
            {
                id: 'quien_sabe_100k',
                condition: () => gameResult.score >= 100000 || userData.stats.quiensabe.highScore >= 100000,
                description: 'Club de los 100k (¿QS+?)'
            },
            {
                id: 'quien_sabe_perfect',
                condition: () => gameResult.correctAnswers === gameResult.totalQuestions && gameResult.totalQuestions > 0,
                description: 'Sin Fallos (¿QS+?)'
            },
            {
                id: 'quien_sabe_streak_5',
                condition: () => {
                    // Este logro requeriría lógica adicional para rastrear respuestas consecutivas
                    // Simplificado para este ejemplo
                    return gameResult.correctAnswers >= 5;
                },
                description: 'Racha Intelectual'
            },
            {
                id: 'quien_sabe_games_10',
                condition: () => userData.stats.quiensabe.gamesPlayed >= 10,
                description: 'Sabio Veterano'
            },
            {
                id: 'quien_sabe_million',
                condition: () => gameResult.score >= 1000000 || userData.stats.quiensabe.highScore >= 1000000,
                description: 'Millonario'
            }
        ];
        
        // Verificar cada logro
        achievements.forEach(achievement => {
            // Verificar si ya tiene el logro
            const hasAchievement = userData.achievements.some(a => a.id === achievement.id);
            
            // Si no lo tiene y cumple la condición, agregarlo
            if (!hasAchievement && achievement.condition()) {
                userData.achievements.push({
                    id: achievement.id,
                    date: new Date().toISOString(),
                    name: achievement.description
                });
                
                // Notificar por consola (para depuración)
                console.log(`¡Logro desbloqueado!: ${achievement.description}`);
            }
        });
        
        // También verificar logros globales
        this.checkGlobalAchievements(userData);
    },
    
    /**
     * Verifica y actualiza logros globales (que aplican a todos los juegos)
     * @param {Object} userData - Datos completos del usuario
     */
    checkGlobalAchievements: function(userData) {
        // Asegurar que existe el array de logros
        if (!userData.achievements) userData.achievements = [];
        
        // Calcular total de partidas jugadas en todos los juegos
        let totalGames = 0;
        if (userData.stats.pasalache) totalGames += userData.stats.pasalache.gamesPlayed || 0;
        if (userData.stats.quiensabe) totalGames += userData.stats.quiensabe.gamesPlayed || 0;
        
        // Lista de logros globales
        const achievements = [
            {
                id: 'global_games_10',
                condition: () => totalGames >= 10,
                description: 'Jugador Habitual'
            }
        ];
        
        // Verificar cada logro
        achievements.forEach(achievement => {
            // Verificar si ya tiene el logro
            const hasAchievement = userData.achievements.some(a => a.id === achievement.id);
            
            // Si no lo tiene y cumple la condición, agregarlo
            if (!hasAchievement && achievement.condition()) {
                userData.achievements.push({
                    id: achievement.id,
                    date: new Date().toISOString(),
                    name: achievement.description
                });
                
                // Notificar por consola (para depuración)
                console.log(`¡Logro desbloqueado!: ${achievement.description}`);
            }
        });
    },
    
    /**
     * Desbloquea un logro y lo guarda en localStorage
     * @param {string} achievementId ID del logro a desbloquear
     * @param {boolean} silent Si es true, no muestra notificación
     * @returns {boolean} True si el logro se desbloqueó, false si ya estaba desbloqueado
     */
    unlockAchievement: function(achievementId, silent = false) {
        try {
            // Verificar si el logro existe
            const achievementData = GAME_ACHIEVEMENTS[achievementId];
            if (!achievementData) {
                console.warn(`Logro desconocido: ${achievementId}`);
                return false;
            }
            
            // Obtener logros actuales
            let achievements = this.getAchievements();
            
            // Verificar si ya está desbloqueado
            if (achievements[achievementId]) {
                // Incrementar contador si ya existe
                achievements[achievementId].count = (achievements[achievementId].count || 1) + 1;
                achievements[achievementId].lastUnlocked = new Date().toISOString();
            } else {
                // Agregar nuevo logro
                achievements[achievementId] = {
                    id: achievementId,
                    unlockedAt: new Date().toISOString(),
                    lastUnlocked: new Date().toISOString(),
                    count: 1
                };
                
                // Mostrar notificación si no es silencioso
                if (!silent) {
                    this.showAchievementNotification(achievementData);
                }
            }
            
            // Guardar logros actualizados
            localStorage.setItem(STORAGE_KEYS.PASALA_CHE.ACHIEVEMENTS, JSON.stringify(achievements));
            
            // También guardar en formato array para compatibilidad con getUnlockedAchievements
            this.updateUnlockedAchievementsArray(achievementId);
            
            // Disparar evento de logro desbloqueado
            document.dispatchEvent(new CustomEvent('achievementUnlocked', { 
                detail: { achievement: achievementData }
            }));
            
            return true;
        } catch (error) {
            console.error('Error al desbloquear logro:', error);
            return false;
        }
    },
    
    /**
     * Actualiza el array de logros desbloqueados
     * @param {string} achievementId ID del logro a agregar
     * @private
     */
    updateUnlockedAchievementsArray: function(achievementId) {
        try {
            // Obtener array actual de logros
            const pasalaCheAchievements = localStorage.getItem(STORAGE_KEYS.PASALA_CHE.ACHIEVEMENTS + '_array');
            let pasalaCheUnlocked = pasalaCheAchievements ? JSON.parse(pasalaCheAchievements) : [];
            
            // Verificar si ya existe
            if (!pasalaCheUnlocked.includes(achievementId)) {
                // Agregar el nuevo logro
                pasalaCheUnlocked.push(achievementId);
                // Guardar el array actualizado
                localStorage.setItem(STORAGE_KEYS.PASALA_CHE.ACHIEVEMENTS + '_array', JSON.stringify(pasalaCheUnlocked));
            }
        } catch (error) {
            console.error('Error al actualizar array de logros:', error);
        }
    },
    
    /**
     * Obtiene todos los logros desbloqueados
     * @returns {Object} Objeto con los logros desbloqueados
     */
    getAchievements: function() {
        try {
            const savedAchievements = localStorage.getItem(STORAGE_KEYS.PASALA_CHE.ACHIEVEMENTS);
            return savedAchievements ? JSON.parse(savedAchievements) : {};
        } catch (error) {
            console.error('Error al obtener logros:', error);
            return {};
        }
    },
    
    /**
     * Muestra una notificación de logro desbloqueado
     * @param {Object} achievement Datos del logro
     */
    showAchievementNotification: function(achievement) {
        try {
            // Reproducir sonido si existe
            const achievementSound = document.getElementById('achievement-sound');
            if (achievementSound) {
                achievementSound.play().catch(e => {});
            }
            
            // Crear elemento de notificación
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-icon"><i class="${achievement.icon}"></i></div>
                <div class="achievement-content">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
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
            
            console.log(`¡Logro desbloqueado!: ${achievement.description}`);
        } catch (error) {
            console.error('Error al mostrar notificación de logro:', error);
        }
    },
    
    /**
     * Verificar y desbloquear logros basados en los datos del juego
     * @param {Object} gameData Datos del juego completado
     */
    checkGameAchievements: function(gameData) {
        try {
            console.log('Verificando logros para la partida actual...');
            
            // Verificar logro de primer juego
            const stats = this.getPasalaCheStats();
            if (stats.gamesPlayed <= 1) {
                this.unlockAchievement('first_game');
            }
            
            // Verificar logro de quinto juego
            if (stats.gamesPlayed === 5) {
                this.unlockAchievement('fifth_game');
            }
            
            // Verificar logro de puntuación
            if (gameData.score >= 100) {
                this.unlockAchievement('beginner_score');
            }
            
            // Verificar juego perfecto (sin errores)
            if (gameData.victory && gameData.wrong === 0) {
                this.unlockAchievement('perfect_game');
            }
            
            // Verificar juego rápido (más de 2.5 minutos restantes)
            if (gameData.victory && gameData.remainingTime >= 150) {
                this.unlockAchievement('fast_game');
            }
            
            // Verificar remontada (ganar con 2 errores)
            if (gameData.victory && gameData.wrong === 2) {
                this.unlockAchievement('comeback');
            }
            
            console.log('Verificación de logros completada');
        } catch (error) {
            console.error('Error al verificar logros:', error);
        }
    }
};

// Exponer GameData globalmente
window.GameData = GameData; 
            }
        } catch (error) {
            console.error('Error al actualizar array de logros:', error);
        }
    },
    
    /**
     * Obtiene todos los logros desbloqueados
     * @returns {Object} Objeto con los logros desbloqueados
     */
    getAchievements: function() {
        try {
            const savedAchievements = localStorage.getItem(STORAGE_KEYS.PASALA_CHE.ACHIEVEMENTS);
            return savedAchievements ? JSON.parse(savedAchievements) : {};
        } catch (error) {
            console.error('Error al obtener logros:', error);
            return {};
        }
    },
    
    /**
     * Muestra una notificación de logro desbloqueado
     * @param {Object} achievement Datos del logro
     */
    showAchievementNotification: function(achievement) {
        try {
            // Reproducir sonido si existe
            const achievementSound = document.getElementById('achievement-sound');
            if (achievementSound) {
                achievementSound.play().catch(e => {});
            }
            
            // Crear elemento de notificación
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-icon"><i class="${achievement.icon}"></i></div>
                <div class="achievement-content">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
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
            
            console.log(`¡Logro desbloqueado!: ${achievement.description}`);
        } catch (error) {
            console.error('Error al mostrar notificación de logro:', error);
        }
    },
    
    /**
     * Verificar y desbloquear logros basados en los datos del juego
     * @param {Object} gameData Datos del juego completado
     */
    checkGameAchievements: function(gameData) {
        try {
            console.log('Verificando logros para la partida actual...');
            
            // Verificar logro de primer juego
            const stats = this.getPasalaCheStats();
            if (stats.gamesPlayed <= 1) {
                this.unlockAchievement('first_game');
            }
            
            // Verificar logro de quinto juego
            if (stats.gamesPlayed === 5) {
                this.unlockAchievement('fifth_game');
            }
            
            // Verificar logro de puntuación
            if (gameData.score >= 100) {
                this.unlockAchievement('beginner_score');
            }
            
            // Verificar juego perfecto (sin errores)
            if (gameData.victory && gameData.wrong === 0) {
                this.unlockAchievement('perfect_game');
            }
            
            // Verificar juego rápido (más de 2.5 minutos restantes)
            if (gameData.victory && gameData.remainingTime >= 150) {
                this.unlockAchievement('fast_game');
            }
            
            // Verificar remontada (ganar con 2 errores)
            if (gameData.victory && gameData.wrong === 2) {
                this.unlockAchievement('comeback');
            }
            
            console.log('Verificación de logros completada');
        } catch (error) {
            console.error('Error al verificar logros:', error);
        }
    }
};

// Exponer GameData globalmente
window.GameData = GameData; 