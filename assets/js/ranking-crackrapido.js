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

console.log('🚀 Ranking Crack Rápido script loaded - Optimizado y actualizado');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

// --- Configuración ---
const RANKING_LIMIT = 15; // Solo mostrar top 15
const HISTORY_LIMIT = 15; // Últimas 15 partidas en historial
const CACHE_DURATION = 30000; // Cache por 30 segundos
let lastDataUpdate = 0;
let cachedMatches = [];

// --- Función para formatear fecha compacta para móvil ---
function formatCompactDate(firebaseTimestamp) {
    if (!firebaseTimestamp) return '---';
    
    try {
        const date = firebaseTimestamp.toDate();
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    } catch (error) {
        console.warn('Error formateando fecha:', error);
        return '---';
    }
}

// --- Función para calcular puntuación efectiva mejorada específica para Crack Rápido ---
function calculateEffectiveScore(match) {
    const score = match.score || 0;
    const correctAnswers = match.correctAnswers || 0;
    const totalQuestions = match.totalQuestions || 20;
    const maxStreak = match.maxStreak || 0;
    const averageTime = match.averageTime || 5;
    const accuracy = match.accuracy || ((correctAnswers / totalQuestions) * 100);
    const completed = match.completed || match.result === 'completed';
    const perfectAnswers = match.perfectAnswers || 0; // Nuevas métricas
    const timeOuts = match.timeOuts || 0;
    
    // Bonificaciones específicas para Crack Rápido (modo extremo)
    let speedMultiplier = 1.0;
    if (averageTime <= 1.5) speedMultiplier = 2.0; // Velocidad extrema
    else if (averageTime <= 2.0) speedMultiplier = 1.8;
    else if (averageTime <= 2.5) speedMultiplier = 1.6;
    else if (averageTime <= 3.0) speedMultiplier = 1.4;
    else if (averageTime <= 3.5) speedMultiplier = 1.2;
    
    let streakMultiplier = 1.0;
    if (maxStreak >= 20) streakMultiplier = 2.5; // Racha perfecta
    else if (maxStreak >= 15) streakMultiplier = 2.0;
    else if (maxStreak >= 10) streakMultiplier = 1.6;
    else if (maxStreak >= 8) streakMultiplier = 1.4;
    else if (maxStreak >= 5) streakMultiplier = 1.2;
    
    let accuracyMultiplier = 1.0;
    if (accuracy >= 95) accuracyMultiplier = 1.8; // Precisión extrema
    else if (accuracy >= 90) accuracyMultiplier = 1.6;
    else if (accuracy >= 85) accuracyMultiplier = 1.4;
    else if (accuracy >= 80) accuracyMultiplier = 1.3;
    else if (accuracy >= 75) accuracyMultiplier = 1.2;
    else if (accuracy >= 70) accuracyMultiplier = 1.1;
    
    // Bonus por completar el juego (importante en modo extremo)
    const completionMultiplier = completed ? 1.5 : 0.6;
    
    // Penalty por timeouts (específico de Crack Rápido)
    const timeoutPenalty = Math.max(0.7, 1 - (timeOuts * 0.02));
    
    // Bonus por respuestas perfectas (menos de 2 segundos)
    const perfectBonus = 1 + (perfectAnswers * 0.05);
    
    const effectiveScore = score * speedMultiplier * streakMultiplier * accuracyMultiplier * completionMultiplier * timeoutPenalty * perfectBonus;
    
    return Math.round(effectiveScore);
}

// --- Función para obtener nivel del jugador (actualizada para Crack Rápido) ---
function getPlayerLevel(score, accuracy, averageTime = 5) {
    const effectiveScore = score;
    
    // Niveles específicos para Crack Rápido considerando velocidad extrema
    if (accuracy >= 95 && effectiveScore >= 6000 && averageTime <= 2) {
        return { level: "CRACK SUPREMO", color: "#ff1744", icon: "⚡👑" };
    }
    if (accuracy >= 90 && effectiveScore >= 5000 && averageTime <= 2.5) {
        return { level: "CRACK TOTAL", color: "#ff6b35", icon: "👑" };
    }
    if (accuracy >= 85 && effectiveScore >= 4000) {
        return { level: "CRACK ÉLITE", color: "#ffd32a", icon: "⭐" };
    }
    if (accuracy >= 80 && effectiveScore >= 3000) {
        return { level: "CRACK", color: "#56ab2f", icon: "🔥" };
    }
    if (accuracy >= 75 && effectiveScore >= 2500) {
        return { level: "EXPERTO", color: "#667eea", icon: "💪" };
    }
    if (accuracy >= 70 && effectiveScore >= 2000) {
        return { level: "AVANZADO", color: "#764ba2", icon: "📚" };
    }
    if (accuracy >= 60 && effectiveScore >= 1500) {
        return { level: "INTERMEDIO", color: "#ed8936", icon: "🎯" };
    }
    if (accuracy >= 50 && effectiveScore >= 1000) {
        return { level: "NOVATO", color: "#9ca3af", icon: "🌱" };
    }
    return { level: "PRINCIPIANTE", color: "#6b7280", icon: "🚀" };
}

