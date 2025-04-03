/**
 * CRACK TOTAL - Dashboard Unificado
 * Gestiona la carga de datos y navegación en el dashboard unificado de perfil y ranking
 */

// Variables globales
    let currentGame = 'pasala-che';
let currentTab = 'profile';
let apiBaseUrl = '/api'; // Base URL for API endpoints
    
// Evento para cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente cargado');
    // Inicializar la UI
    initUI();
    // Cargar datos del usuario y del juego seleccionado
    loadUserDataAndGame(currentGame);
});

// Inicializar la interfaz de usuario
function initUI() {
    console.log('Inicializando UI');
    // Configurar el selector de juegos
    setupGameSelection();
    // Configurar las pestañas
    setupTabs();
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
                loadGameSpecificData(game);
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

// Configurar el sistema de pestañas
    function setupTabs() {
        const tabs = document.querySelectorAll('.tab');
    console.log('Configurando tabs, tabs encontrados:', tabs.length);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
            activateTab(tabId);
        });
    });
    
    // Activar la pestaña por defecto
    activateTab(currentTab);
}

// Activar una pestaña específica
function activateTab(tabId) {
    console.log(`Activando tab: ${tabId}`);
    // Si la pestaña ya está activa, no hacer nada
    if (tabId === currentTab) return;
    
    // Actualizar la variable de pestaña actual
    currentTab = tabId;
    
    // Desactivar todas las pestañas y contenidos
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Ocultar indicadores de carga
    document.querySelectorAll('.loading-content').forEach(el => {
        el.style.display = 'none';
    });
    
    // Mostrar indicador de carga para la pestaña seleccionada
    const loadingElement = document.getElementById(`${tabId}-loading`);
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
    
    // Activar la pestaña y contenido seleccionados
    const selectedTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
                    } else {
        console.warn(`No se encontró la pestaña: ${tabId}`);
    }
    
    const selectedContent = document.querySelector(`#${tabId}-content`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    } else {
        console.warn(`No se encontró el contenido para la pestaña: ${tabId}`);
    }
    
    // Cargar datos específicos de la pestaña si es necesario
    if (tabId === 'ranking') {
        loadRankingData(currentGame);
    } else if (tabId === 'stats') {
        loadStatisticsData(currentGame);
    } else if (tabId === 'achievements') {
        loadAchievementsData(currentGame);
    }
}

// Cargar datos del usuario y del juego seleccionado
function loadUserDataAndGame(game) {
    console.log(`Cargando datos para el juego: ${game}`);
    
    // Mostrar indicadores de carga
    showLoading();
    
    // Realizar fetch para obtener datos del usuario
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
            console.error('Error:', error);
            showError('No se pudieron cargar los datos del perfil');
        })
        .finally(() => {
            // Ocultar el indicador de carga del perfil
            const profileLoading = document.getElementById('profile-loading');
            if (profileLoading) {
                profileLoading.style.display = 'none';
            }
        });
}

// Mostrar indicadores de carga
function showLoading(contentType = null) {
    // Si se especifica un tipo de contenido, mostrar solo ese loader
    if (contentType) {
        const loadingElement = document.getElementById(`${contentType}-loading`);
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        
        // Ocultar el contenido principal
        const contentElement = document.querySelector(`#${contentType}-content .${contentType}-content`);
        if (contentElement) {
            contentElement.style.opacity = '0.3';
        }
        return;
    }
    
    // Si no se especifica, mostrar el loader correspondiente a la pestaña activa
    const activeTabId = currentTab;
    const activeLoader = document.getElementById(`${activeTabId}-loading`);
    if (activeLoader) {
        activeLoader.style.display = 'flex';
    }
    
    // Ocultar el contenido principal
    const contentElement = document.querySelector(`#${activeTabId}-content .${activeTabId}-content`);
    if (contentElement) {
        contentElement.style.opacity = '0.3';
    }
}

