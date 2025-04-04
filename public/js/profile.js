/**
 * CRACK TOTAL - Perfil Unificado
 * Gestiona la carga de datos y visualización del perfil de usuario
 */

// Variables globales
let currentGame = 'pasala-che';
let apiBaseUrl = '/api'; // Base URL for API endpoints

// Evento para cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente cargado - Perfil');
    // Inicializar la UI
    initUI();
    // Cargar datos del usuario y del juego seleccionado
    loadUserDataAndGame(currentGame);
});

// Inicializar la interfaz de usuario
function initUI() {
    console.log('Inicializando UI - Perfil');
    // Configurar el selector de juegos
    setupGameSelection();
    
    // Mostrar/ocultar indicador de carga principal
    const mainLoader = document.querySelector('.loading-content');
    if (mainLoader) {
        setTimeout(() => {
            mainLoader.style.display = 'none';
        }, 800);
    }
    
    // Inicializar animación del ícono de la pelota
    const iconElement = document.querySelector('.ball-icon');
    if (iconElement) {
        function animateIcon() {
            iconElement.classList.add('animate-bounce');
            setTimeout(() => {
                iconElement.classList.remove('animate-bounce');
                setTimeout(animateIcon, 3000);
            }, 1000);
        }
        animateIcon();
    }
}

// Configurar el selector de juegos
function setupGameSelection() {
    const gameOptions = document.querySelectorAll('.game-option');
    console.log('Configurando selector de juegos, opciones encontradas:', gameOptions.length);
    
    gameOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remover clase activa de todas las opciones
            gameOptions.forEach(opt => opt.classList.remove('active'));
            // Agregar clase activa a la opción seleccionada
            this.classList.add('active');
            
            // Actualizar el juego seleccionado
            const game = this.getAttribute('data-game');
            if (game !== currentGame) {
                currentGame = game;
                // Aplicar el atributo data-active-game al contenedor principal
                applyGameTheme(game);
                // Cargar datos específicos del juego
                loadUserDataAndGame(game);
            }
        });
    });
    
    // Activar el juego por defecto
    const defaultGameOption = document.querySelector(`.game-option[data-game="${currentGame}"]`);
    if (defaultGameOption) {
        defaultGameOption.classList.add('active');
        // Aplicar el atributo data-active-game al contenedor principal para el juego por defecto
        applyGameTheme(currentGame);
    } else {
        console.warn(`No se encontró la opción de juego predeterminada: ${currentGame}`);
    }
}

// Aplicar tema específico del juego
function applyGameTheme(game) {
    const container = document.querySelector('.user-page-container');
    if (container) {
        // Eliminar cualquier atributo data-active-game anterior
        container.removeAttribute('data-active-game');
        // Aplicar el nuevo atributo
        container.setAttribute('data-active-game', game);
        
        // Actualizar ícono del juego si es necesario
        updateGameIcon(game);
    }
}

// Actualizar ícono del juego según el tipo de juego
function updateGameIcon(game) {
    const iconClass = game === 'pasala-che' ? 'fa-circle-notch' : 'fa-question-circle';
    const gameIcon = document.querySelector(`.game-option[data-game="${game}"] .game-icon i`);
    
    if (gameIcon) {
        // Eliminar todas las clases de ícono y agregar la correcta
        gameIcon.className = '';
        gameIcon.classList.add('fas', iconClass);
    }
}

