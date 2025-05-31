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

// --- Función para formatear Timestamps de Firebase ---
function formatFirebaseTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp) return 'Fecha desconocida';
    const date = firebaseTimestamp.toDate();
    return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

// --- Función para calcular puntuación efectiva ---
function calculateEffectiveScore(match) {
    const score = match.score || 0;
    const correctAnswers = match.correctAnswers || 0;
    const totalQuestions = match.totalQuestions || 20;
    const maxStreak = match.maxStreak || 0;
    const averageTime = match.averageTime || 5;
    
    const accuracy = (correctAnswers / totalQuestions) * 100;
    const speedBonus = averageTime <= 2 ? 1.3 : averageTime <= 3 ? 1.2 : averageTime <= 4 ? 1.1 : 1.0;
    const streakBonus = maxStreak >= 15 ? 1.4 : maxStreak >= 10 ? 1.3 : maxStreak >= 5 ? 1.15 : 1.0;
    const accuracyBonus = accuracy >= 95 ? 1.2 : accuracy >= 85 ? 1.1 : 1.0;
    
    return Math.round(score * speedBonus * streakBonus * accuracyBonus);
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

    // Procesar y ordenar matches por puntuación efectiva
    const processedMatches = matches.map(match => {
        const score = match.score || 0;
        const correctAnswers = match.correctAnswers || 0;
        const totalQuestions = match.totalQuestions || 20;
        const maxStreak = match.maxStreak || 0;
        const averageTime = match.averageTime || 5;
        const totalTime = match.totalTime || 0;
        
        return {
            ...match,
            score: score,
            correctAnswers: correctAnswers,
            totalQuestions: totalQuestions,
            maxStreak: maxStreak,
            averageTime: averageTime,
            totalTime: totalTime,
            effectiveScore: calculateEffectiveScore({
                score, correctAnswers, totalQuestions, maxStreak, averageTime
            }),
            accuracy: (correctAnswers / totalQuestions) * 100
        };
    });

    // Ordenar y limitar a top 15
    processedMatches.sort((a, b) => {
        // Ordenar por precisión/efectividad primero, luego por puntuación efectiva, luego por velocidad
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        if (b.effectiveScore !== a.effectiveScore) return b.effectiveScore - a.effectiveScore;
        return a.averageTime - b.averageTime;
    });

    const top15 = processedMatches.slice(0, RANKING_LIMIT);

    return top15.map((match, index) => {
        const playerLevel = getPlayerLevel(match.effectiveScore, match.accuracy);
        const isComplete = match.correctAnswers === match.totalQuestions;
        const isTopPlayer = index < 3;
        const position = index + 1;
        
        return `
            <tr class="ranking-row ${isTopPlayer ? 'top-player' : ''}">
                <td class="ranking-position">
                    ${position}
                    ${position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : ''}
                </td>
                <td class="player-info">
                    <div class="player-name">${match.playerName || 'Anónimo'}</div>
                    <div class="player-level" style="color: ${playerLevel.color}">
                        ${playerLevel.icon} ${playerLevel.level}
                    </div>
                </td>
                <td class="score-info">
                    <div class="main-score">${(match.effectiveScore / 1000).toFixed(1)}k</div>
                    <div class="secondary-stat">Base: ${match.score}</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat accuracy-stat">${match.accuracy.toFixed(0)}%</div>
                    <div class="secondary-stat">${match.correctAnswers}/${match.totalQuestions}</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat time-stat">${match.maxStreak}</div>
                    ${match.maxStreak >= 15 ? '<div class="secondary-stat">🚀 ÉPICO</div>' :
                      match.maxStreak >= 10 ? '<div class="secondary-stat">🔥 FUEGO</div>' : 
                      match.maxStreak >= 5 ? '<div class="secondary-stat">⚡ RÁPIDO</div>' : ''}
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat time-stat">${match.averageTime}s</div>
                    <div class="secondary-stat">${Math.round(match.totalTime)}s</div>
                </td>
                <td class="game-status hide-mobile">
                    ${isComplete ? 
                        '<span class="status-complete">✅ OK</span>' : 
                        '<span class="status-incomplete">⏱️ INC</span>'
                    }
                </td>
                <td class="match-date hide-mobile">${formatCompactDate(match.timestamp)}</td>
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
        
        const accuracy = (correctAnswers / totalQuestions) * 100;
        const effectiveScore = calculateEffectiveScore({
            score, correctAnswers, totalQuestions, maxStreak, averageTime
        });
        const playerLevel = getPlayerLevel(effectiveScore, accuracy);
        const isComplete = correctAnswers === totalQuestions;
        const isTimeoutDefeat = match.result === 'timeout' || match.timeOut === true || (correctAnswers < totalQuestions && match.totalTime >= 120); // 120s es el tiempo límite típico
        
        return `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-player-name">${match.playerName || 'Anónimo'}</span>
                    <span class="history-date">${formatCompactDate(match.timestamp)}</span>
                </div>
                <div class="history-stats">
                    <div class="stat-group">
                        <span class="stat-label">Puntuación:</span>
                        <span class="stat-value" style="color: ${playerLevel.color}">
                            ${(effectiveScore / 1000).toFixed(1)}k pts
                        </span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Precisión:</span>
                        <span class="stat-value">${accuracy.toFixed(0)}% (${correctAnswers}/${totalQuestions})</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Racha máxima:</span>
                        <span class="stat-value">
                            ${maxStreak} ${maxStreak >= 15 ? '🚀' : maxStreak >= 10 ? '🔥' : maxStreak >= 5 ? '⚡' : ''}
                        </span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Velocidad:</span>
                        <span class="stat-value">
                            ${averageTime}s/pregunta
                            ${averageTime <= 2 ? ' 🚀' : averageTime <= 3 ? ' ⚡' : ''}
                        </span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Estado:</span>
                        <span class="stat-value ${isComplete ? 'wins-stat' : 'losses-stat'}">
                            ${isComplete ? '✅ Completo' : (isTimeoutDefeat ? '⏰ TIEMPO AGOTADO' : '⏱️ Incompleto')}
                        </span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Duración:</span>
                        <span class="stat-value">${Math.round(match.totalTime || 0)}s total</span>
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
        const matchesRef = collection(db, 'matches');
        const rankingQuery = query(
            matchesRef,
            orderBy('timestamp', 'desc'),
            limit(100) // Obtener más datos para mejor selección
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
                        score: data.score || 0,
                        correctAnswers: data.correctAnswers || 0,
                        totalQuestions: data.totalQuestions || 20,
                        maxStreak: data.maxStreak || 0,
                        averageTime: data.averageTime || 5,
                        totalTime: data.totalTime || 0,
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