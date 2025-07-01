// === SISTEMA MOCK FIREBASE - CRACK TOTAL ===
// Este sistema simula Firebase usando localStorage para desarrollo local
console.log('🎯 Firebase Mock System loaded');

// Datos de ejemplo para el ranking
const SAMPLE_DATA = {
    users: [
        {
            id: 'user_1',
            displayName: 'CrackMaster2024',
            stats: {
                pasalache: { played: 25, wins: 20, score: 15000, correctAnswers: 180, incorrectAnswers: 45 },
                quiensabemas: { gamesPlayed: 15, wins: 12, losses: 3, elo: 1650, totalCorrectAnswers: 145, averageAccuracy: 85 },
                mentiroso: { gamesPlayed: 18, wins: 14, losses: 4, successfulDeceptions: 32, liesDetected: 28, perfectRounds: 6, timeouts: 1, falseAccusations: 3, totalPointsWon: 1850 },
                crackrapido: { played: 30, wins: 28, score: 8500, correctAnswers: 280, bestStreak: 15, totalTime: 1800, completedGames: 28 }
            },
            lastPlayed: new Date()
        },
        {
            id: 'user_2',
            displayName: 'FutbolGenius',
            stats: {
                pasalache: { played: 20, wins: 16, score: 12500, correctAnswers: 155, incorrectAnswers: 35 },
                quiensabemas: { gamesPlayed: 22, wins: 15, losses: 7, elo: 1520, totalCorrectAnswers: 165, averageAccuracy: 82 },
                mentiroso: { gamesPlayed: 16, wins: 11, losses: 5, successfulDeceptions: 25, liesDetected: 22, perfectRounds: 4, timeouts: 2, falseAccusations: 4, totalPointsWon: 1450 },
                crackrapido: { played: 25, wins: 22, score: 7200, correctAnswers: 245, bestStreak: 12, totalTime: 1650, completedGames: 22 }
            },
            lastPlayed: new Date()
        },
        {
            id: 'user_3',
            displayName: 'TriviaKing',
            stats: {
                pasalache: { played: 18, wins: 13, score: 11000, correctAnswers: 140, incorrectAnswers: 40 },
                quiensabemas: { gamesPlayed: 28, wins: 20, losses: 8, elo: 1580, totalCorrectAnswers: 210, averageAccuracy: 88 },
                mentiroso: { gamesPlayed: 12, wins: 8, losses: 4, successfulDeceptions: 18, liesDetected: 16, perfectRounds: 3, timeouts: 1, falseAccusations: 2, totalPointsWon: 1200 },
                crackrapido: { played: 20, wins: 17, score: 6800, correctAnswers: 200, bestStreak: 10, totalTime: 1400, completedGames: 17 }
            },
            lastPlayed: new Date()
        },
        {
            id: 'user_4',
            displayName: 'SpeedDemon',
            stats: {
                pasalache: { played: 15, wins: 10, score: 9500, correctAnswers: 120, incorrectAnswers: 35 },
                quiensabemas: { gamesPlayed: 20, wins: 13, losses: 7, elo: 1480, totalCorrectAnswers: 150, averageAccuracy: 79 },
                mentiroso: { gamesPlayed: 14, wins: 9, losses: 5, successfulDeceptions: 20, liesDetected: 18, perfectRounds: 2, timeouts: 1, falseAccusations: 3, totalPointsWon: 1100 },
                crackrapido: { played: 35, wins: 32, score: 9200, correctAnswers: 320, bestStreak: 18, totalTime: 2100, completedGames: 32 }
            },
            lastPlayed: new Date()
        },
        {
            id: 'user_5',
            displayName: 'MasterLiar',
            stats: {
                pasalache: { played: 12, wins: 8, score: 8000, correctAnswers: 95, incorrectAnswers: 25 },
                quiensabemas: { gamesPlayed: 18, wins: 11, losses: 7, elo: 1420, totalCorrectAnswers: 130, averageAccuracy: 76 },
                mentiroso: { gamesPlayed: 25, wins: 19, losses: 6, successfulDeceptions: 45, liesDetected: 38, perfectRounds: 8, timeouts: 0, falseAccusations: 2, totalPointsWon: 2200 },
                crackrapido: { played: 18, wins: 15, score: 5800, correctAnswers: 180, bestStreak: 8, totalTime: 1200, completedGames: 15 }
            },
            lastPlayed: new Date()
        }
    ],
    matches: [
        {
            id: 'match_1',
            gameType: 'pasalache',
            playerName: 'CrackMaster2024',
            playerUid: 'user_1',
            result: 'victory',
            score: 1500,
            correctAnswers: 12,
            incorrectAnswers: 3,
            timestamp: new Date()
        },
        {
            id: 'match_2',
            gameType: 'quiensabemas',
            playerName: 'TriviaKing',
            playerUid: 'user_3',
            result: 'victory',
            elo: 1580,
            correctAnswers: 8,
            accuracy: 88,
            timestamp: new Date()
        },
        {
            id: 'match_3',
            gameType: 'crackrapido',
            playerName: 'SpeedDemon',
            playerUid: 'user_4',
            completed: true,
            score: 850,
            correctAnswers: 15,
            maxStreak: 8,
            totalTime: 120,
            timestamp: new Date()
        },
        {
            id: 'match_4',
            gameType: 'mentiroso',
            playerName: 'MasterLiar',
            playerUid: 'user_5',
            result: 'victory',
            pointsWon: 180,
            successfulDeceptions: 3,
            liesDetected: 2,
            perfectRounds: 1,
            timestamp: new Date()
        }
    ]
};

