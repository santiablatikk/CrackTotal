// Importar funciones de Firestore - Versión compatible
console.log('Ranking Mentiroso script loaded - Sistema mejorado v2.0');

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

// --- Sistema de Rating Mejorado para Mentiroso ---
function calculateMentirosoRating(stats) {
    const baseRating = 1000;
    const gamesPlayed = stats.gamesPlayed || 0;
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    const successfulDeceptions = stats.successfulDeceptions || 0;
    const liesDetected = stats.liesDetected || 0;
    const perfectRounds = stats.perfectRounds || 0;
    const timeouts = stats.timeouts || 0;
    const falseAccusations = stats.falseAccusations || 0;
    const totalPointsWon = stats.totalPointsWon || 0;
    
    if (gamesPlayed === 0) return baseRating;
    
    // Factores de cálculo mejorados
    const winRateBonus = (wins / gamesPlayed) * 2000;
    const deceptionBonus = gamesPlayed > 0 ? (successfulDeceptions / gamesPlayed) * 800 : 0;
    const detectionBonus = gamesPlayed > 0 ? (liesDetected / gamesPlayed) * 800 : 0;
    const perfectBonus = gamesPlayed > 0 ? (perfectRounds / gamesPlayed) * 1000 : 0;
    const experienceBonus = Math.min(gamesPlayed * 50, 1000);
    const pointsBonus = Math.min(totalPointsWon * 2, 2000);
    
    // Penalizaciones
    const timeoutPenalty = timeouts * 100;
    const falseAccusationPenalty = falseAccusations * 50;
    
    const finalRating = Math.max(
        baseRating + winRateBonus + deceptionBonus + detectionBonus + perfectBonus + experienceBonus + pointsBonus - timeoutPenalty - falseAccusationPenalty,
        500
    );
    
    return Math.round(finalRating);
}

