/**
 * CRACK TOTAL - Dashboard Unificado
 * Gestiona la carga de datos y navegación en el dashboard unificado de perfil y ranking
 */

// Inicializar identificador de usuario para persistencia
(function() {
    // Verificar si ya tenemos un userIP guardado
    if (!localStorage.getItem('userIP')) {
        // Generar un identificador único
        const userIP = 'user_' + Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
        
        // Guardar en localStorage
        localStorage.setItem('userIP', userIP);
        console.log('Identificador de usuario generado:', userIP);
    } else {
        console.log('Usando identificador de usuario existente:', localStorage.getItem('userIP'));
    }
})();

// Obtener el juego actual (o usar un valor por defecto)
window.currentGame = 'pasala-che';

// Verificar si tenemos apiClient disponible
let useApiClient = window.apiClient !== undefined;
console.log(`API Client ${useApiClient ? 'disponible' : 'no disponible'} - usando ${useApiClient ? 'backend' : 'localStorage'}`);

// Variables globales
let currentGame = 'pasala-che';
let currentTab = 'profile';
// Reemplazamos la variable apiBaseUrl ya que ahora usamos el cliente API
// let apiBaseUrl = '/api'; // Base URL for API endpoints
    
// Evento para cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente cargado');
    // Inicializar el dashboard completo
    loadUserDataAndGame(window.currentGame);
    
    // Configurar manejadores para pestañas
    setupTabs();
    
    // Configurar listener para el buscador
    setupSearch();
    
    // Configurar actualizador automático si existe
    if (window.gameCompletion && typeof window.gameCompletion.setupDashboardUpdater === 'function') {
        console.log('🔄 Configurando actualizador automático del dashboard');
        window.gameCompletion.setupDashboardUpdater();
    } else {
        console.warn('⚠️ Módulo de actualización automática no encontrado');
    }
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
    console.log('Configurando selector de juegos');
    // Obtener todos los elementos de opciones de juego
    const gameOptions = document.querySelectorAll('.game-option');
    
    // Agregar listener de click a cada opción
    gameOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Guardar el juego seleccionado anteriormente para comparar
            const previousGame = currentGame;
            
            // Actualizar el juego actual
            currentGame = this.dataset.game;
            
            // Si el juego seleccionado es diferente, cargar los datos
            if (previousGame !== currentGame) {
                console.log('Juego seleccionado:', currentGame);
                
                // Remover la clase 'active' de todas las opciones
                gameOptions.forEach(opt => opt.classList.remove('active'));
                
                // Agregar la clase 'active' a la opción seleccionada
                this.classList.add('active');
                
                // Cargar datos del juego
                loadUserDataAndGame(currentGame);
            }
        });
    });
}

// Configurar las pestañas de navegación
function setupTabs() {
    console.log('Configurando pestañas de navegación');
    
    // Obtener todos los elementos de pestañas y contenidos
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Agregar listener de click a cada pestaña
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Guardar la pestaña seleccionada anteriormente para comparar
            const previousTab = currentTab;
            
            // Actualizar la pestaña actual
            currentTab = this.dataset.tab;
            
            // Si la pestaña seleccionada es diferente, actualizar la UI
            if (previousTab !== currentTab) {
                console.log('Pestaña seleccionada:', currentTab);
                
                // Remover la clase 'active' de todas las pestañas
                tabs.forEach(t => t.classList.remove('active'));
                
                // Ocultar todos los contenidos de pestañas
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Agregar la clase 'active' a la pestaña seleccionada
                this.classList.add('active');
                
                // Mostrar el contenido de la pestaña seleccionada
                const activeContent = document.getElementById(`${currentTab}-content`);
                if (activeContent) {
                    activeContent.classList.add('active');
                    
                    // Si la pestaña es ranking y no hay datos cargados, cargarlos
                    if (currentTab === 'ranking' && activeContent.querySelector('.ranking-table tbody').children.length === 0) {
                        loadRanking(currentGame);
                    }
                }
            }
        });
    });
}