// Ocultar indicadores de carga
function hideLoading(contentType = null) {
    // Si se especifica un tipo de contenido, ocultar solo ese loader
    if (contentType) {
        const loadingElement = document.getElementById(`${contentType}-loading`);
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Mostrar el contenido principal
        const contentElement = document.querySelector(`#${contentType}-content .${contentType}-content`);
        if (contentElement) {
            contentElement.style.opacity = '1';
        }
        return;
    }
    
    // Si no se especifica, ocultar el loader correspondiente a la pestaña activa
    const activeTabId = currentTab;
    const activeLoader = document.getElementById(`${activeTabId}-loading`);
    if (activeLoader) {
        activeLoader.style.display = 'none';
    }
    
    // Mostrar el contenido principal
    const contentElement = document.querySelector(`#${activeTabId}-content .${activeTabId}-content`);
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
    const activeTabContent = document.querySelector(`#${currentTab}-content .${currentTab}-content`);
    if (activeTabContent) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button class="retry-button">Intentar nuevamente</button>
        `;
        
        // Agregar botón para reintentar
        activeTabContent.appendChild(errorDiv);
        const retryButton = errorDiv.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', function() {
                errorDiv.remove();
                loadUserDataAndGame(currentGame);
            });
        }
    }
}

// Cargar datos específicos del juego seleccionado
function loadGameSpecificData(game) {
    console.log(`Cargando datos específicos para el juego: ${game}`);
    
    // Realizar fetch para obtener datos específicos del juego
    fetch(`${apiBaseUrl}/games/${game}/info`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los datos del juego');
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
            
            // Cargar otros datos según la pestaña activa
            if (currentTab === 'ranking') {
                loadRankingData(game, gameData);
            } else if (currentTab === 'stats') {
                loadStatisticsData(game);
            } else if (currentTab === 'achievements') {
                loadAchievementsData(game);
            }
            
            // Ocultar todos los indicadores de carga una vez que los datos están listos
            hideLoading();
        })
        .catch(error => {
            console.error('Error:', error);
            showError('No se pudieron cargar los datos del juego');
            
            // Usar configuración por defecto en caso de error
            const defaultGameData = getDefaultGameData(game);
            updateGameHeader(defaultGameData);
            updateProfileStats(defaultGameData.stats, defaultGameData.statLabels);
            updateGameSpecificLabels(defaultGameData);
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
            highScoreLabel: 'Récord Rosco',
            rankingLabels: {
                score: 'Aciertos',
                games: 'Roscos',
                timeLabel: 'Último Rosco'
            }
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
            highScoreLabel: 'Mejor Puntaje',
            rankingLabels: {
                score: 'Puntos',
                games: 'Partidas',
                timeLabel: 'Última Partida'
            }
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

// Cargar datos de ranking
function loadRankingData(game, gameData) {
    console.log(`Cargando datos de ranking para el juego: ${game}`);
    
    // Mostrar indicador de carga para el ranking
    const rankingLoading = document.getElementById('ranking-loading');
    if (rankingLoading) {
        rankingLoading.style.display = 'flex';
    }
    
    // Obtener el contenedor de ranking
    const rankingContent = document.querySelector('.ranking-content');
    if (rankingContent) {
        rankingContent.style.opacity = '0.3';
    }
    
    // Cargar datos globales para el ranking
    loadGlobalRankingStats(game, gameData);
    
    // Cargar top 3 jugadores
    loadTopPlayers(game);
    
    // Cargar tabla de ranking
    loadRankingTable(game, gameData);
    
    // Inicializar filtros de ranking
    initRankingFilters();
    
    // Actualizar etiquetas específicas del juego en la tabla de ranking
    updateRankingTableLabels(gameData.rankingLabels);
    
    // Ocultar el indicador de carga después de un tiempo razonable
        setTimeout(() => {
        if (rankingLoading) {
            rankingLoading.style.display = 'none';
        }
        if (rankingContent) {
            rankingContent.style.opacity = '1';
        }
        }, 1000);
}

// Cargar estadísticas globales para el ranking
function loadGlobalRankingStats(game, gameData) {
    console.log(`Cargando estadísticas globales para el juego: ${game}`);
    
    // Realizar fetch para obtener estadísticas globales
    fetch(`${apiBaseUrl}/games/${game}/global-stats`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar estadísticas globales');
            }
            return response.json();
        })
        .then(stats => {
            // Actualizar estadísticas con etiquetas específicas del juego
            updateStatValue('total-players', stats.totalPlayers.toLocaleString(), gameData.globalLabels.players);
            updateStatValue('total-games', stats.totalGames.toLocaleString(), gameData.globalLabels.games);
            updateStatValue('avg-score', stats.avgScore, gameData.globalLabels.avgScore);
            updateStatValue('max-score', stats.maxScore, gameData.globalLabels.maxScore);
        })
        .catch(error => {
            console.error('Error:', error);
            // Mostrar guiones o valores por defecto en caso de error
            updateStatValue('total-players', '-', gameData.globalLabels.players);
            updateStatValue('total-games', '-', gameData.globalLabels.games);
            updateStatValue('avg-score', '-', gameData.globalLabels.avgScore);
            updateStatValue('max-score', '-', gameData.globalLabels.maxScore);
        });
}

// Actualizar etiquetas de la tabla de ranking
function updateRankingTableLabels(labels) {
    // Actualizar encabezados de la tabla
    const scoreHeader = document.querySelector('.improved-ranking-table .score-col');
    if (scoreHeader) {
        scoreHeader.textContent = labels.score;
    }
    
    const gamesHeader = document.querySelector('.improved-ranking-table .games-col');
    if (gamesHeader) {
        gamesHeader.textContent = labels.games;
    }
    
    const timeHeader = document.querySelector('.improved-ranking-table .last-played-col');
    if (timeHeader) {
        timeHeader.textContent = labels.timeLabel;
    }
}

// Renderizar tabla de ranking
function renderRankingTable(data, gameData) {
    console.log('Renderizando tabla de ranking');
    const tableBody = document.querySelector('#ranking-table-body');
    if (!tableBody) {
        console.warn('No se encontró el tbody de la tabla de ranking');
        return;
    }
    
    // Limpiar contenido existente
    tableBody.innerHTML = '';
    
    // Agregar filas
    data.forEach((player, index) => {
        const row = document.createElement('tr');
        if (player.isCurrentUser) {
            row.classList.add('highlight-row');
        }
        
        // Añadir efecto de aparición retardada
        row.style.animationDelay = `${index * 0.05}s`;
        row.classList.add('fade-in-row');
        
        // Generar indicador de cambio de ranking
        let rankChangeHtml = '';
        if (player.rankChange > 0) {
            rankChangeHtml = `<span class="rank-change-up">+${player.rankChange}</span>`;
        } else if (player.rankChange < 0) {
            rankChangeHtml = `<span class="rank-change-down">${player.rankChange}</span>`;
        }
        
        // Formatear tiempo de última actividad
        const timeAgo = formatTimeAgo(player.lastActive);
        
        // Contenido HTML de la fila
        row.innerHTML = `
            <td class="rank-col">
                <span class="rank-indicator">#${player.rank}</span>
                ${rankChangeHtml}
            </td>
            <td>
                <div class="player-info">
                    <div class="player-avatar-small" style="background: ${player.avatarColor};">${player.avatar}</div>
                    <span class="player-name-col">${player.name}</span>
                    ${player.isCurrentUser ? '<span class="you-badge">Tú</span>' : ''}
                </div>
            </td>
            <td class="score-col">${player.score}</td>
            <td>${player.gamesPlayed}</td>
            <td>${timeAgo}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Actualizar la paginación
    updatePagination(1, Math.ceil(data.length / 10));
}

