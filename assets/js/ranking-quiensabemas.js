// Sistema de Ranking mejorado para Quién Sabe Más - Versión compatible
console.log('Ranking Quién Sabe Más script loaded - Sistema corregido v2.0');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

// --- Configuración ---
const RANKING_LIMIT = 15; // Solo mostrar top 15
const HISTORY_LIMIT = 20; // Más partidas en historial

// --- Sistema de Ranking Mejorado para Quien Sabe Más ---

// Configuración del sistema de ranking avanzado
const RANKING_CONFIG = {
    MAX_ENTRIES: 1000,
    STORAGE_KEY: 'qsm_advanced_ranking',
    ACHIEVEMENTS_KEY: 'qsm_achievements',
    STATS_KEY: 'qsm_player_stats',
    
    // Categorías de rendimiento
    PERFORMANCE_TIERS: {
        NOVATO: { min: 0, max: 100, color: '#6b7280', icon: '🥉' },
        AFICIONADO: { min: 101, max: 300, color: '#10b981', icon: '🥈' },
        EXPERTO: { min: 301, max: 600, color: '#f59e0b', icon: '🥇' },
        MAESTRO: { min: 601, max: 1000, color: '#8b5cf6', icon: '💎' },
        LEYENDA: { min: 1001, max: Infinity, color: '#ef4444', icon: '👑' }
    },
    
    // Factores de cálculo de ELO
    ELO_K_FACTOR: 32,
    ELO_BASE: 1200
};

// Sistema de logros avanzado
const ACHIEVEMENTS_SYSTEM = {
    achievements: {
        // Logros de victorias
        'first_win': {
            id: 'first_win',
            name: 'Primera Victoria',
            description: 'Gana tu primera partida',
            icon: '🎉',
            category: 'victorias',
            condition: (stats) => stats.gamesWon >= 1,
            points: 50
        },
        'winning_streak_5': {
            id: 'winning_streak_5',
            name: 'Racha Ganadora',
            description: 'Gana 5 partidas consecutivas',
            icon: '🔥',
            category: 'victorias',
            condition: (stats) => stats.bestWinStreak >= 5,
            points: 150
        },
        'perfectionist': {
            id: 'perfectionist',
            name: 'Perfeccionista',
            description: 'Mantén 90%+ de precisión en 10 partidas',
            icon: '🎯',
            category: 'precision',
            condition: (stats) => stats.highAccuracyGames >= 10,
            points: 250
        },
        'trivia_master': {
            id: 'trivia_master',
            name: 'Maestro del Trivia',
            description: 'Responde correctamente 100 preguntas',
            icon: '🧠',
            category: 'conocimiento',
            condition: (stats) => stats.totalCorrectAnswers >= 100,
            points: 200
        }
    },
    
    // Verificar logros desbloqueados
    checkAchievements(playerStats) {
        const unlockedAchievements = [];
        const currentAchievements = this.getPlayerAchievements(playerStats.playerName);
        
        Object.values(this.achievements).forEach(achievement => {
            if (!currentAchievements[achievement.id] && achievement.condition(playerStats)) {
                unlockedAchievements.push(achievement);
                this.unlockAchievement(playerStats.playerName, achievement);
            }
        });
        
        return unlockedAchievements;
    },
    
    // Desbloquear logro
    unlockAchievement(playerName, achievement) {
        let achievements = JSON.parse(localStorage.getItem(RANKING_CONFIG.ACHIEVEMENTS_KEY) || '{}');
        
        if (!achievements[playerName]) {
            achievements[playerName] = {};
        }
        
        achievements[playerName][achievement.id] = {
            unlockedAt: Date.now(),
            points: achievement.points
        };
        
        localStorage.setItem(RANKING_CONFIG.ACHIEVEMENTS_KEY, JSON.stringify(achievements));
        this.showAchievementNotification(achievement);
    },
    
    // Obtener logros de un jugador
    getPlayerAchievements(playerName) {
        const achievements = JSON.parse(localStorage.getItem(RANKING_CONFIG.ACHIEVEMENTS_KEY) || '{}');
        return achievements[playerName] || {};
    },
    
    // Mostrar notificación de logro
    showAchievementNotification(achievement) {
        console.log(`🏆 ¡Logro desbloqueado! ${achievement.name}: ${achievement.description}`);
    }
};

