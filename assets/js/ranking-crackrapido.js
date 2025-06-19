// Sistema de Ranking para Crack Rápido - Versión compatible
console.log('Ranking Crack Rápido script loaded - Sistema corregido v2.0');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

// --- Configuración ---
const RANKING_LIMIT = 15; // Solo mostrar top 15
const HISTORY_LIMIT = 20; // Más partidas en historial

// --- Función para formatear fecha compacta ---
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

// --- Función para calcular puntuación efectiva mejorada ---
function calculateEffectiveScore(match) {
    const score = match.score || 0;
    const correctAnswers = match.correctAnswers || 0;
    const totalQuestions = match.totalQuestions || 20;
    const maxStreak = match.maxStreak || 0;
    const averageTime = match.averageTime || 5;
    const accuracy = match.accuracy || ((correctAnswers / totalQuestions) * 100);
    const completed = match.completed || false;
    
    // Bonificaciones mejoradas
    const speedBonus = averageTime <= 1.5 ? 1.5 : averageTime <= 2 ? 1.4 : averageTime <= 3 ? 1.3 : averageTime <= 4 ? 1.2 : 1.0;
    const streakBonus = maxStreak >= 20 ? 1.6 : maxStreak >= 15 ? 1.4 : maxStreak >= 10 ? 1.3 : maxStreak >= 5 ? 1.15 : 1.0;
    const accuracyBonus = accuracy >= 95 ? 1.3 : accuracy >= 90 ? 1.2 : accuracy >= 85 ? 1.15 : accuracy >= 80 ? 1.1 : 1.0;
    const completionBonus = completed ? 1.2 : 0.8; // Penalizar juegos incompletos
    
    const effectiveScore = score * speedBonus * streakBonus * accuracyBonus * completionBonus;
    
    return Math.round(effectiveScore);
}

// --- Función para obtener nivel del jugador basado en winrate ---
function getPlayerLevel(score, accuracy, winRate) {
    // Priorizar winrate, luego accuracy y score
    if (winRate >= 95 && accuracy >= 90) return { level: "CRACK TOTAL", color: "#ff6b35", icon: "👑" };
    if (winRate >= 90 && accuracy >= 85) return { level: "VELOCISTA", color: "#ffd32a", icon: "⭐" };
    if (winRate >= 85 && accuracy >= 80) return { level: "CRACK", color: "#4299e1", icon: "🔥" };
    if (winRate >= 80 && accuracy >= 75) return { level: "EXPERTO", color: "#56ab2f", icon: "💪" };
    if (winRate >= 75 && accuracy >= 70) return { level: "AVANZADO", color: "#667eea", icon: "🎯" };
    if (winRate >= 70 && accuracy >= 65) return { level: "INTERMEDIO", color: "#764ba2", icon: "📚" };
    if (winRate >= 60 && accuracy >= 60) return { level: "NOVATO", color: "#ed8936", icon: "📈" };
    return { level: "PRINCIPIANTE", color: "#999", icon: "🌱" };
}