// Sistema Mock que reemplaza Firebase
window.CrackTotalFirebase = {
    db: null,
    auth: null,
    initialized: false,
    
    async init() {
        try {
            console.log('🎯 Inicializando sistema Mock (sin Firebase)...');
            
            // Crear datos de ejemplo si no existen
            if (!localStorage.getItem('crackTotal_users')) {
                localStorage.setItem('crackTotal_users', JSON.stringify(SAMPLE_DATA.users));
                console.log('📊 Datos de ejemplo cargados');
            }
            
            if (!localStorage.getItem('crackTotal_matches')) {
                localStorage.setItem('crackTotal_matches', JSON.stringify(SAMPLE_DATA.matches));
                console.log('🎮 Partidas de ejemplo cargadas');
            }
            
            this.initialized = true;
            console.log('✅ Sistema Mock inicializado correctamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando sistema Mock:', error);
            return false;
        }
    },
    
    getUserId() {
        let userId = localStorage.getItem('crackTotalUserId');
        if (!userId) {
            userId = 'mock_user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('crackTotalUserId', userId);
        }
        return userId;
    },
    
    getUserName() {
        return localStorage.getItem('playerName') || 'Jugador Local';
    },
    
    async ensureUserProfile() {
        const userId = this.getUserId();
        const userName = this.getUserName();
        
        try {
            const users = JSON.parse(localStorage.getItem('crackTotal_users') || '[]');
            const existingUser = users.find(u => u.id === userId);
            
            if (!existingUser) {
                console.log('📝 Creando perfil local:', userName);
                const newUser = {
                    id: userId,
                    displayName: userName,
                    stats: {
                        pasalache: { played: 0, wins: 0, score: 0, correctAnswers: 0, incorrectAnswers: 0 },
                        quiensabemas: { gamesPlayed: 0, wins: 0, losses: 0, elo: 1200, totalCorrectAnswers: 0, averageAccuracy: 0 },
                        mentiroso: { gamesPlayed: 0, wins: 0, losses: 0, successfulDeceptions: 0, liesDetected: 0, perfectRounds: 0, timeouts: 0, falseAccusations: 0, totalPointsWon: 0 },
                        crackrapido: { played: 0, wins: 0, score: 0, correctAnswers: 0, bestStreak: 0, totalTime: 0, completedGames: 0 }
                    },
                    createdAt: new Date(),
                    lastPlayed: new Date()
                };
                
                users.push(newUser);
                localStorage.setItem('crackTotal_users', JSON.stringify(users));
            }
            
            return userId;
        } catch (error) {
            console.error('❌ Error asegurando perfil:', error);
            return userId;
        }
    },
    
    async saveGameResult(gameType, gameData) {
        try {
            const userId = await this.ensureUserProfile();
            const userName = this.getUserName();
            
            // Guardar partida
            const matches = JSON.parse(localStorage.getItem('crackTotal_matches') || '[]');
            const newMatch = {
                id: 'match_' + Date.now(),
                gameType: gameType,
                playerName: userName,
                playerUid: userId,
                timestamp: new Date(),
                ...gameData
            };
            
            matches.push(newMatch);
            localStorage.setItem('crackTotal_matches', JSON.stringify(matches));
            
            // Actualizar estadísticas del usuario
            const users = JSON.parse(localStorage.getItem('crackTotal_users') || '[]');
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                const updates = this.buildStatsUpdate(gameType, gameData);
                this.applyUpdates(users[userIndex].stats, updates);
                users[userIndex].lastPlayed = new Date();
                localStorage.setItem('crackTotal_users', JSON.stringify(users));
            }
            
            console.log('✅ Resultado guardado localmente:', gameType);
            return true;
            
        } catch (error) {
            console.error('❌ Error guardando resultado:', error);
            return false;
        }
    },
    
    buildStatsUpdate(gameType, gameData) {
        const updates = {};
        
        switch (gameType) {
            case 'pasalache':
                updates[`${gameType}.played`] = 1;
                updates[`${gameType}.score`] = gameData.score || 0;
                updates[`${gameType}.correctAnswers`] = gameData.correctAnswers || 0;
                updates[`${gameType}.incorrectAnswers`] = gameData.incorrectAnswers || 0;
                if (gameData.result === 'victory') {
                    updates[`${gameType}.wins`] = 1;
                }
                break;
                
            case 'quiensabemas':
                updates[`${gameType}.gamesPlayed`] = 1;
                updates[`${gameType}.elo`] = gameData.elo || 1200;
                updates[`${gameType}.totalCorrectAnswers`] = gameData.correctAnswers || 0;
                updates[`${gameType}.averageAccuracy`] = gameData.accuracy || 0;
                if (gameData.result === 'victory') {
                    updates[`${gameType}.wins`] = 1;
                } else {
                    updates[`${gameType}.losses`] = 1;
                }
                break;
                
            case 'mentiroso':
                updates[`${gameType}.gamesPlayed`] = 1;
                updates[`${gameType}.totalPointsWon`] = gameData.pointsWon || 0;
                updates[`${gameType}.successfulDeceptions`] = gameData.successfulDeceptions || 0;
                updates[`${gameType}.liesDetected`] = gameData.liesDetected || 0;
                updates[`${gameType}.perfectRounds`] = gameData.perfectRounds || 0;
                updates[`${gameType}.timeouts`] = gameData.timeouts || 0;
                updates[`${gameType}.falseAccusations`] = gameData.falseAccusations || 0;
                if (gameData.result === 'victory') {
                    updates[`${gameType}.wins`] = 1;
                } else {
                    updates[`${gameType}.losses`] = 1;
                }
                break;
                
            case 'crackrapido':
                updates[`${gameType}.played`] = 1;
                updates[`${gameType}.score`] = gameData.score || 0;
                updates[`${gameType}.correctAnswers`] = gameData.correctAnswers || 0;
                updates[`${gameType}.totalTime`] = gameData.totalTime || 0;
                if (gameData.maxStreak > 0) {
                    updates[`${gameType}.bestStreak`] = gameData.maxStreak;
                }
                if (gameData.completed) {
                    updates[`${gameType}.completedGames`] = 1;
                    updates[`${gameType}.wins`] = 1;
                }
                break;
        }
        
        return updates;
    },
    
    applyUpdates(stats, updates) {
        for (const [key, value] of Object.entries(updates)) {
            const parts = key.split('.');
            if (parts.length === 2) {
                const [gameType, field] = parts;
                if (!stats[gameType]) stats[gameType] = {};
                
                if (field === 'bestStreak' || field === 'elo' || field === 'averageAccuracy') {
                    stats[gameType][field] = value; // Reemplazar valor
                } else {
                    stats[gameType][field] = (stats[gameType][field] || 0) + value; // Incrementar
                }
            }
        }
    }
};