// Mostrar indicadores de carga
function showLoading() {
    const loadingElement = document.getElementById('profile-loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
    
    // Ocultar el contenido principal
    const contentElement = document.querySelector('.profile-content');
    if (contentElement) {
        contentElement.style.opacity = '0.3';
    }
}

// Ocultar indicadores de carga
function hideLoading() {
    const loadingElement = document.getElementById('profile-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    // Mostrar el contenido principal
    const contentElement = document.querySelector('.profile-content');
    if (contentElement) {
        contentElement.style.opacity = '1';
    }
}

// Mostrar mensajes de error
function showError(message) {
    console.error(message);
    
    // Ocultar indicadores de carga
    hideLoading();
    
    // Mostrar un mensaje de error en la pestaña activa
    const contentElement = document.querySelector('.profile-content');
    if (contentElement) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button class="retry-button">Intentar nuevamente</button>
        `;
        
        // Agregar botón para reintentar
        contentElement.appendChild(errorDiv);
        const retryButton = errorDiv.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', function() {
                errorDiv.remove();
                loadUserDataAndGame(currentGame);
            });
        }
    }
}

// Cargar datos del usuario y del juego seleccionado
function loadUserDataAndGame(game) {
    console.log(`Cargando datos para el juego: ${game}`);
    
    // Mostrar indicadores de carga
    showLoading();
    
    // Usar datos de perfil predeterminados para casos de error o desarrollo local
    const defaultUserData = {
        username: localStorage.getItem('username') || localStorage.getItem('playerName') || 'Jugador',
        level: 1,
        xp: 0,
        totalXp: 1000,
        rank: 0,
        highScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        accuracy: 0,
        totalAttempts: 0
    };
    
    // Intentar cargar los datos de la API primero
    fetch(`${apiBaseUrl}/user/profile?game=${game}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los datos del perfil');
            }
            return response.json();
        })
        .then(userData => {
            // Actualizar información de perfil de usuario
            updateUserProfileInfo(userData);
            
            // Cargar datos específicos del juego
            loadGameSpecificData(game);
        })
        .catch(error => {
            console.error('Error cargando el perfil desde la API:', error);
            console.log('Usando datos de perfil predeterminados');
            
            // Usar datos predeterminados en caso de error
            updateUserProfileInfo(defaultUserData);
            
            // Cargar datos específicos del juego
            loadGameSpecificData(game);
        })
        .finally(() => {
            // Ocultar el indicador de carga del perfil
            hideLoading();
        });
}