// --- Función para generar HTML del ranking corregida ---
function generateRankingHTML(usersData) {
    if (!usersData || usersData.length === 0) {
        return '<tr><td colspan="5" class="empty-state">No hay datos disponibles</td></tr>';
    }

    console.log('[RANKING CR] Procesando datos de', usersData.length, 'usuarios');

    // Filtrar y procesar datos con mayor flexibilidad
    const validUsers = usersData
        .filter(user => {
            // Verificar múltiples fuentes de datos
            const crackRapidoData = user.crackrapido || user.stats?.crackrapido || {};
            const hasValidData = 
                crackRapidoData.gamesPlayed > 0 || 
                crackRapidoData.wins > 0 || 
                crackRapidoData.completedGames > 0 ||
                user.wins > 0 ||
                user.matchesPlayed > 0;
            
            return hasValidData && user.displayName;
        })
        .map(user => {
            console.log('[RANKING CR] Procesando usuario:', user.displayName);
            
            // Extraer datos de múltiples fuentes
            const crackRapidoData = user.crackrapido || user.stats?.crackrapido || {};
            const rootData = user;
            
            // Unificar estadísticas
            let totalGames = Math.max(
                crackRapidoData.gamesPlayed || 0,
                crackRapidoData.totalGames || 0,
                rootData.matchesPlayed || 0
            );
            let completedGames = Math.max(
                crackRapidoData.completedGames || 0,
                crackRapidoData.wins || 0,
                rootData.wins || 0
            );
            let bestScore = Math.max(
                crackRapidoData.bestScore || 0,
                crackRapidoData.highScore || 0,
                rootData.totalScore || 0
            );
            let bestAccuracy = Math.max(
                crackRapidoData.bestAccuracy || 0,
                crackRapidoData.accuracy || 0
            );
            let totalScore = Math.max(
                crackRapidoData.totalScore || 0,
                rootData.totalScore || 0
            );
            
            // Ajustar coherencia
            if (totalGames < completedGames) {
                totalGames = completedGames;
            }
            
            // Calcular métricas
            const winRate = totalGames > 0 ? (completedGames / totalGames) * 100 : 0;
            const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : bestScore;
            const losses = totalGames - completedGames;
            
            console.log(`[RANKING CR] ${user.displayName}: ${completedGames}W/${losses}L/${totalGames}P - WinRate: ${winRate.toFixed(1)}%`);
            
            return {
                id: user.id,
                displayName: user.displayName,
                totalGames: totalGames,
                completedGames: completedGames,
                losses: losses,
                bestScore: bestScore,
                bestAccuracy: bestAccuracy,
                totalScore: totalScore,
                avgScore: avgScore,
                winRate: winRate,
                lastPlayed: user.lastPlayed || crackRapidoData.lastPlayed
            };
        })
        .filter(user => user.totalGames > 0) // Solo usuarios con al menos 1 partida
        .sort((a, b) => {
            // ORDEN CORREGIDO: Por winrate primero, luego por best score, luego por accuracy
            const winRateDiff = b.winRate - a.winRate;
            if (Math.abs(winRateDiff) > 0.1) return winRateDiff;
            
            const scoreDiff = b.bestScore - a.bestScore;
            if (scoreDiff !== 0) return scoreDiff;
            
            return b.bestAccuracy - a.bestAccuracy;
        })
        .slice(0, RANKING_LIMIT);

    if (validUsers.length === 0) {
        return '<tr><td colspan="5" class="empty-state">No hay jugadores registrados aún</td></tr>';
    }

    console.log('[RANKING CR] Top usuarios ordenados por winrate:');
    validUsers.slice(0, 5).forEach((user, i) => {
        console.log(`${i + 1}. ${user.displayName}: ${user.winRate.toFixed(1)}% (${user.completedGames}/${user.totalGames})`);
    });

    return validUsers.map((user, index) => {
        const playerLevel = getPlayerLevel(user.bestScore, user.bestAccuracy, user.winRate);
        const isTopPlayer = index < 3;
        const position = index + 1;
        
        return `
            <tr class="ranking-row ${isTopPlayer ? 'top-player' : ''}" data-score="${user.bestScore}">
                <td class="ranking-position">
                    <div class="position-number">${position}</div>
                    <div class="position-icon">
                        ${position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : ''}
                    </div>
                </td>
                <td class="player-info">
                    <div class="player-name">${user.displayName}</div>
                    <div class="player-level" style="color: ${playerLevel.color}">
                        ${playerLevel.icon} ${playerLevel.level}
                    </div>
                    <div class="player-stats-summary">${user.totalGames} partidas • ${user.winRate.toFixed(1)}% completadas</div>
                </td>
                <td class="score-info">
                    <div class="main-score">${user.bestScore.toLocaleString()}</div>
                    <div class="secondary-stat">Mejor Score</div>
                    <div class="score-breakdown">Prom: ${user.avgScore.toLocaleString()}</div>
                </td>
                <td class="stat-cell">
                    <div class="primary-stat accuracy-stat">${user.bestAccuracy.toFixed(0)}%</div>
                    <div class="secondary-stat">Precisión máx.</div>
                    <div class="wins-stat">${user.completedGames} completadas</div>
                </td>
                <td class="stat-cell hide-mobile">
                    <div class="primary-stat games-stat">${user.totalGames}</div>
                    <div class="secondary-stat">partidas</div>
                    <div class="completion-rate">${user.winRate.toFixed(1)}% éxito</div>
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
        const accuracy = match.accuracy || ((correctAnswers / totalQuestions) * 100);
        const completed = match.completed || match.result === 'completed';
        const totalTime = match.totalTime || 0;
        const gameMode = match.gameMode || 'classic';
        const category = match.category || 'general';
        const difficulty = match.difficulty || 'normal';
        
        // Calcular datos específicos de Crack Rápido
        const effectiveScore = calculateEffectiveScore({
            score, correctAnswers, totalQuestions, maxStreak, averageTime, accuracy, completed
        });
        const playerLevel = getPlayerLevel(effectiveScore, accuracy, (completed ? 100 : 0));
        const isTimeoutDefeat = match.result === 'timeout' || match.timeOut === true || (!completed && totalTime >= 120);
        
        // Determinar tipo de finalización
        let resultData;
        if (completed) {
            if (accuracy >= 95 && maxStreak >= 15 && averageTime <= 2) {
                resultData = { text: 'PERFECTO', icon: '🚀', class: 'perfect-performance', color: '#10b981' };
            } else if (accuracy >= 90 && maxStreak >= 10) {
                resultData = { text: 'EXCELENTE', icon: '🔥', class: 'great-performance', color: '#059669' };
            } else if (accuracy >= 80) {
                resultData = { text: 'COMPLETADO', icon: '✅', class: 'good-completion', color: '#0d9488' };
            } else {
                resultData = { text: 'TERMINADO', icon: '☑️', class: 'completed', color: '#3b82f6' };
            }
        } else {
            if (isTimeoutDefeat) {
                resultData = { text: 'TIEMPO', icon: '⏰', class: 'timeout-defeat', color: '#f59e0b' };
            } else {
                resultData = { text: 'INCOMPLETO', icon: '⏸️', class: 'incomplete', color: '#ef4444' };
            }
        }

        // Determinar especialización
        let specialization = { icon: '⚖️', type: 'EQUILIBRADO', color: '#6b7280' };
        if (averageTime <= 2 && accuracy >= 85) {
            specialization = { icon: '🚀', type: 'VELOCISTA', color: '#8b5cf6' };
        } else if (accuracy >= 95) {
            specialization = { icon: '🎯', type: 'PRECISO', color: '#10b981' };
        } else if (maxStreak >= 15) {
            specialization = { icon: '🔥', type: 'STREAKER', color: '#f59e0b' };
        }

        return `
            <div class="history-item">
                <!-- Header compacto -->
                <div class="history-header">
                    <span class="history-player-name">⚡ ${match.playerName || 'Anónimo'}</span>
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
                        <div class="player-score" style="color: ${resultData.color}">${(effectiveScore / 1000).toFixed(1)}k</div>
                        <div style="font-size: 0.6rem; color: var(--ranking-text-muted);">rating</div>
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
                        <div class="stat-icon">🎯</div>
                        <div class="stat-value">${accuracy.toFixed(0)}%</div>
                        <div class="stat-label">Precisión</div>
                        <div class="stat-detail">${correctAnswers}/${totalQuestions}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-value">${averageTime.toFixed(1)}s</div>
                        <div class="stat-label">Velocidad</div>
                        <div class="stat-detail">${averageTime <= 2 ? 'Sonic' : averageTime <= 3 ? 'Rápido' : 'Normal'}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-value">${maxStreak}</div>
                        <div class="stat-label">Racha</div>
                        <div class="stat-detail">${maxStreak >= 15 ? 'Épico' : maxStreak >= 10 ? 'Genial' : 'Bueno'}</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${Math.round(totalTime)}s</div>
                        <div class="stat-label">Tiempo</div>
                        <div class="stat-detail">${completed ? 'Terminado' : 'Incompleto'}</div>
                    </div>
                </div>

                <!-- Especialización -->
                <div class="game-specific">
                    <div class="specific-label">
                        <span style="color: ${specialization.color}">${specialization.icon}</span>
                        Especialización
                    </div>
                    <div class="specific-content">
                        <div class="specific-tag" style="color: ${specialization.color}; border-color: ${specialization.color}40">
                            ${specialization.type}
                        </div>
                        ${accuracy >= 95 ? '<div class="specific-tag" style="color: #10b981; border-color: #10b98140;">🎯 PERFECCIÓN</div>' : ''}
                        ${averageTime <= 2 ? '<div class="specific-tag" style="color: #8b5cf6; border-color: #8b5cf640;">🚀 VELOCIDAD</div>' : ''}
                        ${maxStreak >= 15 ? '<div class="specific-tag" style="color: #f59e0b; border-color: #f59e0b40;">🔥 RACHA ÉPICA</div>' : ''}
                    </div>
                </div>

                <!-- Análisis simplificado -->
                ${(accuracy >= 90 || maxStreak >= 10 || averageTime <= 2.5) ? `
                <div class="performance-insight">
                    <div class="insight-text">
                        ${accuracy >= 95 && averageTime <= 2 ? 
                            '<span class="insight-highlight">¡Actuación perfecta!</span> Velocidad y precisión máximas.' :
                        accuracy >= 90 ? 
                            '<span class="insight-highlight">Precisión excelente</span> - Gran dominio del juego.' :
                        maxStreak >= 15 ? 
                            '<span class="insight-highlight">Racha épica</span> - Impresionante consistencia.' :
                        averageTime <= 2 ? 
                            '<span class="insight-highlight">Velocidad extrema</span> - Respuestas ultrarrápidas.' :
                            `<span class="insight-highlight">Buen rendimiento</span> - Especialidad ${specialization.type.toLowerCase()}.`
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
        if (!window.firebase || !window.firebase.firestore) {
            console.error('[RANKING CR] Firebase no está disponible');
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
            console.error('[RANKING CR] Firebase no está disponible para historial');
            if (historyList) {
                historyList.innerHTML = '<div class="empty-state">Error de conexión. Recargá la página.</div>';
            }
            return;
        }

        const db = window.firebase.firestore();
        const matchesRef = db.collection('matches');
        const historyQuery = matchesRef
            .orderBy('timestamp', 'desc')
            .limit(HISTORY_LIMIT);

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

// --- Función para mostrar mensaje de carga inicial ---
function showLoadingState() {
    if (rankingBody) {
        rankingBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-state">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <div style="width: 12px; height: 12px; background: var(--crackrapido-primary); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                        <span>Buscando a los más veloces...</span>
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
                    <span>Revisando récords...</span>
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
    
    // Esperar a que Firebase esté disponible
    function initializeWhenReady() {
        if (window.firebase && window.firebase.firestore) {
            console.log('[RANKING CR] Firebase disponible, configurando listeners...');
            setupRankingListener();
            setupHistoryListener();
        } else {
            console.log('[RANKING CR] Esperando Firebase...');
            setTimeout(initializeWhenReady, 1000);
        }
    }
    
    initializeWhenReady();
});