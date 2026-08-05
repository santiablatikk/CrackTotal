/**
 * Gamification — single configurable source of truth.
 * Change XP rewards, levels, and achievements here without touching UI.
 */
(function () {
    'use strict';

    const GamificationConfig = {
        version: 1,
        storageKey: 'ct_progress_v1',
        historyLimit: 40,
        activityLimit: 50,
        xpHistoryLimit: 80,

        /**
         * Configurable XP table. Keys are event ids used by ProgressService.
         */
        xpTable: {
            first_game: { amount: 50, label: 'Primer juego' },
            match_played: { amount: 10, label: 'Partida jugada' },
            victory: { amount: 25, label: 'Victoria' },
            perfect_answers: { amount: 20, label: 'Respuesta perfecta' },
            streak_day: { amount: 15, label: 'Racha diaria' },
            daily_challenge: { amount: 40, label: 'Desafío diario' },
            achievement_unlock: { amount: 30, label: 'Logro desbloqueado' },
            level_up_bonus: { amount: 20, label: 'Bonus de nivel' }
        },

        /**
         * Levels ordered by minXp ascending.
         */
        levels: [
            { id: 'novato', name: 'Novato', minXp: 0, icon: 'fa-seedling', color: '#8493aa' },
            { id: 'promesa', name: 'Promesa', minXp: 150, icon: 'fa-bolt', color: '#60a5fa' },
            { id: 'titular', name: 'Titular', minXp: 400, icon: 'fa-shirt', color: '#79f2a6' },
            { id: 'capitan', name: 'Capitán', minXp: 900, icon: 'fa-shield-halved', color: '#fbbf24' },
            { id: 'idolo', name: 'Ídolo', minXp: 1800, icon: 'fa-star', color: '#fb7185' },
            { id: 'leyenda', name: 'Leyenda', minXp: 3500, icon: 'fa-crown', color: '#fbbf24' }
        ],

        badges: [
            { id: 'badge_starter', name: 'Debutante', icon: 'fa-flag-checkered', description: 'Completaste tu primer partido.' },
            { id: 'badge_streak_5', name: 'Constante', icon: 'fa-fire', description: '5 días seguidos activos.' },
            { id: 'badge_wins_10', name: 'Ganador', icon: 'fa-trophy', description: '10 victorias acumuladas.' },
            { id: 'badge_answers_100', name: 'Preciso', icon: 'fa-bullseye', description: '100 respuestas correctas.' },
            { id: 'badge_legend', name: 'Leyenda CT', icon: 'fa-crown', description: 'Alcanzaste el nivel Leyenda.' }
        ],

        /**
         * Achievements — reusable definitions with progress rules.
         * rule.type: games_played | wins | correct_answers | streak_days | perfect_rosco | game_wins | daily_challenge
         */
        achievements: [
            {
                id: 'first_match',
                title: 'Primer partido',
                description: 'Jugá tu primera partida en Crack Total.',
                icon: 'fa-play',
                target: 1,
                rule: { type: 'games_played' },
                badgeId: 'badge_starter'
            },
            {
                id: 'wins_10',
                title: '10 victorias',
                description: 'Acumulá 10 victorias en cualquier juego.',
                icon: 'fa-trophy',
                target: 10,
                rule: { type: 'wins' },
                badgeId: 'badge_wins_10'
            },
            {
                id: 'answers_100',
                title: '100 respuestas',
                description: 'Acertá 100 respuestas en total.',
                icon: 'fa-check-double',
                target: 100,
                rule: { type: 'correct_answers' },
                badgeId: 'badge_answers_100'
            },
            {
                id: 'streak_5',
                title: '5 días seguidos',
                description: 'Mantené una racha de actividad de 5 días.',
                icon: 'fa-fire',
                target: 5,
                rule: { type: 'streak_days' },
                badgeId: 'badge_streak_5'
            },
            {
                id: 'perfect_rosco',
                title: 'Rosco perfecto',
                description: 'Completá un rosco de Pasala Che sin errores.',
                icon: 'fa-circle-notch',
                target: 1,
                rule: { type: 'perfect_rosco' }
            },
            {
                id: 'world_specialist',
                title: 'Especialista Mundial',
                description: 'Ganá 5 partidas en modos de mundiales / Top 10.',
                icon: 'fa-globe',
                target: 5,
                rule: { type: 'game_wins', gameId: 'top10' }
            },
            {
                id: 'trivia_king',
                title: 'Rey de las Trivias',
                description: 'Ganá 15 partidas en juegos de trivia (QSM / Mentiroso / Top 10).',
                icon: 'fa-crown',
                target: 15,
                rule: { type: 'trivia_wins' }
            },
            {
                id: 'daily_3',
                title: 'Ritual diario',
                description: 'Completá el desafío diario 3 veces.',
                icon: 'fa-calendar-check',
                target: 3,
                rule: { type: 'daily_challenge' }
            },
            {
                id: 'mi_carrera_elite',
                title: 'Jugador de élite',
                description: 'Completá una carrera de Mi Carrera con score 7.0 o más.',
                icon: 'fa-route',
                target: 1,
                rule: { type: 'game_wins', gameId: 'mi_carrera' }
            },
            {
                id: 'mi_carrera_legend',
                title: 'Leyenda de carrera',
                description: 'Acumulá 3 carreras élite en Mi Carrera.',
                icon: 'fa-crown',
                target: 3,
                rule: { type: 'game_wins', gameId: 'mi_carrera' }
            }
        ],

        rankings: {
            mockBasePath: 'assets/data/rankings',
            scopes: ['global', 'weekly', 'monthly', 'friends']
        },

        features: {
            animations: true,
            toastOnUnlock: true,
            migrateLegacyStats: true
        }
    };

    window.CrackTotalGamificationConfig = GamificationConfig;

    if (window.CrackTotalConfig) {
        window.CrackTotalConfig.features = Object.assign({}, window.CrackTotalConfig.features, {
            gamification: true
        });
        window.CrackTotalConfig.gamification = {
            storageKey: GamificationConfig.storageKey,
            version: GamificationConfig.version
        };
    }
})();
