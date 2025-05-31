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
            const hasScore = user.totalScore > 0 || user.score > 0 || (pasalacheData && (pasalacheData.totalScore > 0 || pasalacheData.score > 0));
            const hasWins = user.wins > 0 || (pasalacheData && pasalacheData.wins > 0);
            const hasPlayed = (pasalacheData && pasalacheData.played > 0);
            return pasalacheData || hasScore || hasWins || hasPlayed;
        })
        .map(user => {
            console.log('[RANKING PC] Procesando usuario:', user);
            
            // Intentar obtener datos de diferentes ubicaciones
            const pasalacheData = user.pasalache || user.stats?.pasalache || user.stats?.pasalaChe || user.stats?.PasalaChe || {};
            
            // Datos específicos de Pasala Che: score acumulativo de letras, wins, partidas jugadas
            const totalScore = pasalacheData.score || user.totalScore || user.score || 0;
            const wins = pasalacheData.wins || user.wins || 0;
            const losses = pasalacheData.losses || user.losses || user.totalLosses || 0;
            const matches = pasalacheData.played || user.matchesPlayed || Math.max(wins + losses, pasalacheData.matches || 0);
            
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
            // Ordenar por total score primero (letras acumuladas), luego por wins, luego por win rate
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.winRate - a.winRate;
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
                    <div class="secondary-stat">letras total</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat">${user.matches}</div>
                    <div class="secondary-stat">partidas</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat wins-stat">${user.wins}</div>
                    <div class="secondary-stat">${user.winRate.toFixed(0)}% éxito</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat losses-stat">${user.losses}</div>
                    <div class="secondary-stat">derrotas</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat accuracy-stat">${user.avgScore.toLocaleString()}</div>
                    <div class="secondary-stat">prom/partida</div>
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
        const isVictory = match.result === 'victory' || match.won === true;
        const isTimeoutDefeat = match.result === 'timeout' || match.timeDefeat === true || match.defeatByTime === true || match.timeOut === true;
        const score = match.score || (match.players && match.players[0]?.score) || 0;
        const playerLevel = getPlayerLevel(score, isVictory ? 100 : 0, 1);
        const playerName = match.playerName || (match.players && match.players[0]?.displayName) || 'Anónimo';
        const duration = Math.round(match.timeSpent || match.duration || 0);
        const difficulty = match.difficulty || 'Normal';
        const passes = match.passes || 0; // Específico de Pasala Che
        
        // Determinar resultado y color
        let resultData;
        if (isVictory) {
            resultData = { text: 'VICTORIA', icon: '🏆', class: 'victory', color: '#10b981' };
        } else if (isTimeoutDefeat) {
            resultData = { text: 'TIEMPO', icon: '⏰', class: 'timeout', color: '#f59e0b' };
        } else {
            resultData = { text: 'DERROTA', icon: '❌', class: 'defeat', color: '#ef4444' };
        }
        
        // Calcular velocidad (letras por segundo)
        const lettersPerSecond = duration > 0 ? Math.round(score / duration) : 0;
        
        return `
            <div class="history-item">
                <!-- Header compacto -->
                <div class="history-header">
                    <span class="history-player-name">🏈 ${playerName}</span>
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
                        <div class="player-score" style="color: ${resultData.color}">${score.toLocaleString()}</div>
                        <div style="font-size: 0.6rem; color: var(--ranking-text-muted);">letras</div>
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
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${duration}s</div>
                        <div class="stat-label">Tiempo</div>
                        <div class="stat-detail">${duration < 60 ? 'Rápido' : duration < 120 ? 'Normal' : 'Lento'}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-value">${lettersPerSecond}</div>
                        <div class="stat-label">Velocidad</div>
                        <div class="stat-detail">letras/seg</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-value">${difficulty}</div>
                        <div class="stat-label">Dificultad</div>
                        <div class="stat-detail">${isVictory ? 'Completado' : 'Fallido'}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🔄</div>
                        <div class="stat-value">${passes}</div>
                        <div class="stat-label">Pases</div>
                        <div class="stat-detail">${passes === 0 ? 'Sin pases' : passes === 1 ? '1 pase' : `${passes} pases`}</div>
                    </div>
                </div>

                <!-- Análisis simplificado -->
                ${(isVictory || score >= 1000 || lettersPerSecond >= 10) ? `
                <div class="performance-insight">
                    <div class="insight-text">
                        ${isVictory && lettersPerSecond >= 15 ? 
                            '<span class="insight-highlight">¡Velocidad increíble!</span> Completaste muy rápido.' :
                        isVictory ? 
                            '<span class="insight-highlight">¡Excelente!</span> Completaste la palabra exitosamente.' :
                        lettersPerSecond >= 20 ? 
                            '<span class="insight-highlight">Máquina de escribir</span> - Velocidad excepcional.' :
                        score >= 2000 ? 
                            '<span class="insight-highlight">Gran progreso</span> - Muchas letras antes del final.' :
                            `<span class="insight-highlight">Buen intento</span> - Conseguiste ${score.toLocaleString()} letras.`
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