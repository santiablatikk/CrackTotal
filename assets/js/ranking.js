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

console.log('Ranking Pasala Che script loaded - Optimizado para móvil');

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

// --- Función para obtener nivel del jugador ---
function getPlayerLevel(totalScore, winRate, matches) {
    if (winRate >= 90 && totalScore >= 5000 && matches >= 20) return { level: "CRACK TOTAL", color: "#3182ce", icon: "👑" };
    if (winRate >= 85 && totalScore >= 4000 && matches >= 15) return { level: "CRACK", color: "#4299e1", icon: "⭐" };
    if (winRate >= 80 && totalScore >= 3000 && matches >= 10) return { level: "EXPERTO", color: "#56ab2f", icon: "🔥" };
    if (winRate >= 75 && totalScore >= 2500 && matches >= 8) return { level: "AVANZADO", color: "#667eea", icon: "💪" };
    if (winRate >= 70 && totalScore >= 2000 && matches >= 5) return { level: "INTERMEDIO", color: "#764ba2", icon: "📚" };
    if (winRate >= 60 && totalScore >= 1000 && matches >= 3) return { level: "NOVATO", color: "#ed8936", icon: "🎯" };
    return { level: "PRINCIPIANTE", color: "#999", icon: "🌱" };
}

// --- Función para generar HTML del ranking (Top 15) ---
function generateRankingHTML(usersData) {
    if (!usersData || usersData.length === 0) {
        return '<tr><td colspan="7" class="empty-state">No hay datos disponibles</td></tr>';
    }

    // Filtrar y procesar datos de usuarios de manera más flexible
    const validUsers = usersData
        .filter(user => {
            // Buscar datos de Pasala Che en diferentes ubicaciones posibles
            const pasalacheData = user.pasalache || user.stats?.pasalache || user.stats?.pasalaChe || user.stats?.PasalaChe;
            const hasScore = user.totalScore > 0 || user.score > 0 || (pasalacheData && pasalacheData.totalScore > 0);
            const hasWins = user.wins > 0 || (pasalacheData && pasalacheData.wins > 0);
            return pasalacheData || hasScore || hasWins;
        })
        .map(user => {
            console.log('[RANKING PC] Procesando usuario:', user);
            
            // Intentar obtener datos de diferentes ubicaciones
            const pasalacheData = user.pasalache || user.stats?.pasalache || user.stats?.pasalaChe || user.stats?.PasalaChe || {};
            
            const totalScore = pasalacheData.totalScore || user.totalScore || user.score || 0;
            const wins = pasalacheData.wins || user.wins || 0;
            const losses = pasalacheData.losses || user.losses || user.totalLosses || 0;
            const matches = pasalacheData.matches || user.matchesPlayed || wins + losses || 0;
            
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
        return '<tr><td colspan="7" class="empty-state">No hay jugadores registrados aún</td></tr>';
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
                    <div class="secondary-stat">partidas</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat wins-stat">${user.wins}</div>
                    <div class="secondary-stat">${user.winRate.toFixed(0)}%</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat losses-stat">${user.losses}</div>
                    <div class="secondary-stat">derrotas</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat accuracy-stat">${user.winRate.toFixed(0)}%</div>
                    <div class="secondary-stat">efectividad</div>
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
        const isVictory = match.result === 'victory' || match.won === true;
        const isTimeoutDefeat = match.result === 'timeout' || match.timeDefeat === true || match.defeatByTime === true || match.timeOut === true;
        const score = match.score || (match.players && match.players[0]?.score) || 0;
        const playerLevel = getPlayerLevel(score, isVictory ? 100 : 0, 1);
        const playerName = match.playerName || (match.players && match.players[0]?.displayName) || 'Anónimo';
        const defeatReason = match.defeatReason || (isTimeoutDefeat ? 'Tiempo agotado' : 'Normal');
        
        return `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-player-name">${playerName}</span>
                    <span class="history-date">${formatCompactDate(match.timestamp)}</span>
                </div>
                <div class="history-stats">
                    <div class="stat-group primary-stat-group">
                        <span class="stat-label">Resultado:</span>
                        <span class="stat-value result-highlight ${isVictory ? 'wins-stat' : 'losses-stat'}">
                            ${isVictory ? '🏆 VICTORIA' : (isTimeoutDefeat ? '⏰ TIEMPO AGOTADO' : '❌ DERROTA')}
                        </span>
                    </div>
                    <div class="stat-group primary-stat-group">
                        <span class="stat-label">Tiempo total:</span>
                        <span class="stat-value time-highlight">${Math.round(match.timeSpent || match.duration || 0)}s</span>
                    </div>
                    <div class="stat-group primary-stat-group">
                        <span class="stat-label">Letras correctas:</span>
                        <span class="stat-value accuracy-highlight">${score.toLocaleString()}</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Dificultad:</span>
                        <span class="stat-value">${match.difficulty || 'Normal'}</span>
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
            console.log('[RANKING PC] Datos recibidos:', snapshot.size, 'usuarios');
            
            if (snapshot.empty) {
                console.log('[RANKING PC] No hay datos de usuarios');
                if (rankingBody) {
                    rankingBody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay jugadores registrados aún</td></tr>';
                }
                return;
            }

            const usersData = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('[RANKING PC] Procesando usuario:', data);
                
                if (data.displayName) {
                    usersData.push({
                        id: doc.id,
                        displayName: data.displayName,
                        ...data
                    });
                }
            });

            console.log(`[RANKING PC] Usuarios procesados: ${usersData.length}`);

            // Actualizar ranking (Top 15)
            if (rankingBody) {
                const rankingHTML = generateRankingHTML(usersData);
                rankingBody.innerHTML = rankingHTML;
                console.log('[RANKING PC] Tabla actualizada - Top', RANKING_LIMIT);
            }

        }, (error) => {
            console.error('[RANKING PC] Error en el listener:', error);
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="7" class="empty-state">Error al cargar el ranking. Reintentando...</td></tr>';
            }
            
            setTimeout(() => {
                console.log('[RANKING PC] Reintentando configuración...');
                setupRankingListener();
            }, 3000);
        });

        console.log('[RANKING PC] Listener configurado correctamente');
        return unsubscribe;

    } catch (error) {
        console.error('[RANKING PC] Error al configurar listener:', error);
        if (rankingBody) {
            rankingBody.innerHTML = '<tr><td colspan="7" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
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
            console.log('[HISTORY PC] Datos recibidos:', snapshot.size, 'partidas');
            
            if (snapshot.empty) {
                console.log('[HISTORY PC] No hay datos de partidas');
                if (historyList) {
                    historyList.innerHTML = '<div class="empty-state">No hay historial disponible</div>';
                }
            return;
        }

            const matches = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('[HISTORY PC] Procesando partida:', data);

                // Filtrar SOLO partidas de Pasala Che
                if (data.gameMode === 'Pasalache' || data.gameMode === 'pasalache' || 
                    data.gameType === 'pasalache' || data.gameType === 'pasala-che' || data.gameType === 'PasalaChe') {
                    matches.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            console.log(`[HISTORY PC] Partidas procesadas: ${matches.length}`);

            // Actualizar historial
            if (historyList) {
                const historyHTML = generateHistoryHTML(matches);
                historyList.innerHTML = historyHTML;
                console.log('[HISTORY PC] Historial actualizado');
            }

        }, (error) => {
            console.error('[HISTORY PC] Error en el listener:', error);
            if (historyList) {
                historyList.innerHTML = '<div class="empty-state">Error al cargar el historial</div>';
            }
        });

        console.log('[HISTORY PC] Listener configurado correctamente');
        return unsubscribe;

    } catch (error) {
        console.error('[HISTORY PC] Error al configurar listener:', error);
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
                <td colspan="7" class="loading-state">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <div style="width: 12px; height: 12px; background: var(--pasalache-primary); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                        <span>Buscando a los cracks...</span>
                    </div>
                </td>
            </tr>
        `;
    }
    
    if (historyList) {
        historyList.innerHTML = `
            <div class="loading-state">
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; background: var(--pasalache-primary); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                    <span>Revisando tus partidos...</span>
                </div>
            </div>
        `;
    }
}

// --- Inicializar cuando el DOM esté listo ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('[RANKING PC] DOM loaded, configurando ranking optimizado...');
    
    // Mostrar estado de carga
    showLoadingState();
    
    // Configurar listeners con demora para asegurar inicialización de Firebase
    setTimeout(() => {
    if (db) {
            setupRankingListener();
            setupHistoryListener();
    } else {
            console.error('[RANKING PC] Firebase no está inicializado');
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="7" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
            }
        }
    }, 1000);
}); 