// Cargar tabla de ranking
function loadRankingTable(game, gameData) {
    console.log(`Cargando tabla de ranking para el juego: ${game}`);
        
        // Mostrar indicador de carga
    const tableBody = document.querySelector('#ranking-table-body');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="5">
                    <div class="loading-spinner"></div> Cargando ranking...
                </td>
            </tr>
        `;
    }
    
    // Obtener filtro actual
    const activeFilter = document.querySelector('.filter-btn.active');
    const filterType = activeFilter ? activeFilter.getAttribute('data-filter') : 'global';
    
    // Realizar fetch para obtener datos de ranking
    fetch(`${apiBaseUrl}/games/${game}/ranking?filter=${filterType}&page=1`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar el ranking');
            }
            return response.json();
        })
        .then(data => {
            // Renderizar la tabla con los datos reales
            renderRankingTable(data.players, gameData);
            
            // Actualizar título de la sección según el juego
            const rankingTitle = document.querySelector('.ranking-table-section .section-title');
            if (rankingTitle) {
                rankingTitle.textContent = `Clasificación Global - ${gameData.title}`;
            }
            
            // Añadir efecto de fila destacada con desplazamiento suave
            setTimeout(function() {
                const highlightRow = document.querySelector('.highlight-row');
                if (highlightRow) {
                    highlightRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Añadir un efecto de destello a la fila del usuario
                    highlightRow.classList.add('flash-highlight');
        setTimeout(() => {
                        highlightRow.classList.remove('flash-highlight');
                    }, 1500);
                }
            }, 500);
            
            // Actualizar la paginación
            updatePagination(data.currentPage, data.totalPages);
        })
        .catch(error => {
            console.error('Error:', error);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            No se pudo cargar el ranking. Intente nuevamente más tarde.
                        </td>
                    </tr>
                `;
            }
        });
}