// Funciones para cargar datos del usuario y juego
async function loadUserDataAndGame(gameType) {
    console.log('Cargando datos del usuario y juego:', gameType);
    
    // Mostrar indicadores de carga en todas las secciones
    showLoading('profile');
    showLoading('ranking');
    showLoading('stats');
    showLoading('achievements');
    
    try {
        // Obtener el user IP del localStorage
        const userIP = localStorage.getItem('userIP');
        
        if (!userIP) {
            throw new Error('No se encontró identificador de usuario');
        }

        // Si no tenemos API client o falla la API, usar datos locales
        let userData = null;
        let gameInfo = null;

        try {
            if (window.apiClient && typeof window.apiClient.getOrCreateUser === 'function') {
                // Cargar datos del usuario usando el cliente API
                userData = await window.apiClient.getOrCreateUser(userIP, localStorage.getItem('username') || 'Jugador');
            }
        } catch (error) {
            console.warn('Error al usar API client para obtener usuario:', error);
        }

        if (!userData) {
            // Usar datos locales como fallback
            userData = getLocalUserData(userIP);
        }

        try {
            if (window.apiClient && typeof window.apiClient.getGameInfo === 'function') {
                // Cargar datos del juego usando el cliente API
                gameInfo = await window.apiClient.getGameInfo(gameType);
            }
        } catch (error) {
            console.warn('Error al usar API client para obtener información del juego:', error);
        }

        // Si no hay datos del juego, usar datos por defecto
        if (!gameInfo) {
            gameInfo = getDefaultGameData(gameType);
        }
        
        // Actualizar la UI con los datos obtenidos
        updateProfileUI(userData, gameInfo);
        
        // Cargar estadísticas del usuario para el juego actual
        loadUserStats(userIP, gameType);
        
        // Cargar ranking para el juego actual si estamos en esa pestaña
        if (currentTab === 'ranking') {
            loadRanking(gameType);
        }
        
        // Cargar logros para el juego actual
        loadAchievements(userIP, gameType);
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        showError('Error al cargar datos. Por favor, intenta de nuevo más tarde.', 'profile');
    }
}

// Obtener datos de usuario desde localStorage
function getLocalUserData(userIP) {
    console.log('Obteniendo datos locales de usuario');
    const profileKey = `profile_${userIP}`;
    let userData = {
        username: localStorage.getItem('username') || 'Jugador',
        level: 1,
        xp: 0,
        totalXp: 100
    };

    try {
        const savedProfile = localStorage.getItem(profileKey);
        if (savedProfile) {
            const profileData = JSON.parse(savedProfile);
            if (profileData) {
                userData = { ...userData, ...profileData };
            }
        }
    } catch (error) {
        console.error('Error al cargar perfil local:', error);
    }

    return userData;
}

// Actualizar la UI del perfil con los datos del usuario y juego
function updateProfileUI(userData, gameInfo) {
    console.log('Actualizando UI del perfil');
    
    // Actualizar el nombre de usuario
    const usernameElement = document.getElementById('profile-username');
    if (usernameElement) {
        usernameElement.textContent = userData.username || 'Jugador';
        
        // Guardar el nombre de usuario en localStorage
        if (userData.username) {
            localStorage.setItem('username', userData.username);
        }
    }
    
    // Actualizar nivel y experiencia
    const levelBadge = document.getElementById('level-badge');
    const levelText = document.getElementById('profile-level-text');
    
    if (levelBadge && levelText) {
        levelBadge.textContent = userData.level || 1;
        levelText.textContent = `Nivel ${userData.level || 1}`;
    }

    // Actualizar estadísticas en el perfil
    updateProfileStats(userData, gameInfo);
    
    // Ocultar indicador de carga
    hideLoading('profile');
}

