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
        return '<tr><td colspan="5" class="empty-state">No hay datos disponibles</td></tr>';
    }

    // Agrupar por jugador para obtener sus mejores estadísticas de Crack Rápido
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
                totalTime: 0,
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
        stats.totalTime += match.totalTime || 0;
        
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
            
            return player;
        })
        .sort((a, b) => {
            // Ordenar por mejor score, luego por mejor accuracy, luego por completion rate
            if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
            if (Math.abs(b.bestAccuracy - a.bestAccuracy) > 5) return b.bestAccuracy - a.bestAccuracy;
            return b.completionRate - a.completionRate;
        })
        .slice(0, RANKING_LIMIT);

    if (validPlayers.length === 0) {
        return '<tr><td colspan="5" class="empty-state">No hay jugadores registrados aún</td></tr>';
    }

    return validPlayers.map((player, index) => {
        const playerLevel = getPlayerLevel(player.bestScore, player.bestAccuracy);
        const isTopPlayer = index < 3;
        const position = index + 1;
        
        return `
            <tr class="ranking-row ${isTopPlayer ? 'top-player' : ''}" data-score="${player.bestScore}">
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
                    <div class="main-score">${player.bestScore.toLocaleString()}</div>
                    <div class="secondary-stat">Mejor Score</div>
                    <div class="score-breakdown">Prom: ${player.averageScore.toLocaleString()}</div>
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
        let resultData;
        if (completed) {
            if (accuracy >= 95 && maxStreak >= 15 && averageTime <= 2) {
                resultData = { text: 'PERFECTO', icon: '🚀', class: 'perfect-performance', color: '#10b981' };
            } else if (accuracy >= 90 && maxStreak >= 10) {
                resultData = { text: 'EXCELENTE', icon: '🔥', class: 'great-performance', color: '#059669' };
            } else if (accuracy >= 80) {
                resultData = { text: 'COMPLETADO', icon: '✅', class: 'good-completion', color: '#0d9488' };
            } else {
                resultData = { text: 'TERMINADO', icon: '☑️', class: 'completed', color: '#3b82f6' };
            }
        } else {
            if (isTimeoutDefeat) {
                resultData = { text: 'TIEMPO', icon: '⏰', class: 'timeout-defeat', color: '#f59e0b' };
            } else {
                resultData = { text: 'INCOMPLETO', icon: '⏸️', class: 'incomplete', color: '#ef4444' };
            }
        }

        // Determinar especialización
        let specialization = { icon: '⚖️', type: 'EQUILIBRADO', color: '#6b7280' };
        if (averageTime <= 2 && accuracy >= 85) {
            specialization = { icon: '🚀', type: 'VELOCISTA', color: '#8b5cf6' };
        } else if (accuracy >= 95) {
            specialization = { icon: '🎯', type: 'PRECISO', color: '#10b981' };
        } else if (maxStreak >= 15) {
            specialization = { icon: '🔥', type: 'STREAKER', color: '#f59e0b' };
        }

        return `
            <div class="history-item">
                <!-- Header compacto -->
                <div class="history-header">
                    <span class="history-player-name">⚡ ${match.playerName || 'Anónimo'}</span>
                    <span class="history-date">${formatCompactDate(match.timestamp)}</span>
                </div>

                <!-- Resultado principal -->
                <div class="main-summary">
                    <div class="player-section">
                        <div class="result-indicator" style="color: ${resultData.color}; border-color: ${resultData.color}40; background: ${resultData.color}20;">
                            <span class="result-icon">${resultData.icon}</span>
                            <span class="result-text">${resultData.text}</span>
                        </div>
                    </div>
                    
                    <div class="vs-section">
                        <div class="player-score" style="color: ${resultData.color}">${(effectiveScore / 1000).toFixed(1)}k</div>
                        <div style="font-size: 0.6rem; color: var(--ranking-text-muted);">rating</div>
                    </div>
                    
                    <div class="player-section">
                        <div class="level-badge" style="background-color: ${playerLevel.color}">
                            ${playerLevel.icon} ${playerLevel.level}
                        </div>
                    </div>
                </div>

                <!-- Estadísticas clave -->
                <div class="key-stats">
                    <div class="stat-item">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-value">${accuracy.toFixed(0)}%</div>
                        <div class="stat-label">Precisión</div>
                        <div class="stat-detail">${correctAnswers}/${totalQuestions}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-value">${averageTime.toFixed(1)}s</div>
                        <div class="stat-label">Velocidad</div>
                        <div class="stat-detail">${averageTime <= 2 ? 'Sonic' : averageTime <= 3 ? 'Rápido' : 'Normal'}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-value">${maxStreak}</div>
                        <div class="stat-label">Racha</div>
                        <div class="stat-detail">${maxStreak >= 15 ? 'Épico' : maxStreak >= 10 ? 'Genial' : 'Bueno'}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${Math.round(totalTime)}s</div>
                        <div class="stat-label">Tiempo</div>
                        <div class="stat-detail">${completed ? 'Terminado' : 'Incompleto'}</div>
                    </div>
                </div>

                <!-- Especialización -->
                <div class="game-specific">
                    <div class="specific-label">
                        <span style="color: ${specialization.color}">${specialization.icon}</span>
                        Especialización
                    </div>
                    <div class="specific-content">
                        <div class="specific-tag" style="color: ${specialization.color}; border-color: ${specialization.color}40">
                            ${specialization.type}
                        </div>
                        ${accuracy >= 95 ? '<div class="specific-tag" style="color: #10b981; border-color: #10b98140;">🎯 PERFECCIÓN</div>' : ''}
                        ${averageTime <= 2 ? '<div class="specific-tag" style="color: #8b5cf6; border-color: #8b5cf640;">🚀 VELOCIDAD</div>' : ''}
                        ${maxStreak >= 15 ? '<div class="specific-tag" style="color: #f59e0b; border-color: #f59e0b40;">🔥 RACHA ÉPICA</div>' : ''}
                    </div>
                </div>

                <!-- Análisis simplificado -->
                ${(accuracy >= 90 || maxStreak >= 10 || averageTime <= 2.5) ? `
                <div class="performance-insight">
                    <div class="insight-text">
                        ${accuracy >= 95 && averageTime <= 2 ? 
                            '<span class="insight-highlight">¡Actuación perfecta!</span> Velocidad y precisión máximas.' :
                        accuracy >= 90 ? 
                            '<span class="insight-highlight">Precisión excelente</span> - Gran dominio del juego.' :
                        maxStreak >= 15 ? 
                            '<span class="insight-highlight">Racha épica</span> - Impresionante consistencia.' :
                        averageTime <= 2 ? 
                            '<span class="insight-highlight">Velocidad extrema</span> - Respuestas ultrarrápidas.' :
                            `<span class="insight-highlight">Buen rendimiento</span> - Especialidad ${specialization.type.toLowerCase()}.`
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
                    rankingBody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay partidas registradas aún</td></tr>';
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
                rankingBody.innerHTML = '<tr><td colspan="5" class="empty-state">Error al cargar el ranking. Reintentando...</td></tr>';
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
            rankingBody.innerHTML = '<tr><td colspan="5" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
        }
    }
}

// --- Función para mostrar mensaje de carga inicial ---
function showLoadingState() {
    if (rankingBody) {
        rankingBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-state">
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
                rankingBody.innerHTML = '<tr><td colspan="5" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
            }
        }
    }, 1000);
});