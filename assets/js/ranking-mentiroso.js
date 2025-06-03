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

console.log('Ranking Mentiroso script loaded - Sistema mejorado');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

// --- Configuración ---
const RANKING_LIMIT = 15; // Solo mostrar top 15
const HISTORY_LIMIT = 15; // Últimas 15 partidas en historial

// --- Función para formatear fecha compacta para móvil ---
function formatCompactDate(firebaseTimestamp) {
    if (!firebaseTimestamp) return '---';
    const date = firebaseTimestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

// --- Sistema de puntuación mejorado para Mentiroso ---
function calculateMentirosoRating(stats) {
    if (!stats.gamesPlayed || stats.gamesPlayed === 0) return 0;
    
    // Puntos base por victoria/derrota
    const baseScore = (stats.wins * 100) - (stats.losses * 50);
    
    // Bonificaciones por habilidades específicas de Mentiroso
    const deceptionBonus = (stats.successfulDeceptions || 0) * 25; // Engaños exitosos
    const detectionBonus = (stats.liesDetected || 0) * 30; // Mentiras detectadas
    const perfectRoundsBonus = (stats.perfectRounds || 0) * 50; // Rondas perfectas (18/18)
    
    // Penalizaciones
    const timeoutPenalty = (stats.timeouts || 0) * 15; // Penalización por timeout
    const falseAccusationPenalty = (stats.falseAccusations || 0) * 20; // Acusaciones falsas
    
    // Multiplicador por consistencia (win rate)
    const winRate = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;
    const consistencyMultiplier = 1 + (winRate * 0.5); // Hasta 50% bonus por consistencia
    
    // Multiplicador por experiencia (más juegos = ligeramente mejor rating)
    const experienceMultiplier = 1 + Math.min(stats.gamesPlayed * 0.01, 0.3); // Hasta 30% bonus
    
    const finalRating = Math.max(0, 
        (baseScore + deceptionBonus + detectionBonus + perfectRoundsBonus - timeoutPenalty - falseAccusationPenalty) 
        * consistencyMultiplier * experienceMultiplier
    );
    
    return Math.round(finalRating);
}

// --- Función para obtener nivel del jugador basado en rating y estadísticas ---
function getPlayerLevel(rating, stats) {
    const winRate = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;
    const avgPerfection = stats.gamesPlayed > 0 ? ((stats.perfectRounds || 0) / stats.gamesPlayed) * 100 : 0;
    
    // Niveles basados en rating y performance
    if (rating >= 8000 && winRate >= 85 && avgPerfection >= 30) {
        return { level: "MAESTRO DEL ENGAÑO", color: "#ff6b6b", icon: "👑", description: "Domina el arte del engaño" };
    }
    if (rating >= 6000 && winRate >= 80 && avgPerfection >= 20) {
        return { level: "GRAN EMBAUCADOR", color: "#ff8e53", icon: "🎭", description: "Experto en mentiras y detección" };
    }
    if (rating >= 4500 && winRate >= 75) {
        return { level: "FARSANTE EXPERTO", color: "#ff6348", icon: "🃏", description: "Hábil en el arte de la mentira" };
    }
    if (rating >= 3000 && winRate >= 70) {
        return { level: "DETECTOR ASTUTO", color: "#feca57", icon: "🕵️", description: "Bueno detectando engaños" };
    }
    if (rating >= 2000 && winRate >= 65) {
        return { level: "MENTIROSO HÁBIL", color: "#48dbfb", icon: "🎪", description: "Comienza a dominar el juego" };
    }
    if (rating >= 1000 && winRate >= 50) {
        return { level: "APRENDIZ", color: "#0abde3", icon: "🎲", description: "Aprendiendo las reglas" };
    }
    return { level: "NOVATO", color: "#95a5a6", icon: "🌱", description: "Recién comenzando" };
}

// --- Función para generar HTML del ranking mejorado ---
function generateRankingHTML(usersData) {
    if (!usersData || usersData.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay datos disponibles</td></tr>';
    }

    // Procesar datos de usuarios con el nuevo sistema mejorado
    const validUsers = usersData
        .filter(user => {
            const mentirosoData = user.mentiroso || user.stats?.mentiroso || {};
            return mentirosoData.gamesPlayed > 0 || mentirosoData.wins > 0;
        })
        .map(user => {
            const mentirosoData = user.mentiroso || user.stats?.mentiroso || {};
            
            // Extraer estadísticas completas
            const stats = {
                gamesPlayed: mentirosoData.gamesPlayed || mentirosoData.matches || 0,
                wins: mentirosoData.wins || 0,
                losses: mentirosoData.losses || 0,
                successfulDeceptions: mentirosoData.successfulDeceptions || 0,
                liesDetected: mentirosoData.liesDetected || 0,
                perfectRounds: mentirosoData.perfectRounds || 0,
                timeouts: mentirosoData.timeouts || 0,
                falseAccusations: mentirosoData.falseAccusations || 0,
                totalPointsWon: mentirosoData.totalPointsWon || 0,
                avgGameDuration: mentirosoData.avgGameDuration || 0
            };
            
            // Calcular rating usando el sistema mejorado
            const rating = calculateMentirosoRating(stats);
            const winRate = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;
            const playerLevel = getPlayerLevel(rating, stats);
            
            // Calcular estadísticas derivadas específicas del juego
            const deceptionRate = stats.gamesPlayed > 0 ? (stats.successfulDeceptions / stats.gamesPlayed) * 100 : 0;
            const detectionRate = stats.gamesPlayed > 0 ? (stats.liesDetected / stats.gamesPlayed) * 100 : 0;
            const perfectRate = stats.gamesPlayed > 0 ? (stats.perfectRounds / stats.gamesPlayed) * 100 : 0;
            const reliability = stats.gamesPlayed > 0 ? Math.max(0, 100 - ((stats.timeouts + stats.falseAccusations) / stats.gamesPlayed) * 100) : 100;
            
            // Calcular promedio de puntos por juego
            const avgPointsPerGame = stats.gamesPlayed > 0 ? Math.round(stats.totalPointsWon / stats.gamesPlayed) : 0;
            
            return {
                id: user.id,
                displayName: user.displayName || 'Anónimo',
                rating: rating,
                stats: stats,
                winRate: winRate,
                playerLevel: playerLevel,
                deceptionRate: deceptionRate,
                detectionRate: detectionRate,
                perfectRate: perfectRate,
                reliability: reliability,
                avgPointsPerGame: avgPointsPerGame,
                skillBalance: Math.round((deceptionRate + detectionRate) / 2), // Balance entre engañar y detectar
                lastPlayed: user.lastPlayed || mentirosoData.lastPlayed
            };
        })
        .sort((a, b) => {
            // Ordenar por win rate primero, luego por rating, luego por balance de habilidades
            if (Math.abs(b.winRate - a.winRate) > 1) return b.winRate - a.winRate;
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.skillBalance - a.skillBalance;
        })
        .slice(0, RANKING_LIMIT);

    if (validUsers.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay jugadores registrados aún</td></tr>';
    }

    return validUsers.map((user, index) => {
        const isTopPlayer = index < 3;
        const position = index + 1;
        
        // Determinar especialización del jugador
        let specialization = "EQUILIBRADO";
        let specializationIcon = "⚖️";
        let specializationColor = "#6b7280";
        
        if (user.deceptionRate > user.detectionRate + 15) {
            specialization = "EMBAUCADOR";
            specializationIcon = "🎭";
            specializationColor = "#ef4444";
        } else if (user.detectionRate > user.deceptionRate + 15) {
            specialization = "DETECTIVE";
            specializationIcon = "🕵️";
            specializationColor = "#3b82f6";
        } else if (user.perfectRate >= 20) {
            specialization = "PERFECCIONISTA";
            specializationIcon = "💎";
            specializationColor = "#8b5cf6";
        }
        
        return `
            <tr class="ranking-row ${isTopPlayer ? 'top-player' : ''}" data-rating="${user.rating}">
                <td class="ranking-position">
                    <div class="position-number">${position}</div>
                    <div class="position-icon">
                        ${position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : ''}
                    </div>
                </td>
                <td class="player-info">
                    <div class="player-name">${user.displayName}</div>
                    <div class="player-level" style="color: ${user.playerLevel.color}">
                        ${user.playerLevel.icon} ${user.playerLevel.level}
                    </div>
                    <div class="player-specialization" style="color: ${specializationColor}">
                        ${specializationIcon} ${specialization}
                    </div>
                </td>
                <td class="rating-info">
                    <div class="main-rating">${user.rating.toLocaleString()}</div>
                    <div class="rating-label">Rating</div>
                    <div class="points-avg">~${user.avgPointsPerGame} pts/juego</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat">${user.stats.gamesPlayed}</div>
                    <div class="secondary-stat">juegos</div>
                    <div class="win-percentage">${user.winRate.toFixed(0)}% wins</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat deception-stat">${user.stats.successfulDeceptions}</div>
                    <div class="secondary-stat">engaños (${user.deceptionRate.toFixed(0)}%)</div>
                    <div class="detection-stat">${user.stats.liesDetected} detectadas (${user.detectionRate.toFixed(0)}%)</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat reliability-stat">${user.reliability.toFixed(0)}%</div>
                    <div class="secondary-stat">confiabilidad</div>
                    ${user.perfectRate >= 10 ? `<div class="perfect-badge">💎 ${user.perfectRate.toFixed(0)}% perfectas</div>` : ''}
                    ${user.skillBalance >= 70 ? '<div class="skill-badge excellent">🎯 MAESTRO</div>' :
                      user.skillBalance >= 50 ? '<div class="skill-badge good">⚡ HÁBIL</div>' :
                      user.skillBalance >= 30 ? '<div class="skill-badge average">📈 NOVATO</div>' : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// --- Función para generar HTML del historial mejorado ---
function generateHistoryHTML(matches) {
    if (!matches || matches.length === 0) {
        return '<div class="empty-state">No hay historial disponible</div>';
    }

    // Obtener usuario actual
    const currentUser = localStorage.getItem('currentUser');
    let userMatches = matches;
    
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

    if (userMatches.length === 0) {
        userMatches = matches.slice(0, HISTORY_LIMIT);
    }

    const recentMatches = userMatches
        .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
        .slice(0, HISTORY_LIMIT);

    return recentMatches.map(match => {
        const isVictory = match.result === 'victory';
        const myScore = match.myScore || 0;
        const opponentScore = match.opponents?.[0]?.score || 0;
        const opponentName = match.opponents?.[0]?.name || 'Oponente';
        const scoreDiff = myScore - opponentScore;
        const playerName = match.playerName || 'Anónimo';
        
        // Determinar resultado
        let resultData;
        if (isVictory) {
            if (scoreDiff >= 10) {
                resultData = { text: 'VICTORIA', icon: '👑', class: 'dominant-win', color: '#10b981' };
            } else {
                resultData = { text: 'GANÓ', icon: '🎯', class: 'close-win', color: '#059669' };
            }
        } else {
            if (Math.abs(scoreDiff) >= 10) {
                resultData = { text: 'DERROTA', icon: '😓', class: 'clear-loss', color: '#ef4444' };
            } else {
                resultData = { text: 'PERDIÓ', icon: '😤', class: 'close-loss', color: '#dc2626' };
            }
        }
        
        return `
            <div class="history-item">
                <!-- Header compacto -->
                <div class="history-header">
                    <span class="history-player-name">🎭 ${playerName}</span>
                    <span class="history-date">${formatCompactDate(match.timestamp)}</span>
                </div>

                <!-- Duelo principal -->
                <div class="main-summary">
                    <div class="player-section">
                        <div class="player-name">🎭 ${playerName}</div>
                        <div class="player-score" style="color: ${isVictory ? '#10b981' : '#ef4444'}">${myScore}</div>
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

                <!-- Estadísticas clave simplificadas -->
                <div class="key-stats">
                    <div class="stat-item">
                        <div class="stat-icon">📊</div>
                        <div class="stat-value" style="color: ${scoreDiff >= 0 ? '#10b981' : '#ef4444'}">${scoreDiff >= 0 ? '+' : ''}${scoreDiff}</div>
                        <div class="stat-label">Diferencia</div>
                        <div class="stat-detail">${Math.abs(scoreDiff) >= 10 ? 'Amplia' : Math.abs(scoreDiff) >= 5 ? 'Buena' : 'Reñida'}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🎭</div>
                        <div class="stat-value">${(match.successfulDeceptions || 0)}</div>
                        <div class="stat-label">Engaños</div>
                        <div class="stat-detail">exitosos</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🕵️</div>
                        <div class="stat-value">${(match.liesDetected || 0)}</div>
                        <div class="stat-label">Detecciones</div>
                        <div class="stat-detail">de mentiras</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">💪</div>
                        <div class="stat-value">${myScore > opponentScore ? 'SUPERIOR' : myScore === opponentScore ? 'IGUAL' : 'INFERIOR'}</div>
                        <div class="stat-label">Rendimiento</div>
                        <div class="stat-detail">${isVictory ? 'Ganador' : 'Perdedor'}</div>
                    </div>
                </div>

                <!-- Resultado simplificado -->
                <div class="game-specific">
                    <div class="specific-label">
                        <span style="color: ${resultData.color}">🎭</span>
                        Resultado del engaño
                    </div>
                    <div class="specific-content">
                        <div class="specific-tag" style="color: ${resultData.color}; border-color: ${resultData.color}40">
                            ${resultData.text}
                        </div>
                        ${Math.abs(scoreDiff) >= 10 ? '<div class="specific-tag" style="color: #8b5cf6; border-color: #8b5cf640;">🔥 DOMINANTE</div>' : ''}
                        ${Math.abs(scoreDiff) <= 2 ? '<div class="specific-tag" style="color: #f59e0b; border-color: #f59e0b40;">⚡ REÑIDO</div>' : ''}
                    </div>
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