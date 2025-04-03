/**
 * CRACK TOTAL - Perfil y Ranking
 * Gestiona la carga de datos reales para el perfil y ranking de usuarios
 */

document.addEventListener('DOMContentLoaded', function() {
    // Obtener el juego seleccionado (por defecto es PASALA CHE)
    let currentGame = 'pasala-che';
    
    // Detectamos si estamos en la página de perfil o ranking
    const isProfilePage = document.body.classList.contains('profile-page');
    const isRankingPage = document.body.classList.contains('ranking-page');
    
    // Inicializar la interfaz
    initUI();
    
    // Cargar datos del usuario
    loadUserData();
    
    // Cargar contenido específico según la página
    if (isProfilePage) {
        loadUserProfile();
    } else if (isRankingPage) {
        loadRanking();
    }
    
    // Configurar selector de juego
    setupGameSelector();
    
    // Configurar filtros de ranking (solo en página de ranking)
    if (isRankingPage) {
        setupRankingFilters();
    }
    
    /**
     * Inicializa elementos de la interfaz
     */
    function initUI() {
        // Mostrar/ocultar indicador de carga principal
        const mainLoader = document.querySelector('.main-loading-container');
        if (mainLoader) {
            setTimeout(() => {
                mainLoader.style.display = 'none';
            }, 800);
        }
    }
    
    /**
     * Carga datos básicos del usuario (nombre, nivel)
     */
    function loadUserData() {
        // Obtener el nombre de usuario del almacenamiento local
        const username = localStorage.getItem('playerName') || 'Jugador';
        
        // Actualizar nombre de usuario en la interfaz
        const usernameElements = document.querySelectorAll('#profile-username');
        usernameElements.forEach(el => {
            if (el) el.textContent = username;
        });
        
        // Calcular nivel del usuario basado en partidas jugadas y puntuación (sólo si estamos en perfil)
        if (isProfilePage) {
            // Obtener datos de juego del almacenamiento local
            const totalGamesPlayed = parseInt(localStorage.getItem('totalGamesPlayed') || '0');
            const totalScore = parseInt(localStorage.getItem('totalScore') || '0');
            
            // Cálculo simple de nivel: 1 nivel por cada 5 partidas + 1 nivel por cada 500 puntos
            const level = Math.max(1, Math.floor(totalGamesPlayed / 5) + Math.floor(totalScore / 500));
            
            // Actualizar nivel en la interfaz
            const levelBadge = document.getElementById('level-badge');
            const levelText = document.getElementById('profile-level-text');
            
            if (levelBadge) levelBadge.textContent = level;
            if (levelText) levelText.textContent = `Nivel ${level}`;
        }
    }
    
    /**
     * Carga los datos del perfil del usuario
     */
    function loadUserProfile() {
        // Obtener estadísticas del juego seleccionado
        let stats = getUserStats(currentGame);
        
        // Actualizar estadísticas en la interfaz
        updateProfileStats(stats);
        
        // Cargar logros
        loadAchievements();
        
        // Cargar historial de partidas
        loadGameHistory();
    }
    
    /**
     * Obtiene las estadísticas del usuario para el juego seleccionado
     */
    function getUserStats(game) {
        // En una implementación real, estos datos vendrían de una API
        // Por ahora, obtenemos datos del localStorage
        const prefix = game === 'pasala-che' ? 'pasalaChe_' : 'quienSabe_';
        
        return {
            games: parseInt(localStorage.getItem(`${prefix}gamesPlayed`) || '0'),
            wins: parseInt(localStorage.getItem(`${prefix}wins`) || '0'),
            losses: parseInt(localStorage.getItem(`${prefix}losses`) || '0'),
            accuracy: parseInt(localStorage.getItem(`${prefix}accuracy`) || '0')
        };
    }
    
    /**
     * Actualiza las estadísticas en la página de perfil
     */
    function updateProfileStats(stats) {
        // Actualizar elementos de estadísticas
        const gamesElement = document.getElementById('stat-games');
        const winsElement = document.getElementById('stat-wins');
        const lossesElement = document.getElementById('stat-losses');
        const accuracyElement = document.getElementById('stat-accuracy');
        
        if (gamesElement) gamesElement.textContent = stats.games;
        if (winsElement) winsElement.textContent = stats.wins;
        if (lossesElement) lossesElement.textContent = stats.losses;
        if (accuracyElement) accuracyElement.textContent = `${stats.accuracy}%`;
    }
    
    /**
     * Carga los logros del usuario
     */
    function loadAchievements() {
        const achievementsContainer = document.querySelector('.achievements-grid');
        
        if (!achievementsContainer) return;
        
        // Mostrar indicador de carga
        achievementsContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
        
        // Simulamos una carga de datos
        setTimeout(() => {
            // En una implementación real, estos datos vendrían de una API
            if (currentGame === 'pasala-che') {
                achievementsContainer.innerHTML = `
                    <div class="placeholder-message">
                        <i class="fas fa-trophy"></i>
                        <p>Complete partidas para desbloquear logros</p>
                    </div>
                `;
            } else {
                achievementsContainer.innerHTML = `
                    <div class="placeholder-message">
                        <i class="fas fa-trophy"></i>
                        <p>Complete partidas para desbloquear logros</p>
                    </div>
                `;
            }
        }, 1000);
    }
    
    /**
     * Carga el historial de partidas del usuario
     */
    function loadGameHistory() {
        const historyContainer = document.querySelector('.game-history-container');
        
        if (!historyContainer) return;
        
        // Mostrar indicador de carga
        historyContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
        
        // Simulamos una carga de datos
        setTimeout(() => {
            // En una implementación real, estos datos vendrían de una API
            historyContainer.innerHTML = `
                <div class="placeholder-message">
                    <i class="fas fa-history"></i>
                    <p>Juegue partidas para ver su historial</p>
                </div>
            `;
        }, 1000);
        
        // Configurar filtros del historial
        const historyTabs = document.querySelectorAll('.history-tab');
        historyTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                
                // Actualizar pestañas activas
                historyTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Filtrar historial (en una implementación real)
                // filterGameHistory(filter);
            });
        });
    }
    
    /**
     * Carga el ranking de jugadores
     */
    function loadRanking() {
        // Cargar estadísticas globales
        loadGlobalStats();
        
        // Cargar Top Jugadores
        loadTopPlayers();
        
        // Cargar tabla de ranking
        loadRankingTable();
    }
    
    /**
     * Carga estadísticas globales para el ranking
     */
    function loadGlobalStats() {
        // En una implementación real, estos datos vendrían de una API
        const stats = {
            players: '-',
            games: '-',
            avgScore: '-',
            maxScore: '-'
        };
        
        // Actualizar estadísticas en la interfaz
        const playersElement = document.getElementById('total-players');
        const gamesElement = document.getElementById('total-games');
        const avgScoreElement = document.getElementById('avg-score');
        const maxScoreElement = document.getElementById('max-score');
        
        if (playersElement) playersElement.textContent = stats.players;
        if (gamesElement) gamesElement.textContent = stats.games;
        if (avgScoreElement) avgScoreElement.textContent = stats.avgScore;
        if (maxScoreElement) maxScoreElement.textContent = stats.maxScore;
    }
    
    /**
     * Carga los jugadores top en el ranking
     */
    function loadTopPlayers() {
        const topPlayersContainer = document.querySelector('.top-players');
        
        if (!topPlayersContainer) return;
        
        // Mostrar indicador de carga
        topPlayersContainer.innerHTML = '<div class="loading-container" style="grid-column: 1 / -1;"><div class="loading-spinner"></div></div>';
        
        // Simulamos una carga de datos
        setTimeout(() => {
            // En una implementación real, estos datos vendrían de una API
            topPlayersContainer.innerHTML = `
                <div class="placeholder-message" style="grid-column: 1 / -1;">
                    <i class="fas fa-users"></i>
                    <p>Jugando partidas para generar el ranking</p>
                </div>
            `;
        }, 1000);
    }
    
    /**
     * Carga la tabla de ranking
     */
    function loadRankingTable() {
        const tableBody = document.querySelector('.ranking-table tbody');
        
        if (!tableBody) return;
        
        // Mostrar indicador de carga
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;"><div class="loading-spinner" style="margin: 0 auto;"></div></td></tr>';
        
        // Simulamos una carga de datos
        setTimeout(() => {
            // En una implementación real, estos datos vendrían de una API
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 30px;">
                        <div class="placeholder-message">
                            <i class="fas fa-trophy"></i>
                            <p>Complete partidas para aparecer en el ranking</p>
                        </div>
                    </td>
                </tr>
            `;
        }, 1000);
    }
    
    /**
     * Configura el selector de juego
     */
    function setupGameSelector() {
        const gameOptions = document.querySelectorAll('.game-option');
        
        gameOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Obtener el juego seleccionado
                const game = this.getAttribute('data-game');
                
                // Actualizar juego actual
                currentGame = game;
                
                // Actualizar clase del tema
                document.body.classList.remove('pasala-che-theme', 'quien-sabe-theme');
                document.body.classList.add(game === 'pasala-che' ? 'pasala-che-theme' : 'quien-sabe-theme');
                
                // Actualizar opciones activas
                gameOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                // Actualizar título según el juego
                updateTitle(game);
                
                // Recargar datos específicos de la página
                if (isProfilePage) {
                    loadUserProfile();
                } else if (isRankingPage) {
                    loadRanking();
                }
            });
        });
    }
    
    /**
     * Actualiza el título según el juego seleccionado
     */
    function updateTitle(game) {
        const titleElement = document.querySelector('.profile-title-text, .ranking-title-text');
        
        if (!titleElement) return;
        
        const pageType = isProfilePage ? 'Perfil' : 'Ranking';
        const gameLabel = game === 'pasala-che' ? 'PASALA CHE' : '¿QUIÉN SABE MÁS?';
        
        titleElement.textContent = `CRACK TOTAL - ${pageType}`;
    }
    
    /**
     * Configura los filtros del ranking
     */
    function setupRankingFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Obtener el período seleccionado
                const period = this.getAttribute('data-period');
                
                // Actualizar botones activos
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Actualizar título de la tabla
                const tableTitle = document.querySelector('.ranking-table-section .section-title');
                if (tableTitle) {
                    const periodText = {
                        'global': 'Global',
                        'monthly': 'Mensual',
                        'weekly': 'Semanal',
                        'daily': 'Diario'
                    }[period];
                    
                    tableTitle.textContent = `Clasificación ${periodText}`;
                }
                
                // Recargar ranking según el período
                loadRankingTable();
            });
        });
    }
    
    // Función para conectarse a eventos de actualización en tiempo real (implementación futura)
    function setupRealTimeUpdates() {
        // En una implementación real, aquí se configuraría una conexión de WebSocket
        // o polling para actualizar los datos en tiempo real
    }
});