// Cargar datos específicos del juego seleccionado
function loadGameSpecificData(game) {
    console.log(`Cargando datos específicos para el juego: ${game}`);
    
    // Obtener datos de configuración por defecto para el juego
    const defaultGameData = getDefaultGameData(game);
    
    // Si tenemos GameData disponible, cargar datos locales primero
    if (window.GameData) {
        try {
            let gameData = {...defaultGameData};
            
            // Cargar estadísticas del juego seleccionado
            let gameStats = {};
            if (game === 'pasala-che') {
                gameStats = window.GameData.getPasalaCheStats();
                // Actualizar etiquetas y estadísticas para PASALA CHE
                gameData.stats = {
                    gamesPlayed: gameStats.gamesPlayed || 0,
                    gamesWon: gameStats.wins || 0,
                    winRate: Math.round((gameStats.wins / Math.max(1, gameStats.gamesPlayed)) * 100) || 0,
                    accuracy: gameStats.accuracy || 0,
                    highScore: gameStats.highScore || 0,
                    averageTime: gameStats.avgTime || 0
                };
            } else {
                gameStats = window.GameData.getQuienSabeStats();
                // Actualizar etiquetas y estadísticas para QUIÉN SABE MÁS
                gameData.stats = {
                    gamesPlayed: gameStats.gamesPlayed || 0,
                    gamesWon: gameStats.wins || 0,
                    winRate: Math.round((gameStats.wins / Math.max(1, gameStats.gamesPlayed)) * 100) || 0,
                    accuracy: gameStats.accuracy || 0,
                    highScore: gameStats.highScore || 0,
                    averageTime: gameStats.avgTime || 0
                };
            }
            
            console.log('Datos locales cargados:', gameData);
            
            // Actualizar interfaz con datos locales
            updateGameHeader(gameData);
            updateProfileStats(gameData.stats, gameData.statLabels);
            updateGameSpecificLabels(gameData);
            
            // Cargar estadísticas detalladas
            loadDetailedStats(game);
            
            // Cargar logros
            loadAchievements(game);
            
            // Ocultar todos los indicadores de carga una vez que los datos están listos
            hideLoading();
            
            return;
        } catch (error) {
            console.error('Error al cargar datos locales:', error);
            // Si hay error, continuar con el flujo normal usando la API
        }
    }
    
    // Intentar cargar desde la API si los datos locales no están disponibles o fallaron
    fetch(`${apiBaseUrl}/games/${game}/info`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar los datos del juego: ${response.status}`);
            }
            return response.json();
        })
        .then(gameData => {
            // Actualizar título del juego y descripción
            updateGameHeader(gameData);
            
            // Actualizar estadísticas de perfil con los datos del juego
            updateProfileStats(gameData.stats, gameData.statLabels);
            
            // Actualizar etiquetas específicas del juego
            updateGameSpecificLabels(gameData);
            
            // Cargar estadísticas detalladas
            loadDetailedStats(game);
            
            // Cargar logros
            loadAchievements(game);
            
            // Ocultar todos los indicadores de carga una vez que los datos están listos
            hideLoading();
        })
        .catch(error => {
            console.error('Error cargando datos del juego desde API:', error);
            console.log('Usando datos de juego predeterminados');
            
            // Usar configuración por defecto en caso de error
            updateGameHeader(defaultGameData);
            updateProfileStats(defaultGameData.stats, defaultGameData.statLabels);
            updateGameSpecificLabels(defaultGameData);
            
            // Intentar cargar estadísticas detalladas a pesar del error
            loadDetailedStats(game);
            
            // Cargar logros a pesar del error
            loadAchievements(game);
            
            // Ocultar indicadores de carga
            hideLoading();
        });
}

// Obtener configuración por defecto para un juego en caso de error de API
function getDefaultGameData(game) {
    // Configuración básica por defecto
    if (game === 'pasala-che') {
        return {
            title: 'PASALA CHE',
            description: 'El juego de palabras del fútbol',
            icon: 'fa-circle-notch',
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                winRate: 0,
                accuracy: 0,
                highScore: 0,
                averageTime: 0
            },
            statLabels: {
                games: 'Partidas Jugadas',
                winRate: 'Palabras Acertadas',
                accuracy: 'Precisión Palabras',
                time: 'Tiempo Promedio'
            },
            highScoreLabel: 'Récord Rosco'
        };
    } else {
        return {
            title: '¿QUIÉN SABE MÁS?',
            description: 'El juego de preguntas del fútbol',
            icon: 'fa-question-circle',
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                winRate: 0,
                accuracy: 0,
                highScore: 0,
                averageTime: 0
            },
            statLabels: {
                games: 'Partidas Jugadas',
                winRate: 'Tasa de Victoria',
                accuracy: 'Preguntas Correctas',
                time: 'Minutos por Juego'
            },
            highScoreLabel: 'Mejor Puntaje'
        };
    }
}

// Actualizar el encabezado del juego con información específica
function updateGameHeader(gameData) {
    const gameTitle = document.querySelector('.game-selector .game-option.active .game-name');
    if (gameTitle) {
        gameTitle.textContent = gameData.title;
    }
    
    // Actualizar la descripción en la cabecera si existe
    const gameDescription = document.querySelector('.subtitle');
    if (gameDescription) {
        gameDescription.textContent = gameData.description;
    }
}

// Actualizar la información del perfil de usuario
function updateUserProfileInfo(userData) {
    console.log('Actualizando información de perfil de usuario');
    
    // Actualizar nombre de usuario
    const usernameElement = document.querySelector('.profile-username');
    if (usernameElement) {
        usernameElement.textContent = userData.username;
    } else {
        console.warn('No se encontró el elemento .profile-username');
    }
    
    // Actualizar nivel
    const levelBadgeElement = document.querySelector('.level-badge');
    if (levelBadgeElement) {
        levelBadgeElement.textContent = `${userData.level}`;
    } else {
        console.warn('No se encontró el elemento .level-badge');
    }
    
    const profileLevelText = document.querySelector('.profile-level-text');
    if (profileLevelText) {
        profileLevelText.textContent = `Nivel ${userData.level}`;
    }
    
    // Actualizar progreso de nivel
    const currentLevel = userData.level;
    const currentXP = userData.xp;
    const totalXPForNextLevel = userData.totalXp;
    const progressPercentage = (currentXP / totalXPForNextLevel) * 100;
    
    const currentLevelElement = document.querySelector('#profile-level-display');
    if (currentLevelElement) {
        currentLevelElement.textContent = `Nivel ${currentLevel}`;
    }
    
    const xpProgressElement = document.querySelector('#xp-progress-text');
    if (xpProgressElement) {
        xpProgressElement.textContent = `${currentXP.toLocaleString()} / ${totalXPForNextLevel.toLocaleString()} XP`;
    }
    
    const progressFillElement = document.querySelector('#level-progress-fill');
    if (progressFillElement) {
        progressFillElement.style.width = `${progressPercentage}%`;
    }
    
    // Actualizar rango y mejor puntuación
    const rankValueElement = document.querySelector('#current-rank-profile');
    if (rankValueElement) {
        rankValueElement.textContent = `#${userData.rank}`;
    }
    
    const scoreValueElement = document.querySelector('#best-score-profile');
    if (scoreValueElement) {
        scoreValueElement.textContent = userData.highScore;
    }
}