// Cargar los 3 mejores jugadores
function loadTopPlayers(game) {
    console.log(`Cargando top players para el juego: ${game}`);
    
    // Colores para los avatares de los top jugadores
    const topColors = [
        'linear-gradient(135deg, #ffd700, #ffaa33)', // Oro para #1
        'linear-gradient(135deg, #c0c0c0, #e5e5e5)', // Plata para #2
        'linear-gradient(135deg, #cd7f32, #dda15e)'  // Bronce para #3
    ];
    
    // Realizar fetch para obtener top players
    fetch(`${apiBaseUrl}/games/${game}/top-players`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los mejores jugadores');
            }
            return response.json();
        })
        .then(players => {
            // Actualizar el grid de top players con animación
            players.forEach((player, index) => {
                // Seleccionar elementos
                const nameElement = document.getElementById(`top-player-${player.rank}-name`);
                const scoreElement = document.getElementById(`top-player-${player.rank}-score`);
                const playerCard = document.querySelector(`.top-player-card.rank-${player.rank}`);
                
                // Añadir una clase para la animación de entrada
                if (playerCard) {
                    // Limpiar clases previas
                    playerCard.classList.remove('animate-in');
                    
                    // Reflow para reiniciar la animación
                    void playerCard.offsetWidth;
                    
                    // Añadir animación con delay según la posición
                    playerCard.style.animationDelay = `${index * 0.2}s`;
                    playerCard.classList.add('animate-in');
                    
                    // Actualizar avatar
                    const avatarElement = playerCard.querySelector('.player-avatar');
                    if (avatarElement) {
                        avatarElement.textContent = player.avatar || player.name.charAt(0).toUpperCase();
                        avatarElement.style.background = topColors[index];
                    }
                }
                
                // Actualizar textos con animación de contador
                if (nameElement) {
                    nameElement.textContent = player.name;
                }
                
                if (scoreElement) {
                    // Animación de contador para el puntaje
                    animateCounter(scoreElement, 0, player.score, 1500);
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
            // Actualizar con mensajes de error o datos de respaldo
            for (let i = 1; i <= 3; i++) {
                const nameElement = document.getElementById(`top-player-${i}-name`);
                const scoreElement = document.getElementById(`top-player-${i}-score`);
                
                if (nameElement) nameElement.textContent = 'Sin datos';
                if (scoreElement) scoreElement.textContent = '-';
            }
        });
}

// Animación de contador para números
function animateCounter(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = end;
        }
    };
    window.requestAnimationFrame(step);
}

// Formatear tiempo de última actividad de forma más amigable
function formatTimeAgo(days) {
    if (days === 0) {
        return 'Hoy';
    } else if (days === 1) {
        return 'Ayer';
    } else if (days < 7) {
        return `hace ${days} días`;
    } else if (days < 14) {
        return 'hace 1 semana';
    } else if (days < 30) {
        return `hace ${Math.floor(days / 7)} semanas`;
    } else {
        return `hace ${Math.floor(days / 30)} meses`;
    }
}

// Actualizar información de paginación
function updatePagination(currentPage, totalPages) {
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const paginationInfo = document.getElementById('pagination-info');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        
        // Eliminar event listeners anteriores para evitar duplicación
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        
        newPrevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                // Cargar página anterior
                loadRankingPage(currentPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        
        // Eliminar event listeners anteriores para evitar duplicación
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        
        newNextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                // Cargar página siguiente
                loadRankingPage(currentPage + 1);
            }
        });
    }
    
    if (paginationInfo) {
        paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
}

