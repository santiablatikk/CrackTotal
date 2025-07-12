// ================================
// RANKING HELPER - CRACKTOTAL
// Funciones reutilizables para páginas de ranking
// ================================

class RankingHelper {
    constructor() {
        this.spinner = null;
        this.errorContainer = null;
        this.rankingTable = null;
    }

    // Inicializar elementos del DOM
    initializeElements() {
        this.spinner = document.getElementById('ranking-spinner');
        this.errorContainer = document.getElementById('ranking-error');
        this.rankingTable = document.querySelector('.ranking-table');
        console.log('🎯 Elementos del DOM inicializados');
    }

    // Mostrar error
    showError(message) {
        console.error('❌ Error en ranking:', message);
        const tbody = document.getElementById('ranking-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="error-state" style="text-align: center; padding: 20px; color: #dc3545;">
                        ⚠️ ${message}
                    </td>
                </tr>
            `;
        }
    }

    // Función auxiliar para esperar a que Firebase esté listo
    waitForFirebaseService(maxWait = 15000) {
        console.log('⏳ Esperando Firebase Service...');
        return new Promise((resolve, reject) => {
            if (window.firebaseService && window.firebaseService.isServiceReady()) {
                console.log('✅ Firebase Service ya está listo');
                resolve();
                return;
            }

            const startTime = Date.now();
            const checkService = () => {
                if (window.firebaseService && window.firebaseService.isServiceReady()) {
                    console.log('✅ Firebase Service listo después de esperar');
                    resolve();
                } else if (Date.now() - startTime > maxWait) {
                    reject(new Error('Firebase Service no se inicializó en el tiempo esperado'));
                } else {
                    setTimeout(checkService, 200);
                }
            };
            checkService();
        });
    }

    // Poblar tabla de ranking
    populateRankingTable(rankingData, tableBodyId) {
        console.log(`📊 Poblando tabla con ${rankingData.length} entradas`);
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) {
            console.error('❌ No se encontró elemento:', tableBodyId);
            this.showError("Error interno: No se encontró la tabla del ranking.");
            return;
        }

        if (rankingData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data-state" style="text-align: center; padding: 20px; color: #6c757d;">
                        🎮 ¡Sé el primero en aparecer en el ranking!
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = rankingData.map((player, index) => {
            const position = index + 1;
            const positionDisplay = position <= 3 ? 
                (position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉') : 
                position;
            
            // Verificar si es dato agregado o individual
            const isAggregated = player.totalGames !== undefined;
            
            if (isAggregated) {
                // Mostrar datos agregados
                return `
                    <tr class="ranking-row ${position <= 3 ? 'top-three' : ''}">
                        <td class="position">${positionDisplay}</td>
                        <td class="player-name">
                            ${player.playerName || 'Anónimo'}
                            <div style="font-size: 0.7em; color: #888; margin-top: 2px;">
                                ${player.victories}V - ${player.defeats}D - ${player.timeouts}T
                            </div>
                        </td>
                        <td class="total-score">
                            <strong>${player.bestScore}</strong>
                            <div style="font-size: 0.7em; color: #888;">
                                Mejor: ${player.bestScore} | Prom: ${player.averageScore}
                            </div>
                        </td>
                        <td class="games-played">
                            <strong>${player.totalGames}</strong>
                            <div style="font-size: 0.7em; color: #888;">
                                ${player.winRate}% victorias
                            </div>
                        </td>
                        <td class="accuracy hide-mobile">
                            ${player.bestAccuracy}%
                            <div style="font-size: 0.7em; color: #888;">
                                Prom: ${player.averageAccuracy}%
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                // Mostrar datos individuales (formato anterior)
                return `
                    <tr class="ranking-row ${position <= 3 ? 'top-three' : ''}">
                        <td class="position">${positionDisplay}</td>
                        <td class="player-name">${player.playerName || 'Anónimo'}</td>
                        <td class="total-score">${(player.score || 0).toLocaleString()}</td>
                        <td class="games-played">${player.totalQuestions || player.correctAnswers || 'N/A'}</td>
                        <td class="accuracy hide-mobile">${player.accuracy || 0}%</td>
                    </tr>
                `;
            }
        }).join('');

        console.log('✅ Tabla poblada exitosamente');
    }

    // Cargar ranking de un juego específico
    async loadGameRanking(gameType, limit = 15, tableBodyId = 'ranking-body') {
        console.log(`🏆 Cargando ranking ${gameType}...`);
        
        // Mostrar estado de carga
        const tbody = document.getElementById(tableBodyId);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-state" style="text-align: center; padding: 20px; color: #007bff;">
                        🔄 Buscando a los cracks... ¡Espera un momento!
                    </td>
                </tr>
            `;
        }

        try {
            // Esperar a que el servicio esté listo
            await this.waitForFirebaseService();
            
            console.log('🔍 Obteniendo datos del ranking agregado...');
            const rankingData = await window.firebaseService.getAggregatedRanking(gameType, limit);
            
            if (rankingData && rankingData.length > 0) {
                this.populateRankingTable(rankingData, tableBodyId);
            } else {
                console.warn('⚠️ No hay datos de ranking');
                this.showError(`¡Sé el primero en jugar ${gameType} y aparecer en el ranking!`);
            }

        } catch (error) {
            console.error('❌ Error cargando ranking:', error);
            this.showError('No se pudo conectar con el servidor. Inténtalo de nuevo.');
        }
    }

    // Cargar historial del usuario (con opción para mostrar todos los jugadores)
    async loadUserHistory(gameType, limit = 20, containerId = 'history-list', showAllPlayers = false) {
        console.log(`📜 Cargando historial ${gameType}... (Todos: ${showAllPlayers})`);
        const historyContainer = document.getElementById(containerId);
        if (!historyContainer) {
            console.warn('❌ No se encontró contenedor de historial:', containerId);
            return;
        }

        const loadingText = showAllPlayers ? 'Cargando partidas de todos los jugadores...' : 'Revisando tus partidos...';
        historyContainer.innerHTML = `<div class="loading-history" style="text-align: center; padding: 20px; color: #6c757d;"><span>📜</span> ${loadingText}</div>`;

        try {
            // Esperar a que el servicio esté listo
            await this.waitForFirebaseService();
            
            let historyData;
            if (showAllPlayers) {
                // Obtener historial de TODOS los jugadores
                historyData = await this.getAllPlayersHistory(gameType, limit);
            } else {
                // Obtener solo del usuario actual
                historyData = await window.firebaseService.getUserHistory(gameType, limit);
            }

            if (historyData && historyData.length > 0) {
                // Crear botones de toggle
                const toggleButtons = `
                    <div class="history-toggle" style="margin-bottom: 20px; text-align: center;">
                        <button class="toggle-btn ${!showAllPlayers ? 'active' : ''}" 
                                onclick="window.rankingHelper.loadUserHistory('${gameType}', ${limit}, '${containerId}', false)"
                                style="background: ${!showAllPlayers ? '#28a745' : '#6c757d'}; color: white; border: none; padding: 8px 16px; margin: 0 5px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-user"></i> Mi Historial
                        </button>
                        <button class="toggle-btn ${showAllPlayers ? 'active' : ''}" 
                                onclick="window.rankingHelper.loadUserHistory('${gameType}', ${limit}, '${containerId}', true)"
                                style="background: ${showAllPlayers ? '#28a745' : '#6c757d'}; color: white; border: none; padding: 8px 16px; margin: 0 5px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-users"></i> Todos los Jugadores
                        </button>
                    </div>
                `;

                const historyHTML = historyData.map((match, index) => {
                    // Información básica
                    const score = match.score || 0;
                    const correctAnswers = match.correctAnswers || 0;
                    const totalQuestions = match.totalQuestions || 26;
                    const accuracy = match.accuracy || 0;
                    const gameResult = match.gameResult || 'unknown';
                    const difficulty = match.difficulty || 'normal';
                    const playerName = match.playerName || 'Anónimo';
                    
                    // Información de tiempo
                    const duration = match.duration || 0;
                    const timeFormatted = match.timeFormatted || this.formatDuration(duration);
                    
                    // Información adicional
                    const incorrectAnswers = match.incorrectAnswers || 0;
                    const passedAnswers = match.passedAnswers || 0;
                    const helpUsed = match.helpUsed || 0;
                    
                    // Determinar tipo de resultado usando la nueva lógica
                    const result = this.determineGameResult(match, gameType);
                    const resultType = result.type;
                    const resultText = result.text;
                    
                    // Colores e iconos según el resultado
                    let icon, borderColor, bgGradient;
                    
                    if (resultType === 'victory') {
                        icon = '🏆';
                        borderColor = '#28a745';
                        bgGradient = 'linear-gradient(135deg, #28a745, #20c997)';
                    } else if (resultType === 'defeat') {
                        icon = '💥';
                        borderColor = '#dc3545';
                        bgGradient = 'linear-gradient(135deg, #dc3545, #fd7e7e)';
                    } else if (resultType === 'timeout') {
                        icon = '⏰';
                        borderColor = '#ffc107';
                        bgGradient = 'linear-gradient(135deg, #ffc107, #ffdb4d)';
                    } else {
                        icon = '❓';
                        borderColor = '#6c757d';
                        bgGradient = 'linear-gradient(135deg, #6c757d, #868e96)';
                    }
                    
                    // Obtener nombres de dificultad
                    const difficultyNames = {
                        'easy': 'Fácil',
                        'normal': 'Normal', 
                        'hard': 'Difícil',
                        'expert': 'Experto'
                    };
                    const difficultyDisplay = difficultyNames[difficulty] || 'Normal';
                    
                    // Determinar si es partida perfecta (solo si acertó TODAS las respuestas)
                    const isPerfectGame = (gameType === 'pasalache' && correctAnswers === 26) ||
                                        (gameType === 'quiensabemas' && correctAnswers === totalQuestions) ||
                                        (gameType === 'mentiroso' && correctAnswers === totalQuestions);
                    
                    // Información extra para mostrar
                    let extraDetails = [];
                    if (incorrectAnswers > 0) {
                        extraDetails.push(`<span style="color: #e74c3c;">❌ ${incorrectAnswers} errores</span>`);
                    }
                    if (passedAnswers > 0) {
                        extraDetails.push(`<span style="color: #f39c12;">⏭️ ${passedAnswers} pasadas</span>`);
                    }
                    if (helpUsed > 0) {
                        extraDetails.push(`<span style="color: #3498db;">💡 ${helpUsed} ayudas</span>`);
                    }
                    if (isPerfectGame) {
                        extraDetails.push(`<span style="color: #2ecc71;">✨ Partida perfecta</span>`);
                    }
                    
                    // Fecha de juego
                    let gameDate = 'Fecha desconocida';
                    if (match.timestamp) {
                        if (match.timestamp.seconds) {
                            gameDate = new Date(match.timestamp.seconds * 1000).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        } else {
                            gameDate = new Date(match.timestamp).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        }
                    } else if (match.gameDate) {
                        gameDate = new Date(match.gameDate).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                    
                    return `
                        <div class="history-item ${resultType}" style="
                            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                            padding: 16px;
                            margin: 12px 0;
                            border-radius: 10px;
                            border-left: 4px solid ${borderColor};
                            box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
                            position: relative;
                            overflow: hidden;
                            color: #ecf0f1;
                        ">
                            <!-- Indicador de resultado -->
                            <div style="
                                position: absolute;
                                top: 0;
                                right: 0;
                                background: ${bgGradient};
                                color: white;
                                padding: 6px 12px;
                                border-bottom-left-radius: 10px;
                                font-size: 0.85em;
                                font-weight: bold;
                                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                            ">
                                ${icon} ${resultText}
                            </div>
                            
                            <!-- Contenido principal -->
                            <div style="margin-top: 16px;">
                                <!-- Header con jugador y fecha -->
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                    <div>
                                        <h4 style="margin: 0; color: #ecf0f1; font-size: 1em;">
                                            👤 ${playerName} - ${difficultyDisplay}
                                            ${showAllPlayers ? `<span style="font-size: 0.7em; color: #777; margin-left: 8px;">(${(match.playerId || '').substring(0, 8)}...)</span>` : ''}
                                        </h4>
                                        <p style="margin: 4px 0 0 0; color: #bdc3c7; font-size: 0.85em;">
                                            📅 ${gameDate}
                                        </p>
                                    </div>
                                </div>
                                
                                <!-- Estadísticas principales -->
                                <div style="
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
                                    gap: 10px;
                                    margin: 12px 0;
                                ">
                                    <div style="text-align: center; background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 6px; backdrop-filter: blur(5px);">
                                        <div style="font-size: 1.3em; font-weight: bold; color: #2ecc71;">
                                            ${score}
                                        </div>
                                        <div style="font-size: 0.75em; color: #bdc3c7; margin-top: 2px;">
                                            PUNTOS
                                        </div>
                                    </div>
                                    
                                    <div style="text-align: center; background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 6px; backdrop-filter: blur(5px);">
                                        <div style="font-size: 1.1em; font-weight: bold; color: #ecf0f1;">
                                            ${correctAnswers}/${totalQuestions}
                                        </div>
                                        <div style="font-size: 0.75em; color: #bdc3c7; margin-top: 2px;">
                                            ACIERTOS
                                        </div>
                                    </div>
                                    
                                    <div style="text-align: center; background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 6px; backdrop-filter: blur(5px);">
                                        <div style="font-size: 1.1em; font-weight: bold; color: #3498db;">
                                            ${accuracy}%
                                        </div>
                                        <div style="font-size: 0.75em; color: #bdc3c7; margin-top: 2px;">
                                            PRECISIÓN
                                        </div>
                                    </div>
                                    
                                    <div style="text-align: center; background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 6px; backdrop-filter: blur(5px);">
                                        <div style="font-size: 1.1em; font-weight: bold; color: #f39c12;">
                                            ${timeFormatted}
                                        </div>
                                        <div style="font-size: 0.75em; color: #bdc3c7; margin-top: 2px;">
                                            TIEMPO
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Detalles adicionales -->
                                <div style="
                                    background: rgba(0, 0, 0, 0.2);
                                    padding: 8px;
                                    border-radius: 6px;
                                    margin-top: 12px;
                                    font-size: 0.8em;
                                    display: flex;
                                    flex-wrap: wrap;
                                    gap: 12px;
                                    justify-content: space-around;
                                ">
                                    ${extraDetails.join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                historyContainer.innerHTML = toggleButtons + historyHTML;
            } else {
                // Crear botones de toggle incluso cuando no hay datos
                const toggleButtons = `
                    <div class="history-toggle" style="margin-bottom: 20px; text-align: center;">
                        <button class="toggle-btn ${!showAllPlayers ? 'active' : ''}" 
                                onclick="window.rankingHelper.loadUserHistory('${gameType}', ${limit}, '${containerId}', false)"
                                style="background: ${!showAllPlayers ? '#28a745' : '#6c757d'}; color: white; border: none; padding: 8px 16px; margin: 0 5px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-user"></i> Mi Historial
                        </button>
                        <button class="toggle-btn ${showAllPlayers ? 'active' : ''}" 
                                onclick="window.rankingHelper.loadUserHistory('${gameType}', ${limit}, '${containerId}', true)"
                                style="background: ${showAllPlayers ? '#28a745' : '#6c757d'}; color: white; border: none; padding: 8px 16px; margin: 0 5px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-users"></i> Todos los Jugadores
                        </button>
                    </div>
                `;

                const noDataMessage = showAllPlayers ? 
                    '¡No hay partidas registradas aún en este juego!' : 
                    '¡Jugá algunas partidas para ver tu historial aquí!';

                historyContainer.innerHTML = toggleButtons + `
                    <div class="no-data-history" style="
                        text-align: center; 
                        padding: 30px; 
                        color: #bdc3c7;
                        background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                        border-radius: 10px;
                        margin: 12px 0;
                    ">
                        <span style="font-size: 2em;">🎮</span>
                        <p style="margin: 10px 0;">${noDataMessage}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error("❌ Error al cargar historial:", error);
            historyContainer.innerHTML = `
                <div class="error-history" style="
                    text-align: center; 
                    padding: 20px; 
                    color: #e74c3c;
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                    border-radius: 10px;
                    margin: 12px 0;
                ">
                    <span>⚠️</span> No se pudo cargar tu historial.
                </div>
            `;
        }
    }

    // Obtener historial de TODOS los jugadores (sin filtrar por UID)
    async getAllPlayersHistory(gameType, limit = 20) {
        try {
            console.log(`🌍 Obteniendo historial global de ${gameType}...`);
            
            const snapshot = await window.db.collection('matches')
                .where('gameType', '==', gameType)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const history = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                history.push({
                    id: doc.id,
                    ...data
                });
            });

            console.log(`✅ Historial global obtenido: ${history.length} partidas`);
            return history;

        } catch (error) {
            console.error('❌ Error obteniendo historial global:', error);
            
            // Si falla el orderBy, intentar sin ordenamiento
            try {
                console.log('🔄 Intentando consulta sin ordenamiento...');
                const fallbackSnapshot = await window.db.collection('matches')
                    .where('gameType', '==', gameType)
                    .limit(limit)
                    .get();

                const history = [];
                fallbackSnapshot.forEach(doc => {
                    const data = doc.data();
                    history.push({
                        id: doc.id,
                        ...data
                    });
                });

                // Ordenar manualmente por fecha
                history.sort((a, b) => {
                    const dateA = a.timestamp ? (a.timestamp.seconds ? a.timestamp.seconds : new Date(a.timestamp).getTime()) : 0;
                    const dateB = b.timestamp ? (b.timestamp.seconds ? b.timestamp.seconds : new Date(b.timestamp).getTime()) : 0;
                    return dateB - dateA;
                });

                console.log(`✅ Historial fallback obtenido: ${history.length} partidas`);
                return history;

            } catch (fallbackError) {
                console.error('❌ Error en consulta fallback:', fallbackError);
                return [];
            }
        }
    }

    // Obtener clase de resultado basada en el juego y score
    getResultClass(gameType, score, match = null) {
        if (match && gameType === 'pasalache') {
            // Usar la nueva lógica para Pasalache
            const result = this.determineGameResult(match, gameType);
            return result.type;
        }
        
        // Para otros juegos o cuando no hay match disponible
        const thresholds = {
            'pasalache': 15,
            'mentiroso': 60,
            'crackrapido': 50,
            'quiensabemas': 7,
            '100futboleros': 30
        };
        
        const threshold = thresholds[gameType] || 50;
        return score >= threshold ? 'victory' : 'defeat';
    }

    // Determinar el resultado correcto según las reglas del juego
    determineGameResult(match, gameType) {
        const correctAnswers = match.correctAnswers || 0;
        const incorrectAnswers = match.incorrectAnswers || 0;
        const difficulty = match.difficulty || 'normal';
        const gameResult = match.gameResult || 'unknown';
        const score = match.score || 0;
        
        // LOG DETALLADO PARA DEBUG
        console.log(`🔍 [DEBUG] Analizando partida de ${match.playerName || 'Anónimo'}:`, {
            correctAnswers,
            incorrectAnswers,
            difficulty,
            gameResult,
            score,
            'Datos completos del match': match
        });
        
        if (gameType === 'pasalache') {
            // Primero: Si tenemos gameResult explícito de Firebase, usarlo (es más confiable)
            if (gameResult === 'victory') {
                console.log(`✅ [DEBUG] ${match.playerName}: Victoria por gameResult explícito`);
                return { type: 'victory', text: 'Victoria' };
            } else if (gameResult === 'defeat') {
                console.log(`❌ [DEBUG] ${match.playerName}: Derrota por gameResult explícito`);
                return { type: 'defeat', text: 'Derrota' };
            } else if (gameResult === 'timeout') {
                console.log(`⏰ [DEBUG] ${match.playerName}: Timeout por gameResult explícito`);
                return { type: 'timeout', text: 'Tiempo agotado' };
            }
            
            // Segundo: Lógica de respaldo para partidas viejas sin gameResult
            console.log(`🔄 [DEBUG] ${match.playerName}: No hay gameResult explícito, usando lógica de respaldo`);
            
            const maxErrors = {
                'easy': 4,
                'normal': 3,
                'hard': 2,
                'expert': 1
            };
            
            const maxErrorsForDifficulty = maxErrors[difficulty] || 3;
            console.log(`📊 [DEBUG] ${match.playerName}: Máximo de errores para ${difficulty}: ${maxErrorsForDifficulty}`);
            
            // Caso 1: Victoria clara - Completó el rosco (26 respuestas correctas)
            // Verificar tanto correctAnswers como score por si acaso
            if (correctAnswers === 26 || score === 26) {
                console.log(`🏆 [DEBUG] ${match.playerName}: Victoria - Completó el rosco (${correctAnswers || score}/26)`);
                return { type: 'victory', text: 'Victoria' };
            }
            
            // Caso 2: Derrota clara - Alcanzó o superó el máximo de errores
            if (incorrectAnswers >= maxErrorsForDifficulty) {
                console.log(`💥 [DEBUG] ${match.playerName}: Derrota - Errores: ${incorrectAnswers} >= ${maxErrorsForDifficulty}`);
                return { type: 'defeat', text: 'Derrota' };
            }
            
            // Caso 3: Análisis más detallado para partidas viejas
            console.log(`🤔 [DEBUG] ${match.playerName}: Analizando caso intermedio - Correctas: ${correctAnswers}, Errores: ${incorrectAnswers}`);
            
            // Revisar si tenemos datos de incorrectAnswers
            if (incorrectAnswers === 0 && correctAnswers < 26) {
                console.log(`⚠️ [DEBUG] ${match.playerName}: Sin datos de errores, probablemente partida vieja`);
                
                // Para partidas viejas sin datos de errores, usar solo correctAnswers
                // Lógica más estricta basada en los datos reales
                if (correctAnswers >= 25) {
                    // Santy con 25 puntos podría haber completado el rosco
                    console.log(`🏆 [DEBUG] ${match.playerName}: Victoria - Score muy alto, probablemente completó rosco (${correctAnswers}/26)`);
                    return { type: 'victory', text: 'Victoria' };
                } else if (correctAnswers >= 20) {
                    console.log(`⏰ [DEBUG] ${match.playerName}: Timeout - Score alto sin completar (${correctAnswers}/26)`);
                    return { type: 'timeout', text: 'Tiempo agotado' };
                } else if (correctAnswers <= 10) {
                    // Franco con 8/26 y Chiara con 9/26 deben ser derrota
                    console.log(`❌ [DEBUG] ${match.playerName}: Derrota - Score bajo (${correctAnswers}/26)`);
                    return { type: 'defeat', text: 'Derrota' };
                } else if (correctAnswers <= 15) {
                    // Casos entre 11-15 correctas también pueden ser derrota
                    console.log(`❌ [DEBUG] ${match.playerName}: Derrota - Score medio-bajo (${correctAnswers}/26)`);
                    return { type: 'defeat', text: 'Derrota' };
                } else {
                    // Solo casos con 16-19 correctas sin completar son timeout
                    console.log(`⏰ [DEBUG] ${match.playerName}: Timeout - Score medio-alto (${correctAnswers}/26)`);
                    return { type: 'timeout', text: 'Tiempo agotado' };
                }
            }
            
            // Si tenemos datos de errores pero no alcanzó el máximo
            if (correctAnswers >= 20) {
                console.log(`⏰ [DEBUG] ${match.playerName}: Timeout - Score alto (${correctAnswers}/26) con ${incorrectAnswers} errores`);
                return { type: 'timeout', text: 'Tiempo agotado' };
            } else if (correctAnswers <= 8 && incorrectAnswers >= 2) {
                console.log(`❌ [DEBUG] ${match.playerName}: Derrota - Score bajo (${correctAnswers}/26) con ${incorrectAnswers} errores`);
                return { type: 'defeat', text: 'Derrota' };
            } else {
                console.log(`⏰ [DEBUG] ${match.playerName}: Timeout - Caso por defecto (${correctAnswers}/26) con ${incorrectAnswers} errores`);
                return { type: 'timeout', text: 'Tiempo agotado' };
            }
        }
        
        // Para otros juegos, usar lógica actual
        if (gameResult === 'victory') {
            return { type: 'victory', text: 'Victoria' };
        } else if (gameResult === 'defeat') {
            return { type: 'defeat', text: 'Derrota' };
        } else if (gameResult === 'timeout') {
            return { type: 'timeout', text: 'Tiempo agotado' };
        } else {
            // Lógica de respaldo para otros juegos basada en score
            const thresholds = {
                'mentiroso': 60,
                'crackrapido': 50,
                'quiensabemas': 7,
                '100futboleros': 30
            };
            
            const threshold = thresholds[gameType] || 50;
            return score >= threshold ? 
                { type: 'victory', text: 'Victoria' } : 
                { type: 'defeat', text: 'Derrota' };
        }
    }

    // Obtener nombre de visualización del juego
    getGameDisplayName(gameType) {
        const names = {
            'pasalache': 'Pasalache',
            'mentiroso': 'Mentiroso',
            'crackrapido': 'Crack Rápido',
            'quiensabemas': 'Quién Sabe Más',
            '100futboleros': '100 Futboleros'
        };
        
        return names[gameType] || gameType;
    }

    // Función auxiliar para formatear duración
    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Instancia global
window.rankingHelper = new RankingHelper();

// Función de conveniencia para inicializar
window.initializeRanking = function(gameType, limit = 15) {
    console.log(`🚀 Inicializando ranking para ${gameType}`);
    window.rankingHelper.initializeElements();
    window.rankingHelper.loadGameRanking(gameType, limit);
    window.rankingHelper.loadUserHistory(gameType);
};

console.log('🏆 Ranking Helper cargado'); 