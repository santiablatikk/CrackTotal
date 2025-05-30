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