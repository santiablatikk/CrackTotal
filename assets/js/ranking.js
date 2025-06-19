// Usamos Firebase cargado globalmente en lugar de importaciones ES6
// Estas funciones estarán disponibles a través de window.firebase.firestore
console.log('Ranking Pasala Che script loaded - Sistema corregido v2.0');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

// --- Configuración ---
const RANKING_LIMIT = 15; // Solo mostrar top 15
const HISTORY_LIMIT = 20; // Más partidas en historial

// --- Función para formatear fecha compacta para móvil ---
function formatCompactDate(firebaseTimestamp) {
    if (!firebaseTimestamp) return '---';
    
    let date;
    if (firebaseTimestamp.toDate) {
        date = firebaseTimestamp.toDate();
    } else if (firebaseTimestamp.seconds) {
        date = new Date(firebaseTimestamp.seconds * 1000);
    } else {
        date = new Date(firebaseTimestamp);
    }
    
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

// --- Función para obtener nivel del jugador basado en winrate ---
function getPlayerLevel(totalScore, winRate, matches) {
    // Priorizar winrate sobre score total
    if (winRate >= 95 && matches >= 10) return { level: "CRACK TOTAL", color: "#ff6b35", icon: "👑" };
    if (winRate >= 90 && matches >= 8) return { level: "CRACK SUPREMO", color: "#ffd32a", icon: "⭐" };
    if (winRate >= 85 && matches >= 6) return { level: "CRACK", color: "#4299e1", icon: "🔥" };
    if (winRate >= 80 && matches >= 5) return { level: "EXPERTO", color: "#56ab2f", icon: "💪" };
    if (winRate >= 75 && matches >= 4) return { level: "AVANZADO", color: "#667eea", icon: "📚" };
    if (winRate >= 70 && matches >= 3) return { level: "INTERMEDIO", color: "#764ba2", icon: "🎯" };
    if (winRate >= 60 && matches >= 2) return { level: "NOVATO", color: "#ed8936", icon: "📈" };
    return { level: "PRINCIPIANTE", color: "#999", icon: "🌱" };
}

// --- Función para generar HTML del ranking (Top 15) - CORREGIDA ---
function generateRankingHTML(usersData) {
    if (!usersData || usersData.length === 0) {
        return '<tr><td colspan="7" class="empty-state">No hay datos disponibles</td></tr>';
    }

    console.log('[RANKING PC] Procesando datos de', usersData.length, 'usuarios');

    // Filtrar y procesar datos con mayor flexibilidad
    const validUsers = usersData
        .filter(user => {
            // Verificar múltiples fuentes de datos
            const hasValidData = 
                user.wins > 0 || 
                user.matchesPlayed > 0 || 
                user.totalScore > 0 ||
                (user.pasalache && user.pasalache.wins > 0) ||
                (user.stats && user.stats.wins > 0);
            
            return hasValidData && user.displayName;
        })
        .map(user => {
            console.log('[RANKING PC] Procesando usuario:', user.displayName);
            
            // Extraer datos de múltiples fuentes posibles
            let wins = 0;
            let losses = 0;
            let matches = 0;
            let totalScore = 0;
            
            // Datos de la raíz del usuario
            wins = user.wins || 0;
            losses = user.losses || user.totalLosses || 0;
            matches = user.matchesPlayed || 0;
            totalScore = user.totalScore || user.score || 0;
            
            // Datos del objeto pasalache
            if (user.pasalache) {
                wins = Math.max(wins, user.pasalache.wins || 0);
                losses = Math.max(losses, user.pasalache.losses || 0);
                matches = Math.max(matches, user.pasalache.matchesPlayed || user.pasalache.gamesPlayed || 0);
                totalScore = Math.max(totalScore, user.pasalache.totalScore || 0);
            }
            
            // Datos del objeto stats
            if (user.stats && user.stats.pasalache) {
                wins = Math.max(wins, user.stats.pasalache.wins || 0);
                losses = Math.max(losses, user.stats.pasalache.losses || 0);
                matches = Math.max(matches, user.stats.pasalache.matchesPlayed || 0);
                totalScore = Math.max(totalScore, user.stats.pasalache.totalScore || 0);
            }
            
            // Asegurar coherencia en los datos
            if (matches < wins + losses) {
                matches = wins + losses;
            }
            
            // Calcular winrate correctamente
            const winRate = matches > 0 ? (wins / matches) * 100 : 0;
            const avgScore = matches > 0 ? Math.round(totalScore / matches) : totalScore;
            const lossRate = matches > 0 ? (losses / matches) * 100 : 0;
            
            console.log(`[RANKING PC] ${user.displayName}: ${wins}W/${losses}L/${matches}P - WinRate: ${winRate.toFixed(1)}%`);
            
            return {
                id: user.id,
                displayName: user.displayName,
                totalScore: totalScore,
                wins: wins,
                losses: losses,
                matches: matches,
                winRate: winRate,
                lossRate: lossRate,
                avgScore: avgScore,
                lastPlayed: user.lastPlayed || user.updatedAt
            };
        })
        .filter(user => user.matches > 0) // Solo usuarios con al menos 1 partida
        .sort((a, b) => {
            // ORDEN CORREGIDO: Por winrate primero (descendente), luego por partidas jugadas (más es mejor), luego por score total
            const winRateDiff = b.winRate - a.winRate;
            if (Math.abs(winRateDiff) > 0.1) return winRateDiff;
            
            const matchesDiff = b.matches - a.matches;
            if (matchesDiff !== 0) return matchesDiff;
            
            return b.totalScore - a.totalScore;
        })
        .slice(0, RANKING_LIMIT);

    if (validUsers.length === 0) {
        return '<tr><td colspan="7" class="empty-state">No hay jugadores registrados aún</td></tr>';
    }

    console.log('[RANKING PC] Top usuarios ordenados por winrate:');
    validUsers.slice(0, 5).forEach((user, i) => {
        console.log(`${i + 1}. ${user.displayName}: ${user.winRate.toFixed(1)}% (${user.wins}/${user.matches})`);
    });

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
                    <div class="player-name">${user.displayName}</div>
                    <div class="player-level" style="color: ${playerLevel.color}">
                        ${playerLevel.icon} ${playerLevel.level}
                    </div>
                </td>
                <td class="score-info">
                    <div class="main-score">${Math.round(user.totalScore / 1000 * 10) / 10}k</div>
                    <div class="secondary-stat">letras total</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat">${user.matches}</div>
                    <div class="secondary-stat">partidas</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat wins-stat">${user.wins}</div>
                    <div class="secondary-stat">${user.winRate.toFixed(1)}% éxito</div>
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

// --- Función para generar HTML del historial mejorado ---
function generateHistoryHTML(matches) {
    if (!matches || matches.length === 0) {
        return '<div class="empty-state">No hay historial disponible</div>';
    }

    console.log('[HISTORY DEBUG] Total de partidas recibidas:', matches.length);

    // Obtener usuario actual
    const currentUser = localStorage.getItem('currentUser');
    let userMatches = matches;
    
    // Filtrar por usuario si está logueado
    if (currentUser) {
        try {
            const userData = JSON.parse(currentUser);
            userMatches = matches.filter(match => 
                match.playerName === userData.displayName || 
                match.userId === userData.uid ||
                (match.players && match.players.some(p => p.displayName === userData.displayName))
            );
            console.log('[HISTORY DEBUG] Partidas filtradas por usuario:', userMatches.length);
        } catch (e) {
            console.log('No se pudo obtener usuario actual:', e);
        }
    }

    // Si no hay partidas del usuario, mostrar las más recientes generales
    if (userMatches.length === 0) {
        userMatches = matches.slice(0, HISTORY_LIMIT);
        console.log('[HISTORY DEBUG] Usando partidas generales:', userMatches.length);
    }

    // Filtros más permisivos para mostrar más partidas
    const validMatches = userMatches.filter(match => {
        // Aceptar cualquier partida que tenga datos básicos
        const hasBasicData = 
            match.score !== undefined || 
            match.correctAnswers !== undefined ||
            match.result !== undefined ||
            match.playerName !== undefined;
            
        return hasBasicData;
    });

    console.log('[HISTORY DEBUG] Partidas válidas después del filtro:', validMatches.length);

    if (validMatches.length === 0) {
        return '<div class="empty-state">No hay partidas válidas en el historial</div>';
    }

    const recentMatches = validMatches
        .sort((a, b) => {
            const getTime = (timestamp) => {
                if (!timestamp) return 0;
                if (timestamp.seconds) return timestamp.seconds;
                if (timestamp.toDate) return timestamp.toDate().getTime() / 1000;
                if (typeof timestamp === 'number') return timestamp;
                return new Date(timestamp).getTime() / 1000;
            };
            return getTime(b.timestamp) - getTime(a.timestamp);
        })
        .slice(0, HISTORY_LIMIT);

    return recentMatches.map(match => {
        const isVictory = match.result === 'victory' || match.result === 'win' || match.won === true;
        const score = match.score || match.correctAnswers || 0;
        const opponentName = match.opponent || match.opponentName || 'Oponente';
        const gameType = match.gameMode || match.gameType || 'Pasala Che';
        const duration = match.duration || match.gameTime || 0;
        const playerName = match.playerName || 'Usuario';
        
        // Formatear duración
        const formatDuration = (duration) => {
            if (!duration || duration < 60) return `${duration || 0}s`;
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        return `
            <div class="history-match ${isVictory ? 'victory' : 'defeat'}">
                <div class="match-header">
                    <div class="match-result ${isVictory ? 'victory' : 'defeat'}">
                        <span class="result-icon">${isVictory ? '🏆' : '💔'}</span>
                        <span class="result-text">${isVictory ? 'VICTORIA' : 'DERROTA'}</span>
                    </div>
                    <div class="match-time">${formatCompactDate(match.timestamp)}</div>
                </div>
                <div class="match-details">
                    <div class="match-score">
                        <div class="score-value">${score.toLocaleString()}</div>
                        <div class="score-label">letras</div>
                    </div>
                    <div class="match-info">
                        <div class="game-type">${gameType}</div>
                        <div class="opponent">vs ${opponentName}</div>
                        ${duration > 0 ? `<div class="duration">${formatDuration(duration)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Configurar listener en tiempo real para el ranking ---
function setupRankingListener() {
    try {
        console.log('[RANKING PC] Configurando listener del ranking...');
        
        if (!window.db) {
            console.error('[RANKING PC] Base de datos no disponible');
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="7" class="empty-state">Conectando a la base de datos...</td></tr>';
            }
            
            // Reintentar en 2 segundos
            setTimeout(setupRankingListener, 2000);
            return;
        }

        const usersRef = window.db.collection('users');
        
        const unsubscribe = usersRef.onSnapshot((snapshot) => {
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
                
                // Incluir solo usuarios con displayName válido
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
        
        // Reintentar
        setTimeout(setupRankingListener, 3000);
    }
}

// --- Configurar listener para historial ---
function setupHistoryListener() {
    try {
        console.log('[RANKING PC] Configurando listener del historial...');
        
        if (!window.db) {
            console.error('[RANKING PC] Base de datos no disponible para historial');
            if (historyList) {
                historyList.innerHTML = '<div class="empty-state">Conectando al historial...</div>';
            }
            
            // Reintentar en 2 segundos
            setTimeout(setupHistoryListener, 2000);
            return;
        }

        const matchesRef = window.db.collection('matches');
        // Consulta menos restrictiva para traer más datos
        const historyQuery = matchesRef
            .orderBy('timestamp', 'desc')
            .limit(30); // Aumentar el límite para tener más partidas disponibles

        const unsubscribe = historyQuery.onSnapshot((snapshot) => {
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
                // Añadir todas las partidas y dejar que el filtro en generateHistoryHTML haga su trabajo
                matches.push({
                    id: doc.id,
                    ...data
                });
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
            
            // Reintentar
            setTimeout(setupHistoryListener, 3000);
        });

        console.log('[HISTORY PC] Listener configurado correctamente');
        return unsubscribe;

    } catch (error) {
        console.error('[HISTORY PC] Error al configurar listener:', error);
        if (historyList) {
            historyList.innerHTML = '<div class="empty-state">Error de conexión</div>';
        }
        
        // Reintentar
        setTimeout(setupHistoryListener, 3000);
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

// --- Función de inicialización principal ---
function initializeRanking() {
    console.log('[RANKING PC] 🏁 Inicializando ranking de Pasala Che...');
    
    // Elementos del DOM
    rankingBody = document.getElementById('ranking-body');
    historyList = document.getElementById('history-list');
    
    if (!rankingBody) {
        console.error('[RANKING PC] ❌ No se encontró el elemento ranking-body');
        return;
    }
    
    console.log('[RANKING PC] ✅ Elementos del DOM encontrados');
    
    // Mostrar estado de carga inicial
    if (rankingBody) {
        rankingBody.innerHTML = '<tr><td colspan="7" class="loading-state">🔄 Iniciando conexión...</td></tr>';
    }
    if (historyList) {
        historyList.innerHTML = '<div class="loading-state">🔄 Cargando historial...</div>';
    }
    
    // Función para configurar Firebase
    function setupFirebaseAndListeners() {
        console.log('[RANKING PC] Verificando estado de Firebase...');
        
        // Usar waitForFirebase si está disponible
        if (window.waitForFirebase) {
            console.log('[RANKING PC] Usando waitForFirebase...');
            window.waitForFirebase(() => {
                console.log('[RANKING PC] Firebase listo, configurando listeners...');
                setupRankingListener();
                if (historyList) {
                    setupHistoryListener();
                }
            });
        } else {
            // Fallback manual
            console.log('[RANKING PC] Esperando Firebase manualmente...');
            let attempts = 0;
            const maxAttempts = 20;
            
            function checkFirebase() {
                attempts++;
                
                if (window.db) {
                    console.log('[RANKING PC] ✅ Firebase disponible, configurando listeners...');
                    setupRankingListener();
                    if (historyList) {
                        setupHistoryListener();
                    }
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    console.error('[RANKING PC] ❌ Timeout esperando Firebase');
                    if (rankingBody) {
                        rankingBody.innerHTML = '<tr><td colspan="7" class="empty-state">Error de conexión. <button onclick="location.reload()">Reintentar</button></td></tr>';
                    }
                    if (historyList) {
                        historyList.innerHTML = '<div class="empty-state">Error de conexión. <button onclick="location.reload()">Reintentar</button></div>';
                    }
                    return;
                }
                
                console.log(`[RANKING PC] ⏳ Esperando Firebase... (${attempts}/${maxAttempts})`);
                setTimeout(checkFirebase, 500);
            }
            
            checkFirebase();
        }
    }
    
    // Iniciar configuración
    setupFirebaseAndListeners();
}

// Inicializar cuando el documento esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRanking);
} else {
    // Si el DOM ya está listo, inicializar con delay para que los scripts se carguen
    setTimeout(initializeRanking, 100);
}

// También escuchar el evento personalizado de Firebase
window.addEventListener('firebaseReady', (event) => {
    console.log('[RANKING PC] 🔥 Evento firebaseReady recibido:', event.detail);
    
    // Esperar un poco y luego configurar los listeners
    setTimeout(() => {
        if (rankingBody && window.db) {
            console.log('[RANKING PC] Reconfigurando listeners por evento firebaseReady...');
            setupRankingListener();
            if (historyList) {
                setupHistoryListener();
            }
        }
    }, 500);
});

console.log('[RANKING PC] 📜 Script de ranking cargado'); 