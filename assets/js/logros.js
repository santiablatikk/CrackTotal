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
        { id: 'partida_50', title: 'Veterano del Rosco', description: 'Completa 50 partidas de Pasala Che.', icon: 'fa-medal', category: 'progreso' },
        { id: 'partida_100', title: 'Maestro Consagrado', description: 'Completa 100 partidas de Pasala Che.', icon: 'fa-chess-king', category: 'progreso' },
        { id: 'partida_250', title: 'Leyenda del Conocimiento', description: 'Completa 250 partidas de Pasala Che.', icon: 'fa-landmark', category: 'progreso' },
        // Victoria
        { id: 'victoria_1', title: '¡Mi Primera Victoria!', description: 'Gana tu primera partida completando el rosco.', icon: 'fa-trophy', category: 'victoria' },
        { id: 'victoria_5', title: 'Penta-Triunfo', description: 'Gana 5 partidas.', icon: 'fa-dice-five', category: 'victoria' },
        { id: 'victoria_25', title: 'Maestro de Victorias', description: 'Gana 25 partidas.', icon: 'fa-award', category: 'victoria' },
        { id: 'victoria_50', title: 'Rey de los Roscos', description: 'Gana 50 partidas.', icon: 'fa-chess-queen', category: 'victoria' },
        { id: 'racha_2', title: 'Racha Ganadora (x2)', description: 'Gana 2 partidas seguidas.', icon: 'fa-angle-double-up', category: 'victoria' },
        { id: 'racha_3', title: 'Trío Victorioso', description: 'Gana 3 partidas seguidas.', icon: 'fa-link', category: 'victoria' },
        { id: 'racha_5', title: 'Imparable (x5)', description: 'Gana 5 partidas seguidas.', icon: 'fa-meteor', category: 'victoria' },
        { id: 'racha_10', title: 'Leyenda Invicta (x10)', description: 'Gana 10 partidas seguidas.', icon: 'fa-crown', category: 'victoria' },
        // Puntuación y Aciertos
        { id: 'aciertos_5', title: 'Buen Comienzo (5)', description: 'Consigue 5 aciertos en una partida.', icon: 'fa-thumbs-up', category: 'puntuacion' },
        { id: 'aciertos_10', title: 'Diez de Oro', description: 'Consigue 10 aciertos en una sola partida.', icon: 'fa-check', category: 'puntuacion' },
        { id: 'aciertos_15', title: 'Quince Precisos', description: 'Consigue 15 aciertos en una sola partida.', icon: 'fa-check-double', category: 'puntuacion' },
        { id: 'aciertos_20', title: 'Veinte Impecables', description: 'Consigue 20 aciertos en una sola partida.', icon: 'fa-clipboard-check', category: 'puntuacion' },
        { id: 'aciertos_25', title: 'Casi Perfecto (25)', description: 'Consigue 25 aciertos en una sola partida.', icon: 'fa-bullseye', category: 'puntuacion' },
        { id: 'rosco_casi_perfecto', title: 'Al Filo del Rosco', description: 'Consigue 26 aciertos en una partida.', icon: 'fa-star-half-alt', category: 'puntuacion' },
        { id: 'rosco_completo', title: 'Rosco Completo', description: 'Completa el rosco con 27 aciertos.', icon: 'fa-circle-notch fa-spin', category: 'puntuacion' },
        { id: 'total_aciertos_100', title: 'Coleccionista (100)', description: 'Acumula 100 aciertos totales en HISTORIAL.', icon: 'fa-certificate', category: 'puntuacion' },
        { id: 'total_aciertos_250', title: 'Semi-Erudito (250)', description: 'Acumula 250 aciertos totales.', icon: 'fa-book', category: 'puntuacion' },
        { id: 'total_aciertos_500', title: 'Erudito (500)', description: 'Acumula 500 aciertos totales.', icon: 'fa-book-reader', category: 'puntuacion' },
        { id: 'total_aciertos_1000', title: 'Enciclopedia (1000)', description: 'Acumula 1000 aciertos totales.', icon: 'fa-brain', category: 'puntuacion' },
        { id: 'total_aciertos_2000', title: 'Sabio Supremo (2000)', description: 'Acumula 2000 aciertos totales.', icon: 'fa-university', category: 'puntuacion' },
        { id: 'precision_alta_partida', title: 'Francotirador (90%)', description: 'Gana una partida con 90%+ precisión.', icon: 'fa-crosshairs', category: 'puntuacion' },
        // Dificultad y Desafío
        { id: 'victoria_facil', title: 'Paseo Triunfal', description: 'Gana una partida en dificultad Fácil.', icon: 'fa-smile-beam', category: 'desafio' },
        { id: 'victoria_normal', title: 'Desafío Superado', description: 'Gana una partida en dificultad Normal.', icon: 'fa-meh', category: 'desafio' },
        { id: 'dificultad_normal_perfecta', title: 'Maestría Estándar', description: 'Gana en Normal sin errores.', icon: 'fa-check-circle', category: 'desafio' },
        { id: 'victoria_dificil', title: 'Conquistador Experto', description: 'Gana una partida en dificultad Difícil.', icon: 'fa-skull', category: 'desafio' },
        { id: 'victorias_dificil_5', title: 'Dominador Difícil', description: 'Gana 5 partidas en dificultad Difícil.', icon: 'fa-user-ninja', category: 'desafio' },
        { id: 'victoria_dificil_sin_ayuda', title: 'Titán Intelectual', description: 'Gana en Difícil sin usar HELP.', icon: 'fa-brain', category: 'desafio' },
        { id: 'partida_perfecta', title: 'Partida Perfecta', description: 'Gana una partida sin cometer ningún error.', icon: 'fa-gem', category: 'desafio' },
        { id: 'victoria_sin_errores_dificil', title: 'Perfección Absoluta', description: 'Gana en Difícil sin errores.', icon: 'fa-diamond', category: 'desafio' },
        { id: 'sin_ayuda', title: 'Mente Brillante', description: 'Gana una partida sin usar ninguna ayuda (HELP).', icon: 'fa-lightbulb', category: 'desafio' },
        { id: 'sin_ayuda_ni_errores', title: 'Autosuficiencia Pura', description: 'Gana sin ayudas Y sin errores.', icon: 'fa-shield-alt', category: 'desafio' },
        { id: 'victoria_rapida', title: 'A Contrarreloj', description: 'Gana una partida en menos de 120 segundos.', icon: 'fa-stopwatch-20', category: 'desafio' },
        { id: 'victoria_lenta', title: 'Pensador Profundo', description: 'Gana una partida usando más de 240 segundos (y gana).', icon: 'fa-hourglass-half', category: 'desafio' },
        { id: 'victoria_sin_pasar', title: 'Directo al Grano', description: 'Gana una partida sin usar \'Pasala Che\'.', icon: 'fa-angle-double-right', category: 'desafio' },
        { id: 'victoria_remontada', title: 'Remontada Épica', description: 'Gana una partida tras estar a 1 error de perder.', icon: 'fa-fighter-jet', category: 'desafio' },
        { id: 'rosco_en_primera_vuelta', title: 'Primera Vuelta Triunfal', description: 'Gana el rosco sin pasar a una segunda vuelta de preguntas pendientes.', icon: 'fa-fast-forward', category: 'desafio' },
        // Misceláneos y Curiosos
        { id: 'pasa_50', title: 'Estratega del Pase', description: 'Usa la opción \'Pasala Che\' 50 veces en total.', icon: 'fa-fast-forward', category: 'miscelaneo' },
        { id: 'pasa_mucho_partida', title: 'El Evasor', description: 'Usa \'Pasala Che\' +15 veces en una partida.', icon: 'fa-random', category: 'miscelaneo' },
        { id: 'help_25', title: 'Buscador de Pistas', description: 'Utiliza el botón HELP 25 veces en total.', icon: 'fa-question-circle', category: 'miscelaneo' },
        { id: 'ayuda_sabia', title: 'Ayuda Oportuna', description: 'Usa HELP y acierta la pregunta.', icon: 'fa-hands-helping', category: 'miscelaneo' },
        { id: 'victoria_con_1_ayuda', title: 'Ayuda Justa', description: 'Gana usando exactamente 1 ayuda.', icon: 'fa-question', category: 'miscelaneo' },
        { id: 'victoria_limite', title: 'Al Límite', description: 'Gana una partida con el máximo de errores permitidos.', icon: 'fa-exclamation-triangle', category: 'miscelaneo' },
        { id: 'victoria_agonica', title: 'Final Agónico', description: 'Gana una partida con menos de 10 segundos restantes.', icon: 'fa-bomb', category: 'miscelaneo' },
        { id: 'ultima_letra_victoria', title: 'Sprint Final', description: 'Gana respondiendo la última letra pendiente cuando solo quedaba 1.', icon: 'fa-flag-checkered', category: 'miscelaneo' },
        { id: 'rey_a', title: 'Rey de la \'A\'', description: 'Responde correctamente 10 preguntas que comiencen con la letra \'A\'.', icon: 'fa-font', category: 'miscelaneo' },
        { id: 'corazon_valiente', title: 'Corazón Valiente', description: 'Pierde 10 partidas, ¡pero sigue intentándolo!', icon: 'fa-heartbeat', category: 'miscelaneo' },
        { id: 'letras_seguidas_5', title: 'Racha de Aciertos (5 Letras)', description: 'Acierta 5 letras seguidas en una partida.', icon: 'fa-stream', category: 'miscelaneo' },
        { id: 'derrota_honrosa', title: 'Cerca Pero Lejos', description: 'Pierde (no por tiempo) con 20+ aciertos.', icon: 'fa-heart', category: 'miscelaneo' },
        { id: 'partida_rapidisima_perdida', title: 'Visto y No Visto (Derrota)', description: 'Pierde en menos de 30 segundos.', icon: 'fa-bolt', category: 'miscelaneo' },
        { id: 'primera_pregunta_error_luego_victoria', title: 'Traspié y Triunfo', description: 'Error en la primera pregunta, pero gana.', icon: 'fa-undo', category: 'miscelaneo' },
        { id: 'partida_10_min', title: 'Maratonista del Saber', description: 'Juega una partida por más de 10 minutos.', icon: 'fa-clock', category: 'miscelaneo' },
        { id: 'aciertos_exactos_13', title: 'Número de la Suerte (13)', description: 'Termina con 13 aciertos.', icon: 'fa-dice', category: 'miscelaneo' },
        { id: 'errores_exactos_1', title: 'Roce Defensivo (1 error)', description: 'Termina con 1 solo error.', icon: 'fa-band-aid', category: 'miscelaneo' },
        { id: 'todas_letras_pasadas_una_vuelta', title: 'Vuelta de Reconocimiento', description: 'Pasa por todas las letras del rosco al menos una vez.', icon: 'fa-sync', category: 'miscelaneo' }
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
            console.log('Detectado cambio en localStorage de logros (evento storage). Re-renderizando...');
            renderizarLogros(currentFilter);
        }
    });

    // --- Escuchar cuando la ventana/pestaña gana foco --- 
    window.addEventListener('focus', function() {
        console.log('Logros page a ganado foco. Re-renderizando por si hay cambios...');
        // Podríamos verificar si realmente hubo cambios antes de re-renderizar para optimizar,
        // pero un re-render simple es más directo por ahora.
        renderizarLogros(currentFilter);
    });
});

