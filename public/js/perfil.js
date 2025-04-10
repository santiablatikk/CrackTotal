document.addEventListener('DOMContentLoaded', () => {
    console.log('Perfil.js cargado y DOM listo.');

    // Verificar si GameData está disponible
    if (typeof GameData === 'undefined') {
        console.error('Error: GameData no está definido. Asegúrate de que game-data.js se cargue antes de perfil.js.');
        // Opcionalmente, mostrar un mensaje al usuario en la página
        const profileCard = document.querySelector('.profile-card');
        if (profileCard) {
            profileCard.innerHTML = '<p class="error-message">No se pudieron cargar los datos del perfil. Intenta jugar una partida primero.</p>';
        }
        return;
    }

    // --- Cargar Nombre del Jugador ---
    const usernameElement = document.getElementById('profile-username');
    if (usernameElement) {
        const username = localStorage.getItem('username') || 'Jugador';
        usernameElement.textContent = username;
        console.log(`Nombre de usuario cargado: ${username}`);
    }

    // --- Cargar Estadísticas Generales (Pasala Che) ---
    try {
        console.log('Intentando cargar estadísticas de Pasala Che...');
        const stats = GameData.getPasalaCheStats();
        console.log('Estadísticas obtenidas:', stats);

        // Actualizar elementos HTML con las estadísticas
        document.getElementById('stats-games-played').textContent = stats.gamesPlayed || 0;
        document.getElementById('stats-wins').textContent = stats.wins || 0;
        document.getElementById('stats-losses').textContent = stats.losses || 0;
        document.getElementById('stats-accuracy').textContent = `${stats.accuracy || 0}%`;
        document.getElementById('stats-high-score').textContent = stats.highScore || 0;
        document.getElementById('stats-avg-time').textContent = `${stats.avgTime || 0}s`;
        document.getElementById('stats-avg-letters').textContent = stats.avgLetters.toFixed(1) || '0.0'; // Mostrar con un decimal

        console.log('Estadísticas generales actualizadas en la página.');

    } catch (error) {
        console.error('Error al cargar estadísticas generales de Pasala Che:', error);
        // Mostrar mensaje de error o valores predeterminados
        const statsSection = document.querySelector('.stats-section .stats-grid');
        if (statsSection) {
            statsSection.innerHTML = '<p class="error-message">No se pudieron cargar las estadísticas.</p>';
        }
    }

    // --- Cargar Estadísticas por Letra (Pasala Che) ---
    try {
        console.log('Intentando cargar estadísticas por letra...');
        const letterStats = GameData.getLetterStats();
        const letterStatsContainer = document.getElementById('letter-stats-container');
        const letterStatsSection = document.getElementById('letter-stats-section');

        if (letterStatsContainer && letterStatsSection && Object.keys(letterStats).length > 0) {
            console.log('Estadísticas por letra obtenidas:', letterStats);
            letterStatsContainer.innerHTML = ''; // Limpiar contenedor

            // Crear tabla o lista para mostrar las estadísticas por letra
            const table = document.createElement('table');
            table.className = 'letter-stats-table'; // Añadir clase para estilos
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            ['Letra', 'Intentos', 'Aciertos', 'Precisión'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });

            const tbody = table.createTBody();
            // Ordenar letras alfabéticamente
            Object.keys(letterStats).sort().forEach(letter => {
                const data = letterStats[letter];
                const row = tbody.insertRow();
                row.insertCell().textContent = letter;
                row.insertCell().textContent = data.attempts || 0;
                row.insertCell().textContent = data.correct || 0;
                
                // Celda de Precisión con Barra de Progreso
                const accuracyCell = row.insertCell();
                const accuracy = data.accuracy || 0;
                accuracyCell.innerHTML = `
                    <div class="progress-bar-container" title="${accuracy}%">
                        <div class="progress-bar" style="width: ${accuracy}%;"></div>
                        <span class="progress-bar-label">${accuracy}%</span>
                    </div>
                `;
                // Añadir clase basada en la precisión para colorear la barra (se hará en CSS)
                if (accuracy >= 75) {
                  accuracyCell.querySelector('.progress-bar').classList.add('accuracy-high');
                } else if (accuracy >= 50) {
                  accuracyCell.querySelector('.progress-bar').classList.add('accuracy-medium');
                } else if (data.attempts > 0) {
                  accuracyCell.querySelector('.progress-bar').classList.add('accuracy-low');
                }
            });

            letterStatsContainer.appendChild(table);
            letterStatsSection.style.display = 'block'; // Mostrar la sección
            console.log('Estadísticas por letra mostradas.');
        } else {
            console.log('No se encontraron estadísticas por letra o el contenedor no existe.');
            if (letterStatsSection) {
                letterStatsSection.style.display = 'none'; // Ocultar si no hay datos
            }
        }
    } catch (error) {
        console.error('Error al cargar o mostrar estadísticas por letra:', error);
        const letterStatsSection = document.getElementById('letter-stats-section');
        if (letterStatsSection) {
            letterStatsSection.style.display = 'none'; // Ocultar en caso de error
        }
    }

    // --- Cargar Logros Desbloqueados ---
    loadAchievements();

    // Añadir listeners para botones si es necesario (ej. compartir, aunque ya está en footer)
    // El botón de tema ya debería funcionar gracias a main.js
    // El botón de compartir ya debería funcionar si está incluido global-footer.js o similar

}); 

