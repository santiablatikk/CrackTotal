document.addEventListener('DOMContentLoaded', function() {
    const STATS_KEY = 'pasalacheUserStats';
    const HISTORY_KEY = 'pasalacheGameHistory'; // Clave del historial

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
        if (historyJson) {
            try {
                return JSON.parse(historyJson);
            } catch (e) {
                console.error("Error parsing game history:", e);
                localStorage.removeItem(HISTORY_KEY); 
                return [];
            }
        } else {
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
            historyTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-light);">No hay partidas en el historial.</td></tr>';
        } else {
            history.forEach(game => {
                const row = historyTableBody.insertRow();
                
                // Formatear fecha para legibilidad
                const gameDate = new Date(game.date);
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

                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td class="${resultClass}">${resultText}</td>
                    <td class="history-difficulty">${game.difficulty || 'normal'}</td>
                    <td>${game.score}</td>
                    <td>${game.errors}</td>
                    <td>${formatTime(game.time)}</td>
                `;
            });
        }
    }

    // --- Lógica para el botón de restablecer --- 
    const resetButton = document.getElementById('resetStatsButton');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres borrar TODAS tus estadísticas e historial de Pasala Che? Esta acción no se puede deshacer.')) {
                localStorage.removeItem(STATS_KEY);
                localStorage.removeItem(HISTORY_KEY); // Borrar también el historial
                // Mostrar las estadísticas e historial reseteados
                displayProfileData(); 
                alert('¡Estadísticas e historial restablecidos!');
            }
        });
    }

    // --- Mostrar datos al cargar la página --- 
    displayProfileData();

    // Cargar estadísticas de todos los juegos
    loadQuienSabeMasStats();
    loadMentirosoStats();
    loadAchievementsCount();
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