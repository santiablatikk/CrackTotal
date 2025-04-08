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
                rankCell.textContent = index + 1;
                rankCell.classList.add('rank-position');
                if (index < 3) {
                  let iconClass = '';
                  if (index === 0) iconClass = 'fas fa-trophy rank-icon-gold';
                  if (index === 1) iconClass = 'fas fa-medal rank-icon-silver';
                  if (index === 2) iconClass = 'fas fa-award rank-icon-bronze';
                  rankCell.innerHTML = `<i class="${iconClass}"></i> ${index + 1}`;
                }

                row.insertCell().textContent = item.name || 'Anónimo';
                row.insertCell().textContent = item.score !== undefined ? item.score : 'N/A'; // Puntuación

                const dateCell = row.insertCell();
                try {
                    const date = new Date(item.date);
                    dateCell.textContent = date.toLocaleString('es-ES', { 
                        day: '2-digit', month: '2-digit', year: 'numeric'
                    }); // Solo fecha para ranking global
                } catch (e) {
                    dateCell.textContent = 'Fecha inválida';
                }
                
                row.insertCell().textContent = item.difficulty || 'Normal';
                
                const resultCell = row.insertCell();
                 // Asumiendo que 'victory' está en los datos, si no, se puede omitir esta columna
                if (item.victory !== undefined) { 
                    resultCell.innerHTML = item.victory 
                        ? '<span class="victory-label"><i class="fas fa-check-circle"></i></span>' 
                        : '<span class="defeat-label"><i class="fas fa-times-circle"></i></span>';
                    resultCell.className = item.victory ? 'result-victory' : 'result-defeat';
                    resultCell.style.textAlign = 'center'; // Centrar icono
                } else {
                     resultCell.textContent = '-';
                }

                row.insertCell().textContent = item.correct !== undefined ? item.correct : '-';
                row.insertCell().textContent = item.timeUsed !== undefined ? `${item.timeUsed}s` : '-';
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