// Sistema de ranking avanzado
class AdvancedRankingSystem {
    constructor() {
        this.rankings = this.loadRankings();
        this.playerStats = this.loadPlayerStats();
    }
    
    // Cargar rankings desde localStorage
    loadRankings() {
        try {
            const stored = localStorage.getItem(RANKING_CONFIG.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading rankings:', error);
            return [];
        }
    }
    
    // Cargar estadísticas de jugadores
    loadPlayerStats() {
        try {
            const stored = localStorage.getItem(RANKING_CONFIG.STATS_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading player stats:', error);
            return {};
        }
    }
    
    // Guardar rankings
    saveRankings() {
        try {
            localStorage.setItem(RANKING_CONFIG.STORAGE_KEY, JSON.stringify(this.rankings));
        } catch (error) {
            console.error('Error saving rankings:', error);
        }
    }
    
    // Guardar estadísticas de jugadores
    savePlayerStats() {
        try {
            localStorage.setItem(RANKING_CONFIG.STATS_KEY, JSON.stringify(this.playerStats));
        } catch (error) {
            console.error('Error saving player stats:', error);
        }
    }
    
    // Calcular ELO
    calculateEloChange(playerElo, opponentElo, gameResult, kFactor = RANKING_CONFIG.ELO_K_FACTOR) {
        const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
        return Math.round(kFactor * (gameResult - expectedScore));
    }
    
    // Actualizar estadísticas del jugador
    updatePlayerStats(playerName, gameData) {
        if (!this.playerStats[playerName]) {
            this.playerStats[playerName] = this.createNewPlayerStats(playerName);
        }
        
        const stats = this.playerStats[playerName];
        const { 
            score, 
            opponentScore, 
            responseTime, 
            correctAnswers, 
            totalQuestions, 
            gameMode = 'classic',
            speedBonusPoints = 0,
            streakBonusPoints = 0,
            perfectAnswersCount = 0,
            lifelinesUsed = 0
        } = gameData;
        
        // Actualizar estadísticas básicas
        stats.gamesPlayed++;
        stats.totalScore += score;
        stats.totalCorrectAnswers += correctAnswers;
        stats.totalQuestions += totalQuestions;
        
        // Determinar resultado del juego
        const isWin = score > opponentScore;
        const isDraw = score === opponentScore;
        
        if (isWin) {
            stats.gamesWon++;
            stats.currentWinStreak++;
            stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
            
            // Verificar comeback
            if (gameData.wasComeback) {
                stats.comebacks++;
            }
        } else if (isDraw) {
            stats.gamesDrawn++;
            stats.currentWinStreak = 0;
        } else {
            stats.gamesLost++;
            stats.currentWinStreak = 0;
        }
        
        // Actualizar estadísticas de velocidad
        if (responseTime && responseTime.length > 0) {
            const avgTime = responseTime.reduce((a, b) => a + b, 0) / responseTime.length;
            stats.totalResponseTime += avgTime;
            stats.gamesWithResponseTime++;
            
            if (stats.bestGameAvgTime === 0 || avgTime < stats.bestGameAvgTime) {
                stats.bestGameAvgTime = avgTime;
            }
            
            // Contar respuestas rápidas
            const fastAnswers = responseTime.filter(time => time < 2).length;
            stats.fastAnswers += fastAnswers;
        }
        
        // Actualizar estadísticas de precisión
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        if (accuracy >= 90) {
            stats.highAccuracyGames++;
        }
        if (accuracy === 100) {
            stats.perfectGames++;
        }
        
        // Actualizar puntos por bonificaciones
        stats.totalSpeedBonus += speedBonusPoints;
        stats.totalStreakBonus += streakBonusPoints;
        stats.totalPerfectAnswers += perfectAnswersCount;
        stats.totalLifelinesUsed += lifelinesUsed;
        
        // Actualizar ELO
        const opponentElo = gameData.opponentElo || RANKING_CONFIG.ELO_BASE;
        const gameResult = isWin ? 1 : (isDraw ? 0.5 : 0);
        const eloChange = this.calculateEloChange(stats.currentElo, opponentElo, gameResult);
        stats.currentElo += eloChange;
        stats.peakElo = Math.max(stats.peakElo, stats.currentElo);
        
        // Actualizar fecha de última partida
        stats.lastPlayedDate = Date.now();
        
        // Verificar días consecutivos
        const today = new Date().toDateString();
        const lastPlayed = new Date(stats.lastPlayedDate).toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (lastPlayed === today) {
            // Mismo día, no cambiar streak
        } else if (stats.lastConsecutiveDate === yesterday) {
            stats.consecutiveDays++;
            stats.lastConsecutiveDate = today;
        } else {
            stats.consecutiveDays = 1;
            stats.lastConsecutiveDate = today;
        }
        
        // Calcular estadísticas derivadas
        stats.averageScore = stats.gamesPlayed > 0 ? stats.totalScore / stats.gamesPlayed : 0;
        stats.winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0;
        stats.averageAccuracy = stats.totalQuestions > 0 ? (stats.totalCorrectAnswers / stats.totalQuestions) * 100 : 0;
        stats.averageResponseTime = stats.gamesWithResponseTime > 0 ? stats.totalResponseTime / stats.gamesWithResponseTime : 0;
        
        // Determinar tier
        stats.tier = this.calculateTier(stats.currentElo);
        
        this.savePlayerStats();
        
        // Verificar logros
        const newAchievements = ACHIEVEMENTS_SYSTEM.checkAchievements(stats);
        
        return { stats, newAchievements, eloChange };
    }
    
    // Crear estadísticas iniciales para nuevo jugador
    createNewPlayerStats(playerName) {
        return {
            playerName,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            gamesDrawn: 0,
            totalScore: 0,
            averageScore: 0,
            winRate: 0,
            currentWinStreak: 0,
            bestWinStreak: 0,
            comebacks: 0,
            totalCorrectAnswers: 0,
            totalQuestions: 0,
            averageAccuracy: 0,
            fastAnswers: 0,
            highAccuracyGames: 0,
            perfectGames: 0,
            totalResponseTime: 0,
            gamesWithResponseTime: 0,
            averageResponseTime: 0,
            bestGameAvgTime: 0,
            totalSpeedBonus: 0,
            totalStreakBonus: 0,
            totalPerfectAnswers: 0,
            totalLifelinesUsed: 0,
            currentElo: RANKING_CONFIG.ELO_BASE,
            peakElo: RANKING_CONFIG.ELO_BASE,
            tier: 'NOVATO',
            firstPlayedDate: Date.now(),
            lastPlayedDate: Date.now(),
            consecutiveDays: 1,
            lastConsecutiveDate: new Date().toDateString(),
            achievements: []
        };
    }
    
    // Calcular tier basado en ELO
    calculateTier(elo) {
        for (const [tierName, tierData] of Object.entries(RANKING_CONFIG.PERFORMANCE_TIERS)) {
            if (elo >= tierData.min && elo <= tierData.max) {
                return tierName;
            }
        }
        return 'NOVATO';
    }
    
    // Obtener ranking completo ordenado
    getRankings(sortBy = 'winRate', limit = 50) {
        const players = Object.values(this.playerStats);
        
        // Filtrar jugadores con al menos 1 partida
        const validPlayers = players.filter(player => player.gamesPlayed > 0);
        
        // Ordenar según criterio
        validPlayers.sort((a, b) => {
            switch (sortBy) {
                case 'currentElo':
                    return b.currentElo - a.currentElo;
                case 'winRate':
                    return b.winRate - a.winRate;
                case 'averageScore':
                    return b.averageScore - a.averageScore;
                case 'gamesWon':
                    return b.gamesWon - a.gamesWon;
                case 'averageAccuracy':
                    return b.averageAccuracy - a.averageAccuracy;
                case 'averageResponseTime':
                    return a.averageResponseTime - b.averageResponseTime; // Menor es mejor
                default:
                    return b.winRate - a.winRate; // Default cambiado a winRate
            }
        });
        
        return validPlayers.slice(0, limit);
    }
    
    // Obtener estadísticas de un jugador específico
    getPlayerStats(playerName) {
        return this.playerStats[playerName] || null;
    }
    
    // Obtener posición en ranking
    getPlayerRankPosition(playerName, sortBy = 'winRate') {
        const rankings = this.getRankings(sortBy, 1000);
        const position = rankings.findIndex(player => player.playerName === playerName);
        return position >= 0 ? position + 1 : null;
    }
    
    // Exportar datos para backup
    exportData() {
        return {
            rankings: this.rankings,
            playerStats: this.playerStats,
            achievements: JSON.parse(localStorage.getItem(RANKING_CONFIG.ACHIEVEMENTS_KEY) || '{}'),
            exportDate: Date.now()
        };
    }
    
    // Importar datos desde backup
    importData(data) {
        try {
            if (data.playerStats) {
                this.playerStats = data.playerStats;
                this.savePlayerStats();
            }
            if (data.achievements) {
                localStorage.setItem(RANKING_CONFIG.ACHIEVEMENTS_KEY, JSON.stringify(data.achievements));
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
    
    // Limpiar datos antiguos (jugadores inactivos por más de 6 meses)
    cleanupOldData() {
        const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
        let cleanedCount = 0;
        
        Object.keys(this.playerStats).forEach(playerName => {
            const player = this.playerStats[playerName];
            if (player.lastPlayedDate < sixMonthsAgo && player.gamesPlayed < 5) {
                delete this.playerStats[playerName];
                cleanedCount++;
            }
        });
        
        if (cleanedCount > 0) {
            this.savePlayerStats();
            console.log(`Limpiados ${cleanedCount} perfiles inactivos`);
        }
        
        return cleanedCount;
    }
}

// Instancia global del sistema de ranking
window.advancedRankingSystem = new AdvancedRankingSystem();

// Función para registrar resultado de partida (compatible con el sistema existente)
function saveQuienSabeMasResult(gameData) {
    try {
        const result = window.advancedRankingSystem.updatePlayerStats(gameData.playerName, gameData);
        
        // Mostrar notificaciones de logros si hay nuevos
        if (result.newAchievements && result.newAchievements.length > 0) {
            result.newAchievements.forEach(achievement => {
                setTimeout(() => {
                    ACHIEVEMENTS_SYSTEM.showAchievementNotification(achievement);
                }, 1000);
            });
        }
        
        return result;
    } catch (error) {
        console.error('Error saving QSM result:', error);
        return null;
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AdvancedRankingSystem,
        ACHIEVEMENTS_SYSTEM,
        RANKING_CONFIG,
        saveQuienSabeMasResult
    };
}

// --- Función para formatear fecha compacta ---
function formatCompactDate(firebaseTimestamp) {
    if (!firebaseTimestamp) return '---';
    
    let date;
    if (firebaseTimestamp.toDate) {
        date = firebaseTimestamp.toDate();
    } else if (firebaseTimestamp.seconds) {
        date = new Date(firebaseTimestamp.seconds * 1000);
    } else {
        date = new Date(firebaseTimestamp);
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

// --- Función para obtener nivel del jugador basado en winrate ---
function getPlayerLevel(totalScore, winRate, matches) {
    // Priorizar winrate sobre score total
    if (winRate >= 95 && matches >= 10) return { level: "CEREBRO TOTAL", color: "#ff6b35", icon: "👑" };
    if (winRate >= 90 && matches >= 8) return { level: "GENIO", color: "#ffd32a", icon: "⭐" };
    if (winRate >= 85 && matches >= 6) return { level: "EXPERTO", color: "#4299e1", icon: "🧠" };
    if (winRate >= 80 && matches >= 5) return { level: "CONOCEDOR", color: "#56ab2f", icon: "💡" };
    if (winRate >= 75 && matches >= 4) return { level: "INTELIGENTE", color: "#667eea", icon: "🎯" };
    if (winRate >= 70 && matches >= 3) return { level: "ESTUDIADO", color: "#764ba2", icon: "📚" };
    if (winRate >= 60 && matches >= 2) return { level: "AFICIONADO", color: "#ed8936", icon: "📈" };
    return { level: "PRINCIPIANTE", color: "#999", icon: "🌱" };
}

// --- Función para generar HTML del ranking corregida ---
function generateRankingHTML(usersData) {
    if (!usersData || usersData.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay datos disponibles</td></tr>';
    }

    console.log('[RANKING QSM] Procesando datos de', usersData.length, 'usuarios');

    // Filtrar y procesar datos con mayor flexibilidad
    const validUsers = usersData
        .filter(user => {
            // Verificar múltiples fuentes de datos
            const quienSabeMasData = user.quiensabemas || user.stats?.quiensabemas || {};
            const hasValidData = 
                quienSabeMasData.gamesPlayed > 0 || 
                quienSabeMasData.wins > 0 || 
                user.wins > 0 ||
                user.matchesPlayed > 0;
            
            return hasValidData && user.displayName;
        })
        .map(user => {
            console.log('[RANKING QSM] Procesando usuario:', user.displayName);
            
            // Extraer datos de múltiples fuentes
            const quienSabeMasData = user.quiensabemas || user.stats?.quiensabemas || {};
            const rootData = user;
            
            // Unificar estadísticas
            let wins = Math.max(
                quienSabeMasData.wins || 0,
                rootData.wins || 0
            );
            let losses = Math.max(
                quienSabeMasData.losses || 0,
                rootData.losses || 0
            );
            let matches = Math.max(
                quienSabeMasData.gamesPlayed || 0,
                quienSabeMasData.matches || 0,
                rootData.matchesPlayed || 0,
                wins + losses
            );
            let totalScore = Math.max(
                quienSabeMasData.totalScore || 0,
                rootData.totalScore || 0
            );
            
            // Ajustar coherencia
            if (matches < wins + losses) {
                matches = wins + losses;
            }
            
            // Calcular métricas
            const winRate = matches > 0 ? (wins / matches) * 100 : 0;
            const avgScore = matches > 0 ? Math.round(totalScore / matches) : totalScore;
            const correctAnswers = quienSabeMasData.correctAnswers || 0;
            const totalQuestions = quienSabeMasData.totalQuestions || matches * 10; // Estimación
            const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
            
            console.log(`[RANKING QSM] ${user.displayName}: ${wins}W/${losses}L/${matches}P - WinRate: ${winRate.toFixed(1)}%`);
            
            return {
                id: user.id,
                displayName: user.displayName,
                wins: wins,
                losses: losses,
                matches: matches,
                totalScore: totalScore,
                winRate: winRate,
                avgScore: avgScore,
                correctAnswers: correctAnswers,
                accuracy: accuracy,
                lastPlayed: user.lastPlayed || quienSabeMasData.lastPlayed
            };
        })
        .filter(user => user.matches > 0) // Solo usuarios con al menos 1 partida
        .sort((a, b) => {
            // ORDEN CORREGIDO: Por winrate primero, luego por partidas jugadas, luego por score total
            const winRateDiff = b.winRate - a.winRate;
            if (Math.abs(winRateDiff) > 0.1) return winRateDiff;
            
            const matchesDiff = b.matches - a.matches;
            if (matchesDiff !== 0) return matchesDiff;
            
            return b.totalScore - a.totalScore;
        })
        .slice(0, RANKING_LIMIT);

    if (validUsers.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay jugadores registrados aún</td></tr>';
    }

    console.log('[RANKING QSM] Top usuarios ordenados por winrate:');
    validUsers.slice(0, 5).forEach((user, i) => {
        console.log(`${i + 1}. ${user.displayName}: ${user.winRate.toFixed(1)}% (${user.wins}/${user.matches})`);
    });

    return validUsers.map((user, index) => {
        const playerLevel = getPlayerLevel(user.totalScore, user.winRate, user.matches);
        const isTopPlayer = index < 3;
        const position = index + 1;
        
        return `
            <tr class="ranking-row ${isTopPlayer ? 'top-player' : ''}" data-score="${user.totalScore}">
                <td class="ranking-position">
                    <div class="position-number">${position}</div>
                    <div class="position-icon">
                        ${position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : ''}
                    </div>
                </td>
                <td class="player-info">
                    <div class="player-name">${user.displayName}</div>
                    <div class="player-level" style="color: ${playerLevel.color}">
                        ${playerLevel.icon} ${playerLevel.level}
                    </div>
                    <div class="player-stats-summary">${user.matches} partidas</div>
                </td>
                <td class="score-info">
                    <div class="main-score">${user.totalScore.toLocaleString()}</div>
                    <div class="secondary-stat">puntos total</div>
                    <div class="score-breakdown">Prom: ${user.avgScore.toLocaleString()}</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat wins-stat">${user.wins}</div>
                    <div class="secondary-stat">${user.winRate.toFixed(1)}% wins</div>
                    <div class="losses-stat">${user.losses} derrotas</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat accuracy-stat">${user.accuracy.toFixed(0)}%</div>
                    <div class="secondary-stat">precisión</div>
                    <div class="correct-answers">${user.correctAnswers} correctas</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="match-count">${user.matches}</div>
                    <div class="secondary-stat">partidas</div>
                    <div class="last-played">${formatCompactDate(user.lastPlayed)}</div>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Función para generar HTML del historial mejorado y compacto ---
function generateHistoryHTML(matches) {
    if (!matches || matches.length === 0) {
        return '<div class="empty-state">No hay historial disponible para este jugador</div>';
    }

    // Obtener usuario actual (si está logueado)
    const currentUser = localStorage.getItem('currentUser');
    let userMatches = matches;
    
    // Si hay usuario logueado, filtrar sus partidas
    if (currentUser) {
        try {
            const userData = JSON.parse(currentUser);
            userMatches = matches.filter(match => 
                match.playerName === userData.displayName || 
                match.userId === userData.uid ||
                (match.players && match.players.some(p => p.displayName === userData.displayName))
            );
        } catch (e) {
            console.log('No se pudo obtener usuario actual');
        }
    }

    // Si no hay partidas del usuario, mostrar las más recientes de todos
    if (userMatches.length === 0) {
        userMatches = matches.slice(0, HISTORY_LIMIT);
    }

    // Mostrar las últimas partidas ordenadas por fecha
    const recentMatches = userMatches
        .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
        .slice(0, HISTORY_LIMIT);

    return recentMatches.map(match => {
        const playerName = match.playerName || 'Jugador';
        const myScore = match.score || 0;
        const opponentName = (match.players && match.players.length > 1) ? 
            match.players.find(p => p.displayName !== playerName)?.displayName || 'Oponente' : 'Oponente';
        const opponentScore = (match.players && match.players.length > 1) ? 
            match.players.find(p => p.displayName !== playerName)?.score || 0 : 0;
        
        const isWin = match.result === 'victory' || match.result === 'win';
        const isDraw = match.result === 'draw' || match.result === 'tie';
        const isLoss = match.result === 'defeat' || match.result === 'loss';
        
        // Calcular diferencia de puntos
        const scoreDiff = myScore - opponentScore;
        
        // Determinar resultado y color
        let resultData;
        if (isWin) {
            if (scoreDiff >= 3) {
                resultData = { text: 'VICTORIA', icon: '👑', class: 'dominant-win', color: '#10b981' };
            } else {
                resultData = { text: 'GANÓ', icon: '🎯', class: 'close-win', color: '#059669' };
            }
        } else if (isDraw) {
            resultData = { text: 'EMPATE', icon: '🤝', class: 'draw', color: '#f59e0b' };
        } else {
            if (Math.abs(scoreDiff) >= 3) {
                resultData = { text: 'DERROTA', icon: '😓', class: 'clear-loss', color: '#ef4444' };
            } else {
                resultData = { text: 'PERDIÓ', icon: '😤', class: 'close-loss', color: '#dc2626' };
            }
        }

        // Determinar nivel del duelo
        const totalQuestions = myScore + opponentScore;
        let duelIntensity = 'NORMAL';
        let intensityColor = '#6b7280';
        if (totalQuestions >= 15) {
            duelIntensity = 'ÉPICO';
            intensityColor = '#8b5cf6';
        } else if (totalQuestions >= 12) {
            duelIntensity = 'INTENSO';
            intensityColor = '#3b82f6';
        } else if (totalQuestions >= 10) {
            duelIntensity = 'COMPETITIVO';
            intensityColor = '#10b981';
        }

        return `
            <div class="history-item">
                <!-- Header compacto -->
                <div class="history-header">
                    <span class="history-player-name">🧠 ${playerName}</span>
                    <span class="history-date">${formatCompactDate(match.timestamp)}</span>
                </div>

                <!-- Duelo principal -->
                <div class="main-summary">
                    <div class="player-section">
                        <div class="player-name">🧠 ${playerName}</div>
                        <div class="player-score" style="color: ${isWin ? '#10b981' : isDraw ? '#f59e0b' : '#ef4444'}">${myScore}</div>
                    </div>
                    
                    <div class="vs-section">
                        <div style="font-size: 0.6rem; margin-bottom: 0.2rem; color: var(--ranking-text-muted);">VS</div>
                        <div class="result-indicator" style="color: ${resultData.color}; border-color: ${resultData.color}40; background: ${resultData.color}20;">
                            <span class="result-icon">${resultData.icon}</span>
                            <span class="result-text">${resultData.text}</span>
                        </div>
                    </div>
                    
                    <div class="player-section">
                        <div class="player-name">🤖 ${opponentName}</div>
                        <div class="player-score">${opponentScore}</div>
                    </div>
                </div>

                <!-- Estadísticas clave -->
                <div class="key-stats">
                    <div class="stat-item">
                        <div class="stat-icon">📊</div>
                        <div class="stat-value" style="color: ${scoreDiff >= 0 ? '#10b981' : '#ef4444'}">${scoreDiff >= 0 ? '+' : ''}${scoreDiff}</div>
                        <div class="stat-label">Diferencia</div>
                        <div class="stat-detail">${Math.abs(scoreDiff) >= 3 ? 'Amplia' : Math.abs(scoreDiff) >= 2 ? 'Buena' : 'Reñida'}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-value">${totalQuestions}</div>
                        <div class="stat-label">Preguntas</div>
                        <div class="stat-detail">total respondidas</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-value" style="color: ${intensityColor}">${duelIntensity}</div>
                        <div class="stat-label">Intensidad</div>
                        <div class="stat-detail">${totalQuestions >= 15 ? 'Épico' : totalQuestions >= 10 ? 'Competitivo' : 'Normal'}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">💪</div>
                        <div class="stat-value">${myScore > opponentScore ? 'SUPERIOR' : myScore === opponentScore ? 'IGUAL' : 'INFERIOR'}</div>
                        <div class="stat-label">Rendimiento</div>
                        <div class="stat-detail">${isWin ? 'Ganador' : isDraw ? 'Empate' : 'Perdedor'}</div>
                    </div>
                </div>

                <!-- Especialización -->
                <div class="game-specific">
                    <div class="specific-label">
                        <span style="color: ${intensityColor}">🧠</span>
                        Tipo de duelo
                    </div>
                    <div class="specific-content">
                        <div class="specific-tag" style="color: ${intensityColor}; border-color: ${intensityColor}40">
                            ${duelIntensity}
                        </div>
                        ${myScore >= 8 ? '<div class="specific-tag" style="color: #10b981; border-color: #10b98140;">🏆 ALTO SCORE</div>' : ''}
                        ${Math.abs(scoreDiff) <= 1 ? '<div class="specific-tag" style="color: #f59e0b; border-color: #f59e0b40;">⚡ REÑIDO</div>' : ''}
                        ${totalQuestions >= 15 ? '<div class="specific-tag" style="color: #8b5cf6; border-color: #8b5cf640;">🔥 DUELO ÉPICO</div>' : ''}
                    </div>
                </div>

                <!-- Análisis simplificado -->
                ${(myScore >= 6 || totalQuestions >= 12 || Math.abs(scoreDiff) <= 1) ? `
                <div class="performance-insight">
                    <div class="insight-text">
                        ${isWin && scoreDiff >= 3 ? 
                            '<span class="insight-highlight">¡Dominio total!</span> Victoria clara demostrando superioridad.' :
                        isWin ? 
                            '<span class="insight-highlight">¡Victoria reñida!</span> Ganaste por poco en duelo cerrado.' :
                        isDraw ? 
                            '<span class="insight-highlight">Empate épico</span> - Ambos jugadores al mismo nivel.' :
                        myScore >= 6 ? 
                            '<span class="insight-highlight">Buen conocimiento</span> - Score alto a pesar de la derrota.' :
                            `<span class="insight-highlight">Duelo ${duelIntensity.toLowerCase()}</span> - ${totalQuestions} preguntas respondidas.`
                        }
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// --- Configurar listener en tiempo real para el ranking ---
function setupRankingListener() {
    try {
        if (!window.firebase || !window.firebase.firestore) {
            console.error('[RANKING QSM] Firebase no está disponible');
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
            }
            return;
        }

        const db = window.firebase.firestore();
        const usersRef = db.collection('users');
        
        const unsubscribe = usersRef.onSnapshot((snapshot) => {
            console.log('[RANKING QSM] Datos recibidos:', snapshot.size, 'usuarios');
            
            if (snapshot.empty) {
                console.log('[RANKING QSM] No hay datos de usuarios');
                if (rankingBody) {
                    rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay jugadores registrados aún</td></tr>';
                }
                return;
            }

            const usersData = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Incluir solo usuarios con displayName válido
                if (data.displayName) {
                    usersData.push({
                        id: doc.id,
                        displayName: data.displayName,
                        ...data
                    });
                }
            });

            console.log(`[RANKING QSM] Usuarios procesados: ${usersData.length}`);

            // Actualizar ranking (Top 15)
            if (rankingBody) {
                const rankingHTML = generateRankingHTML(usersData);
                rankingBody.innerHTML = rankingHTML;
                console.log('[RANKING QSM] Tabla actualizada - Top', RANKING_LIMIT);
            }

        }, (error) => {
            console.error('[RANKING QSM] Error en el listener:', error);
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">Error al cargar el ranking. Reintentando...</td></tr>';
            }
            
            setTimeout(() => {
                console.log('[RANKING QSM] Reintentando configuración...');
                setupRankingListener();
            }, 3000);
        });

        console.log('[RANKING QSM] Listener configurado correctamente');
        return unsubscribe;

    } catch (error) {
        console.error('[RANKING QSM] Error al configurar listener:', error);
        if (rankingBody) {
            rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
        }
    }
}

// --- Configurar listener para historial ---
function setupHistoryListener() {
    try {
        if (!window.firebase || !window.firebase.firestore) {
            console.error('[RANKING QSM] Firebase no está disponible para historial');
            if (historyList) {
                historyList.innerHTML = '<div class="empty-state">Error de conexión. Recargá la página.</div>';
            }
            return;
        }

        const db = window.firebase.firestore();
        const matchesRef = db.collection('matches');
        const historyQuery = matchesRef
            .orderBy('timestamp', 'desc')
            .limit(HISTORY_LIMIT);

        const unsubscribe = historyQuery.onSnapshot((snapshot) => {
            console.log('[HISTORY QSM] Datos recibidos:', snapshot.size, 'partidas');
            
            if (snapshot.empty) {
                console.log('[HISTORY QSM] No hay datos de partidas');
                if (historyList) {
                    historyList.innerHTML = '<div class="empty-state">No hay historial disponible</div>';
                }
                return;
            }

            const matches = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                matches.push({
                    id: doc.id,
                    ...data
                });
            });

            console.log(`[HISTORY QSM] Partidas procesadas: ${matches.length}`);

            // Actualizar historial
            if (historyList) {
                const historyHTML = generateHistoryHTML(matches);
                historyList.innerHTML = historyHTML;
                console.log('[HISTORY QSM] Historial actualizado');
            }

        }, (error) => {
            console.error('[HISTORY QSM] Error en el listener:', error);
            if (historyList) {
                historyList.innerHTML = '<div class="empty-state">Error al cargar el historial</div>';
            }
        });

        console.log('[HISTORY QSM] Listener configurado correctamente');
        return unsubscribe;

    } catch (error) {
        console.error('[HISTORY QSM] Error al configurar listener:', error);
        if (historyList) {
            historyList.innerHTML = '<div class="empty-state">Error de conexión</div>';
        }
    }
}

// --- Función para mostrar mensaje de carga inicial ---
function showLoadingState() {
    if (rankingBody) {
        rankingBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-state">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <div style="width: 12px; height: 12px; background: var(--quiensabemas-primary); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                        <span>Buscando a los más inteligentes...</span>
                    </div>
                </td>
            </tr>
        `;
    }
    
    if (historyList) {
        historyList.innerHTML = `
            <div class="loading-state">
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; background: var(--quiensabemas-primary); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                    <span>Revisando duelos...</span>
                </div>
            </div>
        `;
    }
}

// --- Inicializar cuando el DOM esté listo ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('[RANKING QSM] DOM loaded, configurando ranking optimizado...');
    
    // Mostrar estado de carga
    showLoadingState();
    
    // Esperar a que Firebase esté disponible
    function initializeWhenReady() {
        if (window.firebase && window.firebase.firestore) {
            console.log('[RANKING QSM] Firebase disponible, configurando listeners...');
            setupRankingListener();
            setupHistoryListener();
        } else {
            console.log('[RANKING QSM] Esperando Firebase...');
            setTimeout(initializeWhenReady, 1000);
        }
    }
    
    initializeWhenReady();
}); 