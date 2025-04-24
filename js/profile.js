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
                        resultText = 'Derrota (Errores)'; 
                        resultClass = 'history-result-defeat';
                        break;
                    case 'timeout': 
                        resultText = 'Derrota (Tiempo)'; 
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

}); 