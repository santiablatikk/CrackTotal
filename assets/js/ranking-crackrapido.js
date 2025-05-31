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

console.log('Ranking Crack Rápido script loaded - Optimizado para móvil');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

// --- Configuración ---
const RANKING_LIMIT = 15; // Solo mostrar top 15
const HISTORY_LIMIT = 10; // Últimas 10 partidas en historial

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

// --- Función para calcular puntuación efectiva mejorada ---
function calculateEffectiveScore(match) {
    const score = match.score || 0;
    const correctAnswers = match.correctAnswers || 0;
    const totalQuestions = match.totalQuestions || 20;
    const maxStreak = match.maxStreak || 0;
    const averageTime = match.averageTime || 5;
    const accuracy = match.accuracy || ((correctAnswers / totalQuestions) * 100);
    const completed = match.completed || false;
    
    // Bonificaciones mejoradas
    const speedBonus = averageTime <= 1.5 ? 1.5 : averageTime <= 2 ? 1.4 : averageTime <= 3 ? 1.3 : averageTime <= 4 ? 1.2 : 1.0;
    const streakBonus = maxStreak >= 20 ? 1.6 : maxStreak >= 15 ? 1.4 : maxStreak >= 10 ? 1.3 : maxStreak >= 5 ? 1.15 : 1.0;
    const accuracyBonus = accuracy >= 95 ? 1.3 : accuracy >= 90 ? 1.2 : accuracy >= 85 ? 1.15 : accuracy >= 80 ? 1.1 : 1.0;
    const completionBonus = completed ? 1.2 : 0.8; // Penalizar juegos incompletos
    
    const effectiveScore = score * speedBonus * streakBonus * accuracyBonus * completionBonus;
    
    return Math.round(effectiveScore);
}

// --- Función para obtener nivel del jugador ---
function getPlayerLevel(score, accuracy) {
    if (accuracy >= 95 && score >= 4000) return { level: "CRACK TOTAL", color: "#ff6b35", icon: "👑" };
    if (accuracy >= 90 && score >= 3500) return { level: "CRACK", color: "#ffd32a", icon: "⭐" };
    if (accuracy >= 85 && score >= 3000) return { level: "EXPERTO", color: "#56ab2f", icon: "🔥" };
    if (accuracy >= 80 && score >= 2500) return { level: "AVANZADO", color: "#667eea", icon: "💪" };
    if (accuracy >= 70 && score >= 2000) return { level: "INTERMEDIO", color: "#764ba2", icon: "📚" };
    if (accuracy >= 60 && score >= 1500) return { level: "NOVATO", color: "#ed8936", icon: "🎯" };
    return { level: "PRINCIPIANTE", color: "#999", icon: "🌱" };
}