/**
 * Carga y muestra los logros desbloqueados por el usuario
 */
function loadAchievements() {
    try {
        console.log('Cargando logros del usuario...');
        const loadingIndicator = document.getElementById('achievements-loading');
        const achievementsContainer = document.getElementById('achievements-container');
        const noAchievements = document.getElementById('no-achievements');
        const achievementsCounter = document.getElementById('achievements-counter');
        
        if (!loadingIndicator || !achievementsContainer || !noAchievements || !achievementsCounter) {
            console.error('No se encontraron los elementos necesarios para mostrar logros');
            return;
        }
        
        // Mostrar indicador de carga
        loadingIndicator.style.display = 'flex';
        achievementsContainer.style.display = 'none';
        achievementsCounter.style.display = 'none';
        
        // Verificar si GameData está disponible
        if (typeof GameData === 'undefined') {
            console.error('Error: GameData no está definido');
            showLoadingError('No se pudieron cargar los datos de logros');
            return;
        }
        
        // Obtener logros desbloqueados del localStorage
        let unlockedAchievements = [];
        let unlockedAchievementDetails = [];
        
        // Intentar obtener logros del nuevo formato (array de IDs)
        const achievementsFromGetMethod = GameData.getUnlockedAchievements();
        if (achievementsFromGetMethod && achievementsFromGetMethod.length > 0) {
            unlockedAchievements = achievementsFromGetMethod;
            console.log('Logros obtenidos de getUnlockedAchievements():', unlockedAchievements);
        } else {
            // Intentar obtener logros del formato antiguo (objeto con propiedades)
            const achievementsFromStorage = GameData.getAchievements();
            if (achievementsFromStorage && Object.keys(achievementsFromStorage).length > 0) {
                unlockedAchievements = Object.keys(achievementsFromStorage);
                console.log('Logros obtenidos de getAchievements():', unlockedAchievements);
            }
        }
        
        // Ocultar indicador de carga
        loadingIndicator.style.display = 'none';
        achievementsContainer.style.display = 'grid';
        
        // Verificar si hay datos de logros disponibles (achievementsData o GAME_ACHIEVEMENTS)
        let totalAchievements = 0;
        if (typeof achievementsData !== 'undefined' && Array.isArray(achievementsData)) {
            totalAchievements = achievementsData.length;
        } else if (GameData.GAME_ACHIEVEMENTS) {
            totalAchievements = Object.keys(GameData.GAME_ACHIEVEMENTS).length;
        }
        
        // Actualizar contador de logros
        const unlockedCount = unlockedAchievements.length;
        document.getElementById('unlocked-count').textContent = unlockedCount;
        document.getElementById('total-count').textContent = totalAchievements;
        achievementsCounter.style.display = 'inline-flex';
        
        // Si no hay logros desbloqueados, mostrar mensaje
        if (!unlockedAchievements || unlockedAchievements.length === 0) {
            noAchievements.style.display = 'block';
            return;
        }
        
        // Ocultar mensaje de no logros
        noAchievements.style.display = 'none';
        
        // Primero intentar con achievementsData global
        if (typeof achievementsData !== 'undefined' && Array.isArray(achievementsData)) {
            unlockedAchievementDetails = achievementsData.filter(achievement => 
                unlockedAchievements.includes(achievement.id)
            );
        }
        
        // Si no se encontraron detalles, intentar con GAME_ACHIEVEMENTS del objeto GameData
        if (unlockedAchievementDetails.length === 0 && GameData.GAME_ACHIEVEMENTS) {
            unlockedAchievementDetails = unlockedAchievements
                .filter(id => GameData.GAME_ACHIEVEMENTS[id])
                .map(id => {
                    const achievement = GameData.GAME_ACHIEVEMENTS[id];
                    return {
                        id: id,
                        name: achievement.title,
                        description: achievement.description,
                        icon: achievement.icon,
                        category: achievement.type || 'general'
                    };
                });
        }
        
        console.log('Detalles de logros desbloqueados:', unlockedAchievementDetails);
        
        // Si todavía no hay detalles, mostrar mensaje de que no hay logros
        if (unlockedAchievementDetails.length === 0) {
            noAchievements.style.display = 'block';
            return;
        }
        
        // Ordenar por categoría y fecha de desbloqueo (si estuviera disponible)
        unlockedAchievementDetails.sort((a, b) => {
            // Prioridad de categorías
            const categoryOrder = {
                'principiante': 1,
                'intermedio': 2,
                'experto': 3,
                'maestria': 4,
                'coleccionista': 5,
                'especial': 6,
                'general': 7,
                'victory': 1,
                'perfect': 2,
                'fast': 3,
                'noHelp': 3,
                'hard': 4,
                'perseverance': 5,
                'defeat': 6
            };
            
            return (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
        });
        
        // Limpiar contenedor antes de agregar logros
        achievementsContainer.innerHTML = '';
        // Mantener solo el div de no-achievements
        achievementsContainer.appendChild(noAchievements);
        noAchievements.style.display = 'none';
        
        // Crear y añadir tarjetas de logros al contenedor
        unlockedAchievementDetails.forEach((achievement, index) => {
            const achievementCard = document.createElement('div');
            achievementCard.className = 'achievement-card';
            achievementCard.style.setProperty('--achievement-index', index);
            
            achievementCard.innerHTML = `
                <div class="achievement-icon">
                    <i class="${achievement.icon || 'fas fa-trophy'}"></i>
                </div>
                <h4 class="achievement-title">${achievement.name}</h4>
                <p class="achievement-description">${achievement.description}</p>
            `;
            
            achievementsContainer.appendChild(achievementCard);
        });
        
        console.log('Logros cargados y mostrados correctamente');
        
    } catch (error) {
        console.error('Error al cargar logros:', error);
        showLoadingError('Ocurrió un error al cargar los logros');
    }
}

/**
 * Muestra un mensaje de error en la sección de logros
 * @param {string} message - El mensaje de error a mostrar
 */
function showLoadingError(message) {
    const loadingIndicator = document.getElementById('achievements-loading');
    const achievementsContainer = document.getElementById('achievements-container');
    const achievementsSection = document.getElementById('achievements-section');
    const achievementsCounter = document.getElementById('achievements-counter');
    
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (achievementsContainer) achievementsContainer.style.display = 'none';
    if (achievementsCounter) achievementsCounter.style.display = 'none';
    
    if (achievementsSection) {
        const errorElement = document.createElement('p');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        achievementsSection.appendChild(errorElement);
    }
} 