// Actualizar estadísticas de perfil
function updateProfileStats(stats, labels) {
    console.log('Actualizando estadísticas de perfil con etiquetas personalizadas');
    
    // Actualizar valores de estadísticas
    updateStatValue('games-played', stats.gamesPlayed, labels.games);
    updateStatValue('win-rate', `${stats.winRate}%`, labels.winRate);
    updateStatValue('accuracy', `${stats.accuracy}%`, labels.accuracy);
    
    // Formatear el tiempo según el contexto del juego
    let timeDisplay = '';
    if (stats.averageTime < 60) {
        timeDisplay = `${stats.averageTime} seg`;
    } else {
        timeDisplay = `${Math.floor(stats.averageTime / 60)}:${(stats.averageTime % 60).toString().padStart(2, '0')}`;
    }
    updateStatValue('avg-time', timeDisplay, labels.time);
}

// Actualizar etiquetas específicas del juego
function updateGameSpecificLabels(gameData) {
    // Actualizar la etiqueta del mejor puntaje
    const bestScoreLabel = document.querySelector('.score-label');
    if (bestScoreLabel) {
        bestScoreLabel.textContent = gameData.highScoreLabel;
    }
}

// Actualizar el valor y etiqueta de una estadística específica
function updateStatValue(statId, value, label = null) {
    // Actualizar el valor
    const statElement = document.querySelector(`.stat-item[data-stat="${statId}"] .stat-number`);
    if (statElement) {
        statElement.textContent = value;
    } else {
        console.warn(`No se encontró el elemento para la estadística: ${statId}`);
    }
    
    // Actualizar la etiqueta si se proporciona
    if (label) {
        const labelElement = document.querySelector(`.stat-item[data-stat="${statId}"] .stat-label`);
        if (labelElement) {
            labelElement.textContent = label;
        }
    }
}

