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

    // Cargar y mostrar estadísticas de Pasala Che
    loadPasalacheStats();
    loadPasalacheHistory(); // Cargar historial si existe esa función
    loadAchievementsCount(); // <<< NUEVA FUNCIÓN PARA CONTAR LOGROS

    const resetStatsButton = document.getElementById('resetStatsButton');
    if (resetStatsButton) {
        resetStatsButton.addEventListener('click', function() {
            // Confirmación antes de borrar
            if (confirm('¿Estás seguro de que quieres borrar TODAS tus estadísticas de Pasala Che? Esta acción no se puede deshacer.')) {
                localStorage.removeItem('pasalacheUserStats');
                localStorage.removeItem('pasalacheGameHistory');
                // Opcionalmente, también podrías querer resetear los logros aquí:
                // if (confirm('¿También quieres borrar TODOS tus logros desbloqueados?')) {
                //     localStorage.removeItem('pasalacheUserAchievements');
                // }
                loadPasalacheStats(); // Recargar para mostrar stats reseteados
                loadPasalacheHistory();
                loadAchievementsCount(); // Recargar contador de logros
                alert('Estadísticas de Pasala Che borradas.');
            }
        });
    }
});

function loadPasalacheStats() {
    const STATS_KEY = 'pasalacheUserStats';
    const defaultStats = {
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

    const statsJson = localStorage.getItem(STATS_KEY);
    const stats = statsJson ? { ...defaultStats, ...JSON.parse(statsJson) } : { ...defaultStats };

    document.getElementById('stats-gamesPlayed').textContent = stats.gamesPlayed;
    document.getElementById('stats-gamesWon').textContent = stats.gamesWon;
    const totalLost = (stats.gamesLostByErrors || 0) + (stats.gamesLostByTimeout || 0);
    document.getElementById('stats-gamesLost').textContent = totalLost;
    
    let averageAccuracy = 0;
    const totalAnsweredGames = stats.totalCorrectAnswers + stats.totalIncorrectAnswers;
    if (totalAnsweredGames > 0) {
        averageAccuracy = Math.round((stats.totalCorrectAnswers / totalAnsweredGames) * 100);
    }
    document.getElementById('stats-averageAccuracy').textContent = `${averageAccuracy}%`;
    
    document.getElementById('stats-bestScore').textContent = stats.bestScore;
    
    if (stats.fastestWinTime !== null && stats.fastestWinTime !== undefined) {
        const minutes = Math.floor(stats.fastestWinTime / 60);
        const seconds = stats.fastestWinTime % 60;
        document.getElementById('stats-fastestWinTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
        document.getElementById('stats-fastestWinTime').textContent = '--:--';
    }
    
    document.getElementById('stats-totalCorrect').textContent = stats.totalCorrectAnswers;
    document.getElementById('stats-totalIncorrect').textContent = stats.totalIncorrectAnswers;
    document.getElementById('stats-totalHelpUsed').textContent = stats.totalHelpUsed;
}

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

function loadPasalacheHistory() {
    const HISTORY_KEY = 'pasalacheGameHistory';
    const historyBody = document.getElementById('gameHistoryBody');
    if (!historyBody) return;

    const historyJson = localStorage.getItem(HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];

    if (history.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-light);">No hay historial de partidas todavía. ¡A jugar!</td></tr>';
        return;
    }

    historyBody.innerHTML = ''; // Clear loading/default message

    history.forEach(game => {
        const row = historyBody.insertRow();
        
        const dateCell = row.insertCell();
        dateCell.textContent = game.timestamp ? new Date(game.timestamp).toLocaleDateString('es-ES') : 'Fecha desc.';

        const resultCell = row.insertCell();
        resultCell.textContent = game.result || 'Resultado desc.';
        if (game.result === 'victory') {
            resultCell.style.color = 'var(--success)'; 
        } else if (game.result === 'defeat' || game.result === 'timeout') {
            resultCell.style.color = 'var(--danger)';
        }

        const difficultyCell = row.insertCell();
        difficultyCell.textContent = game.difficulty || 'Normal'; 

        const correctCell = row.insertCell();
        correctCell.textContent = game.correctAnswers !== undefined ? game.correctAnswers : '-';

        const errorsCell = row.insertCell();
        errorsCell.textContent = game.incorrectAnswers !== undefined ? game.incorrectAnswers : '-';

        const timeCell = row.insertCell();
        timeCell.textContent = game.timeSpentFormatted || '--:--';
    });
}

// Si main.js tiene funciones de utilidad como shareSite, asegúrate de que se cargue o define.
// window.shareSite = function() { ... } si no está globalmente disponible. 