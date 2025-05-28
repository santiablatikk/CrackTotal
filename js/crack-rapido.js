// Crack Rápido - Sistema de Trivia de Velocidad
// Crack Total - 2025

// Importar función para guardar en Firebase
import { saveCrackRapidoResult } from './firebase-utils.js';

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
        
        this.initializeElements();
        this.loadQuestions();
        this.loadStats();
        this.setupEventListeners();
    }

    initializeElements() {
        // Pantallas
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.resultsScreen = document.getElementById('resultsScreen');
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

        // Botones
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
    }

    loadQuestions() {
        this.questionBank = [
            // Jugadores Famosos
            {
                category: "Jugadores",
                question: "¿Cuántos Balones de Oro ganó Lionel Messi?",
                options: ["6", "7", "8", "9"],
                correct: 2
            },
            {
                category: "Jugadores",
                question: "¿En qué año nació Lionel Messi?",
                options: ["1986", "1987", "1988", "1989"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿Cuántos goles marcó Pelé en Mundiales?",
                options: ["10", "12", "14", "16"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿En qué posición jugaba Roberto Carlos?",
                options: ["Delantero", "Mediocampista", "Lateral", "Central"],
                correct: 2
            },
            {
                category: "Jugadores",
                question: "¿Cuál fue el apodo de Ronaldo Nazário?",
                options: ["El Bicho", "El Fenómeno", "El Pibe", "La Pulga"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿En qué club terminó su carrera Kaká?",
                options: ["AC Milan", "Real Madrid", "Orlando City", "São Paulo"],
                correct: 2
            },
            {
                category: "Jugadores",
                question: "¿Qué nacionalidad tiene Zlatan Ibrahimović?",
                options: ["Danesa", "Noruega", "Sueca", "Finlandesa"],
                correct: 2
            },
            {
                category: "Jugadores",
                question: "¿En qué año retiró del fútbol Francesco Totti?",
                options: ["2016", "2017", "2018", "2019"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿Cuántos goles hizo Haaland en su primera temporada en el City?",
                options: ["34", "36", "38", "40"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿En qué posición jugaba Andrea Pirlo?",
                options: ["Delantero", "Mediocampista", "Defensor", "Arquero"],
                correct: 1
            },
            {
                category: "Jugadores", 
                question: "¿En qué año debutó Cristiano Ronaldo en el Manchester United?",
                options: ["2002", "2003", "2004", "2005"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿Cuál es el nombre completo de Pelé?",
                options: ["Edson Arantes do Nascimento", "Pelé Santos Silva", "Eduardo Pelé da Silva", "Edison Pelé Nascimento"],
                correct: 0
            },
            {
                category: "Jugadores",
                question: "¿Qué jugador argentino fue apodado 'El Pibe de Oro'?",
                options: ["Riquelme", "Maradona", "Kempes", "Caniggia"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿En qué club jugó Ronaldinho antes de llegar al Barcelona?",
                options: ["PSG", "AC Milan", "Santos", "Flamengo"],
                correct: 0
            },

            // Clubes
            {
                category: "Clubes",
                question: "¿Cuántas Champions League ganó el Real Madrid?",
                options: ["13", "14", "15", "16"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿En qué año se fundó el FC Barcelona?",
                options: ["1898", "1899", "1900", "1901"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿Cuál es el estadio del Manchester United?",
                options: ["Emirates", "Old Trafford", "Anfield", "Stamford Bridge"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿Qué equipo italiano es conocido como 'La Vecchia Signora'?",
                options: ["AC Milan", "Inter", "Juventus", "Roma"],
                correct: 2
            },
            {
                category: "Clubes",
                question: "¿Cuántas veces ganó Boca Juniors la Copa Libertadores?",
                options: ["4", "5", "6", "7"],
                correct: 2
            },

            // Mundiales
            {
                category: "Mundiales",
                question: "¿Qué país ganó el Mundial de Rusia 2018?",
                options: ["Croacia", "Francia", "Bélgica", "Inglaterra"],
                correct: 1
            },
            {
                category: "Mundiales",
                question: "¿Cuántos Mundiales ganó Brasil?",
                options: ["4", "5", "6", "3"],
                correct: 1
            },
            {
                category: "Mundiales",
                question: "¿En qué año se jugó el primer Mundial de fútbol?",
                options: ["1928", "1930", "1932", "1934"],
                correct: 1
            },
            {
                category: "Mundiales",
                question: "¿Qué jugador marcó el 'Gol del Siglo' en México 86?",
                options: ["Pelé", "Maradona", "Cruyff", "Zidane"],
                correct: 1
            },
            {
                category: "Mundiales",
                question: "¿Cuál fue el país sede del Mundial 2014?",
                options: ["Argentina", "Brasil", "Chile", "Uruguay"],
                correct: 1
            },

            // Argentina
            {
                category: "Argentina",
                question: "¿En qué año River Plate ganó la Copa Libertadores por última vez?",
                options: ["2015", "2018", "2019", "2021"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿Cuál es el clásico más famoso de Argentina?",
                options: ["River vs Boca", "Racing vs Independiente", "San Lorenzo vs Huracán", "Estudiantes vs Gimnasia"],
                correct: 0
            },
            {
                category: "Argentina",
                question: "¿Quién es el máximo goleador histórico de la Selección Argentina?",
                options: ["Maradona", "Batistuta", "Messi", "Kempes"],
                correct: 2
            },
            {
                category: "Argentina",
                question: "¿En qué estadio juega Racing Club?",
                options: ["El Cilindro", "El Libertadores de América", "Presidente Perón", "Tomás Adolfo Ducó"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿Cuántas veces ganó Independiente la Copa Libertadores?",
                options: ["5", "6", "7", "8"],
                correct: 2
            },

            // Europa
            {
                category: "Europa",
                question: "¿Cuál es el máximo goleador histórico de la Premier League?",
                options: ["Harry Kane", "Alan Shearer", "Wayne Rooney", "Thierry Henry"],
                correct: 1
            },
            {
                category: "Europa",
                question: "¿En qué liga juega el Bayern Munich?",
                options: ["Premier League", "Serie A", "Bundesliga", "La Liga"],
                correct: 2
            },
            {
                category: "Europa",
                question: "¿Qué equipo francés ganó más veces la Ligue 1?",
                options: ["PSG", "Saint-Étienne", "Marseille", "Lyon"],
                correct: 1
            },
            {
                category: "Europa",
                question: "¿Cuál es el derbi más famoso de Inglaterra?",
                options: ["Manchester United vs City", "Liverpool vs Everton", "Arsenal vs Tottenham", "Chelsea vs Arsenal"],
                correct: 0
            },
            {
                category: "Europa",
                question: "¿En qué ciudad está el estadio San Siro?",
                options: ["Roma", "Nápoles", "Milán", "Turín"],
                correct: 2
            },

            // Récords y Datos
            {
                category: "Récords",
                question: "¿Cuál es el pase más caro de la historia del fútbol?",
                options: ["Neymar al PSG", "Mbappe al PSG", "Coutinho al Barcelona", "Griezmann al Barcelona"],
                correct: 0
            },
            {
                category: "Récords",
                question: "¿Cuántos goles marcó Messi en el año 2012?",
                options: ["89", "90", "91", "92"],
                correct: 2
            },
            {
                category: "Récords",
                question: "¿Qué portero tiene más partidos sin recibir goles?",
                options: ["Casillas", "Buffon", "Neuer", "Cech"],
                correct: 3
            },
            {
                category: "Récords",
                question: "¿Cuál es el estadio con mayor capacidad del mundo?",
                options: ["Camp Nou", "Maracaná", "Wembley", "Rungrado 1º de Mayo"],
                correct: 3
            },
            {
                category: "Récords",
                question: "¿Quién marcó el gol más rápido en una Copa del Mundo?",
                options: ["Hakan Sukur", "Alan Shearer", "Tim Cahill", "Clint Dempsey"],
                correct: 0
            },

            // Reglas y Técnica
            {
                category: "Reglas",
                question: "¿Cuántos jugadores pueden estar en el campo por equipo?",
                options: ["10", "11", "12", "9"],
                correct: 1
            },
            {
                category: "Reglas",
                question: "¿Cuánto dura un partido de fútbol?",
                options: ["80 minutos", "85 minutos", "90 minutos", "95 minutos"],
                correct: 2
            },
            {
                category: "Reglas",
                question: "¿Cuántos cambios puede hacer un equipo en un partido?",
                options: ["3", "4", "5", "6"],
                correct: 2
            },
            {
                category: "Reglas",
                question: "¿Qué color de tarjeta significa expulsión?",
                options: ["Amarilla", "Roja", "Verde", "Azul"],
                correct: 1
            },
            {
                category: "Reglas",
                question: "¿Desde qué distancia se ejecuta un penal?",
                options: ["10 metros", "11 metros", "12 metros", "13 metros"],
                correct: 1
            },

            // Historia
            {
                category: "Historia",
                question: "¿En qué país se inventó el fútbol moderno?",
                options: ["Brasil", "Argentina", "Inglaterra", "Uruguay"],
                correct: 2
            },
            {
                category: "Historia",
                question: "¿Cuál fue el primer Mundial televisado en color?",
                options: ["México 1970", "Alemania 1974", "Argentina 1978", "España 1982"],
                correct: 0
            },
            {
                category: "Historia",
                question: "¿Qué Copa se entregaba antes del Balón de Oro?",
                options: ["Copa FIFA", "Balón de Plata", "Copa de Europa", "Golden Ball"],
                correct: 2
            },
            {
                category: "Historia",
                question: "¿En qué año se creó la UEFA?",
                options: ["1954", "1955", "1956", "1957"],
                correct: 0
            },
            {
                category: "Historia",
                question: "¿Cuál fue el primer club de fútbol del mundo?",
                options: ["Sheffield FC", "Liverpool FC", "Manchester United", "Arsenal FC"],
                correct: 0
            },

            // Más preguntas variadas
            {
                category: "Jugadores",
                question: "¿Qué nacionalidad tiene Zlatan Ibrahimović?",
                options: ["Danesa", "Noruega", "Sueca", "Finlandesa"],
                correct: 2
            },
            {
                category: "Clubes",
                question: "¿Cuál es el apodo del Liverpool?",
                options: ["The Blues", "The Reds", "The Gunners", "The Saints"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿En qué año descendió River Plate a la B Nacional?",
                options: ["2010", "2011", "2012", "2013"],
                correct: 1
            },
            {
                category: "Mundiales",
                question: "¿Qué país será sede del Mundial 2026?",
                options: ["Qatar", "Estados Unidos, México y Canadá", "Arabia Saudí", "España y Portugal"],
                correct: 1
            },
            {
                category: "Europa",
                question: "¿Cuántas Champions League ganó el AC Milan?",
                options: ["6", "7", "8", "9"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿En qué posición jugaba Franco Baresi?",
                options: ["Delantero", "Mediocampista", "Defensor", "Arquero"],
                correct: 2
            },
            {
                category: "Récords",
                question: "¿Cuál es el club con más títulos internacionales?",
                options: ["Real Madrid", "Barcelona", "Boca Juniors", "Independiente"],
                correct: 0
            },
            {
                category: "Argentina",
                question: "¿Cuál es el estadio más grande de Argentina?",
                options: ["La Bombonera", "El Monumental", "El Cilindro", "La Ciudadela"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿Qué equipo es conocido como 'Los Merengues'?",
                options: ["Barcelona", "Real Madrid", "Valencia", "Sevilla"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿Cuántos goles marcó Pelé en su carrera?",
                options: ["1000", "1281", "1365", "1500"],
                correct: 1
            },

            // Más preguntas de nivel intermedio
            {
                category: "Europa",
                question: "¿Qué equipo alemán nunca descendió de la Bundesliga?",
                options: ["Bayern Munich", "Borussia Dortmund", "Hamburgo SV", "Schalke 04"],
                correct: 2
            },
            {
                category: "Mundiales",
                question: "¿Quién fue el goleador del Mundial de Sudáfrica 2010?",
                options: ["Thomas Müller", "David Villa", "Wesley Sneijder", "Diego Forlán"],
                correct: 0
            },
            {
                category: "Argentina",
                question: "¿Cuántos títulos locales ganó Estudiantes?",
                options: ["4", "5", "6", "7"],
                correct: 2
            },
            {
                category: "Jugadores",
                question: "¿En qué club comenzó su carrera Kaká?",
                options: ["Santos", "São Paulo", "Palmeiras", "Flamengo"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿Cuál es el derbi de Madrid?",
                options: ["Real Madrid vs Barcelona", "Real Madrid vs Atlético", "Atlético vs Getafe", "Real Madrid vs Rayo"],
                correct: 1
            },
            {
                category: "Récords",
                question: "¿Quién tiene el récord de más goles en una temporada europea?",
                options: ["Messi", "Cristiano", "Lewandowski", "Haaland"],
                correct: 0
            },
            {
                category: "Historia",
                question: "¿En qué Mundial se usó por primera vez el VAR?",
                options: ["Brasil 2014", "Rusia 2018", "Qatar 2022", "No se ha usado"],
                correct: 1
            },
            {
                category: "Europa",
                question: "¿Qué equipo francés ganó la Champions en 1993?",
                options: ["PSG", "Monaco", "Marseille", "Lyon"],
                correct: 2
            },
            {
                category: "Jugadores",
                question: "¿Qué jugador brasileño fue apodado 'El Fenómeno'?",
                options: ["Ronaldinho", "Ronaldo", "Rivaldo", "Romário"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿En qué año ganó Estudiantes su primera Copa Libertadores?",
                options: ["1968", "1969", "1970", "1971"],
                correct: 1
            },

            // Preguntas de Copa América y competiciones
            {
                category: "Copas",
                question: "¿Qué país ganó más Copas América?",
                options: ["Argentina", "Uruguay", "Brasil", "Chile"],
                correct: 1
            },
            {
                category: "Copas",
                question: "¿En qué año se jugó la primera Copa América?",
                options: ["1915", "1916", "1917", "1918"],
                correct: 1
            },
            {
                category: "Europa",
                question: "¿Qué equipo ganó la primera Champions League?",
                options: ["Real Madrid", "Barcelona", "AC Milan", "Manchester United"],
                correct: 0
            },
            {
                category: "Clubes",
                question: "¿Cuál es el club más antiguo del mundo?",
                options: ["Sheffield FC", "Notts County", "Cambridge University", "Wrexham FC"],
                correct: 0
            },
            {
                category: "Jugadores",
                question: "¿Qué portero español ganó más títulos?",
                options: ["Casillas", "Valdés", "Reina", "De Gea"],
                correct: 0
            },

            // Más preguntas argentinas
            {
                category: "Argentina",
                question: "¿Cuál es el clásico de Avellaneda?",
                options: ["Racing vs Independiente", "Racing vs Estudiantes", "Independiente vs Lanús", "Racing vs Banfield"],
                correct: 0
            },
            {
                category: "Argentina",
                question: "¿Quién es el máximo goleador de Boca Juniors?",
                options: ["Palermo", "Maradona", "Riquelme", "Tevez"],
                correct: 0
            },
            {
                category: "Argentina",
                question: "¿En qué año se fundó la AFA?",
                options: ["1893", "1901", "1905", "1910"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿Cuántas veces ganó San Lorenzo la Copa Libertadores?",
                options: ["0", "1", "2", "3"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿En qué provincia queda Rosario Central?",
                options: ["Buenos Aires", "Córdoba", "Santa Fe", "Entre Ríos"],
                correct: 2
            },

            // Preguntas de técnicos
            {
                category: "Técnicos",
                question: "¿Quién dirigió a Argentina en el Mundial de Qatar 2022?",
                options: ["Sampaoli", "Scaloni", "Sabella", "Bauza"],
                correct: 1
            },
            {
                category: "Técnicos",
                question: "¿Qué técnico ganó más Champions League?",
                options: ["Ancelotti", "Guardiola", "Mourinho", "Ferguson"],
                correct: 0
            },
            {
                category: "Técnicos",
                question: "¿Quién fue el técnico de Barcelona en el triplete 2009?",
                options: ["Rijkaard", "Guardiola", "Luis Enrique", "Martino"],
                correct: 1
            },
            {
                category: "Técnicos",
                question: "¿Qué técnico argentino dirigió al Real Madrid?",
                options: ["Pellegrini", "Simeone", "Pochettino", "Valdano"],
                correct: 3
            },
            {
                category: "Técnicos",
                question: "¿Quién dirigió a Chelsea cuando ganó la Champions 2012?",
                options: ["Mourinho", "Ancelotti", "Di Matteo", "Conte"],
                correct: 2
            },

            // Más preguntas variadas
            {
                category: "Curiosidades",
                question: "¿Cuál es el único país que jugó todos los Mundiales?",
                options: ["Argentina", "Brasil", "Alemania", "Italia"],
                correct: 1
            },
            {
                category: "Curiosidades",
                question: "¿Qué jugador usó la camiseta número 10 en Argentina después de Maradona?",
                options: ["Riquelme", "Aimar", "Messi", "Ortega"],
                correct: 2
            },
            {
                category: "Clubes",
                question: "¿Cuál es el equipo con más títulos en España?",
                options: ["Barcelona", "Real Madrid", "Athletic Bilbao", "Valencia"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿Qué jugador argentino jugó en Napoli después de Maradona?",
                options: ["Higuaín", "Lavezzi", "Cavani", "Insigne"],
                correct: 0
            },
            {
                category: "Europa",
                question: "¿En qué liga juega el Ajax?",
                options: ["Bundesliga", "Premier League", "Eredivisie", "Serie A"],
                correct: 2
            },

            // NUEVAS PREGUNTAS MASIVAS - JUGADORES MODERNOS
            {
                category: "Jugadores",
                question: "¿En qué año fichó Neymar por el PSG?",
                options: ["2016", "2017", "2018", "2019"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿Cuál es el nombre real de Vinícius Jr?",
                options: ["Vinícius José", "Vinícius Santos", "Vinícius Júnior", "Vinícius Tobias"],
                correct: 2
            },
            {
                category: "Jugadores",
                question: "¿Qué edad tenía Mbappé cuando ganó su primer Mundial?",
                options: ["18", "19", "20", "21"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿En qué club debutó Luka Modrić?",
                options: ["Real Madrid", "Tottenham", "Dinamo Zagreb", "Inter Milan"],
                correct: 2
            },
            {
                category: "Jugadores",
                question: "¿Cuántos goles hizo Lewandowski en una temporada en el Bayern?",
                options: ["39", "41", "43", "45"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿De qué país es Virgil van Dijk?",
                options: ["Bélgica", "Holanda", "Alemania", "Dinamarca"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿En qué equipo jugaba Sadio Mané antes del Liverpool?",
                options: ["Southampton", "Salzburg", "Metz", "Bayern"],
                correct: 0
            },
            {
                category: "Jugadores",
                question: "¿Cuál es la nacionalidad de N'Golo Kanté?",
                options: ["Francesa", "Marfileña", "Senegalesa", "Malí"],
                correct: 0
            },
            {
                category: "Jugadores",
                question: "¿En qué año se retiró Andrés Iniesta del Barcelona?",
                options: ["2017", "2018", "2019", "2020"],
                correct: 1
            },
            {
                category: "Jugadores",
                question: "¿Cuántos años tenía Pedri cuando debutó en el Barcelona?",
                options: ["16", "17", "18", "19"],
                correct: 1
            },

            // CLUBES INTERNACIONALES
            {
                category: "Clubes",
                question: "¿En qué año se fundó el Manchester City?",
                options: ["1880", "1890", "1894", "1900"],
                correct: 0
            },
            {
                category: "Clubes",
                question: "¿Cuál es el apodo del Newcastle United?",
                options: ["The Magpies", "The Hammers", "The Saints", "The Eagles"],
                correct: 0
            },
            {
                category: "Clubes",
                question: "¿En qué ciudad está el estadio Allianz Arena?",
                options: ["Berlín", "Munich", "Frankfurt", "Hamburg"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿Cuántas Champions ganó el Liverpool?",
                options: ["5", "6", "7", "8"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿Cuál es el estadio del Tottenham?",
                options: ["White Hart Lane", "Tottenham Stadium", "New White Hart Lane", "Spurs Stadium"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿En qué año descendió el Leeds United?",
                options: ["2003", "2004", "2005", "2006"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿Cuál es el derby de Londres más antiguo?",
                options: ["Arsenal vs Tottenham", "Chelsea vs Fulham", "Crystal Palace vs Brighton", "West Ham vs Millwall"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿Qué equipo italiano nunca descendió de la Serie A?",
                options: ["Juventus", "Inter", "AC Milan", "Ninguno"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿En qué año se fundó el PSG?",
                options: ["1968", "1970", "1972", "1974"],
                correct: 1
            },
            {
                category: "Clubes",
                question: "¿Cuál es el apodo del Borussia Dortmund?",
                options: ["Die Bayern", "BVB", "Die Roten", "Die Schwarzgelben"],
                correct: 1
            },

            // MUNDIALES Y COMPETICIONES
            {
                category: "Mundiales",
                question: "¿Quién fue el goleador del Mundial de Francia 1998?",
                options: ["Ronaldo", "Davor Suker", "Gabriel Batistuta", "Thierry Henry"],
                correct: 1
            },
            {
                category: "Mundiales",
                question: "¿En qué Mundial se jugó la final más alta de la historia?",
                options: ["México 1970", "México 1986", "Sudáfrica 2010", "Rusia 2018"],
                correct: 0
            },
            {
                category: "Mundiales",
                question: "¿Qué país organizó el Mundial de 1994?",
                options: ["México", "Estados Unidos", "Italia", "Francia"],
                correct: 1
            },
            {
                category: "Mundiales",
                question: "¿Cuántos penales atajó Emiliano Martínez en Qatar 2022?",
                options: ["2", "3", "4", "5"],
                correct: 2
            },
            {
                category: "Mundiales",
                question: "¿En qué Mundial debutó la tecnología del gol?",
                options: ["Sudáfrica 2010", "Brasil 2014", "Rusia 2018", "Qatar 2022"],
                correct: 1
            },
            {
                category: "Mundiales",
                question: "¿Quién marcó el primer gol del Mundial de Qatar 2022?",
                options: ["Messi", "Benzema", "Enner Valencia", "Casemiro"],
                correct: 2
            },
            {
                category: "Mundiales",
                question: "¿Cuántos equipos participan actualmente en un Mundial?",
                options: ["32", "36", "40", "48"],
                correct: 0
            },
            {
                category: "Mundiales",
                question: "¿En qué Mundial Maradona fue suspendido por doping?",
                options: ["Italia 1990", "Estados Unidos 1994", "Francia 1998", "No fue suspendido"],
                correct: 1
            },
            {
                category: "Mundiales",
                question: "¿Qué país fue sede del primer Mundial en Asia?",
                options: ["Japón", "Corea del Sur", "China", "Japón y Corea"],
                correct: 3
            },
            {
                category: "Mundiales",
                question: "¿Cuántos goles marcó Just Fontaine en Francia 1958?",
                options: ["11", "12", "13", "14"],
                correct: 2
            },

            // ARGENTINA PROFUNDA
            {
                category: "Argentina",
                question: "¿En qué año Estudiantes ganó su última Copa Libertadores?",
                options: ["2008", "2009", "2010", "2011"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿Cuál es el apodo de Lanús?",
                options: ["El Granate", "El Taladro", "El Fortín", "El Globo"],
                correct: 0
            },
            {
                category: "Argentina",
                question: "¿En qué provincia juega Godoy Cruz?",
                options: ["San Juan", "Mendoza", "San Luis", "La Rioja"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿Cuántos títulos locales ganó Vélez?",
                options: ["8", "9", "10", "11"],
                correct: 2
            },
            {
                category: "Argentina",
                question: "¿En qué año se fundó Estudiantes?",
                options: ["1905", "1906", "1907", "1908"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿Cuál es el estadio de Huracán?",
                options: ["Tomás Adolfo Ducó", "Presidente Perón", "Nuevo Gasómetro", "Libertadores de América"],
                correct: 0
            },
            {
                category: "Argentina",
                question: "¿Quién es el máximo goleador histórico de River?",
                options: ["Labruna", "Francescoli", "Saviola", "Cavenaghi"],
                correct: 0
            },
            {
                category: "Argentina",
                question: "¿En qué año Boca ganó su primera Copa Libertadores?",
                options: ["1977", "1978", "1979", "1980"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿Cuál fue el primer club argentino en ganar la Copa Intercontinental?",
                options: ["Racing", "Estudiantes", "Independiente", "Boca"],
                correct: 1
            },
            {
                category: "Argentina",
                question: "¿En qué año descendió San Lorenzo por única vez?",
                options: ["1979", "1980", "1981", "1982"],
                correct: 2
            },

            // EUROPA AVANZADA
            {
                category: "Europa",
                question: "¿Qué equipo ganó la primera Eurocopa de clubes?",
                options: ["Real Madrid", "AC Milan", "Benfica", "Barcelona"],
                correct: 0
            },
            {
                category: "Europa",
                question: "¿En qué año se creó la Premier League?",
                options: ["1990", "1992", "1994", "1996"],
                correct: 1
            },
            {
                category: "Europa",
                question: "¿Cuál es el récord de goles en una temporada de la Bundesliga?",
                options: ["39", "40", "41", "42"],
                correct: 2
            },
            {
                category: "Europa",
                question: "¿Qué equipo francés tiene más títulos después del PSG y Saint-Étienne?",
                options: ["Monaco", "Marseille", "Lyon", "Nantes"],
                correct: 2
            },
            {
                category: "Europa",
                question: "¿En qué año el Leicester ganó la Premier League?",
                options: ["2014", "2015", "2016", "2017"],
                correct: 2
            },
            {
                category: "Europa",
                question: "¿Cuál es el derby más violento de Europa?",
                options: ["Real Madrid vs Barcelona", "Rangers vs Celtic", "Lazio vs Roma", "Ajax vs Feyenoord"],
                correct: 1
            },
            {
                category: "Europa",
                question: "¿Qué equipo holandés ganó más Eredivisie?",
                options: ["Ajax", "PSV", "Feyenoord", "AZ Alkmaar"],
                correct: 0
            },
            {
                category: "Europa",
                question: "¿En qué liga juega el Shakhtar Donetsk?",
                options: ["Liga Rusa", "Liga Ucraniana", "Liga Polaca", "Liga Checa"],
                correct: 1
            },
            {
                category: "Europa",
                question: "¿Cuál es el apodo del Atalanta?",
                options: ["La Dea", "I Nerazzurri", "I Rossoneri", "La Lupa"],
                correct: 0
            },
            {
                category: "Europa",
                question: "¿En qué año se unificaron las dos ligas alemanas?",
                options: ["1989", "1990", "1991", "1992"],
                correct: 2
            },

            // RÉCORDS Y ESTADÍSTICAS
            {
                category: "Récords",
                question: "¿Cuál es el partido con más goles en la historia?",
                options: ["149-0", "150-0", "151-0", "152-0"],
                correct: 0
            },
            {
                category: "Récords",
                question: "¿Quién tiene el récord de más asistencias en una temporada?",
                options: ["Messi", "De Bruyne", "Müller", "Özil"],
                correct: 2
            },
            {
                category: "Récords",
                question: "¿Cuál es la racha invicta más larga en el fútbol?",
                options: ["107 partidos", "108 partidos", "109 partidos", "110 partidos"],
                correct: 0
            },
            {
                category: "Récords",
                question: "¿Quién marcó el gol más rápido en Champions League?",
                options: ["Alan Shearer", "Roy Makaay", "Clarence Seedorf", "Roberto Carlos"],
                correct: 1
            },
            {
                category: "Récords",
                question: "¿Cuál es el club que más dinero gastó en un mercado de pases?",
                options: ["PSG", "Manchester City", "Chelsea", "Barcelona"],
                correct: 2
            },
            {
                category: "Récords",
                question: "¿Quién tiene más títulos como técnico?",
                options: ["Ferguson", "Guardiola", "Ancelotti", "Mourinho"],
                correct: 0
            },
            {
                category: "Récords",
                question: "¿Cuál es el estadio con mayor capacidad de Europa?",
                options: ["Camp Nou", "Wembley", "Santiago Bernabéu", "San Siro"],
                correct: 0
            },
            {
                category: "Récords",
                question: "¿Quién es el jugador más caro de la historia?",
                options: ["Neymar", "Mbappe", "Griezmann", "Coutinho"],
                correct: 0
            },
            {
                category: "Récords",
                question: "¿Cuántos penales consecutivos convirtió Balotelli?",
                options: ["28", "29", "30", "31"],
                correct: 1
            },
            {
                category: "Récords",
                question: "¿Cuál es la mayor goleada en un Mundial?",
                options: ["9-0", "10-1", "11-0", "12-0"],
                correct: 1
            },

            // TÉCNICOS Y PERSONALIDADES
            {
                category: "Técnicos",
                question: "¿Qué técnico tiene más Champions League ganadas?",
                options: ["Ancelotti", "Zidane", "Guardiola", "Ferguson"],
                correct: 0
            },
            {
                category: "Técnicos",
                question: "¿Quién dirigió al Barcelona en el 6-1 contra el PSG?",
                options: ["Guardiola", "Luis Enrique", "Koeman", "Valverde"],
                correct: 1
            },
            {
                category: "Técnicos",
                question: "¿En qué año Mourinho ganó la Champions con el Inter?",
                options: ["2009", "2010", "2011", "2012"],
                correct: 1
            },
            {
                category: "Técnicos",
                question: "¿Qué técnico argentino dirigió a España?",
                options: ["Bielsa", "Simeone", "Caparrós", "Ninguno"],
                correct: 3
            },
            {
                category: "Técnicos",
                question: "¿Cuántas veces ganó Ferguson la Premier League?",
                options: ["11", "12", "13", "14"],
                correct: 2
            },
            {
                category: "Técnicos",
                question: "¿Qué técnico creó el 'tiki-taka'?",
                options: ["Cruyff", "Guardiola", "Michels", "Aragonés"],
                correct: 0
            },
            {
                category: "Técnicos",
                question: "¿Quién fue el técnico más joven en ganar una Champions?",
                options: ["Guardiola", "Mourinho", "Nagelsmann", "Pochettino"],
                correct: 0
            },
            {
                category: "Técnicos",
                question: "¿En qué club debutó como técnico Zidane?",
                options: ["Real Madrid", "Real Madrid Castilla", "Cannes", "Juventus"],
                correct: 1
            },
            {
                category: "Técnicos",
                question: "¿Qué técnico ganó la Champions con equipos de 3 países diferentes?",
                options: ["Mourinho", "Ancelotti", "Heynckes", "Ninguno"],
                correct: 1
            },
            {
                category: "Técnicos",
                question: "¿Cuántos años tenía Guardiola cuando ganó su primera Champions?",
                options: ["37", "38", "39", "40"],
                correct: 1
            },

            // COPAS Y COMPETICIONES SUDAMERICANAS
            {
                category: "Copas",
                question: "¿Qué equipo ganó más Copas Sudamericanas?",
                options: ["Boca", "Independiente", "São Paulo", "Athletico Paranaense"],
                correct: 0
            },
            {
                category: "Copas",
                question: "¿En qué año se creó la Copa Sudamericana?",
                options: ["2000", "2001", "2002", "2003"],
                correct: 2
            },
            {
                category: "Copas",
                question: "¿Qué país ganó la primera Copa América?",
                options: ["Argentina", "Uruguay", "Brasil", "Chile"],
                correct: 1
            },
            {
                category: "Copas",
                question: "¿Cuántas veces Argentina fue finalista de Copa América?",
                options: ["28", "29", "30", "31"],
                correct: 1
            },
            {
                category: "Copas",
                question: "¿Qué equipo brasileño ganó más Libertadores?",
                options: ["Santos", "São Paulo", "Flamengo", "Grêmio"],
                correct: 1
            },
            {
                category: "Copas",
                question: "¿En qué año se jugó la primera Recopa Sudamericana?",
                options: ["1988", "1989", "1990", "1991"],
                correct: 0
            },
            {
                category: "Copas",
                question: "¿Qué equipo chileno ganó más Copas América de clubes?",
                options: ["Colo-Colo", "Universidad de Chile", "Universidad Católica", "Cobreloa"],
                correct: 0
            },
            {
                category: "Copas",
                question: "¿Cuál fue el primer equipo mexicano en ganar la Libertadores?",
                options: ["Cruz Azul", "América", "Chivas", "Ninguno aún"],
                correct: 3
            },
            {
                category: "Copas",
                question: "¿En qué año Brasil ganó su primera Copa América como local?",
                options: ["1919", "1922", "1949", "1989"],
                correct: 0
            },
            {
                category: "Copas",
                question: "¿Qué equipo peruano llegó más lejos en una Libertadores?",
                options: ["Universitario", "Alianza Lima", "Sporting Cristal", "Sport Boys"],
                correct: 2
            },

            // CURIOSIDADES FUTBOLÍSTICAS
            {
                category: "Curiosidades",
                question: "¿Cuál es el club más antiguo del mundo aún en actividad?",
                options: ["Sheffield FC", "Notts County", "Hallam FC", "Cambridge University"],
                correct: 0
            },
            {
                category: "Curiosidades",
                question: "¿En qué país se inventó el corner?",
                options: ["Inglaterra", "Escocia", "Gales", "Irlanda"],
                correct: 1
            },
            {
                category: "Curiosidades",
                question: "¿Cuál fue el primer club en usar números en las camisetas?",
                options: ["Arsenal", "Chelsea", "Liverpool", "Manchester United"],
                correct: 0
            },
            {
                category: "Curiosidades",
                question: "¿En qué año se permitió a los arqueros usar las manos?",
                options: ["1870", "1871", "1872", "1873"],
                correct: 1
            },
            {
                category: "Curiosidades",
                question: "¿Cuál es el gol olímpico más famoso de la historia?",
                options: ["Pelé 1970", "Maradona 1986", "Cesáreo Onzari 1924", "Beckham 1996"],
                correct: 2
            },
            {
                category: "Curiosidades",
                question: "¿Qué jugador marcó el primer gol televisado?",
                options: ["Stanley Matthews", "Tommy Lawton", "Barney Allen", "Alex James"],
                correct: 2
            },
            {
                category: "Curiosidades",
                question: "¿En qué Mundial se usó por primera vez la pelota blanca?",
                options: ["Chile 1962", "Inglaterra 1966", "México 1970", "Alemania 1974"],
                correct: 2
            },
            {
                category: "Curiosidades",
                question: "¿Cuál es el club con más socios en el mundo?",
                options: ["Barcelona", "Real Madrid", "Bayern Munich", "Manchester United"],
                correct: 0
            },
            {
                category: "Curiosidades",
                question: "¿Qué jugador marcó más autogoles en la historia?",
                options: ["Richard Dunne", "Jamie Carragher", "Frank Sinclair", "Gary Neville"],
                correct: 0
            },
            {
                category: "Curiosidades",
                question: "¿En qué año se creó la regla del fuera de juego moderno?",
                options: ["1925", "1926", "1927", "1928"],
                correct: 0
            },

            // REGLAS Y ARBITRAJE
            {
                category: "Reglas",
                question: "¿Cuánto tiempo tiene un arquero para sacar de puerta?",
                options: ["6 segundos", "8 segundos", "10 segundos", "12 segundos"],
                correct: 0
            },
            {
                category: "Reglas",
                question: "¿Desde cuándo existe la regla de los 6 segundos del arquero?",
                options: ["1995", "1997", "1999", "2001"],
                correct: 1
            },
            {
                category: "Reglas",
                question: "¿Cuántos metros debe estar la barrera en un tiro libre?",
                options: ["9.15", "9.20", "9.25", "9.30"],
                correct: 0
            },
            {
                category: "Reglas",
                question: "¿En qué año se implementó la tarjeta amarilla?",
                options: ["1968", "1970", "1972", "1974"],
                correct: 1
            },
            {
                category: "Reglas",
                question: "¿Cuántos jugadores mínimo debe tener un equipo para jugar?",
                options: ["6", "7", "8", "9"],
                correct: 1
            },
            {
                category: "Reglas",
                question: "¿Desde cuándo se puede hacer el cambio de 5 jugadores?",
                options: ["2018", "2019", "2020", "2021"],
                correct: 2
            },
            {
                category: "Reglas",
                question: "¿Cuánto mide un arco de fútbol de ancho?",
                options: ["7.30m", "7.32m", "7.34m", "7.36m"],
                correct: 1
            },
            {
                category: "Reglas",
                question: "¿En qué año se implementó el VAR por primera vez?",
                options: ["2016", "2017", "2018", "2019"],
                correct: 1
            },
            {
                category: "Reglas",
                question: "¿Cuándo se puede hacer un saque de banda con las manos?",
                options: ["Siempre", "Solo el arquero", "En situaciones especiales", "Nunca"],
                correct: 0
            },
            {
                category: "Reglas",
                question: "¿Cuánto dura el tiempo añadido máximo permitido?",
                options: ["No hay límite", "10 minutos", "15 minutos", "20 minutos"],
                correct: 0
            }
        ];
    }

    setupEventListeners() {
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());

        // Event listeners para las opciones
        const optionButtons = this.optionsGrid.querySelectorAll('.option-btn');
        optionButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => this.selectAnswer(index));
        });

        // Prevenir que se pueda seleccionar texto durante el juego
        document.addEventListener('selectstart', (e) => {
            if (this.isGameActive) e.preventDefault();
        });
    }

    loadStats() {
        const stats = this.getStoredStats();
        this.updateStatsDisplay(stats);
    }

    getStoredStats() {
        const defaultStats = {
            bestScore: 0,
            gamesPlayed: 0,
            totalCorrect: 0,
            bestStreak: 0
        };

        try {
            const stored = localStorage.getItem('crackRapido_stats');
            return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats;
        } catch {
            return defaultStats;
        }
    }

    saveStats(newStats) {
        try {
            const currentStats = this.getStoredStats();
            const updatedStats = {
                bestScore: Math.max(currentStats.bestScore, newStats.score || 0),
                gamesPlayed: currentStats.gamesPlayed + 1,
                totalCorrect: currentStats.totalCorrect + (newStats.correctAnswers || 0),
                bestStreak: Math.max(currentStats.bestStreak, newStats.maxStreak || 0)
            };
            localStorage.setItem('crackRapido_stats', JSON.stringify(updatedStats));
            return updatedStats;
        } catch {
            return this.getStoredStats();
        }
    }

    updateStatsDisplay(stats) {
        this.bestScoreDisplay.textContent = stats.bestScore;
        this.gamesPlayedDisplay.textContent = stats.gamesPlayed;
        this.totalCorrectDisplay.textContent = stats.totalCorrect;
        this.bestStreakDisplay.textContent = stats.bestStreak;
    }

    startGame() {
        this.resetGameState();
        this.selectRandomQuestions();
        this.showScreen('game');
        this.gamePanel.classList.add('active');
        this.isGameActive = true;
        this.gameStartTime = Date.now();
        this.loadQuestion();
    }

    resetGameState() {
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.answerTimes = [];
        this.timeRemaining = 5;
        this.isGameActive = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    selectRandomQuestions() {
        // Mezclar todas las preguntas y seleccionar 20
        const shuffled = [...this.questionBank].sort(() => Math.random() - 0.5);
        this.questions = shuffled.slice(0, this.totalQuestions);
    }

    loadQuestion() {
        if (this.currentQuestion >= this.totalQuestions) {
            this.endGame();
            return;
        }

        const question = this.questions[this.currentQuestion];
        this.questionText.textContent = question.question;
        
        // Mezclar opciones
        const shuffledOptions = this.shuffleOptions(question.options, question.correct);
        
        const optionButtons = this.optionsGrid.querySelectorAll('.option-btn');
        optionButtons.forEach((btn, index) => {
            btn.textContent = shuffledOptions.options[index];
            btn.className = 'option-btn';
            btn.disabled = false;
            btn.dataset.correct = shuffledOptions.correctIndex === index ? 'true' : 'false';
        });

        this.updateGameStats();
        this.updateProgress();
        this.startTimer();
        this.questionStartTime = Date.now();
    }

    shuffleOptions(options, correctIndex) {
        const correctAnswer = options[correctIndex];
        const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        
        return {
            options: shuffledOptions,
            correctIndex: newCorrectIndex
        };
    }

    startTimer() {
        this.timeRemaining = 5;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.timeOut();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        this.timerCircle.textContent = this.timeRemaining;
        const progress = ((5 - this.timeRemaining) / 5) * 100;
        this.timerCircle.style.setProperty('--timer-progress', `${progress}%`);
        
        if (this.timeRemaining <= 2) {
            this.timerCircle.classList.add('critical');
        } else {
            this.timerCircle.classList.remove('critical');
        }
    }

    selectAnswer(selectedIndex) {
        if (!this.isGameActive) return;
        
        clearInterval(this.timer);
        const responseTime = Date.now() - this.questionStartTime;
        this.answerTimes.push(responseTime);
        
        const optionButtons = this.optionsGrid.querySelectorAll('.option-btn');
        const selectedButton = optionButtons[selectedIndex];
        const isCorrect = selectedButton.dataset.correct === 'true';
        
        // Deshabilitar todos los botones
        optionButtons.forEach(btn => btn.disabled = true);
        
        if (isCorrect) {
            selectedButton.classList.add('correct');
            this.handleCorrectAnswer(responseTime);
            this.showSpeedEffect('¡CORRECTO!', '#56ab2f');
        } else {
            selectedButton.classList.add('incorrect');
            this.handleIncorrectAnswer();
            this.showSpeedEffect('¡INCORRECTO!', '#ff416c');
            
            // Mostrar respuesta correcta
            optionButtons.forEach(btn => {
                if (btn.dataset.correct === 'true') {
                    btn.classList.add('correct');
                }
            });
        }
        
        // Continuar a la siguiente pregunta después de un delay
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }

    handleCorrectAnswer(responseTime) {
        this.correctAnswers++;
        this.streak++;
        this.maxStreak = Math.max(this.maxStreak, this.streak);
        
        // Calcular puntos basado en velocidad
        const speedBonus = Math.max(1, Math.floor((5000 - responseTime) / 100));
        const streakBonus = Math.min(this.streak, 10);
        const points = 100 + speedBonus + (streakBonus * 10);
        
        this.score += points;
    }

    handleIncorrectAnswer() {
        this.streak = 0;
    }

    timeOut() {
        clearInterval(this.timer);
        this.handleIncorrectAnswer();
        this.answerTimes.push(5000); // Tiempo máximo
        
        // Mostrar respuesta correcta
        const optionButtons = this.optionsGrid.querySelectorAll('.option-btn');
        optionButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.correct === 'true') {
                btn.classList.add('correct');
            }
        });
        
        this.showSpeedEffect('¡TIEMPO!', '#ffd32a');
        
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }

    nextQuestion() {
        this.currentQuestion++;
        this.timerCircle.classList.remove('critical');
        this.loadQuestion();
    }

    updateGameStats() {
        this.currentQuestionDisplay.textContent = this.currentQuestion + 1;
        this.currentScoreDisplay.textContent = this.score;
        this.currentStreakDisplay.textContent = this.streak;
    }

    updateProgress() {
        const progress = ((this.currentQuestion + 1) / this.totalQuestions) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    showSpeedEffect(text, color) {
        const effect = document.createElement('div');
        effect.className = 'speed-effect';
        effect.textContent = text;
        effect.style.color = color;
        effect.style.fontFamily = "'Oswald', sans-serif";
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1000);
    }

    endGame() {
        this.isGameActive = false;
        this.gamePanel.classList.remove('active');
        clearInterval(this.timer);
        
        const totalTime = Date.now() - this.gameStartTime;
        const averageTime = this.answerTimes.length > 0 ? 
            this.answerTimes.reduce((a, b) => a + b, 0) / this.answerTimes.length : 0;
        
        this.showResults({
            score: this.score,
            correctAnswers: this.correctAnswers,
            totalTime: Math.floor(totalTime / 1000),
            averageTime: Math.floor(averageTime / 1000),
            maxStreak: this.maxStreak
        });
    }

    showResults(results) {
        // Actualizar displays de resultados
        this.finalScoreDisplay.textContent = results.score;
        this.correctAnswersDisplay.textContent = results.correctAnswers;
        this.totalTimeDisplay.textContent = `${results.totalTime}s`;
        this.averageTimeDisplay.textContent = `${results.averageTime}s`;
        this.maxStreakDisplay.textContent = results.maxStreak;
        
        // Mensaje personalizado basado en rendimiento
        const percentage = (results.correctAnswers / this.totalQuestions) * 100;
        let message = '';
        
        if (percentage >= 90) {
            message = '¡CRACK TOTAL! Sos una leyenda del fútbol 🏆';
        } else if (percentage >= 75) {
            message = '¡Excelente! Conocés mucho de fútbol ⚽';
        } else if (percentage >= 60) {
            message = '¡Bien hecho! Seguí así 👏';
        } else if (percentage >= 40) {
            message = '¡Buen intento! Podés mejorar 💪';
        } else {
            message = '¡Seguí practicando! El fútbol es pasión 📚';
        }
        
        this.scoreMessage.textContent = message;
        
        // Guardar estadísticas y verificar records
        const updatedStats = this.saveStats(results);
        this.updateStatsDisplay(updatedStats);
        
        // Verificar si es nuevo record
        if (results.score > 0 && results.score >= updatedStats.bestScore && updatedStats.gamesPlayed > 1) {
            this.newRecordsSection.style.display = 'block';
        } else {
            this.newRecordsSection.style.display = 'none';
        }
        
        // Guardar en Firebase
        this.saveToFirebase(results);
        
        this.showScreen('results');
    }

    resetGame() {
        this.resetGameState();
        this.showScreen('start');
        this.gamePanel.classList.remove('active');
    }

    async saveToFirebase(results) {
        try {
            // Preparar datos para Firebase
            const gameStats = {
                result: results.correctAnswers === this.totalQuestions ? "completed" : "incomplete",
                score: results.score,
                correctAnswers: results.correctAnswers,
                totalQuestions: this.totalQuestions,
                maxStreak: results.maxStreak,
                averageTime: results.averageTime,
                totalTime: results.totalTime
            };

            // Guardar en Firebase
            const success = await saveCrackRapidoResult(gameStats);
            
            if (success) {
                console.log('Partida de Crack Rápido guardada en Firebase');
            } else {
                console.log('Error al guardar la partida en Firebase');
            }
        } catch (error) {
            console.error('Error al conectar con Firebase:', error);
        }
    }

    showScreen(screen) {
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
        
        switch (screen) {
            case 'start':
                this.startScreen.classList.remove('hidden');
                break;
            case 'game':
                this.gameScreen.classList.remove('hidden');
                break;
            case 'results':
                this.resultsScreen.classList.remove('hidden');
                break;
        }
    }
}

// Inicializar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new CrackRapido();
});

// Función global para compartir
window.shareSite = function() {
    if (navigator.share) {
        navigator.share({
            title: 'Crack Rápido - Crack Total',
            text: '¡Probá el desafío más rápido de Crack Total! 20 preguntas en 5 segundos cada una.',
            url: window.location.href
        }).catch(console.error);
    } else {
        // Fallback para navegadores que no soportan Web Share API
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('¡Enlace copiado al portapapeles!');
        }).catch(() => {
            alert(`Compartí este enlace: ${url}`);
        });
    }
}; 