// --- Función para generar HTML del ranking (Top 15) mejorada ---
function generateRankingHTML(matches) {
    if (!matches || matches.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay datos disponibles para Crack Rápido</td></tr>';
    }

    // Agrupar por jugador para obtener sus mejores estadísticas de Crack Rápido
    const playerStats = {};
    
    matches.forEach(match => {
        const playerName = match.playerName || match.displayName || 'Anónimo';
        const score = match.score || 0;
        const correctAnswers = match.correctAnswers || 0;
        const totalQuestions = match.totalQuestions || 20;
        const maxStreak = match.maxStreak || 0;
        const averageTime = match.averageTime || 5;
        const accuracy = match.accuracy || ((correctAnswers / totalQuestions) * 100);
        const completed = match.completed || match.result === 'completed';
        const perfectAnswers = match.perfectAnswers || 0;
        const timeOuts = match.timeOuts || 0;
        const effectiveScore = calculateEffectiveScore(match);
        
        if (!playerStats[playerName]) {
            playerStats[playerName] = {
                playerName: playerName,
                totalGames: 0,
                completedGames: 0,
                bestScore: 0,
                bestEffectiveScore: 0,
                bestAccuracy: 0,
                bestStreak: 0,
                bestAverageTime: Infinity,
                totalScore: 0,
                totalCorrectAnswers: 0,
                totalQuestions: 0,
                totalTime: 0,
                totalPerfectAnswers: 0,
                totalTimeOuts: 0,
                lastPlayed: null
            };
        }
        
        const stats = playerStats[playerName];
        stats.totalGames++;
        
        if (completed) {
            stats.completedGames++;
        }
        
        // Actualizar mejores estadísticas
        stats.bestScore = Math.max(stats.bestScore, score);
        stats.bestEffectiveScore = Math.max(stats.bestEffectiveScore, effectiveScore);
        stats.bestAccuracy = Math.max(stats.bestAccuracy, accuracy);
        stats.bestStreak = Math.max(stats.bestStreak, maxStreak);
        
        if (averageTime > 0 && averageTime < stats.bestAverageTime) {
            stats.bestAverageTime = averageTime;
        }
        
        // Acumular totales
        stats.totalScore += score;
        stats.totalCorrectAnswers += correctAnswers;
        stats.totalQuestions += totalQuestions;
        stats.totalTime += match.totalTime || 0;
        stats.totalPerfectAnswers += perfectAnswers;
        stats.totalTimeOuts += timeOuts;
        
        // Actualizar última fecha jugada
        if (!stats.lastPlayed || (match.timestamp && match.timestamp.seconds > stats.lastPlayed.seconds)) {
            stats.lastPlayed = match.timestamp;
        }
    });

    // Convertir a array y calcular estadísticas finales
    const validPlayers = Object.values(playerStats)
        .filter(player => player.totalGames > 0)
        .map(player => {
            player.averageScore = player.totalGames > 0 ? Math.round(player.totalScore / player.totalGames) : 0;
            player.overallAccuracy = player.totalQuestions > 0 ? (player.totalCorrectAnswers / player.totalQuestions) * 100 : 0;
            player.completionRate = player.totalGames > 0 ? (player.completedGames / player.totalGames) * 100 : 0;
            player.averageGameTime = player.totalGames > 0 ? Math.round(player.totalTime / player.totalGames) : 0;
            player.averageTimeOuts = player.totalGames > 0 ? Math.round(player.totalTimeOuts / player.totalGames) : 0;
            player.perfectAnswerRate = player.totalQuestions > 0 ? (player.totalPerfectAnswers / player.totalQuestions) * 100 : 0;
            
            return player;
        })
        .sort((a, b) => {
            // Ordenar por puntuación efectiva, luego por tasa de finalización, luego por mejor precisión
            if (b.bestEffectiveScore !== a.bestEffectiveScore) {
                return b.bestEffectiveScore - a.bestEffectiveScore;
            }
            if (Math.abs(b.completionRate - a.completionRate) > 5) {
                return b.completionRate - a.completionRate;
            }
            return b.bestAccuracy - a.bestAccuracy;
        })
        .slice(0, RANKING_LIMIT);

    if (validPlayers.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay jugadores registrados en Crack Rápido aún</td></tr>';
    }

    return validPlayers.map((player, index) => {
        const playerLevel = getPlayerLevel(player.bestEffectiveScore, player.bestAccuracy, player.bestAverageTime);
        const isTopPlayer = index < 3;
        const position = index + 1;
        const fastTime = player.bestAverageTime !== Infinity ? player.bestAverageTime.toFixed(1) : '5.0';
        
        return `
            <tr class="ranking-row ${isTopPlayer ? 'top-player' : ''}" data-score="${player.bestEffectiveScore}">
                <td class="ranking-position">
                    <div class="position-number">${position}</div>
                    <div class="position-icon">
                        ${position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : ''}
                    </div>
                </td>
                <td class="player-info">
                    <div class="player-name">${player.playerName}</div>
                    <div class="player-level" style="color: ${playerLevel.color}">
                        ${playerLevel.icon} ${playerLevel.level}
                    </div>
                    <div class="player-stats-summary">
                        ${player.totalGames} partidas • ${player.completionRate.toFixed(0)}% completadas
                        ${player.perfectAnswerRate > 20 ? ' • ⚡ Velocista' : ''}
                    </div>
                </td>
                <td class="score-info">
                    <div class="main-score">${player.bestEffectiveScore.toLocaleString()}</div>
                    <div class="secondary-stat">Mejor Rating</div>
                    <div class="score-breakdown">Score: ${player.bestScore.toLocaleString()}</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat accuracy-stat">${player.bestAccuracy.toFixed(0)}%</div>
                    <div class="secondary-stat">Precisión máx.</div>
                    <div class="avg-accuracy">Prom: ${player.overallAccuracy.toFixed(0)}%</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat speed-stat">${fastTime}s</div>
                    <div class="secondary-stat">Velocidad máx.</div>
                    ${parseFloat(fastTime) <= 2 ? '<div class="speed-badge">⚡ SONIC</div>' :
                      parseFloat(fastTime) <= 2.5 ? '<div class="speed-badge">🚀 RÁPIDO</div>' : 
                      parseFloat(fastTime) <= 3 ? '<div class="speed-badge">💨 VELOZ</div>' : ''}
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat streak-stat">${player.bestStreak}</div>
                    <div class="secondary-stat">Racha máx.</div>
                    ${player.bestStreak >= 20 ? '<div class="streak-badge">👑 PERFECTO</div>' :
                      player.bestStreak >= 15 ? '<div class="streak-badge">🚀 ÉPICO</div>' :
                      player.bestStreak >= 10 ? '<div class="streak-badge">🔥 FUEGO</div>' : 
                      player.bestStreak >= 5 ? '<div class="streak-badge">⚡ RÁPIDO</div>' : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// --- Función para generar HTML del historial mejorado y específico para Crack Rápido ---
function generateHistoryHTML(matches) {
    if (!matches || matches.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">⚡</div>
                <div class="empty-text">No hay historial de Crack Rápido disponible</div>
                <div class="empty-subtitle">¡Jugá una partida para ver tus estadísticas aquí!</div>
            </div>
        `;
    }

    // Obtener usuario actual (si está logueado)
    const currentUser = localStorage.getItem('currentUser');
    let userMatches = matches;
    let isUserFilter = false;
    
    // Si hay usuario logueado, priorizar sus partidas
    if (currentUser) {
        try {
            const userData = JSON.parse(currentUser);
            const playerName = userData.displayName || userData.email?.split('@')[0];
            const userOnlyMatches = matches.filter(match => 
                match.playerName === playerName || 
                match.playerName === userData.displayName ||
                match.userId === userData.uid
            );
            
            if (userOnlyMatches.length > 0) {
                userMatches = userOnlyMatches;
                isUserFilter = true;
                
                // Si el usuario tiene pocas partidas, agregar algunas destacadas de otros jugadores
                if (userMatches.length < 8) {
                    const topMatches = matches
                        .filter(match => 
                            match.playerName !== playerName && 
                            match.playerName !== userData.displayName &&
                            match.userId !== userData.uid
                        )
                        .filter(match => {
                            const accuracy = match.accuracy || ((match.correctAnswers || 0) / (match.totalQuestions || 20)) * 100;
                            const averageTime = match.averageTime || 5;
                            const maxStreak = match.maxStreak || 0;
                            // Solo partidas destacadas
                            return accuracy >= 85 || averageTime <= 2.5 || maxStreak >= 12;
                        })
                        .slice(0, Math.min(5, HISTORY_LIMIT - userMatches.length));
                    
                    userMatches = [...userMatches, ...topMatches];
                }
            }
        } catch (e) {
            console.log('No se pudo obtener usuario actual');
        }
    }

    // Si no hay partidas del usuario o no está logueado, mostrar las mejores partidas recientes
    if (userMatches.length === 0) {
        userMatches = matches
            .sort((a, b) => {
                // Priorizar partidas completadas con buenas estadísticas
                const aCompleted = a.completed || a.result === 'completed';
                const bCompleted = b.completed || b.result === 'completed';
                const aAccuracy = a.accuracy || ((a.correctAnswers || 0) / (a.totalQuestions || 20)) * 100;
                const bAccuracy = b.accuracy || ((b.correctAnswers || 0) / (b.totalQuestions || 20)) * 100;
                
                if (aCompleted !== bCompleted) return bCompleted - aCompleted;
                if (Math.abs(bAccuracy - aAccuracy) > 10) return bAccuracy - aAccuracy;
                return b.timestamp?.seconds - a.timestamp?.seconds;
            })
            .slice(0, HISTORY_LIMIT);
    }

    // Mostrar las últimas partidas ordenadas por fecha
    const recentMatches = userMatches
        .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
        .slice(0, HISTORY_LIMIT);

    // Calcular estadísticas comparativas para el contexto
    const totalMatches = recentMatches.length;
    const completedMatches = recentMatches.filter(m => m.completed || m.result === 'completed').length;
    const avgAccuracy = totalMatches > 0 ? 
        recentMatches.reduce((sum, m) => sum + (m.accuracy || ((m.correctAnswers || 0) / (m.totalQuestions || 20)) * 100), 0) / totalMatches : 0;
    const avgTime = totalMatches > 0 ?
        recentMatches.reduce((sum, m) => sum + (m.averageTime || 5), 0) / totalMatches : 5;

    // Header del historial
    const historyHeader = `
        <div class="history-summary">
            <div class="history-title">
                <h3>📊 ${isUserFilter ? 'Tus Partidas de' : 'Historial de'} Crack Rápido</h3>
                <div class="history-stats">
                    ${totalMatches} partidas • ${((completedMatches / totalMatches) * 100).toFixed(0)}% completadas • 
                    ${avgAccuracy.toFixed(0)}% precisión promedio • ${avgTime.toFixed(1)}s velocidad promedio
                </div>
            </div>
            ${isUserFilter && totalMatches > 0 ? `
                <div class="user-progress">
                    <div class="progress-item">
                        <span class="progress-label">Tu nivel actual:</span>
                        <span class="progress-value">${getPlayerLevel(
                            calculateEffectiveScore(recentMatches[0]), 
                            avgAccuracy, 
                            avgTime
                        ).level}</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    const historyItems = recentMatches.map((match, index) => {
        const score = match.score || 0;
        const correctAnswers = match.correctAnswers || 0;
        const totalQuestions = match.totalQuestions || 20;
        const maxStreak = match.maxStreak || 0;
        const averageTime = match.averageTime || 5;
        const accuracy = match.accuracy || ((correctAnswers / totalQuestions) * 100);
        const completed = match.completed || match.result === 'completed';
        const totalTime = match.totalTime || 0;
        const timeOuts = match.timeOuts || 0;
        const perfectAnswers = match.perfectAnswers || 0;
        const effectiveScore = calculateEffectiveScore(match);
        
        const playerLevel = getPlayerLevel(effectiveScore, accuracy, averageTime);
        const isTimeoutDefeat = match.result === 'timeout' || (!completed && timeOuts > 10);
        const isPerfectGame = accuracy >= 95 && maxStreak >= 15 && averageTime <= 2;
        const isUserMatch = isUserFilter && index < (recentMatches.length - (matches.length > userMatches.length ? matches.length - userMatches.length : 0));
        
        // Análisis de rendimiento comparativo
        const performanceAnalysis = {
            accuracy: accuracy >= avgAccuracy + 10 ? 'superior' : accuracy >= avgAccuracy - 5 ? 'promedio' : 'inferior',
            speed: averageTime <= avgTime - 0.5 ? 'superior' : averageTime <= avgTime + 0.5 ? 'promedio' : 'inferior',
            completion: completed ? 'completado' : 'incompleto'
        };
        
        // Determinar tipo de finalización mejorado con más categorías
        let resultData;
        if (isPerfectGame) {
            resultData = { text: 'PERFECTO', icon: '👑', class: 'perfect-performance', color: '#ff1744' };
        } else if (completed) {
            if (accuracy >= 95 && averageTime <= 3) {
                resultData = { text: 'MAESTRÍA', icon: '⭐', class: 'mastery-performance', color: '#ffd700' };
            } else if (accuracy >= 90 && averageTime <= 2.5) {
                resultData = { text: 'EXCELENTE', icon: '🚀', class: 'excellent-performance', color: '#ff6b35' };
            } else if (accuracy >= 85 && maxStreak >= 10) {
                resultData = { text: 'GENIAL', icon: '🔥', class: 'great-performance', color: '#ffd32a' };
            } else if (accuracy >= 80) {
                resultData = { text: 'COMPLETADO', icon: '✅', class: 'good-completion', color: '#56ab2f' };
            } else if (accuracy >= 70) {
                resultData = { text: 'TERMINADO', icon: '☑️', class: 'completed', color: '#667eea' };
            } else {
                resultData = { text: 'FINALIZADO', icon: '🎯', class: 'finished', color: '#94a3b8' };
            }
        } else {
            if (isTimeoutDefeat) {
                resultData = { text: 'TIEMPO', icon: '⏰', class: 'timeout-defeat', color: '#f59e0b' };
            } else if (timeOuts > 15) {
                resultData = { text: 'MUCHOS TIMEOUTS', icon: '⏱️', class: 'many-timeouts', color: '#fb923c' };
            } else {
                resultData = { text: 'INCOMPLETO', icon: '⏸️', class: 'incomplete', color: '#ef4444' };
            }
        }

        // Determinar especialización específica para Crack Rápido con más categorías
        let specialization = { icon: '⚖️', type: 'EQUILIBRADO', color: '#6b7280' };
        if (averageTime <= 1.5 && accuracy >= 90) {
            specialization = { icon: '🌪️', type: 'HURACÁN', color: '#a855f7' };
        } else if (averageTime <= 2 && accuracy >= 85) {
            specialization = { icon: '⚡', type: 'SONIC', color: '#8b5cf6' };
        } else if (averageTime <= 2.5 && accuracy >= 80) {
            specialization = { icon: '🚀', type: 'VELOCISTA', color: '#3b82f6' };
        } else if (averageTime <= 3 && accuracy >= 75) {
            specialization = { icon: '💨', type: 'RÁPIDO', color: '#06b6d4' };
        } else if (accuracy >= 95) {
            specialization = { icon: '🎯', type: 'PRECISO', color: '#10b981' };
        } else if (accuracy >= 90) {
            specialization = { icon: '🔍', type: 'EXACTO', color: '#22c55e' };
        } else if (maxStreak >= 18) {
            specialization = { icon: '🌟', type: 'LEYENDA', color: '#eab308' };
        } else if (maxStreak >= 15) {
            specialization = { icon: '🔥', type: 'STREAKER', color: '#f59e0b' };
        } else if (maxStreak >= 10) {
            specialization = { icon: '⚡', type: 'CONSISTENTE', color: '#f97316' };
        } else if (perfectAnswers >= 15) {
            specialization = { icon: '💎', type: 'PERFECCIONISTA', color: '#ec4899' };
        } else if (perfectAnswers >= 10) {
            specialization = { icon: '✨', type: 'REFINADO', color: '#d946ef' };
        } else if (completed && averageTime > 4) {
            specialization = { icon: '🧠', type: 'ESTRATEGA', color: '#64748b' };
        }

        // Logros específicos de la partida
        const achievements = [];
        if (isPerfectGame) achievements.push({ icon: '👑', text: 'JUEGO PERFECTO', color: '#ff1744' });
        if (accuracy === 100) achievements.push({ icon: '🎯', text: 'PRECISIÓN TOTAL', color: '#10b981' });
        if (averageTime <= 1.5) achievements.push({ icon: '⚡', text: 'VELOCIDAD LUZ', color: '#8b5cf6' });
        if (maxStreak === totalQuestions) achievements.push({ icon: '🔥', text: 'RACHA PERFECTA', color: '#f59e0b' });
        if (perfectAnswers >= 15) achievements.push({ icon: '💎', text: 'MAESTRO PERFECTO', color: '#ec4899' });
        if (timeOuts === 0 && completed) achievements.push({ icon: '⏰', text: 'SIN TIMEOUTS', color: '#22c55e' });
        if (totalTime <= 100 && completed) achievements.push({ icon: '🚀', text: 'RÉCORD VELOCIDAD', color: '#3b82f6' });

        return `
            <div class="history-item crack-rapido-item ${isUserMatch ? 'user-match' : 'other-match'}">
                <!-- Header específico de Crack Rápido -->
                <div class="history-header">
                    <div class="player-info-header">
                        <span class="history-player-name">
                            ${isUserMatch ? '👤' : '⚡'} ${match.playerName || 'Anónimo'}
                            ${isUserMatch ? ' (Tú)' : ''}
                        </span>
                        <span class="history-game-mode">EXTREMO</span>
                    </div>
                    <div class="date-info">
                        <span class="history-date">${formatCompactDate(match.timestamp)}</span>
                        <span class="match-position">#${index + 1}</span>
                    </div>
                </div>

                <!-- Resultado principal mejorado -->
                <div class="main-summary">
                    <div class="result-section">
                        <div class="result-indicator" style="color: ${resultData.color}; border-color: ${resultData.color}40; background: ${resultData.color}20;">
                            <span class="result-icon">${resultData.icon}</span>
                            <span class="result-text">${resultData.text}</span>
                        </div>
                        ${isUserMatch ? `
                            <div class="performance-badge ${performanceAnalysis.accuracy}-accuracy">
                                Precisión ${performanceAnalysis.accuracy}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="score-section">
                        <div class="main-score">
                            <div class="effective-score" style="color: ${resultData.color}">
                                ${(effectiveScore / 1000).toFixed(1)}k
                            </div>
                            <div class="score-label">rating</div>
                        </div>
                        <div class="base-score-info">
                            <div class="base-score">${score.toLocaleString()} pts</div>
                            <div class="score-breakdown">
                                Base: ${score} • Bonus: ${effectiveScore - score}
                            </div>
                        </div>
                    </div>
                    
                    <div class="level-section">
                        <div class="level-badge" style="background-color: ${playerLevel.color}; color: white;">
                            ${playerLevel.icon} ${playerLevel.level}
                        </div>
                        <div class="specialization-badge" style="color: ${specialization.color};">
                            ${specialization.icon} ${specialization.type}
                        </div>
                    </div>
                </div>

                <!-- Estadísticas clave específicas de Crack Rápido -->
                <div class="key-stats">
                    <div class="stat-item ${performanceAnalysis.accuracy === 'superior' ? 'stat-superior' : performanceAnalysis.accuracy === 'inferior' ? 'stat-inferior' : ''}">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-value">${accuracy.toFixed(0)}%</div>
                        <div class="stat-label">Precisión</div>
                        <div class="stat-detail">
                            ${correctAnswers}/${totalQuestions}
                            ${accuracy >= avgAccuracy + 10 ? ' ⬆️' : accuracy <= avgAccuracy - 10 ? ' ⬇️' : ''}
                        </div>
                    </div>
                    
                    <div class="stat-item ${performanceAnalysis.speed === 'superior' ? 'stat-superior' : performanceAnalysis.speed === 'inferior' ? 'stat-inferior' : ''}">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-value">${averageTime.toFixed(1)}s</div>
                        <div class="stat-label">Velocidad</div>
                        <div class="stat-detail">
                            ${averageTime <= 1.5 ? 'Huracán' :
                              averageTime <= 2 ? 'Sonic' : 
                              averageTime <= 2.5 ? 'Rápido' : 
                              averageTime <= 3 ? 'Veloz' : 'Normal'}
                            ${averageTime <= avgTime - 0.5 ? ' ⬆️' : averageTime >= avgTime + 0.5 ? ' ⬇️' : ''}
                        </div>
                    </div>
                    
                    <div class="stat-item ${maxStreak >= 15 ? 'stat-superior' : maxStreak <= 5 ? 'stat-inferior' : ''}">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-value">${maxStreak}</div>
                        <div class="stat-label">Racha</div>
                        <div class="stat-detail">
                            ${maxStreak >= 20 ? 'Perfecta' : 
                              maxStreak >= 15 ? 'Épica' : 
                              maxStreak >= 10 ? 'Genial' : 
                              maxStreak >= 5 ? 'Buena' : 'Básica'}
                        </div>
                    </div>
                    
                    <div class="stat-item ${completed ? 'stat-superior' : 'stat-inferior'}">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${Math.round(totalTime)}s</div>
                        <div class="stat-label">Tiempo</div>
                        <div class="stat-detail">
                            ${completed ? 'Terminado' : 'Incompleto'}
                            ${timeOuts > 0 ? ` • ${timeOuts} timeouts` : ''}
                        </div>
                    </div>
                </div>

                ${perfectAnswers > 0 || achievements.length > 0 ? `
                <!-- Métricas avanzadas -->
                <div class="advanced-stats">
                    ${perfectAnswers > 0 ? `
                        <div class="perfect-answers">
                            <span class="perfect-icon">💎</span>
                            <span class="perfect-text">${perfectAnswers} respuestas perfectas (≤2s)</span>
                            <span class="perfect-percent">${((perfectAnswers / totalQuestions) * 100).toFixed(0)}%</span>
                        </div>
                    ` : ''}
                    
                    ${achievements.length > 0 ? `
                        <div class="achievements">
                            ${achievements.map(achievement => `
                                <div class="achievement-badge" style="color: ${achievement.color}; border-color: ${achievement.color}40;">
                                    ${achievement.icon} ${achievement.text}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                ` : ''}

                <!-- Análisis específico para Crack Rápido -->
                ${(isPerfectGame || accuracy >= 90 || maxStreak >= 15 || averageTime <= 2.5) ? `
                <div class="performance-insight">
                    <div class="insight-text">
                        ${isPerfectGame ? 
                            '<span class="insight-highlight">¡JUEGO PERFECTO!</span> Velocidad, precisión y racha máximas en modo extremo. ¡Sos una leyenda!' :
                        accuracy >= 95 && averageTime <= 2 ? 
                            '<span class="insight-highlight">¡Actuación excepcional!</span> Velocidad sonic con precisión perfecta. Dominás el modo extremo.' :
                        accuracy >= 90 && maxStreak >= 15 ? 
                            '<span class="insight-highlight">Dominio total</span> - Precisión y consistencia impresionantes bajo presión extrema.' :
                        averageTime <= 1.5 && accuracy >= 80 ? 
                            '<span class="insight-highlight">Velocidad huracán</span> - Reflejos sobrehumanos con buena precisión.' :
                        averageTime <= 2 && maxStreak >= 10 ? 
                            '<span class="insight-highlight">Velocidad extrema</span> - Respuestas ultrarápidas con excelente consistencia.' :
                        accuracy >= 90 ? 
                            '<span class="insight-highlight">Precisión excelente</span> - Gran dominio del conocimiento futbolístico.' :
                        maxStreak >= 15 ? 
                            '<span class="insight-highlight">Racha épica</span> - Consistencia impresionante bajo la presión del tiempo.' :
                        averageTime <= 2.5 ? 
                            '<span class="insight-highlight">Velocidad superior</span> - Reflejos ultrarrápidos en modo extremo.' :
                            `<span class="insight-highlight">Buen rendimiento</span> - Especialidad ${specialization.type.toLowerCase()}.`
                        }
                    </div>
                </div>
                ` : ''}

                ${isUserMatch && index > 0 ? `
                <!-- Comparación con partida anterior (solo para el usuario) -->
                <div class="comparison">
                    <div class="comparison-title">📈 Comparación con partida anterior:</div>
                    <div class="comparison-stats">
                        ${(() => {
                            const prevMatch = recentMatches[index - 1];
                            const prevAccuracy = prevMatch.accuracy || ((prevMatch.correctAnswers || 0) / (prevMatch.totalQuestions || 20)) * 100;
                            const prevTime = prevMatch.averageTime || 5;
                            const prevStreak = prevMatch.maxStreak || 0;
                            
                            const accuracyDiff = accuracy - prevAccuracy;
                            const timeDiff = prevTime - averageTime; // Menor tiempo es mejor
                            const streakDiff = maxStreak - prevStreak;
                            
                            return `
                                <span class="comparison-item ${accuracyDiff > 5 ? 'improvement' : accuracyDiff < -5 ? 'decline' : 'stable'}">
                                    Precisión: ${accuracyDiff > 5 ? '⬆️' : accuracyDiff < -5 ? '⬇️' : '➡️'} ${Math.abs(accuracyDiff).toFixed(0)}%
                                </span>
                                <span class="comparison-item ${timeDiff > 0.3 ? 'improvement' : timeDiff < -0.3 ? 'decline' : 'stable'}">
                                    Velocidad: ${timeDiff > 0.3 ? '⬆️' : timeDiff < -0.3 ? '⬇️' : '➡️'} ${Math.abs(timeDiff).toFixed(1)}s
                                </span>
                                <span class="comparison-item ${streakDiff > 2 ? 'improvement' : streakDiff < -2 ? 'decline' : 'stable'}">
                                    Racha: ${streakDiff > 2 ? '⬆️' : streakDiff < -2 ? '⬇️' : '➡️'} ${Math.abs(streakDiff)}
                                </span>
                            `;
                        })()}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');

    return historyHeader + historyItems;
}

// --- Configurar listener en tiempo real para el ranking (mejorado) ---
function setupRankingListener() {
    try {
        const matchesRef = collection(db, 'matches');
        const rankingQuery = query(
            matchesRef,
            orderBy('timestamp', 'desc'),
            limit(300) // Obtener más datos para mejor análisis
        );

        const unsubscribe = onSnapshot(rankingQuery, (snapshot) => {
            console.log('[RANKING CR] 🚀 Datos recibidos:', snapshot.size, 'documentos');
            
            if (snapshot.empty) {
                console.log('[RANKING CR] ⚠️ No hay datos de matches');
                if (rankingBody) {
                    rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay partidas de Crack Rápido registradas aún</td></tr>';
                }
                if (historyList) {
                    historyList.innerHTML = '<div class="empty-state">No hay historial de Crack Rápido disponible</div>';
                }
                return;
            }

            const matches = [];
            let cracRapidoCount = 0;
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Filtro mejorado para SOLO los matches de Crack Rápido
                const isCrackRapido = (
                    data.gameType === 'crackrapido' || 
                    data.gameType === 'crack-rapido' || 
                    data.gameType === 'CrackRapido' ||
                    data.gameMode === 'CrackRapido' || 
                    data.gameMode === 'crackrapido' || 
                    data.gameMode === 'crack-rapido' ||
                    (data.gameMode && data.gameMode.toLowerCase().includes('crack')) ||
                    (data.gameType && data.gameType.toLowerCase().includes('crack'))
                );
                
                if (isCrackRapido) {
                    const processedMatch = {
                        ...data,
                        playerName: data.playerName || data.displayName || 'Anónimo',
                        // Asegurar que tenemos los campos necesarios
                        gameType: 'crackrapido',
                        totalQuestions: data.totalQuestions || 20,
                        averageTime: data.averageTime || 5,
                        maxStreak: data.maxStreak || 0,
                        perfectAnswers: data.perfectAnswers || 0,
                        timeOuts: data.timeOuts || 0
                    };
                    
                    matches.push(processedMatch);
                    cracRapidoCount++;
                }
            });

            console.log(`[RANKING CR] ✅ Matches de Crack Rápido procesados: ${cracRapidoCount}/${snapshot.size}`);
            
            // Actualizar caché
            cachedMatches = matches;
            lastDataUpdate = Date.now();

            // Actualizar ranking (Top 15)
            if (rankingBody) {
                const rankingHTML = generateRankingHTML(matches);
                rankingBody.innerHTML = rankingHTML;
                console.log('[RANKING CR] 📊 Tabla de ranking actualizada - Top', RANKING_LIMIT);
            }

            // Actualizar historial
            if (historyList) {
                const historyHTML = generateHistoryHTML(matches);
                historyList.innerHTML = historyHTML;
                console.log('[RANKING CR] 📋 Historial actualizado con', matches.length, 'partidas');
            }

        }, (error) => {
            console.error('[RANKING CR] ❌ Error en el listener:', error);
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">⚠️ Error cargando ranking. Reintentando...</td></tr>';
            }
            
            // Reintentar después de 5 segundos con backoff exponencial
            setTimeout(() => {
                console.log('[RANKING CR] 🔄 Reintentando configuración...');
                setupRankingListener();
            }, 5000);
        });

        console.log('[RANKING CR] ✅ Listener configurado correctamente para Crack Rápido');
        return unsubscribe;

    } catch (error) {
        console.error('[RANKING CR] ❌ Error al configurar listener:', error);
        if (rankingBody) {
            rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">❌ Error de conexión. Recargá la página.</td></tr>';
        }
    }
}

// --- Función para mostrar mensaje de carga inicial mejorado ---
function showLoadingState() {
    if (rankingBody) {
        rankingBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-state">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 20px;">
                        <div style="width: 16px; height: 16px; background: var(--crackrapido-primary, #6366f1); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                        <span style="font-weight: 600;">⚡ Buscando a los cracks más veloces...</span>
                    </div>
                </td>
            </tr>
        `;
    }
    
    if (historyList) {
        historyList.innerHTML = `
            <div class="loading-state">
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 20px;">
                    <div style="width: 16px; height: 16px; background: var(--crackrapido-primary, #6366f1); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                    <span style="font-weight: 600;">🚀 Revisando partidas de Crack Rápido...</span>
                </div>
            </div>
        `;
    }
}

// --- Función para forzar actualización ---
function forceRefresh() {
    console.log('[RANKING CR] 🔄 Forzando actualización de datos...');
    lastDataUpdate = 0;
    cachedMatches = [];
    showLoadingState();
    setupRankingListener();
}

// --- Inicializar cuando el DOM esté listo ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('[RANKING CR] 🚀 DOM loaded, configurando ranking optimizado para Crack Rápido...');
    
    // Mostrar estado de carga
    showLoadingState();
    
    // Verificar si estamos en la página correcta
    const isRankingPage = window.location.pathname.includes('ranking-crackrapido') || 
                         document.getElementById('ranking-body') !== null;
    
    if (!isRankingPage) {
        console.log('[RANKING CR] ⚠️ No estamos en la página de ranking de Crack Rápido');
        return;
    }
    
    // Configurar listener con demora para asegurar inicialización de Firebase
    setTimeout(() => {
        if (window.db || db) {
            setupRankingListener();
        } else {
            console.error('[RANKING CR] ❌ Firebase no está inicializado');
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">❌ Error de conexión con Firebase. Recargá la página.</td></tr>';
            }
            
            // Intentar nuevamente en 3 segundos
            setTimeout(() => {
                if (window.db || db) {
                    setupRankingListener();
                }
            }, 3000);
        }
    }, 1500);
    
    // Agregar botón de actualización manual (opcional)
    const refreshButton = document.getElementById('refresh-ranking');
    if (refreshButton) {
        refreshButton.addEventListener('click', forceRefresh);
    }
});

// Exportar funciones para debugging
window.cracRapidoRanking = {
    forceRefresh,
    getCachedMatches: () => cachedMatches,
    getLastUpdate: () => new Date(lastDataUpdate).toLocaleString()
};

console.log('[RANKING CR] ✅ Script de ranking de Crack Rápido cargado y optimizado');