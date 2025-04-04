/**
 * PASALA CHE - Profile Page Script
 * Handles loading and display of Pasala Che stats, history, and achievements.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Pasala Che Profile JS Loaded");
    loadAllProfileData();
    addStorageListener(); // Listen for external changes
    setupEventListeners(); // Setup UI interactions
});

// Setup UI interaction event listeners
function setupEventListeners() {
    // Share button
    const shareButton = document.getElementById('share-profile');
    if (shareButton) {
        shareButton.addEventListener('click', shareProfile);
    }
    
    // Print button
    const printButton = document.getElementById('print-profile');
    if (printButton) {
        printButton.addEventListener('click', printProfile);
    }
    
    // Achievement filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Apply filter
            filterAchievements(button.dataset.filter);
        });
    });
}

// Global variable to store username
let currentUsername = 'Jugador';

async function loadAllProfileData() {
    showLoadingIndicator();
    try {
        // Get username from localStorage instead of IP
        let username = 'Jugador';
        
        try {
            const userData = getUserData();
            // Check if user has a stored username
            if (userData && userData.username) {
                username = userData.username;
            } else {
                // Fallback to a default name or generate one
                username = 'Jugador_' + Math.floor(Math.random() * 1000);
            }
            currentUsername = username;
        } catch (error) {
            console.warn('Could not get username from localStorage, using default.', error);
            currentUsername = 'Jugador'; // Default if can't get from storage
        }
        
        // Update username display in the header
        const usernameElement = document.getElementById('profile-username-display');
        if (usernameElement) {
            usernameElement.textContent = currentUsername;
        } else {
            console.warn('Username display element not found.');
        }

        // Load game-specific data
        await Promise.all([
            loadPasalaCheStats(),
            loadPasalaCheHistory(),
            loadUserAchievements()
        ]);

    } catch (error) {
        console.error("Error loading profile data:", error);
        // Optionally display a general error message on the page
    } finally {
        hideLoadingIndicator();
    }
}

async function loadPasalaCheStats() {
    const statsContainer = document.getElementById('pasala-che-stats');
    if (!statsContainer) {
        console.error('Pasala Che stats container not found');
        return;
    }

    statsContainer.innerHTML = getLoadingPlaceholderHTML('Cargando estadísticas de Pasala Che...');
    statsContainer.classList.add('loading-placeholder');

    try {
        const pasalaCheData = getUserData('pasalache');
        if (!pasalaCheData || !pasalaCheData.stats) {
            throw new Error('No Pasala Che stats found in localStorage.');
        }

        const stats = pasalaCheData.stats;

        // Clear loading state
        statsContainer.innerHTML = '';
        statsContainer.classList.remove('loading-placeholder');

        // --- Define Pasala Che Specific Stats ---
        const statsToShow = [
            { label: 'Partidas Jugadas', value: stats.gamesPlayed || 0, icon: 'fa-gamepad' },
            { label: 'Victorias', value: stats.wins || 0, icon: 'fa-trophy' },
            { label: 'Récord de Aciertos', value: stats.maxCorrect || 0, icon: 'fa-star' },
            { label: 'Aciertos Totales', value: stats.totalCorrect || 0, icon: 'fa-check-circle' },
            { label: 'Récord de Tiempo', value: stats.bestTime ? formatTime(stats.bestTime) : 'N/A', icon: 'fa-stopwatch' },
            { label: 'Victorias Perfectas', value: stats.perfectGames || 0, icon: 'fa-gem' } // Example stat
        ];

        // Render stats
        statsToShow.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            statItem.innerHTML = `
                <span class="stat-value">${stat.value}</span>
                <span class="stat-label"><i class="fas ${stat.icon}"></i> ${stat.label}</span>
            `;
            statsContainer.appendChild(statItem);
        });

        if (statsToShow.length === 0) {
            statsContainer.innerHTML = getInfoMessageHTML('No hay estadísticas disponibles para Pasala Che.');
        }

    } catch (error) {
        console.error('Error loading Pasala Che stats:', error);
        statsContainer.innerHTML = getErrorMessageHTML('Error al cargar estadísticas de Pasala Che.', error.message);
        statsContainer.classList.remove('loading-placeholder');
    }
}

async function loadPasalaCheHistory() {
    const historyContent = document.getElementById('history-content');
    
    if (!historyContent) {
        console.error('History content container not found');
        return;
    }
    
    historyContent.innerHTML = '<tr><td colspan="4" class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Cargando historial...</td></tr>';

    try {
        // Get user data from storage
        const userData = getUserData();
        
        if (!userData.games || !userData.games.pasalache || userData.games.pasalache.length === 0) {
            historyContent.innerHTML = '<tr><td colspan="4" class="info-message">No hay partidas registradas aún.</td></tr>';
            return;
        }
        
        // Sort games by date (most recent first)
        const pasalaCheGames = userData.games.pasalache.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Take last 10 games
        const recentGames = pasalaCheGames.slice(0, 10);
        
        // Clear loading placeholder
        historyContent.innerHTML = '';
        
        // Add each game to the history table
        recentGames.forEach(game => {
            const row = document.createElement('tr');
            
            // Date
            const dateCell = document.createElement('td');
            const gameDate = new Date(game.date);
            dateCell.textContent = gameDate.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Result
            const resultCell = document.createElement('td');
            const result = game.victory ? 'Victoria' : 'Derrota';
            resultCell.textContent = result;
            resultCell.classList.add(game.victory ? 'victory' : 'defeat');
            
            // Time
            const timeCell = document.createElement('td');
            timeCell.textContent = formatTime(game.timeLeft || 0);
            
            // Score
            const scoreCell = document.createElement('td');
            scoreCell.textContent = game.score || '0';
            
            // Add cells to row
            row.appendChild(dateCell);
            row.appendChild(resultCell);
            row.appendChild(timeCell);
            row.appendChild(scoreCell);
            
            // Add row to table
            historyContent.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading game history:', error);
        historyContent.innerHTML = '<tr><td colspan="4" class="error-message">Error al cargar el historial de partidas.</td></tr>';
    }
}

// --- Utility Functions (Keep existing ones like loadUserAchievements, getUserData, etc.) ---

// Function to get user data from localStorage (centralized)
function getUserData(gameKey = null) {
    try {
        const rawData = localStorage.getItem('crackTotalUserData');
        const userData = rawData ? JSON.parse(rawData) : {};
        return gameKey ? userData[gameKey] : userData;
    } catch (error) {
        console.error("Error reading user data from localStorage:", error);
        return gameKey ? {} : {}; // Return empty object or specific part
    }
}

// Load achievements with progress circle update
async function loadUserAchievements() {
    const achievementsContainer = document.getElementById('achievements-content');
    const achievementCount = document.getElementById('achievement-count');
    const progressBar = document.getElementById('achievement-progress-bar');
    
    if (!achievementsContainer) {
        console.error('Achievements container not found');
        return;
    }
    
    achievementsContainer.innerHTML = getLoadingPlaceholderHTML('Cargando logros...');

    try {
        const allUserData = getUserData(); // Get all data
        const unlockedAchievements = allUserData.achievements || [];

        // --- Need a definition of all possible achievements --- 
        // This should ideally come from a config file or be defined here
        const ALL_ACHIEVEMENTS = [
            { id: 'pasalache_win_1', name: 'Debut Ganador (Pasala Che)', description: 'Gana tu primera partida de Pasala Che.', icon: 'fa-medal' },
            { id: 'pasalache_perfect_1', name: '¡Perfecto! (Pasala Che)', description: 'Completa Pasala Che sin errores.', icon: 'fa-gem' },
            { id: 'pasalache_streak_3', name: 'Racha Ganadora', description: 'Gana 3 partidas consecutivas.', icon: 'fa-fire' },
            { id: 'pasalache_speed_30', name: 'Rápido y Preciso', description: 'Completa con más de 30 segundos restantes.', icon: 'fa-bolt' },
            { id: 'pasalache_games_10', name: 'Jugador Fiel', description: 'Juega 10 partidas de Pasala Che.', icon: 'fa-gamepad' },
            { id: 'quien_sabe_100k', name: 'Club de los 100k (¿QS+?)', description: 'Alcanza 100,000 puntos en ¿Quién Sabe Más?.', icon: 'fa-sack-dollar' },
            { id: 'global_games_10', name: 'Jugador Habitual', description: 'Juega 10 partidas en total.', icon: 'fa-gamepad' }
            // ... Add all other achievements
        ];

        if (ALL_ACHIEVEMENTS.length === 0) {
             achievementsContainer.innerHTML = getInfoMessageHTML('No hay logros definidos.');
             return;
        }

        achievementsContainer.innerHTML = ''; // Clear loading

        ALL_ACHIEVEMENTS.forEach(ach => {
            const isUnlocked = unlockedAchievements.some(unlocked => unlocked.id === ach.id);
            const achievementCard = createAchievementCard(ach, isUnlocked);
            achievementsContainer.appendChild(achievementCard);
        });
        
        // Update progress circle and count
        const totalAchievements = ALL_ACHIEVEMENTS.length;
        const unlockedCount = unlockedAchievements.length;
        const progressPercentage = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;
        
        if (achievementCount) {
            achievementCount.textContent = unlockedCount;
        }
        
        if (progressBar) {
            progressBar.style.setProperty('--progress', `${progressPercentage}%`);
            progressBar.setAttribute('data-progress', progressPercentage);
            
            // Add animation
            setTimeout(() => {
                progressBar.classList.add('animate');
            }, 300);
        }

    } catch (error) {
        console.error('Error loading achievements:', error);
        achievementsContainer.innerHTML = getErrorMessageHTML('Error al cargar los logros.', error.message);
        
        if (achievementCount) {
            achievementCount.textContent = '0';
        }
    }
}

function createAchievementCard(achievement, isUnlocked) {
    const card = document.createElement('div');
    card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
        <div class="achievement-icon">
            <i class="fas ${achievement.icon || 'fa-question-circle'} ${isUnlocked ? 'unlocked-icon' : 'locked-icon'}"></i>
        </div>
        <div class="achievement-details">
            <h4 class="achievement-name">${achievement.name}</h4>
            <p class="achievement-description">${achievement.description}</p>
            ${isUnlocked ? '<span class="achievement-status unlocked-status">Desbloqueado</span>' : '<span class="achievement-status locked-status">Bloqueado</span>'}
        </div>
    `;
    return card;
}

// Filter achievements based on unlocked status
function filterAchievements(filter) {
    const achievementCards = document.querySelectorAll('.achievement-card');
    
    achievementCards.forEach(card => {
        switch(filter) {
            case 'all':
                card.style.display = 'flex';
                break;
            case 'unlocked':
                card.style.display = card.classList.contains('unlocked') ? 'flex' : 'none';
                break;
            case 'locked':
                card.style.display = card.classList.contains('locked') ? 'flex' : 'none';
                break;
            default:
                card.style.display = 'flex';
        }
    });
}

// Share profile functionality
function shareProfile() {
    // Create shareable text
    const username = document.getElementById('profile-username-display').textContent;
    const shareText = `¡Mira mi perfil de PASALA CHE en CRACK TOTAL! Jugador: ${username}`;
    const shareUrl = window.location.href;
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: 'Mi Perfil de PASALA CHE',
            text: shareText,
            url: shareUrl,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback - copy to clipboard
        const tempInput = document.createElement('input');
        document.body.appendChild(tempInput);
        tempInput.value = `${shareText}\n${shareUrl}`;
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        // Show message
        const shareButton = document.getElementById('share-profile');
        const originalText = shareButton.innerHTML;
        shareButton.innerHTML = '<i class="fas fa-check"></i> ¡Copiado al portapapeles!';
        
        setTimeout(() => {
            shareButton.innerHTML = originalText;
        }, 2000);
    }
}

// Print profile functionality
function printProfile() {
    window.print();
}

// --- Loading/Error/Info Message HTML Generators ---
function getLoadingPlaceholderHTML(message = 'Cargando...') {
    return `<i class="fas fa-spinner fa-spin"></i> ${message}`;
}

function getErrorMessageHTML(title, message = '') {
    return `<i class="fas fa-exclamation-triangle"></i> ${title} ${message ? `<br><small>${message}</small>` : ''}`;
}

function getInfoMessageHTML(message) {
    return `<i class="fas fa-info-circle"></i> ${message}`;
}

// --- Loading Indicator --- 
const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.className = 'loading-indicator'; // Base class
loadingIndicator.innerHTML = '<i class="fas fa-spinner"></i> Cargando datos...'; // Spinner icon
document.addEventListener('DOMContentLoaded', () => document.body.appendChild(loadingIndicator));

function showLoadingIndicator() {
    if (loadingIndicator) {
        loadingIndicator.classList.add('show');
    }
}

function hideLoadingIndicator() {
    if (loadingIndicator) {
        loadingIndicator.classList.remove('show');
    }
}

// --- Storage Listener --- 
function addStorageListener() {
    window.addEventListener('storage', (event) => {
        if (event.key === 'crackTotalUserData') {
            console.log('User data changed in another tab. Reloading profile...');
            loadAllProfileData(); // Reload data if changed externally
        }
    });
}

// Helper to format time (assuming time is stored in seconds)
function formatTime(totalSeconds) {
    if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) {
        return 'N/A';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Add other existing utility functions (showToast, etc.) if they were present. 