// --- Función para obtener nivel del jugador ---
function getPlayerLevel(rating, stats) {
    const winRate = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;
    const avgPerfection = stats.gamesPlayed > 0 ? (stats.perfectRounds / stats.gamesPlayed) * 100 : 0;
    
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

    console.log('[RANKING MENTIROSO] Procesando datos de', usersData.length, 'usuarios');

    // Procesar datos de usuarios con el nuevo sistema mejorado
    const validUsers = usersData
        .filter(user => {
            // Verificar múltiples fuentes de datos
            const mentirosoData = user.mentiroso || user.stats?.mentiroso || {};
            const hasValidData = 
                mentirosoData.gamesPlayed > 0 || 
                mentirosoData.wins > 0 || 
                user.wins > 0 ||
                user.matchesPlayed > 0;
            
            return hasValidData && user.displayName;
        })
        .map(user => {
            console.log('[RANKING MENTIROSO] Procesando usuario:', user.displayName);
            
            // Extraer datos de múltiples fuentes
            const mentirosoData = user.mentiroso || user.stats?.mentiroso || {};
            const rootData = user;
            
            // Unificar estadísticas
            const stats = {
                gamesPlayed: Math.max(
                    mentirosoData.gamesPlayed || 0,
                    mentirosoData.matches || 0,
                    rootData.matchesPlayed || 0,
                    (rootData.wins || 0) + (rootData.losses || 0)
                ),
                wins: Math.max(
                    mentirosoData.wins || 0,
                    rootData.wins || 0
                ),
                losses: Math.max(
                    mentirosoData.losses || 0,
                    rootData.losses || 0
                ),
                successfulDeceptions: mentirosoData.successfulDeceptions || 0,
                liesDetected: mentirosoData.liesDetected || 0,
                perfectRounds: mentirosoData.perfectRounds || 0,
                timeouts: mentirosoData.timeouts || 0,
                falseAccusations: mentirosoData.falseAccusations || 0,
                totalPointsWon: mentirosoData.totalPointsWon || 0,
                avgGameDuration: mentirosoData.avgGameDuration || 0
            };
            
            // Ajustar coherencia
            if (stats.gamesPlayed < stats.wins + stats.losses) {
                stats.gamesPlayed = stats.wins + stats.losses;
            }
            
            // Calcular métricas
            const rating = calculateMentirosoRating(stats);
            const winRate = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;
            const playerLevel = getPlayerLevel(rating, stats);
            
            const deceptionRate = stats.gamesPlayed > 0 ? (stats.successfulDeceptions / stats.gamesPlayed) * 100 : 0;
            const detectionRate = stats.gamesPlayed > 0 ? (stats.liesDetected / stats.gamesPlayed) * 100 : 0;
            const perfectRate = stats.gamesPlayed > 0 ? (stats.perfectRounds / stats.gamesPlayed) * 100 : 0;
            const reliability = stats.gamesPlayed > 0 ? Math.max(0, 100 - ((stats.timeouts + stats.falseAccusations) / stats.gamesPlayed) * 100) : 100;
            const avgPointsPerGame = stats.gamesPlayed > 0 ? Math.round(stats.totalPointsWon / stats.gamesPlayed) : 0;
            const skillBalance = Math.round((deceptionRate + detectionRate) / 2);
            
            console.log(`[RANKING MENTIROSO] ${user.displayName}: ${stats.wins}W/${stats.losses}L/${stats.gamesPlayed}P - WinRate: ${winRate.toFixed(1)}%`);
            
            return {
                id: user.id,
                displayName: user.displayName,
                rating: rating,
                stats: stats,
                winRate: winRate,
                playerLevel: playerLevel,
                deceptionRate: deceptionRate,
                detectionRate: detectionRate,
                perfectRate: perfectRate,
                reliability: reliability,
                avgPointsPerGame: avgPointsPerGame,
                skillBalance: skillBalance,
                lastPlayed: user.lastPlayed || mentirosoData.lastPlayed
            };
        })
        .filter(user => user.stats.gamesPlayed > 0) // Solo usuarios con al menos 1 partida
        .sort((a, b) => {
            // ORDEN CORREGIDO: Por win rate primero, luego por rating, luego por balance de habilidades
            const winRateDiff = b.winRate - a.winRate;
            if (Math.abs(winRateDiff) > 0.1) return winRateDiff;
            
            const ratingDiff = b.rating - a.rating;
            if (ratingDiff !== 0) return ratingDiff;
            
            return b.skillBalance - a.skillBalance;
        })
        .slice(0, RANKING_LIMIT);

    if (validUsers.length === 0) {
        return '<tr><td colspan="6" class="empty-state">No hay jugadores registrados aún</td></tr>';
    }

    console.log('[RANKING MENTIROSO] Top usuarios ordenados por winrate:');
    validUsers.slice(0, 5).forEach((user, i) => {
        console.log(`${i + 1}. ${user.displayName}: ${user.winRate.toFixed(1)}% (${user.stats.wins}/${user.stats.gamesPlayed})`);
    });

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
                    <div class="win-percentage">${user.winRate.toFixed(1)}% wins</div>
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
        const gameType = match.gameResult || 'Normal';
        const duration = match.duration || 0;
        const playerName = match.playerName || 'Anónimo';
        
        // Extraer estadísticas específicas de Mentiroso
        const successfulDeceptions = match.successfulDeceptions || 0;
        const liesDetected = match.liesDetected || 0;
        const timeouts = match.timeouts || 0;
        const falseAccusations = match.falseAccusations || 0;
        const isPerfectRound = match.perfectRound || (myScore === 18 && opponentScore === 0);
        
        // Calcular métricas de la partida
        const totalTurns = Math.max(myScore + opponentScore, 10); // Estimado
        const deceptionRate = totalTurns > 0 ? (successfulDeceptions / totalTurns) * 100 : 0;
        const detectionRate = totalTurns > 0 ? (liesDetected / totalTurns) * 100 : 0;
        const accuracy = Math.max(0, 100 - ((timeouts + falseAccusations) / Math.max(totalTurns, 1)) * 100);
        
        // Determinar especialización mostrada en esta partida
        let specialization = {
            type: "EQUILIBRADO",
            icon: "⚖️",
            color: "#6b7280",
            description: "Buen balance entre engañar y detectar"
        };
        
        if (successfulDeceptions > liesDetected + 2) {
            specialization = {
                type: "MAESTRO DEL ENGAÑO",
                icon: "🎭",
                color: "#ef4444",
                description: "Excelente engañando a los oponentes"
            };
        } else if (liesDetected > successfulDeceptions + 2) {
            specialization = {
                type: "DETECTIVE ASTUTO",
                icon: "🕵️",
                color: "#3b82f6",
                description: "Experto detectando mentiras"
            };
        } else if (isPerfectRound) {
            specialization = {
                type: "PERFECCIONISTA",
                icon: "💎",
                color: "#8b5cf6",
                description: "Ronda sin errores"
            };
        } else if (accuracy >= 90) {
            specialization = {
                type: "ESTRATEGA",
                icon: "🧠",
                color: "#10b981",
                description: "Decisiones muy acertadas"
            };
        }
        
        // Determinar el tipo de victoria/derrota con más detalle
        let resultDetails = {
            text: '',
            icon: '',
            class: '',
            description: '',
            subtitle: ''
        };
        
        if (isVictory) {
            if (isPerfectRound) {
                resultDetails = {
                    text: 'VICTORIA PERFECTA',
                    icon: '👑',
                    class: 'perfect-victory',
                    description: 'Dominación total',
                    subtitle: '18-0 ¡Impecable!'
                };
            } else if (scoreDiff >= 12) {
                resultDetails = {
                    text: 'VICTORIA DOMINANTE',
                    icon: '🔥',
                    class: 'dominant-victory',
                    description: 'Superioridad aplastante',
                    subtitle: `Ganaste por ${scoreDiff} puntos`
                };
            } else if (scoreDiff >= 6) {
                resultDetails = {
                    text: 'VICTORIA SÓLIDA',
                    icon: '💪',
                    class: 'solid-victory',
                    description: 'Victoria convincente',
                    subtitle: 'Buen control del juego'
                };
            } else if (scoreDiff >= 2) {
                resultDetails = {
                    text: 'VICTORIA AJUSTADA',
                    icon: '⚡',
                    class: 'close-victory',
                    description: 'Por poco margen',
                    subtitle: 'Victoria en el último momento'
                };
            } else {
                resultDetails = {
                    text: 'VICTORIA ÉPICA',
                    icon: '🎯',
                    class: 'epic-victory',
                    description: 'Victoria por 1 punto',
                    subtitle: '¡Por los pelos!'
                };
            }
        } else {
            if (opponentScore === 18 && myScore === 0) {
                resultDetails = {
                    text: 'DERROTA TOTAL',
                    icon: '💀',
                    class: 'total-defeat',
                    description: 'El oponente fue perfecto',
                    subtitle: '0-18 ¡A estudiar!'
                };
            } else if (Math.abs(scoreDiff) >= 12) {
                resultDetails = {
                    text: 'DERROTA APLASTANTE',
                    icon: '😵',
                    class: 'crushing-defeat',
                    description: 'Te superaron claramente',
                    subtitle: `Perdiste por ${Math.abs(scoreDiff)} puntos`
                };
            } else if (Math.abs(scoreDiff) >= 6) {
                resultDetails = {
                    text: 'DERROTA CLARA',
                    icon: '😞',
                    class: 'clear-defeat',
                    description: 'El rival fue mejor',
                    subtitle: 'Necesitas más práctica'
                };
            } else if (Math.abs(scoreDiff) >= 2) {
                resultDetails = {
                    text: 'DERROTA AJUSTADA',
                    icon: '😤',
                    class: 'close-defeat',
                    description: 'Muy cerca de ganar',
                    subtitle: 'Casi lo logras'
                };
            } else {
                resultDetails = {
                    text: 'DERROTA POR POCO',
                    icon: '😢',
                    class: 'narrow-defeat',
                    description: 'Perdiste por 1 punto',
                    subtitle: '¡Tan cerca!'
                };
            }
        }
        
        return `
            <div class="history-item ${resultDetails.class}">
                <div class="history-header">
                    <div class="match-result-section">
                        <div class="result-main">
                            <span class="result-icon">${resultDetails.icon}</span>
                            <div class="result-text-group">
                                <div class="result-title">${resultDetails.text}</div>
                                <div class="result-subtitle">${resultDetails.subtitle}</div>
                            </div>
                        </div>
                        <div class="match-metadata">
                            <span class="history-date">${formatCompactDate(match.timestamp)}</span>
                            <span class="game-type-tag">${gameType}</span>
                        </div>
                    </div>
                    <div class="result-description">${resultDetails.description}</div>
                </div>

                <div class="score-duel">
                    <div class="player-score-section my-section">
                        <div class="player-avatar">🎭</div>
                        <div class="score-details">
                            <div class="player-label">${playerName}</div>
                            <div class="score-value main-score">${myScore}</div>
                            <div class="score-quality">
                                ${myScore >= 15 ? 'Excelente' : myScore >= 12 ? 'Muy bueno' : myScore >= 9 ? 'Bueno' : myScore >= 6 ? 'Regular' : 'Mejorable'}
                            </div>
                        </div>
                    </div>

                    <div class="vs-display">
                        <div class="vs-text">VS</div>
                        <div class="score-difference ${scoreDiff >= 0 ? 'advantage' : 'disadvantage'}">
                            ${scoreDiff > 0 ? '+' : ''}${scoreDiff}
                        </div>
                    </div>

                    <div class="player-score-section opponent-section">
                        <div class="player-avatar">🤖</div>
                        <div class="score-details">
                            <div class="player-label">${opponentName}</div>
                            <div class="score-value opponent-score">${opponentScore}</div>
                            <div class="score-quality">
                                ${opponentScore >= 15 ? 'Excelente' : opponentScore >= 12 ? 'Muy bueno' : opponentScore >= 9 ? 'Bueno' : opponentScore >= 6 ? 'Regular' : 'Mejorable'}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="deception-analysis">
                    <div class="analysis-title">🎭 Análisis de Engaño y Detección</div>
                    <div class="skills-grid">
                        <div class="skill-metric deception-metric">
                            <div class="metric-header">
                                <span class="metric-icon">🎪</span>
                                <span class="metric-title">Engaños</span>
                            </div>
                            <div class="metric-value">${successfulDeceptions}</div>
                            <div class="metric-description">exitosos</div>
                            <div class="metric-percentage">${deceptionRate.toFixed(0)}% efectividad</div>
                        </div>

                        <div class="skill-metric detection-metric">
                            <div class="metric-header">
                                <span class="metric-icon">🔍</span>
                                <span class="metric-title">Detección</span>
                            </div>
                            <div class="metric-value">${liesDetected}</div>
                            <div class="metric-description">mentiras detectadas</div>
                            <div class="metric-percentage">${detectionRate.toFixed(0)}% precisión</div>
                        </div>

                        <div class="skill-metric accuracy-metric">
                            <div class="metric-header">
                                <span class="metric-icon">🎯</span>
                                <span class="metric-title">Precisión</span>
                            </div>
                            <div class="metric-value">${accuracy.toFixed(0)}%</div>
                            <div class="metric-description">decisiones correctas</div>
                            <div class="metric-detail">
                                ${timeouts > 0 ? `${timeouts} timeouts` : ''}
                                ${falseAccusations > 0 ? `${falseAccusations} errores` : ''}
                                ${timeouts === 0 && falseAccusations === 0 ? 'Sin errores' : ''}
                            </div>
                        </div>

                        <div class="skill-metric duration-metric">
                            <div class="metric-header">
                                <span class="metric-icon">⏱️</span>
                                <span class="metric-title">Tiempo</span>
                            </div>
                            <div class="metric-value">${Math.round(duration)}s</div>
                            <div class="metric-description">duración total</div>
                            <div class="metric-detail">
                                ${duration < 120 ? 'Partida rápida' : 
                                  duration < 300 ? 'Ritmo normal' : 'Partida larga'}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="specialization-showcase">
                    <div class="specialization-header">
                        <span class="spec-icon" style="color: ${specialization.color}">${specialization.icon}</span>
                        <span class="spec-title">${specialization.type}</span>
                    </div>
                    <div class="specialization-description">${specialization.description}</div>
                </div>

                ${isPerfectRound ? `
                <div class="perfect-round-highlight">
                    <div class="perfect-icon">💎</div>
                    <div class="perfect-text">
                        <div class="perfect-title">¡RONDA PERFECTA!</div>
                        <div class="perfect-description">Conseguiste el máximo puntaje posible</div>
                    </div>
                </div>
                ` : ''}

                <div class="performance-insights">
                    <div class="insights-header">📊 Análisis de Rendimiento</div>
                    <div class="insights-content">
                        <div class="insight-item">
                            <span class="insight-label">Estrategia dominante:</span>
                            <span class="insight-value">
                                ${successfulDeceptions > liesDetected ? 'Enfoque ofensivo - Maestro del engaño' :
                                  liesDetected > successfulDeceptions ? 'Enfoque defensivo - Detective experto' :
                                  'Estrategia equilibrada - Versátil'}
                            </span>
                        </div>
                        <div class="insight-item">
                            <span class="insight-label">Punto fuerte:</span>
                            <span class="insight-value">
                                ${accuracy >= 95 ? 'Decisiones perfectas' :
                                  deceptionRate >= 80 ? 'Engaños convincentes' :
                                  detectionRate >= 80 ? 'Detección precisa' :
                                  myScore >= 15 ? 'Puntuación alta' : 'Buena participación'}
                            </span>
                        </div>
                        <div class="insight-item">
                            <span class="insight-label">Área de mejora:</span>
                            <span class="insight-value">
                                ${timeouts > 2 ? 'Tomar decisiones más rápidas' :
                                  falseAccusations > 2 ? 'Ser más cauteloso al acusar' :
                                  deceptionRate < 30 ? 'Mejorar técnicas de engaño' :
                                  detectionRate < 30 ? 'Desarrollar intuición para detectar' :
                                  'Mantener este nivel excelente'}
                            </span>
                        </div>
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
            console.error('[RANKING MENTIROSO] Firebase no está disponible');
            if (rankingBody) {
                rankingBody.innerHTML = '<tr><td colspan="6" class="empty-state">Error de conexión. Recargá la página.</td></tr>';
            }
            return;
        }

        const db = window.firebase.firestore();
        const usersRef = db.collection('users');
        
        const unsubscribe = usersRef.onSnapshot((snapshot) => {
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
                
                // Incluir solo usuarios con displayName válido
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
        if (!window.firebase || !window.firebase.firestore) {
            console.error('[RANKING MENTIROSO] Firebase no está disponible para historial');
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
                matches.push({
                    id: doc.id,
                    ...data
                });
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
                        <span>Buscando a los embaucadores...</span>
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
                    <span>Revisando partidas...</span>
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
    
    // Esperar a que Firebase esté disponible
    function initializeWhenReady() {
        if (window.firebase && window.firebase.firestore) {
            console.log('[RANKING MENTIROSO] Firebase disponible, configurando listeners...');
            setupRankingListener();
            setupHistoryListener();
        } else {
            console.log('[RANKING MENTIROSO] Esperando Firebase...');
            setTimeout(initializeWhenReady, 1000);
        }
    }
    
    initializeWhenReady();
}); 