// Sistema de Rankings Mock
window.CrackTotalRanking = {
    async getRanking(gameType, limit = 15) {
        try {
            const users = JSON.parse(localStorage.getItem('crackTotal_users') || '[]');
            
            const filteredUsers = users
                .filter(user => {
                    const stats = user.stats[gameType];
                    const playedField = this.getPlayedField(gameType, stats);
                    return stats && stats[playedField] > 0;
                })
                .map(user => this.calculateUserStats(user, gameType))
                .sort((a, b) => this.sortUsers(a, b, gameType))
                .slice(0, limit);
            
            return filteredUsers;
            
        } catch (error) {
            console.error('❌ Error obteniendo ranking:', error);
            return [];
        }
    },
    
    async getHistory(gameType, limit = 20) {
        try {
            const matches = JSON.parse(localStorage.getItem('crackTotal_matches') || '[]');
            
            return matches
                .filter(match => match.gameType === gameType)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit)
                .map(match => ({
                    ...match,
                    timestamp: { toDate: () => new Date(match.timestamp) }
                }));
            
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            return [];
        }
    },
    
    getPlayedField(gameType, stats) {
        switch (gameType) {
            case 'pasalache':
            case 'crackrapido':
                return 'played';
            case 'quiensabemas':
            case 'mentiroso':
                return 'gamesPlayed';
            default:
                return 'played';
        }
    },
    
    calculateUserStats(user, gameType) {
        const stats = user.stats[gameType];
        
        const processed = {
            id: user.id,
            displayName: user.displayName || 'Anónimo',
            lastPlayed: user.lastPlayed,
            gameType: gameType,
            stats: stats
        };
        
        switch (gameType) {
            case 'pasalache':
                processed.totalScore = stats.score || 0;
                processed.wins = stats.wins || 0;
                processed.played = stats.played || 0;
                processed.winRate = processed.played > 0 ? (processed.wins / processed.played) * 100 : 0;
                processed.avgScore = processed.played > 0 ? Math.round(processed.totalScore / processed.played) : 0;
                break;
                
            case 'quiensabemas':
                processed.elo = stats.elo || 1200;
                processed.wins = stats.wins || 0;
                processed.losses = stats.losses || 0;
                processed.gamesPlayed = stats.gamesPlayed || 0;
                processed.winRate = processed.gamesPlayed > 0 ? (processed.wins / processed.gamesPlayed) * 100 : 0;
                break;
                
            case 'mentiroso':
                processed.wins = stats.wins || 0;
                processed.losses = stats.losses || 0;
                processed.gamesPlayed = stats.gamesPlayed || 0;
                processed.winRate = processed.gamesPlayed > 0 ? (processed.wins / processed.gamesPlayed) * 100 : 0;
                processed.rating = this.calculateMentirosoRating(stats);
                break;
                
            case 'crackrapido':
                processed.totalScore = stats.score || 0;
                processed.wins = stats.wins || 0;
                processed.played = stats.played || 0;
                processed.completedGames = stats.completedGames || 0;
                processed.completionRate = processed.played > 0 ? (processed.completedGames / processed.played) * 100 : 0;
                processed.bestStreak = stats.bestStreak || 0;
                break;
        }
        
        return processed;
    },
    
    sortUsers(a, b, gameType) {
        switch (gameType) {
            case 'pasalache':
                if (Math.abs(b.winRate - a.winRate) > 1) return b.winRate - a.winRate;
                if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                return b.wins - a.wins;
                
            case 'quiensabemas':
                if (Math.abs(b.elo - a.elo) > 10) return b.elo - a.elo;
                return b.winRate - a.winRate;
                
            case 'mentiroso':
                if (Math.abs(b.winRate - a.winRate) > 1) return b.winRate - a.winRate;
                return b.rating - a.rating;
                
            case 'crackrapido':
                if (Math.abs(b.completionRate - a.completionRate) > 1) return b.completionRate - a.completionRate;
                return b.totalScore - a.totalScore;
                
            default:
                return 0;
        }
    },
    
    calculateMentirosoRating(stats) {
        if (!stats.gamesPlayed) return 0;
        
        const baseScore = (stats.wins * 100) - (stats.losses * 50);
        const bonusScore = (stats.successfulDeceptions * 25) + (stats.liesDetected * 30);
        
        return Math.max(0, baseScore + bonusScore);
    }
};

// Inicialización automática
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎯 Inicializando sistema Mock...');
    
    setTimeout(async () => {
        await window.CrackTotalFirebase.init();
        
        // Funciones de compatibilidad
        window.ensureFirebaseInitialized = () => Promise.resolve({ success: window.CrackTotalFirebase.initialized });
        window.firebaseDb = null; // Mock no necesita esto
        window.db = null; // Mock no necesita esto
        
        console.log('✅ Sistema Mock listo');
        window.dispatchEvent(new CustomEvent('firebaseReady'));
    }, 500);
});

// Funciones globales
window.saveGameResult = (gameType, gameData) => window.CrackTotalFirebase.saveGameResult(gameType, gameData);
window.getRanking = (gameType, limit) => window.CrackTotalRanking.getRanking(gameType, limit);
window.getHistory = (gameType, limit) => window.CrackTotalRanking.getHistory(gameType, limit);

console.log('🎯 Sistema Mock Firebase cargado - Usando datos locales'); 