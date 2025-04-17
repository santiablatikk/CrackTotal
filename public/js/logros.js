// logros.js - Exporta las funciones de logros para ser utilizadas en profile.js
// Compatibilidad con logros.html

// Definiciones de logros (LISTA COMPLETA DE 81)
const achievements = [
    { id: 'first_game', icon: 'fas fa-gamepad', title: 'Primer Gol', description: 'Completa tu primera pregunta correctamente en el juego.', category: 'beginner', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'perfect_game', icon: 'fas fa-star', title: 'Juego Perfecto', description: 'Completa un juego respondiendo correctamente todas las preguntas.', category: 'expert', maxCount: 10, unlocked: false, count: 0, date: null },
    { id: 'fast_answer', icon: 'fas fa-bolt', title: 'Respuesta Rápida', description: 'Responde correctamente en menos de 5 segundos.', category: 'intermediate', maxCount: 50, unlocked: false, count: 0, date: null },
    { id: 'streak_5', icon: 'fas fa-fire', title: 'En Racha', description: 'Responde correctamente 5 preguntas consecutivas.', category: 'beginner', maxCount: 20, unlocked: false, count: 0, date: null },
    { id: 'streak_10', icon: 'fas fa-fire-alt', title: 'Racha Imparable', description: 'Responde correctamente 10 preguntas seguidas.', category: 'intermediate', maxCount: 10, unlocked: false, count: 0, date: null },
    { id: 'no_pass', icon: 'fas fa-trophy', title: 'Sin Pasar', description: 'Completa un juego sin usar la opción "Pasala Ché".', category: 'expert', maxCount: 5, unlocked: false, count: 0, date: null },
    { id: 'world_cup_expert', icon: 'fas fa-globe', title: 'Experto en Mundiales', description: 'Responde correctamente 20 preguntas sobre Copas del Mundo.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'speed_demon', icon: 'fas fa-tachometer-alt', title: 'Velocidad Máxima', description: 'Completa un juego en menos de 2 minutos.', category: 'expert', maxCount: 3, unlocked: false, count: 0, date: null },
    { id: 'comeback_king', icon: 'fas fa-crown', title: 'Rey de la Remontada', description: 'Gana después de tener 2 respuestas incorrectas.', category: 'special', maxCount: 3, unlocked: false, count: 0, date: null },
    { id: 'night_owl', icon: 'fas fa-moon', title: 'Búho Nocturno', description: 'Juega una partida después de medianoche.', category: 'special', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'daily_streak', icon: 'fas fa-calendar-check', title: 'Racha Diaria', description: 'Juega 7 días consecutivos.', category: 'intermediate', maxCount: 4, unlocked: false, count: 0, date: null },
    { id: 'history_buff', icon: 'fas fa-book', title: 'Aficionado a la Historia', description: 'Responde correctamente 15 preguntas históricas.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'club_legend', icon: 'fas fa-shield-alt', title: 'Leyenda de Clubes', description: 'Responde correctamente 25 preguntas sobre clubes de fútbol.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'help_master', icon: 'fas fa-hands-helping', title: 'Maestro de la Ayuda', description: 'Utiliza la opción de ayuda 20 veces y responde correctamente.', category: 'beginner', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'hard_mode', icon: 'fas fa-skull', title: 'Modo Difícil', description: 'Completa un juego en modo difícil.', category: 'expert', maxCount: 5, unlocked: false, count: 0, date: null },
    { id: 'challenge_accepted', icon: 'fas fa-flag', title: 'Desafío Aceptado', description: 'Completa un desafío diario.', category: 'special', maxCount: 10, unlocked: false, count: 0, date: null },
    { id: 'maradona_fan', icon: 'fas fa-futbol', title: 'Fanático de Maradona', description: 'Responde correctamente 5 preguntas sobre Diego Maradona.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'messi_magic', icon: 'fas fa-magic', title: 'Magia de Messi', description: 'Responde correctamente 5 preguntas sobre Lionel Messi.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'pele_legend', icon: 'fas fa-crown', title: 'Leyenda de Pelé', description: 'Responde correctamente 5 preguntas sobre Pelé.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'champions_expert', icon: 'fas fa-trophy', title: 'Experto en Champions', description: 'Responde correctamente 10 preguntas sobre la Champions League.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'copa_libertadores', icon: 'fas fa-trophy', title: 'Conocedor de Libertadores', description: 'Responde correctamente 10 preguntas sobre la Copa Libertadores.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'goalkeeper_guru', icon: 'fas fa-hands', title: 'Gurú de los Porteros', description: 'Responde correctamente 10 preguntas sobre porteros famosos.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'early_bird', icon: 'fas fa-sun', title: 'Madrugador', description: 'Juega una partida antes de las 7:00 AM.', category: 'special', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'weekend_warrior', icon: 'fas fa-calendar-day', title: 'Guerrero de Fin de Semana', description: 'Juega 5 partidas durante un fin de semana.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'marathon_player', icon: 'fas fa-running', title: 'Maratonista', description: 'Juega 10 partidas en un solo día.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'penalty_master', icon: 'fas fa-bullseye', title: 'Maestro de los Penaltis', description: 'Responde correctamente 10 preguntas sobre penaltis históricos.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'euro_champion', icon: 'fas fa-euro-sign', title: 'Campeón de la Eurocopa', description: 'Responde correctamente 10 preguntas sobre la Eurocopa.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'copa_america', icon: 'fas fa-globe-americas', title: 'Experto en Copa América', description: 'Responde correctamente 10 preguntas sobre la Copa América.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'transfer_guru', icon: 'fas fa-money-bill-wave', title: 'Gurú de los Traspasos', description: 'Responde correctamente 10 preguntas sobre traspasos históricos.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'stadium_aficionado', icon: 'fas fa-landmark', title: 'Aficionado de Estadios', description: 'Responde correctamente 10 preguntas sobre estadios famosos.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'super_sub', icon: 'fas fa-person-booth', title: 'Super Suplente', description: 'Gana una partida después de saltarte 5 preguntas.', category: 'beginner', maxCount: 3, unlocked: false, count: 0, date: null },
    { id: 'cr7_fanatic', icon: 'fas fa-rocket', title: 'Fanático de CR7', description: 'Responde correctamente 5 preguntas sobre Cristiano Ronaldo.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'argentina_expert', icon: 'fas fa-flag', title: 'Experto en Argentina', description: 'Responde correctamente 10 preguntas sobre la selección argentina.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'brazil_expert', icon: 'fas fa-flag', title: 'Experto en Brasil', description: 'Responde correctamente 10 preguntas sobre la selección brasileña.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'defender_master', icon: 'fas fa-shield-alt', title: 'Maestro de la Defensa', description: 'Responde correctamente 10 preguntas sobre defensores históricos.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'striker_expert', icon: 'fas fa-bullseye', title: 'Experto en Delanteros', description: 'Responde correctamente 10 preguntas sobre delanteros históricos.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'world_cup_historian', icon: 'fas fa-globe-americas', title: 'Historiador de Mundiales', description: 'Responde correctamente 15 preguntas sobre la historia de los Mundiales.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'golden_boot', icon: 'fas fa-shoe-prints', title: 'Bota de Oro', description: 'Responde correctamente 8 preguntas sobre goleadores históricos.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'coaching_legend', icon: 'fas fa-user-tie', title: 'Leyenda del Banquillo', description: 'Responde correctamente 10 preguntas sobre entrenadores famosos.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'hat_trick_hero', icon: 'fas fa-hat-wizard', title: 'Héroe del Hat-Trick', description: 'Contesta correctamente 3 preguntas seguidas en menos de 15 segundos.', category: 'expert', maxCount: 3, unlocked: false, count: 0, date: null },
    { id: 'copa_expert', icon: 'fas fa-award', title: 'Experto en Copas', description: 'Responde correctamente preguntas sobre 5 torneos de copa diferentes.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'premier_league_fan', icon: 'fas fa-crown', title: 'Fan de la Premier League', description: 'Responde correctamente 10 preguntas sobre la Premier League.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'laliga_expert', icon: 'fas fa-trophy', title: 'Experto en LaLiga', description: 'Responde correctamente 10 preguntas sobre LaLiga española.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'serie_a_maestro', icon: 'fas fa-pizza-slice', title: 'Maestro de la Serie A', description: 'Responde correctamente 10 preguntas sobre la Serie A italiana.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'bundesliga_fan', icon: 'fas fa-beer', title: 'Fan de la Bundesliga', description: 'Responde correctamente 10 preguntas sobre la Bundesliga alemana.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'ligue1_expert', icon: 'fas fa-cookie', title: 'Experto en Ligue 1', description: 'Responde correctamente 10 preguntas sobre la Ligue 1 francesa.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'perfect_week', icon: 'fas fa-calendar-week', title: 'Semana Perfecta', description: 'Juega al menos una partida cada día durante una semana.', category: 'special', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'monthly_legend', icon: 'fas fa-calendar-alt', title: 'Leyenda Mensual', description: 'Juega 30 días seguidos, al menos una partida cada día.', category: 'epic', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'midfield_maestro', icon: 'fas fa-circle-notch', title: 'Maestro del Mediocampo', description: 'Responde correctamente 10 preguntas sobre mediocampistas famosos.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'tactical_genius', icon: 'fas fa-chess', title: 'Genio Táctico', description: 'Responde correctamente 10 preguntas sobre tácticas y formaciones.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'derby_day_hero', icon: 'fas fa-fire', title: 'Héroe del Derbi', description: 'Responde correctamente 8 preguntas sobre derbis y clásicos.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'comeback_queen', icon: 'fas fa-venus', title: 'Reina de la Remontada', description: 'Responde correctamente 5 preguntas sobre fútbol femenino.', category: 'special', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'young_talent_scout', icon: 'fas fa-baby', title: 'Ojeador de Jóvenes Talentos', description: 'Responde correctamente 8 preguntas sobre jóvenes promesas.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'world_traveler', icon: 'fas fa-plane', title: 'Viajero Mundial', description: 'Responde correctamente preguntas sobre equipos de 10 países diferentes.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'conmebol_expert', icon: 'fas fa-globe-americas', title: 'Experto en CONMEBOL', description: 'Responde correctamente 10 preguntas sobre fútbol sudamericano.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'uefa_expert', icon: 'fas fa-globe-europe', title: 'Experto en UEFA', description: 'Responde correctamente 10 preguntas sobre fútbol europeo.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'concacaf_expert', icon: 'fas fa-globe-americas', title: 'Experto en CONCACAF', description: 'Responde correctamente 8 preguntas sobre fútbol norteamericano.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'afc_expert', icon: 'fas fa-globe-asia', title: 'Experto en AFC', description: 'Responde correctamente 8 preguntas sobre fútbol asiático.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'caf_expert', icon: 'fas fa-globe-africa', title: 'Experto en CAF', description: 'Responde correctamente 8 preguntas sobre fútbol africano.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'ofc_expert', icon: 'fas fa-globe-asia', title: 'Experto en OFC', description: 'Responde correctamente 5 preguntas sobre fútbol de Oceanía.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'underdog_champion', icon: 'fas fa-dog', title: 'Campeón de los Underdog', description: 'Responde correctamente 8 preguntas sobre equipos sorpresa y éxitos inesperados.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'record_breaker', icon: 'fas fa-chart-line', title: 'Rompe Récords', description: 'Responde correctamente 10 preguntas sobre récords en el fútbol.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'international_roster', icon: 'fas fa-users', title: 'Plantilla Internacional', description: 'Responde correctamente preguntas sobre jugadores de 15 nacionalidades distintas.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'set_piece_specialist', icon: 'fas fa-bullseye', title: 'Especialista en Balón Parado', description: 'Responde correctamente 8 preguntas sobre tiros libres, córners y penaltis.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'golden_era', icon: 'fas fa-hourglass-half', title: 'Época Dorada', description: 'Responde correctamente 10 preguntas sobre fútbol clásico (antes de 1990).', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'modern_football', icon: 'fas fa-desktop', title: 'Fútbol Moderno', description: 'Responde correctamente 10 preguntas sobre fútbol contemporáneo (después de 2010).', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'jersey_collector', icon: 'fas fa-tshirt', title: 'Coleccionista de Camisetas', description: 'Responde correctamente preguntas sobre 15 equipos diferentes.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'futbol_philosopher', icon: 'fas fa-book', title: 'Filósofo del Fútbol', description: 'Responde correctamente 8 preguntas sobre frases célebres y filosofías del fútbol.', category: 'special', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'goal_celebration', icon: 'fas fa-child', title: 'Celebración de Gol', description: 'Consigue una racha de 5 respuestas correctas en menos de 30 segundos.', category: 'expert', maxCount: 3, unlocked: false, count: 0, date: null },
    { id: 'club_historian', icon: 'fas fa-university', title: 'Historiador de Clubes', description: 'Responde correctamente 15 preguntas sobre la historia de los clubes de fútbol.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'scandal_expert', icon: 'fas fa-exclamation-triangle', title: 'Experto en Escándalos', description: 'Responde correctamente 8 preguntas sobre polémicas y escándalos en el fútbol.', category: 'special', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'cup_final_hero', icon: 'fas fa-medal', title: 'Héroe de la Final', description: 'Gana 5 partidas con puntaje perfecto.', category: 'expert', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'relegation_battler', icon: 'fas fa-arrow-down', title: 'Luchador del Descenso', description: 'Gana una partida después de fallar las primeras 3 preguntas.', category: 'special', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'streak_20', icon: 'fas fa-fire-alt', title: 'Racha Legendaria', description: 'Responde correctamente 20 preguntas consecutivas.', category: 'expert', maxCount: 5, unlocked: false, count: 0, date: null },
    { id: 'golden_question', icon: 'fas fa-question-circle', title: 'Pregunta Dorada', description: 'Responde correctamente a la pregunta final para ganar una partida.', category: 'intermediate', maxCount: 10, unlocked: false, count: 0, date: null },
    { id: 'first_minute_goal', icon: 'fas fa-stopwatch', title: 'Gol en el Primer Minuto', description: 'Responde correctamente a la primera pregunta en menos de 3 segundos.', category: 'intermediate', maxCount: 5, unlocked: false, count: 0, date: null },
    { id: 'injury_time_winner', icon: 'fas fa-heartbeat', title: 'Gol en Tiempo de Descuento', description: 'Responde correctamente a la última pregunta con menos de 5 segundos restantes.', category: 'special', maxCount: 3, unlocked: false, count: 0, date: null },
    { id: 'goal_line_technology', icon: 'fas fa-microscope', title: 'Tecnología de Línea de Gol', description: 'Usa correctamente la opción de ayuda 10 veces seguidas.', category: 'intermediate', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'var_decision', icon: 'fas fa-video', title: 'Decisión del VAR', description: 'Cambia tu respuesta y acierta después de dudar inicialmente.', category: 'intermediate', maxCount: 5, unlocked: false, count: 0, date: null },
    { id: 'centenario', icon: 'fas fa-trophy', title: 'Centenario', description: 'Juega 100 partidas en total.', category: 'epic', maxCount: 1, unlocked: false, count: 0, date: null },
    { id: 'clean_sheet', icon: 'fas fa-clipboard-check', title: 'Portería a Cero', description: 'Completa una partida sin ningún error.', category: 'intermediate', maxCount: 10, unlocked: false, count: 0, date: null }
];

// Función para cargar los logros guardados desde localStorage
function loadSavedAchievements() {
    const userIP = getUserIPAddress();
    const storageKey = `userAchievements_${userIP}`;
    const savedAchievements = localStorage.getItem(storageKey);
    
    if (savedAchievements) {
        try {
            const parsed = JSON.parse(savedAchievements);
            
            // Actualiza los logros con los datos guardados
            parsed.forEach(savedAchievement => {
                const achievement = achievements.find(a => a.id === savedAchievement.id);
                if (achievement) {
                    achievement.unlocked = savedAchievement.unlocked || false;
                    achievement.count = savedAchievement.count || 0;
                    achievement.date = savedAchievement.date || null;
                }
            });
        } catch (error) {
            console.error('Error al cargar logros guardados:', error);
        }
    }
}

// Función para obtener la dirección IP del usuario o un identificador único
function getUserIPAddress() {
    // Si ya tenemos el IP guardado, lo devolvemos
    if (window.userIP) {
        return window.userIP;
    }
    
    // Intentar obtener desde localStorage
    const savedIP = localStorage.getItem('userIP');
    if (savedIP) {
        window.userIP = savedIP;
        return savedIP;
    }
    
    // Si no hay IP, usar timestamp como fallback
    const timestamp = new Date().getTime();
    window.userIP = `user_${timestamp}`;
    localStorage.setItem('userIP', window.userIP);
    
    // Intentar obtener la IP real en segundo plano
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            if (data && data.ip) {
                window.userIP = data.ip;
                localStorage.setItem('userIP', window.userIP);
                
                // Migrar datos si es necesario
                migrateUserData(`user_${timestamp}`, data.ip);
            }
        })
        .catch(error => {
            console.error('Error al obtener IP:', error);
            // Intentar con otra API como fallback
            fetch('https://ipapi.co/json/')
                .then(response => response.json())
                .then(data => {
                    if (data && data.ip) {
                        window.userIP = data.ip;
                        localStorage.setItem('userIP', window.userIP);
                        
                        // Migrar datos si es necesario
                        migrateUserData(`user_${timestamp}`, data.ip);
                    }
                })
                .catch(err => console.error('Error en fallback de IP:', err));
        });
    
    return window.userIP;
}

// Función para migrar datos de usuario entre identificadores
function migrateUserData(oldId, newId) {
    // Migrar logros
    const oldAchievementsKey = `userAchievements_${oldId}`;
    const newAchievementsKey = `userAchievements_${newId}`;
    
    const oldAchievements = localStorage.getItem(oldAchievementsKey);
    if (oldAchievements && !localStorage.getItem(newAchievementsKey)) {
        localStorage.setItem(newAchievementsKey, oldAchievements);
        localStorage.removeItem(oldAchievementsKey);
    }
    
    // Migrar otros datos de usuario según sea necesario
}

// Función para obtener todos los logros
window.getAllAchievements = function() {
    loadSavedAchievements(); // Asegurarse que tenemos los datos más recientes
    return [...achievements]; // Devolver una copia
};

// Función para obtener solo los logros desbloqueados
window.getUnlockedAchievements = function() {
    loadSavedAchievements(); // Asegurarse que tenemos los datos más recientes
    return achievements.filter(achievement => achievement.unlocked);
};

// Función para formatear fechas
window.formatDate = function(date) {
    if (!date) return 'Pendiente';
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
};

// Función para desbloquear o actualizar un logro
window.unlockAchievement = function(achievementId, userIP) {
    if (!achievementId || !userIP) return false;
    
    // Cargar datos actuales
    loadSavedAchievements();
    
    // Buscar el logro por ID
    const achievementIndex = achievements.findIndex(a => a.id === achievementId);
    if (achievementIndex === -1) {
        console.error(`Logro con ID ${achievementId} no encontrado`);
        return false;
    }
    
    // Obtener el logro
    const achievement = achievements[achievementIndex];
    
    // Determinar si debemos incrementar contador o establecer como desbloqueado
    if (achievement.maxCount > 1) {
        // Logro con contador
        achievement.count = (achievement.count || 0) + 1;
        
        // Verificar si se ha alcanzado el objetivo
        if (achievement.count >= achievement.maxCount && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.date = new Date().toISOString();
            
            // Disparar evento de logro desbloqueado
            document.dispatchEvent(new CustomEvent('achievement_updated', {
                detail: { achievement: { ...achievement } }
            }));
            
            // Mostrar notificación si existe la función
            if (typeof showAchievementNotification === 'function') {
                showAchievementNotification(achievement);
            }
        }
    } else if (!achievement.unlocked) {
        // Logro simple
        achievement.unlocked = true;
        achievement.count = 1;
        achievement.date = new Date().toISOString();
        
        // Disparar evento de logro desbloqueado
        document.dispatchEvent(new CustomEvent('achievement_updated', {
            detail: { achievement: { ...achievement } }
        }));
        
        // Mostrar notificación si existe la función
        if (typeof showAchievementNotification === 'function') {
            showAchievementNotification(achievement);
        }
    }
    
    // Guardar los cambios
    const storageKey = `userAchievements_${userIP}`;
    localStorage.setItem(storageKey, JSON.stringify(achievements));
    
    return true;
};

// Función para mostrar notificación de logro (si no está definida en la página)
if (typeof showAchievementNotification !== 'function') {
    window.showAchievementNotification = function(achievement) {
        // Crear elemento de notificación si no existe
        let notification = document.getElementById('achievement-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'achievement-notification';
            notification.className = 'achievement-notification';
            document.body.appendChild(notification);
            
            // Estilos para la notificación si no existen
            if (!document.getElementById('achievement-notification-styles')) {
                const styles = document.createElement('style');
                styles.id = 'achievement-notification-styles';
                styles.textContent = `
                    .achievement-notification {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background: linear-gradient(135deg, #1a237e, #283593);
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        z-index: 9999;
                        opacity: 0;
                        transform: translateY(20px);
                        transition: opacity 0.3s ease, transform 0.3s ease;
                        max-width: 350px;
                    }
                    .achievement-notification.show {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    .achievement-notification-icon {
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }
                    .achievement-notification-content {
                        flex: 1;
                    }
                    .achievement-notification-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .achievement-notification-close {
                        cursor: pointer;
                        opacity: 0.7;
                        transition: opacity 0.2s;
                    }
                    .achievement-notification-close:hover {
                        opacity: 1;
                    }
                `;
                document.head.appendChild(styles);
            }
        }
        
        // Actualizar contenido
        notification.innerHTML = `
            <div class="achievement-notification-icon">
                <i class="${achievement.icon || 'fas fa-trophy'}"></i>
            </div>
            <div class="achievement-notification-content">
                <div class="achievement-notification-title">¡Logro desbloqueado!</div>
                <div class="achievement-notification-message">${achievement.title}</div>
            </div>
            <div class="achievement-notification-close">
                <i class="fas fa-times"></i>
            </div>
        `;
        
        // Mostrar y ocultar automáticamente
        notification.classList.add('show');
        
        // Configurar cierre
        const closeButton = notification.querySelector('.achievement-notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                notification.classList.remove('show');
            });
        }
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    };
}

// Inicializar al cargar
loadSavedAchievements();

// Informar que el script está cargado
console.log('Logros cargados correctamente');

// Evento personalizado para notificar que los logros están disponibles
document.dispatchEvent(new CustomEvent('logrosLoaded')); 