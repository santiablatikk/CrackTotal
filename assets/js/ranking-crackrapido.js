/**
 * Ranking Crack Rápido - Compatible con Firebase compat v9.6.10
 * Ordenado por win rate (porcentaje de victorias)
 */

console.log('[RANKING CR] 🚀 Iniciando script de ranking Crack Rápido...');

// Variables globales
let rankingBody = null;
let historyList = null;
const RANKING_LIMIT = 15;

// --- Función para calcular el nivel del jugador ---
function getPlayerLevel(totalScore, winRate, matches) {
    if (matches < 3) return 'Novato';
    if (winRate >= 80 && totalScore >= 2000) return 'Crack Rápido';
    if (winRate >= 70 && totalScore >= 1500) return 'Experto';
    if (winRate >= 60 && totalScore >= 1000) return 'Avanzado';
    if (winRate >= 50 && totalScore >= 500) return 'Intermedio';
    return 'Principiante';
}

// --- Función para generar HTML del ranking ---
function generateRankingHTML(usersData) {
    if (!usersData || usersData.length === 0) {
        return '<tr><td colspan="5" class="empty-state">No hay jugadores registrados aún</td></tr>';
    }

    // Procesar y ordenar usuarios
    const processedUsers = usersData.map(user => {
        // Extraer datos de múltiples fuentes posibles
        const stats = user.stats?.crackrapido || user.crackrapido || {};
        const played = stats.played || stats.matches || 0;
        const wins = stats.wins || stats.victories || 0;
        const totalScore = stats.score || stats.totalScore || 0;
        const correctAnswers = stats.correctAnswers || 0;
        const bestStreak = stats.bestStreak || 0;

        // Calcular métricas
        const winRate = played > 0 ? ((wins / played) * 100) : 0;
        const avgScore = played > 0 ? (totalScore / played) : 0;
        const accuracy = correctAnswers > 0 ? ((correctAnswers / (correctAnswers + (stats.incorrectAnswers || 0))) * 100) : 0;

        return {
            displayName: user.displayName,
            played,
            wins,
            losses: played - wins,
            totalScore,
            winRate,
            avgScore,
            accuracy,
            bestStreak,
            level: getPlayerLevel(totalScore, winRate, played)
        };
    })
    .filter(user => user.played > 0) // Solo usuarios que han jugado
    .sort((a, b) => {
        // Ordenar por win rate (descendente), luego por partidas jugadas (descendente), luego por score total (descendente)
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.played !== a.played) return b.played - a.played;
        return b.totalScore - a.totalScore;
    })
    .slice(0, RANKING_LIMIT); // Top 15

    if (processedUsers.length === 0) {
        return '<tr><td colspan="5" class="empty-state">No hay jugadores que hayan completado partidas de Crack Rápido</td></tr>';
    }

    return processedUsers.map((user, index) => {
        const position = index + 1;
        const positionClass = position <= 3 ? `top-${position}` : '';
        
        return `
            <tr class="ranking-row ${positionClass}">
                <td class="position">
                    <span class="position-number">${position}</span>
                    ${position <= 3 ? `<i class="fas fa-trophy position-trophy"></i>` : ''}
                </td>
                <td class="player">
                    <div class="player-info">
                        <div class="player-name">${user.displayName}</div>
                        <div class="player-level ${user.level.toLowerCase().replace(' ', '-')}">${user.level}</div>
                    </div>
                </td>
                <td class="score">
                    <div class="score-main">${user.totalScore.toLocaleString()}</div>
                    <div class="score-detail">Promedio: ${Math.round(user.avgScore)}</div>
                </td>
                <td class="precision">
                    <div class="precision-main">${user.winRate.toFixed(1)}%</div>
                    <div class="precision-detail">${user.wins}/${user.played} victorias</div>
                </td>
                <td class="level hide-mobile">
                    <div class="level-main">${user.level}</div>
                    <div class="level-detail">Mejor racha: ${user.bestStreak}</div>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Función para generar HTML del historial ---
function generateHistoryHTML(matches) {
    if (!matches || matches.length === 0) {
        return '<div class="empty-state">No hay partidas registradas aún</div>';
    }

    // Filtrar solo partidas de Crack Rápido
    const filteredMatches = matches.filter(match => {
        const gameType = match.gameType?.toLowerCase();
        return gameType === 'crackrapido' || gameType === 'crack-rapido' || gameType === 'crack_rapido';
    });

    if (filteredMatches.length === 0) {
        return '<div class="empty-state">No hay partidas de Crack Rápido registradas</div>';
    }

    return filteredMatches.slice(0, 20).map(match => {
        const playerName = match.playerName || 'Jugador Anónimo';
        const score = match.score || 0;
        const result = match.result || 'unknown';
        const level = match.level || 1;
        const timeSpent = match.timeSpent || 0;
        const accuracy = match.accuracy || 0;

        // Formatear timestamp
        const getTime = (timestamp) => {
            if (!timestamp) return 'Hace un momento';
            
            try {
                let date;
                if (timestamp.toDate) {
                    date = timestamp.toDate();
                } else if (timestamp.seconds) {
                    date = new Date(timestamp.seconds * 1000);
                } else if (typeof timestamp === 'string') {
                    date = new Date(timestamp);
                } else {
                    date = new Date(timestamp);
                }
                
                const now = new Date();
                const diffInMinutes = Math.floor((now - date) / (1000 * 60));
                
                if (diffInMinutes < 1) return 'Hace un momento';
                if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
                if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} hs`;
                return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
            } catch (error) {
                return 'Fecha inválida';
            }
        };

        const formatDuration = (seconds) => {
            if (!seconds || seconds <= 0) return 'Sin tiempo';
            if (seconds < 60) return `${Math.round(seconds)}s`;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        };

        const resultClass = result === 'victory' ? 'victory' : result === 'defeat' ? 'defeat' : 'draw';
        const resultIcon = result === 'victory' ? '🏆' : result === 'defeat' ? '❌' : '⚖️';
        const resultText = result === 'victory' ? 'Victoria' : result === 'defeat' ? 'Derrota' : 'Empate';

        return `
            <div class="history-card crackrapido ${resultClass}">
                <div class="match-header">
                    <div class="match-result ${resultClass}">
                        <span class="result-icon">${resultIcon}</span>
                        <span class="result-text">${resultText}</span>
                    </div>
                    <div class="match-time">${getTime(match.timestamp)}</div>
                </div>
                <div class="match-details">
                    <div class="match-score">
                        <div class="score-value">${score.toLocaleString()}</div>
                        <div class="score-label">puntos</div>
                    </div>
                    <div class="match-info">
                        <div class="game-type">Crack Rápido - Nivel ${level}</div>
                        <div class="player-name">${playerName}</div>
                        ${timeSpent > 0 ? `<div class="duration">⏱️ ${formatDuration(timeSpent)}</div>` : ''}
                        ${accuracy > 0 ? `<div class="accuracy">🎯 ${accuracy.toFixed(1)}% precisión</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Configurar listener en tiempo real para el ranking ---
