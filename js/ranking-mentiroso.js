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

console.log('Ranking Mentiroso script loaded - Optimizado para móvil');

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
function getPlayerLevel(score, winRate) {
    if (winRate >= 95 && score >= 6000) return { level: "MAESTRO DEL ENGAÑO", color: "#f56565", icon: "🎭" };
    if (winRate >= 90 && score >= 5000) return { level: "MENTIROSO EXPERTO", color: "#fc8181", icon: "🎪" };
    if (winRate >= 85 && score >= 4000) return { level: "EMBAUCADOR", color: "#feb2b2", icon: "🃏" };
    if (winRate >= 80 && score >= 3000) return { level: "FARSANTE", color: "#56ab2f", icon: "🎨" };
    if (winRate >= 75 && score >= 2500) return { level: "ASTUTO", color: "#667eea", icon: "🎯" };
    if (winRate >= 70 && score >= 2000) return { level: "NOVATO", color: "#ed8936", icon: "🎲" };
    return { level: "APRENDIZ", color: "#999", icon: "🌱" };
}

// --- Función para generar HTML del ranking (Top 15) ---
function generateRankingHTML(usersData) {
    if (!usersData || usersData.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay datos disponibles</td></tr>';
    }

    // Filtrar y procesar datos de usuarios de manera más flexible
    const validUsers = usersData
        .filter(user => {
            // Buscar datos de Mentiroso en diferentes ubicaciones posibles
            const mentirosoData = user.mentiroso || user.stats?.mentiroso || user.stats?.Mentiroso;
            const hasScore = user.totalScore > 0 || user.score > 0 || (mentirosoData && mentirosoData.totalScore > 0);
            const hasWins = user.wins > 0 || (mentirosoData && mentirosoData.wins > 0);
            const hasPlayed = user.matchesPlayed > 0 || (mentirosoData && mentirosoData.played > 0);
            return mentirosoData || hasScore || hasWins || hasPlayed;
        })
        .map(user => {
            console.log('[RANKING MENTIROSO] Procesando usuario:', user);
            
            // Intentar obtener datos de diferentes ubicaciones
            const mentirosoData = user.mentiroso || user.stats?.mentiroso || user.stats?.Mentiroso || {};
            
            const totalScore = mentirosoData.totalScore || mentirosoData.score || user.totalScore || user.score || 0;
            const wins = mentirosoData.wins || user.wins || 0;
            const losses = mentirosoData.losses || user.losses || user.totalLosses || 0;
            const matches = mentirosoData.matches || mentirosoData.played || user.matchesPlayed || wins + losses || 0;
            
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
        const playerLevel = getPlayerLevel(user.totalScore, user.winRate);
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
                    <div class="secondary-stat">engaños</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat wins-stat">${user.wins}</div>
                    <div class="secondary-stat">${user.winRate.toFixed(0)}%</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat accuracy-stat">${user.winRate.toFixed(0)}%</div>
                    <div class="secondary-stat">éxito</div>
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
        const playerLevel = getPlayerLevel(score, isVictory ? 100 : 0);
        const playerName = match.playerName || (match.players && match.players[0]?.displayName) || 'Anónimo';
        const wasDeceived = match.deceived === true || match.wasDeceived === true;
        const deceptionSuccess = match.deceptionSuccess === true || match.successful === true;
        
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
                            ${isVictory ? '🎭 ENGAÑO EXITOSO' : (isTimeoutDefeat ? '⏰ TIEMPO AGOTADO' : '😞 DESCUBIERTO')}
                        </span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Puntuación:</span>
                        <span class="stat-value">${score.toLocaleString()} pts</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Tipo de mentira:</span>
                        <span class="stat-value">${match.lieType || match.category || 'Creativa'}</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Dificultad:</span>
                        <span class="stat-value">${match.difficulty || 'Normal'}</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Estado del engaño:</span>
                        <span class="stat-value ${deceptionSuccess ? 'wins-stat' : 'losses-stat'}">
                            ${deceptionSuccess ? '✅ Convincente' : '❌ Transparente'}
                        </span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Duración:</span>
                        <span class="stat-value">${Math.round(match.duration || match.timeSpent || 0)}s</span>
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
            console.log('[RANKING MENTIROSO] Datos recibidos:', snapshot.size, 'usuarios');
            
            if (snapshot.empty) {
                console.log('[RANKING MENTIROSO] No hay datos de usuarios');
                if (rankingBody) {
                    rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay jugadores registrados aún</td></tr>';
                }
                return;
            }

            const usersData = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('[RANKING MENTIROSO] Procesando usuario:', data);
                
                if (data.displayName) {
                    usersData.push({
                        id: doc.id,
                        displayName: data.displayName,
                        ...data
                    });
                }
            });

            console.log(`[RANKING MENTIROSO] Usuarios procesados: ${usersData.length}`);

            // Actualizar ranking (Top 15)
            if (rankingBody) {
                const rankingHTML = generateRankingHTML(usersData);
                rankingBody.innerHTML = rankingHTML;
                console.log('[RANKING MENTIROSO] Tabla actualizada - Top', RANKING_LIMIT);
            }

        }, (error) => {
            console.error('[RANKING MENTIROSO] Error en el listener:', error);
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">Error al cargar el ranking. Reintentando...</td></tr>';
            }
            
            setTimeout(() => {
                console.log('[RANKING MENTIROSO] Reintentando configuración...');
                setupRankingListener();
            }, 3000);
        });

        console.log('[RANKING MENTIROSO] Listener configurado correctamente');
        return unsubscribe;

    } catch (error) {
        console.error('[RANKING MENTIROSO] Error al configurar listener:', error);
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
            console.log('[HISTORY MENTIROSO] Datos recibidos:', snapshot.size, 'partidas');
            
            if (snapshot.empty) {
                console.log('[HISTORY MENTIROSO] No hay datos de partidas');
                if (historyList) {
                    historyList.innerHTML = '<div class="empty-state">No hay historial disponible</div>';
                }
                return;
            }

            const matches = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('[HISTORY MENTIROSO] Procesando partida:', data);
                
                // Filtrar SOLO partidas de Mentiroso
                if (data.gameType === 'mentiroso' || data.gameType === 'Mentiroso' || 
                    data.gameMode === 'Mentiroso' || data.gameMode === 'mentiroso') {
                    matches.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            console.log(`[HISTORY MENTIROSO] Partidas procesadas: ${matches.length}`);

            // Actualizar historial
            if (historyList) {
                const historyHTML = generateHistoryHTML(matches);
                historyList.innerHTML = historyHTML;
                console.log('[HISTORY MENTIROSO] Historial actualizado');
            }

        }, (error) => {
            console.error('[HISTORY MENTIROSO] Error en el listener:', error);
            if (historyList) {
                historyList.innerHTML = '<div class="empty-state">Error al cargar el historial</div>';
            }
        });

        console.log('[HISTORY MENTIROSO] Listener configurado correctamente');
        return unsubscribe;

    } catch (error) {
        console.error('[HISTORY MENTIROSO] Error al configurar listener:', error);
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
                        <div style="width: 12px; height: 12px; background: var(--mentiroso-primary); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                        <span>Buscando a los mejores mentirosos...</span>
                    </div>
                </td>
            </tr>
        `;
    }
    
    if (historyList) {
        historyList.innerHTML = `
            <div class="loading-state">
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; background: var(--mentiroso-primary); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                    <span>Revisando las últimas mentiras...</span>
                </div>
            </div>
        `;
    }
}

// --- Inicializar cuando el DOM esté listo ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('[RANKING MENTIROSO] DOM loaded, configurando ranking optimizado...');
    
    // Mostrar estado de carga
    showLoadingState();
    
    // Configurar listeners con demora para asegurar inicialización de Firebase
    setTimeout(() => {
    if (db) {
            setupRankingListener();
            setupHistoryListener();
    } else {
            console.error('[RANKING MENTIROSO] Firebase no está inicializado');
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
            }
        }
    }, 1000);
}); 