// Cargar estadísticas detalladas
function loadDetailedStats(game) {
    console.log(`Cargando estadísticas detalladas para el juego: ${game}`);
    
    const detailedStatsSection = document.querySelector('#detailed-stats-content');
    if (!detailedStatsSection) return;
    
    // Si tenemos GameData disponible, intentar cargar datos locales primero
    if (window.GameData) {
        try {
            let statsData = {};
            
            if (game === 'pasala-che') {
                // Obtener datos para PASALA CHE
                const baseStats = window.GameData.getPasalaCheStats();
                const letterStats = window.GameData.getLetterStats();
                const gameHistory = window.GameData.getGameHistory('pasala-che');
                
                statsData = {
                    totalRoscos: baseStats.gamesPlayed || 0,
                    avgLetters: baseStats.avgLetters || 0,
                    bestRosco: baseStats.highScore || 0,
                    letterStats: {},
                    lastGames: []
                };
                
                // Convertir estadísticas por letra al formato esperado
                for (const [letter, stats] of Object.entries(letterStats)) {
                    statsData.letterStats[letter] = stats.accuracy || 0;
                }
                
                // Preparar últimos juegos para visualización
                statsData.lastGames = gameHistory.slice(0, 5).map(game => ({
                    date: game.date,
                    correct: game.correct || 0,
                    incorrect: game.wrong || 0
                }));
                
                // Generar HTML para PASALA CHE
                detailedStatsSection.innerHTML = generateRoscoStatsFromData(statsData);
            } else {
                // Obtener datos para QUIÉN SABE MÁS
                const baseStats = window.GameData.getQuienSabeStats();
                const categoryStats = window.GameData.getCategoryStats();
                const gameHistory = window.GameData.getGameHistory('quien-sabe-theme');
                
                statsData = {
                    totalQuestions: baseStats.gamesPlayed * 10 || 0, // Estimado
                    correctAnswers: baseStats.gamesPlayed * baseStats.accuracy / 10 || 0, // Estimado
                    accuracy: baseStats.accuracy || 0,
                    categories: {},
                    lastGames: []
                };
                
                // Convertir estadísticas por categoría al formato esperado
                for (const [category, stats] of Object.entries(categoryStats)) {
                    statsData.categories[category] = stats.accuracy || 0;
                }
                
                // Preparar últimos juegos para visualización
                statsData.lastGames = gameHistory.slice(0, 5).map(game => ({
                    date: game.date,
                    questions: game.correct + game.wrong + game.skipped || 10,
                    correct: game.correct || 0,
                    incorrect: game.wrong || 0,
                    skipped: game.skipped || 0
                }));
                
                // Generar HTML para QUIÉN SABE MÁS
                detailedStatsSection.innerHTML = generateQuizStatsFromData(statsData);
            }
            
            return;
        } catch (error) {
            console.error('Error al cargar estadísticas detalladas locales:', error);
            // Si hay error, continuar con el flujo normal usando la API
        }
    }
    
    // Definir estadísticas predeterminadas para cada juego
    const defaultRoscoStats = {
        totalRoscos: 0,
        avgLetters: 0,
        bestRosco: 0,
        letterStats: generateEmptyLetterStats(),
        lastGames: []
    };
    
    const defaultQuizStats = {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        categories: {
            'Historia': 0,
            'Jugadores': 0,
            'Clubes': 0,
            'Mundiales': 0,
            'Equipos': 0,
            'Estadísticas': 0,
            'Copas': 0
        },
        lastGames: []
    };
    
    // Realizar fetch para obtener estadísticas detalladas de la API
    fetch(`${apiBaseUrl}/user/stats/${game}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar estadísticas: ${response.status}`);
            }
            return response.json();
        })
        .then(statsData => {
            // Limpiar contenido existente
            detailedStatsSection.innerHTML = '';
            
            // Generar estadísticas específicas según el juego
            let statsHTML = '';
            
            if (game === 'pasala-che') {
                // Estadísticas para PASALA CHE (juego de rosco)
                statsHTML = generateRoscoStatsFromData(statsData);
            } else {
                // Estadísticas para QUIÉN SABE MÁS (preguntas)
                statsHTML = generateQuizStatsFromData(statsData);
            }
            
            detailedStatsSection.innerHTML = statsHTML;
        })
        .catch(error => {
            console.error('Error cargando estadísticas desde API:', error);
            console.log('Usando estadísticas predeterminadas');
            
            // Generar estadísticas con datos predeterminados según el juego
            if (game === 'pasala-che') {
                detailedStatsSection.innerHTML = generateRoscoStatsFromData(defaultRoscoStats);
            } else {
                detailedStatsSection.innerHTML = generateQuizStatsFromData(defaultQuizStats);
            }
        });
}

