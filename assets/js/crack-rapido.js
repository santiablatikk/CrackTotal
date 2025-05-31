// Crack Rápido - Sistema de Trivia de Velocidad MEGA EDITION
// Crack Total - 2025
// Fallback temporal para Firebase hasta que se resuelvan los módulos
let saveCrackRapidoResult = async (data) => {
    console.log('Fallback: Datos que se guardarían en Firebase:', data);
    return Promise.resolve();
};

// Intentar cargar Firebase de forma asíncrona
async function loadFirebaseUtils() {
    try {
        // Intentar acceder a la función desde el contexto global
        if (window.firebase && window.firebase.auth && window.firebase.firestore) {
            console.log('Firebase utilities detected from global context');
            // Aquí podrías definir saveCrackRapidoResult usando las funciones globales de Firebase
        }
    } catch (error) {
        console.warn('Firebase utilities not available, using fallback');
    }
}

// Cargar Firebase utilities
loadFirebaseUtils();

class CrackRapido {
    constructor() {
        this.questions = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.timer = null;
        this.timeRemaining = 5;
        this.gameStartTime = 0;
        this.questionStartTime = 0;
        this.answerTimes = [];
        this.isGameActive = false;
        this.totalQuestions = 20; // Default value, will be adjusted by game mode
        // Nuevas propiedades para los modos de juego
        this.gameMode = 'classic'; // classic, survival, category
        this.selectedCategory = 'general';
        this.powerUps = {
            timeExtra: 2, // Reducido de 3 a 2 para mayor desafío
            removeOption: 2, // Reducido de 3 a 2
            scoreMultiplier: 1 // Reducido de 2 a 1 para mayor balance
        };
        this.survivalLives = 3;
        this.currentMultiplier = 1;
        this.multiplayerStreak = 1;
        // NUEVAS CARACTERÍSTICAS AVANZADAS
        this.achievements = [];
        this.soundEnabled = true;
        this.animationsEnabled = true;
        this.difficulty = 'normal'; // easy, normal, hard, extreme
        this.combo = 0;
        this.perfectAnswers = 0; // Respuestas en menos de 2 segundos
        this.powerUpUsedThisGame = { timeExtra: 0, removeOption: 0, scoreMultiplier: 0 };
        this.sessionStats = {
            totalGamesPlayed: 0,
            totalTimeSpent: 0,
            categoriesPlayed: new Set(),
            modesPlayed: new Set()
        };
        // SISTEMA DE RANKINGS DINÁMICO
        this.rankings = {
            global: [],
            classic: [],
            survival: [],
            category: {
                messi: [],
                boca: [],
                river: [],
                mundial: [],
                champions: [],
                argentina: [],
                general: []
            }
        };
        // SISTEMA DE ESTADÍSTICAS AVANZADAS
        this.detailedStats = {
            totalQuestions: 0,
            averageResponseTime: 0,
            bestStreak: 0,
            worstStreak: 0,
            powerUpEfficiency: { timeExtra: 0, removeOption: 0, scoreMultiplier: 0 },
            categoryPerformance: {},
            difficultyPerformance: { easy: 0, medium: 0, hard: 0 },
            timeOfDayPerformance: {},
            weekdayPerformance: {}
        };
        this.initializeElements();
        this.loadQuestions();
        this.loadStats();
        this.loadSettings();
        this.initializeAudio();
        this.setupEventListeners();
        this.loadAchievements();
    }
    initializeElements() {
        // Pantallas
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.resultsScreen = document.getElementById('resultsScreen');
        this.gameModeScreen = document.getElementById('gameModeScreen');
        this.categoryScreen = document.getElementById('categoryScreen');
        this.gamePanel = document.getElementById('gamePanel');
        // Elementos del juego
        this.timerCircle = document.getElementById('timerCircle');
        this.questionText = document.getElementById('questionText');
        this.optionsGrid = document.getElementById('optionsGrid');
        this.progressBar = document.getElementById('progressBar');
        // Stats
        this.currentQuestionDisplay = document.getElementById('currentQuestion');
        this.currentScoreDisplay = document.getElementById('currentScore');
        this.currentStreakDisplay = document.getElementById('currentStreak');
        this.livesDisplay = document.getElementById('livesDisplay');
        this.multiplierDisplay = document.getElementById('multiplierDisplay');
        // Power-ups - Verificar que existan antes de asignar
        this.powerUpButtons = {};
        const timeExtraBtn = document.getElementById('powerUpTimeExtra');
        const removeOptionBtn = document.getElementById('powerUpRemoveOption');
        const multiplierBtn = document.getElementById('powerUpMultiplier');
        if (timeExtraBtn) this.powerUpButtons.timeExtra = timeExtraBtn;
        if (removeOptionBtn) this.powerUpButtons.removeOption = removeOptionBtn;
        if (multiplierBtn) this.powerUpButtons.scoreMultiplier = multiplierBtn;
        // Botones - Verificar que existan
        this.startGameBtn = document.getElementById('startGameBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        // Records
        this.bestScoreDisplay = document.getElementById('bestScore');
        this.gamesPlayedDisplay = document.getElementById('gamesPlayed');
        this.totalCorrectDisplay = document.getElementById('totalCorrect');
        this.bestStreakDisplay = document.getElementById('bestStreak');
        // Resultados
        this.finalScoreDisplay = document.getElementById('finalScore');
        this.scoreMessage = document.getElementById('scoreMessage');
        this.correctAnswersDisplay = document.getElementById('correctAnswers');
        this.totalTimeDisplay = document.getElementById('totalTime');
        this.averageTimeDisplay = document.getElementById('averageTime');
        this.maxStreakDisplay = document.getElementById('maxStreak');
        this.newRecordsSection = document.getElementById('newRecords');
        // Log para debugging
        console.log('Elements initialized:', {
            startGameBtn: !!this.startGameBtn,
            powerUpButtons: Object.keys(this.powerUpButtons),
            screens: {
                start: !!this.startScreen,
                game: !!this.gameScreen,
                results: !!this.resultsScreen
            }
        });
    }
    loadQuestions() {
        this.questionBank = {
            // CATEGORÍA: MESSI
            
                "messi": [
                  {
                    "category": "Messi",
                    "question": "¿Cuántos Balones de Oro había ganado Messi hasta finales de 2024?",
                    "options": ["7", "8", "9", "6"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Messi",
                    "question": "¿En qué fecha exacta nació Lionel Messi?",
                    "options": ["24 de junio de 1987", "24 de junio de 1986", "25 de junio de 1987", "23 de junio de 1987"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos goles oficiales marcó Messi en el año calendario 2012, estableciendo un récord mundial?",
                    "options": ["89", "90", "91", "92"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿A qué edad debutó Messi en Primera División con Barcelona?",
                    "options": ["16 años", "17 años", "18 años", "15 años"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Contra qué equipo marcó Messi su primer gol oficial con Barcelona?",
                    "options": ["Real Madrid", "Albacete", "Athletic Bilbao", "Valencia"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos goles marcó Messi en el Mundial de Qatar 2022, donde Argentina fue campeona?",
                    "options": ["6", "7", "8", "5"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Messi",
                    "question": "¿En qué año Messi ganó su primera Copa América con la selección mayor, rompiendo una larga sequía para Argentina?",
                    "options": ["2019", "2021", "2024", "2016"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos hat-tricks oficiales tenía Messi en su carrera hasta finales de 2024?",
                    "options": ["55", "57", "59", "61"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Qué dorsal usa Messi en Inter Miami CF?",
                    "options": ["9", "10", "30", "19"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántas UEFA Champions League ganó Messi con el FC Barcelona?",
                    "options": ["3", "4", "5", "2"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿En qué ciudad argentina nació Lionel Messi?",
                    "options": ["Buenos Aires", "Rosario", "Córdoba", "Mendoza"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos goles marcó Messi en LaLiga española durante toda su carrera allí, siendo el máximo goleador histórico?",
                    "options": ["472", "474", "476", "470"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Contra qué equipo Messi hizo su debut oficial en la Selección Argentina mayor, siendo expulsado pocos minutos después?",
                    "options": ["Brasil", "Uruguay", "Hungría", "Paraguay"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿En qué año Messi fichó por el Paris Saint-Germain (PSG) tras su salida del Barcelona?",
                    "options": ["2020", "2021", "2022", "2019"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos goles de tiro libre directo había marcado Messi en su carrera hasta finales de 2024?",
                    "options": ["65", "62", "68", "70"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Qué problema de salud relacionado con el crecimiento tuvo Messi de niño, requiriendo tratamiento?",
                    "options": ["Déficit de hormona del crecimiento", "Problema óseo congénito", "Deficiencia nutricional severa", "Problema muscular degenerativo"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos partidos oficiales jugó Messi con el FC Barcelona, siendo el jugador con más apariciones en la historia del club?",
                    "options": ["778", "780", "768", "788"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿En qué año Messi superó el récord de Pelé de más goles con un solo club?",
                    "options": ["2020", "2021", "2019", "2022"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos años tenía Messi cuando se mudó a Barcelona para unirse a La Masia?",
                    "options": ["11", "12", "13", "14"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos goles marcó Messi para el FC Barcelona en su temporada más goleadora (2011-12, todas las competiciones)?",
                    "options": ["72", "73", "74", "75"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "De estos porteros, ¿contra cuál había marcado Messi más goles en su carrera hasta finales de 2024?",
                    "options": ["Iker Casillas", "Diego López", "Thibaut Courtois", "Jan Oblak"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿En qué posición solía jugar Messi en las categorías inferiores del FC Barcelona antes de ser extremo derecho en el primer equipo?",
                    "options": ["Mediocentro defensivo", "Delantero centro (9)", "Mediapunta o enganche", "Lateral izquierdo"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos títulos oficiales ganó Messi con el FC Barcelona en total?",
                    "options": ["34", "35", "36", "33"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿En qué Copa del Mundo Messi fue galardonado con el Balón de Oro del torneo por primera vez?",
                    "options": ["Alemania 2006", "Sudáfrica 2010", "Brasil 2014", "Rusia 2018"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos penales había fallado Messi en su carrera profesional (club y selección) hasta finales de 2024?",
                    "options": ["Aprox. 29", "Aprox. 31", "Aprox. 33", "Aprox. 27"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuál fue el primer club profesional en el que Messi jugó (considerando equipo filial)?",
                    "options": ["Newell's Old Boys", "Grandoli", "FC Barcelona C", "FC Barcelona B"],
                    "correct": 3,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántas Ligas españolas (LaLiga) ganó Messi con el FC Barcelona?",
                    "options": ["10", "11", "9", "12"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Qué jugador dio más asistencias a Messi en el FC Barcelona?",
                    "options": ["Xavi Hernández", "Andrés Iniesta", "Luis Suárez", "Dani Alves"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuál es el récord de Messi de goles en un año calendario (2012)?",
                    "options": ["89", "90", "91", "92"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos Mundiales de Clubes de la FIFA ganó Messi con el FC Barcelona?",
                    "options": ["2", "3", "4", "1"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuál fue el primer club NO argentino de Messi?",
                    "options": ["FC Barcelona", "PSG", "Inter Miami CF", "AS Monaco"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos años consecutivos fue Messi el máximo goleador de LaLiga (Trofeo Pichichi) en su racha más larga?",
                    "options": ["3", "5", "4", "6"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Qué edad tenía Messi cuando ganó su primer Balón de Oro en 2009?",
                    "options": ["21", "22", "23", "20"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántos goles marcó Messi en LaLiga en su última temporada en Barcelona (2020-21)?",
                    "options": ["30", "32", "28", "35"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Messi",
                    "question": "¿En qué año Messi debutó oficialmente en la Primera División con el FC Barcelona?",
                    "options": ["2003", "2004", "2005", "2006"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿En qué club argentino jugó Messi en categorías inferiores antes de ir a Barcelona?",
                    "options": ["River Plate", "Boca Juniors", "Newell's Old Boys", "Rosario Central"],
                    "correct": 2,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Qué premio individual importante ganó Messi en el Mundial Sub-20 de 2005, además del título con Argentina?",
                    "options": ["Bota de Oro y Balón de Oro", "Solo Bota de Oro", "Solo Balón de Oro", "Mejor Jugador Joven del Torneo"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿En qué año Messi ganó la medalla de oro olímpica con Argentina en Pekín?",
                    "options": ["2004", "2008", "2012", "2016"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Messi",
                    "question": "¿Cuántas veces había ganado Messi el premio The Best FIFA al mejor jugador del mundo hasta finales de 2024?",
                    "options": ["1", "2", "3", "4"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuál es el apodo más conocido de Lionel Messi?",
                      "options": ["El Matador", "La Pulga", "El Pibe", "El Mago"],
                      "correct": 1,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuántos goles había marcado Messi con la Selección Argentina hasta finales de 2024, incluyendo la Copa América 2024?",
                      "options": ["106", "108", "111", "115"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuántas Botas de Oro europeas había ganado Messi hasta finales de 2024?",
                      "options": ["4", "5", "6", "7"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Quién fue el entrenador que hizo debutar a Messi en el primer equipo del FC Barcelona?",
                      "options": ["Pep Guardiola", "Tito Vilanova", "Frank Rijkaard", "Louis van Gaal"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuál fue el marcador del partido en el que Messi anotó su primer hat-trick con el Barcelona (contra Real Madrid)?",
                      "options": ["2-2", "3-3", "4-3", "3-2"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuántas Copas del Rey ganó Messi con el FC Barcelona?",
                      "options": ["5", "6", "7", "8"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Messi",
                      "question": "¿En qué año Messi dejó el FC Barcelona?",
                      "options": ["2020", "2021", "2022", "2019"],
                      "correct": 1,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuántos Mundiales de la FIFA había disputado Messi hasta finales de 2024?",
                      "options": ["3", "4", "5", "6"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuál es el récord de goles de Messi en una sola temporada de LaLiga?",
                      "options": ["45 goles", "50 goles", "55 goles", "48 goles"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Contra qué selección Messi marcó su primer gol en un Mundial (Alemania 2006)?",
                      "options": ["Países Bajos", "Costa de Marfil", "Serbia y Montenegro", "México"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Messi",
                      "question": "¿En qué año Messi ganó el premio Laureus al Mejor Deportista Masculino Internacional del Año (compartido)?",
                      "options": ["2019", "2020", "2023", "2015"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuántos goles anotó Messi en la final del Mundial de Qatar 2022 contra Francia?",
                      "options": ["1", "2", "3", "Ninguno, solo en penales"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuántas Supercopas de España ganó Messi con el FC Barcelona?",
                      "options": ["6", "7", "8", "9"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Quién fue el primer entrenador de Messi en la Selección Argentina absoluta?",
                      "options": ["Diego Maradona", "José Pekerman", "Alfio Basile", "Marcelo Bielsa"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Messi",
                      "question": "¿En qué año Messi ganó el premio Golden Boy?",
                      "options": ["2004", "2005", "2006", "2007"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuántos goles aproximadamente marcó Messi para el PSG en todas las competiciones?",
                      "options": ["22", "32", "42", "52"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Contra qué equipo Messi marcó su famoso gol 'maradoniano' en la Copa del Rey 2007?",
                      "options": ["Real Madrid", "Sevilla", "Getafe", "Valencia"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuántas veces fue Messi el máximo goleador de la UEFA Champions League?",
                      "options": ["4", "5", "6", "7"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Quién asistió a Messi en su primer gol oficial con el FC Barcelona?",
                      "options": ["Xavi Hernández", "Andrés Iniesta", "Samuel Eto'o", "Ronaldinho"],
                      "correct": 3,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Messi",
                      "question": "¿Cuántos goles había marcado Messi en 'El Clásico' contra el Real Madrid hasta su salida del Barcelona?",
                      "options": ["20", "23", "26", "29"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Messi",
                      "question": "¿En qué liga juega Messi desde que se unió al Inter Miami CF?",
                      "options": ["USL Championship", "MLS (Major League Soccer)", "Liga MX (México)", "NWSL"],
                      "correct": 1,
                      "difficulty": "easy"
                  }
                ],
                "boca": [
                  {
                    "category": "Boca",
                    "question": "¿En qué fecha exacta se fundó el Club Atlético Boca Juniors?",
                    "options": ["3 de abril de 1905", "3 de mayo de 1905", "3 de abril de 1904", "1 de abril de 1905"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuántas Copas Libertadores de América había ganado Boca Juniors hasta finales de 2024?",
                    "options": ["5", "6", "7", "8"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Quién es el máximo goleador histórico de Boca Juniors?",
                    "options": ["Francisco Varallo", "Martín Palermo", "Juan Román Riquelme", "Roberto Cherro"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuántos goles oficiales marcó Martín Palermo en Boca Juniors?",
                    "options": ["236", "238", "234", "240"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuál es la capacidad habilitada aproximada y oficial de La Bombonera a finales de 2024?",
                    "options": ["49.000", "54.000", "60.000", "57.000"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿En qué año se inauguró oficialmente el estadio La Bombonera?",
                    "options": ["1938", "1940", "1941", "1939"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuál de estos colores usó Boca Juniors en sus primeras camisetas antes del azul y oro, inspirado por la Juventus?",
                    "options": ["Verde y blanco", "Rosa", "Blanca con tiras negras finas", "Celeste"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuántas Copas Intercontinentales (formato anterior al Mundial de Clubes FIFA) ganó Boca Juniors?",
                    "options": ["2", "3", "4", "1"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Contra qué equipo jugó Boca Juniors su primer partido oficial en la era profesional de AFA (1931)?",
                    "options": ["River Plate", "Atlanta", "San Lorenzo", "Quilmes"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Ha descendido Boca Juniors alguna vez de la Primera División del fútbol argentino?",
                    "options": ["Sí, en 1949", "Sí, en 1980", "Sí, dos veces", "Nunca descendió"],
                    "correct": 3,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Quién es el jugador con más partidos disputados en la historia de Boca Juniors?",
                    "options": ["Roberto Mouzo", "Hugo Gatti", "Silvio Marzolini", "Juan Román Riquelme"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿En qué año Juan Román Riquelme debutó oficialmente en la primera de Boca?",
                    "options": ["1995", "1996", "1997", "1998"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuál es el apodo más tradicional y conocido de Boca Juniors, relacionado con sus fundadores?",
                    "options": ["Los Xeneizes", "Los Bosteros", "El Ciclón", "La Academia"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Quién fue una figura clave y goleador en la final de la Copa Libertadores 2007 que ganó Boca?",
                    "options": ["Martín Palermo", "Guillermo Barros Schelotto", "Juan Román Riquelme", "Rodrigo Palacio"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿En qué década Boca Juniors ganó más títulos de Primera División Argentina?",
                    "options": ["1990-1999", "2000-2009", "1960-1969", "1940-1949"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Dónde tuvo Boca Juniors su primera cancha antes de establecerse definitivamente en La Boca?",
                    "options": ["Dársena Sud", "Wilde", "Isla Demarchi", "Sarandí"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "El apodo 'Xeneize' hace referencia al origen de los fundadores del club, que eran principalmente inmigrantes de:",
                    "options": ["Génova (Italia)", "Nápoles (Italia)", "Galicia (España)", "País Vasco (España)"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿En qué año Carlos Tevez debutó oficialmente en la primera de Boca Juniors?",
                    "options": ["2001", "2002", "2000", "2003"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuántas Recopas Sudamericanas había ganado Boca Juniors hasta finales de 2024?",
                    "options": ["3", "4", "2", "5"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Quién fue el director técnico de Boca Juniors durante la conquista de la Copa Libertadores 2000 y 2001?",
                    "options": ["Carlos Bianchi", "Miguel Ángel Russo", "Alfio Basile", "Oscar Tabárez"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿En qué barrio de Buenos Aires se encuentra el estadio La Bombonera?",
                    "options": ["La Boca", "Barracas", "San Telmo", "Puerto Madero"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuántos campeonatos de Primera División del fútbol argentino (ligas) había ganado Boca Juniors hasta finales de 2024?",
                    "options": ["34", "35", "36", "33"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Quién fue el primer presidente de Boca Juniors?",
                    "options": ["Esteban Baglietto", "Alfredo Scarpati", "Santiago Sana", "Juan Rafael Brichetto"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿En qué año Diego Armando Maradona tuvo su primer ciclo como jugador en Boca Juniors, ganando el Metropolitano?",
                    "options": ["1980", "1981", "1982", "1979"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Contra qué equipo europeo Boca Juniors perdió la final de la Copa Intercontinental 2001?",
                    "options": ["Real Madrid", "AC Milan", "Bayern Munich", "Manchester United"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿En qué año se construyó la primera estructura de madera del estadio de Boca en Brandsen y Del Crucero?",
                    "options": ["1924", "1922", "1926", "1920"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuál fue el apodo del exitoso entrenador Carlos Bianchi en Boca Juniors?",
                    "options": ["El Virrey", "El Bambino", "El Flaco", "El Loco"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿En qué año Boca Juniors ganó su primera Copa Libertadores?",
                    "options": ["1977", "1978", "1976", "1979"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuántas Supercopas Sudamericanas (ya extinta) ganó Boca Juniors?",
                    "options": ["1 (1989)", "2", "0", "3"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Algún jugador de Boca Juniors ha ganado el Balón de Oro mientras jugaba en el club?",
                    "options": ["Sí, Maradona en 1981", "Sí, Riquelme en 2001", "Sí, Tevez en 2003", "Ninguno lo ganó jugando en Boca"],
                    "correct": 3,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuál fue la importante reforma que se realizó en La Bombonera en 1996, incluyendo la construcción de palcos?",
                    "options": ["Construcción de los palcos VIP y plateas preferenciales", "Instalación de la iluminación artificial", "Ampliación de la tercera bandeja popular", "Cambio total del césped a sintético"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuál es la mayor goleada histórica de Boca Juniors sobre River Plate en el profesionalismo?",
                    "options": ["6-0 (Amateur)", "5-0", "5-1 (en 1959 y 1982)", "4-0"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Quién fue el entrenador durante el primer ciclo de Carlos Bianchi en Boca (1998-2001)?",
                    "options": ["Carlos Bianchi", "Oscar Tabárez", "Jorge Griffa", "Silvio Marzolini"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Cuántas finales de Copa Libertadores había perdido Boca Juniors hasta finales de 2024?",
                    "options": ["4", "5", "6", "3"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿Contra qué equipo Boca Juniors jugó y ganó su primera final de Copa Libertadores en 1977?",
                    "options": ["Deportivo Cali", "Cruzeiro", "Olimpia", "Santos"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "De los siguientes, ¿qué presidente de Boca Juniors tuvo un mandato más largo y exitoso en términos de títulos internacionales en los 2000s?",
                    "options": ["Mauricio Macri", "Pedro Pompilio", "Jorge Amor Ameal", "Daniel Angelici"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Boca",
                    "question": "¿En qué año Boca Juniors participó por primera vez en la Copa Libertadores de América?",
                    "options": ["1963", "1960", "1965", "1962"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Cuál es el nombre completo oficial del estadio de Boca Juniors?",
                      "options": ["Estadio Alberto J. Armando", "Estadio Camilo Cichero", "La Bombonera de Buenos Aires", "Estadio Brandsen y Del Crucero"],
                      "correct": 0,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Qué jugador de Boca fue famoso por celebrar sus goles como 'El Topo Gigio'?",
                      "options": ["Martín Palermo", "Carlos Tevez", "Juan Román Riquelme", "Guillermo Barros Schelotto"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Qué colores de barco inspiraron la camiseta azul y oro de Boca Juniors?",
                      "options": ["Un barco griego", "Un barco sueco", "Un barco italiano", "Un barco inglés"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Quién fue el autor del famoso 'Muletazo' en un Superclásico de 2000, jugando lesionado?",
                      "options": ["Juan Román Riquelme", "Guillermo Barros Schelotto", "Martín Palermo", "Marcelo Delgado"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Boca",
                      "question": "¿En qué año Boca Juniors ganó la Copa Sudamericana por primera vez?",
                      "options": ["2003", "2004", "2005", "2006"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Quién es conocido como 'El Mellizo' y fue un ídolo de Boca Juniors?",
                      "options": ["Gustavo Barros Schelotto", "Guillermo Barros Schelotto", "Ambos", "Ninguno"],
                      "correct": 1,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Cuál fue el resultado global de la final de la Copa Intercontinental 2000 que Boca le ganó al Real Madrid?",
                      "options": ["1-0", "2-0", "2-1", "3-1"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Qué apodo recibe la hinchada de Boca Juniors?",
                      "options": ["La Guardia Imperial", "Los Borrachos del Tablón", "La Número 12", "La Gloriosa Butteler"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Qué característica arquitectónica hace única a una de las tribunas de La Bombonera, dándole su forma peculiar?",
                      "options": ["Es completamente circular", "Tiene una tribuna recta y muy vertical", "No tiene techo en una popular", "Está construida sobre el Riachuelo"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Quién fue el arquero titular de Boca en la obtención de las Libertadores 2000 y 2001?",
                      "options": ["Roberto Abbondanzieri", "Carlos Navarro Montoya", "Óscar Córdoba", "Agustín Orión"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Quién es el actual presidente de Boca Juniors (a finales de 2024)?",
                      "options": ["Jorge Amor Ameal", "Daniel Angelici", "Juan Román Riquelme", "Mauricio Macri"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Qué famoso jugador uruguayo, conocido como 'El Manteca', fue ídolo en Boca en los 90?",
                      "options": ["Rubén Sosa", "Sergio Martínez", "Enzo Francescoli", "Carlos Aguilera"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Cuántas Copas Argentina había ganado Boca Juniors hasta finales de 2024?",
                      "options": ["2", "3", "4", "5"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Boca",
                      "question": "¿Cuál de estos jugadores NO es considerado uno de los '5 fundadores principales' de Boca Juniors?",
                      "options": ["Esteban Baglietto", "Alfredo Scarpati", "Santiago Sana", "Juan Román Riquelme"],
                      "correct": 3,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Boca",
                      "question": "¿En qué año se produjo el 'Superclásico de la pimienta' en la Copa Libertadores?",
                      "options": ["2013", "2014", "2015", "2016"],
                      "correct": 2,
                      "difficulty": "hard"
                  }
                ],
                "river": [
                  {
                    "category": "River",
                    "question": "¿En qué fecha exacta se fundó el Club Atlético River Plate?",
                    "options": ["25 de mayo de 1901", "25 de mayo de 1900", "26 de mayo de 1901", "25 de mayo de 1904"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Quién es el máximo goleador histórico de River Plate en el profesionalismo?",
                    "options": ["Ángel Labruna", "Bernabé Ferreyra", "Enzo Francescoli", "Oscar Más"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuántos goles marcó Ángel Labruna en campeonatos de liga para River Plate?",
                    "options": ["293", "295", "290", "301"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuál es la capacidad aproximada del Estadio Monumental tras sus últimas remodelaciones a finales de 2024?",
                    "options": ["83.000", "84.500", "86.000", "81.000"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué año River Plate ganó su primera Copa Libertadores de América?",
                    "options": ["1985", "1986", "1996", "1976"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuántos títulos de Primera División Argentina (ligas) había ganado River Plate hasta finales de 2024?",
                    "options": ["36", "37", "38", "35"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Contra qué equipo River Plate ganó la histórica final de la Copa Libertadores 2018 en Madrid?",
                    "options": ["Boca Juniors", "Grêmio", "Palmeiras", "Flamengo"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué año se inauguró oficialmente el Estadio Monumental?",
                    "options": ["1937", "1938", "1939", "1936"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuál es el apodo más tradicional y conocido de River Plate, relacionado con una importante compra de jugadores en los años 30?",
                    "options": ["Los Millonarios", "Las Gallinas", "La Máquina", "El Más Grande"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuántas Copas Libertadores de América había ganado River Plate hasta finales de 2024?",
                    "options": ["4", "5", "3", "6"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué barrio de Buenos Aires se encuentra principalmente el Estadio Monumental?",
                    "options": ["Belgrano", "Núñez", "Saavedra", "Palermo"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "River",
                    "question": "¿Quién fue el primer presidente de River Plate?",
                    "options": ["Leopoldo Bard", "Antonio Vespucio Liberti", "Enrique Salvarezza", "José Bacigaluppi"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué año River Plate descendió a la Primera B Nacional?",
                    "options": ["2010", "2011", "2009", "Nunca descendió"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Quién era el director técnico de River Plate cuando el equipo descendió?",
                    "options": ["Ángel Cappa", "Juan José López", "Daniel Passarella", "Matías Almeyda"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué año River Plate logró el ascenso y regresó a la Primera División?",
                    "options": ["2011", "2012", "2013", "2010"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuántas Copas Argentina había ganado River Plate hasta finales de 2024?",
                    "options": ["2", "3", "4", "1"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué año Marcelo Gallardo asumió como director técnico de River Plate?",
                    "options": ["2013", "2014", "2015", "2012"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuántos títulos oficiales ganó Marcelo Gallardo como director técnico de River Plate?",
                    "options": ["12", "13", "14", "15"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "¿Cómo se conoció a la famosa delantera de River Plate de la década de 1940?",
                    "options": ["La Máquina", "El Ballet Azul", "Los Carasucias", "El Equipo de José"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuál es el nombre completo oficial del club?",
                    "options": ["Club Atlético River Plate", "River Plate Football Club", "Asociación Atlética River Plate", "Real River Plate Club"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué año River Plate ganó su única Copa Intercontinental?",
                    "options": ["1985", "1986", "1996", "1997"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuántos Mundiales de Clubes de la FIFA ha ganado River Plate?",
                    "options": ["0", "1", "2", "3"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Quién es el jugador con más partidos disputados en la historia de River Plate?",
                    "options": ["Reinaldo Merlo", "Ángel Labruna", "Amadeo Carrizo", "Ubaldo Fillol"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué década River Plate ganó más títulos de Primera División Argentina?",
                    "options": ["1940-1949", "1950-1959", "1990-1999", "1970-1979"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "Considerando el historial profesional en torneos de AFA, ¿cuál es el número aproximado de Superclásicos ganados por River Plate sobre Boca Juniors hasta finales de 2024?",
                    "options": ["Alrededor de 80", "Alrededor de 86", "Alrededor de 92", "Alrededor de 75"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué año se disputó el primer Superclásico oficial entre River Plate y Boca Juniors?",
                    "options": ["1913", "1908", "1915", "1928"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuál es una de las mayores goleadas de River Plate a Boca Juniors en la era profesional?",
                    "options": ["5-1 (1941)", "6-0 (Amateur)", "4-1 (1942)", "7-0"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Contra qué equipo River Plate jugó la final de la Copa Libertadores 1986, ganando su primer título?",
                    "options": ["América de Cali", "Peñarol", "Olimpia", "Cobreloa"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "¿Quién marcó el primer gol para River Plate en la final de la Copa Libertadores 2015 contra Tigres UANL?",
                    "options": ["Lucas Alario", "Rodrigo Mora", "Carlos Sánchez", "Ramiro Funes Mori"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué país River Plate ganó su segunda Copa Libertadores en 1996, jugando la final de vuelta en casa?",
                    "options": ["Argentina", "Colombia", "Chile", "Uruguay"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿Cuántas Supercopas Sudamericanas (ya extinta) ganó River Plate?",
                    "options": ["0", "1 (1997)", "2", "3"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "River",
                    "question": "¿En qué año River Plate ganó su más reciente título de liga argentina (Liga Profesional) hasta finales de 2024?",
                    "options": ["2021", "2022", "2023", "No ganó en esos años"],
                    "correct": 2,
                    "difficulty": "easy"
                  },
                  {
                    "category": "River",
                    "question": "¿Quiénes fueron los arquitectos principales del Estadio Monumental?",
                    "options": ["Aslan y Ezcurra", "Mario Roberto Álvarez y Macedonio Ruiz", "Antonio Vespucio Liberti", "Viktor Sulčič y Raúl Bes"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "River",
                    "question": "¿Qué club se fusionó con 'La Rosales' para dar origen a River Plate?",
                    "options": ["Santa Rosa", "Estudiantes de Buenos Aires", "Defensores de Belgrano", "Atlanta"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                      "category": "River",
                      "question": "¿Cuál es el nombre completo del estadio de River Plate?",
                      "options": ["Estadio Monumental Antonio Vespucio Liberti", "Estadio Monumental de Núñez", "Estadio Ángel Labruna", "Estadio Monumental José Fierro"],
                      "correct": 0,
                      "difficulty": "medium"
                  },
                  {
                      "category": "River",
                      "question": "¿Qué ídolo de River Plate es conocido como 'El Príncipe'?",
                      "options": ["Ariel Ortega", "Norberto Alonso", "Enzo Francescoli", "Marcelo Salas"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "River",
                      "question": "¿Cuántas Recopas Sudamericanas había ganado River Plate hasta finales de 2024?",
                      "options": ["1", "2", "3", "4"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "River",
                      "question": "¿Cuál de estos jugadores NO formó parte de la famosa delantera 'La Máquina'?",
                      "options": ["Juan Carlos Muñoz", "José Manuel Moreno", "Adolfo Pedernera", "Bernabé Ferreyra"],
                      "correct": 3,
                      "difficulty": "hard"
                  },
                  {
                      "category": "River",
                      "question": "¿Contra qué equipo River Plate jugó la Promoción en 2011 que definió su descenso?",
                      "options": ["Rosario Central", "Instituto de Córdoba", "Belgrano de Córdoba", "Chacarita Juniors"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "River",
                      "question": "¿Quién fue el presidente de River Plate durante el exitoso ciclo de Marcelo Gallardo?",
                      "options": ["Daniel Passarella", "Rodolfo D'Onofrio", "José María Aguilar", "Jorge Brito"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "River",
                      "question": "¿Qué apodo despectivo suelen usar los hinchas rivales para referirse a River Plate?",
                      "options": ["Xeneizes", "Gallinas", "Bosteros", "Cuervos"],
                      "correct": 1,
                      "difficulty": "easy"
                  },
                  {
                      "category": "River",
                      "question": "¿En qué año River Plate logró un 'Tricampeonato' de liga argentina en la década de 1990?",
                      "options": ["1991-1992-1993", "1996-1997-1998 (Apertura '96, Clausura '97, Apertura '97)", "1994-1995-1996", "1998-1999-2000"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "River",
                      "question": "¿Qué histórico jugador de River Plate es conocido como 'El Beto'?",
                      "options": ["Norberto Alonso", "Enzo Francescoli", "Ariel Ortega", "Ángel Labruna"],
                      "correct": 0,
                      "difficulty": "easy"
                  },
                  {
                      "category": "River",
                      "question": "¿Quién fue el arquero titular de River Plate en la Copa Libertadores ganada en 2018?",
                      "options": ["Marcelo Barovero", "Germán Lux", "Franco Armani", "Augusto Batalla"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "River",
                      "question": "¿Cuál fue la primera camiseta de River Plate antes de la banda roja?",
                      "options": ["Totalmente blanca", "A rayas verticales rojas y blancas", "Azul con banda blanca", "Roja con detalles blancos"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                      "category": "River",
                      "question": "¿Quién es el actual entrenador de River Plate (a finales de 2024)?",
                      "options": ["Marcelo Gallardo", "Ramón Díaz", "Martín Demichelis", "Hernán Crespo"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "River",
                      "question": "¿Contra qué equipo River Plate ganó la final de la Copa Intercontinental 1986?",
                      "options": ["Juventus FC", "Steaua Bucarest", "AC Milan", "FC Porto"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "River",
                      "question": "¿Cuál de estos jugadores NO es considerado uno de los grandes ídolos de la historia de River Plate?",
                      "options": ["Enzo Francescoli", "Ángel Labruna", "Diego Maradona", "Norberto Alonso"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "River",
                      "question": "¿Cuál fue el último año en que River Plate ganó la Copa Sudamericana hasta 2024?",
                      "options": ["2014", "2015", "2018", "Nunca la ganó"],
                      "correct": 0,
                      "difficulty": "medium"
                  },
                  {
                      "category": "River",
                      "question": "¿Qué jugador de River fue transferido al FC Barcelona y se convirtió en una estrella mundial?",
                      "options": ["Javier Saviola", "Pablo Aimar", "Hernán Crespo", "Marcelo Salas"],
                      "correct": 0,
                      "difficulty": "medium"
                  }
                ],
                "mundial": [
                  {
                    "category": "Mundial",
                    "question": "¿Cuántos Mundiales de fútbol masculino organizados por la FIFA se habían disputado hasta el de Qatar 2022 inclusive?",
                    "options": ["21", "22", "23", "20"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué país ha ganado más Copas del Mundo de fútbol masculino?",
                    "options": ["Alemania", "Italia", "Brasil", "Argentina"],
                    "correct": 2,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Quién es el máximo goleador en la historia de los Mundiales de fútbol masculino?",
                    "options": ["Pelé", "Miroslav Klose", "Ronaldo Nazário", "Gerd Müller"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuántos goles marcó Miroslav Klose en Copas del Mundo?",
                    "options": ["14", "15", "16", "17"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿En qué país se disputó la primera Copa del Mundo de fútbol en 1930?",
                    "options": ["Italia", "Uruguay", "Brasil", "Francia"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué importante tecnología de arbitraje relacionada con el fuera de juego se implementó por primera vez en Qatar 2022?",
                    "options": ["VAR (Video Assistant Referee)", "Goal-line technology", "Sistema de detección semiautomática del fuera de juego", "Comunicadores en banderines"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuál fue el marcador final (tras la prórroga, antes de penales) de la final del Mundial 2022 entre Argentina y Francia?",
                    "options": ["Argentina 3 - 3 Francia", "Argentina 2 - 2 Francia", "Argentina 3 - 2 Francia", "Argentina 2 - 1 Francia"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Quién ganó la Bota de Oro al máximo goleador en el Mundial de Qatar 2022?",
                    "options": ["Lionel Messi", "Kylian Mbappé", "Olivier Giroud", "Julián Álvarez"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué país fue la sede de la Copa del Mundo de fútbol 2018?",
                    "options": ["Alemania", "Rusia", "Brasil", "Sudáfrica"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿En qué año se disputará la próxima Copa del Mundo de fútbol masculino (después de Qatar 2022)?",
                    "options": ["2025", "2026", "2027", "2030"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuántos equipos participaron en la primera Copa del Mundo de 1930?",
                    "options": ["13", "16", "12", "8"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Quién marcó el primer gol en la historia de los Mundiales de fútbol?",
                    "options": ["Lucien Laurent (Francia)", "Héctor Castro (Uruguay)", "Guillermo Stábile (Argentina)", "Bert Patenaude (EEUU)"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué dos países fueron co-anfitriones del Mundial de fútbol 2002?",
                    "options": ["Japón y China", "Corea del Sur y Japón", "China y Corea del Sur", "Tailandia y Japón"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuál es considerada la mayor goleada en un partido de la Copa del Mundo?",
                    "options": ["Hungría 10-1 El Salvador (1982)", "Alemania 8-0 Arabia Saudita (2002)", "Suecia 8-0 Cuba (1938)", "Uruguay 8-0 Bolivia (1950)"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Quién es el jugador más joven en marcar un gol en una Copa del Mundo?",
                    "options": ["Pelé (Brasil)", "Manuel Rosas (México)", "Michael Owen (Inglaterra)", "Lionel Messi (Argentina)"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuántos años tenía Pelé cuando ganó su primera Copa del Mundo en 1958?",
                    "options": ["16", "17", "18", "19"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿En qué Copa del Mundo se utilizó por primera vez el sistema VAR (Video Assistant Referee)?",
                    "options": ["Brasil 2014", "Rusia 2018", "Qatar 2022", "Sudáfrica 2010"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué selección nacional tiene el récord de más subcampeonatos en Mundiales masculinos?",
                    "options": ["Argentina", "Alemania", "Países Bajos", "Italia"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿En qué Mundial Diego Maradona marcó el famoso gol conocido como 'La Mano de Dios'?",
                    "options": ["España 1982", "México 1986", "Italia 1990", "Estados Unidos 1994"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué edición de la Copa del Mundo ostenta el récord de más goles anotados en total?",
                    "options": ["Francia 1998 (171)", "Brasil 2014 (171)", "Qatar 2022 (172)", "Rusia 2018 (169)"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "De estos porteros, ¿quién había jugado más partidos en Copas del Mundo hasta finales de 2024?",
                    "options": ["Gianluigi Buffon (Italia)", "Iker Casillas (España)", "Manuel Neuer (Alemania)", "Hugo Lloris (Francia)"],
                    "correct": 3,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿En qué Mundial reciente Italia no logró clasificarse, causando gran sorpresa?",
                    "options": ["Rusia 2018", "Sudáfrica 2010", "Brasil 2014", "Alemania 2006"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuál fue el primer Mundial de fútbol transmitido por televisión a varios países?",
                    "options": ["Suiza 1954", "Suecia 1958", "Chile 1962", "Inglaterra 1966"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿En qué país se disputó la primera Copa del Mundo de fútbol en el continente africano?",
                    "options": ["Sudáfrica (2010)", "Egipto (propuesto)", "Nigeria (propuesto)", "Marruecos (propuesto)"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuántos hat-tricks (tres goles por un jugador en un partido) se marcaron en el Mundial de Qatar 2022?",
                    "options": ["1", "2", "3", "0"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Quién marcó el único hat-trick en la final de un Mundial (Qatar 2022)?",
                    "options": ["Kylian Mbappé", "Lionel Messi", "Geoff Hurst", "Pelé"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuál Copa del Mundo tuvo el mayor promedio de asistencia de espectadores por partido?",
                    "options": ["Estados Unidos 1994", "Brasil 2014", "Alemania 2006", "México 1970"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿En qué Copa del Mundo se introdujeron por primera vez las tarjetas amarilla y roja?",
                    "options": ["Inglaterra 1966", "México 1970", "Alemania 1974", "Argentina 1978"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuántos países diferentes habían ganado la Copa del Mundo de fútbol masculino hasta finales de 2024?",
                    "options": ["7", "8", "9", "6"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué tres países serán co-anfitriones de la Copa del Mundo 2026?",
                    "options": ["EEUU, México, Costa Rica", "Canadá, EEUU, Bahamas", "México, Canadá, Cuba", "Estados Unidos, Canadá y México"],
                    "correct": 3,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿En qué Copa del Mundo Croacia participó por primera vez como nación independiente, logrando el tercer puesto?",
                    "options": ["Estados Unidos 1994", "Francia 1998", "Corea-Japón 2002", "Alemania 2006"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué edición de la Copa del Mundo tuvo el mayor número de penales sancionados?",
                    "options": ["Rusia 2018", "Qatar 2022", "Brasil 2014", "Corea-Japón 2002"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué jugador es ampliamente reconocido por haber dado un gran número de asistencias clave en el Mundial de México 1986?",
                    "options": ["Diego Maradona", "Pelé", "Jorge Valdano", "Michel Platini"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Ha faltado alguna vez Brasil a una Copa del Mundo de fútbol masculino?",
                    "options": ["Sí, en 1938", "Nunca ha faltado", "Sí, en 1954", "Sí, en 1930"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuál fue el primer Mundial de fútbol masculino en contar con la participación de 32 equipos?",
                    "options": ["Estados Unidos 1994", "Francia 1998", "Corea-Japón 2002", "Alemania 2006"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué jugador es famoso por haber marcado el 'Gol del Siglo' en un Mundial?",
                    "options": ["Diego Maradona", "Pelé", "Lionel Messi", "Johan Cruyff"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿En qué final de Copa del Mundo Zinedine Zidane fue expulsado tras un cabezazo?",
                    "options": ["Francia 1998", "Alemania 2006", "Corea-Japón 2002", "No fue expulsado en una final"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Cuántos goles en propia puerta (autogoles) se marcaron en el Mundial de Qatar 2022?",
                    "options": ["1", "2", "3", "0"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Mundial",
                    "question": "¿Qué selección anfitriona debutó en una Copa del Mundo en Qatar 2022?",
                    "options": ["Qatar", "Canadá", "Arabia Saudita", "Ninguna, todas habían participado antes"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Quién fue el primer jugador en ganar tres Copas del Mundo?",
                      "options": ["Mario Zagallo", "Franz Beckenbauer", "Pelé", "Cafú"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Cómo se llamó la mascota oficial del Mundial de Argentina 1978?",
                      "options": ["Gauchito Mundialito", "Pique", "Naranjito", "Juanito"],
                      "correct": 0,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Cuál fue el nombre del balón oficial del Mundial de México 1970, el primero con diseño de paneles blancos y negros?",
                      "options": ["Telstar", "Tango", "Azteca", "Questra"],
                      "correct": 0,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Qué jugador ostenta el récord de más partidos jugados en la historia de los Mundiales masculinos hasta finales de 2024?",
                      "options": ["Paolo Maldini", "Lothar Matthäus", "Lionel Messi", "Miroslav Klose"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Qué selección africana fue la primera en llegar a cuartos de final de un Mundial (Italia 1990)?",
                      "options": ["Nigeria", "Camerún", "Senegal", "Ghana"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Cómo se llamó el trofeo original de la Copa del Mundo, antes de ser reemplazado por el actual?",
                      "options": ["Copa Stanley", "Trofeo Jules Rimet", "Copa de la Victoria", "Trofeo de la FIFA"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Qué país ganó el Mundial de 1966, jugando como local?",
                      "options": ["Alemania Occidental", "Brasil", "Italia", "Inglaterra"],
                      "correct": 3,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Quién fue el máximo goleador del Mundial de España 1982?",
                      "options": ["Karl-Heinz Rummenigge", "Zbigniew Boniek", "Paolo Rossi", "Zico"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Cuál de estas selecciones NUNCA ha ganado una Copa del Mundo masculina hasta finales de 2024?",
                      "options": ["Uruguay", "Países Bajos", "España", "Francia"],
                      "correct": 1,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Qué selección asiática fue la primera en alcanzar las semifinales de un Mundial (Corea/Japón 2002)?",
                      "options": ["Japón", "Arabia Saudita", "Corea del Sur", "Irán"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Cuál fue la mascota del Mundial de Estados Unidos 1994?",
                      "options": ["Striker, el perro futbolista", "Footix, el gallo", "Ciao, una figura abstracta", "Pique, un chile jalapeño"],
                      "correct": 0,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Quién es el jugador más viejo en haber marcado un gol en un Mundial?",
                      "options": ["Roger Milla", "Stanley Matthews", "Dino Zoff", "Faryd Mondragón"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿En qué Mundial se permitió por primera vez la sustitución de jugadores?",
                      "options": ["Suecia 1958", "Chile 1962", "Inglaterra 1966", "México 1970"],
                      "correct": 3,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Qué país ha llegado a más finales de Copa del Mundo hasta finales de 2024?",
                      "options": ["Brasil", "Alemania", "Italia", "Argentina"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Quién es el jugador con más asistencias registradas en la historia de los Mundiales?",
                      "options": ["Lionel Messi", "Diego Maradona", "Pelé", "Johan Cruyff"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Cuál es la mayor goleada en una final de Copa del Mundo?",
                      "options": ["Brasil 5-2 Suecia (1958)", "Uruguay 4-2 Argentina (1930)", "Francia 3-0 Brasil (1998)", "Alemania 4-2 Hungría (1954)"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Mundial",
                      "question": "¿Qué jugador fue el primero en recibir una tarjeta roja en una final de Copa del Mundo?",
                      "options": ["Pedro Monzón (Argentina, 1990)", "Marcel Desailly (Francia, 1998)", "Zinedine Zidane (Francia, 2006)", "John Heitinga (Países Bajos, 2010)"],
                      "correct": 0,
                      "difficulty": "hard"
                  }
                ],
                "general": [
                  {
                    "category": "General",
                    "question": "¿En qué año la Copa de Campeones de Europa fue renombrada oficialmente a UEFA Champions League?",
                    "options": ["1992", "1993", "1991", "1994"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿Qué club de fútbol tenía más títulos de UEFA Champions League (y Copa de Europa) hasta finales de 2024?",
                    "options": ["FC Barcelona", "Real Madrid CF", "AC Milan", "Liverpool FC"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "General",
                    "question": "¿En qué fecha se fundó la FIFA (Fédération Internationale de Football Association)?",
                    "options": ["21 de mayo de 1904", "15 de junio de 1902", "28 de abril de 1905", "4 de julio de 1903"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "General",
                    "question": "¿A qué país se le atribuye la codificación moderna del fútbol (association football)?",
                    "options": ["Francia", "Inglaterra", "Brasil", "Escocia"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuántos jugadores componen un equipo de fútbol en el campo de juego durante un partido oficial?",
                    "options": ["10", "11", "12", "9"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuánto dura reglamentariamente un partido de fútbol profesional, sin contar el tiempo añadido ni prórrogas?",
                    "options": ["80 minutos", "90 minutos", "100 minutos", "85 minutos"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuántas sustituciones (cambios de jugadores) se permiten por equipo en la mayoría de las competiciones oficiales de fútbol (regla post-pandemia)?",
                    "options": ["3", "4", "5", "6"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuáles son las dimensiones mínimas permitidas para un campo de fútbol en partidos internacionales de adultos (largo x ancho)?",
                    "options": ["100m x 64m", "90m x 45m", "110m x 70m", "95m x 60m"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "General",
                    "question": "¿En qué año se fundó la CONMEBOL (Confederación Sudamericana de Fútbol)?",
                    "options": ["1914", "1916", "1918", "1920"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuál es considerado el club de fútbol más antiguo del mundo reconocido por la FIFA?",
                    "options": ["Sheffield FC", "Notts County", "Cambridge University AFC", "Hallam FC"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "General",
                    "question": "¿Qué significa la sigla UEFA?",
                    "options": ["United European Football Association", "Union of European Football Associations", "Universal European Football Alliance", "Union of Elite Football Assemblies"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿En qué país se disputó la primera Copa Mundial Femenina de la FIFA en 1991?",
                    "options": ["Estados Unidos", "China", "Suecia", "Alemania"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuántas confederaciones continentales componen la FIFA?",
                    "options": ["5", "6", "7", "4"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuál es la altura reglamentaria de una portería de fútbol (desde el suelo hasta el borde inferior del larguero)?",
                    "options": ["2.34 metros", "2.44 metros", "2.50 metros", "2.40 metros"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuál es la velocidad aproximada del disparo de fútbol más potente registrado oficialmente (Ronny Heberson)?",
                    "options": ["181 km/h", "198 km/h", "211 km/h", "225 km/h"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "General",
                    "question": "¿En qué año se implementó la regla que prohíbe a los porteros tomar con las manos un pase deliberado de un compañero de equipo?",
                    "options": ["1990", "1992", "1994", "1988"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "General",
                    "question": "Entre las ligas europeas, ¿qué club escocés ostenta uno de los récords de más títulos de liga nacionales ganados a nivel mundial?",
                    "options": ["Celtic FC", "Rangers FC", "Aberdeen FC", "Heart of Midlothian FC"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuál es el estadio de fútbol con mayor capacidad oficial del mundo a finales de 2024?",
                    "options": ["Camp Nou (España)", "Wembley Stadium (Inglaterra)", "Rungrado Primero de Mayo (Corea del Norte)", "Michigan Stadium (EE.UU.)"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "General",
                    "question": "¿En qué año se establecieron las primeras reglas formalizadas del fuera de juego (offside) por la Football Association inglesa?",
                    "options": ["1863", "1870", "1888", "1857"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuántas federaciones nacionales de fútbol son miembros de la FIFA aproximadamente (a finales de 2024)?",
                    "options": ["209", "211", "207", "215"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿Qué país fue el anfitrión de la primera Copa América en 1916 (entonces Campeonato Sudamericano)?",
                    "options": ["Argentina", "Uruguay", "Brasil", "Chile"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿En qué año se disputó la primera edición de la Copa Libertadores de América?",
                    "options": ["1958", "1960", "1962", "1955"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿Cuál es el traspaso de futbolista más caro de la historia hasta finales de 2024?",
                    "options": ["Neymar Jr. (Barcelona a PSG)", "Kylian Mbappé (Mónaco a PSG)", "Philippe Coutinho (Liverpool a Barcelona)", "João Félix (Benfica a Atlético Madrid)"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿En qué liga nacional juega el Manchester City FC?",
                    "options": ["EFL Championship", "Premier League", "Serie A", "Ligue 1"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "General",
                    "question": "De los siguientes, ¿cuál es uno de los clubes de fútbol profesional más antiguos de Argentina con existencia continua?",
                    "options": ["Gimnasia y Esgrima La Plata (1887)", "Alumni (histórico)", "Quilmes AC (1887)", "Rosario Central (1889)"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "General",
                    "question": "¿Qué significa la sigla VAR en el contexto del fútbol?",
                    "options": ["Video Assistant Referee", "Video Analysis Review", "Verified Action Replay", "Virtual Assessment Rules"],
                    "correct": 0,
                    "difficulty": "easy"
                  },
                  {
                    "category": "General",
                    "question": "¿En qué año se fundó el FC Barcelona?",
                    "options": ["1899", "1902", "1897", "1905"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "¿Quién ganó el Balón de Oro en el año 2008?",
                    "options": ["Lionel Messi", "Kaká", "Cristiano Ronaldo", "Fernando Torres"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "General",
                    "question": "De estos jugadores, ¿quién había ganado más veces la UEFA Champions League/Copa de Europa como jugador hasta finales de 2024?",
                    "options": ["Cristiano Ronaldo", "Lionel Messi", "Paolo Maldini", "Francisco Gento"],
                    "correct": 3,
                    "difficulty": "medium"
                  },
                  {
                      "category": "General",
                      "question": "¿Qué selección ganó la Eurocopa 2024?",
                      "options": ["Inglaterra", "Italia", "España", "Francia"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "General",
                      "question": "¿Cuál es el torneo de clubes más prestigioso de Sudamérica?",
                      "options": ["Copa Sudamericana", "Recopa Sudamericana", "Copa Libertadores", "Suruga Bank Championship"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "General",
                      "question": "¿Qué jugador es conocido como 'CR7'?",
                      "options": ["Cristiano Ronaldo", "Ronaldo Nazário", "Ronaldinho", "Lionel Messi"],
                      "correct": 0,
                      "difficulty": "easy"
                  },
                  {
                      "category": "General",
                      "question": "¿Cuántos puntos se otorgan por una victoria en la mayoría de las ligas de fútbol?",
                      "options": ["1", "2", "3", "4"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "General",
                      "question": "¿En qué país se encuentra la sede de la FIFA?",
                      "options": ["Francia (París)", "Suiza (Zúrich)", "Bélgica (Bruselas)", "Alemania (Múnich)"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "General",
                      "question": "¿Qué organismo rige el fútbol en Asia?",
                      "options": ["CAF", "AFC", "OFC", "CONCACAF"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "General",
                      "question": "¿Cuál es la circunferencia reglamentaria de un balón de fútbol talla 5?",
                      "options": ["60-62 cm", "64-66 cm", "68-70 cm", "72-74 cm"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "General",
                      "question": "¿Quién fue la primera ganadora del Balón de Oro Femenino en 2018?",
                      "options": ["Megan Rapinoe", "Ada Hegerberg", "Alexia Putellas", "Sam Kerr"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "General",
                      "question": "¿Cómo se llama la principal competición de clubes de fútbol en Norteamérica, Centroamérica y el Caribe?",
                      "options": ["MLS Cup", "Liga de Campeones de la CONCACAF", "Copa Oro", "Leagues Cup"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "General",
                      "question": "¿En qué año se jugó el primer partido internacional oficial de fútbol?",
                      "options": ["1863", "1872", "1888", "1901"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "General",
                      "question": "¿Qué es el IFAB?",
                      "options": ["Federación Internacional de Árbitros de Fútbol", "Instituto Financiero del Fútbol Asociado", "International Football Association Board (encargado de las reglas del juego)", "Asociación de Fútbol Amateur Internacional"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "General",
                      "question": "¿Cuál de estos clubes NO es de la ciudad de Milán?",
                      "options": ["AC Milan", "Inter de Milán", "Juventus FC", "Atalanta BC (cercano, pero no Milán)"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "General",
                      "question": "¿Cuántos tiempos tiene un partido de fútbol estándar?",
                      "options": ["Uno", "Dos", "Tres", "Cuatro"],
                      "correct": 1,
                      "difficulty": "easy"
                  },
                  {
                      "category": "General",
                      "question": "¿Qué significa la sigla CAF en el fútbol?",
                      "options": ["Confederación Asiática de Fútbol", "Confederación Africana de Fútbol", "Comité Arbitral de Fútbol", "Campeonato Anual de Federaciones"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "General",
                      "question": "¿Qué famosa regla del fútbol fue significativamente alterada por el 'caso Bosman' en 1995?",
                      "options": ["Regla del fuera de juego", "Reglas de traspaso de jugadores y cuotas de extranjeros", "Uso de tarjetas amarillas y rojas", "Duración de los partidos"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "General",
                      "question": "¿Cuál es el peso reglamentario de un balón de fútbol talla 5 al inicio del partido?",
                      "options": ["350-390 gramos", "400-440 gramos", "410-450 gramos", "460-500 gramos"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "General",
                      "question": "¿En qué ciudad se encuentra el famoso estadio Maracaná?",
                      "options": ["São Paulo", "Buenos Aires", "Río de Janeiro", "Montevideo"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "General",
                      "question": "¿Qué es un 'gol olímpico'?",
                      "options": ["Un gol anotado en los Juegos Olímpicos", "Un gol anotado directamente desde un saque de esquina", "Un gol anotado desde medio campo", "Un gol de chilena"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "General",
                      "question": "¿Cuál de estos NO es un tipo de sanción disciplinaria con tarjeta en el fútbol?",
                      "options": ["Tarjeta amarilla", "Tarjeta roja", "Tarjeta azul", "Ninguna de las anteriores es incorrecta"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "General",
                      "question": "¿Qué significa OFC en el mundo del fútbol?",
                      "options": ["Organización de Fútbol del Caribe", "Oficina Federal de Campeonatos", "Confederación de Fútbol de Oceanía", "Organización de Fútbol Centroamericano"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "General",
                      "question": "¿En qué año se celebró la primera Copa Africana de Naciones?",
                      "options": ["1957", "1960", "1963", "1954"],
                      "correct": 0,
                      "difficulty": "hard"
                  }
                ],
                "champions": [
                  {
                    "category": "Champions",
                    "question": "¿Qué equipo había ganado más veces la UEFA Champions League (incluyendo la Copa de Europa) hasta finales de 2024?",
                    "options": ["AC Milan", "Real Madrid", "Liverpool FC", "FC Barcelona"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Champions",
                    "question": "¿En qué temporada la Copa de Europa fue renombrada oficialmente a UEFA Champions League?",
                    "options": ["1991-92", "1992-93", "1993-94", "1990-91"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Cuántas UEFA Champions League (incluyendo Copa de Europa) había ganado el Real Madrid hasta finales de 2024?",
                    "options": ["13", "14", "15", "16"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Quién es el máximo goleador histórico de la UEFA Champions League hasta finales de 2024?",
                    "options": ["Lionel Messi", "Cristiano Ronaldo", "Robert Lewandowski", "Karim Benzema"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Cuántos goles aproximadamente había marcado Cristiano Ronaldo en la UEFA Champions League hasta el final de su participación en el torneo?",
                    "options": ["140", "135", "145", "130"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Qué equipo ganó la primera edición bajo el nombre de UEFA Champions League en la temporada 1992-93?",
                    "options": ["AC Milan", "FC Barcelona", "Olympique de Marsella", "Manchester United"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Cuál es una de las remontadas más famosas en la historia de la Champions League, conocida como 'La Remontada' del Barcelona al PSG?",
                    "options": ["Barcelona 6-1 PSG (2017)", "Liverpool 4-0 Barcelona (2019)", "AS Roma 3-0 Barcelona (2018)", "Deportivo 4-0 AC Milan (2004)"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Champions",
                    "question": "¿En qué ciudad se jugó la famosa final de la Champions League de 2005, conocida como 'El Milagro de Estambul'?",
                    "options": ["Estambul", "Atenas", "Moscú", "Roma"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Qué equipo ganó la UEFA Champions League en la temporada 2022-2023?",
                      "options": ["Real Madrid", "Manchester City", "Inter de Milán", "Bayern de Múnich"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Cuántas veces había ganado el AC Milan la Champions League (incluyendo Copa de Europa) hasta finales de 2024?",
                    "options": ["6", "7", "5", "8"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Qué país cuenta con más equipos diferentes que han ganado la Champions League/Copa de Europa hasta finales de 2024?",
                      "options": ["España", "Inglaterra", "Italia", "Alemania"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                    "category": "Champions",
                    "question": "¿En qué temporada el Leicester City FC llegó sorprendentemente a los cuartos de final de la Champions League?",
                    "options": ["2015-16", "2016-17", "2017-18", "2014-15"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Qué equipo inglés protagonizó 'El Milagro de Estambul' ganando la Champions en 2005?",
                    "options": ["Manchester United", "Chelsea FC", "Liverpool FC", "Arsenal FC"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Cuál es el récord de goles marcados por un jugador en una sola edición de la Champions League?",
                    "options": ["15 (Lionel Messi)", "17 (Cristiano Ronaldo)", "16 (Robert Lewandowski)", "14 (Ruud van Nistelrooy)"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Qué entrenador había ganado más títulos de Champions League hasta finales de 2024?",
                      "options": ["Carlo Ancelotti (5)", "Zinedine Zidane (3)", "Pep Guardiola (3)", "Bob Paisley (3)"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                    "category": "Champions",
                    "question": "¿En qué año el Ajax de Ámsterdam ganó por última vez la Champions League?",
                    "options": ["1994", "1995", "1996", "1993"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Cuántos equipos ingleses diferentes habían ganado la Champions League/Copa de Europa hasta finales de 2024?",
                      "options": ["4", "5", "6", "3"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Cuántas finales de Champions League perdió el Bayern Múnich en la década de 2010 (2010-2019)?",
                    "options": ["1", "2", "3", "0"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Qué club fue el primero en ganar la Copa de Europa en tres ocasiones consecutivas en la década de 1950?",
                    "options": ["Real Madrid CF", "AC Milan", "SL Benfica", "Ajax"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Champions",
                    "question": "Considerando las finales modernas, ¿cuál de estas finales de Champions League tuvo un total de 6 goles (sin contar tandas de penales)?",
                    "options": ["Real Madrid 4-1 Atlético (2014, tras prórroga)", "Liverpool 3-3 AC Milan (2005)", "Barcelona 3-1 Juventus (2015)", "Bayern 2-1 Dortmund (2013)"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Champions",
                    "question": "De estos países, ¿cuál nunca ha tenido un club campeón de la Champions League/Copa de Europa hasta finales de 2024?",
                    "options": ["Francia", "Escocia", "Rumanía", "Turquía"],
                    "correct": 3,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Cuántas Champions League había ganado Pep Guardiola como entrenador hasta finales de 2024?",
                    "options": ["2", "3", "4", "1"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Qué jugador marcó el gol más rápido en una final de la UEFA Champions League?",
                    "options": ["Paolo Maldini", "Gaizka Mendieta", "Mohamed Salah", "Lars Ricken"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿En qué minuto Paolo Maldini marcó su famoso gol tempranero en la final de la Champions League 2005?",
                      "options": ["Alrededor de los 50 segundos", "Al minuto y 10 segundos", "A los 2 minutos", "A los 45 segundos"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                    "category": "Champions",
                    "question": "¿Qué equipo perdió dos finales de Champions League contra el Real Madrid en la década de 2010 (2014 y 2016)?",
                    "options": ["Atlético de Madrid", "Juventus FC", "Liverpool FC", "Borussia Dortmund"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Quién fue el primer entrenador en ganar la Copa de Europa/Champions League con dos clubes diferentes?",
                      "options": ["Ernst Happel", "Ottmar Hitzfeld", "José Mourinho", "Carlo Ancelotti"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Qué jugador tiene el récord de más apariciones en la UEFA Champions League hasta finales de 2024?",
                      "options": ["Iker Casillas", "Lionel Messi", "Cristiano Ronaldo", "Xavi Hernández"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Cuál fue el primer equipo en ganar la Copa de Europa (actual Champions League) en 1956?",
                      "options": ["AC Milan", "FC Barcelona", "Real Madrid CF", "Manchester United"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Champions",
                      "question": "¿En qué ciudad se jugó la final de la Champions League 2024?",
                      "options": ["París", "Múnich", "Londres", "Estambul"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Qué equipo ganó la Champions League 2024?",
                      "options": ["Borussia Dortmund", "Bayern de Múnich", "Paris Saint-Germain", "Real Madrid"],
                      "correct": 3,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Qué ciudad ha albergado más finales de la Champions League/Copa de Europa hasta 2024?",
                      "options": ["Londres", "París", "Madrid", "Roma"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Cuál es el único equipo que ha ganado la Champions League con una plantilla compuesta exclusivamente por jugadores de su propio país?",
                      "options": ["Ajax (1995)", "Steaua Bucarest (1986)", "Celtic (1967)", "Estrella Roja (1991)"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Quién es el jugador más joven en haber marcado un gol en la historia de la Champions League?",
                      "options": ["Ansu Fati", "Bojan Krkić", "Cesc Fàbregas", "Peter Ofori-Quaye"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Cuál de estos equipos nunca ha ganado la Champions League/Copa de Europa?",
                      "options": ["Borussia Dortmund", "Olympique de Marsella", "Atlético de Madrid", "Feyenoord"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Quién marcó el gol de la victoria para el Manchester United en la final de 1999 contra el Bayern Múnich en el tiempo de descuento?",
                      "options": ["Teddy Sheringham", "Dwight Yorke", "Ole Gunnar Solskjær", "Andy Cole"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Qué equipo tiene el récord de más finales de Champions League/Copa de Europa perdidas?",
                      "options": ["Bayern Múnich", "Juventus FC", "SL Benfica", "Atlético de Madrid"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿En qué año se disputó la primera final de Champions League entre dos equipos del mismo país?",
                      "options": ["1998 (Real Madrid vs Juventus)", "2000 (Real Madrid vs Valencia)", "2003 (AC Milan vs Juventus)", "2008 (Manchester Utd vs Chelsea)"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Cuál es el jugador con más goles en finales de Champions League (formato moderno)?",
                      "options": ["Lionel Messi", "Cristiano Ronaldo", "Gareth Bale", "Didier Drogba"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Qué jugador es el único en haber ganado la Champions League con tres clubes diferentes?",
                      "options": ["Cristiano Ronaldo", "Samuel Eto'o", "Clarence Seedorf", "Xabi Alonso"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Cuál es el equipo que ganó la Champions League de forma invicta más recientemente (hasta 2024)?",
                      "options": ["Bayern Múnich (2020)", "Real Madrid (2022)", "Manchester City (2023)", "FC Barcelona (2015)"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Quién es el portero con más partidos sin encajar goles (clean sheets) en la historia de la Champions League?",
                      "options": ["Manuel Neuer", "Gianluigi Buffon", "Petr Čech", "Iker Casillas"],
                      "correct": 3,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Qué entrenador ha ganado la Champions League tanto como jugador como entrenador con el mismo club?",
                      "options": ["Pep Guardiola (Barcelona)", "Zinedine Zidane (Real Madrid)", "Carlo Ancelotti (AC Milan)", "Todos los anteriores"],
                      "correct": 3,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Cuál es el resultado más abultado en un partido de eliminación directa de la Champions League (un solo partido)?",
                      "options": ["Barcelona 2-8 Bayern Múnich", "Liverpool 7-0 Spartak Moscú", "Real Madrid 8-0 Malmö FF", "AS Roma 1-7 Bayern Múnich"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Champions",
                      "question": "¿Cuál fue el primer club no europeo en ser invitado a jugar la Copa de Europa (antecesora de la Champions League)?",
                      "options": ["Peñarol (Uruguay)", "Santos (Brasil)", "No hubo invitados no europeos", "Boca Juniors (Argentina)"],
                      "correct": 2,
                      "difficulty": "hard"
                  }
                ],
                "argentina": [
                  {
                    "category": "Argentina",
                    "question": "¿Cuántas Copas del Mundo de la FIFA había ganado la Selección Argentina de fútbol masculino hasta finales de 2024?",
                    "options": ["2", "3", "4", "1"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿En qué años Argentina ganó la Copa del Mundo?",
                    "options": ["1978, 1986, 2022", "1978, 1990, 2014", "1986, 1994, 2022", "1974, 1982, 2018"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Cuántas Copas América había ganado la Selección Argentina hasta finales de 2024, incluyendo la edición de 2024?",
                    "options": ["14", "15", "16", "17"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Quién es el máximo goleador histórico de la Selección Argentina de fútbol masculino hasta finales de 2024?",
                    "options": ["Diego Maradona", "Gabriel Batistuta", "Lionel Messi", "Hernán Crespo"],
                    "correct": 2,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Cuántos goles aproximadamente había marcado Lionel Messi con la Selección Argentina mayor hasta finales de 2024?",
                    "options": ["106", "108", "111", "115"],
                    "correct": 2,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿En qué estadio Argentina jugó y ganó la final del Mundial 1978?",
                    "options": ["Estadio Monumental (River Plate)", "La Bombonera (Boca Juniors)", "Estadio José Amalfitani (Vélez)", "Estadio Gigante de Arroyito (Rosario Central)"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Contra qué selección Argentina perdió la final del Mundial de Brasil 2014?",
                    "options": ["Brasil", "Alemania", "Países Bajos", "España"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Quién fue el director técnico de la Selección Argentina que ganó el Mundial de Qatar 2022?",
                    "options": ["Jorge Sampaoli", "Lionel Scaloni", "Gerardo Martino", "Alejandro Sabella"],
                    "correct": 1,
                    "difficulty": "easy"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿En qué año Argentina ganó la Copa América rompiendo una sequía de 28 años sin títulos mayores (antes de la de 2024)?",
                    "options": ["2019", "2021", "2016", "2015"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Cuántos partidos invicta estuvo la Selección Argentina bajo la dirección de Lionel Scaloni antes de perder con Arabia Saudita en Qatar 2022?",
                    "options": ["35", "36", "37", "34"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Quién fue el capitán de la Selección Argentina en la conquista del Mundial 2022?",
                      "options": ["Ángel Di María", "Lionel Messi", "Emiliano Martínez", "Nicolás Otamendi"],
                      "correct": 1,
                      "difficulty": "easy"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿En qué Copa del Mundo Argentina llegó a la final por primera vez en su historia?",
                    "options": ["Uruguay 1930", "Italia 1934", "Brasil 1950", "Suecia 1958"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Cuántas finales de Copa del Mundo había perdido la Selección Argentina hasta finales de 2024?",
                    "options": ["2", "3", "4", "1"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Quién fue el primer director técnico en llevar a Argentina a ganar una Copa del Mundo (1978)?",
                    "options": ["César Luis Menotti", "Carlos Bilardo", "Alfio Basile", "Juan Carlos Lorenzo"],
                    "correct": 0,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿En qué año se fundó la Asociación del Fútbol Argentino (AFA), o su precursora directa con nombre similar?",
                    "options": ["1891", "1893", "1901", "1888"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Contra qué selección se considera que Argentina jugó su primer partido internacional oficial?",
                    "options": ["Brasil", "Uruguay", "Chile", "Paraguay"],
                    "correct": 1,
                    "difficulty": "hard"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Quién es el jugador con más partidos disputados en la historia de la Selección Argentina hasta finales de 2024?",
                    "options": ["Diego Maradona", "Javier Zanetti", "Lionel Messi", "Javier Mascherano"],
                    "correct": 2,
                    "difficulty": "medium"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿En qué Mundial Argentina NO logró clasificarse, siendo una de sus ausencias más notorias?",
                      "options": ["México 1970", "España 1982", "Suecia 1958", "Chile 1962"],
                      "correct": 0,
                      "difficulty": "medium"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿Cuántas medallas de oro olímpicas había ganado la Selección Argentina de fútbol masculino hasta finales de 2024?",
                    "options": ["1", "2", "3", "Ninguna"],
                    "correct": 1,
                    "difficulty": "medium"
                  },
                  {
                    "category": "Argentina",
                    "question": "¿En qué años la Selección Argentina ganó la medalla de oro en fútbol masculino en los Juegos Olímpicos?",
                    "options": ["Atenas 2004 y Pekín 2008", "Sídney 2000 y Atenas 2004", "Pekín 2008 y Londres 2012", "Atlanta 1996 y Atenas 2004"],
                    "correct": 0,
                    "difficulty": "hard"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Qué apodo tenía Diego Armando Maradona?",
                      "options": ["El Pibe de Oro", "El Matador", "El Príncipe", "El Burrito"],
                      "correct": 0,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Quién marcó el gol de la victoria para Argentina en la final de la Copa América 2021 contra Brasil?",
                      "options": ["Lionel Messi", "Lautaro Martínez", "Ángel Di María", "Rodrigo De Paul"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Cuál es el color principal de la camiseta titular de la Selección Argentina?",
                      "options": ["Azul oscuro", "Blanco", "Celeste y blanco a rayas verticales", "Amarillo"],
                      "correct": 2,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Quién fue el entrenador de Argentina en el Mundial de México 1986?",
                      "options": ["César Luis Menotti", "Carlos Salvador Bilardo", "Alfio Basile", "Marcelo Bielsa"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Qué importante torneo internacional de selecciones (CONMEBOL-UEFA) ganó Argentina en 2022, venciendo a Italia?",
                      "options": ["Copa Confederaciones", "Finalissima", "Copa Artemio Franchi", "No ganó otro torneo mayor de ese tipo"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Quién fue el arquero titular de Argentina en la conquista del Mundial de Qatar 2022?",
                      "options": ["Franco Armani", "Gerónimo Rulli", "Juan Musso", "Emiliano Martínez"],
                      "correct": 3,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Cuál es el máximo goleador argentino en la historia de los Mundiales hasta finales de 2024?",
                      "options": ["Diego Maradona", "Gabriel Batistuta", "Lionel Messi", "Mario Kempes"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿En qué Mundial Mario Kempes fue la figura y goleador, llevando a Argentina al título?",
                      "options": ["México 1970", "Alemania 1974", "Argentina 1978", "España 1982"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Cuál fue el primer Mundial que jugó Diego Maradona?",
                      "options": ["Argentina 1978", "España 1982", "México 1986", "Italia 1990"],
                      "correct": 1,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Qué jugador argentino fue conocido como 'El Matador' y fue Bota de Oro en el Mundial 1978?",
                      "options": ["Leopoldo Luque", "Daniel Bertoni", "Mario Kempes", "René Houseman"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Cuántas veces fue Argentina subcampeona de la Copa América hasta finales de 2024?",
                      "options": ["10", "12", "14", "16"],
                      "correct": 2,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Quién anotó el gol decisivo en la final de la Copa América 2024 para Argentina?",
                      "options": ["Lionel Messi", "Julián Álvarez", "Ángel Di María", "Lautaro Martínez"],
                      "correct": 3,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Contra qué equipo Argentina ganó la final de la Copa América 2024?",
                      "options": ["Brasil", "Uruguay", "Colombia", "Chile"],
                      "correct": 2,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Quién fue el máximo goleador de Argentina en el Mundial de 1986?",
                      "options": ["Diego Maradona", "Jorge Valdano", "Jorge Burruchaga", "Claudio Caniggia"],
                      "correct": 0,
                      "difficulty": "medium"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Cuál es la mayor goleada recibida por la Selección Argentina en un Mundial?",
                      "options": ["1-6 vs Checoslovaquia (1958)", "0-5 vs Colombia (Eliminatorias 1993)", "0-4 vs Alemania (2010)", "1-5 vs Países Bajos (1974)"],
                      "correct": 0,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Qué arquero argentino es famoso por atajar penales decisivos en el Mundial 2014 y 2022?",
                      "options": ["Ubaldo Fillol", "Nery Pumpido", "Sergio Goycochea", "Emiliano Martínez"],
                      "correct": 3,
                      "difficulty": "easy"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿En qué año Argentina ganó el Campeonato Sudamericano (actual Copa América) por primera vez?",
                      "options": ["1916", "1921", "1925", "1929"],
                      "correct": 1,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Quién es el director técnico con más partidos dirigidos en la historia de la Selección Argentina hasta finales de 2024?",
                      "options": ["César Luis Menotti", "Carlos Bilardo", "Marcelo Bielsa", "Guillermo Stábile"],
                      "correct": 3,
                      "difficulty": "hard"
                  },
                  {
                      "category": "Argentina",
                      "question": "¿Qué número de camiseta usó Mario Kempes en el Mundial 1978?",
                      "options": ["9", "10", "11", "7"],
                      "correct": 1,
                      "difficulty": "hard"
                  }
                ]
              };
    }

    setupEventListeners() {
        // Verificar elementos principales antes de agregar event listeners
        if (this.startGameBtn) {
            this.startGameBtn.addEventListener('click', () => this.showGameModeSelection());
        } else {
            console.warn('startGameBtn not found');
        }
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.resetGame());
        }
        // Power-ups - Solo agregar listeners si los elementos existen
        if (this.powerUpButtons.timeExtra) {
            this.powerUpButtons.timeExtra.addEventListener('click', () => this.usePowerUp('timeExtra'));
        }
        if (this.powerUpButtons.removeOption) {
            this.powerUpButtons.removeOption.addEventListener('click', () => this.usePowerUp('removeOption'));
        }
        if (this.powerUpButtons.scoreMultiplier) {
            this.powerUpButtons.scoreMultiplier.addEventListener('click', () => this.usePowerUp('scoreMultiplier'));
        }
        // Event listeners para opciones
        const options = document.querySelectorAll('.option-btn');
        if (options.length > 0) {
            options.forEach((option, index) => {
                option.addEventListener('click', () => this.selectAnswer(index));
            });
        }
        // CONFIGURACIÓN - Verificar elementos antes de agregar listeners
        const soundToggle = document.getElementById('soundToggle');
        const animationToggle = document.getElementById('animationToggle');
        const difficultySelect = document.getElementById('difficultySelect');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.soundEnabled = e.target.checked;
                this.saveSettings();
                if (this.soundEnabled && this.sounds) {
                    this.sounds.powerUp(); // Test sound
                }
            });
            soundToggle.checked = this.soundEnabled;
        }
        if (animationToggle) {
            animationToggle.addEventListener('change', (e) => {
                this.animationsEnabled = e.target.checked;
                this.saveSettings();
            });
            animationToggle.checked = this.animationsEnabled;
        }
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
                this.saveSettings();
                this.updateTimeForDifficulty();
            });
            difficultySelect.value = this.difficulty;
        }
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.isGameActive) {
                if (e.key >= '1' && e.key <= '4') {
                    this.selectAnswer(parseInt(e.key) - 1);
                }
                // Hotkeys para power-ups
                if (e.key === 'q' || e.key === 'Q') {
                    this.usePowerUp('timeExtra');
                }
                if (e.key === 'w' || e.key === 'W') {
                    this.usePowerUp('removeOption');
                }
                if (e.key === 'e' || e.key === 'E') {
                    this.usePowerUp('scoreMultiplier');
                }
            }
            // ESC para cerrar configuración
            if (e.key === 'Escape') {
                const settingsPanel = document.getElementById('settingsPanel');
                if (settingsPanel && settingsPanel.style.display !== 'none') {
                    window.toggleSettings();
                }
            }
        });
        console.log('Event listeners setup completed');
    }
    updateTimeForDifficulty() {
        const timeMap = {
            'easy': 6,
            'normal': 5,
            'hard': 4,
            'extreme': 3
        };
        const newTime = timeMap[this.difficulty] || 5;
        // Si hay un juego activo, aplicar el nuevo tiempo
        if (this.isGameActive) {
            this.timeRemaining = Math.min(this.timeRemaining, newTime);
        }
        return newTime;
    }
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        // Aplicar tiempo según dificultad
        const baseTime = this.updateTimeForDifficulty();
        this.timeRemaining = baseTime;
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            if (this.timeRemaining <= 0) {
                this.timeOut();
            }
        }, 1000);
    }
    showGameModeSelection() {
        this.showScreen('gameModeScreen');
    }
    selectGameMode(mode) {
        this.gameMode = mode;
        if (mode === 'category') {
            this.showCategorySelection();
        } else if (mode === 'tournament') {
            this.startTournament();
        } else {
            this.selectedCategory = 'general';
            this.startGame();
        }
    }
    startTournament() {
        // NUEVO MODO TORNEO: 5 rondas de diferentes categorías
        this.tournamentRounds = [
            { category: 'messi', questions: 5, name: 'Ronda Messi' },
            { category: 'boca', questions: 5, name: 'Ronda Boca' },
            { category: 'river', questions: 5, name: 'Ronda River' },
            { category: 'mundial', questions: 5, name: 'Ronda Mundial' },
            { category: 'general', questions: 5, name: 'Ronda Final' }
        ];
        this.currentTournamentRound = 0;
        this.tournamentScore = 0;
        this.tournamentResults = [];
        this.showTournamentIntro();
    }
    showTournamentIntro() {
        // Mostrar introducción del torneo
        const tournamentInfo = `
            🏆 TORNEO CRACK RÁPIDO MEGA 🏆
            5 RONDAS ÉPICAS:
            🌟 Ronda 1: Solo Messi (5 preguntas)
            💙 Ronda 2: Solo Boca (5 preguntas)  
            ❤️ Ronda 3: Solo River (5 preguntas)
            🌍 Ronda 4: Solo Mundial (5 preguntas)
            ⚽ Ronda 5: Final General (5 preguntas)
            📊 PUNTUACIÓN ESPECIAL:
            • Multiplicador x1.5 por modo torneo
            • Bonus por ronda perfecta: +500 puntos
            • Bonus por torneo completo: +1000 puntos
            ¿Estás listo para ser el campeón?
        `;
        if (confirm(tournamentInfo)) {
            this.gameMode = 'tournament';
            this.selectedCategory = this.tournamentRounds[0].category;
            this.totalQuestions = 5;
            this.currentMultiplier = 1.5; // Multiplicador especial para torneo
            this.startGame();
        } else {
            this.resetGame();
        }
    }
    showCategorySelection() {
        this.showScreen('categoryScreen');
    }
    selectCategory(category) {
        this.selectedCategory = category;
        this.startGame();
    }
    startGame() {
        this.showScreen('gameScreen');
        this.resetGameState();
        this.selectQuestions();
        this.loadQuestion();
        this.updateGameStats();
        this.updatePowerUpDisplay();
        this.gameStartTime = Date.now();
        this.isGameActive = true;
    }
    selectQuestions() {
        if (this.gameMode === 'category' && this.questionBank[this.selectedCategory]) {
            this.questions = [...this.questionBank[this.selectedCategory]];
            // En modo categoría, el total de preguntas es el número disponible en esa categoría
            this.totalQuestions = Math.min(this.questions.length, 20); // Máximo 20 preguntas por categoría
        } else {
            // Modo clásico o supervivencia: mezcla de todas las categorías
            this.questions = [];
            Object.values(this.questionBank).forEach(categoryQuestions => {
                this.questions = this.questions.concat(categoryQuestions);
            });
            // En modo clásico: 20 preguntas
            if (this.gameMode === 'classic') {
                this.totalQuestions = 20;
            }
        }
        // Shuffle questions
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }
    resetGameState() {
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.answerTimes = [];
        this.currentMultiplier = 1;
        this.multiplayerStreak = 1;
        // Reset nuevas variables avanzadas
        this.combo = 0;
        this.perfectAnswers = 0;
        this.powerUpUsedThisGame = { timeExtra: 0, removeOption: 0, scoreMultiplier: 0 };
        if (this.gameMode === 'survival') {
            this.survivalLives = 3;
            this.totalQuestions = Infinity;
        } else if (this.gameMode === 'category') {
            // En modo categoría, el total se determina cuando se seleccionan las preguntas
            this.totalQuestions = 20; // Valor por defecto, se ajustará en selectQuestions
        } else {
            // Modo clásico: 20 preguntas
            this.totalQuestions = 20;
        }
        // Reset power-ups
        this.powerUps = {
            timeExtra: 2, // Consistente con la configuración inicial
            removeOption: 2, // Consistente con la configuración inicial  
            scoreMultiplier: 1 // Consistente con la configuración inicial
        };
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    usePowerUp(type) {
        if (this.powerUps[type] <= 0) return;
        this.powerUps[type]--;
        this.powerUpUsedThisGame[type]++; // Track usage for achievements
        // Reproducir sonido de power-up
        this.sounds.powerUp();
        switch (type) {
            case 'timeExtra':
                this.timeRemaining += 3;
                this.showPowerUpEffect('⏰ +3 segundos!', 'var(--neon-blue)');
                break;
            case 'removeOption':
                this.removeIncorrectOptions();
                this.showPowerUpEffect('👁️ ¡2 opciones eliminadas!', 'var(--neon-orange)');
                break;
            case 'scoreMultiplier':
                this.currentMultiplier = 2;
                this.multiplayerStreak = 3;
                this.showPowerUpEffect('🚀 ¡Multiplicador x2 activo!', 'var(--neon-green)');
                break;
        }
        // Crear efecto visual en el botón usado
        const button = this.powerUpButtons[type];
        if (button && this.animationsEnabled) {
            button.style.transform = 'scale(1.2)';
            button.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.5), rgba(255, 140, 0, 0.5))';
            setTimeout(() => {
                button.style.transform = '';
                button.style.background = '';
            }, 300);
        }
        this.updatePowerUpDisplay();
    }
    removeIncorrectOptions() {
        const options = document.querySelectorAll('.option-btn');
        const currentQ = this.questions[this.currentQuestion];
        const correctIndex = currentQ.correct;
        let removedCount = 0;
        let attempts = 0;
        while (removedCount < 2 && attempts < 10) {
            const randomIndex = Math.floor(Math.random() * 4);
            if (randomIndex !== correctIndex && !options[randomIndex].classList.contains('removed')) {
                options[randomIndex].style.opacity = '0.3';
                options[randomIndex].style.pointerEvents = 'none';
                options[randomIndex].classList.add('removed');
                removedCount++;
            }
            attempts++;
        }
    }
    updatePowerUpDisplay() {
        if (this.powerUpButtons.timeExtra) {
            this.powerUpButtons.timeExtra.textContent = `+3s (${this.powerUps.timeExtra})`;
            this.powerUpButtons.timeExtra.disabled = this.powerUps.timeExtra <= 0;
        }
        if (this.powerUpButtons.removeOption) {
            this.powerUpButtons.removeOption.textContent = `50/50 (${this.powerUps.removeOption})`;
            this.powerUpButtons.removeOption.disabled = this.powerUps.removeOption <= 0;
        }
        if (this.powerUpButtons.scoreMultiplier) {
            this.powerUpButtons.scoreMultiplier.textContent = `x2 (${this.powerUps.scoreMultiplier})`;
            this.powerUpButtons.scoreMultiplier.disabled = this.powerUps.scoreMultiplier <= 0;
        }
        if (this.multiplierDisplay) {
            this.multiplierDisplay.textContent = this.currentMultiplier > 1 ? `x${this.currentMultiplier}` : '';
            this.multiplierDisplay.style.display = this.currentMultiplier > 1 ? 'block' : 'none';
        }
    }
    loadQuestion() {
        if (this.gameMode === 'survival' && this.currentQuestion >= this.questions.length) {
            // Reshuffle questions for survival mode
            this.selectQuestions();
            this.currentQuestion = 0;
        }
        
        // Verificar si el juego debe terminar en cualquier modo (classic o category)
        if ((this.gameMode === 'classic' || this.gameMode === 'category') && this.currentQuestion >= this.totalQuestions) {
            this.endGame();
            return;
        }
        
        // Verificar que tenemos preguntas disponibles
        if (!this.questions || this.questions.length === 0) {
            console.error('No questions available');
            this.endGame();
            return;
        }
        
        // En modo categoría, también verificar si nos hemos quedado sin preguntas de esa categoría
        if (this.gameMode === 'category' && this.currentQuestion >= this.questions.length) {
            console.log(`Category mode: completed ${this.currentQuestion} questions out of ${this.questions.length} available`);
            this.endGame();
            return;
        }
        
        if (this.currentQuestion >= this.questions.length) {
            console.error('Question index out of bounds');
            this.endGame();
            return;
        }
        const question = this.questions[this.currentQuestion];
        // Verificar que la pregunta existe y tiene la estructura correcta
        if (!question || !question.question || !question.options || !Array.isArray(question.options)) {
            console.error('Invalid question structure:', question);
            this.currentQuestion++;
            if (this.currentQuestion < this.questions.length) {
                this.loadQuestion(); // Intentar con la siguiente pregunta
            } else {
                this.endGame();
            }
            return;
        }
        this.questionText.textContent = question.question;
        // Shuffle options
        const shuffledOptions = this.shuffleOptions(question.options, question.correct);
        const options = document.querySelectorAll('.option-btn');
        if (options.length !== 4) {
            console.error('Expected 4 option buttons, found:', options.length);
            return;
        }
        options.forEach((option, index) => {
            if (shuffledOptions.options[index]) {
                option.textContent = shuffledOptions.options[index];
                option.disabled = false;
                option.className = 'option-btn';
                option.style.opacity = '1';
                option.style.pointerEvents = 'auto';
            }
        });
        // Update correct answer index after shuffle
        this.questions[this.currentQuestion].correct = shuffledOptions.correctIndex;
        // Aplicar tiempo según dificultad
        const baseTime = this.updateTimeForDifficulty();
        this.timeRemaining = baseTime;
        this.questionStartTime = Date.now();
        this.startTimer();
        this.updateGameStats();
        this.updateProgress();
    }
    shuffleOptions(options, correctIndex) {
        const correctAnswer = options[correctIndex];
        const shuffled = [...options];
        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Find new position of correct answer
        const newCorrectIndex = shuffled.indexOf(correctAnswer);
        return {
            options: shuffled,
            correctIndex: newCorrectIndex
        };
    }
    updateTimerDisplay() {
        this.timerCircle.textContent = this.timeRemaining;
        if (this.timeRemaining <= 2) {
            this.timerCircle.style.background = 'var(--speed-danger)';
            this.timerCircle.style.animation = 'pulse 0.5s infinite';
            // Reproducir sonido de advertencia solo una vez
            if (this.timeRemaining === 2) {
                this.sounds.timeWarning();
            }
        } else {
            this.timerCircle.style.background = 'var(--speed-primary)';
            this.timerCircle.style.animation = 'none';
        }
    }
    selectAnswer(selectedIndex) {
        if (!this.isGameActive) return;
        clearInterval(this.timer);
        const responseTime = (Date.now() - this.questionStartTime) / 1000;
        this.answerTimes.push(responseTime);
        const options = document.querySelectorAll('.option-btn');
        const currentQ = this.questions[this.currentQuestion];
        const correctIndex = currentQ.correct;
        // Disable all options
        options.forEach(option => option.disabled = true);
        if (selectedIndex === correctIndex) {
            this.handleCorrectAnswer(responseTime);
            options[selectedIndex].classList.add('correct');
        } else {
            this.handleIncorrectAnswer();
            options[selectedIndex].classList.add('incorrect');
            options[correctIndex].classList.add('correct');
        }
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }
    handleCorrectAnswer(responseTime) {
        this.correctAnswers++;
        this.streak++;
        this.combo++;
        this.maxStreak = Math.max(this.maxStreak, this.streak);
        // Verificar respuesta perfecta (menos de 2 segundos)
        const isPerfectAnswer = responseTime < 2;
        const isUltraFast = responseTime < 1.5; // Nueva categoría: ultra rápido
        if (isPerfectAnswer) {
            this.perfectAnswers++;
        }
        // NUEVO SISTEMA DE PUNTUACIÓN DINÁMICO MEJORADO
        let baseScore = 100;
        let speedBonus = Math.max(0, Math.floor(75 * (6 - responseTime) / 6)); // Hasta 75 puntos por velocidad
        let streakBonus = Math.min(150, this.streak * 15); // Hasta 150 puntos por racha
        let comboBonus = Math.min(100, this.combo * 8); // Hasta 100 puntos por combo
        let perfectBonus = isPerfectAnswer ? 50 : 0; // Bonus por respuesta perfecta
        let ultraFastBonus = isUltraFast ? 75 : 0; // Bonus ultra rápido
        // Bonus por dificultad de pregunta
        const currentQ = this.questions[this.currentQuestion];
        let difficultyBonus = 0;
        if (currentQ && currentQ.difficulty) {
            switch (currentQ.difficulty) {
                case 'easy': difficultyBonus = 0; break;
                case 'medium': difficultyBonus = 25; break;
                case 'hard': difficultyBonus = 50; break;
            }
        }
        // Calcular multiplicador dinámico
        const dynamicMultiplier = this.calculateDynamicMultiplier();
        let questionScore = Math.floor((baseScore + speedBonus + streakBonus + comboBonus + perfectBonus + ultraFastBonus + difficultyBonus) * dynamicMultiplier);
        this.score += questionScore;
        // Reproducir sonidos contextuales
        if (isUltraFast) {
            this.sounds.combo(); // Sonido especial para ultra rápido
        } else if (isPerfectAnswer) {
            this.sounds.combo(); // Sonido especial para respuesta perfecta
        } else if (this.streak >= 10) {
            this.sounds.combo(); // Sonido de combo para rachas largas
        } else {
            this.sounds.correct(); // Sonido normal de acierto
        }
        // Reducir duración del multiplicador de power-up
        if (this.currentMultiplier > 1.5) { // Solo afecta power-ups, no el multiplicador base del torneo
            this.multiplayerStreak--;
            if (this.multiplayerStreak <= 0) {
                this.currentMultiplier = this.gameMode === 'tournament' ? 1.5 : 1;
            }
        }
        // Crear efectos visuales mejorados con información detallada
        let effectText = `+${questionScore}`;
        let effectColor = 'var(--neon-green)';
        if (isUltraFast) {
            effectText = `⚡ ULTRA RÁPIDO! +${questionScore}`;
            effectColor = 'var(--neon-purple)';
        } else if (isPerfectAnswer) {
            effectText = `⚡ PERFECTO! +${questionScore}`;
            effectColor = 'var(--neon-yellow)';
        } else if (this.combo >= 10) {
            effectText = `🔥 COMBO x${this.combo}! +${questionScore}`;
            effectColor = 'var(--neon-orange)';
        } else if (this.streak >= 15) {
            effectText = `🌟 RACHA ÉPICA x${this.streak}! +${questionScore}`;
            effectColor = 'var(--neon-purple)';
        } else if (this.streak >= 10) {
            effectText = `🌟 GRAN RACHA x${this.streak}! +${questionScore}`;
            effectColor = 'var(--neon-blue)';
        }
        this.showSpeedEffect(effectText, effectColor);
        // Mostrar información del multiplicador si es alto
        if (dynamicMultiplier >= 2.0) {
            setTimeout(() => {
                this.showSpeedEffect(`🚀 Multiplicador x${dynamicMultiplier.toFixed(1)}`, 'var(--neon-pink)');
            }, 800);
        }
        // Crear efectos de partículas para respuestas especiales
        if (isUltraFast || (isPerfectAnswer && this.animationsEnabled)) {
            this.createParticleEffect();
        }
        this.updateGameStats();
    }
    handleIncorrectAnswer() {
        this.streak = 0;
        this.combo = 0; // Reset combo on incorrect answer
        // Reproducir sonido de error
        this.sounds.incorrect();
        if (this.gameMode === 'survival') {
            this.survivalLives--;
            this.showSpeedEffect(`💔 -1 vida`, 'var(--neon-red)');
            if (this.survivalLives <= 0) {
                this.endGame();
                return;
            }
        }
        // Reset multiplier
        this.currentMultiplier = 1;
        this.multiplayerStreak = 1;
        this.updateGameStats();
    }
    timeOut() {
        this.handleIncorrectAnswer();
        this.showSpeedEffect('¡Tiempo agotado!', 'var(--neon-red)');
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }
    nextQuestion() {
        this.currentQuestion++;
        this.loadQuestion();
    }
    updateGameStats() {
        if (this.currentQuestionDisplay) {
            if (this.gameMode === 'survival') {
        this.currentQuestionDisplay.textContent = this.currentQuestion + 1;
            } else {
                this.currentQuestionDisplay.textContent = `${this.currentQuestion + 1}/${this.totalQuestions}`;
            }
        }
        if (this.currentScoreDisplay) {
        this.currentScoreDisplay.textContent = this.score;
        }
        if (this.currentStreakDisplay) {
        this.currentStreakDisplay.textContent = this.streak;
        }
        if (this.livesDisplay && this.gameMode === 'survival') {
            this.livesDisplay.textContent = '❤️'.repeat(this.survivalLives);
            this.livesDisplay.style.display = 'block';
        } else if (this.livesDisplay) {
            this.livesDisplay.style.display = 'none';
        }
        this.updatePowerUpDisplay();
    }
    updateProgress() {
        if (this.gameMode === 'survival') {
            // En modo supervivencia, mostramos las vidas
            const progress = (this.survivalLives / 3) * 100;
            this.progressBar.style.width = `${progress}%`;
            this.progressBar.style.background = progress > 33 ? 'var(--neon-green)' : 'var(--neon-red)';
        } else {
            // En modo clásico, mostramos el progreso de preguntas
        const progress = ((this.currentQuestion + 1) / this.totalQuestions) * 100;
        this.progressBar.style.width = `${progress}%`;
        }
    }
    showSpeedEffect(text, color) {
        const effect = document.createElement('div');
        effect.textContent = text;
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${color};
            font-size: 2rem;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            animation: speedEffect 1.5s ease-out forwards;
        `;
        document.body.appendChild(effect);
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1500);
    }
    showPowerUpEffect(text, color) {
        const effect = document.createElement('div');
        effect.textContent = text;
        effect.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${color};
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            animation: powerUpEffect 2s ease-out forwards;
            text-shadow: 0 0 10px ${color};
        `;
        document.body.appendChild(effect);
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 2000);
    }
    endGame() {
        this.isGameActive = false;
        clearInterval(this.timer);
        const totalTime = (Date.now() - this.gameStartTime) / 1000;
        const averageTime = this.answerTimes.length > 0 ? 
            this.answerTimes.reduce((a, b) => a + b, 0) / this.answerTimes.length : 0;
        const results = {
            score: this.score,
            correctAnswers: this.correctAnswers,
            totalQuestions: this.gameMode === 'survival' ? this.currentQuestion : this.totalQuestions,
            totalTime: totalTime,
            averageTime: averageTime,
            maxStreak: this.maxStreak,
            gameMode: this.gameMode,
            category: this.selectedCategory,
            perfectAnswers: this.perfectAnswers,
            combo: this.combo,
            powerUpsUsed: this.powerUpUsedThisGame
        };
        // Actualizar estadísticas de sesión
        this.sessionStats.totalGamesPlayed++;
        this.sessionStats.totalTimeSpent += totalTime;
        this.sessionStats.categoriesPlayed.add(this.selectedCategory);
        this.sessionStats.modesPlayed.add(this.gameMode);
        // Verificar logros
        this.checkAchievements(results);
        this.saveToFirebase(results);
        this.showResults(results);
    }
    showResults(results) {
        this.finalScoreDisplay.textContent = results.score;
        this.correctAnswersDisplay.textContent = `${results.correctAnswers}/${results.totalQuestions}`;
        this.totalTimeDisplay.textContent = `${results.totalTime.toFixed(1)}s`;
        this.averageTimeDisplay.textContent = `${results.averageTime.toFixed(1)}s`;
        this.maxStreakDisplay.textContent = results.maxStreak;
        // Mensaje según el modo de juego
        let message = '';
        if (this.gameMode === 'survival') {
            message = `¡Supervivencia! Lograste ${results.correctAnswers} preguntas correctas`;
        } else if (this.gameMode === 'category') {
            const categoryNames = {
                'messi': 'Messi',
                'boca': 'Boca Juniors',
                'river': 'River Plate',
                'mundial': 'Mundiales',
                'champions': 'Champions League',
                'argentina': 'Argentina',
                'general': 'General'
            };
            message = `¡Categoría ${categoryNames[this.selectedCategory]}! ${results.correctAnswers}/${results.totalQuestions} correctas`;
        } else {
            const percentage = (results.correctAnswers / results.totalQuestions) * 100;
            if (percentage >= 90) message = '¡Eres un crack total!';
            else if (percentage >= 70) message = '¡Muy buen resultado!';
            else if (percentage >= 50) message = '¡Buen intento!';
            else message = '¡Sigue practicando!';
        }
        this.scoreMessage.textContent = message;
        // Check for new records
        const stats = this.getStoredStats();
        let newRecord = false;
        if (results.score > stats.bestScore) {
            stats.bestScore = results.score;
            newRecord = true;
        }
        if (results.maxStreak > stats.bestStreak) {
            stats.bestStreak = results.maxStreak;
            newRecord = true;
        }
        stats.gamesPlayed++;
        stats.totalCorrect += results.correctAnswers;
        this.saveStats(stats);
        this.updateStatsDisplay(stats);
        if (newRecord) {
            this.newRecordsSection.style.display = 'block';
        } else {
            this.newRecordsSection.style.display = 'none';
        }
        this.showScreen('resultsScreen');
    }
    loadStats() {
        const stats = this.getStoredStats();
        this.updateStatsDisplay(stats);
        this.updateAchievementsDisplay();
    }
    updateAchievementsDisplay() {
        const achievementsCountElement = document.getElementById('achievementsCount');
        const totalAchievementsElement = document.getElementById('totalAchievements');
        if (achievementsCountElement && totalAchievementsElement) {
            const achievementsCount = this.achievements.length;
            const totalPossible = 17; // Actualizado: 4 básicos + 13 nuevos avanzados
            totalAchievementsElement.textContent = `${achievementsCount}/${totalPossible}`;
            achievementsCountElement.style.display = achievementsCount > 0 ? 'flex' : 'none';
        }
    }
    getStoredStats() {
        const defaultStats = {
            bestScore: 0,
            gamesPlayed: 0,
            totalCorrect: 0,
            bestStreak: 0
        };
        try {
            const stored = localStorage.getItem('crackRapidoStats');
            return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats;
        } catch (error) {
            console.error('Error loading stats:', error);
            return defaultStats;
        }
    }
    saveStats(stats) {
        try {
            localStorage.setItem('crackRapidoStats', JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }
    updateStatsDisplay(stats) {
        if (this.bestScoreDisplay) this.bestScoreDisplay.textContent = stats.bestScore;
        if (this.gamesPlayedDisplay) this.gamesPlayedDisplay.textContent = stats.gamesPlayed;
        if (this.totalCorrectDisplay) this.totalCorrectDisplay.textContent = stats.totalCorrect;
        if (this.bestStreakDisplay) this.bestStreakDisplay.textContent = stats.bestStreak;
    }
    async saveToFirebase(results) {
        try {
            if (typeof saveCrackRapidoResult === 'function') {
                const gameData = {
                    result: results.completed ? 'completed' : 'incomplete',
                    score: results.score,
                    correctAnswers: results.correctAnswers,
                    totalQuestions: results.totalQuestions,
                    maxStreak: results.maxStreak,
                    averageTime: results.averageTime,
                    totalTime: results.totalTime,
                    accuracy: results.accuracy,
                    gameMode: this.currentMode,
                    category: this.selectedCategory || 'general',
                    difficulty: this.currentDifficulty,
                    powerUpsUsed: {
                        timeExtra: this.powerUps.timeExtra.maxUses - this.powerUps.timeExtra.uses,
                        removeOption: this.powerUps.removeOption.maxUses - this.powerUps.removeOption.uses,
                        scoreMultiplier: this.powerUps.scoreMultiplier.maxUses - this.powerUps.scoreMultiplier.uses
                    },
                    responseTimes: results.responseTimes || [],
                    streaks: results.streaks || [],
                    completed: results.completed,
                    timestamp: new Date().toISOString()
                };

                await saveCrackRapidoResult(gameData);
                console.log('Crack Rápido data saved to Firebase successfully');
            } else {
                console.log('saveCrackRapidoResult function not available');
            }
        } catch (error) {
            console.error('Error saving Crack Rápido data to Firebase:', error);
        }
    }
    resetGame() {
        this.showScreen('startScreen');
        this.resetGameState();
    }
    showScreen(screenName) {
        const screens = ['startScreen', 'gameModeScreen', 'categoryScreen', 'gameScreen', 'resultsScreen'];
        screens.forEach(screen => {
            const element = document.getElementById(screen);
            if (element) {
                element.classList.add('hidden');
            }
        });
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
    }
    // NUEVOS MÉTODOS AVANZADOS
    initializeAudio() {
        try {
            // Verificar si el navegador soporta AudioContext
            if (!window.AudioContext && !window.webkitAudioContext) {
                console.warn('AudioContext not supported, disabling sounds');
                this.soundEnabled = false;
                this.sounds = {
                    correct: () => {},
                    incorrect: () => {},
                    powerUp: () => {},
                    timeWarning: () => {},
                    combo: () => {}
                };
                return;
            }
            this.sounds = {
                correct: this.createAudioContext([800, 1000, 1200], 0.3),
                incorrect: this.createAudioContext([400, 300, 200], 0.5),
                powerUp: this.createAudioContext([600, 800, 1000, 1200], 0.2),
                timeWarning: this.createAudioContext([300, 350, 300], 0.3),
                combo: this.createAudioContext([800, 1000, 1200, 1400, 1600], 0.2)
            };
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.warn('Error initializing audio:', error);
            this.soundEnabled = false;
            this.sounds = {
                correct: () => {},
                incorrect: () => {},
                powerUp: () => {},
                timeWarning: () => {},
                combo: () => {}
            };
        }
    }
    createAudioContext(frequencies, duration) {
        return () => {
            if (!this.soundEnabled) return;
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                frequencies.forEach((freq, index) => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                    oscillator.start(audioContext.currentTime + index * 0.1);
                    oscillator.stop(audioContext.currentTime + duration);
                });
        } catch (error) {
                console.warn('Error playing sound:', error);
            }
        };
    }
    loadSettings() {
        const settings = localStorage.getItem('crackRapidoSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.soundEnabled = parsed.soundEnabled !== false;
            this.animationsEnabled = parsed.animationsEnabled !== false;
            this.difficulty = parsed.difficulty || 'normal';
        }
    }
    saveSettings() {
        localStorage.setItem('crackRapidoSettings', JSON.stringify({
            soundEnabled: this.soundEnabled,
            animationsEnabled: this.animationsEnabled,
            difficulty: this.difficulty
        }));
    }
    loadAchievements() {
        const achievements = localStorage.getItem('crackRapidoAchievements');
        this.achievements = achievements ? JSON.parse(achievements) : [];
    }
    saveAchievements() {
        localStorage.setItem('crackRapidoAchievements', JSON.stringify(this.achievements));
    }
    checkAchievements(gameResults) {
        const newAchievements = [];
        // LOGROS BÁSICOS
        // Velocista: 10 respuestas en menos de 2 segundos
        if (this.perfectAnswers >= 10 && !this.achievements.includes('velocista')) {
            newAchievements.push({
                id: 'velocista',
                name: '⚡ Velocista',
                description: '10 respuestas en menos de 2 segundos',
                date: new Date().toISOString()
            });
        }
        // Superviviente: 50+ preguntas correctas en supervivencia
        if (this.gameMode === 'survival' && gameResults.correctAnswers >= 50 && !this.achievements.includes('superviviente')) {
            newAchievements.push({
                id: 'superviviente',
                name: '🏆 Superviviente Elite',
                description: '50+ preguntas correctas en modo supervivencia',
                date: new Date().toISOString()
            });
        }
        // Estratega: Usar los 3 power-ups en una partida
        if (this.powerUpUsedThisGame.timeExtra > 0 && 
            this.powerUpUsedThisGame.removeOption > 0 && 
            this.powerUpUsedThisGame.scoreMultiplier > 0 && 
            !this.achievements.includes('estratega')) {
            newAchievements.push({
                id: 'estratega',
                name: '🧠 Estratega Maestro',
                description: 'Usar los 3 power-ups en una partida',
                date: new Date().toISOString()
            });
        }
        // Perfeccionista: 100% aciertos en 20 preguntas
        if (gameResults.correctAnswers === gameResults.totalQuestions && 
            gameResults.totalQuestions >= 20 && 
            !this.achievements.includes('perfeccionista')) {
            newAchievements.push({
                id: 'perfeccionista',
                name: '💎 Perfeccionista',
                description: '100% de aciertos en 20 preguntas',
                date: new Date().toISOString()
            });
        }
        // NUEVOS LOGROS AVANZADOS
        // Rayo: 5 respuestas consecutivas en menos de 1.5 segundos
        if (this.perfectAnswers >= 5 && !this.achievements.includes('rayo')) {
            newAchievements.push({
                id: 'rayo',
                name: '⚡ Rayo',
                description: '5 respuestas consecutivas ultrarrápidas',
                date: new Date().toISOString()
            });
        }
        // Coleccionista: Jugar en todas las categorías
        if (this.sessionStats.categoriesPlayed.size >= 7 && !this.achievements.includes('coleccionista')) {
            newAchievements.push({
                id: 'coleccionista',
                name: '📚 Coleccionista',
                description: 'Jugar en todas las categorías',
                date: new Date().toISOString()
            });
        }
        // Imparable: Racha de 15 respuestas correctas
        if (gameResults.maxStreak >= 15 && !this.achievements.includes('imparable')) {
            newAchievements.push({
                id: 'imparable',
                name: '🔥 Imparable',
                description: 'Racha de 15 respuestas correctas',
                date: new Date().toISOString()
            });
        }
        // Experto en Messi
        if (this.selectedCategory === 'messi' && gameResults.correctAnswers >= 20 && !this.achievements.includes('expertomessi')) {
            newAchievements.push({
                id: 'expertomessi',
                name: '👑 Experto en Messi',
                description: '20+ respuestas correctas sobre Messi',
                date: new Date().toISOString()
            });
        }
        // Bostero de Oro
        if (this.selectedCategory === 'boca' && gameResults.correctAnswers >= 25 && !this.achievements.includes('bosterodeoro')) {
            newAchievements.push({
                id: 'bosterodeoro',
                name: '💙💛 Bostero de Oro',
                description: '25+ respuestas correctas sobre Boca',
                date: new Date().toISOString()
            });
        }
        // Millonario de Platino
        if (this.selectedCategory === 'river' && gameResults.correctAnswers >= 25 && !this.achievements.includes('millonariodeplatino')) {
            newAchievements.push({
                id: 'millonariodeplatino',
                name: '⚪🔴 Millonario de Platino',
                description: '25+ respuestas correctas sobre River',
                date: new Date().toISOString()
            });
        }
        // Historiador Mundial
        if (this.selectedCategory === 'mundial' && gameResults.correctAnswers >= 30 && !this.achievements.includes('historiadormundial')) {
            newAchievements.push({
                id: 'historiadormundial',
                name: '🌍 Historiador Mundial',
                description: '30+ respuestas correctas sobre Mundiales',
                date: new Date().toISOString()
            });
        }
        // Leyenda Champions
        if (this.selectedCategory === 'champions' && gameResults.correctAnswers >= 12 && !this.achievements.includes('leyendachampions')) {
            newAchievements.push({
                id: 'leyendachampions',
                name: '🏆 Leyenda Champions',
                description: '12+ respuestas correctas sobre Champions',
                date: new Date().toISOString()
            });
        }
        // Albiceleste de Corazón
        if (this.selectedCategory === 'argentina' && gameResults.correctAnswers >= 8 && !this.achievements.includes('albicelestedecorazon')) {
            newAchievements.push({
                id: 'albicelestedecorazon',
                name: '🇦🇷 Albiceleste de Corazón',
                description: '8+ respuestas correctas sobre Argentina',
                date: new Date().toISOString()
            });
        }
        // Madrugador: Jugar a las 6 AM
        const hour = new Date().getHours();
        if (hour === 6 && !this.achievements.includes('madrugador')) {
            newAchievements.push({
                id: 'madrugador',
                name: '🌅 Madrugador',
                description: 'Jugar a las 6 de la mañana',
                date: new Date().toISOString()
            });
        }
        // Noctámbulo: Jugar después de medianoche
        if (hour >= 0 && hour <= 3 && !this.achievements.includes('noctambulo')) {
            newAchievements.push({
                id: 'noctambulo',
                name: '🌙 Noctámbulo',
                description: 'Jugar después de medianoche',
                date: new Date().toISOString()
            });
        }
        // Veterano: 100 partidas jugadas
        const stats = this.getStoredStats();
        if (stats.gamesPlayed >= 100 && !this.achievements.includes('veterano')) {
            newAchievements.push({
                id: 'veterano',
                name: '🎖️ Veterano',
                description: '100 partidas completadas',
                date: new Date().toISOString()
            });
        }
        // Máquina de Puntos: 3000+ puntos en una partida
        if (gameResults.score >= 3000 && !this.achievements.includes('maquinadepuntos')) {
            newAchievements.push({
                id: 'maquinadepuntos',
                name: '💯 Máquina de Puntos',
                description: '3000+ puntos en una partida',
                date: new Date().toISOString()
            });
        }
        // Dios del Crack Rápido: 5000+ puntos
        if (gameResults.score >= 5000 && !this.achievements.includes('diosdelcrackrapido')) {
            newAchievements.push({
                id: 'diosdelcrackrapido',
                name: '👑 Dios del Crack Rápido',
                description: '5000+ puntos en una partida',
                date: new Date().toISOString()
            });
        }
        // Agregar nuevos logros
        newAchievements.forEach(achievement => {
            this.achievements.push(achievement.id);
            this.showAchievementUnlocked(achievement);
        });
        if (newAchievements.length > 0) {
            this.saveAchievements();
            this.updateAchievementsDisplay();
        }
    }
    showAchievementUnlocked(achievement) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ffd700, #ff8c00);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 15px;
            font-weight: bold;
            z-index: 2000;
            box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
            animation: achievementSlide 4s ease-in-out forwards;
            max-width: 300px;
            text-align: center;
        `;
        notification.innerHTML = `
            <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">🏆 ¡LOGRO DESBLOQUEADO!</div>
            <div style="font-size: 1rem; font-weight: bold;">${achievement.name}</div>
            <div style="font-size: 0.9rem; opacity: 0.9;">${achievement.description}</div>
        `;
        document.body.appendChild(notification);
        // Reproducir sonido especial
        this.sounds.combo();
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
    createParticleEffect() {
        if (!this.animationsEnabled) return;
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                width: 8px;
                height: 8px;
                background: linear-gradient(45deg, #ffd700, #ff8c00);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1500;
                animation: particleExplosion 1s ease-out forwards;
                transform: translate(-50%, -50%);
            `;
            const angle = (i / 8) * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            particle.style.setProperty('--angle', `${angle}rad`);
            particle.style.setProperty('--distance', `${distance}px`);
            document.body.appendChild(particle);
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }
    // SISTEMA DE MULTIPLICADORES DINÁMICOS
    calculateDynamicMultiplier() {
        let multiplier = this.currentMultiplier;
        // Multiplicador por dificultad de la pregunta
        const currentQ = this.questions[this.currentQuestion];
        if (currentQ && currentQ.difficulty) {
            switch (currentQ.difficulty) {
                case 'easy': multiplier *= 1.0; break;
                case 'medium': multiplier *= 1.2; break;
                case 'hard': multiplier *= 1.5; break;
                default: multiplier *= 1.0;
            }
        }
        // Multiplicador por configuración de dificultad del jugador
        switch (this.difficulty) {
            case 'easy': multiplier *= 0.8; break;
            case 'normal': multiplier *= 1.0; break;
            case 'hard': multiplier *= 1.3; break;
            case 'extreme': multiplier *= 1.6; break;
        }
        // Multiplicador por racha
        if (this.streak >= 10) multiplier *= 1.4;
        else if (this.streak >= 5) multiplier *= 1.2;
        // Multiplicador por combo
        if (this.combo >= 10) multiplier *= 1.3;
        else if (this.combo >= 5) multiplier *= 1.15;
        return multiplier;
    }
}
// Funciones globales para los botones
window.selectGameMode = function(mode) {
    if (window.crackRapidoGame) {
        window.crackRapidoGame.selectGameMode(mode);
    }
};
window.selectCategory = function(category) {
    if (window.crackRapidoGame) {
        window.crackRapidoGame.selectCategory(category);
    }
};
// NUEVAS FUNCIONES GLOBALES PARA CONFIGURACIÓN
window.toggleSettings = function() {
    const settingsPanel = document.getElementById('settingsPanel');
    const startInstructions = document.querySelector('.start-instructions');
    if (settingsPanel) {
        const isVisible = settingsPanel.style.display !== 'none';
        if (isVisible) {
            settingsPanel.style.display = 'none';
            if (startInstructions) startInstructions.style.display = 'block';
    } else {
            settingsPanel.style.display = 'block';
            settingsPanel.classList.add('active');
            if (startInstructions) startInstructions.style.display = 'none';
            // Play sound effect if enabled
            if (window.crackRapidoGame && window.crackRapidoGame.soundEnabled) {
                window.crackRapidoGame.sounds.powerUp();
            }
        }
    }
};
window.showAchievements = function() {
    const achievements = localStorage.getItem('crackRapidoAchievements');
    const achievementsList = achievements ? JSON.parse(achievements) : [];
    let achievementsText = '🏆 LOGROS DESBLOQUEADOS:\n\n';
    if (achievementsList.length === 0) {
        achievementsText += '¡Aún no has desbloqueado ningún logro!\n\nJuega para desbloquear logros especiales como:\n• ⚡ Velocista\n• 🏆 Superviviente Elite\n• 🧠 Estratega Maestro\n• 💎 Perfeccionista';
    } else {
        const achievementNames = {
            'velocista': '⚡ Velocista - 10 respuestas en menos de 2 segundos',
            'superviviente': '🏆 Superviviente Elite - 50+ preguntas correctas en supervivencia',
            'estratega': '🧠 Estratega Maestro - Usar los 3 power-ups en una partida',
            'perfeccionista': '💎 Perfeccionista - 100% de aciertos en 20 preguntas'
        };
        achievementsList.forEach(achievement => {
            achievementsText += `${achievementNames[achievement] || achievement}\n`;
        });
    }
    alert(achievementsText);
};
window.resetProgress = function() {
    if (confirm('¿Estás seguro de que quieres reiniciar TODOS tus progresos, estadísticas y logros? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('crackRapidoStats');
        localStorage.removeItem('crackRapidoSettings');
        localStorage.removeItem('crackRapidoAchievements');
        // Reload the page to reset everything
        window.location.reload();
    }
};
// CSS Animations
const style = document.createElement('style');
style.textContent = `
@keyframes speedEffect {
    0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(0.5);
    }
    50% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -100%) scale(1);
    }
}
@keyframes powerUpEffect {
    0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(0.8);
    }
    20% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.1);
    }
    80% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -70%) scale(0.9);
    }
}
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}
`;
document.head.appendChild(style);
// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.crackRapidoGame = new CrackRapido();
}); 
