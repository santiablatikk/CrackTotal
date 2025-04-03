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

// Variables globales
let currentGame = 'pasala-che';
let currentTab = 'profile';
// Reemplazamos la variable apiBaseUrl ya que ahora usamos el cliente API
// let apiBaseUrl = '/api'; // Base URL for API endpoints
    
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
        
        // Cargar datos del usuario usando el cliente API
        const userData = await window.apiClient.getOrCreateUser(userIP, localStorage.getItem('username') || 'Jugador');
        
        if (!userData) {
            throw new Error('No se pudieron obtener datos del usuario');
        }
        
        // Cargar datos del juego usando el cliente API
        const gameData = await window.apiClient.getGameInfo(gameType);
        
        // Si no hay datos del juego, usar datos por defecto
        const gameInfo = gameData || getDefaultGameData(gameType);
        
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
    
    // Ocultar indicador de carga
    hideLoading('profile');
}

// Cargar estadísticas del usuario para un juego específico
async function loadUserStats(userIP, gameType) {
    console.log('Cargando estadísticas del usuario:', gameType);
    showLoading('stats');
    
    try {
        // Usamos getUserProfile del cliente API en lugar de fetch directo
        const statsData = await window.apiClient.getUserProfile(userIP, gameType);
        
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

// Actualizar la UI de estadísticas
function updateStatsUI(statsData) {
    console.log('Actualizando UI de estadísticas');
    
    // Aquí se actualizaría la UI con las estadísticas recibidas
    // Esta función dependerá de la estructura de tus datos y de tu UI
    
    // Ocultar indicador de carga
    hideLoading('stats');
}

// Cargar el ranking global para un juego específico
async function loadRanking(gameType) {
    console.log('Cargando ranking global:', gameType);
    showLoading('ranking');
    
    try {
        // Usamos getGlobalRanking del cliente API en lugar de fetch directo
        const rankingData = await window.apiClient.getGlobalRanking(gameType);
        
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

// Actualizar la UI del ranking
function updateRankingUI(rankingData) {
    console.log('Actualizando UI del ranking');
    
    // Aquí se actualizaría la UI con los datos del ranking recibidos
    // Esta función dependerá de la estructura de tus datos y de tu UI
    
    // Ocultar indicador de carga
    hideLoading('ranking');
}

// Cargar logros del usuario para un juego específico
async function loadAchievements(userIP, gameType) {
    console.log('Cargando logros del usuario:', gameType);
    showLoading('achievements');
    
    try {
        // Usamos getUserAchievements del cliente API en lugar de fetch directo
        const achievementsData = await window.apiClient.getUserAchievements(userIP, gameType);
        
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

// Actualizar la UI de logros
function updateAchievementsUI(achievementsData) {
    console.log('Actualizando UI de logros');
    
    // Aquí se actualizaría la UI con los logros recibidos
    // Esta función dependerá de la estructura de tus datos y de tu UI
    
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
} 
} 