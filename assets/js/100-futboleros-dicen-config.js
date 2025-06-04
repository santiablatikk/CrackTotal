// Configuración específica para 100 Futboleros Dicen
export const FUTBOLEROS_DICEN_CONFIG = {
    // Configuración del juego
    GAME_SETTINGS: {
        MIN_PLAYERS: 2,
        MAX_PLAYERS: 8,
        MAX_ROUNDS: 5,
        TURN_TIME_LIMIT: 30, // segundos
        MAX_STRIKES: 3,
        POINTS_PER_ANSWER: {
            1: 100, // Respuesta más popular
            2: 80,  // Segunda respuesta
            3: 60,  // Tercera respuesta
            4: 40,  // Cuarta respuesta
            5: 20   // Quinta respuesta
        }
    },

    // Configuración de Firebase
    FIREBASE_COLLECTIONS: {
        ROOMS: 'futbolerosDicen_rooms',
        PLAYERS: 'futbolerosDicen_players',
        GAME_STATES: 'futbolerosDicen_gameStates',
        STATISTICS: 'futbolerosDicen_stats'
    },

    // Configuración de logros específicos
    ACHIEVEMENTS: {
        FIRST_GAME: {
            id: 'futboleros_first_game',
            name: 'Primer Futbolero',
            description: 'Juega tu primera partida de 100 Futboleros Dicen',
            icon: 'fas fa-microphone-alt',
            points: 50
        },
        PERFECT_ROUND: {
            id: 'futboleros_perfect_round',
            name: 'Ronda Perfecta',
            description: 'Completa una ronda sin fallos',
            icon: 'fas fa-star',
            points: 100
        },
        TEAM_PLAYER: {
            id: 'futboleros_team_player',
            name: 'Jugador de Equipo',
            description: 'Gana 5 partidas en equipo',
            icon: 'fas fa-users',
            points: 200
        },
        QUICK_THINKER: {
            id: 'futboleros_quick_thinker',
            name: 'Pensamiento Rápido',
            description: 'Responde correctamente en menos de 10 segundos',
            icon: 'fas fa-bolt',
            points: 75
        },
        ROOM_MASTER: {
            id: 'futboleros_room_master',
            name: 'Maestro de Salas',
            description: 'Crea 10 salas de juego',
            icon: 'fas fa-crown',
            points: 150
        },
        SOCIAL_BUTTERFLY: {
            id: 'futboleros_social_butterfly',
            name: 'Mariposa Social',
            description: 'Juega con 20 jugadores diferentes',
            icon: 'fas fa-heart',
            points: 300
        }
    },

    // Configuración de estadísticas
    STATISTICS: {
        GAMES_PLAYED: 'futboleros_games_played',
        GAMES_WON: 'futboleros_games_won',
        TOTAL_POINTS: 'futboleros_total_points',
        CORRECT_ANSWERS: 'futboleros_correct_answers',
        ROOMS_CREATED: 'futboleros_rooms_created',
        PERFECT_ROUNDS: 'futboleros_perfect_rounds',
        QUICK_ANSWERS: 'futboleros_quick_answers',
        UNIQUE_PLAYERS: 'futboleros_unique_players'
    },

    // Configuración de eventos
    EVENTS: {
        ROOM_CREATED: 'roomCreated',
        PLAYER_JOINED: 'playerJoined',
        GAME_STARTED: 'gameStarted',
        ROUND_COMPLETED: 'roundCompleted',
        GAME_ENDED: 'gameEnded',
        ACHIEVEMENT_UNLOCKED: 'achievementUnlocked'
    },

    // Configuración de sonidos
    SOUNDS: {
        CORRECT_ANSWER: 'correctAnswerSound',
        WRONG_ANSWER: 'wrongAnswerSound',
        REVEAL_ANSWER: 'revealAnswerSound',
        GAME_WIN: 'gameWinSound',
        NOTIFICATION: 'notificationSound'
    },

    // Configuración de UI
    UI: {
        ANIMATION_DURATION: 300,
        LOADING_DELAY: 1500,
        NOTIFICATION_DURATION: 3000,
        AUTO_SAVE_INTERVAL: 30000 // 30 segundos
    }
};

