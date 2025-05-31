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
    const winRate = stats.wins / stats.gamesPlayed;
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

    // Procesar datos de usuarios con el nuevo sistema
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
            
            // Calcular rating usando el nuevo sistema
            const rating = calculateMentirosoRating(stats);
            const winRate = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;
            const playerLevel = getPlayerLevel(rating, stats);
            
            return {
                id: user.id,
                displayName: user.displayName || 'Anónimo',
                rating: rating,
                stats: stats,
                winRate: winRate,
                playerLevel: playerLevel,
                efficiency: stats.gamesPlayed > 0 ? ((stats.successfulDeceptions + stats.liesDetected) / stats.gamesPlayed) : 0
            };
        })
        .sort((a, b) => {
            // Ordenar por rating, luego por win rate, luego por juegos jugados
            if (b.rating !== a.rating) return b.rating - a.rating;
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            return b.stats.gamesPlayed - a.stats.gamesPlayed;
        })
        .slice(0, RANKING_LIMIT);

    if (validUsers.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay jugadores registrados aún</td></tr>';
    }

    return validUsers.map((user, index) => {
        const isTopPlayer = index < 3;
        const position = index + 1;
        const efficiency = (user.efficiency * 100).toFixed(0);
        
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
                    <div class="player-description">${user.playerLevel.description}</div>
                </td>
                <td class="rating-info">
                    <div class="main-rating">${user.rating.toLocaleString()}</div>
                    <div class="rating-label">Rating</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat">${user.stats.gamesPlayed}</div>
                    <div class="secondary-stat">juegos</div>
                    <div class="win-percentage">${user.winRate.toFixed(0)}% wins</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat deception-stat">${user.stats.successfulDeceptions}</div>
                    <div class="secondary-stat">engaños</div>
                    <div class="detection-stat">${user.stats.liesDetected} detectadas</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat efficiency-stat">${efficiency}%</div>
                    <div class="secondary-stat">eficiencia</div>
                    <div class="perfect-rounds">${user.stats.perfectRounds} perfectas</div>
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
        const scoreDiff = myScore - opponentScore;
        const gameType = match.gameResult || 'Normal';
        
        // Determinar el tipo de victoria/derrota
        let resultIcon = '';
        let resultText = '';
        let resultClass = '';
        
        if (isVictory) {
            if (myScore === 18 && opponentScore === 0) {
                resultIcon = '🎭';
                resultText = 'VICTORIA PERFECTA';
                resultClass = 'perfect-victory';
            } else if (scoreDiff >= 10) {
                resultIcon = '🏆';
                resultText = 'VICTORIA DOMINANTE';
                resultClass = 'dominant-victory';
            } else {
                resultIcon = '✅';
                resultText = 'VICTORIA';
                resultClass = 'normal-victory';
            }
        } else {
            if (opponentScore === 18 && myScore === 0) {
                resultIcon = '😵';
                resultText = 'DERROTA TOTAL';
                resultClass = 'total-defeat';
            } else if (scoreDiff <= -10) {
                resultIcon = '😞';
                resultText = 'DERROTA AMPLIA';
                resultClass = 'wide-defeat';
            } else {
                resultIcon = '❌';
                resultText = 'DERROTA';
                resultClass = 'normal-defeat';
            }
        }
        
        return `
            <div class="history-item ${resultClass}">
                <div class="history-header">
                    <div class="match-result">
                        <span class="result-icon">${resultIcon}</span>
                        <span class="result-text">${resultText}</span>
                    </div>
                    <span class="history-date">${formatCompactDate(match.timestamp)}</span>
                </div>
                <div class="score-display">
                    <div class="score-section my-score">
                        <div class="score-value">${myScore}</div>
                        <div class="score-label">Tú</div>
                    </div>
                    <div class="vs-separator">VS</div>
                    <div class="score-section opponent-score">
                        <div class="score-value">${opponentScore}</div>
                        <div class="score-label">${match.opponents?.[0]?.name || 'Oponente'}</div>
                    </div>
                </div>
                <div class="match-details">
                    <div class="detail-item">
                        <span class="detail-label">Duración:</span>
                        <span class="detail-value">${match.duration || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Modo:</span>
                        <span class="detail-value">${gameType}</span>
                    </div>
                    ${match.perfectRound ? '<div class="perfect-indicator">🎯 Ronda Perfecta</div>' : ''}
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