// Importar funciones de Firestore 
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
            // Verificar si hay datos en la estructura esperada por pasalache.js
            // Intentar múltiples rutas de datos para compatibilidad
            
            // Nueva estructura revisada para compatibilidad con pasalache.js
            const hasScore = user.totalScore > 0 || user.score > 0;
            const hasWins = user.wins > 0;
            const hasGameData = Boolean(user.stats || user.pasalache);
            
            // Comprobar si hay datos válidos para mostrar
            return hasScore || hasWins || hasGameData;
        })
        .map(user => {
            console.log('[RANKING PC] Procesando usuario:', user);
            
            // Extraer datos independientemente de la estructura
            let totalScore = 0;
            let wins = 0;
            let losses = 0;
            let matches = 0;
            
            // Obtener datos de la raíz (formato pasalache.js)
            totalScore = user.totalScore || user.score || 0;
            wins = user.wins || 0;
            losses = user.losses || user.totalLosses || 0;
            matches = user.matchesPlayed || Math.max(wins + losses, 0);
            
            // Asegurar que haya al menos un partido jugado para calcular el win rate
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
            // Ordenar por winrate primero, luego por total score si el winrate es igual
            if (Math.abs(b.winRate - a.winRate) > 0.1) return b.winRate - a.winRate;
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return b.wins - a.wins;
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

    console.log('[HISTORY DEBUG] Total de partidas recibidas:', matches.length);
    // Mostrar los primeros objetos en la consola para depuración
    console.log('[HISTORY DEBUG] Muestra de partidas:', matches.slice(0, 3));

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
            console.log('[HISTORY DEBUG] Partidas filtradas por usuario:', userMatches.length);
        } catch (e) {
            console.log('No se pudo obtener usuario actual:', e);
        }
    }

    // Si no hay partidas del usuario, mostrar las más recientes de todos
    if (userMatches.length === 0) {
        userMatches = matches.slice(0, HISTORY_LIMIT);
        console.log('[HISTORY DEBUG] Usando partidas generales:', userMatches.length);
    }

    // SIMPLIFICADO: Ahora filtramos de manera menos restrictiva
    // Solo filtramos partidas con puntuación 0, pero aceptamos todos los tipos de juego
    userMatches = userMatches.filter(match => {
        // Obtener puntuación con cualquiera de estas propiedades
        const score = 
            match.score || 
            match.correctAnswers || 
            (match.players && match.players[0]?.score) || 
            (match.stats && match.stats.score) || 
            0;
        
        const hasPasalaCheData = 
            match.gameMode === 'Pasalache' || 
            match.gameMode === 'pasalache' || 
            match.gameType === 'pasalache' || 
            match.gameType === 'pasala-che' || 
            match.gameType === 'PasalaChe' ||
            // Nueva condición: también aceptar si no tiene gameType pero tiene score
            (!match.gameType && score > 0);
        
        // Mostrar más información para depuración
        if (score > 0) {
            console.log(`[HISTORY DEBUG] Partida con score ${score}, gameType: ${match.gameType || 'N/A'}, gameMode: ${match.gameMode || 'N/A'}`);
        }
        
        return hasPasalaCheData && score > 0;
    });

    console.log('[HISTORY DEBUG] Partidas filtradas finales:', userMatches.length);

    // Mostrar las últimas partidas ordenadas por fecha
    const recentMatches = userMatches
        .sort((a, b) => {
            // Manejar tanto objetos Timestamp como strings ISO
            const getTime = (timestamp) => {
                if (timestamp?.seconds) return timestamp.seconds * 1000;
                if (timestamp instanceof Date) return timestamp.getTime();
                if (typeof timestamp === 'string') {
                    try { return new Date(timestamp).getTime(); } 
                    catch (e) { return 0; }
                }
                return 0;
            };
            
            const timeA = getTime(a.timestamp);
            const timeB = getTime(b.timestamp);
            
            return timeB - timeA; // Orden descendente (más reciente primero)
        })
        .slice(0, HISTORY_LIMIT);

    if (recentMatches.length === 0) {
        console.log('[HISTORY DEBUG] No hay partidas válidas después del filtrado');
        return '<div class="empty-state">No hay partidas válidas en el historial</div>';
    }

    console.log('[HISTORY DEBUG] Partidas a mostrar:', recentMatches.length);

    return recentMatches.map(match => {
        // Extraer datos con compatibilidad para diferentes estructuras
        const isVictory = match.result === 'victory' || match.won === true || match.success === true;
        const isTimeoutDefeat = match.result === 'timeout' || match.timeDefeat === true || match.defeatByTime === true || match.timeOut === true;
        
        // Obtener puntuación (score) con múltiples rutas posibles
        const score = match.score || 
                     match.correctAnswers || 
                     (match.players && match.players[0]?.score) || 
                     (match.stats && match.stats.score) || 
                     0;
                     
        const playerLevel = getPlayerLevel(score, isVictory ? 100 : 0, 1);
        
        // Obtener nombre del jugador con múltiples rutas posibles
        const playerName = match.playerName || 
                          (match.players && match.players[0]?.displayName) || 
                          match.displayName ||
                          'Anónimo';
                          
        // Obtener duración con múltiples rutas posibles
        const duration = Math.round(match.timeSpent || match.duration || match.time || 0);
        
        // Obtener otros datos
        const difficulty = match.difficulty || 'Normal';
        const passes = match.passes || match.passedAnswers || match.skips || 0;
        
        // Determinar resultado y color
        let resultData;
        if (isVictory) {
            resultData = { text: 'VICTORIA', icon: '🏆', class: 'victory', color: '#10b981' };
        } else if (isTimeoutDefeat) {
            resultData = { text: 'TIEMPO', icon: '⏰', class: 'timeout', color: '#f59e0b' };
        } else {
            resultData = { text: 'DERROTA', icon: '❌', class: 'defeat', color: '#ef4444' };
        }
        
        // Manejar formato de fecha dependiendo del tipo de timestamp
        let formattedDate = '---';
        
        try {
            if (match.timestamp?.seconds) {
                formattedDate = formatCompactDate(match.timestamp);
            } else if (match.timestamp instanceof Date) {
                const now = new Date();
                const diffMs = now - match.timestamp;
                const diffMins = Math.floor(diffMs / 60000);
                
                if (diffMins < 60) formattedDate = `${diffMins}min`;
                else if (diffMins < 1440) formattedDate = `${Math.floor(diffMins/60)}h`;
                else if (diffMins < 10080) formattedDate = `${Math.floor(diffMins/1440)}d`;
                else formattedDate = match.timestamp.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            } else if (typeof match.timestamp === 'string') {
                const date = new Date(match.timestamp);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                
                if (diffMins < 60) formattedDate = `${diffMins}min`;
                else if (diffMins < 1440) formattedDate = `${Math.floor(diffMins/60)}h`;
                else if (diffMins < 10080) formattedDate = `${Math.floor(diffMins/1440)}d`;
                else formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            }
        } catch (e) {
            console.log('[HISTORY DEBUG] Error al formatear fecha:', e);
            formattedDate = '---';
        }
        
        // Calcular velocidad (letras por segundo) con protección
        const lettersPerSecond = duration > 0 ? Math.round(score / duration) : 0;
        
        return `
            <div class="history-item">
                <!-- Header compacto -->
                <div class="history-header">
                    <span class="history-player-name">🏈 ${playerName}</span>
                    <span class="history-date">${formattedDate}</span>
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
        if (!window.db) {
            console.error('[RANKING PC] Firebase no está inicializado para ranking');
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="7" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
            }
            return;
        }

        const usersRef = collection(window.db, 'users');
        
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
    }
}

// --- Configurar listener para historial ---
function setupHistoryListener() {
    try {
        if (!window.db) {
            console.error('[RANKING PC] Firebase no está inicializado para historial');
            if (historyList) {
                historyList.innerHTML = '<div class="empty-state">Error de conexión. Recargá la página.</div>';
            }
            return;
        }

        const matchesRef = collection(window.db, 'matches');
        // Consulta menos restrictiva para traer más datos
        const historyQuery = query(
            matchesRef,
            orderBy('timestamp', 'desc'),
            limit(30) // Aumentar el límite para tener más partidas disponibles
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
    
    // Intentar usar Firebase de forma compatible con ambos scripts
    try {
        // Verificar si Firebase ya está inicializado (por pasalache.js)
        if (window.db) {
            console.log('[RANKING PC] Firebase ya inicializado, usando instancia existente');
            setupRankingListener();
            setupHistoryListener();
        } else {
            // Intentar inicializar Firebase anónimamente si es necesario
            const initFirebaseAnonymously = () => {
                import('./firebase-init.js')
                    .then(module => {
                        // Asegurarse de que Firebase esté completamente inicializado
                        return module.ensureFirebaseInitialized ? 
                            module.ensureFirebaseInitialized() : 
                            { db: module.db, auth: module.auth, user: null, readOnly: true };
                    })
                    .then(({ db: firebaseDb, auth, user, readOnly }) => {
                        console.log('[RANKING PC] Firebase inicializado correctamente:', 
                                    readOnly ? '(modo solo lectura)' : '(modo completo)');
                        
                        // Usar la instancia db recibida
                        window.db = firebaseDb;
                        
                        // Configurar listeners para el ranking y el historial
                        setupRankingListener();
                        setupHistoryListener();
                    })
                    .catch(error => {
                        console.error('[RANKING PC] Error inicializando Firebase:', error);
                        mostrarErrorYFallback();
                    });
            };
            
            // Intentar inicializar Firebase
            initFirebaseAnonymously();
        }
    } catch (error) {
        console.error('[RANKING PC] Error al inicializar ranking:', error);
        mostrarErrorYFallback();
    }
    
    function mostrarErrorYFallback() {
        // Mostrar mensaje de error
        if (rankingBody) {
            rankingBody.innerHTML = `
                <tr>
                    <td colspan="7" class="error-state">
                        <div class="error-icon">⚠️</div>
                        <div class="error-message">Error de conexión</div>
                        <div class="error-detail">No se pudo conectar con la base de datos</div>
                        <button onclick="location.reload()" class="retry-button">Reintentar</button>
                    </td>
                </tr>
            `;
        }
        
        if (historyList) {
            historyList.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">Error de conexión</div>
                    <div class="error-detail">No se pudo conectar con la base de datos</div>
                </div>
            `;
        }
        
        // Después de un tiempo, mostrar datos de fallback
        setTimeout(() => {
            // Crear algunos datos de demo para mostrar
            const mockUsers = [
                { displayName: 'CrackDemo1', totalScore: 4500, wins: 12, losses: 3, matches: 15, winRate: 80, avgScore: 300 },
                { displayName: 'FutbolFan22', totalScore: 3800, wins: 10, losses: 2, matches: 12, winRate: 83, avgScore: 316 },
                { displayName: 'ArgentinoTop', totalScore: 3200, wins: 8, losses: 3, matches: 11, winRate: 72, avgScore: 290 },
                { displayName: 'PeloteroMax', totalScore: 2900, wins: 7, losses: 2, matches: 9, winRate: 77, avgScore: 322 },
                { displayName: 'Golazo10', totalScore: 2500, wins: 6, losses: 3, matches: 9, winRate: 66, avgScore: 277 }
            ];
            
            if (rankingBody) {
                rankingBody.innerHTML = generateRankingHTML(mockUsers);
            }
            
            const mockMatches = [
                { 
                    playerName: 'CrackDemo1', 
                    score: 520, 
                    result: 'victory', 
                    timeSpent: 95,
                    difficulty: 'Difícil',
                    gameMode: 'Pasalache',
                    timestamp: { toDate: () => new Date(Date.now() - 3600000) } // 1 hour ago
                },
                { 
                    playerName: 'FutbolFan22', 
                    score: 480, 
                    result: 'victory',
                    timeSpent: 85,
                    difficulty: 'Normal',
                    gameMode: 'Pasalache',
                    timestamp: { toDate: () => new Date(Date.now() - 7200000) } // 2 hours ago
                },
                { 
                    playerName: 'ArgentinoTop', 
                    score: 320, 
                    result: 'defeat',
                    timeSpent: 75,
                    difficulty: 'Normal',
                    gameMode: 'Pasalache',
                    timestamp: { toDate: () => new Date(Date.now() - 86400000) } // 1 day ago
                }
            ];
            
            if (historyList) {
                historyList.innerHTML = generateHistoryHTML(mockMatches);
            }
            
            // Mostrar mensaje de modo demo
            const demoNotice = document.createElement('div');
            demoNotice.className = 'demo-notice';
            demoNotice.style.cssText = 'background: #fff3cd; color: #856404; padding: 10px; margin-bottom: 15px; border-radius: 5px; text-align: center; font-weight: bold;';
            demoNotice.innerHTML = '⚠️ Mostrando datos de demostración (modo offline)';
            
            const containers = document.querySelectorAll('.ranking-container, .history-container');
            containers.forEach(container => {
                container.insertBefore(demoNotice.cloneNode(true), container.firstChild);
            });
        }, 3000);
    }
}); 