// Funciones de utilidad para el juego
export const FUTBOLEROS_DICEN_UTILS = {
    // Generar ID único para sala
    generateRoomId: () => {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    },

    // Generar ID único para jugador
    generatePlayerId: () => {
        return 'player_' + Math.random().toString(36).substr(2, 12) + Date.now();
    },

    // Validar nombre de jugador
    validatePlayerName: (name) => {
        return name && name.trim().length >= 2 && name.trim().length <= 20;
    },

    // Validar código de sala
    validateRoomId: (roomId) => {
        return roomId && /^[A-Z0-9]{6}$/.test(roomId.trim());
    },

    // Calcular similitud entre strings (para respuestas)
    calculateSimilarity: (str1, str2) => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        const editDistance = FUTBOLEROS_DICEN_UTILS.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    },

    // Distancia de Levenshtein
    levenshteinDistance: (str1, str2) => {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    },

    // Formatear tiempo
    formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // Obtener color del equipo
    getTeamColor: (team) => {
        return team === 'A' ? '#3498db' : '#e74c3c';
    },

    // Validar configuración de sala
    validateRoomConfig: (config) => {
        return config.maxPlayers >= FUTBOLEROS_DICEN_CONFIG.GAME_SETTINGS.MIN_PLAYERS &&
               config.maxPlayers <= FUTBOLEROS_DICEN_CONFIG.GAME_SETTINGS.MAX_PLAYERS;
    }
};

// Integración con sistema de logros
export const FUTBOLEROS_DICEN_ACHIEVEMENTS = {
    // Verificar y desbloquear logros
    checkAchievements: async (gameData, playerStats) => {
        const achievements = [];
        
        // Primer juego
        if (playerStats.gamesPlayed === 1) {
            achievements.push(FUTBOLEROS_DICEN_CONFIG.ACHIEVEMENTS.FIRST_GAME);
        }

        // Ronda perfecta
        if (gameData.perfectRound) {
            achievements.push(FUTBOLEROS_DICEN_CONFIG.ACHIEVEMENTS.PERFECT_ROUND);
        }

        // Jugador de equipo
        if (playerStats.gamesWon >= 5) {
            achievements.push(FUTBOLEROS_DICEN_CONFIG.ACHIEVEMENTS.TEAM_PLAYER);
        }

        // Pensamiento rápido
        if (gameData.quickAnswer) {
            achievements.push(FUTBOLEROS_DICEN_CONFIG.ACHIEVEMENTS.QUICK_THINKER);
        }

        // Maestro de salas
        if (playerStats.roomsCreated >= 10) {
            achievements.push(FUTBOLEROS_DICEN_CONFIG.ACHIEVEMENTS.ROOM_MASTER);
        }

        // Mariposa social
        if (playerStats.uniquePlayers >= 20) {
            achievements.push(FUTBOLEROS_DICEN_CONFIG.ACHIEVEMENTS.SOCIAL_BUTTERFLY);
        }

        return achievements;
    },

    // Actualizar estadísticas del jugador
    updatePlayerStats: (playerId, gameData) => {
        const stats = JSON.parse(localStorage.getItem(`futboleros_stats_${playerId}`) || '{}');
        
        stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
        if (gameData.won) stats.gamesWon = (stats.gamesWon || 0) + 1;
        stats.totalPoints = (stats.totalPoints || 0) + gameData.points;
        stats.correctAnswers = (stats.correctAnswers || 0) + gameData.correctAnswers;
        if (gameData.roomCreated) stats.roomsCreated = (stats.roomsCreated || 0) + 1;
        if (gameData.perfectRound) stats.perfectRounds = (stats.perfectRounds || 0) + 1;
        if (gameData.quickAnswer) stats.quickAnswers = (stats.quickAnswers || 0) + 1;
        
        // Actualizar jugadores únicos
        const uniquePlayers = new Set(stats.uniquePlayersSet || []);
        if (gameData.otherPlayers) {
            gameData.otherPlayers.forEach(player => uniquePlayers.add(player));
        }
        stats.uniquePlayersSet = Array.from(uniquePlayers);
        stats.uniquePlayers = uniquePlayers.size;
        
        localStorage.setItem(`futboleros_stats_${playerId}`, JSON.stringify(stats));
        return stats;
    }
}; 