// Generar estadísticas de visualización para el juego PASALA CHE con datos reales
function generateRoscoStatsFromData(data) {
    return `
        <div class="game-stats-summary">
            <div class="stat-card">
                <div class="stat-card-icon">
                    <i class="fas fa-sync-alt"></i>
                </div>
                <div class="stat-card-value">${data.totalRoscos || 0}</div>
                <div class="stat-card-label">Roscos Completados</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-card-value">${data.avgLetters || 0}</div>
                <div class="stat-card-label">Promedio de Aciertos</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="stat-card-value">${data.bestRosco || 0}</div>
                <div class="stat-card-label">Mejor Rosco</div>
            </div>
        </div>
        
        <h3 class="subsection-title">Precisión por Letra</h3>
        <div class="letter-accuracy-grid">
            ${generateLetterAccuracyHTML(data.letterStats || {})}
        </div>
        
        <h3 class="subsection-title">Últimos Roscos</h3>
        <div class="recent-games">
            ${data.lastGames && data.lastGames.length > 0 ? 
                data.lastGames.map(game => `
                    <div class="recent-game-card">
                        <div class="game-date">${formatDate(game.date)}</div>
                        <div class="rosco-stats-preview">
                            <div class="rosco-circle correct">${game.correct}</div>
                            <div class="rosco-circle incorrect">${game.incorrect}</div>
                            <div class="rosco-circle pending">${27 - game.correct - game.incorrect}</div>
                        </div>
                    </div>
                `).join('') : 
                `<div class="placeholder-message">
                    <i class="fas fa-history"></i>
                    <p>No hay roscos recientes para mostrar</p>
                </div>`
            }
        </div>
    `;
}

// Generar estadísticas de visualización para el juego QUIÉN SABE MÁS con datos reales
function generateQuizStatsFromData(data) {
    return `
        <div class="game-stats-summary">
            <div class="stat-card">
                <div class="stat-card-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <div class="stat-card-value">${data.totalQuestions || 0}</div>
                <div class="stat-card-label">Preguntas Respondidas</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-icon">
                    <i class="fas fa-check"></i>
                </div>
                <div class="stat-card-value">${data.correctAnswers || 0}</div>
                <div class="stat-card-label">Respuestas Correctas</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-icon">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="stat-card-value">${data.accuracy || 0}%</div>
                <div class="stat-card-label">Precisión Total</div>
            </div>
        </div>
        
        <h3 class="subsection-title">Rendimiento por Categoría</h3>
        <div class="category-accuracy">
            ${generateCategoryAccuracyHTML(data.categories || {})}
        </div>
        
        <h3 class="subsection-title">Últimas Partidas</h3>
        <div class="recent-games">
            ${data.lastGames && data.lastGames.length > 0 ? 
                data.lastGames.map(game => `
                    <div class="recent-game-card">
                        <div class="game-date">${formatDate(game.date)}</div>
                        <div class="game-questions">${game.questions} preguntas</div>
                        <div class="quiz-stats-preview">
                            <div class="question-counter">
                                ${Array(game.correct).fill('<div class="question-dot correct"></div>').join('')}
                                ${Array(game.incorrect).fill('<div class="question-dot incorrect"></div>').join('')}
                                ${Array(game.skipped).fill('<div class="question-dot skipped"></div>').join('')}
                            </div>
                            <div class="correctness-ratio">${game.correct}/${game.questions}</div>
                        </div>
                    </div>
                `).join('') : 
                `<div class="placeholder-message">
                    <i class="fas fa-history"></i>
                    <p>No hay partidas recientes para mostrar</p>
                </div>`
            }
        </div>
    `;
}