// --- Función para generar HTML del ranking (Top 15) ---
function generateRankingHTML(matches) {
    if (!matches || matches.length === 0) {
        return '<tr><td colspan="8" class="empty-state">No hay datos disponibles</td></tr>';
    }

    // Agrupar por jugador para obtener sus mejores estadísticas
    const playerStats = {};
    
    matches.forEach(match => {
        const playerName = match.playerName || 'Anónimo';
        const score = match.score || 0;
        const correctAnswers = match.correctAnswers || 0;
        const totalQuestions = match.totalQuestions || 20;
        const maxStreak = match.maxStreak || 0;
        const averageTime = match.averageTime || 5;
        const accuracy = match.accuracy || ((correctAnswers / totalQuestions) * 100);
        const completed = match.completed || match.result === 'completed';
        const effectiveScore = calculateEffectiveScore({ score, correctAnswers, totalQuestions, maxStreak, averageTime, accuracy, completed });
        
        if (!playerStats[playerName]) {
            playerStats[playerName] = {
                playerName: playerName,
                totalGames: 0,
                completedGames: 0,
                bestScore: 0,
                bestAccuracy: 0,
                bestStreak: 0,
                bestAverageTime: Infinity,
                totalScore: 0,
                totalCorrectAnswers: 0,
                totalQuestions: 0,
                effectiveRating: 0,
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
        stats.bestAccuracy = Math.max(stats.bestAccuracy, accuracy);
        stats.bestStreak = Math.max(stats.bestStreak, maxStreak);
        
        if (averageTime > 0 && averageTime < stats.bestAverageTime) {
            stats.bestAverageTime = averageTime;
        }
        
        // Acumular totales
        stats.totalScore += score;
        stats.totalCorrectAnswers += correctAnswers;
        stats.totalQuestions += totalQuestions;
        
        // Calcular rating efectivo (tomar el mejor)
        stats.effectiveRating = Math.max(stats.effectiveRating, effectiveScore);
        
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
            
            // Rating final considerando múltiples factores
            const consistencyBonus = player.completionRate >= 70 ? 1.2 : player.completionRate >= 50 ? 1.1 : 1.0;
            const experienceBonus = Math.min(1 + (player.totalGames * 0.02), 1.3); // Hasta 30% bonus por experiencia
            
            player.finalRating = player.effectiveRating * consistencyBonus * experienceBonus;
            
            return player;
        })
        .sort((a, b) => {
            // Ordenar por rating final, luego por mejor accuracy, luego por mejores rachas
            if (Math.abs(b.finalRating - a.finalRating) > 50) return b.finalRating - a.finalRating;
            if (Math.abs(b.bestAccuracy - a.bestAccuracy) > 5) return b.bestAccuracy - a.bestAccuracy;
            return b.bestStreak - a.bestStreak;
        })
        .slice(0, RANKING_LIMIT);

    if (validPlayers.length === 0) {
        return '<tr><td colspan="8" class="empty-state">No hay jugadores registrados aún</td></tr>';
    }

    return validPlayers.map((player, index) => {
        const playerLevel = getPlayerLevel(player.finalRating, player.bestAccuracy);
        const isTopPlayer = index < 3;
        const position = index + 1;
        
        return `
            <tr class="ranking-row ${isTopPlayer ? 'top-player' : ''}" data-rating="${Math.round(player.finalRating)}">
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
                    <div class="player-stats-summary">${player.totalGames} partidas • ${player.completionRate.toFixed(0)}% completadas</div>
                </td>
                <td class="score-info">
                    <div class="main-score">${Math.round(player.finalRating).toLocaleString()}</div>
                    <div class="secondary-stat">Rating</div>
                    <div class="score-breakdown">Mejor: ${player.bestScore.toLocaleString()}</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat accuracy-stat">${player.bestAccuracy.toFixed(0)}%</div>
                    <div class="secondary-stat">Precisión máx.</div>
                    <div class="avg-accuracy">Prom: ${player.overallAccuracy.toFixed(0)}%</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat streak-stat">${player.bestStreak}</div>
                    <div class="secondary-stat">Racha máx.</div>
                    ${player.bestStreak >= 15 ? '<div class="streak-badge">🚀 ÉPICO</div>' :
                      player.bestStreak >= 10 ? '<div class="streak-badge">🔥 FUEGO</div>' : 
                      player.bestStreak >= 5 ? '<div class="streak-badge">⚡ RÁPIDO</div>' : ''}
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat time-stat">${player.bestAverageTime === Infinity ? '---' : player.bestAverageTime.toFixed(1)}s</div>
                    <div class="secondary-stat">Tiempo mejor</div>
                    ${player.bestAverageTime <= 2 ? '<div class="speed-badge">🚀 SONIC</div>' :
                      player.bestAverageTime <= 3 ? '<div class="speed-badge">⚡ RÁPIDO</div>' : ''}
                </td>
                <td class="game-status hide-mobile">
                    <div class="completion-rate" style="color: ${player.completionRate >= 70 ? '#10b981' : player.completionRate >= 50 ? '#f59e0b' : '#ef4444'}">
                        ${player.completionRate.toFixed(0)}%
                    </div>
                    <div class="secondary-stat">Completadas</div>
                </td>
                <td class="match-date hide-mobile">
                    ${formatCompactDate(player.lastPlayed)}
                    <div class="secondary-stat">${player.totalGames} juegos</div>
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
                match.userId === userData.uid
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
        const score = match.score || 0;
        const correctAnswers = match.correctAnswers || 0;
        const totalQuestions = match.totalQuestions || 20;
        const maxStreak = match.maxStreak || 0;
        const averageTime = match.averageTime || 5;
        const accuracy = match.accuracy || ((correctAnswers / totalQuestions) * 100);
        const completed = match.completed || match.result === 'completed';
        const totalTime = match.totalTime || 0;
        const gameMode = match.gameMode || 'classic';
        const category = match.category || 'general';
        const difficulty = match.difficulty || 'normal';
        
        // Calcular datos específicos de Crack Rápido
        const effectiveScore = calculateEffectiveScore({
            score, correctAnswers, totalQuestions, maxStreak, averageTime, accuracy, completed
        });
        const playerLevel = getPlayerLevel(effectiveScore, accuracy);
        const isTimeoutDefeat = match.result === 'timeout' || match.timeOut === true || (!completed && totalTime >= 120);
        
        // Determinar tipo de finalización
        let gameStatus = '';
        let statusIcon = '';
        let statusClass = '';
        
        if (completed) {
            if (accuracy >= 95 && maxStreak >= 15 && averageTime <= 2) {
                gameStatus = 'ACTUACIÓN PERFECTA';
                statusIcon = '🚀';
                statusClass = 'perfect-performance';
            } else if (accuracy >= 90 && maxStreak >= 10) {
                gameStatus = 'GRAN ACTUACIÓN';
                statusIcon = '🔥';
                statusClass = 'great-performance';
            } else if (accuracy >= 80) {
                gameStatus = 'BIEN COMPLETADO';
                statusIcon = '✅';
                statusClass = 'good-completion';
            } else {
                gameStatus = 'COMPLETADO';
                statusIcon = '☑️';
                statusClass = 'completed';
            }
        } else {
            if (isTimeoutDefeat) {
                gameStatus = 'TIEMPO AGOTADO';
                statusIcon = '⏰';
                statusClass = 'timeout-defeat';
            } else if (correctAnswers === 0) {
                gameStatus = 'ABANDONO TEMPRANO';
                statusIcon = '🚪';
                statusClass = 'early-quit';
            } else {
                gameStatus = 'INCOMPLETO';
                statusIcon = '⏸️';
                statusClass = 'incomplete';
            }
        }

        // Calcular power-ups usados
        const powerUpsUsed = match.powerUpsUsed || { timeExtra: 0, removeOption: 0, scoreMultiplier: 0 };
        const totalPowerUps = Object.values(powerUpsUsed).reduce((sum, count) => sum + count, 0);
        
        return `
            <div class="history-item ${statusClass}">
                <div class="history-header">
                    <div class="player-info">
                        <span class="history-player-name">${match.playerName || 'Anónimo'}</span>
                        <span class="game-mode-tag">${gameMode.toUpperCase()}</span>
                    </div>
                    <div class="date-and-status">
                        <span class="history-date">${formatCompactDate(match.timestamp)}</span>
                        <span class="game-status ${statusClass}">
                            ${statusIcon} ${gameStatus}
                        </span>
                    </div>
                </div>
                
                <div class="score-summary">
                    <div class="main-score-display">
                        <div class="effective-score" style="color: ${playerLevel.color}">
                            ${(effectiveScore / 1000).toFixed(1)}k pts
                        </div>
                        <div class="raw-score">Base: ${score.toLocaleString()}</div>
                    </div>
                    <div class="level-indicator" style="background: ${playerLevel.color}">
                        ${playerLevel.icon} ${playerLevel.level}
                    </div>
                </div>

                <div class="performance-grid">
                    <div class="perf-stat accuracy-focus">
                        <div class="stat-header">
                            <span class="stat-icon">🎯</span>
                            <span class="stat-title">Precisión</span>
                        </div>
                        <div class="stat-main">${accuracy.toFixed(0)}%</div>
                        <div class="stat-detail">${correctAnswers}/${totalQuestions} correctas</div>
                        ${accuracy >= 95 ? '<div class="achievement-badge perfect">PERFECTO</div>' :
                          accuracy >= 90 ? '<div class="achievement-badge excellent">EXCELENTE</div>' :
                          accuracy >= 80 ? '<div class="achievement-badge good">BUENO</div>' : ''}
                    </div>

                    <div class="perf-stat speed-focus">
                        <div class="stat-header">
                            <span class="stat-icon">⚡</span>
                            <span class="stat-title">Velocidad</span>
                        </div>
                        <div class="stat-main">${averageTime.toFixed(1)}s</div>
                        <div class="stat-detail">por pregunta</div>
                        ${averageTime <= 1.5 ? '<div class="achievement-badge perfect">SONIC</div>' :
                          averageTime <= 2.5 ? '<div class="achievement-badge excellent">RÁPIDO</div>' :
                          averageTime <= 4 ? '<div class="achievement-badge good">ÁGIL</div>' : ''}
                    </div>

                    <div class="perf-stat streak-focus">
                        <div class="stat-header">
                            <span class="stat-icon">🔥</span>
                            <span class="stat-title">Racha Máx.</span>
                        </div>
                        <div class="stat-main">${maxStreak}</div>
                        <div class="stat-detail">consecutivas</div>
                        ${maxStreak >= 20 ? '<div class="achievement-badge perfect">ÉPICO</div>' :
                          maxStreak >= 15 ? '<div class="achievement-badge excellent">INCREÍBLE</div>' :
                          maxStreak >= 10 ? '<div class="achievement-badge good">GENIAL</div>' : ''}
                    </div>

                    <div class="perf-stat completion-focus">
                        <div class="stat-header">
                            <span class="stat-icon">⏱️</span>
                            <span class="stat-title">Duración</span>
                        </div>
                        <div class="stat-main">${Math.round(totalTime)}s</div>
                        <div class="stat-detail">tiempo total</div>
                        ${completed ? '<div class="achievement-badge good">TERMINADO</div>' : 
                          '<div class="achievement-badge incomplete">INCOMPLETO</div>'}
                    </div>
                </div>

                <div class="game-details">
                    <div class="detail-row">
                        <div class="detail-item">
                            <span class="detail-label">Categoría:</span>
                            <span class="detail-value category-tag">${category === 'general' ? 'General' : category}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Dificultad:</span>
                            <span class="detail-value difficulty-tag">${difficulty}</span>
                        </div>
                    </div>
                    
                    ${totalPowerUps > 0 ? `
                    <div class="powerups-used">
                        <span class="powerups-label">Power-ups utilizados:</span>
                        <div class="powerups-list">
                            ${powerUpsUsed.timeExtra > 0 ? `<span class="powerup-tag">⏰ Tiempo x${powerUpsUsed.timeExtra}</span>` : ''}
                            ${powerUpsUsed.removeOption > 0 ? `<span class="powerup-tag">❌ Quitar x${powerUpsUsed.removeOption}</span>` : ''}
                            ${powerUpsUsed.scoreMultiplier > 0 ? `<span class="powerup-tag">⭐ Doble x${powerUpsUsed.scoreMultiplier}</span>` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="performance-summary">
                        <div class="summary-item">
                            <span class="summary-label">Rating de Actuación:</span>
                            <span class="summary-value performance-rating" style="color: ${
                                effectiveScore >= 4000 ? '#ff6b35' : 
                                effectiveScore >= 3000 ? '#fbbf24' : 
                                effectiveScore >= 2000 ? '#10b981' : 
                                effectiveScore >= 1000 ? '#3b82f6' : '#6b7280'
                            }">
                                ${effectiveScore >= 4000 ? 'LEGENDARIO' :
                                  effectiveScore >= 3000 ? 'EXCELENTE' :
                                  effectiveScore >= 2000 ? 'MUY BUENO' :
                                  effectiveScore >= 1000 ? 'BUENO' : 'PROMEDIO'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Configurar listener en tiempo real para el ranking ---
function setupRankingListener() {
    try {
        const matchesRef = collection(db, 'matches');
        const rankingQuery = query(
            matchesRef,
            orderBy('timestamp', 'desc'),
            limit(200) // Obtener más datos para mejor selección
        );

        const unsubscribe = onSnapshot(rankingQuery, (snapshot) => {
            console.log('[RANKING CR] Datos recibidos:', snapshot.size, 'documentos');
            
            if (snapshot.empty) {
                console.log('[RANKING CR] No hay datos de matches');
                if (rankingBody) {
                    rankingBody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay partidas registradas aún</td></tr>';
                }
                if (historyList) {
                    historyList.innerHTML = '<div class="empty-state">No hay historial disponible</div>';
                }
                return;
            }

            const matches = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('[RANKING CR] Procesando documento:', data);
                
                // Filtrar SOLO los matches de Crack Rápido
                if (data.gameType === 'crackrapido' || data.gameType === 'crack-rapido' || data.gameType === 'CrackRapido' ||
                    data.gameMode === 'CrackRapido' || data.gameMode === 'crackrapido' || data.gameMode === 'crack-rapido') {
                    const processedMatch = {
                        ...data,
                        playerName: data.playerName || data.displayName || 'Anónimo'
                    };
                    
                    matches.push(processedMatch);
                    console.log('[RANKING CR] Match agregado:', processedMatch);
                }
            });

            console.log(`[RANKING CR] Matches procesados: ${matches.length}`);

            // Actualizar ranking (Top 15)
            if (rankingBody) {
                const rankingHTML = generateRankingHTML(matches);
                rankingBody.innerHTML = rankingHTML;
                console.log('[RANKING CR] Tabla actualizada - Top', RANKING_LIMIT);
            }

            // Actualizar historial
            if (historyList) {
                const historyHTML = generateHistoryHTML(matches);
                historyList.innerHTML = historyHTML;
                console.log('[RANKING CR] Historial actualizado');
            }

        }, (error) => {
            console.error('[RANKING CR] Error en el listener:', error);
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="8" class="empty-state">Error al cargar el ranking. Reintentando...</td></tr>';
            }
            
            // Reintentar después de 3 segundos
            setTimeout(() => {
                console.log('[RANKING CR] Reintentando configuración...');
                setupRankingListener();
            }, 3000);
        });

        console.log('[RANKING CR] Listener configurado correctamente');
        return unsubscribe;

    } catch (error) {
        console.error('[RANKING CR] Error al configurar listener:', error);
        if (rankingBody) {
            rankingBody.innerHTML = '<tr><td colspan="8" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
        }
    }
}

// --- Función para mostrar mensaje de carga inicial ---
function showLoadingState() {
    if (rankingBody) {
        rankingBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-state">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <div style="width: 12px; height: 12px; background: var(--crackrapido-primary); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                        <span>Buscando a los cracks más rápidos...</span>
                    </div>
                </td>
            </tr>
        `;
    }
    
    if (historyList) {
        historyList.innerHTML = `
            <div class="loading-state">
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; background: var(--crackrapido-primary); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                    <span>Revisando tus partidas más veloces...</span>
                </div>
            </div>
        `;
    }
}

// --- Inicializar cuando el DOM esté listo ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('[RANKING CR] DOM loaded, configurando ranking optimizado...');
    
    // Mostrar estado de carga
    showLoadingState();
    
    // Configurar listener con demora para asegurar inicialización de Firebase
    setTimeout(() => {
        if (db) {
            setupRankingListener();
        } else {
            console.error('[RANKING CR] Firebase no está inicializado');
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="8" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
            }
        }
    }, 1000);
});