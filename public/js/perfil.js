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

    // Añadir listeners para botones si es necesario (ej. compartir, aunque ya está en footer)
    // El botón de tema ya debería funcionar gracias a main.js
    // El botón de compartir ya debería funcionar si está incluido global-footer.js o similar

}); 