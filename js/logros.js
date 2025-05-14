document.addEventListener('DOMContentLoaded', () => {
    const logrosContainer = document.getElementById('logrosContainer');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const LOGROS_KEY = 'pasalacheUserAchievements';
    let currentFilter = 'all';

    // --- Definición de Logros ---
    const todosLosLogros = [
        // Iniciación y Progreso General
        { id: 'partida_1', title: 'El Comienzo del Viaje', description: 'Juega tu primera partida de Pasala Che.', icon: 'fa-play-circle', category: 'progreso' },
        { id: 'partida_5', title: 'Calentando Motores', description: 'Completa 5 partidas de Pasala Che.', icon: 'fa-fire', category: 'progreso' },
        { id: 'partida_25', title: 'Habitué del Rosco', description: 'Completa 25 partidas de Pasala Che.', icon: 'fa-star', category: 'progreso' },
        { id: 'partida_100', title: 'Maestro Consagrado', description: 'Completa 100 partidas de Pasala Che.', icon: 'fa-chess-king', category: 'progreso' },
        { id: 'victoria_1', title: '¡Mi Primera Victoria!', description: 'Gana tu primera partida completando el rosco.', icon: 'fa-trophy', category: 'victoria' },
        { id: 'racha_2', title: 'Racha Ganadora (x2)', description: 'Gana 2 partidas seguidas.', icon: 'fa-angle-double-up', category: 'victoria' },
        { id: 'racha_5', title: 'Imparable (x5)', description: 'Gana 5 partidas seguidas.', icon: 'fa-meteor', category: 'victoria' },
        { id: 'racha_10', title: 'Leyenda Invicta (x10)', description: 'Gana 10 partidas seguidas.', icon: 'fa-crown', category: 'victoria' },
        // Puntuación y Aciertos
        { id: 'aciertos_10', title: 'Diez de Oro', description: 'Consigue 10 aciertos en una sola partida.', icon: 'fa-check', category: 'puntuacion' },
        { id: 'aciertos_15', title: 'Quince Precisos', description: 'Consigue 15 aciertos en una sola partida.', icon: 'fa-check-double', category: 'puntuacion' },
        { id: 'aciertos_20', title: 'Veinte Impecables', description: 'Consigue 20 aciertos en una sola partida.', icon: 'fa-clipboard-check', category: 'puntuacion' },
        { id: 'aciertos_25', title: 'Casi Perfecto (25)', description: 'Consigue 25 aciertos en una sola partida.', icon: 'fa-bullseye', category: 'puntuacion' },
        { id: 'rosco_completo', title: 'Rosco Completo', description: 'Completa el rosco con 27 aciertos.', icon: 'fa-circle-notch fa-spin', category: 'puntuacion' },
        { id: 'total_aciertos_100', title: 'Coleccionista (100)', description: 'Acumula 100 aciertos totales en tu historial.', icon: 'fa-certificate', category: 'puntuacion' },
        { id: 'total_aciertos_500', title: 'Erudito (500)', description: 'Acumula 500 aciertos totales.', icon: 'fa-book-reader', category: 'puntuacion' },
        { id: 'total_aciertos_1000', title: 'Enciclopedia (1000)', description: 'Acumula 1000 aciertos totales.', icon: 'fa-brain', category: 'puntuacion' },
        // Dificultad y Desafío
        { id: 'victoria_facil', title: 'Paseo Triunfal', description: 'Gana una partida en dificultad Fácil.', icon: 'fa-smile-beam', category: 'desafio' },
        { id: 'victoria_normal', title: 'Desafío Superado', description: 'Gana una partida en dificultad Normal.', icon: 'fa-meh', category: 'desafio' },
        { id: 'victoria_dificil', title: 'Conquistador Experto', description: 'Gana una partida en dificultad Difícil.', icon: 'fa-skull', category: 'desafio' },
        { id: 'victorias_dificil_5', title: 'Dominador Difícil', description: 'Gana 5 partidas en dificultad Difícil.', icon: 'fa-user-ninja', category: 'desafio' },
        { id: 'partida_perfecta', title: 'Partida Perfecta', description: 'Gana una partida sin cometer ningún error.', icon: 'fa-gem', category: 'desafio' },
        { id: 'sin_ayuda', title: 'Mente Brillante', description: 'Gana una partida sin usar ninguna ayuda (HELP).', icon: 'fa-lightbulb', category: 'desafio' },
        { id: 'victoria_rapida', title: 'A Contrarreloj', description: 'Gana una partida en menos de 120 segundos.', icon: 'fa-stopwatch-20', category: 'desafio' },
        { id: 'victoria_lenta', title: 'Pensador Profundo', description: 'Gana una partida usando más de 240 segundos (y gana).', icon: 'fa-hourglass-half', category: 'desafio' },
        // Misceláneos y Curiosos
        { id: 'pasa_50', title: 'Estratega del Pase', description: 'Usa la opción \'Pasala Che\' 50 veces en total.', icon: 'fa-fast-forward', category: 'miscelaneo' },
        { id: 'help_25', title: 'Buscador de Pistas', description: 'Utiliza el botón HELP 25 veces en total.', icon: 'fa-question-circle', category: 'miscelaneo' },
        { id: 'victoria_limite', title: 'Al Límite', description: 'Gana una partida con el máximo de errores permitidos.', icon: 'fa-exclamation-triangle', category: 'miscelaneo' },
        { id: 'victoria_agonica', title: 'Final Agónico', description: 'Gana una partida con menos de 10 segundos restantes.', icon: 'fa-bomb', category: 'miscelaneo' },
        { id: 'rey_a', title: 'Rey de la \'A\'', description: 'Responde correctamente 10 preguntas que comiencen con la letra \'A\'.', icon: 'fa-font', category: 'miscelaneo' },
        { id: 'corazon_valiente', title: 'Corazón Valiente', description: 'Pierde 10 partidas, ¡pero sigue intentándolo!', icon: 'fa-heartbeat', category: 'miscelaneo' }
    ];

    // --- Funciones de Estado de Logros ---
    function inicializarLogros() {
        const estadoLogros = {};
        todosLosLogros.forEach(logro => {
            estadoLogros[logro.id] = {
                unlocked: false,
                unlocked_at: null
            };
        });
        guardarLogros(estadoLogros);
        return estadoLogros;
    }

    function cargarLogros() {
        const guardados = localStorage.getItem(LOGROS_KEY);
        if (guardados) {
            const parsedLogros = JSON.parse(guardados);
            let actualizados = false;
            todosLosLogros.forEach(defLogro => {
                if (!parsedLogros[defLogro.id]) {
                    parsedLogros[defLogro.id] = { unlocked: false, unlocked_at: null };
                    actualizados = true;
                }
            });
            if (actualizados) {
                guardarLogros(parsedLogros);
            }
            return parsedLogros;
        }
        return inicializarLogros();
    }

    function guardarLogros(estadoLogros) {
        localStorage.setItem(LOGROS_KEY, JSON.stringify(estadoLogros));
    }

    // --- Renderizar Logros ---
    function renderizarLogros(filtro = 'all') {
        if (!logrosContainer) {
            console.warn("El contenedor de logros no se encontró en la página.");
            return;
        }
        logrosContainer.innerHTML = ''; 
        const estadoActualLogros = cargarLogros();
        let logrosFiltrados = todosLosLogros;

        if (filtro === 'unlocked') {
            logrosFiltrados = todosLosLogros.filter(logro => estadoActualLogros[logro.id]?.unlocked);
        } else if (filtro === 'locked') {
            logrosFiltrados = todosLosLogros.filter(logro => !estadoActualLogros[logro.id]?.unlocked);
        }

        if (logrosFiltrados.length === 0 && filtro !== 'all') {
            logrosContainer.innerHTML = `<p class="loading-logros">No hay logros que coincidan con este filtro.</p>`;
            return;
        }
        if (logrosFiltrados.length === 0 && filtro === 'all') { 
            logrosContainer.innerHTML = `<p class="loading-logros">No se encontraron logros. Intenta recargar.</p>`;
            return;
        }

        logrosFiltrados.forEach(logroDef => {
            const logroData = estadoActualLogros[logroDef.id] || { unlocked: false, unlocked_at: null };
            const isUnlocked = logroData.unlocked;
            const card = document.createElement('div');
            card.className = `logro-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            card.dataset.logroId = logroDef.id;

            const iconElement = document.createElement('div'); // Renombrado para evitar conflicto con logroDef.icon
            iconElement.className = 'logro-icon';
            iconElement.innerHTML = `<i class="fas ${logroDef.icon}"></i>`;

            const title = document.createElement('h3');
            title.className = 'logro-title';
            title.textContent = logroDef.title;

            const description = document.createElement('p');
            description.className = 'logro-description';
            description.textContent = logroDef.description;

            const status = document.createElement('div');
            status.className = 'logro-status';
            status.textContent = isUnlocked ? 'Desbloqueado' : 'Bloqueado';
            
            if (isUnlocked && logroData.unlocked_at) {
                const unlockedDate = new Date(logroData.unlocked_at).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                const dateP = document.createElement('p');
                dateP.className = 'logro-unlock-date';
                dateP.style.fontSize = '0.75rem';
                dateP.style.color = 'var(--text-muted)';
                dateP.style.marginTop = '0.5rem';
                dateP.innerHTML = `<i class="fas fa-check-circle"></i> ${unlockedDate}`;
                status.appendChild(dateP);
            }

            card.appendChild(iconElement); // Usar iconElement
            card.appendChild(title);
            card.appendChild(description);
            card.appendChild(status);
            logrosContainer.appendChild(card);
        });

        if (logrosContainer.innerHTML === '' && filtro === 'all') {
            logrosContainer.innerHTML = `<p class="loading-logros">Cargando tus hazañas...</p>`;
        }
    }

    // --- Manejo de Filtros ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderizarLogros(currentFilter);
        });
    });

    // --- Inicialización ---
    renderizarLogros(currentFilter);

    // --- Escuchar cambios en localStorage para actualizar la vista ---
    window.addEventListener('storage', function(event) {
        if (event.key === LOGROS_KEY) {
            console.log('Detectado cambio en localStorage de logros. Re-renderizando...');
            renderizarLogros(currentFilter);
        }
    });
});

const LOGROS_KEY_GLOBAL = 'pasalacheUserAchievements';

// Esta es la lista de definiciones que se necesita globalmente
// para que pasalache.js pueda acceder a los títulos para notificaciones, por ejemplo.
const todosLosLogrosDefGlobal = [
    { id: 'partida_1', title: 'El Comienzo del Viaje' }, { id: 'partida_5', title: 'Calentando Motores' }, 
    { id: 'partida_25', title: 'Habitué del Rosco' }, { id: 'partida_100', title: 'Maestro Consagrado' },
    { id: 'victoria_1', title: '¡Mi Primera Victoria!' }, { id: 'racha_2', title: 'Racha Ganadora (x2)' }, 
    { id: 'racha_5', title: 'Imparable (x5)' }, { id: 'racha_10', title: 'Leyenda Invicta (x10)' },
    { id: 'aciertos_10', title: 'Diez de Oro' }, { id: 'aciertos_15', title: 'Quince Precisos' }, 
    { id: 'aciertos_20', title: 'Veinte Impecables' }, { id: 'aciertos_25', title: 'Casi Perfecto (25)' },
    { id: 'rosco_completo', title: 'Rosco Completo' }, { id: 'total_aciertos_100', title: 'Coleccionista (100)' }, 
    { id: 'total_aciertos_500', title: 'Erudito (500)' }, { id: 'total_aciertos_1000', title: 'Enciclopedia (1000)' },
    { id: 'victoria_facil', title: 'Paseo Triunfal' }, { id: 'victoria_normal', title: 'Desafío Superado' }, 
    { id: 'victoria_dificil', title: 'Conquistador Experto' }, { id: 'victorias_dificil_5', title: 'Dominador Difícil' },
    { id: 'partida_perfecta', title: 'Partida Perfecta' }, { id: 'sin_ayuda', title: 'Mente Brillante' }, 
    { id: 'victoria_rapida', title: 'A Contrarreloj' }, { id: 'victoria_lenta', title: 'Pensador Profundo' },
    { id: 'pasa_50', title: 'Estratega del Pase' }, { id: 'help_25', title: 'Buscador de Pistas' }, 
    { id: 'victoria_limite', title: 'Al Límite' }, { id: 'victoria_agonica', title: 'Final Agónico' },
    { id: 'rey_a', title: 'Rey de la \'A\'' }, { id: 'corazon_valiente', title: 'Corazón Valiente' }
];

function cargarLogrosGlobal() {
    const guardados = localStorage.getItem(LOGROS_KEY_GLOBAL);
    if (guardados) {
        return JSON.parse(guardados);
    }
    // Si no hay nada, inicializamos aquí para que pasalache.js pueda trabajar
    const estadoLogrosInicial = {};
    todosLosLogrosDefGlobal.forEach(logro => {
        estadoLogrosInicial[logro.id] = { unlocked: false, unlocked_at: null };
    });
    guardarLogrosGlobal(estadoLogrosInicial);
    return estadoLogrosInicial;
}

function guardarLogrosGlobal(estadoLogros) {
    localStorage.setItem(LOGROS_KEY_GLOBAL, JSON.stringify(estadoLogros));
}

function intentarDesbloquearLogro(logroId) {
    const logros = cargarLogrosGlobal();
    if (logros[logroId] && !logros[logroId].unlocked) {
        logros[logroId].unlocked = true;
        logros[logroId].unlocked_at = new Date().toISOString();
        guardarLogrosGlobal(logros);
        console.log(`Logro desbloqueado globalmente: ${logroId}`);
        
        const logroDef = todosLosLogrosDefGlobal.find(l => l.id === logroId);
        if (logroDef && window.mostrarNotificacionLogro) {
            window.mostrarNotificacionLogro(logroDef.title);
        }
        return true; 
    }
    return false; 
}

window.CrackTotalLogrosAPI = {
    intentarDesbloquearLogro,
    cargarLogros: cargarLogrosGlobal,
    getTodosLosLogrosDef: () => todosLosLogrosDefGlobal // Exponer definiciones para pasalache.js
}; 