// Cargar una página específica del ranking
function loadRankingPage(page) {
    // Mostrar indicador de carga
    const tableBody = document.querySelector('#ranking-table-body');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="5">
                    <div class="loading-spinner"></div> Cargando página ${page}...
                </td>
            </tr>
        `;
    }
    
    // Obtener filtro actual
    const activeFilter = document.querySelector('.filter-btn.active');
    const filterType = activeFilter ? activeFilter.getAttribute('data-filter') : 'global';
    
    // Realizar fetch para obtener datos de la página
    fetch(`${apiBaseUrl}/games/${currentGame}/ranking?filter=${filterType}&page=${page}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar la página');
            }
            return response.json();
        })
        .then(data => {
            // Obtener información del juego para las etiquetas
            fetch(`${apiBaseUrl}/games/${currentGame}/info`)
                .then(response => response.json())
                .then(gameData => {
                    // Renderizar resultados
                    renderRankingTable(data.players, gameData);
                    
                    // Actualizar paginación
                    updatePagination(data.currentPage, data.totalPages);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Mostrar mensaje de error en la tabla
            if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                        <td colspan="5" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            No se pudo cargar la página ${page}. Intente nuevamente más tarde.
                    </td>
                </tr>
            `;
            }
        });
}

// Cargar datos de estadísticas
function loadStatisticsData(game) {
    console.log(`Cargando datos de estadísticas para el juego: ${game}`);
    
    // Mostrar indicador de carga para estadísticas
    const statsLoading = document.getElementById('stats-loading');
    if (statsLoading) {
        statsLoading.style.display = 'flex';
    }
    
    const statsContent = document.querySelector('#stats-content .stats-content');
    if (statsContent) {
        statsContent.style.opacity = '0.3';
    }
    
    const detailedStatsSection = document.querySelector('#stats-content .detailed-stats-section');
    if (!detailedStatsSection) return;
    
    // Realizar fetch para obtener estadísticas detalladas
    fetch(`${apiBaseUrl}/user/stats/${game}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar estadísticas');
            }
            return response.json();
        })
        .then(statsData => {
            // Ocultar indicador de carga
            if (statsLoading) {
                statsLoading.style.display = 'none';
            }
            if (statsContent) {
                statsContent.style.opacity = '1';
            }
            
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
            console.error('Error:', error);
            
            // Ocultar indicador de carga
            if (statsLoading) {
                statsLoading.style.display = 'none';
            }
            if (statsContent) {
                statsContent.style.opacity = '1';
            }
            
            detailedStatsSection.innerHTML = `
                        <div class="placeholder-message">
                    <i class="fas fa-chart-line"></i>
                    <p>No se pudieron cargar las estadísticas. Intente nuevamente más tarde.</p>
                </div>
            `;
        });
}

// Generar estadísticas de visualización para el juego PASALA CHE con datos reales
function generateRoscoStatsFromData(data) {
    return `
        <h2 class="section-title">Estadísticas de PASALA CHE</h2>
        
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
        <h2 class="section-title">Estadísticas de ¿QUIÉN SABE MÁS?</h2>
        
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

// Cargar datos de logros
function loadAchievementsData(game) {
    const achievementsContainer = document.querySelector('#achievements-content .achievements-content');
    
    if (!achievementsContainer) return;
    
    showLoading('achievements');
    
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
            console.error('Error al cargar logros:', error);
        }
        
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
        
        // Ocultar loader
        hideLoading('achievements');
        
        // Si no hay logros, mostrar mensaje
        if (achievements.length === 0) {
            achievementsContainer.innerHTML = `
                <div class="placeholder-message">
                    <i class="fas fa-medal"></i>
                    <p>Completa partidas para desbloquear logros</p>
                </div>
            `;
            return;
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
                <h2 class="section-title">Mis Logros</h2>
                <p class="achievements-summary">Has desbloqueado <span class="highlight">${achievements.filter(a => a.unlocked).length}</span> de ${achievementDefinitions.length} logros disponibles</p>
            </div>
        `;
        
        // Agregar secciones por categoría
        for (const [catKey, category] of Object.entries(categories)) {
            if (category.achievements.length > 0) {
                achievementsHTML += `
                    <div class="achievement-category">
                        <h3 class="category-title">${category.name}</h3>
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
        
        // Mostrar logros
        achievementsContainer.innerHTML = achievementsHTML;
        
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
                
                .category-title {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    color: white;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 0.5rem;
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
            `;
            document.head.appendChild(styleEl);
        }
    }, 1000);
}

