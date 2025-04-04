/**
 * CRACK TOTAL - Ranking Global
 * Gestiona la carga de datos y navegación en el ranking de jugadores
 */

// Variables globales
let currentGame = 'pasala-che';
let apiBaseUrl = '/api'; // Base URL for API endpoints

// Evento para cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente cargado - Ranking');
    // Inicializar la UI
    initUI();
    // Cargar datos del ranking para el juego seleccionado
    loadRankingData(currentGame);
});

// Inicializar la interfaz de usuario
function initUI() {
    console.log('Inicializando UI - Ranking');
    // Configurar el selector de juegos
    setupGameSelection();
    // Inicializar filtros de ranking
    initRankingFilters();
    
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
                // Cargar datos de ranking para el juego seleccionado
                loadRankingData(game);
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
    const loadingElement = document.getElementById('ranking-loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
    
    // Ocultar el contenido principal
    const contentElement = document.querySelector('.ranking-content');
    if (contentElement) {
        contentElement.style.opacity = '0.3';
    }
}

// Ocultar indicadores de carga
function hideLoading() {
    const loadingElement = document.getElementById('ranking-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    // Mostrar el contenido principal
    const contentElement = document.querySelector('.ranking-content');
    if (contentElement) {
        contentElement.style.opacity = '1';
    }
}

// Mostrar mensajes de error
function showError(message) {
    console.error(message);
    
    // Ocultar indicadores de carga
    hideLoading();
    
    // Mostrar un mensaje de error en la sección principal
    const contentElement = document.querySelector('.ranking-content');
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
                loadRankingData(currentGame);
            });
        }
    }
}

// Cargar datos de ranking para un juego específico
function loadRankingData(game) {
    console.log(`Cargando datos de ranking para el juego: ${game}`);
    
    // Mostrar indicador de carga
    showLoading();
    
    // Obtener filtro actual
    const activeFilter = document.querySelector('.filter-btn.active');
    const filterType = activeFilter ? activeFilter.getAttribute('data-filter') : 'global';
    
    if (filterType === 'global') {
        // Para el filtro global, solo cargamos datos del ranking global
        // y usamos datos predeterminados para la información del juego
        const defaultGameData = getDefaultGameData(game);
        
        // Actualizar título y descripción específica del juego
        updateRankingHeader(defaultGameData);
        
        // Actualizar estadísticas globales por defecto
        updateStatValue('total-players', '-', defaultGameData.globalLabels.players);
        updateStatValue('total-games', '-', defaultGameData.globalLabels.games);
        updateStatValue('avg-score', '-', defaultGameData.globalLabels.avgScore);
        updateStatValue('max-score', '-', defaultGameData.globalLabels.maxScore);
        
        // Cargar tabla de ranking global (sin intentar cargar info de juego)
        loadRankingTable(game, defaultGameData);
        
        // Ocultar todos los indicadores de carga una vez que los datos están listos
        hideLoading();
        return;
    }
    
    // Para otros filtros, cargar datos específicos del juego como antes
    fetch(`${apiBaseUrl}/games/${game}/info`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los datos del juego');
            }
            return response.json();
        })
        .then(gameData => {
            // Actualizar título y descripción específica del juego
            updateRankingHeader(gameData);
            
            // Cargar datos globales para el ranking
            loadGlobalRankingStats(game, gameData);
            
            // Cargar top 3 jugadores
            loadTopPlayers(game);
            
            // Cargar tabla de ranking
            loadRankingTable(game, gameData);
            
            // Actualizar etiquetas específicas del juego en la tabla de ranking
            updateRankingTableLabels(gameData.rankingLabels);
            
            // Ocultar todos los indicadores de carga una vez que los datos están listos
            hideLoading();
        })
        .catch(error => {
            console.error('Error:', error);
            showError('No se pudieron cargar los datos del ranking');
            
            // Usar configuración por defecto en caso de error
            const defaultGameData = getDefaultGameData(game);
            updateRankingHeader(defaultGameData);
            updateRankingTableLabels(defaultGameData.rankingLabels);
            
            // Intentar cargar solo la tabla de ranking
            loadRankingTable(game, defaultGameData);
            
            // Ocultar indicadores de carga
            hideLoading();
        });
}