function setupRankingListener() {
    try {
        if (!window.firebase || !window.firebase.firestore) {
            console.error('[RANKING CR] Firebase no está inicializado para ranking');
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="5" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
            }
            return;
        }

        const db = window.firebase.firestore();
        const usersRef = db.collection('users');
        
        const unsubscribe = usersRef.onSnapshot((snapshot) => {
            console.log('[RANKING CR] Datos recibidos:', snapshot.size, 'usuarios');
            
            if (snapshot.empty) {
                console.log('[RANKING CR] No hay datos de usuarios');
                if (rankingBody) {
                    rankingBody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay jugadores registrados aún</td></tr>';
                }
                return;
            }

            const usersData = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Incluir solo usuarios con displayName válido
                if (data.displayName) {
                    usersData.push({
                        id: doc.id,
                        displayName: data.displayName,
                        ...data
                    });
                }
            });

            console.log(`[RANKING CR] Usuarios procesados: ${usersData.length}`);

            // Actualizar ranking (Top 15)
            if (rankingBody) {
                const rankingHTML = generateRankingHTML(usersData);
                rankingBody.innerHTML = rankingHTML;
                console.log('[RANKING CR] Tabla actualizada - Top', RANKING_LIMIT);
            }

        }, (error) => {
            console.error('[RANKING CR] Error en el listener:', error);
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="5" class="empty-state">Error al cargar el ranking. Reintentando...</td></tr>';
            }
            
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

