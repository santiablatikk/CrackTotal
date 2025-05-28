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