// Generar HTML para la precisión por letra
function generateLetterAccuracyHTML(letterStats) {
    return Object.entries(letterStats).map(([letter, accuracy]) => {
        const colorClass = accuracy >= 80 ? 'high' : (accuracy >= 60 ? 'medium' : 'low');
        return `
            <div class="letter-accuracy-item ${colorClass}">
                <div class="letter">${letter}</div>
                <div class="accuracy-bar">
                    <div class="accuracy-fill" style="width: ${accuracy}%"></div>
                </div>
                <div class="accuracy-percentage">${accuracy}%</div>
            </div>
        `;
    }).join('');
}

// Generar HTML para la precisión por categoría
function generateCategoryAccuracyHTML(categories) {
    return Object.entries(categories).map(([category, accuracy]) => {
        const colorClass = accuracy >= 80 ? 'high' : (accuracy >= 60 ? 'medium' : 'low');
        return `
            <div class="category-accuracy-item ${colorClass}">
                <div class="category-name">${category}</div>
                <div class="accuracy-bar">
                    <div class="accuracy-fill" style="width: ${accuracy}%"></div>
                </div>
                <div class="accuracy-percentage">${accuracy}%</div>
            </div>
        `;
    }).join('');
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Cargar logros
function loadAchievements(game) {
    const achievementsContainer = document.querySelector('#achievements-content');
    
    if (!achievementsContainer) return;
    
    console.log(`Cargando logros para el juego: ${game}`);
    
    // Obtener IP del usuario para recuperar logros
    const userIP = localStorage.getItem('userIP') || 'unknown';
    const storageKey = `userAchievements_${userIP}`;
    
    setTimeout(() => {
        // Obtener logros guardados
        let savedAchievements = [];
        try {
            const achievementsData = localStorage.getItem(storageKey);
            if (achievementsData) {
                savedAchievements = JSON.parse(achievementsData);
            }
        } catch (error) {
            console.error('Error al cargar logros guardados:', error);
        }
        
        // Generar HTML para los logros
        const achievementsHTML = generateAchievementsHTML(game, savedAchievements);
        achievementsContainer.innerHTML = achievementsHTML;
    }, 1000);
}

// Generar estadísticas de letras vacías
function generateEmptyLetterStats() {
    const stats = {};
    for (let i = 65; i <= 90; i++) {
        stats[String.fromCharCode(i)] = 0;
    }
    return stats;
}

// Generar HTML para los logros
function generateAchievementsHTML(game, savedAchievements) {
    // Verificar si tenemos definiciones de logros disponibles en la ventana global
    const achievementDefinitions = window.gameAchievements || [];
    
    // Combinar definiciones con datos guardados
    const achievements = savedAchievements.map(savedAchievement => {
        // Buscar definición completa del logro
        const definition = achievementDefinitions.find(a => a.id === savedAchievement.id);
        
        // Combinar datos guardados con definición
        return {
            ...savedAchievement,
            icon: savedAchievement.icon || (definition ? definition.icon : 'fas fa-trophy'),
            title: savedAchievement.title || (definition ? definition.title : savedAchievement.id),
            description: savedAchievement.description || (definition ? definition.description : 'Logro desbloqueado'),
            category: savedAchievement.category || (definition ? definition.category : 'beginner'),
            maxCount: definition ? definition.maxCount : 1
        };
    });
    
    // Si no hay logros, mostrar mensaje
    if (achievements.length === 0) {
        return `
            <div class="placeholder-message">
                <i class="fas fa-medal"></i>
                <p>Completa partidas para desbloquear logros</p>
            </div>
        `;
    }
    
    // Organizar logros por categoría
    const categories = {
        beginner: { name: 'Principiante', achievements: [] },
        intermediate: { name: 'Intermedio', achievements: [] },
        expert: { name: 'Experto', achievements: [] },
        special: { name: 'Especial', achievements: [] }
    };
    
    // Agrupar logros por categoría
    achievements.forEach(achievement => {
        const category = achievement.category || 'beginner';
        if (categories[category]) {
            categories[category].achievements.push(achievement);
        } else {
            categories.beginner.achievements.push(achievement);
        }
    });
    
    // Construir HTML para mostrar logros
    let achievementsHTML = `
        <div class="achievements-header">
            <p class="achievements-summary">Has desbloqueado <span class="highlight">${achievements.filter(a => a.unlocked).length}</span> de ${achievementDefinitions.length} logros disponibles</p>
        </div>
    `;
    
    // Agregar secciones por categoría
    for (const [catKey, category] of Object.entries(categories)) {
        if (category.achievements.length > 0) {
            achievementsHTML += `
                <div class="achievement-category">
                    <h3 class="subsection-title">${category.name}</h3>
                    <div class="achievement-cards">
            `;
            
            // Agregar tarjetas de logros
            category.achievements.forEach(achievement => {
                const isUnlocked = achievement.unlocked;
                const progress = achievement.maxCount > 1 
                    ? Math.min(100, (achievement.count / achievement.maxCount) * 100) 
                    : (isUnlocked ? 100 : 0);
                
                achievementsHTML += `
                    <div class="achievement-card ${isUnlocked ? '' : 'locked-achievement'}" data-id="${achievement.id}">
                        <div class="achievement-icon">
                            <i class="${achievement.icon}"></i>
                        </div>
                        <div class="achievement-name">${achievement.title}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        ${achievement.maxCount > 1 ? `
                            <div class="achievement-progress">
                                <div class="achievement-progress-bar">
                                    <div class="achievement-progress-fill" style="width: ${progress}%"></div>
                                </div>
                                <div class="achievement-count">${achievement.count || 0}/${achievement.maxCount}</div>
                            </div>
                        ` : ''}
                        ${isUnlocked ? `<div class="achievement-date">${formatDate(achievement.date)}</div>` : ''}
                    </div>
                `;
            });
            
            achievementsHTML += `
                </div>
            </div>
        `;
        }
    }
    
    // Agregar estilos dinámicamente si no existen
    if (!document.getElementById('achievements-dynamic-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'achievements-dynamic-styles';
        styleEl.textContent = `
            .achievements-header {
                margin-bottom: 2rem;
                text-align: center;
            }
            
            .achievements-summary {
                color: rgba(255, 255, 255, 0.7);
                margin-top: 0.5rem;
            }
            
            .achievements-summary .highlight {
                color: #e11d48;
                font-weight: bold;
            }
            
            .achievement-category {
                margin-bottom: 2rem;
            }
            
            .achievement-cards {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                gap: 15px;
                margin-top: 1rem;
            }
            
            .achievement-card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                padding: 15px;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .achievement-card:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-2px);
            }
            
            .achievement-icon {
                font-size: 24px;
                color: #e11d48;
                margin-bottom: 10px;
            }
            
            .achievement-name {
                font-weight: bold;
                margin-bottom: 5px;
                color: white;
            }
            
            .achievement-description {
                font-size: 0.9rem;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 10px;
            }
            
            .achievement-date {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.5);
                margin-top: 10px;
            }
            
            .locked-achievement {
                filter: grayscale(100%);
                opacity: 0.6;
            }
            
            .locked-achievement .achievement-name:after {
                content: "🔒";
                margin-left: 5px;
                font-size: 0.9em;
            }
            
            .achievement-progress {
                width: 100%;
                margin-top: 0.5rem;
            }
            
            .achievement-progress-bar {
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 0.25rem;
            }
            
            .achievement-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #60a5fa);
                border-radius: 3px;
                transition: width 0.5s ease;
            }
            
            .achievement-count {
                font-size: 0.75rem;
                text-align: right;
                color: rgba(255, 255, 255, 0.6);
            }
            
            .locked-achievement .achievement-progress-fill {
                background: rgba(255, 255, 255, 0.2);
            }
            
            @media (max-width: 768px) {
                .achievement-cards {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    return achievementsHTML;
}