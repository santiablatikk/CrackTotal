// Importar funciones de Firestore y la instancia db inicializada
import { db } from './firebase-init.js';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    where,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log('Ranking Quién Sabe Más script loaded - Optimizado para móvil');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

// --- Configuración ---
const RANKING_LIMIT = 15; // Solo mostrar top 15
const HISTORY_LIMIT = 10; // Últimas 10 partidas en historial

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
        'comeback_master': {
            id: 'comeback_master',
            name: 'Maestro de las Remontadas',
            description: 'Gana 3 partidas estando perdiendo por 3+ puntos',
            icon: '🚀',
            category: 'victorias',
            condition: (stats) => stats.comebacks >= 3,
            points: 200
        },
        
        // Logros de velocidad
        'speed_demon': {
            id: 'speed_demon',
            name: 'Demonio de la Velocidad',
            description: 'Responde 10 preguntas en menos de 2 segundos',
            icon: '⚡',
            category: 'velocidad',
            condition: (stats) => stats.fastAnswers >= 10,
            points: 100
        },
        'lightning_round': {
            id: 'lightning_round',
            name: 'Ronda Relámpago',
            description: 'Completa una partida con tiempo promedio < 3s',
            icon: '🌩️',
            category: 'velocidad',
            condition: (stats) => stats.bestGameAvgTime > 0 && stats.bestGameAvgTime < 3,
            points: 175
        },
        
        // Logros de precisión
        'perfectionist': {
            id: 'perfectionist',
            name: 'Perfeccionista',
            description: 'Mantén 90%+ de precisión en 10 partidas',
            icon: '🎯',
            category: 'precision',
            condition: (stats) => stats.highAccuracyGames >= 10,
            points: 250
        },
        'flawless_victory': {
            id: 'flawless_victory',
            name: 'Victoria Impecable',
            description: 'Gana una partida sin respuestas incorrectas',
            icon: '💎',
            category: 'precision',
            condition: (stats) => stats.perfectGames >= 1,
            points: 300
        },
        
        // Logros de conocimiento
        'trivia_master': {
            id: 'trivia_master',
            name: 'Maestro del Trivia',
            description: 'Responde correctamente 100 preguntas',
            icon: '🧠',
            category: 'conocimiento',
            condition: (stats) => stats.totalCorrectAnswers >= 100,
            points: 200
        },
        'football_expert': {
            id: 'football_expert',
            name: 'Experto en Fútbol',
            description: 'Alcanza 1500+ puntos de ELO',
            icon: '⚽',
            category: 'conocimiento',
            condition: (stats) => stats.currentElo >= 1500,
            points: 400
        },
        
        // Logros de dedicación
        'dedicated_player': {
            id: 'dedicated_player',
            name: 'Jugador Dedicado',
            description: 'Juega 50 partidas',
            icon: '💪',
            category: 'dedicacion',
            condition: (stats) => stats.gamesPlayed >= 50,
            points: 150
        },
        'marathon_player': {
            id: 'marathon_player',
            name: 'Maratonista',
            description: 'Juega durante 7 días consecutivos',
            icon: '🏃',
            category: 'dedicacion',
            condition: (stats) => stats.consecutiveDays >= 7,
            points: 300
        }
    },
    
    // Verificar logros desbloqueados
    checkAchievements(playerStats) {
        const unlockedAchievements = [];
        const currentAchievements = this.getPlayerAchievements(playerStats.playerName);
        
        Object.values(this.achievements).forEach(achievement => {
            // Si no está desbloqueado y cumple la condición
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
        
        // Mostrar notificación
        this.showAchievementNotification(achievement);
    },
    
    // Obtener logros de un jugador
    getPlayerAchievements(playerName) {
        const achievements = JSON.parse(localStorage.getItem(RANKING_CONFIG.ACHIEVEMENTS_KEY) || '{}');
        return achievements[playerName] || {};
    },
    
    // Mostrar notificación de logro
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">¡Logro Desbloqueado!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
                <div class="achievement-points">+${achievement.points} puntos</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
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
    getRankings(sortBy = 'currentElo', limit = 50) {
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
                    return b.currentElo - a.currentElo;
            }
        });
        
        return validPlayers.slice(0, limit);
    }
    
    // Obtener estadísticas de un jugador específico
    getPlayerStats(playerName) {
        return this.playerStats[playerName] || null;
    }
    
    // Obtener posición en ranking
    getPlayerRankPosition(playerName, sortBy = 'currentElo') {
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

// --- Función para formatear fecha compacta para móvil ---
function formatCompactDate(firebaseTimestamp) {
    if (!firebaseTimestamp) return '---';
    const date = firebaseTimestamp.toDate();
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

// --- Función para obtener nivel del jugador ---
function getPlayerLevel(totalScore, winRate, matches) {
    if (winRate >= 95 && totalScore >= 6000 && matches >= 25) return { level: "GENIO TOTAL", color: "#9f7aea", icon: "🧠" };
    if (winRate >= 90 && totalScore >= 5000 && matches >= 20) return { level: "GENIO", color: "#b794f6", icon: "🎓" };
    if (winRate >= 85 && totalScore >= 4000 && matches >= 15) return { level: "ERUDITO", color: "#56ab2f", icon: "📚" };
    if (winRate >= 80 && totalScore >= 3000 && matches >= 10) return { level: "SABIO", color: "#667eea", icon: "🔬" };
    if (winRate >= 75 && totalScore >= 2500 && matches >= 8) return { level: "INTELECTUAL", color: "#764ba2", icon: "💡" };
    if (winRate >= 70 && totalScore >= 2000 && matches >= 5) return { level: "ESTUDIANTE", color: "#ed8936", icon: "📖" };
    return { level: "NOVATO", color: "#999", icon: "🌱" };
}

// --- Función para generar HTML del ranking (Top 15) ---
function generateRankingHTML(usersData) {
    if (!usersData || usersData.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay datos disponibles</td></tr>';
    }

    // Filtrar y procesar datos de usuarios de manera más flexible
    const validUsers = usersData
        .filter(user => {
            // Buscar datos de Quién Sabe Más en diferentes ubicaciones posibles
            const quiensabemasData = user.quiensabemas || user.stats?.quiensabemas || user.stats?.quienSabeMas || user.stats?.QuienSabeMas;
            const hasScore = user.totalScore > 0 || user.score > 0 || (quiensabemasData && quiensabemasData.totalScore > 0);
            const hasWins = user.wins > 0 || (quiensabemasData && quiensabemasData.wins > 0);
            const hasPlayed = user.matchesPlayed > 0 || (quiensabemasData && quiensabemasData.played > 0);
            return quiensabemasData || hasScore || hasWins || hasPlayed;
        })
        .map(user => {
            console.log('[RANKING QSM] Procesando usuario:', user);
            
            // Intentar obtener datos de diferentes ubicaciones
            const quiensabemasData = user.quiensabemas || user.stats?.quiensabemas || user.stats?.quienSabeMas || user.stats?.QuienSabeMas || {};
            
            const totalScore = quiensabemasData.totalScore || quiensabemasData.score || user.totalScore || user.score || 0;
            const wins = quiensabemasData.wins || user.wins || 0;
            const losses = quiensabemasData.losses || user.losses || user.totalLosses || 0;
            const matches = quiensabemasData.matches || quiensabemasData.played || user.matchesPlayed || wins + losses || 0;
            
            const winRate = matches > 0 ? (wins / matches) * 100 : 0;
            const avgScore = matches > 0 ? Math.round(totalScore / matches) : totalScore;
            
            return {
                id: user.id,
                displayName: user.displayName || 'Anónimo',
                totalScore: totalScore,
                wins: wins,
                losses: losses,
                matches: matches,
                winRate: winRate,
                avgScore: avgScore
            };
        })
        .sort((a, b) => {
            // Ordenar por efectividad primero, luego por victorias, luego por puntaje total
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.totalScore - a.totalScore;
        })
        .slice(0, RANKING_LIMIT); // Limitar a top 15

    if (validUsers.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay jugadores registrados aún</td></tr>';
    }

    return validUsers.map((user, index) => {
        const playerLevel = getPlayerLevel(user.totalScore, user.winRate, user.matches);
        const isTopPlayer = index < 3;
        const position = index + 1;
        
        return `
            <tr class="ranking-row ${isTopPlayer ? 'top-player' : ''}">
                <td class="ranking-position">
                    ${position}
                    ${position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : ''}
                </td>
                <td class="player-info">
                    <div class="player-name">${user.displayName || 'Anónimo'}</div>
                    <div class="player-level" style="color: ${playerLevel.color}">
                        ${playerLevel.icon} ${playerLevel.level}
                    </div>
                </td>
                <td class="score-info">
                    <div class="main-score">${(user.totalScore / 1000).toFixed(1)}k</div>
                    <div class="secondary-stat">Prom: ${user.avgScore}</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat">${user.matches}</div>
                    <div class="secondary-stat">duelos</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat wins-stat">${user.wins}</div>
                    <div class="secondary-stat">${user.winRate.toFixed(0)}%</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat accuracy-stat">${user.winRate.toFixed(0)}%</div>
                    <div class="secondary-stat">de éxito</div>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Función para generar HTML del historial mejorado ---
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
        const isVictory = match.result === 'victory';
        const isTimeoutDefeat = match.result === 'timeout' || match.timeDefeat === true || match.defeatByTime === true || match.timeOut === true;
        const score = match.score || (match.players && match.players[0]?.score) || 0;
        const correctAnswers = match.correctAnswers || 0;
        const totalQuestions = match.totalQuestions || 10;
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const playerLevel = getPlayerLevel(score, accuracy, 1);
        const playerName = match.playerName || (match.players && match.players[0]?.displayName) || 'Anónimo';
        
        return `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-player-name">${playerName}</span>
                    <span class="history-date">${formatCompactDate(match.timestamp)}</span>
                </div>
                <div class="history-stats">
                    <div class="stat-group">
                        <span class="stat-label">Resultado:</span>
                        <span class="stat-value ${isVictory ? 'wins-stat' : 'losses-stat'}">
                            ${isVictory ? '🧠 VICTORIA' : (isTimeoutDefeat ? '⏰ TIEMPO AGOTADO' : '😞 DERROTA')}
                        </span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Puntuación:</span>
                        <span class="stat-value">${score.toLocaleString()} pts</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Precisión:</span>
                        <span class="stat-value">${accuracy.toFixed(0)}% (${correctAnswers}/${totalQuestions})</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Oponente:</span>
                        <span class="stat-value">${match.opponentName || (match.players && match.players[1]?.displayName) || 'IA'}</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Tema:</span>
                        <span class="stat-value">${match.category || 'General'}</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Duración:</span>
                        <span class="stat-value">${Math.round(match.duration || 0)}s</span>
                    </div>
                </div>
                <div class="level-badge" style="background-color: ${playerLevel.color}">
                    ${playerLevel.icon} ${playerLevel.level}
                </div>
            </div>
        `;
    }).join('');
}

// --- Configurar listener en tiempo real para el ranking ---
function setupRankingListener() {
    try {
        const usersRef = collection(db, 'users');
        
        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
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
                console.log('[RANKING QSM] Procesando usuario:', data);
                
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
        const matchesRef = collection(db, 'matches');
        const historyQuery = query(
            matchesRef,
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
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
                console.log('[HISTORY QSM] Procesando partida:', data);
                
                // Filtrar SOLO partidas de Quién Sabe Más
                if (data.gameType === 'quiensabemas' || data.gameType === 'quien-sabe-mas' || data.gameType === 'QuienSabeMas' ||
                    data.gameMode === 'QuienSabeMas' || data.gameMode === 'quiensabemas' || data.gameMode === 'quien-sabe-mas') {
                    matches.push({
                        id: doc.id,
                        ...data
                    });
                }
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
                    <span>Revisando los últimos duelos de conocimiento...</span>
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
    
    // Configurar listeners con demora para asegurar inicialización de Firebase
    setTimeout(() => {
    if (db) {
            setupRankingListener();
            setupHistoryListener();
    } else {
            console.error('[RANKING QSM] Firebase no está inicializado');
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
            }
        }
    }, 1000);
}); 