const LOGROS_KEY_GLOBAL = 'pasalacheUserAchievements';

// Esta es la lista de definiciones que se necesita globalmente
// para que pasalache.js pueda acceder a los títulos para notificaciones, por ejemplo.
const todosLosLogrosDefGlobal = [
    // Iniciación y Progreso General
    { id: 'partida_1', title: 'El Comienzo del Viaje', description: 'Juega tu primera partida de Pasala Che.', icon: 'fa-play-circle', category: 'progreso' },
    { id: 'partida_5', title: 'Calentando Motores', description: 'Completa 5 partidas de Pasala Che.', icon: 'fa-fire', category: 'progreso' },
    { id: 'partida_25', title: 'Habitué del Rosco', description: 'Completa 25 partidas de Pasala Che.', icon: 'fa-star', category: 'progreso' },
    { id: 'partida_50', title: 'Veterano del Rosco', description: 'Completa 50 partidas de Pasala Che.', icon: 'fa-medal', category: 'progreso' },
    { id: 'partida_100', title: 'Maestro Consagrado', description: 'Completa 100 partidas de Pasala Che.', icon: 'fa-chess-king', category: 'progreso' },
    { id: 'partida_250', title: 'Leyenda del Conocimiento', description: 'Completa 250 partidas de Pasala Che.', icon: 'fa-landmark', category: 'progreso' },
    // Victoria
    { id: 'victoria_1', title: '¡Mi Primera Victoria!', description: 'Gana tu primera partida completando el rosco.', icon: 'fa-trophy', category: 'victoria' },
    { id: 'victoria_5', title: 'Penta-Triunfo', description: 'Gana 5 partidas.', icon: 'fa-dice-five', category: 'victoria' },
    { id: 'victoria_25', title: 'Maestro de Victorias', description: 'Gana 25 partidas.', icon: 'fa-award', category: 'victoria' },
    { id: 'victoria_50', title: 'Rey de los Roscos', description: 'Gana 50 partidas.', icon: 'fa-chess-queen', category: 'victoria' },
    { id: 'racha_2', title: 'Racha Ganadora (x2)', description: 'Gana 2 partidas seguidas.', icon: 'fa-angle-double-up', category: 'victoria' },
    { id: 'racha_3', title: 'Trío Victorioso', description: 'Gana 3 partidas seguidas.', icon: 'fa-link', category: 'victoria' },
    { id: 'racha_5', title: 'Imparable (x5)', description: 'Gana 5 partidas seguidas.', icon: 'fa-meteor', category: 'victoria' },
    { id: 'racha_10', title: 'Leyenda Invicta (x10)', description: 'Gana 10 partidas seguidas.', icon: 'fa-crown', category: 'victoria' },
    // Puntuación y Aciertos
    { id: 'aciertos_5', title: 'Buen Comienzo (5)', description: 'Consigue 5 aciertos en una partida.', icon: 'fa-thumbs-up', category: 'puntuacion' },
    { id: 'aciertos_10', title: 'Diez de Oro', description: 'Consigue 10 aciertos en una sola partida.', icon: 'fa-check', category: 'puntuacion' },
    { id: 'aciertos_15', title: 'Quince Precisos', description: 'Consigue 15 aciertos en una sola partida.', icon: 'fa-check-double', category: 'puntuacion' },
    { id: 'aciertos_20', title: 'Veinte Impecables', description: 'Consigue 20 aciertos en una sola partida.', icon: 'fa-clipboard-check', category: 'puntuacion' },
    { id: 'aciertos_25', title: 'Casi Perfecto (25)', description: 'Consigue 25 aciertos en una sola partida.', icon: 'fa-bullseye', category: 'puntuacion' },
    { id: 'rosco_casi_perfecto', title: 'Al Filo del Rosco', description: 'Consigue 26 aciertos en una partida.', icon: 'fa-star-half-alt', category: 'puntuacion' },
    { id: 'rosco_completo', title: 'Rosco Completo', description: 'Completa el rosco con 27 aciertos.', icon: 'fa-circle-notch fa-spin', category: 'puntuacion' },
    { id: 'total_aciertos_100', title: 'Coleccionista (100)', description: 'Acumula 100 aciertos totales en HISTORIAL.', icon: 'fa-certificate', category: 'puntuacion' },
    { id: 'total_aciertos_250', title: 'Semi-Erudito (250)', description: 'Acumula 250 aciertos totales.', icon: 'fa-book', category: 'puntuacion' },
    { id: 'total_aciertos_500', title: 'Erudito (500)', description: 'Acumula 500 aciertos totales.', icon: 'fa-book-reader', category: 'puntuacion' },
    { id: 'total_aciertos_1000', title: 'Enciclopedia (1000)', description: 'Acumula 1000 aciertos totales.', icon: 'fa-brain', category: 'puntuacion' },
    { id: 'total_aciertos_2000', title: 'Sabio Supremo (2000)', description: 'Acumula 2000 aciertos totales.', icon: 'fa-university', category: 'puntuacion' },
    { id: 'precision_alta_partida', title: 'Francotirador (90%)', description: 'Gana una partida con 90%+ precisión.', icon: 'fa-crosshairs', category: 'puntuacion' },
    // Dificultad y Desafío
    { id: 'victoria_facil', title: 'Paseo Triunfal', description: 'Gana una partida en dificultad Fácil.', icon: 'fa-smile-beam', category: 'desafio' },
    { id: 'victoria_normal', title: 'Desafío Superado', description: 'Gana una partida en dificultad Normal.', icon: 'fa-meh', category: 'desafio' },
    { id: 'dificultad_normal_perfecta', title: 'Maestría Estándar', description: 'Gana en Normal sin errores.', icon: 'fa-check-circle', category: 'desafio' },
    { id: 'victoria_dificil', title: 'Conquistador Experto', description: 'Gana una partida en dificultad Difícil.', icon: 'fa-skull', category: 'desafio' },
    { id: 'victorias_dificil_5', title: 'Dominador Difícil', description: 'Gana 5 partidas en dificultad Difícil.', icon: 'fa-user-ninja', category: 'desafio' },
    { id: 'victoria_dificil_sin_ayuda', title: 'Titán Intelectual', description: 'Gana en Difícil sin usar HELP.', icon: 'fa-brain', category: 'desafio' },
    { id: 'partida_perfecta', title: 'Partida Perfecta', description: 'Gana una partida sin cometer ningún error.', icon: 'fa-gem', category: 'desafio' },
    { id: 'victoria_sin_errores_dificil', title: 'Perfección Absoluta', description: 'Gana en Difícil sin errores.', icon: 'fa-diamond', category: 'desafio' },
    { id: 'sin_ayuda', title: 'Mente Brillante', description: 'Gana una partida sin usar ninguna ayuda (HELP).', icon: 'fa-lightbulb', category: 'desafio' },
    { id: 'sin_ayuda_ni_errores', title: 'Autosuficiencia Pura', description: 'Gana sin ayudas Y sin errores.', icon: 'fa-shield-alt', category: 'desafio' },
    { id: 'victoria_rapida', title: 'A Contrarreloj', description: 'Gana una partida en menos de 120 segundos.', icon: 'fa-stopwatch-20', category: 'desafio' },
    { id: 'victoria_lenta', title: 'Pensador Profundo', description: 'Gana una partida usando más de 240 segundos (y gana).', icon: 'fa-hourglass-half', category: 'desafio' },
    { id: 'victoria_sin_pasar', title: 'Directo al Grano', description: 'Gana una partida sin usar \'Pasala Che\'.', icon: 'fa-angle-double-right', category: 'desafio' },
    { id: 'victoria_remontada', title: 'Remontada Épica', description: 'Gana una partida tras estar a 1 error de perder.', icon: 'fa-fighter-jet', category: 'desafio' },
    { id: 'rosco_en_primera_vuelta', title: 'Primera Vuelta Triunfal', description: 'Gana el rosco sin pasar a una segunda vuelta de preguntas pendientes.', icon: 'fa-fast-forward', category: 'desafio' },
    // Misceláneos y Curiosos
    { id: 'pasa_50', title: 'Estratega del Pase', description: 'Usa la opción \'Pasala Che\' 50 veces en total.', icon: 'fa-fast-forward', category: 'miscelaneo' },
    { id: 'pasa_mucho_partida', title: 'El Evasor', description: 'Usa \'Pasala Che\' +15 veces en una partida.', icon: 'fa-random', category: 'miscelaneo' },
    { id: 'help_25', title: 'Buscador de Pistas', description: 'Utiliza el botón HELP 25 veces en total.', icon: 'fa-question-circle', category: 'miscelaneo' },
    { id: 'ayuda_sabia', title: 'Ayuda Oportuna', description: 'Usa HELP y acierta la pregunta.', icon: 'fa-hands-helping', category: 'miscelaneo' },
    { id: 'victoria_con_1_ayuda', title: 'Ayuda Justa', description: 'Gana usando exactamente 1 ayuda.', icon: 'fa-question', category: 'miscelaneo' },
    { id: 'victoria_limite', title: 'Al Límite', description: 'Gana una partida con el máximo de errores permitidos.', icon: 'fa-exclamation-triangle', category: 'miscelaneo' },
    { id: 'victoria_agonica', title: 'Final Agónico', description: 'Gana una partida con menos de 10 segundos restantes.', icon: 'fa-bomb', category: 'miscelaneo' },
    { id: 'ultima_letra_victoria', title: 'Sprint Final', description: 'Gana respondiendo la última letra pendiente cuando solo quedaba 1.', icon: 'fa-flag-checkered', category: 'miscelaneo' },
    { id: 'rey_a', title: 'Rey de la \'A\'', description: 'Responde correctamente 10 preguntas que comiencen con la letra \'A\'.', icon: 'fa-font', category: 'miscelaneo' },
    { id: 'corazon_valiente', title: 'Corazón Valiente', description: 'Pierde 10 partidas, ¡pero sigue intentándolo!', icon: 'fa-heartbeat', category: 'miscelaneo' },
    { id: 'letras_seguidas_5', title: 'Racha de Aciertos (5 Letras)', description: 'Acierta 5 letras seguidas en una partida.', icon: 'fa-stream', category: 'miscelaneo' },
    { id: 'derrota_honrosa', title: 'Cerca Pero Lejos', description: 'Pierde (no por tiempo) con 20+ aciertos.', icon: 'fa-heart', category: 'miscelaneo' },
    { id: 'partida_rapidisima_perdida', title: 'Visto y No Visto (Derrota)', description: 'Pierde en menos de 30 segundos.', icon: 'fa-bolt', category: 'miscelaneo' },
    { id: 'primera_pregunta_error_luego_victoria', title: 'Traspié y Triunfo', description: 'Error en la primera pregunta, pero gana.', icon: 'fa-undo', category: 'miscelaneo' },
    { id: 'partida_10_min', title: 'Maratonista del Saber', description: 'Juega una partida por más de 10 minutos.', icon: 'fa-clock', category: 'miscelaneo' },
    { id: 'aciertos_exactos_13', title: 'Número de la Suerte (13)', description: 'Termina con 13 aciertos.', icon: 'fa-dice', category: 'miscelaneo' },
    { id: 'errores_exactos_1', title: 'Roce Defensivo (1 error)', description: 'Termina con 1 solo error.', icon: 'fa-band-aid', category: 'miscelaneo' },
    { id: 'todas_letras_pasadas_una_vuelta', title: 'Vuelta de Reconocimiento', description: 'Pasa por todas las letras del rosco al menos una vez.', icon: 'fa-sync', category: 'miscelaneo' }
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
        // if (logroDef && window.mostrarNotificacionLogro) {
        //     window.mostrarNotificacionLogro(logroDef.title);
        // }
        return true; 
    }
    return false; 
}

window.CrackTotalLogrosAPI = {
    intentarDesbloquearLogro,
    cargarLogros: cargarLogrosGlobal,
    getTodosLosLogrosDef: () => JSON.parse(JSON.stringify(todosLosLogrosDefGlobal)) // Exponer copia profunda de definiciones completas
}; 