// Actualizar encabezado del ranking con información específica del juego
function updateRankingHeader(gameData) {
    // Actualizar título del juego
    document.title = `Ranking ${gameData.title} - CRACK TOTAL`;
    
    // Actualizar nombre del juego en el selector
    const gameTitle = document.querySelector('.game-selector .game-option.active .game-name');
    if (gameTitle) {
        gameTitle.textContent = gameData.title;
    }
    
    // Actualizar la descripción en la cabecera si existe
    const rankingTitle = document.querySelector('.app-header .subtitle');
    if (rankingTitle) {
        rankingTitle.textContent = `Ranking de ${gameData.title}`;
    }
}

// Obtener configuración por defecto para un juego en caso de error de API
function getDefaultGameData(game) {
    // Configuración básica por defecto
    if (game === 'pasala-che') {
        return {
            title: 'PASALA CHE',
            description: 'El juego de palabras del fútbol',
            icon: 'fa-circle-notch',
            rankingLabels: {
                score: 'Aciertos',
                games: 'Roscos',
                timeLabel: 'Último Rosco'
            },
            globalLabels: {
                players: 'Jugadores',
                games: 'Roscos',
                avgScore: 'Promedio',
                maxScore: 'Récord'
            }
        };
    } else {
        return {
            title: '¿QUIÉN SABE MÁS?',
            description: 'El juego de preguntas del fútbol',
            icon: 'fa-question-circle',
            rankingLabels: {
                score: 'Puntos',
                games: 'Partidas',
                timeLabel: 'Última Partida'
            },
            globalLabels: {
                players: 'Jugadores',
                games: 'Partidas',
                avgScore: 'Promedio',
                maxScore: 'Récord'
            }
        };
    }
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
    
    let rankingUrl = '';
    if (filterType === 'global') {
        // Usar el nuevo endpoint para el ranking global
        rankingUrl = `${apiBaseUrl}/global-ranking`;
    } else {
        // Usar endpoints existentes para filtros específicos
        rankingUrl = `${apiBaseUrl}/games/${game}/ranking?filter=${filterType}&page=1`;
    }
    
    console.log('Cargando datos de: ' + rankingUrl); // Log adicional para debug
    
    // Realizar fetch para obtener datos de ranking
    fetch(rankingUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar el ranking: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data); // Log para depurar
            
            // Si es el ranking global, los datos pueden estar directamente en data.players
            const players = data.players || [];
            
            // Renderizar la tabla con los datos
            renderRankingTable(players, gameData, filterType === 'global');
            
            // Actualizar título de la sección según el filtro y juego
            const rankingTitle = document.querySelector('.ranking-table-section .section-title');
            if (rankingTitle) {
                rankingTitle.textContent = `Clasificación ${filterType.charAt(0).toUpperCase() + filterType.slice(1)} - ${filterType === 'global' ? 'Todos los Juegos' : gameData.title}`;
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
            const currentPage = filterType === 'global' ? 1 : (data.currentPage || 1);
            const totalPages = filterType === 'global' ? 1 : (data.totalPages || Math.ceil(players.length / 10));
            // Si es global, ocultar paginación
            updatePagination(currentPage, totalPages, filterType === 'global');
        })
        .catch(error => {
            console.error('Error cargando/procesando ranking:', error);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            No se pudo cargar el ranking. <br>
                            <button class="retry-button">Intentar nuevamente</button>
                        </td>
                    </tr>
                `;
                
                // Agregar funcionalidad al botón de reintentar
                const retryButton = tableBody.querySelector('.retry-button');
                if (retryButton) {
                    retryButton.addEventListener('click', function() {
                        loadRankingTable(game, gameData);
                    });
                }
            }
        });
}

// Renderizar tabla de ranking
function renderRankingTable(data, gameData, isGlobalRanking = false) {
    console.log(`Renderizando tabla de ranking ${isGlobalRanking ? '(Global)' : ''}`);
    const tableBody = document.querySelector('#ranking-table-body');
    if (!tableBody) {
        console.warn('No se encontró el tbody de la tabla de ranking');
        return;
    }
    
    // Limpiar contenido existente
    tableBody.innerHTML = '';
    
    // Verificar si hay datos
    if (!data || data.length === 0) {
        console.log('No hay datos de ranking para mostrar.');
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data-message">
                    <i class="fas fa-info-circle"></i>
                    No hay datos de ranking para mostrar.
                </td>
            </tr>
        `;
        // Deshabilitar paginación si no hay datos
        updatePagination(1, 1, true);
        return;
    }
    
    // Habilitar paginación (se ajustará después)
    updatePagination(1, 1, false); 
    
    // Agregar filas
    data.forEach((player, index) => {
        const row = document.createElement('tr');
        // Detectar usuario actual (necesitaríamos una forma consistente)
        // Por ahora, asumimos que el ID o nombre se puede comparar
        const currentUsername = localStorage.getItem('username') || 'Invitado';
        if (player.name === currentUsername) {
            row.classList.add('highlight-row');
        }
        
        // Añadir efecto de aparición retardada
        row.style.animationDelay = `${index * 0.05}s`;
        row.classList.add('fade-in-row');
        
        // Generar indicador de cambio de ranking (solo para rankings no globales)
        let rankChangeHtml = '';
        if (!isGlobalRanking && player.rankChange !== undefined) {
            if (player.rankChange > 0) {
                rankChangeHtml = `<span class="rank-change-up">+${player.rankChange}</span>`;
            } else if (player.rankChange < 0) {
                rankChangeHtml = `<span class="rank-change-down">${player.rankChange}</span>`;
            }
        }
        
        // Formatear tiempo de última actividad (usar `player.date` para global)
        let timeAgo = '';
        try {
            timeAgo = isGlobalRanking ? 
                new Date(player.date).toLocaleDateString('es-ES') : 
                formatTimeAgo(player.lastActive || 0);
        } catch(e) {
             console.error("Error formatting date:", player.date, e);
             timeAgo = 'Fecha inválida';
        }
        
        // Determinar el avatar (usar inicial si no hay color/avatar)
        const avatar = player.avatar || (player.name ? player.name.charAt(0).toUpperCase() : '?');
        const avatarColor = player.avatarColor || '#4a5568'; // Gris por defecto
        
        // Mapear gameType a nombre legible
        let gameName = player.gameType || '';
        if (isGlobalRanking) {
            if (gameName === 'pasala-che') gameName = 'Pasala';
            else if (gameName === 'quien-sabe-theme') gameName = 'Quién Sabe';
        }
        
        // Contenido HTML de la fila
        row.innerHTML = `
            <td class="rank-col">
                <span class="rank-indicator">#${isGlobalRanking ? index + 1 : player.rank}</span>
                ${rankChangeHtml}
            </td>
            <td>
                <div class="player-info">
                    <div class="player-avatar-small" style="background: ${avatarColor};">${avatar}</div>
                    <span class="player-name-col">${player.name || 'Anónimo'}</span>
                    ${player.name === currentUsername ? '<span class="you-badge">Tú</span>' : ''}
                </div>
            </td>
            <td class="score-col">${player.score}</td>
            <td>${isGlobalRanking ? gameName : (player.gamesPlayed || '-')}</td>
            <td>${timeAgo}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Actualizar la paginación después de renderizar
    // La lógica de currentPage y totalPages se movió a loadRankingTable
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
function updatePagination(currentPage, totalPages, disableAll = false) {
    const paginationContainer = document.getElementById('ranking-pagination');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const paginationInfo = document.getElementById('pagination-info');
    
    if (!paginationContainer || !prevBtn || !nextBtn || !paginationInfo) {
        console.warn('Elementos de paginación no encontrados.');
        return;
    }
    
    if (disableAll || totalPages <= 1) {
         paginationContainer.style.display = 'none'; // Ocultar si no hay páginas o está deshabilitado
         return;
    }
    
    paginationContainer.style.display = 'flex'; // Asegurarse que sea visible
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;

    // Eliminar event listeners anteriores para evitar duplicación y definir los nuevos
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    newPrevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadRankingPage(currentPage - 1);
        }
    });

    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    newNextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadRankingPage(currentPage + 1);
        }
    });
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