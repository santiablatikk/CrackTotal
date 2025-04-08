document.addEventListener('DOMContentLoaded', () => {
    console.log('Ranking.js cargado y DOM listo.');

    // --- Verificar si GameData está disponible (ya no es estrictamente necesario para el ranking, pero puede ser útil para otras cosas) ---
    if (typeof GameData === 'undefined') {
        console.warn('Advertencia: GameData no está definido. El ranking se cargará desde la API, pero otras funcionalidades podrían fallar.');
    }

    const container = document.getElementById('ranking-table-container');
    if (!container) {
        console.error('Error: No se encontró el contenedor para la tabla del historial (#ranking-table-container).');
        return;
    }

    // --- Cargar Historial/Ranking Global desde la API ---
    container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Cargando ranking global...</p>'; // Mensaje de carga

    fetch('/api/ranking')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(ranking => {
            console.log(`Ranking global obtenido: ${ranking.length} entradas.`);

            if (!Array.isArray(ranking)) {
                 throw new Error('La respuesta de la API no es un array válido.');
            }

            if (ranking.length === 0) {
                container.innerHTML = '<p>El ranking global está vacío. ¡Sé el primero en aparecer!</p>';
                return;
            }

            // Crear tabla para mostrar el ranking
            const table = document.createElement('table');
            table.className = 'ranking-table'; // Reutilizamos la clase CSS

            // Crear encabezado de la tabla
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            // Ajustamos columnas para ranking global
            ['#', 'Jugador', 'Puntuación', 'Fecha', 'Dificultad', 'Resultado', 'Correctas', 'Tiempo'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });

            // Crear cuerpo de la tabla con los datos del ranking
            const tbody = table.createTBody();
            ranking.forEach((item, index) => {
                const row = tbody.insertRow();
                row.style.setProperty('--row-index', index);

                // Añadir clase para Top 3
                if (index === 0) {
                    row.classList.add('rank-gold');
                } else if (index === 1) {
                    row.classList.add('rank-silver');
                } else if (index === 2) {
                    row.classList.add('rank-bronze');
                }

                // Columna # (Posición)
                const rankCell = row.insertCell();
                rankCell.setAttribute('data-label', 'Posición');
                rankCell.classList.add('rank-position');
                if (index < 3) {
                  let iconClass = '';
                  if (index === 0) iconClass = 'fas fa-trophy rank-icon-gold';
                  if (index === 1) iconClass = 'fas fa-medal rank-icon-silver';
                  if (index === 2) iconClass = 'fas fa-award rank-icon-bronze';
                  rankCell.innerHTML = `<div class="ranking-position"><i class="${iconClass}"></i> ${index + 1}</div>`;
                } else {
                  rankCell.innerHTML = `<div class="ranking-position">${index + 1}</div>`;
                }

                // Jugador
                const playerCell = row.insertCell();
                playerCell.setAttribute('data-label', 'Jugador');
                playerCell.innerHTML = `
                  <div class="player-name">
                    <div class="player-avatar"><i class="fas fa-user"></i></div>
                    <span>${item.name || 'Anónimo'}</span>
                  </div>
                `;

                // Puntuación
                const scoreCell = row.insertCell();
                scoreCell.setAttribute('data-label', 'Puntuación');
                scoreCell.innerHTML = `<div class="player-score">${item.score !== undefined ? item.score : 'N/A'}</div>`;

                // Fecha
                const dateCell = row.insertCell();
                dateCell.setAttribute('data-label', 'Fecha');
                try {
                    // Primero verificamos si la fecha es válida
                    if (!item.date) {
                        throw new Error('Fecha no disponible');
                    }
                    
                    const date = new Date(item.date);
                    
                    // Verificar si la fecha es válida (Invalid Date dará NaN al usar getTime())
                    if (isNaN(date.getTime())) {
                        throw new Error('Fecha inválida');
                    }
                    
                    // Formatear la fecha con opciones localizadas
                    dateCell.innerHTML = `<div class="score-date">${date.toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>`;
                } catch (e) {
                    // En caso de error, mostramos un mensaje amigable
                    console.warn(`Error al formatear fecha: ${e.message}`, item.date);
                    
                    // Si hay una fecha en timestamp, intentamos usarla
                    if (item.timestamp) {
                        try {
                            const timestampDate = new Date(parseInt(item.timestamp));
                            if (!isNaN(timestampDate.getTime())) {
                                dateCell.innerHTML = `<div class="score-date">${timestampDate.toLocaleDateString('es-ES', {
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</div>`;
                                return;
                            }
                        } catch (err) {
                            console.warn('Error al usar timestamp alternativo', err);
                        }
                    }
                    
                    // Si no hay fecha o no se pudo formatear, mostramos "Fecha reciente" en lugar de la fecha actual
                    dateCell.innerHTML = `<div class="score-date">Fecha reciente</div>`;
                    dateCell.title = "La fecha exacta no está disponible";
                    dateCell.style.color = "rgba(255, 255, 255, 0.5)";
                }
                
                // Dificultad
                const difficultyCell = row.insertCell();
                difficultyCell.setAttribute('data-label', 'Dificultad');
                difficultyCell.innerHTML = `<div class="difficulty-label">${item.difficulty || 'Normal'}</div>`;
                
                // Resultado
                const resultCell = row.insertCell();
                resultCell.setAttribute('data-label', 'Resultado');
                // Asumiendo que 'victory' está en los datos, si no, se puede omitir esta columna
                if (item.victory !== undefined) { 
                    resultCell.innerHTML = item.victory 
                        ? '<div class="victory-label"><i class="fas fa-check-circle"></i> Victoria</div>' 
                        : '<div class="defeat-label"><i class="fas fa-times-circle"></i> Derrota</div>';
                    resultCell.className = item.victory ? 'result-victory' : 'result-defeat';
                } else {
                     resultCell.innerHTML = '<div class="no-result">-</div>';
                }

                // Correctas
                const correctCell = row.insertCell();
                correctCell.setAttribute('data-label', 'Correctas');
                correctCell.innerHTML = `<div class="correct-count">${item.correct !== undefined ? item.correct : '-'}</div>`;
                
                // Tiempo
                const timeCell = row.insertCell();
                timeCell.setAttribute('data-label', 'Tiempo');
                timeCell.innerHTML = `<div class="time-used">${item.timeUsed !== undefined ? `${item.timeUsed}s` : '-'}</div>`;
            });

            // Limpiar contenedor y añadir tabla
            container.innerHTML = ''; 
            container.appendChild(table);
            console.log('Tabla de ranking global creada y añadida a la página.');

        })
        .catch(error => {
            console.error('Error al cargar o mostrar el ranking global desde la API:', error);
            container.innerHTML = `<p class="error-message">Ocurrió un error al cargar el ranking global: ${error.message}</p>`;
        });

    // Añadir listeners para botones si es necesario
    // Los botones de navegación y tema ya deberían funcionar

}); 