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
        const firebaseModule = await import('./firebase-utils.js');
        saveCrackRapidoResult = firebaseModule.saveCrackRapidoResult;
        console.log('Firebase utilities loaded successfully');
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
        this.totalQuestions = 20;
        // Nuevas propiedades para los modos de juego
        this.gameMode = 'classic'; // classic, survival, category
        this.selectedCategory = 'general';
        this.powerUps = {
            timeExtra: 3,
            removeOption: 3,
            scoreMultiplier: 2
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
            messi: [
                {
                    category: "Messi",
                    question: "¿Cuántos Balones de Oro ganó Messi hasta 2024?",
                    options: ["7", "8", "9", "6"],
                    correct: 1,
                    difficulty: "easy"
                },
                {
                    category: "Messi",
                    question: "¿En qué fecha exacta nació Lionel Messi?",
                    options: ["24 de junio de 1987", "24 de junio de 1986", "25 de junio de 1987", "23 de junio de 1987"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos goles oficiales marcó Messi en 2012?",
                    options: ["89", "90", "91", "92"],
                    correct: 2,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿A qué edad debutó Messi en Primera División con Barcelona?",
                    options: ["16 años", "17 años", "18 años", "15 años"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Contra qué equipo marcó Messi su primer gol en Barcelona?",
                    options: ["Real Madrid", "Albacete", "Athletic Bilbao", "Valencia"],
                    correct: 1,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos goles marcó Messi en el Mundial de Qatar 2022?",
                    options: ["6", "7", "8", "5"],
                    correct: 1,
                    difficulty: "easy"
                },
                {
                    category: "Messi",
                    question: "¿En qué año Messi ganó su primera Copa América?",
                    options: ["2019", "2021", "2022", "2020"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos hat-tricks oficiales tiene Messi en su carrera hasta 2024?",
                    options: ["54", "56", "58", "60"],
                    correct: 1,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿Qué dorsal usa Messi en Inter Miami?",
                    options: ["9", "10", "30", "19"],
                    correct: 1,
                    difficulty: "easy"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos Champions League ganó Messi con Barcelona?",
                    options: ["3", "4", "5", "6"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿En qué ciudad argentina nació Lionel Messi?",
                    options: ["Buenos Aires", "Rosario", "Córdoba", "Mendoza"],
                    correct: 1,
                    difficulty: "easy"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos goles marcó Messi en LaLiga española?",
                    options: ["472", "474", "476", "478"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿Contra qué equipo Messi hizo su debut en la Selección Argentina?",
                    options: ["Brasil", "Uruguay", "Hungría", "Paraguay"],
                    correct: 2,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿En qué año Messi fichó por el PSG?",
                    options: ["2020", "2021", "2022", "2019"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos goles de tiro libre tiene Messi en su carrera?",
                    options: ["65", "67", "69", "71"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿Qué problema de crecimiento tuvo Messi de niño?",
                    options: ["Déficit de hormona del crecimiento", "Problema óseo", "Deficiencia nutricional", "Problema muscular"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos partidos jugó Messi con Barcelona?",
                    options: ["778", "780", "782", "784"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿En qué año Messi superó el récord de goles de Pelé?",
                    options: ["2020", "2021", "2022", "2019"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos años tenía Messi cuando se mudó a Barcelona?",
                    options: ["11", "12", "13", "14"],
                    correct: 2,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos goles marcó Messi en su mejor temporada (2011-12)?",
                    options: ["72", "73", "74", "75"],
                    correct: 1,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿Contra qué portero Messi marcó más goles?",
                    options: ["Iker Casillas", "Diego López", "Keylor Navas", "Thibaut Courtois"],
                    correct: 1,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿En qué posición jugaba Messi originalmente en las inferiores?",
                    options: ["Extremo derecho", "Mediocampista", "Delantero centro", "Media punta"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos títulos ganó Messi con Barcelona?",
                    options: ["34", "35", "36", "37"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿En qué Copa del Mundo Messi fue el Mejor Jugador Joven?",
                    options: ["Alemania 2006", "Sudáfrica 2010", "Brasil 2014", "Rusia 2018"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos penales falló Messi en su carrera profesional?",
                    options: ["29", "31", "33", "35"],
                    correct: 1,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿Cuál fue el primer equipo profesional de Messi?",
                    options: ["Newell's Old Boys", "Barcelona", "Grandoli", "Barcelona B"],
                    correct: 2,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿Cuántas Ligas españolas ganó Messi?",
                    options: ["10", "11", "12", "13"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Qué jugador asistió más a Messi en su carrera?",
                    options: ["Xavi", "Iniesta", "Dani Alves", "Jordi Alba"],
                    correct: 2,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿Cuál es el récord de Messi de goles en un año calendario?",
                    options: ["89", "90", "91", "92"],
                    correct: 2,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos Mundiales de Clubes ganó Messi?",
                    options: ["2", "3", "4", "5"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿En qué minuto marcó Messi su gol más rápido en Champions?",
                    options: ["14 segundos", "8 segundos", "22 segundos", "5 segundos"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos años consecutivos Messi fue máximo goleador de LaLiga?",
                    options: ["4", "5", "6", "7"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿Qué edad tenía Messi cuando ganó su primer Balón de Oro?",
                    options: ["21", "22", "23", "24"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Messi",
                    question: "¿Cuántos goles marcó Messi en su última temporada en Barcelona?",
                    options: ["30", "32", "34", "36"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Messi",
                    question: "¿En qué año Messi debutó en Primera División?",
                    options: ["2003", "2004", "2005", "2006"],
                    correct: 1,
                    difficulty: "medium"
                }
            ],
            // CATEGORÍA: BOCA JUNIORS
            boca: [
                {
                    category: "Boca",
                    question: "¿En qué año se fundó Boca Juniors exactamente?",
                    options: ["3 de abril de 1905", "3 de abril de 1904", "3 de mayo de 1905", "3 de abril de 1906"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Cuántas Copas Libertadores ganó Boca Juniors oficialmente?",
                    options: ["5", "6", "7", "8"],
                    correct: 1,
                    difficulty: "easy"
                },
                {
                    category: "Boca",
                    question: "¿Quién es el máximo goleador histórico de Boca Juniors?",
                    options: ["Diego Maradona", "Martín Palermo", "Juan Román Riquelme", "Carlos Tevez"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Cuántos goles marcó Martín Palermo en Boca?",
                    options: ["236", "238", "240", "242"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿Cuál es la capacidad oficial de La Bombonera?",
                    options: ["49.000", "54.000", "57.395", "60.000"],
                    correct: 2,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿En qué año se inauguró La Bombonera?",
                    options: ["1939", "1940", "1941", "1942"],
                    correct: 1,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿De qué color era originalmente la camiseta de Boca?",
                    options: ["Azul y oro", "Blanca", "Rosa y negro", "Roja y blanca"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Cuántos Mundial de Clubes ganó Boca Juniors?",
                    options: ["2", "3", "4", "1"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Contra qué equipo jugó Boca su primer partido oficial?",
                    options: ["River Plate", "Mariano Moreno", "Barracas Athletic", "Quilmes"],
                    correct: 1,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿En qué año Boca descendió por única vez en su historia?",
                    options: ["1979", "1980", "1981", "Nunca descendió"],
                    correct: 3,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Quién es el jugador con más partidos en Boca Juniors?",
                    options: ["Roberto Mouzo", "Hugo Gatti", "Silvio Marzolini", "Antonio Rattín"],
                    correct: 0,
                    difficulty: "hard"
                },                
                {
                    category: "Boca",
                    question: "¿En qué año Juan Román Riquelme debutó en Boca?",
                    options: ["1995", "1996", "1997", "1998"],
                    correct: 2,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Cuál es el apodo más famoso de Boca Juniors?",
                    options: ["Los Xeneizes", "Los Bosteros", "Los Azul y Oro", "Todas las anteriores"],
                    correct: 3,
                    difficulty: "easy"
                },
                {
                    category: "Boca",
                    question: "¿Quién marcó el gol del título en la Libertadores 2007?",
                    options: ["Martín Palermo", "Guillermo Barros Schelotto", "Juan Román Riquelme", "Rodrigo Palacio"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿En qué década Boca ganó más títulos de Primera División?",
                    options: ["1990-1999", "2000-2009", "1940-1949", "1960-1969"],
                    correct: 2,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿Cuál fue el primer estadio de Boca Juniors?",
                    options: ["Dársena Sud", "Wilde", "La Bombonera", "Brandsen y Del Crucero"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿Qué significa 'Xeneize'?",
                    options: ["Genovés", "Italiano", "Marinero", "Trabajador"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿En qué año Carlos Tevez debutó en Boca?",
                    options: ["2001", "2002", "2003", "2004"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Cuántas Recopa Sudamericanas ganó Boca?",
                    options: ["3", "4", "5", "6"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Quién fue el entrenador de Boca en la Libertadores 2001?",
                    options: ["Carlos Bianchi", "Miguel Ángel Russo", "Oscar Tabárez", "Héctor Veira"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿En qué barrio se encuentra La Bombonera?",
                    options: ["La Boca", "Barracas", "San Telmo", "Puerto Madero"],
                    correct: 0,
                    difficulty: "easy"
                },
                {
                    category: "Boca",
                    question: "¿Cuántos campeonatos locales ganó Boca hasta 2024?",
                    options: ["34", "35", "36", "37"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿Quién fue el fundador principal de Boca Juniors?",
                    options: ["Esteban Baglietto", "Alfredo Scarpati", "Santiago Sana", "Teodoro Farenga"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿En qué año Diego Maradona debutó en Boca?",
                    options: ["1980", "1981", "1982", "1983"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Cuántas Copas Intercontinentales ganó Boca?",
                    options: ["2", "3", "4", "5"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Contra qué equipo europeo Boca perdió su primera Intercontinental?",
                    options: ["Real Madrid", "AC Milan", "Bayern Munich", "Manchester United"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿En qué año se construyó el primer estadio en La Boca?",
                    options: ["1924", "1925", "1926", "1927"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿Cuál es el récord de asistencia en La Bombonera?",
                    options: ["57.395", "58.000", "59.000", "60.000"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿Quién es el jugador más joven en debutar en Boca?",
                    options: ["Diego Maradona", "Juan Román Riquelme", "Cristian Pavón", "Julio Falcioni"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿En qué año Boca ganó su primera Copa Libertadores?",
                    options: ["1977", "1978", "1979", "1980"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Cuántas Supercopa Sudamericanas ganó Boca?",
                    options: ["1", "2", "3", "4"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Qué jugador de Boca ganó más Balones de Oro?",
                    options: ["Diego Maradona", "Juan Román Riquelme", "Carlos Tevez", "Ninguno ganó"],
                    correct: 3,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿En qué año se renovó por última vez La Bombonera?",
                    options: ["1996", "1998", "2000", "2002"],
                    correct: 1,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿Cuál fue la mayor goleada de Boca en un Superclásico?",
                    options: ["6-0", "5-0", "4-0", "5-1"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿Quién fue el primer entrenador de Boca Juniors?",
                    options: ["Jack Greenwell", "Patricio Hernández", "Juan Domingo Perón", "No se registra"],
                    correct: 3,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿En qué año Carlos Bianchi llegó por primera vez a Boca?",
                    options: ["1997", "1998", "1999", "2000"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "Boca",
                    question: "¿Cuántas finales de Libertadores perdió Boca?",
                    options: ["3", "4", "5", "6"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿Contra qué equipo Boca jugó su primera final de Libertadores?",
                    options: ["Deportivo Cali", "Cruzeiro", "Olimpia", "Independiente Medellín"],
                    correct: 1,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿Qué presidente de Boca estuvo más tiempo en el cargo?",
                    options: ["Mauricio Macri", "Pedro Pompilio", "Jorge Amor Ameal", "Daniel Angelici"],
                    correct: 1,
                    difficulty: "hard"
                },
                {
                    category: "Boca",
                    question: "¿En qué año Boca participó por primera vez en una competencia internacional?",
                    options: ["1963", "1964", "1965", "1966"],
                    correct: 0,
                    difficulty: "hard"
                }
            ],
            // CATEGORÍA: RIVER PLATE
            river: [
                {
                    category: "River",
                    question: "¿En qué año se fundó River Plate?",
                    options: ["25 de mayo de 1901", "25 de mayo de 1900", "25 de mayo de 1902", "25 de mayo de 1903"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "River",
                    question: "¿Quién es el máximo goleador histórico de River?",
                    options: ["Ángel Labruna", "Marcelo Salas", "Hernán Crespo", "Gonzalo Higuaín"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "River",
                    question: "¿Cuántos goles marcó Ángel Labruna en River?",
                    options: ["293", "295", "297", "299"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "River",
                    question: "¿Cuál es la capacidad del Estadio Monumental?",
                    options: ["83.196", "82.196", "84.196", "81.196"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "River",
                    question: "¿En qué año River ganó su primera Copa Libertadores?",
                    options: ["1985", "1986", "1987", "1984"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "River",
                    question: "¿Cuántos títulos oficiales tiene River Plate hasta 2024?",
                    options: ["68", "70", "72", "74"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    category: "River",
                    question: "¿Contra qué equipo River ganó la final de la Libertadores 2018?",
                    options: ["Boca Juniors", "Grêmio", "Palmeiras", "Flamengo"],
                    correct: 0,
                    difficulty: "easy"
                },
                {
                    category: "River",
                    question: "¿En qué año se inauguró el Estadio Monumental?",
                    options: ["1937", "1938", "1939", "1940"],
                    correct: 0,
                    difficulty: "hard"
                },
                {
                    category: "River",
                    question: "¿Cuál es el apodo más famoso de River Plate?",
                    options: ["Los Millonarios", "Los Ángeles", "Los Galácticos", "Los Reyes"],
                    correct: 0,
                    difficulty: "easy"
                },
                {
                    category: "River",
                    question: "¿Cuántas Copas Libertadores ganó River hasta 2024?",
                    options: ["4", "5", "6", "3"],
                    correct: 0,
                    difficulty: "medium"
                },
                // NUEVAS PREGUNTAS RIVER (25 más)
                {
                    category: "River",
                    question: "¿En qué barrio se encuentra el Estadio Monumental?",
                    options: ["Belgrano", "Núñez", "Palermo", "Vicente López"],
                    correct: 1,
                    difficulty: "easy"
                },
                {
                    category: "River",
                    question: "¿Quién fue el fundador de River Plate?",
                    options: ["Leopoldo Bard", "Carlos Peucelle", "Martiniano Leguizamón", "No se conoce"],
                    correct: 3,
                    difficulty: "hard"
                },
                {
                    category: "River",
                    question: "¿En qué año River descendió a la B Nacional?",
                    options: ["2010", "2011", "2012", "2013"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "River",
                    question: "¿Quién entrenaba a River cuando descendió?",
                    options: ["Ángel Cappa", "J.J. López", "Claudio Vivas", "Matías Almeyda"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "River",
                    question: "¿En qué año River ascendió de vuelta a Primera?",
                    options: ["2011", "2012", "2013", "2014"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "River",
                    question: "¿Cuántas Copas Argentina ganó River Plate?",
                    options: ["2", "3", "4", "5"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "River",
                    question: "¿En qué año Marcelo Gallardo debutó como entrenador de River?",
                    options: ["2013", "2014", "2015", "2016"],
                    correct: 1,
                    difficulty: "medium"
                },
                {
                    category: "River",
                    question: "¿Cuántos títulos ganó Gallardo como DT de River?",
                    options: ["12", "13", "14", "15"],
                    correct: 2,
                    difficulty: "hard"
                },
                {
                    category: "River",
                    question: "¿En qué estadio River jugó durante la construcción del Monumental?",
                    options: ["Gasómetro", "La Bombonera", "Racing Club", "Chacarita"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "River",
                    question: "¿Cuál fue el primer nombre del club?",
                    options: ["River Plate", "Club Atlético River", "River Plate Football Club", "Club de Football River Plate"],
                    correct: 2,
                    difficulty: "hard",
                },
                {
                    category: "River",
                    question: "¿En qué año River ganó su primera Copa Intercontinental?",
                    options: ["1985", "1986", "1987", "1996"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "River",
                    question: "¿Cuántos Mundial de Clubes ganó River?",
                    options: ["0", "1", "2", "3"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "River",
                    question: "¿Quién es el jugador con más partidos en River?",
                    options: ["Amadeo Carrizo", "Ángel Labruna", "Daniel Passarella", "Marcelo Gallardo"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "River",
                    question: "¿En qué década River ganó más títulos locales?",
                    options: ["1940-1949", "1950-1959", "1990-1999", "2010-2019"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "River",
                    question: "¿Cuántos clásicos contra Boca ganó River históricamente?",
                    options: ["89", "91", "93", "95"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "River",
                    question: "¿En qué año se jugó el primer Superclásico?",
                    options: ["1913", "1914", "1915", "1916"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "River",
                    question: "¿Cuál es el resultado más abultado de River contra Boca?",
                    options: ["5-0", "6-0", "6-1", "7-1"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "River",
                    question: "¿En qué año River ganó la Libertadores por primera vez?",
                    options: ["1985", "1986", "1987", "1988"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "River",
                    question: "¿Contra qué equipo River jugó la final de la Libertadores 1986?",
                    options: ["América de Cali", "Atlético Nacional", "Independiente", "Olimpia"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "River",
                    question: "¿Quién marcó el gol del título en la Libertadores 2015?",
                    options: ["Lucas Alario", "Rodrigo Mora", "Carlos Sánchez", "Ramiro Funes Mori"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "River",
                    question: "¿En qué país River ganó su segunda Libertadores?",
                    options: ["Argentina", "Colombia", "México", "Perú"],
                    correct: 2,
                    difficulty: "medium",
                },
                {
                    category: "River",
                    question: "¿Cuántas Supercopa Sudamericanas ganó River?",
                    options: ["0", "1", "2", "3"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "River",
                    question: "¿En qué año River ganó su último título de liga?",
                    options: ["2021", "2022", "2023", "2024"],
                    correct: 0,
                    difficulty: "easy",
                },
                {
                    category: "River",
                    question: "¿Cuál es el nombre completo oficial del club?",
                    options: ["Club Atlético River Plate", "River Plate Football Club", "Club de Football River Plate", "Asociación River Plate"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "River",
                    question: "¿Quién diseñó el Estadio Monumental?",
                    options: ["José Aslan", "Viktor Sulčič", "Raúl Bes", "Antonio Bonet"],
                    correct: 0,
                    difficulty: "hard",
                }
            ],
            // CATEGORÍA: MUNDIALES (Datos FIFA verificados)
            mundial: [
                {
                    category: "Mundial",
                    question: "¿Cuántos Mundiales de fútbol se han disputado hasta 2022?",
                    options: ["21", "22", "23", "20"],
                    correct: 1,
                    difficulty: "easy",
                },
                {
                    category: "Mundial",
                    question: "¿Qué país ha ganado más Mundiales de fútbol?",
                    options: ["Alemania", "Argentina", "Brasil", "Italia"],
                    correct: 2,
                    difficulty: "easy",
                },
                {
                    category: "Mundial",
                    question: "¿Quién es el máximo goleador de Mundiales de la historia?",
                    options: ["Pelé", "Miroslav Klose", "Ronaldo", "Gerd Müller"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Cuántos goles marcó Miroslav Klose en Mundiales?",
                    options: ["14", "15", "16", "17"],
                    correct: 2,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿En qué país se jugó el primer Mundial?",
                    options: ["Brasil", "Uruguay", "Argentina", "Chile"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Qué tecnología se usó por primera vez en Qatar 2022?",
                    options: ["VAR", "Línea de gol", "Fuera de juego automático", "Chip en balón"],
                    correct: 2,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Cuál fue el marcador de la final del Mundial 2022?",
                    options: ["Argentina 3 - 3 Francia (4-2 pen.)", "Argentina 2 - 1 Francia", "Argentina 4 - 2 Francia", "Argentina 1 - 0 Francia"],
                    correct: 0,
                    difficulty: "easy",
                },
                {
                    category: "Mundial",
                    question: "¿Quién ganó la Bota de Oro en Qatar 2022?",
                    options: ["Lionel Messi", "Kylian Mbappé", "Olivier Giroud", "Julián Álvarez"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Qué país fue sede del Mundial 2018?",
                    options: ["Brasil", "Rusia", "Qatar", "Alemania"],
                    correct: 1,
                    difficulty: "easy",
                },
                {
                    category: "Mundial",
                    question: "¿Cuándo será el próximo Mundial de fútbol?",
                    options: ["2025", "2026", "2027", "2028"],
                    correct: 1,
                    difficulty: "easy",
                },
                // NUEVAS PREGUNTAS MUNDIAL (30 más)
                {
                    category: "Mundial",
                    question: "¿En qué año se disputó el primer Mundial de fútbol?",
                    options: ["1928", "1930", "1932", "1934"],
                    correct: 1,
                    difficulty: "easy",
                },
                {
                    category: "Mundial",
                    question: "¿Cuántos equipos participaron en el primer Mundial?",
                    options: ["13", "14", "15", "16"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Quién marcó el primer gol en la historia de los Mundiales?",
                    options: ["Lucien Laurent", "Héctor Castro", "Guillermo Stábile", "Pedro Cea"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿Qué países organizaron el Mundial 2002?",
                    options: ["Japón y China", "Japón y Corea del Sur", "Corea del Sur y China", "Solo Japón"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Cuál fue la mayor goleada en un Mundial?",
                    options: ["Hungría 10-1 El Salvador (1982)", "Hungría 9-0 Corea del Sur (1954)", "Yugoslavia 9-0 Zaire (1974)", "Alemania 8-0 Arabia Saudí (2002)"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿Quién es el jugador más joven en marcar en un Mundial?",
                    options: ["Pelé", "Kylian Mbappé", "Michael Owen", "Landon Donovan"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Cuántos años tenía Pelé cuando ganó su primer Mundial?",
                    options: ["16", "17", "18", "19"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿En qué Mundial se usó por primera vez el VAR?",
                    options: ["Brasil 2014", "Rusia 2018", "Qatar 2022", "No se ha usado"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Qué selección tiene más subcampeonatos mundiales?",
                    options: ["Argentina", "Alemania", "Holanda", "Brasil"],
                    correct: 2,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿En qué Mundial Diego Maradona hizo el gol con la mano?",
                    options: ["España 1982", "México 1986", "Italia 1990", "Estados Unidos 1994"],
                    correct: 1,
                    difficulty: "easy",
                },
                {
                    category: "Mundial",
                    question: "¿Cuál es el Mundial con más goles anotados?",
                    options: ["Francia 1998 (171)", "Brasil 2014 (171)", "Rusia 2018 (169)", "Estados Unidos 1994 (141)"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿Qué portero tiene más partidos jugados en Mundiales?",
                    options: ["Buffon", "Casillas", "Neuer", "Lloris"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿En qué Mundial Italia no participó por no clasificar?",
                    options: ["Rusia 2018", "Sudáfrica 2010", "Alemania 2006", "Corea-Japón 2002"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Cuál fue el primer Mundial transmitido por televisión?",
                    options: ["Suiza 1954", "Suecia 1958", "Chile 1962", "Inglaterra 1966"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿En qué Mundial se jugó por primera vez en África?",
                    options: ["Sudáfrica 2010", "Egipto 1990", "Marruecos 1998", "Nigeria 2006"],
                    correct: 0,
                    difficulty: "easy",
                },
                {
                    category: "Mundial",
                    question: "¿Cuántos hat-tricks se marcaron en Qatar 2022?",
                    options: ["1", "2", "3", "4"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Quién marcó el hat-trick en Qatar 2022?",
                    options: ["Kylian Mbappé", "Lionel Messi", "Harry Kane", "Cody Gakpo"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Cuál fue el Mundial con más espectadores en total?",
                    options: ["Estados Unidos 1994", "Brasil 2014", "Alemania 2006", "Rusia 2018"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿En qué Mundial se introdujo la tarjeta amarilla y roja?",
                    options: ["Inglaterra 1966", "México 1970", "Alemania 1974", "Argentina 1978"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Cuántos países diferentes han ganado el Mundial?",
                    options: ["7", "8", "9", "10"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Qué país organizará el Mundial 2026?",
                    options: ["Estados Unidos", "Canadá", "México", "Estados Unidos, Canadá y México"],
                    correct: 3,
                    difficulty: "easy",
                },
                {
                    category: "Mundial",
                    question: "¿En qué Mundial participó por primera vez Croacia como país independiente?",
                    options: ["Estados Unidos 1994", "Francia 1998", "Corea-Japón 2002", "Alemania 2006"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Cuál es el Mundial donde más penales se cobraron?",
                    options: ["Rusia 2018", "Qatar 2022", "Brasil 2014", "Francia 1998"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿Qué jugador tiene más asistencias en un solo Mundial?",
                    options: ["Diego Maradona", "Pelé", "Xavi", "Kevin De Bruyne"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿En qué Mundial no participó Brasil por primera vez?",
                    options: ["Suiza 1954", "Nunca faltó", "Francia 1938", "Suecia 1958"],
                    correct: 1,
                    difficulty: "easy",
                },
                {
                    category: "Mundial",
                    question: "¿Cuál fue el primer Mundial con 32 equipos?",
                    options: ["Estados Unidos 1994", "Francia 1998", "Corea-Japón 2002", "Alemania 2006"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Qué jugador marcó el gol número 1000 en la historia de los Mundiales?",
                    options: ["Robbie Fowler", "Oleg Salenko", "Marcelo Balboa", "No se registra"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿En qué Mundial Zinedine Zidane recibió la tarjeta roja en la final?",
                    options: ["Francia 1998", "Alemania 2006", "Corea-Japón 2002", "No recibió roja en final"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Mundial",
                    question: "¿Cuántos autogoles se marcaron en Qatar 2022?",
                    options: ["1", "2", "3", "4"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Mundial",
                    question: "¿Qué selección debutó en Qatar 2022?",
                    options: ["Qatar", "Ninguna", "Australia", "Dinamarca"],
                    correct: 0,
                    difficulty: "medium",
                }
            ],
            // CATEGORÍA: GENERAL (Preguntas variadas de fuentes verificadas)
            general: [
                {
                    category: "General",
                    question: "¿En qué año se creó la UEFA Champions League?",
                    options: ["1992", "1993", "1991", "1994"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿Qué club tiene más Champions League?",
                    options: ["Barcelona", "Real Madrid", "AC Milan", "Liverpool"],
                    correct: 1,
                    difficulty: "easy",
                },
                {
                    category: "General",
                    question: "¿Cuándo se fundó la FIFA?",
                    options: ["21 de mayo de 1904", "21 de mayo de 1903", "21 de mayo de 1905", "21 de mayo de 1906"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿Quién inventó el fútbol moderno?",
                    options: ["Francia", "Inglaterra", "Brasil", "Argentina"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿Cuántos jugadores tiene un equipo de fútbol en el campo?",
                    options: ["10", "11", "12", "9"],
                    correct: 1,
                    difficulty: "easy",
                },
                // NUEVAS PREGUNTAS GENERAL (25 más)
                {
                    category: "General",
                    question: "¿Cuánto dura oficialmente un partido de fútbol?",
                    options: ["80 minutos", "90 minutos", "100 minutos", "85 minutos"],
                    correct: 1,
                    difficulty: "easy",
                },
                {
                    category: "General",
                    question: "¿Cuántas sustituciones se pueden hacer en un partido oficial?",
                    options: ["3", "4", "5", "6"],
                    correct: 2,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿Cuál es la dimensión mínima de un campo de fútbol?",
                    options: ["90x45 metros", "100x50 metros", "110x60 metros", "120x70 metros"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿En qué año se fundó la CONMEBOL?",
                    options: ["1914", "1916", "1918", "1920"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿Cuál fue el primer club de fútbol del mundo?",
                    options: ["Sheffield FC", "Notts County", "Cambridge University", "Real Madrid"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿Qué significa UEFA?",
                    options: ["United European Football Association", "Union of European Football Associations", "United European Football Alliance", "Union European Football Alliance"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿En qué país se jugó la primera Copa del Mundo femenina?",
                    options: ["Estados Unidos", "China", "Suecia", "Alemania"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿Cuántos continentes tiene FIFA?",
                    options: ["5", "6", "7", "4"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿Qué altura tiene el arco de fútbol?",
                    options: ["2.34 metros", "2.44 metros", "2.54 metros", "2.64 metros"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿Cuál es la velocidad récord de un tiro en fútbol?",
                    options: ["131 km/h", "151 km/h", "171 km/h", "191 km/h"],
                    correct: 2,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿En qué año se permitió el pase hacia atrás al portero?",
                    options: ["1990", "1992", "1994", "Siempre se permitió"],
                    correct: 3,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿Qué club tiene más títulos de liga en Europa?",
                    options: ["Real Madrid", "Rangers", "Celtic", "Juventus"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿Cuál es el estadio de fútbol más grande del mundo?",
                    options: ["Camp Nou", "Wembley", "Rungrado 1st of May Stadium", "Estadio Azteca"],
                    correct: 2,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿En qué año se introdujo el fuera de juego?",
                    options: ["1863", "1870", "1880", "1890"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿Cuántos países miembros tiene FIFA actualmente?",
                    options: ["209", "211", "213", "215"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿Qué país organizó la primera Copa América?",
                    options: ["Argentina", "Uruguay", "Brasil", "Chile"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿En qué año se creó la Copa Libertadores?",
                    options: ["1958", "1960", "1962", "1964"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿Cuál es el jugador más caro de la historia?",
                    options: ["Neymar", "Kylian Mbappé", "Philippe Coutinho", "Gareth Bale"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿En qué liga juega el Manchester City?",
                    options: ["Championship", "Premier League", "League One", "League Two"],
                    correct: 1,
                    difficulty: "easy",
                },
                {
                    category: "General",
                    question: "¿Cuál es el club más antiguo de Argentina?",
                    options: ["Buenos Aires FC", "Alumni", "Quilmes", "Buenos Aires Cricket Club"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿Qué significa VAR?",
                    options: ["Video Assistant Referee", "Video Analysis Review", "Video Assistant Review", "Virtual Assistant Referee"],
                    correct: 0,
                    difficulty: "easy",
                },
                {
                    category: "General",
                    question: "¿Cuántas confederaciones tiene FIFA?",
                    options: ["4", "5", "6", "7"],
                    correct: 2,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿En qué año se fundó el FC Barcelona?",
                    options: ["1899", "1900", "1901", "1902"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "General",
                    question: "¿Cuál es el récord de goles en una temporada europea?",
                    options: ["85", "91", "95", "100"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "General",
                    question: "¿Qué jugador tiene más Champions League ganadas?",
                    options: ["Cristiano Ronaldo", "Lionel Messi", "Karim Benzema", "Luka Modrić"],
                    correct: 0,
                    difficulty: "medium",
                }
            ],
            // NUEVA CATEGORÍA: CHAMPIONS LEAGUE
            champions: [
                {
                    category: "Champions",
                    question: "¿Qué equipo ha ganado más Champions League?",
                    options: ["Real Madrid", "Barcelona", "AC Milan", "Liverpool"],
                    correct: 0,
                    difficulty: "easy",
                },
                {
                    category: "Champions",
                    question: "¿En qué año se cambió el nombre a Champions League?",
                    options: ["1991", "1992", "1993", "1994"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿Cuántas Champions League ganó el Real Madrid hasta 2024?",
                    options: ["14", "15", "16", "17"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿Quién es el máximo goleador histórico de la Champions?",
                    options: ["Lionel Messi", "Cristiano Ronaldo", "Robert Lewandowski", "Karim Benzema"],
                    correct: 1,
                    difficulty: "easy",
                },
                {
                    category: "Champions",
                    question: "¿Cuántos goles marcó Cristiano Ronaldo en Champions?",
                    options: ["140", "142", "144", "146"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Champions",
                    question: "¿Qué equipo ganó la primera Champions League (1992-93)?",
                    options: ["AC Milan", "Barcelona", "Olympique de Marsella", "Bayern Munich"],
                    correct: 2,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿Cuál fue la mayor remontada en la historia de la Champions?",
                    options: ["Barcelona 6-1 PSG", "Liverpool 4-0 Barcelona", "Real Madrid 3-1 Juventus", "Roma 3-0 Barcelona"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿En qué estadio se jugó la final de 2005 (Liverpool vs AC Milan)?",
                    options: ["Estambul", "Atenas", "Madrid", "París"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿Qué jugador marcó en 3 finales consecutivas de Champions?",
                    options: ["Cristiano Ronaldo", "Gareth Bale", "Sergio Ramos", "Karim Benzema"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "Champions",
                    question: "¿Cuántas veces ganó la Champions el AC Milan?",
                    options: ["6", "7", "8", "9"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿Qué portero tiene más finales jugadas en Champions?",
                    options: ["Iker Casillas", "Gianluigi Buffon", "Manuel Neuer", "Petr Čech"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Champions",
                    question: "¿En qué año el Leicester City llegó a cuartos de final?",
                    options: ["2016", "2017", "2018", "2019"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿Qué equipo inglés ganó por primera vez en 2005?",
                    options: ["Manchester United", "Chelsea", "Liverpool", "Arsenal"],
                    correct: 2,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿Cuál es el récord de goles en una edición de Champions?",
                    options: ["16", "17", "18", "19"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "Champions",
                    question: "¿Qué entrenador ganó más Champions League?",
                    options: ["Carlo Ancelotti", "Zinedine Zidane", "Pep Guardiola", "Bob Paisley"],
                    correct: 3,
                    difficulty: "hard",
                },
                {
                    category: "Champions",
                    question: "¿En qué año Ajax ganó por última vez?",
                    options: ["1994", "1995", "1996", "1997"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿Qué jugador debutó más joven en una final de Champions?",
                    options: ["Kylian Mbappé", "Pedri", "Ansu Fati", "Owen Hargreaves"],
                    correct: 3,
                    difficulty: "hard",
                },
                {
                    category: "Champions",
                    question: "¿Cuántas finales perdió el Bayern Munich en la década del 2010?",
                    options: ["1", "2", "3", "4"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "Champions",
                    question: "¿Qué club fue el primero en ganar 3 Champions consecutivas?",
                    options: ["Real Madrid (1956-58)", "Real Madrid (2016-18)", "AC Milan", "Ajax"],
                    correct: 0,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿En qué final se marcaron más goles (6 en total)?",
                    options: ["Real Madrid 4-2 Atletico (2014)", "Liverpool 3-3 AC Milan (2005)", "Barcelona 3-1 Juventus (2015)", "Manchester United 2-1 Chelsea (2008)"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "Champions",
                    question: "¿Qué país nunca tuvo un campeón de Champions League?",
                    options: ["Francia", "Bélgica", "Rusia", "Turquía"],
                    correct: 3,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿Cuántas Champions ganó Pep Guardiola como entrenador?",
                    options: ["1", "2", "3", "4"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Champions",
                    question: "¿Qué jugador marcó el gol más rápido en una final?",
                    options: ["Paolo Maldini", "Mario Mandžukić", "Sergio Ramos", "Fernando Torres"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Champions",
                    question: "¿En qué minuto Paolo Maldini marcó en la final de 2007?",
                    options: ["50 segundos", "52 segundos", "56 segundos", "1 minuto"],
                    correct: 0,
                    difficulty: "hard",
                },
                {
                    category: "Champions",
                    question: "¿Qué equipo perdió 3 finales en 4 años (2014-2018)?",
                    options: ["Atletico Madrid", "Juventus", "Liverpool", "Bayern Munich"],
                    correct: 0,
                    difficulty: "medium",
                }
            ],
            // NUEVA CATEGORÍA: SELECCIÓN ARGENTINA
            argentina: [
            {
                category: "Argentina",
                    question: "¿Cuántas Copas del Mundo ganó Argentina?",
                    options: ["2", "3", "4", "1"],
                    correct: 1,
                    difficulty: "easy",
            },
            {
                category: "Argentina",
                    question: "¿En qué años Argentina ganó el Mundial?",
                    options: ["1978, 1986, 2022", "1978, 1986, 2018", "1982, 1986, 2022", "1978, 1990, 2022"],
                    correct: 0,
                    difficulty: "medium",
            },
            {
                category: "Argentina",
                    question: "¿Cuántas Copas América ganó Argentina hasta 2024?",
                    options: ["14", "15", "16", "17"],
                    correct: 1,
                    difficulty: "medium",
            },
            {
                category: "Argentina",
                    question: "¿Quién es el máximo goleador histórico de Argentina?",
                    options: ["Diego Maradona", "Gabriel Batistuta", "Lionel Messi", "Hernán Crespo"],
                    correct: 2,
                    difficulty: "easy",
            },
            {
                category: "Argentina",
                    question: "¿Cuántos goles marcó Messi con la Selección hasta 2024?",
                    options: ["106", "108", "110", "112"],
                    correct: 1,
                    difficulty: "hard",
            },
            {
                category: "Argentina",
                    question: "¿En qué estadio Argentina jugó la final del Mundial 1978?",
                    options: ["Estadio Monumental", "La Bombonera", "Estadio Olimpico", "Rosario Central"],
                    correct: 0,
                    difficulty: "medium",
            },
            {
                category: "Argentina",
                    question: "¿Contra qué selección Argentina perdió la final de Brasil 2014?",
                    options: ["Brasil", "Alemania", "Holanda", "España"],
                    correct: 1,
                    difficulty: "easy",
            },
            {
                category: "Argentina",
                    question: "¿Quién fue el entrenador de Argentina en Qatar 2022?",
                    options: ["Jorge Sampaoli", "Lionel Scaloni", "Diego Simeone", "Mauricio Pochettino"],
                    correct: 1,
                    difficulty: "easy",
            },
            {
                category: "Argentina",
                    question: "¿En qué año Argentina ganó la Copa América por última vez antes de 2021?",
                    options: ["1991", "1993", "1995", "1999"],
                    correct: 1,
                    difficulty: "medium",
            },
            {
                category: "Argentina",
                    question: "¿Cuántos partidos invicto tuvo Argentina hasta Qatar 2022?",
                    options: ["35", "36", "37", "38"],
                    correct: 1,
                    difficulty: "hard",
            },
            {
                category: "Argentina",
                    question: "¿Quién marcó el gol de la victoria en la final de Qatar 2022?",
                    options: ["Lionel Messi", "Ángel Di María", "Julián Álvarez", "Lautaro Martínez"],
                    correct: 1,
                    difficulty: "medium",
            },
            {
                category: "Argentina",
                    question: "¿En qué Copa del Mundo Argentina llegó a la final por primera vez?",
                    options: ["Uruguay 1930", "Italia 1934", "Francia 1938", "Brasil 1950"],
                    correct: 0,
                    difficulty: "medium",
            },
            {
                category: "Argentina",
                    question: "¿Cuántas finales mundiales perdió Argentina?",
                    options: ["2", "3", "4", "5"],
                    correct: 1,
                    difficulty: "medium",
            },
            {
                category: "Argentina",
                    question: "¿Quién fue el primer técnico de Argentina en ganar un Mundial?",
                    options: ["César Luis Menotti", "Carlos Bilardo", "Alfio Basile", "Daniel Passarella"],
                    correct: 0,
                    difficulty: "medium",
            },
            {
                category: "Argentina",
                    question: "¿En qué año se fundó la AFA?",
                    options: ["1891", "1893", "1895", "1897"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "Argentina",
                    question: "¿Contra qué selección jugó Argentina su primer partido oficial?",
                    options: ["Brasil", "Uruguay", "Chile", "Paraguay"],
                    correct: 1,
                    difficulty: "hard",
                },
                {
                    category: "Argentina",
                    question: "¿Quién es el jugador con más partidos en la Selección?",
                    options: ["Diego Maradona", "Javier Zanetti", "Lionel Messi", "Gabriel Batistuta"],
                    correct: 2,
                    difficulty: "medium",
                },
                {
                    category: "Argentina",
                    question: "¿En qué Mundial Argentina no participó?",
                    options: ["Inglaterra 1966", "Nunca faltó", "Suecia 1958", "Chile 1962"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Argentina",
                    question: "¿Cuántas medallas olímpicas de oro ganó Argentina en fútbol?",
                options: ["1", "2", "3", "0"],
                    correct: 1,
                    difficulty: "medium",
                },
                {
                    category: "Argentina",
                    question: "¿En qué años Argentina ganó el oro olímpico en fútbol?",
                    options: ["2004, 2008", "2008, 2012", "2000, 2004", "1996, 2004"],
                    correct: 0,
                    difficulty: "hard",
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
        } else {
            // Modo clásico o supervivencia: mezcla de todas las categorías
            this.questions = [];
            Object.values(this.questionBank).forEach(categoryQuestions => {
                this.questions = this.questions.concat(categoryQuestions);
            });
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
        } else {
            this.totalQuestions = 20;
        }
        // Reset power-ups
        this.powerUps = {
            timeExtra: 3,
            removeOption: 3,
            scoreMultiplier: 2
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
        if (this.gameMode === 'classic' && this.currentQuestion >= this.totalQuestions) {
            this.endGame();
            return;
        }
        // Verificar que tenemos preguntas disponibles
        if (!this.questions || this.questions.length === 0) {
            console.error('No questions available');
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
                'general': 'General'
            };
            message = `¡Categoría ${categoryNames[this.selectedCategory]}! ${results.correctAnswers}/20 correctas`;
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
                await saveCrackRapidoResult({
                score: results.score,
                correctAnswers: results.correctAnswers,
                    totalQuestions: results.totalQuestions,
                    totalTime: results.totalTime,
                averageTime: results.averageTime,
                    maxStreak: results.maxStreak,
                    gameMode: results.gameMode,
                    category: results.category,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    language: navigator.language
                });
                console.log('Datos guardados exitosamente');
            } else {
                console.warn('Firebase save function not available');
            }
        } catch (error) {
            console.error('Error saving to Firebase:', error);
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
