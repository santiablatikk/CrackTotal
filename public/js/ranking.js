/**
 * ranking.js - Gestión del ranking global
 * Optimizado para rendimiento y experiencia móvil
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Ranking.js cargado y DOM listo.');

    // Detectar entorno
    const isMobile = window.browserFeatures?.mobile || 
                    window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    
    // Configuración
    const config = {
        apiEndpoint: '/api/ranking',
        pageSize: isMobile ? 50 : 100,
        dateFormat: {
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        },
        loadingTimeout: 10000 // 10 segundos máximo para cargar datos
    };
    
    // Referencias DOM
    const container = document.getElementById('ranking-table-container');
    if (!container) {
        console.error('Error: No se encontró el contenedor para la tabla del ranking (#ranking-table-container).');
        return;
    }

    // --- Verificar disponibilidad de GameData (opcional) ---
    if (typeof GameData === 'undefined') {
        console.warn('Advertencia: GameData no está definido. El ranking se cargará desde la API, pero otras funcionalidades podrían fallar.');
    }

    // Mostrar indicador de carga
    showLoading();
    
    // Configurar timeout para manejar fallos de carga
    const loadingTimeout = setTimeout(() => {
        if (container.querySelector('.loading-indicator')) {
            handleLoadingError(new Error('Tiempo de espera agotado'));
        }
    }, config.loadingTimeout);

    // Cargar datos del ranking
    fetchRankingData()
        .then(ranking => {
            clearTimeout(loadingTimeout);
            if (ranking && ranking.length > 0) {
                renderRankingTable(ranking);
            } else {
                showEmptyRanking();
            }
        })
        .catch(error => {
            clearTimeout(loadingTimeout);
            handleLoadingError(error);
        });

    /**
     * Muestra el indicador de carga
     */
    function showLoading() {
        container.innerHTML = `
            <div class="loading-indicator">
                <p><i class="fas fa-spinner fa-spin"></i> Cargando ranking global...</p>
            </div>
        `;
    }
    
    /**
     * Muestra mensaje cuando el ranking está vacío
     */
    function showEmptyRanking() {
        container.innerHTML = `
            <div class="empty-ranking">
                <p>El ranking global está vacío. ¡Sé el primero en aparecer!</p>
                <a href="game.html" class="btn btn-primary">Jugar ahora</a>
            </div>
        `;
    }
    
    /**
     * Maneja errores de carga
     */
    function handleLoadingError(error) {
        console.error('Error al cargar o mostrar el ranking global desde la API:', error);
        container.innerHTML = `
            <div class="error-message">
                <p><i class="fas fa-exclamation-triangle"></i> Ocurrió un error al cargar el ranking global: ${error.message}</p>
                <button class="btn btn-retry" onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }

    /**
     * Obtiene los datos del ranking desde la API
     */
    async function fetchRankingData() {
        const response = await fetch(config.apiEndpoint);
        
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('La respuesta de la API no es un array válido.');
        }
        
        console.log(`Ranking global obtenido: ${data.length} entradas.`);

        const dataParsed = [...data];

        // Para cada ítem, formatear la fecha para que sea más legible
        dataParsed.forEach(item => {
            if (item.timestamp) {
                try {
                    // Verificar si timestamp es válido
                    const date = new Date(parseInt(item.timestamp));
                    if (!isNaN(date.getTime())) {
                        const options = { year: 'numeric', month: 'short', day: 'numeric' };
                        item.formattedDate = date.toLocaleDateString('es-ES', options);
                        item.title = `Jugado el ${date.toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}`;
                    } else {
                        // Fecha inválida
                        item.formattedDate = "Fecha reciente";
                        item.title = "Fecha exacta no disponible";
                        item.dateInvalid = true;
                    }
                } catch (e) {
                    // Error al procesar la fecha
                    item.formattedDate = "Fecha reciente";
                    item.title = "Fecha exacta no disponible";
                    item.dateInvalid = true;
                }
            } else {
                // No hay timestamp
                item.formattedDate = "Fecha reciente";
                item.title = "Fecha exacta no disponible";
                item.dateInvalid = true;
            }
        });

        return dataParsed;
    }

    /**
     * Renderiza la tabla de ranking
     */
    function renderRankingTable(ranking) {
        // Crear tabla para mostrar el ranking
        const table = document.createElement('table');
        table.className = 'ranking-table';

        // Crear encabezado adaptado a móvil/escritorio
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        
        // Columnas a mostrar (adaptadas según dispositivo)
        const columns = isMobile 
            ? ['#', 'Jugador', 'Puntuación', 'Fecha', 'Correctas'] // Menos columnas en móvil
            : ['#', 'Jugador', 'Puntuación', 'Fecha', 'Dificultad', 'Resultado', 'Correctas', 'Tiempo'];
        
        columns.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        // Cuerpo de la tabla
        const tbody = table.createTBody();
        
        // Renderizar cada fila del ranking
        ranking.forEach((item, index) => {
            const row = tbody.insertRow();
            row.style.setProperty('--row-index', index);

            // Añadir clases para los 3 primeros puestos
            if (index === 0) row.classList.add('rank-gold');
            else if (index === 1) row.classList.add('rank-silver');
            else if (index === 2) row.classList.add('rank-bronze');

            // Renderizar el contenido celda por celda
            renderPositionCell(row, index);
            renderPlayerCell(row, item);
            renderScoreCell(row, item);
            renderDateCell(row, item);
            
            // Columnas adicionales solo para escritorio
            if (!isMobile) {
                renderDifficultyCell(row, item);
                renderResultCell(row, item);
            }
            
            renderCorrectCell(row, item);
            
            // Columna de tiempo solo para escritorio
            if (!isMobile) {
                renderTimeCell(row, item);
            }
        });

        // Limpiar el contenedor y añadir la tabla
        container.innerHTML = ''; 
        container.appendChild(table);
        
        // Aplicar animación para entrada de filas
        setTimeout(() => {
            document.querySelectorAll('.ranking-table tr').forEach((row, i) => {
                row.style.animationDelay = `${i * 50}ms`;
                row.classList.add('fade-in');
            });
        }, 100);
        
        console.log('Tabla de ranking global creada y añadida a la página.');
    }
    
    /**
     * Renderiza celda de posición
     */
    function renderPositionCell(row, index) {
        const cell = row.insertCell();
        cell.setAttribute('data-label', 'Posición');
        cell.classList.add('rank-position');
        
        if (index < 3) {
            let iconClass = '';
            if (index === 0) iconClass = 'fas fa-trophy rank-icon-gold';
            if (index === 1) iconClass = 'fas fa-medal rank-icon-silver';
            if (index === 2) iconClass = 'fas fa-award rank-icon-bronze';
            cell.innerHTML = `<div class="ranking-position"><i class="${iconClass}"></i> ${index + 1}</div>`;
        } else {
            cell.innerHTML = `<div class="ranking-position">${index + 1}</div>`;
        }
    }
    
    /**
     * Renderiza celda de jugador
     */
    function renderPlayerCell(row, item) {
        const cell = row.insertCell();
        cell.setAttribute('data-label', 'Jugador');
        cell.innerHTML = `
            <div class="player-name">
                <div class="player-avatar"><i class="fas fa-user"></i></div>
                <span>${item.name || 'Anónimo'}</span>
            </div>
        `;
    }
    
    /**
     * Renderiza celda de puntuación
     */
    function renderScoreCell(row, item) {
        const cell = row.insertCell();
        cell.setAttribute('data-label', 'Puntuación');
        cell.innerHTML = `<div class="player-score">${item.score !== undefined ? item.score : 'N/A'}</div>`;
    }
    
    /**
     * Renderiza celda de fecha con manejo mejorado
     */
    function renderDateCell(row, item) {
        const cell = row.insertCell();
        cell.setAttribute('data-label', 'Fecha');
        
        // Aplicar clases a la celda
        cell.classList.add('date');
        if (item.dateInvalid) {
            cell.classList.add('date-invalid');
        }
        
        // Establecer el contenido y el título
        cell.textContent = item.formattedDate || 'Fecha reciente';
        if (item.title) {
            cell.setAttribute('title', item.title);
        }
    }
    
    /**
     * Renderiza celda de dificultad
     */
    function renderDifficultyCell(row, item) {
        const cell = row.insertCell();
        cell.setAttribute('data-label', 'Dificultad');
        
        // Determinar la clase CSS según dificultad
        let difficultyClass = 'difficulty-normal';
        if (item.difficulty === 'facil') difficultyClass = 'difficulty-easy';
        if (item.difficulty === 'dificil') difficultyClass = 'difficulty-hard';
        
        cell.innerHTML = `<div class="difficulty-label ${difficultyClass}">${item.difficulty || 'Normal'}</div>`;
    }
    
    /**
     * Renderiza celda de resultado
     */
    function renderResultCell(row, item) {
        const cell = row.insertCell();
        cell.setAttribute('data-label', 'Resultado');
        
        if (item.victory !== undefined) { 
            cell.innerHTML = item.victory 
                ? '<div class="victory-label"><i class="fas fa-check-circle"></i> Victoria</div>' 
                : '<div class="defeat-label"><i class="fas fa-times-circle"></i> Derrota</div>';
            cell.className = item.victory ? 'result-victory' : 'result-defeat';
        } else {
            cell.innerHTML = '<div class="no-result">-</div>';
        }
    }
    
    /**
     * Renderiza celda de respuestas correctas
     */
    function renderCorrectCell(row, item) {
        const cell = row.insertCell();
        cell.setAttribute('data-label', 'Correctas');
        cell.innerHTML = `<div class="correct-count">${item.correct !== undefined ? item.correct : '-'}</div>`;
    }
    
    /**
     * Renderiza celda de tiempo
     */
    function renderTimeCell(row, item) {
        const cell = row.insertCell();
        cell.setAttribute('data-label', 'Tiempo');
        cell.innerHTML = `<div class="time-used">${item.timeUsed !== undefined ? `${item.timeUsed}s` : '-'}</div>`;
    }
}); 