// Actualizar estadísticas en la sección del perfil
function updateProfileStats(userData, gameInfo) {
    // Actualizar nivel en la visualización de progreso de nivel
    const profileLevelDisplay = document.getElementById('profile-level-display');
    if (profileLevelDisplay) {
        profileLevelDisplay.textContent = `Nivel ${userData.level || 1}`;
    }
    
    // Actualizar progreso de XP
    const xpProgressText = document.getElementById('xp-progress-text');
    if (xpProgressText) {
        xpProgressText.textContent = `${userData.xp || 0} / ${userData.totalXp || 100} XP`;
    }
    
    // Actualizar barra de progreso de nivel
    const levelProgressFill = document.getElementById('level-progress-fill');
    if (levelProgressFill) {
        const progressPercent = userData.totalXp ? Math.floor((userData.xp / userData.totalXp) * 100) : 0;
        levelProgressFill.style.width = `${progressPercent}%`;
    }
    
    // Actualizar ranking actual
    const currentRankProfile = document.getElementById('current-rank-profile');
    if (currentRankProfile) {
        currentRankProfile.textContent = userData.rank || '-';
    }
    
    // Actualizar mejor puntaje
    const bestScoreProfile = document.getElementById('best-score-profile');
    if (bestScoreProfile) {
        bestScoreProfile.textContent = userData.bestScore || '-';
    }
    
    // Actualizar estadísticas clave
    updateStatValue('stat-games', userData.gamesPlayed || 0);
    updateStatValue('stat-winrate', `${userData.winRate || 0}%`);
    updateStatValue('stat-accuracy', `${userData.accuracy || 0}%`);
    
    // Formatear tiempo promedio
    let timeDisplay = '-';
    if (userData.averageTime) {
        if (userData.averageTime < 60) {
            timeDisplay = `${userData.averageTime} seg`;
        } else {
            const minutes = Math.floor(userData.averageTime / 60);
            const seconds = userData.averageTime % 60;
            timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    updateStatValue('stat-avgtime', timeDisplay);
}

// Actualizar valor de una estadística
function updateStatValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Cargar estadísticas del usuario para un juego específico
async function loadUserStats(userIP, gameType) {
    console.log('Cargando estadísticas del usuario:', gameType);
    showLoading('stats');
    
    try {
        let statsData = null;
        
        // Intentar obtener datos de la API
        if (window.apiClient && typeof window.apiClient.getUserProfile === 'function') {
            try {
                statsData = await window.apiClient.getUserProfile(userIP, gameType);
            } catch (error) {
                console.warn('Error al obtener estadísticas desde API:', error);
            }
        }
        
        // Si no hay datos de la API, usar datos locales
        if (!statsData) {
            statsData = getLocalUserStats(userIP, gameType);
        }
        
        if (!statsData) {
            throw new Error('No se pudieron obtener estadísticas del usuario');
        }
        
        // Actualizar la UI con las estadísticas
        updateStatsUI(statsData);
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        showError('Error al cargar estadísticas.', 'stats');
    }
}

// Obtener estadísticas locales
function getLocalUserStats(userIP, gameType) {
    console.log('Obteniendo estadísticas locales');
    const statsKey = `userStats_${userIP}_${gameType}`;
    
    try {
        const savedStats = localStorage.getItem(statsKey);
        if (savedStats) {
            return JSON.parse(savedStats);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas locales:', error);
    }
    
    // Estadísticas por defecto
    return {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        highScore: 0,
        totalCorrectAnswers: 0,
        totalAnswers: 0,
        winRate: 0,
        accuracy: 0
    };
}

// Actualizar la UI de estadísticas
function updateStatsUI(statsData) {
    console.log('Actualizando UI de estadísticas');
    
    // Obtener el contenedor de estadísticas
    const statsContainer = document.querySelector('.stats-content');
    if (!statsContainer) {
        console.error('No se encontró el contenedor de estadísticas');
        return;
    }
    
    // Construir el HTML para las estadísticas
    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Resumen de Juego</h3>
                <div class="stat-content">
                    <div class="stat-item">
                        <span class="stat-label">Partidas Jugadas</span>
                        <span class="stat-value">${statsData.gamesPlayed || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Victorias</span>
                        <span class="stat-value">${statsData.gamesWon || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Ratio de Victoria</span>
                        <span class="stat-value">${statsData.winRate || 0}%</span>
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>Precisión</h3>
                <div class="stat-content">
                    <div class="accuracy-chart">
                        <div class="accuracy-percentage">${statsData.accuracy || 0}%</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Precisión General</span>
                        <span class="stat-value">${statsData.accuracy || 0}%</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="section-divider"></div>
        
        <div class="stats-grid">
            <div class="stat-card full-width">
                <h3>Rendimiento por Partida</h3>
                <div class="stat-content">
                    ${statsData.gamesPlayed > 0 
                        ? '<div id="performance-chart-container" style="width:100%; height:200px;"></div>'
                        : `<div class="no-data-message">
                               <i class="fas fa-chart-line"></i>
                               <p>Juega algunas partidas para ver estadísticas detalladas</p>
                           </div>`
                    }
                </div>
            </div>
        </div>
    `;
    
    // Inicializar gráficos si hay partidas jugadas y Chart.js está disponible
    if (statsData.gamesPlayed > 0) {
        // Intentar cargar historial de juegos para el gráfico
        loadGameHistory(statsData);
    }
    
    // Ocultar indicador de carga
    hideLoading('stats');
}

// Cargar historial de juegos para gráficos
function loadGameHistory(statsData) {
    const userIP = localStorage.getItem('userIP');
    if (!userIP) return;
    
    const userGamesKey = `userGames_${userIP}`;
    try {
        const savedGames = localStorage.getItem(userGamesKey);
        if (savedGames) {
            const games = JSON.parse(savedGames);
            if (Array.isArray(games) && games.length > 0) {
                // Intentar inicializar gráfico si Chart.js está disponible
                if (typeof loadChartLibrary === 'function') {
                    loadChartLibrary().then(() => {
                        if (typeof Chart !== 'undefined') {
                            initializePerformanceChart(games);
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar historial de juegos:', error);
    }
}

// Inicializar gráfico de rendimiento
function initializePerformanceChart(games) {
    const container = document.getElementById('performance-chart-container');
    if (!container) return;
    
    // Limitar a las últimas 10 partidas
    const recentGames = games.slice(0, 10).reverse();
    
    // Crear canvas para el gráfico
    const canvas = document.createElement('canvas');
    canvas.id = 'performance-chart';
    container.appendChild(canvas);
    
    // Inicializar gráfico
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: recentGames.map((g, i) => `Partida ${i+1}`),
            datasets: [{
                label: 'Puntuación',
                data: recentGames.map(g => g.score || 0),
                borderColor: 'rgba(225, 29, 72, 1)',
                backgroundColor: 'rgba(225, 29, 72, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Cargar el ranking global para un juego específico
async function loadRanking(gameType) {
    console.log('Cargando ranking global:', gameType);
    showLoading('ranking');
    
    try {
        let rankingData = null;
        
        // Intentar obtener datos de la API
        if (window.apiClient && typeof window.apiClient.getGlobalRanking === 'function') {
            try {
                rankingData = await window.apiClient.getGlobalRanking(gameType);
            } catch (error) {
                console.warn('Error al obtener ranking desde API:', error);
            }
        }
        
        // Si no hay datos de la API, generar datos de ejemplo
        if (!rankingData) {
            rankingData = generateSampleRanking();
        }
        
        if (!rankingData) {
            throw new Error('No se pudieron obtener datos del ranking');
        }
        
        // Actualizar la UI con el ranking
        updateRankingUI(rankingData);
        
    } catch (error) {
        console.error('Error al cargar ranking:', error);
        showError('Error al cargar ranking.', 'ranking');
    }
}

// Generar datos de ranking de ejemplo
function generateSampleRanking() {
    const players = [];
    const currentUser = localStorage.getItem('username') || 'Jugador';
    
    // Generar 15 jugadores de ejemplo
    for (let i = 1; i <= 15; i++) {
        const player = {
            rank: i,
            name: i === 3 ? currentUser : `Jugador ${i}`,
            score: Math.floor(Math.random() * 1000) + 500 - (i * 30),
            gamesPlayed: Math.floor(Math.random() * 50) + 10,
            lastActive: Math.floor(Math.random() * 10),
            isCurrentUser: i === 3,
            avatarColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 45%)`,
            avatar: (i === 3 ? currentUser.charAt(0) : `J${i}`).toUpperCase()
        };
        players.push(player);
    }
    
    return {
        players: players,
        currentPage: 1,
        totalPages: 5,
        totalPlayers: 75,
        totalGames: 348,
        avgScore: 420,
        maxScore: 1250
    };
}

// Actualizar la UI del ranking
function updateRankingUI(rankingData) {
    console.log('Actualizando UI del ranking');
    
    // Actualizar estadísticas globales
    updateGlobalRankingStats(rankingData);
    
    // Actualizar top jugadores
    updateTopPlayers(rankingData.players.slice(0, 3));
    
    // Actualizar tabla de ranking
    updateRankingTable(rankingData.players);
    
    // Actualizar paginación
    updatePagination(rankingData.currentPage, rankingData.totalPages);
    
    // Ocultar indicador de carga
    hideLoading('ranking');
}

// Actualizar estadísticas globales del ranking
function updateGlobalRankingStats(rankingData) {
    document.getElementById('total-players-stat').textContent = rankingData.totalPlayers || 0;
    document.getElementById('total-games-stat').textContent = rankingData.totalGames || 0;
    document.getElementById('avg-score-stat').textContent = rankingData.avgScore || 0;
    document.getElementById('max-score-stat').textContent = rankingData.maxScore || 0;
}

// Actualizar top jugadores
function updateTopPlayers(topPlayers) {
    if (!topPlayers || topPlayers.length === 0) return;
    
    // Asegurarnos de que tenemos 3 jugadores
    while (topPlayers.length < 3) {
        topPlayers.push({
            name: '-',
            score: 0,
            avatar: '?'
        });
    }
    
    // Actualizar nombres y puntajes
    for (let i = 1; i <= 3; i++) {
        const player = topPlayers[i-1];
        
        const nameElement = document.getElementById(`top-player-${i}-name`);
        const scoreElement = document.getElementById(`top-player-${i}-score`);
        
        if (nameElement) nameElement.textContent = player.name;
        if (scoreElement) scoreElement.textContent = `${player.score} pts`;
    }
}

// Actualizar tabla de ranking
function updateRankingTable(players) {
    if (!players || players.length === 0) {
        showError('No hay datos de ranking disponibles.', 'ranking-table-body');
        return;
    }
    
    const tableBody = document.getElementById('ranking-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    players.forEach((player, index) => {
        const row = document.createElement('tr');
        if (player.isCurrentUser) {
            row.classList.add('highlight-row');
        }
        
        // Añadir efecto de aparición retardada
        row.style.animationDelay = `${index * 0.05}s`;
        row.classList.add('fade-in-row');
        
        // Determinar texto de última actividad
        let timeAgo = '';
        if (player.lastActive === 0) {
            timeAgo = 'Hoy';
        } else if (player.lastActive === 1) {
            timeAgo = 'Ayer';
        } else if (player.lastActive < 7) {
            timeAgo = `hace ${player.lastActive} días`;
        } else {
            timeAgo = `hace ${Math.floor(player.lastActive / 7)} semanas`;
        }
        
        row.innerHTML = `
            <td class="rank-col">
                <span class="rank-indicator">#${player.rank}</span>
            </td>
            <td>
                <div class="player-info">
                    <div class="player-avatar-small" style="background: ${player.avatarColor || '#e11d48'};">${player.avatar || '?'}</div>
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
}

// Actualizar paginación
function updatePagination(currentPage, totalPages) {
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const paginationInfo = document.getElementById('pagination-info');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        
        // Eliminar event listeners anteriores
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        
        newPrevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                loadRankingPage(currentPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        
        // Eliminar event listeners anteriores
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        
        newNextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
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
    console.log('Cargando página', page, 'del ranking');
    
    // Mostrar indicador de carga
    const tableBody = document.getElementById('ranking-table-body');
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
    
    // Si tenemos API client, intentar cargar desde API
    if (window.apiClient && typeof window.apiClient.getGlobalRanking === 'function') {
        window.apiClient.getGlobalRanking(currentGame, filterType, page)
            .then(data => {
                if (data) {
                    updateRankingUI(data);
                } else {
                    throw new Error('No se pudieron obtener datos del ranking');
                }
            })
            .catch(error => {
                console.error('Error al cargar página del ranking:', error);
                // Fallback a datos simulados
                const sampleData = generateSampleRanking();
                sampleData.currentPage = page;
                updateRankingUI(sampleData);
            });
    } else {
        // Fallback a datos simulados
        const sampleData = generateSampleRanking();
        sampleData.currentPage = page;
        setTimeout(() => {
            updateRankingUI(sampleData);
        }, 1000);
    }
}

// Cargar logros del usuario para un juego específico
async function loadAchievements(userIP, gameType) {
    console.log('Cargando logros del usuario:', gameType);
    showLoading('achievements');
    
    try {
        let achievementsData = null;
        
        // Intentar obtener datos de la API
        if (window.apiClient && typeof window.apiClient.getUserAchievements === 'function') {
            try {
                achievementsData = await window.apiClient.getUserAchievements(userIP, gameType);
            } catch (error) {
                console.warn('Error al obtener logros desde API:', error);
            }
        }
        
        // Si no hay datos de la API, generar datos de ejemplo
        if (!achievementsData) {
            achievementsData = generateSampleAchievements();
        }
        
        if (!achievementsData) {
            throw new Error('No se pudieron obtener logros del usuario');
        }
        
        // Actualizar la UI con los logros
        updateAchievementsUI(achievementsData);
        
    } catch (error) {
        console.error('Error al cargar logros:', error);
        showError('Error al cargar logros.', 'achievements');
    }
}

// Generar datos de logros de ejemplo
function generateSampleAchievements() {
    return [
        {
            id: 'first-win',
            title: 'Primera Victoria',
            description: 'Gana tu primera partida',
            icon: 'trophy',
            status: 'unlocked',
            progress: 100,
            reward: '10 XP'
        },
        {
            id: 'streak-3',
            title: 'Racha de 3',
            description: 'Gana 3 partidas seguidas',
            icon: 'fire',
            status: 'in-progress',
            progress: 67,
            reward: '50 XP'
        },
        {
            id: 'perfectionist',
            title: 'Perfeccionista',
            description: 'Completa un juego sin errores',
            icon: 'check-double',
            status: 'locked',
            progress: 0,
            reward: '100 XP'
        },
        {
            id: 'explorer',
            title: 'Explorador',
            description: 'Juega 10 partidas completas',
            icon: 'compass',
            status: 'in-progress',
            progress: 40,
            reward: '30 XP'
        }
    ];
}

// Actualizar la UI de logros
function updateAchievementsUI(achievementsData) {
    console.log('Actualizando UI de logros');
    
    // Obtener el contenedor de logros
    const achievementsContainer = document.querySelector('.achievements-content');
    if (!achievementsContainer) {
        console.error('No se encontró el contenedor de logros');
        return;
    }
    
    // Construir el HTML para los logros
    achievementsContainer.innerHTML = `
        <h2 class="section-title">Logros del juego</h2>
        <div class="achievements-grid">
            ${achievementsData.map(achievement => `
                <div class="achievement-card ${achievement.status}">
                    <div class="achievement-icon">
                        <i class="fas fa-${achievement.icon}"></i>
                    </div>
                    <div class="achievement-info">
                        <h3 class="achievement-title">${achievement.title}</h3>
                        <p class="achievement-description">${achievement.description}</p>
                        ${achievement.status === 'in-progress' ? 
                            `<div class="achievement-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                                </div>
                                <span class="progress-text">${achievement.progress}%</span>
                            </div>` : ''
                        }
                        <div class="achievement-reward">${achievement.reward}</div>
                    </div>
                    <div class="achievement-status-icon">
                        ${achievement.status === 'unlocked' ? 
                            '<i class="fas fa-check-circle"></i>' : 
                            (achievement.status === 'in-progress' ? 
                                '<i class="fas fa-spinner"></i>' : 
                                '<i class="fas fa-lock"></i>')
                        }
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Ocultar indicador de carga
    hideLoading('achievements');
}

// Funciones de carga/error
function showLoading(section) {
    // Mostrar indicador de carga general
    const loadingEl = document.getElementById(`${section ? section + '-' : ''}loading`);
    if (loadingEl) {
        loadingEl.style.display = 'flex';
    }
    
    // Reducir opacidad del contenido
    const contentEl = document.getElementById(`${section ? section + '-' : ''}content`);
    if (contentEl) {
        contentEl.style.opacity = '0.3';
    }
}

function hideLoading(section) {
    // Ocultar indicador de carga
    const loadingEl = document.getElementById(`${section ? section + '-' : ''}loading`);
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    // Restaurar opacidad del contenido
    const contentEl = document.getElementById(`${section ? section + '-' : ''}content`);
    if (contentEl) {
        contentEl.style.opacity = '1';
    }
}

function showError(message, section) {
    const contentEl = document.getElementById(`${section ? section + '-' : ''}content`);
    if (contentEl) {
        contentEl.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
    hideLoading(section);
}

// Obtener configuración por defecto para un juego en caso de error de API
function getDefaultGameData(game) {
    if (game === 'pasala-che') {
        return {
            id: 'pasala-che',
            title: 'Pasala Che',
            description: 'Juego de palabras con definiciones',
            iconClass: 'fa-spell-check',
            stats: [
                { label: 'Jugadas', value: 0 },
                { label: 'Ganadas', value: 0 },
                { label: 'Precisión', value: '0%' }
            ],
            statLabels: {
                gamesPlayed: 'Jugadas',
                gamesWon: 'Ganadas',
                avgAccuracy: 'Precisión'
            },
            rankingLabels: {
                positionLabel: 'Posición',
                playerLabel: 'Jugador',
                scoreLabel: 'Puntos',
                gamesLabel: 'Partidas',
                lastPlayedLabel: 'Última Partida'
            }
        };
    } else {
        return {
            id: 'quien-sabe-mas',
            title: 'Quién Sabe Más',
            description: 'Juego de preguntas y respuestas',
            iconClass: 'fa-question-circle',
            stats: [
                { label: 'Jugadas', value: 0 },
                { label: 'Máx. Puntos', value: 0 },
                { label: 'Precisión', value: '0%' }
            ],
            statLabels: {
                gamesPlayed: 'Jugadas',
                highestScore: 'Máx. Puntos',
                avgAccuracy: 'Precisión'
            },
            rankingLabels: {
                positionLabel: 'Posición', 
                playerLabel: 'Jugador',
                scoreLabel: 'Puntos',
                answersLabel: 'Respuestas',
                lastPlayedLabel: 'Última Partida'
            }
        };
    }
}

// Exportar funciones principales para que sean accesibles globalmente
window.loadUserDataAndGame = loadUserDataAndGame;
window.loadRanking = loadRanking;
window.loadUserStats = loadUserStats;
window.loadAchievements = loadAchievements;
window.getLocalRanking = generateSampleRanking;
window.getLocalUserStats = getLocalUserStats;
window.getLocalUserAchievements = generateSampleAchievements;
window.getLocalTopPlayers = function(gameType) {
    const ranking = generateSampleRanking();
    return ranking.players.slice(0, 3);
};
window.getLocalGlobalStats = function(gameType) {
    const ranking = generateSampleRanking();
    return {
        totalPlayers: ranking.totalPlayers,
        totalGames: ranking.totalGames,
        avgScore: ranking.avgScore,
        maxScore: ranking.maxScore
    };
};
window.searchLocalPlayers = function(gameType, query) {
    const ranking = generateSampleRanking();
    const filteredPlayers = ranking.players.filter(player => 
        player.name.toLowerCase().includes(query.toLowerCase())
    );
    return {
        players: filteredPlayers,
        count: filteredPlayers.length,
        term: query
    };
};
window.updateStats = updateStats || function(statsData) {
    console.log('Actualizando estadísticas con:', statsData);
    // Si no existe la función original, usar esta implementación básica
    if (!statsData) return;
    
    try {
        // Actualizar gráficos si están disponibles
        if (window.statsCharts && statsData) {
            updateStatsCharts(statsData);
        }
        
        // Actualizar contadores
        if (statsData.gamesPlayed !== undefined) {
            document.getElementById('gamesPlayed').textContent = statsData.gamesPlayed;
        }
        if (statsData.gamesWon !== undefined) {
            document.getElementById('gamesWon').textContent = statsData.gamesWon;
        }
        if (statsData.winRate !== undefined) {
            document.getElementById('winRate').textContent = `${statsData.winRate}%`;
        }
        if (statsData.highScore !== undefined) {
            document.getElementById('highScore').textContent = statsData.highScore;
        }
        if (statsData.accuracy !== undefined) {
            document.getElementById('accuracy').textContent = `${statsData.accuracy}%`;
        }
        if (statsData.averageTime !== undefined) {
            const minutes = Math.floor(statsData.averageTime / 60);
            const seconds = statsData.averageTime % 60;
            document.getElementById('averageTime').textContent = `${minutes}m ${seconds}s`;
        }
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
    }
};
window.updateProfile = updateProfile || function(userData, gameInfo) {
    console.log('Actualizando perfil con:', userData, gameInfo);
    // Si no existe la función original, usar esta implementación básica
    if (!userData) return;
    
    try {
        // Actualizar nombre de usuario
        if (userData.username) {
            const usernameElements = document.querySelectorAll('.username-display');
            usernameElements.forEach(el => {
                el.textContent = userData.username;
            });
        }
        
        // Actualizar nivel y XP
        if (userData.level !== undefined) {
            document.getElementById('userLevel').textContent = userData.level;
        }
        
        // Actualizar barra de progreso
        if (userData.xp !== undefined && userData.totalXp !== undefined) {
            const progress = (userData.xp / userData.totalXp) * 100;
            const progressBar = document.querySelector('.progress-bar-fill');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            // Actualizar contador de XP
            const xpCounter = document.getElementById('xpCounter');
            if (xpCounter) {
                xpCounter.textContent = `${userData.xp}/${userData.totalXp} XP`;
            }
        }
        
        // Actualizar avatar si existe
        if (userData.username) {
            const avatarElements = document.querySelectorAll('.user-avatar');
            const initial = userData.username.charAt(0).toUpperCase();
            avatarElements.forEach(el => {
                el.textContent = initial;
            });
        }
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
    }
};
window.updateAchievements = updateAchievements || function(achievementsData) {
    console.log('Actualizando logros con:', achievementsData);
    // Si no existe la función original, usar esta implementación básica
    if (!achievementsData || !Array.isArray(achievementsData)) return;
    
    try {
        const achievementsContainer = document.getElementById('achievements-container');
        if (!achievementsContainer) return;
        
        // Limpiar contenedor
        achievementsContainer.innerHTML = '';
        
        // Generar HTML para cada logro
        achievementsData.forEach(achievement => {
            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement-card ${achievement.status}`;
            
            const progressPercent = achievement.progress || 0;
            const statusText = getStatusText(achievement.status);
            
            achievementCard.innerHTML = `
                <div class="achievement-icon">
                    <i class="fas fa-${achievement.icon || 'trophy'}"></i>
                </div>
                <div class="achievement-info">
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text">${progressPercent}% - ${statusText}</div>
                    </div>
                    <div class="achievement-reward">${achievement.reward || ''}</div>
                </div>
            `;
            
            achievementsContainer.appendChild(achievementCard);
        });
        
        // Mostrar mensaje si no hay logros
        if (achievementsData.length === 0) {
            achievementsContainer.innerHTML = `
                <div class="no-achievements">
                    <i class="fas fa-trophy"></i>
                    <p>No hay logros disponibles</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al actualizar logros:', error);
    }
    
    // Función auxiliar para obtener texto de estado
    function getStatusText(status) {
        switch (status) {
            case 'unlocked':
                return 'Desbloqueado';
            case 'in-progress':
                return 'En progreso';
            case 'locked':
                return 'Bloqueado';
            default:
                return 'Desconocido';
        }
    }
};
window.showNotification = showNotification || function(message, type = 'info') {
    console.log(`Notificación (${type}): ${message}`);
    // Si no existe la función original, usar esta implementación básica
    
    try {
        // Usar gameCompletion.showToast si está disponible
        if (window.gameCompletion && typeof window.gameCompletion.showToast === 'function') {
            return window.gameCompletion.showToast(message, type);
        }
        
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Añadir ícono según el tipo
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-triangle';
        if (type === 'warning') icon = 'exclamation-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        // Estilos para la notificación
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '4px';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '10px';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        notification.style.animation = 'slideIn 0.3s forwards';
        
        // Colores según el tipo
        if (type === 'success') {
            notification.style.backgroundColor = '#10b981';
            notification.style.color = 'white';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
            notification.style.color = 'white';
        } else if (type === 'warning') {
            notification.style.backgroundColor = '#f59e0b';
            notification.style.color = 'white';
        } else {
            notification.style.backgroundColor = '#3b82f6';
            notification.style.color = 'white';
        }
        
        // Añadir al DOM
        document.body.appendChild(notification);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
        
        // Agregar keyframes para animaciones si no existen
        if (!document.getElementById('notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    } catch (error) {
        console.error('Error al mostrar notificación:', error);
    }
}; 