// --- Configurar listener para historial ---
function setupHistoryListener() {
    try {
        if (!window.firebase || !window.firebase.firestore) {
            console.error('[RANKING CR] Firebase no está inicializado para historial');
            if (historyList) {
                historyList.innerHTML = '<div class="empty-state">Error de conexión. Recargá la página.</div>';
            }
            return;
        }

        const db = window.firebase.firestore();
        const matchesRef = db.collection('matches');
        const historyQuery = matchesRef
            .orderBy('timestamp', 'desc')
            .limit(30);

        const unsubscribe = historyQuery.onSnapshot((snapshot) => {
            console.log('[HISTORY CR] Datos recibidos:', snapshot.size, 'partidas');
            
            if (snapshot.empty) {
                console.log('[HISTORY CR] No hay datos de partidas');
                if (historyList) {
                    historyList.innerHTML = '<div class="empty-state">No hay historial disponible</div>';
                }
                return;
            }

            const matches = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                matches.push({
                    id: doc.id,
                    ...data
                });
            });

            console.log(`[HISTORY CR] Partidas procesadas: ${matches.length}`);

            // Actualizar historial
            if (historyList) {
                const historyHTML = generateHistoryHTML(matches);
                historyList.innerHTML = historyHTML;
                console.log('[HISTORY CR] Historial actualizado');
            }

        }, (error) => {
            console.error('[HISTORY CR] Error en el listener:', error);
            if (historyList) {
                historyList.innerHTML = '<div class="empty-state">Error al cargar el historial</div>';
            }
        });

        console.log('[HISTORY CR] Listener configurado correctamente');
        return unsubscribe;

    } catch (error) {
        console.error('[HISTORY CR] Error al configurar listener:', error);
        if (historyList) {
            historyList.innerHTML = '<div class="empty-state">Error de conexión</div>';
        }
    }
}

// --- Función de inicialización principal ---
function initializeRankingCrackRapido() {
    console.log('[RANKING CR] 🚀 Inicializando ranking de Crack Rápido...');
    
    // Elementos del DOM
    rankingBody = document.getElementById('ranking-body');
    historyList = document.getElementById('history-list');
    
    if (!rankingBody) {
        console.error('[RANKING CR] ❌ No se encontró el elemento ranking-body');
        return;
    }
    
    console.log('[RANKING CR] ✅ Elementos del DOM encontrados');
    
    // Función para inicializar Firebase y configurar listeners
    function setupFirebaseListeners() {
        if (!window.firebase || !window.firebase.firestore) {
            console.log('[RANKING CR] ⏳ Esperando Firebase...');
            setTimeout(setupFirebaseListeners, 1000);
            return;
        }
        
        console.log('[RANKING CR] 🔥 Firebase disponible, configurando listeners...');
        
        try {
            // Configurar listener del ranking
            setupRankingListener();
            
            // Configurar listener del historial
            if (historyList) {
                setupHistoryListener();
            }
            
            console.log('[RANKING CR] ✅ Todos los listeners configurados');
            
        } catch (error) {
            console.error('[RANKING CR] ❌ Error al configurar listeners:', error);
            
            // Mostrar mensaje de error en la tabla
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="5" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
            }
        }
    }
    
    // Iniciar configuración
    setupFirebaseListeners();
}

// Inicializar cuando el documento esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRankingCrackRapido);
} else {
    initializeRankingCrackRapido();
}

// También escuchar el evento personalizado de Firebase
window.addEventListener('firebaseReady', () => {
    console.log('[RANKING CR] 🔥 Evento firebaseReady recibido, reiniciando listeners...');
    setTimeout(() => {
        setupRankingListener();
        if (historyList) {
            setupHistoryListener();
        }
    }, 500);
});

console.log('[RANKING CR] 📜 Script de ranking Crack Rápido cargado');