// Inicializar filtros de ranking
function initRankingFilters() {
    console.log('Inicializando filtros de ranking');
        const filterButtons = document.querySelectorAll('.filter-btn');
        
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Obtener tipo de filtro seleccionado
                const filterType = this.getAttribute('data-filter');
                console.log(`Filtro seleccionado: ${filterType}`);
                
                // Recargar tabla con el filtro seleccionado
                loadRankingTable(currentGame);
            });
        });
    } else {
        console.warn('No se encontraron botones de filtro');
    }
    
    // Inicializar búsqueda
    const searchForm = document.querySelector('.filter-search');
    if (searchForm) {
        const searchBtn = document.querySelector('#ranking-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', handleSearch);
        }
        
        const searchInput = document.querySelector('#ranking-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSearch(e);
                }
            });
        }
    } else {
        console.warn('No se encontró el formulario de búsqueda');
    }
}

// Manejar la búsqueda
function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.querySelector('#ranking-search');
    if (searchInput) {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            console.log(`Búsqueda: ${searchTerm}`);
            
            // Realizar búsqueda con API
            fetch(`${apiBaseUrl}/games/${currentGame}/ranking/search?term=${encodeURIComponent(searchTerm)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la búsqueda');
                    }
                    return response.json();
                })
                .then(data => {
                    // Obtener información del juego para las etiquetas
                    fetch(`${apiBaseUrl}/games/${currentGame}/info`)
                        .then(response => response.json())
                        .then(gameData => {
                            // Renderizar resultados
                            renderRankingTable(data.players, gameData);
                            
                            // Actualizar título para mostrar que es un resultado de búsqueda
                            const rankingTitle = document.querySelector('.ranking-table-section .section-title');
                            if (rankingTitle) {
                                rankingTitle.textContent = `Resultados de "${searchTerm}" - ${gameData.title}`;
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        });
                })
                .catch(error => {
                    console.error('Error:', error);
                    
                    // Mostrar mensaje de error en la tabla
                    const tableBody = document.querySelector('#ranking-table-body');
                    if (tableBody) {
                        tableBody.innerHTML = `
                            <tr>
                                <td colspan="5" class="error-message">
                                    <i class="fas fa-search"></i>
                                    No se encontraron resultados para "${searchTerm}"
                                </td>
                            </tr>
                        `;
                    }
                });
        }
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
    
    const currentLevelElement = document.querySelector('.current-level');
    if (currentLevelElement) {
        currentLevelElement.textContent = `Nivel ${currentLevel}`;
    } else {
        console.warn('No se encontró el elemento .current-level');
    }
    
    const xpProgressElement = document.querySelector('.xp-progress');
    if (xpProgressElement) {
        xpProgressElement.textContent = `${currentXP.toLocaleString()} / ${totalXPForNextLevel.toLocaleString()} XP`;
    } else {
        console.warn('No se encontró el elemento .xp-progress');
    }
    
    const progressFillElement = document.querySelector('.level-progress-fill');
    if (progressFillElement) {
        progressFillElement.style.width = `${progressPercentage}%`;
    } else {
        console.warn('No se encontró el elemento .level-progress-fill');
    }
    
    // Actualizar rango y mejor puntuación
    const rankValueElement = document.querySelector('.rank-value');
    if (rankValueElement) {
        rankValueElement.textContent = `#${userData.rank}`;
    } else {
        console.warn('No se encontró el elemento .rank-value');
    }
    
    const scoreValueElement = document.querySelector('.score-value');
    if (scoreValueElement) {
        scoreValueElement.textContent = userData.highScore;
    } else {
        console.warn('No se encontró el elemento .score-value');
    }
} 