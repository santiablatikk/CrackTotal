document.addEventListener('DOMContentLoaded', function() {
    const STATS_KEY = 'pasalacheUserStats';
    const HISTORY_KEY = 'pasalacheGameHistory'; // Clave del historial
    const CRACK_RAPIDO_STATS_KEY = 'crackRapido_stats'; // Nueva clave para Crack Rápido

    // Show loading states initially
    showLoadingStates();

    // === TAB NAVIGATION FUNCTIONALITY ===
    initTabNavigation();

    function initTabNavigation() {
        const tabs = document.querySelectorAll('.profile-tab');
        const tabContents = document.querySelectorAll('.profile-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const targetContent = document.getElementById(`tab-${targetTab}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                // Update URL hash for bookmarking
                history.replaceState(null, null, `#${targetTab}`);
                
                // Optional: Track analytics
                if (window.gtag) {
                    gtag('event', 'profile_tab_switch', {
                        event_category: 'engagement',
                        event_label: targetTab
                    });
                }
            });
        });

        // Handle initial tab from URL hash
        const urlHash = window.location.hash.substring(1);
        const validTabs = ['pasalache', 'quiensabemas', 'mentiroso', 'crackrapido', 'logros'];
        
        if (urlHash && validTabs.includes(urlHash)) {
            const targetTab = document.querySelector(`[data-tab="${urlHash}"]`);
            if (targetTab) {
                targetTab.click();
            }
        }
    }

    // --- Funciones para obtener y formatear datos (similares a pasalache.js) ---
    function getDefaultStats() {
        // Copiada de pasalache.js para consistencia
        return {
            gamesPlayed: 0,
            gamesWon: 0, 
            gamesLostByErrors: 0,
            gamesLostByTimeout: 0,
            totalCorrectAnswers: 0,
            totalIncorrectAnswers: 0,
            totalPassedAnswers: 0, 
            totalHelpUsed: 0,
            bestScore: 0, 
            fastestWinTime: null, 
        };
    }

    function getDefaultCrackRapidoStats() {
        return {
            bestScore: 0,
            gamesPlayed: 0,
            totalCorrect: 0,
            bestStreak: 0
        };
    }

    function loadProfileStats() {
        // Copiada de pasalache.js
        const statsJson = localStorage.getItem(STATS_KEY);
        if (statsJson) {
            try {
                return { ...getDefaultStats(), ...JSON.parse(statsJson) };
            } catch (e) {
                console.error("Error parsing profile stats:", e);
                localStorage.removeItem(STATS_KEY); 
                return getDefaultStats();
            }
        } else {
            return getDefaultStats();
        }
    }

    function loadCrackRapidoStats() {
        const statsJson = localStorage.getItem(CRACK_RAPIDO_STATS_KEY);
        if (statsJson) {
            try {
                return { ...getDefaultCrackRapidoStats(), ...JSON.parse(statsJson) };
            } catch (e) {
                console.error("Error parsing Crack Rápido stats:", e);
                localStorage.removeItem(CRACK_RAPIDO_STATS_KEY);
                return getDefaultCrackRapidoStats();
            }
        } else {
            return getDefaultCrackRapidoStats();
        }
    }

    function formatTime(totalSeconds) {
        if (totalSeconds === null || typeof totalSeconds === 'undefined' || totalSeconds < 0) {
            return '--:--';
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // --- Funciones para el Historial --- 
    function loadGameHistory() {
        // Copiada de pasalache.js
        const historyJson = localStorage.getItem(HISTORY_KEY);
        console.log("Historia raw desde localStorage:", historyJson); // Debug
        
        if (historyJson) {
            try {
                const history = JSON.parse(historyJson);
                console.log("Historia parseada:", history); // Debug
                return history;
            } catch (e) {
                console.error("Error parsing game history:", e);
                localStorage.removeItem(HISTORY_KEY); 
                return [];
            }
        } else {
            console.log("No hay historial en localStorage"); // Debug
            return [];
        }
    }

    // --- Función para mostrar estadísticas y historial en la página ---
    function displayProfileData() {
        // --- Mostrar Estadísticas Agregadas --- 
        const stats = loadProfileStats();
        const totalLosses = stats.gamesLostByErrors + stats.gamesLostByTimeout;
        const totalAnswers = stats.totalCorrectAnswers + stats.totalIncorrectAnswers;
        const averageAccuracy = totalAnswers > 0 ? Math.round((stats.totalCorrectAnswers / totalAnswers) * 100) : 0;

        document.getElementById('stats-gamesPlayed').textContent = stats.gamesPlayed;
        document.getElementById('stats-gamesWon').textContent = stats.gamesWon;
        document.getElementById('stats-gamesLost').textContent = totalLosses;
        document.getElementById('stats-averageAccuracy').textContent = `${averageAccuracy}%`;
        document.getElementById('stats-bestScore').textContent = stats.bestScore;
        document.getElementById('stats-fastestWinTime').textContent = formatTime(stats.fastestWinTime);
        document.getElementById('stats-totalCorrect').textContent = stats.totalCorrectAnswers;
        document.getElementById('stats-totalIncorrect').textContent = stats.totalIncorrectAnswers;
        document.getElementById('stats-totalHelpUsed').textContent = stats.totalHelpUsed;

        // --- Mostrar Historial de Partidas --- 
        const history = loadGameHistory();
        const historyTableBody = document.getElementById('gameHistoryBody');
        
        // Limpiar contenido anterior (importante para el reset)
        historyTableBody.innerHTML = ''; 

        if (history.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="6" class="history-empty-state"><i class="fas fa-gamepad"></i><p>No hay partidas en el historial.<br>¡Es hora de comenzar a jugar!</p></td></tr>';
        } else {
            history.forEach(game => {
                const row = historyTableBody.insertRow();
                
                // Formatear fecha para legibilidad
                let gameDate;
                if (game.timestamp) {
                    // Nuevo formato ISO string
                    gameDate = new Date(game.timestamp);
                } else if (game.date) {
                    // Formato anterior compatible
                    gameDate = new Date(game.date);
                } else {
                    gameDate = new Date(); // Fallback
                }
                
                const formattedDate = `${gameDate.toLocaleDateString()} ${gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

                // Formatear resultado
                let resultText = 'Desconocido';
                let resultClass = '';
                switch(game.result) {
                    case 'victory': 
                        resultText = 'Victoria'; 
                        resultClass = 'history-result-victory';
                        break;
                    case 'defeat': 
                        resultText = 'Derrota'; 
                        resultClass = 'history-result-defeat';
                        break;
                    case 'timeout': 
                        resultText = 'Derrota por Tiempo'; 
                        resultClass = 'history-result-timeout';
                        break;
                }

                // Usar los nombres correctos de los campos
                const correctAnswers = game.correctAnswers || game.score || 0;
                const incorrectAnswers = game.incorrectAnswers || game.errors || 0;
                const timeSpent = game.timeSpent || game.time || 0;

                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td class="${resultClass}">${resultText}</td>
                    <td class="history-difficulty">${game.difficulty || 'normal'}</td>
                    <td>${correctAnswers}</td>
                    <td>${incorrectAnswers}</td>
                    <td>${formatTime(timeSpent)}</td>
                `;
            });
        }

        // --- Mostrar Estadísticas de Crack Rápido ---
        displayCrackRapidoStats();
    }

    function displayCrackRapidoStats() {
        const crackRapidoStats = loadCrackRapidoStats();
        
        // Safely update elements if they exist
        const elements = {
            gamesPlayed: document.getElementById('stats-crackrapido-gamesPlayed'),
            bestScore: document.getElementById('stats-crackrapido-bestScore'),
            totalCorrect: document.getElementById('stats-crackrapido-totalCorrect'),
            bestStreak: document.getElementById('stats-crackrapido-bestStreak'),
            averageAccuracy: document.getElementById('stats-crackrapido-averageAccuracy'),
            averageSpeed: document.getElementById('stats-crackrapido-averageSpeed')
        };

        if (elements.gamesPlayed) elements.gamesPlayed.textContent = crackRapidoStats.gamesPlayed;
        if (elements.bestScore) elements.bestScore.textContent = crackRapidoStats.bestScore;
        if (elements.totalCorrect) elements.totalCorrect.textContent = crackRapidoStats.totalCorrect;
        if (elements.bestStreak) elements.bestStreak.textContent = crackRapidoStats.bestStreak;
        
        // Calculate average accuracy
        const averageAccuracy = crackRapidoStats.gamesPlayed > 0 ? 
            Math.round((crackRapidoStats.totalCorrect / (crackRapidoStats.gamesPlayed * 20)) * 100) : 0;
        if (elements.averageAccuracy) elements.averageAccuracy.textContent = `${averageAccuracy}%`;
        
        // Calculate average speed (estimate - 5 seconds per question with bonus for speed)
        const averageSpeed = crackRapidoStats.gamesPlayed > 0 ? 
            (crackRapidoStats.totalCorrect * 3.5) / crackRapidoStats.totalCorrect : 0;
        if (elements.averageSpeed) elements.averageSpeed.textContent = `${averageSpeed.toFixed(1)}s`;

        console.log("Estadísticas de Crack Rápido cargadas:", crackRapidoStats);
    }

    // --- Lógica para el botón de restablecer --- 
    const resetButton = document.getElementById('resetStatsButton');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres borrar TODAS tus estadísticas e historial de todos los juegos? Esta acción no se puede deshacer.')) {
                // Show loading state
                showLoadingStates();
                
                // Clear all statistics
                localStorage.removeItem(STATS_KEY);
                localStorage.removeItem(HISTORY_KEY);
                localStorage.removeItem(CRACK_RAPIDO_STATS_KEY);
                
                // Reset Firebase stats for other games (if possible)
                try {
                    // Clear any cached Firebase data
                    console.log('Clearing all local statistics...');
                } catch (error) {
                    console.warn('Error clearing some statistics:', error);
                }
                
                // Refresh the display after a short delay
                setTimeout(() => {
                    displayProfileData();
                    loadQuienSabeMasStats();
                    loadMentirosoStats();
                    loadAchievementsCount();
                    hideLoadingStates();
                    
                    // Show success notification
                    if (window.NotificationSystem) {
                        window.NotificationSystem.success(
                            '¡Estadísticas Restablecidas!',
                            'Todas las estadísticas han sido borradas correctamente'
                        );
                    } else {
                        alert('¡Estadísticas e historial restablecidos!');
                    }
                }, 1000);
            }
        });
    }

    // --- Mostrar datos al cargar la página --- 
    displayProfileData();

    // Cargar estadísticas de todos los juegos
    loadQuienSabeMasStats();
    loadMentirosoStats();
    loadAchievementsCount();
    
    // Cargar estadísticas de Crack Rápido (Firebase + localStorage)
    loadCrackRapidoFirebaseStats();

    // Performance optimization: Remove loading states after all data is loaded
    setTimeout(() => {
        hideLoadingStates();
    }, 1200);

    // === DEVELOPMENT: Add sample history data for testing ===
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        addDebugButton();
    }

    function addDebugButton() {
        const debugButton = document.createElement('button');
        debugButton.textContent = 'DEBUG: Agregar Historia de Prueba';
        debugButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            padding: 8px 12px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
        `;
        
        debugButton.addEventListener('click', () => {
            addSampleHistoryData();
            displayProfileData(); // Refresh display
        });
        
        document.body.appendChild(debugButton);
    }

    function addSampleHistoryData() {
        const sampleHistory = [
            {
                timestamp: new Date().toISOString(),
                result: 'victory',
                difficulty: 'normal',
                correctAnswers: 25,
                incorrectAnswers: 2,
                timeSpent: 280
            },
            {
                timestamp: new Date(Date.now() - 24*60*60*1000).toISOString(),
                result: 'defeat',
                difficulty: 'dificil',
                correctAnswers: 18,
                incorrectAnswers: 3,
                timeSpent: 195
            },
            {
                timestamp: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
                result: 'timeout',
                difficulty: 'facil',
                correctAnswers: 20,
                incorrectAnswers: 1,
                timeSpent: 360
            },
            // Formato anterior para probar compatibilidad
            {
                date: new Date(Date.now() - 3*24*60*60*1000),
                result: 'victory',
                difficulty: 'normal',
                score: 22, // Formato anterior
                errors: 1, // Formato anterior
                time: 245   // Formato anterior
            }
        ];
        
        localStorage.setItem(HISTORY_KEY, JSON.stringify(sampleHistory));
        console.log("Datos de historial de prueba agregados:", sampleHistory);
        
        // También agregar algunas estadísticas de muestra
        const sampleStats = {
            gamesPlayed: 15,
            gamesWon: 8,
            gamesLostByErrors: 4,
            gamesLostByTimeout: 3,
            totalCorrectAnswers: 285,
            totalIncorrectAnswers: 45,
            totalPassedAnswers: 12,
            totalHelpUsed: 8,
            bestScore: 26,
            fastestWinTime: 180
        };
        
        localStorage.setItem(STATS_KEY, JSON.stringify(sampleStats));
        console.log("Estadísticas de prueba agregadas:", sampleStats);
    }
});

// Esta función ya está incluida en displayProfileData()

// <<<--- INICIO NUEVA FUNCIÓN loadAchievementsCount --- >>>
function loadAchievementsCount() {
    const achievementsElement = document.getElementById('stats-totalAchievements');
    if (!achievementsElement) {
        console.warn('Elemento stats-totalAchievements no encontrado en profile.html');
        return;
    }

    if (window.CrackTotalLogrosAPI && typeof window.CrackTotalLogrosAPI.cargarLogros === 'function') {
        try {
            const todosLosLogrosGuardados = window.CrackTotalLogrosAPI.cargarLogros();
            let unlockedCount = 0;
            for (const logroId in todosLosLogrosGuardados) {
                if (todosLosLogrosGuardados[logroId] && todosLosLogrosGuardados[logroId].unlocked) {
                    unlockedCount++;
                }
            }
            achievementsElement.textContent = unlockedCount;
        } catch (error) {
            console.error("Error al cargar o contar los logros:", error);
            achievementsElement.textContent = 'Error';
        }
    } else {
        console.warn('CrackTotalLogrosAPI no está disponible. No se puede cargar el contador de logros. Asegúrate de que logros.js se carga ANTES que profile.js y en la página profile.html.');
        achievementsElement.textContent = 'N/A'; 
        // Podrías intentar cargar logros.js dinámicamente aquí si fuera necesario,
        // pero es mejor asegurar el orden de carga en el HTML.
    }
}
// <<<--- FIN NUEVA FUNCIÓN loadAchievementsCount --- >>>

// Esta función ya está incluida en displayProfileData()

// Función para cargar estadísticas de Quién Sabe Más desde Firebase
async function loadQuienSabeMasStats() {
    // Asegurar que los elementos existan
    const elements = {
        gamesPlayed: document.getElementById('stats-qsm-gamesPlayed'),
        gamesWon: document.getElementById('stats-qsm-gamesWon'),
        gamesLost: document.getElementById('stats-qsm-gamesLost'),
        averageAccuracy: document.getElementById('stats-qsm-averageAccuracy'),
        bestScore: document.getElementById('stats-qsm-bestScore'),
        totalScore: document.getElementById('stats-qsm-totalScore')
    };

    // Valores por defecto
    let defaultStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        averageAccuracy: 0,
        bestScore: 0,
        totalScore: 0
    };

    try {
        // Intentar cargar desde Firebase
        const { getUserId } = await import('./firebase-utils.js');
        const { db } = await import('./firebase-init.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const userId = await getUserId();
        if (userId && db) {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const qsmStats = userData.stats?.quiensabemas || {};
                
                defaultStats = {
                    gamesPlayed: qsmStats.played || 0,
                    gamesWon: qsmStats.wins || 0,
                    gamesLost: (qsmStats.played || 0) - (qsmStats.wins || 0),
                    averageAccuracy: qsmStats.played > 0 ? Math.round(((qsmStats.wins || 0) / qsmStats.played) * 100) : 0,
                    bestScore: qsmStats.score || 0, // Firebase guarda score total, no best score individual
                    totalScore: qsmStats.score || 0
                };
            }
        }
    } catch (error) {
        console.warn("Error cargando estadísticas de Quién Sabe Más desde Firebase:", error);
    }

    // Actualizar elementos con los datos obtenidos (de Firebase o por defecto)
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            switch(key) {
                case 'averageAccuracy':
                    elements[key].textContent = `${defaultStats[key]}%`;
                    break;
                default:
                    elements[key].textContent = defaultStats[key];
            }
        }
    });

    console.log("Estadísticas de Quién Sabe Más cargadas:", defaultStats);
}

// Función para cargar estadísticas de Mentiroso desde Firebase
async function loadMentirosoStats() {
    // Asegurar que los elementos existan
    const elements = {
        gamesPlayed: document.getElementById('stats-mentiroso-gamesPlayed'),
        gamesWon: document.getElementById('stats-mentiroso-gamesWon'),
        gamesLost: document.getElementById('stats-mentiroso-gamesLost'),
        averageAccuracy: document.getElementById('stats-mentiroso-averageAccuracy'),
        bestScore: document.getElementById('stats-mentiroso-bestScore'),
        totalScore: document.getElementById('stats-mentiroso-totalScore')
    };

    // Valores por defecto
    let defaultStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        averageAccuracy: 0,
        bestScore: 0,
        totalScore: 0
    };

    try {
        // Intentar cargar desde Firebase
        const { getUserId } = await import('./firebase-utils.js');
        const { db } = await import('./firebase-init.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const userId = await getUserId();
        if (userId && db) {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const mentirosoStats = userData.stats?.mentiroso || {};
                
                defaultStats = {
                    gamesPlayed: mentirosoStats.played || 0,
                    gamesWon: mentirosoStats.wins || 0,
                    gamesLost: (mentirosoStats.played || 0) - (mentirosoStats.wins || 0),
                    averageAccuracy: mentirosoStats.played > 0 ? Math.round(((mentirosoStats.wins || 0) / mentirosoStats.played) * 100) : 0,
                    bestScore: mentirosoStats.score || 0, // Firebase guarda score total, no best score individual
                    totalScore: mentirosoStats.score || 0
                };
            }
        }
    } catch (error) {
        console.warn("Error cargando estadísticas de Mentiroso desde Firebase:", error);
    }

    // Actualizar elementos con los datos obtenidos (de Firebase o por defecto)
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            switch(key) {
                case 'averageAccuracy':
                    elements[key].textContent = `${defaultStats[key]}%`;
                    break;
                default:
                    elements[key].textContent = defaultStats[key];
            }
        }
    });

    console.log("Estadísticas de Mentiroso cargadas:", defaultStats);
}

// Si main.js tiene funciones de utilidad como shareSite, asegúrate de que se cargue o define.
// window.shareSite = function() { ... } si no está globalmente disponible. 

function showLoadingStates() {
    // Add loading classes to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    const statValues = document.querySelectorAll('.stat-value');
    
    statCards.forEach(card => card.classList.add('loading'));
    statValues.forEach(value => value.classList.add('loading'));
    
    // Remove loading states after a delay to simulate data loading
    setTimeout(() => {
        hideLoadingStates();
    }, 800);
}

function hideLoadingStates() {
    const statCards = document.querySelectorAll('.stat-card');
    const statValues = document.querySelectorAll('.stat-value');
    
    statCards.forEach(card => card.classList.remove('loading'));
    statValues.forEach(value => value.classList.remove('loading'));
}

// === UTILITY FUNCTIONS ===

// Performance monitoring
function measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
}

// Enhanced error handling for statistics
function safeUpdateElement(elementId, value, fallback = 'N/A') {
    const element = document.getElementById(elementId);
    if (element) {
        try {
            element.textContent = value !== undefined && value !== null ? value : fallback;
            element.classList.remove('error');
        } catch (error) {
            console.warn(`Error updating element ${elementId}:`, error);
            element.textContent = fallback;
            element.classList.add('error');
        }
    } else {
        console.warn(`Element with ID ${elementId} not found`);
    }
}

// Check if localStorage is available
function isLocalStorageAvailable() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.warn('localStorage is not available:', e);
        return false;
    }
}

// Enhanced statistics loading with fallbacks
function loadStatsWithFallback(key, defaultStats, parser = JSON.parse) {
    if (!isLocalStorageAvailable()) {
        console.warn('localStorage not available, using default stats');
        return defaultStats;
    }
    
    try {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = parser(data);
            return { ...defaultStats, ...parsed };
        }
    } catch (error) {
        console.error(`Error loading stats for ${key}:`, error);
        localStorage.removeItem(key);
    }
    
    return defaultStats;
}

// Animate statistics updates
function animateStatValue(elementId, newValue, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const difference = newValue - currentValue;
    const steps = Math.max(30, Math.abs(difference));
    const stepValue = difference / steps;
    const stepDuration = duration / steps;
    
    let current = currentValue;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        current += stepValue;
        
        if (step >= steps) {
            clearInterval(timer);
            element.textContent = newValue;
        } else {
            element.textContent = Math.round(current);
        }
    }, stepDuration);
}

// Export functions for potential use in other modules
if (typeof window !== 'undefined') {
    window.ProfileUtils = {
        measurePerformance,
        safeUpdateElement,
        isLocalStorageAvailable,
        loadStatsWithFallback,
        animateStatValue
    };
}

// Función para cargar estadísticas de Crack Rápido desde Firebase
async function loadCrackRapidoFirebaseStats() {
    // Asegurar que los elementos existan
    const elements = {
        gamesPlayed: document.getElementById('stats-crackrapido-gamesPlayed'),
        bestScore: document.getElementById('stats-crackrapido-bestScore'),
        totalCorrect: document.getElementById('stats-crackrapido-totalCorrect'),
        bestStreak: document.getElementById('stats-crackrapido-bestStreak'),
        averageAccuracy: document.getElementById('stats-crackrapido-averageAccuracy'),
        averageSpeed: document.getElementById('stats-crackrapido-averageSpeed')
    };

    // Valores por defecto (primero cargar desde localStorage)
    let defaultStats = loadCrackRapidoStats();

    try {
        // Intentar cargar desde Firebase
        const { getUserId } = await import('./firebase-utils.js');
        const { db } = await import('./firebase-init.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const userId = await getUserId();
        if (userId && db) {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const crackRapidoStats = userData.stats?.crackrapido || {};
                
                // Combinar datos de Firebase con localStorage (priorizar el máximo)
                defaultStats = {
                    gamesPlayed: Math.max(defaultStats.gamesPlayed, crackRapidoStats.played || 0),
                    bestScore: Math.max(defaultStats.bestScore, crackRapidoStats.score || 0),
                    totalCorrect: Math.max(defaultStats.totalCorrect, crackRapidoStats.totalCorrect || 0),
                    bestStreak: Math.max(defaultStats.bestStreak, crackRapidoStats.bestStreak || 0)
                };
            }
        }
    } catch (error) {
        console.warn("Error cargando estadísticas de Crack Rápido desde Firebase:", error);
    }

    // Actualizar elementos con los datos obtenidos (de Firebase/localStorage o por defecto)
    if (elements.gamesPlayed) elements.gamesPlayed.textContent = defaultStats.gamesPlayed;
    if (elements.bestScore) elements.bestScore.textContent = defaultStats.bestScore;
    if (elements.totalCorrect) elements.totalCorrect.textContent = defaultStats.totalCorrect;
    if (elements.bestStreak) elements.bestStreak.textContent = defaultStats.bestStreak;
    
    // Calculate derived statistics
    const averageAccuracy = defaultStats.gamesPlayed > 0 ? 
        Math.round((defaultStats.totalCorrect / (defaultStats.gamesPlayed * 20)) * 100) : 0;
    if (elements.averageAccuracy) elements.averageAccuracy.textContent = `${averageAccuracy}%`;
    
    // Estimate average speed (more realistic calculation)
    const averageSpeed = defaultStats.totalCorrect > 0 ? 
        Math.max(1.5, 5 - (defaultStats.bestStreak * 0.1)) : 5.0;
    if (elements.averageSpeed) elements.averageSpeed.textContent = `${averageSpeed.toFixed(1)}s`;

    console.log("Estadísticas de Crack Rápido cargadas (Firebase + localStorage):", defaultStats);
    return defaultStats;
} 