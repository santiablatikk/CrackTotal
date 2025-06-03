// ==================== CRACK RÁPIDO - COMPLETAMENTE RENOVADO ====================
console.log('🚀 Inicializando Crack Rápido Renovado...');

// ==================== IMPORTAR FIREBASE ====================
import { db, safeFirestoreOperation } from './firebase-init.js';
import { 
    collection, 
    addDoc, 
    serverTimestamp,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==================== BANCO DE PREGUNTAS COMPLETO EXPANDIDO ====================
const QUESTION_BANK = [
    // MESSI (50+ preguntas expandidas)
    {
        category: "Messi",
        question: "¿Cuántos Balones de Oro había ganado Messi hasta finales de 2024?",
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
        question: "¿Cuántos goles oficiales marcó Messi en el año calendario 2012, estableciendo un récord mundial?",
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
        question: "¿Contra qué equipo marcó Messi su primer gol oficial con Barcelona?",
        options: ["Real Madrid", "Albacete", "Athletic Bilbao", "Valencia"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿Cuántos goles marcó Messi en el Mundial de Qatar 2022, donde Argentina fue campeona?",
        options: ["6", "7", "8", "5"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Messi",
        question: "¿En qué año Messi ganó su primera Copa América con la selección mayor, rompiendo una larga sequía para Argentina?",
        options: ["2019", "2021", "2024", "2016"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuántos hat-tricks oficiales tenía Messi en su carrera hasta finales de 2024?",
        options: ["55", "57", "59", "61"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿Qué dorsal usa Messi en Inter Miami CF?",
        options: ["9", "10", "30", "19"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Messi",
        question: "¿Cuántas UEFA Champions League ganó Messi con el FC Barcelona?",
        options: ["3", "4", "5", "2"],
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
        question: "¿Cuántos goles marcó Messi en LaLiga española durante toda su carrera allí, siendo el máximo goleador histórico?",
        options: ["472", "474", "476", "470"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿Contra qué equipo Messi hizo su debut oficial en la Selección Argentina mayor, siendo expulsado pocos minutos después?",
        options: ["Brasil", "Uruguay", "Hungría", "Paraguay"],
        correct: 2,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿En qué año Messi fichó por el Paris Saint-Germain (PSG) tras su salida del Barcelona?",
        options: ["2020", "2021", "2022", "2019"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuántos goles de tiro libre directo había marcado Messi en su carrera hasta finales de 2024?",
        options: ["65", "62", "68", "70"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿Qué problema de salud relacionado con el crecimiento tuvo Messi de niño, requiriendo tratamiento?",
        options: ["Déficit de hormona del crecimiento", "Problema óseo congénito", "Deficiencia nutricional severa", "Problema muscular degenerativo"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuántos partidos oficiales jugó Messi con el FC Barcelona, siendo el jugador con más apariciones en la historia del club?",
        options: ["778", "780", "768", "788"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿En qué año Messi superó el récord de Pelé de más goles con un solo club?",
        options: ["2020", "2021", "2019", "2022"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuántos años tenía Messi cuando se mudó a Barcelona para unirse a La Masia?",
        options: ["11", "12", "13", "14"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuántos goles marcó Messi para el FC Barcelona en su temporada más goleadora (2011-12, todas las competiciones)?",
        options: ["72", "73", "74", "75"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿De estos porteros, contra cuál había marcado Messi más goles en su carrera hasta finales de 2024?",
        options: ["Iker Casillas", "Diego López", "Thibaut Courtois", "Jan Oblak"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿En qué posición solía jugar Messi en las categorías inferiores del FC Barcelona antes de ser extremo derecho en el primer equipo?",
        options: ["Mediocentro defensivo", "Delantero centro (9)", "Mediapunta o enganche", "Lateral izquierdo"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuántos títulos oficiales ganó Messi con el FC Barcelona en total?",
        options: ["34", "35", "36", "33"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿En qué Copa del Mundo Messi fue galardonado con el Balón de Oro del torneo por primera vez?",
        options: ["Alemania 2006", "Sudáfrica 2010", "Brasil 2014", "Rusia 2018"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuántos penales había fallado Messi en su carrera profesional (club y selección) hasta finales de 2024?",
        options: ["Aprox. 29", "Aprox. 31", "Aprox. 33", "Aprox. 27"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿Cuántas Ligas españolas (LaLiga) ganó Messi con el FC Barcelona?",
        options: ["10", "11", "9", "12"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Qué jugador dio más asistencias a Messi en el FC Barcelona?",
        options: ["Xavi Hernández", "Andrés Iniesta", "Luis Suárez", "Dani Alves"],
        correct: 2,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿Cuántos Mundiales de Clubes de la FIFA ganó Messi con el FC Barcelona?",
        options: ["2", "3", "4", "1"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuántos años consecutivos fue Messi el máximo goleador de LaLiga (Trofeo Pichichi) en su racha más larga?",
        options: ["3", "5", "4", "6"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿Qué edad tenía Messi cuando ganó su primer Balón de Oro en 2009?",
        options: ["21", "22", "23", "20"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuántos goles marcó Messi en LaLiga en su última temporada en Barcelona (2020-21)?",
        options: ["30", "32", "28", "35"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿En qué año Messi debutó oficialmente en la Primera División con el FC Barcelona?",
        options: ["2003", "2004", "2005", "2006"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿En qué club argentino jugó Messi en categorías inferiores antes de ir a Barcelona?",
        options: ["River Plate", "Boca Juniors", "Newell's Old Boys", "Rosario Central"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "Messi",
        question: "¿Qué premio individual importante ganó Messi en el Mundial Sub-20 de 2005, además del título con Argentina?",
        options: ["Bota de Oro y Balón de Oro", "Solo Bota de Oro", "Solo Balón de Oro", "Mejor Jugador Joven del Torneo"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿En qué año Messi ganó la medalla de oro olímpica con Argentina en Pekín?",
        options: ["2004", "2008", "2012", "2016"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuántas veces había ganado Messi el premio The Best FIFA al mejor jugador del mundo hasta finales de 2024?",
        options: ["1", "2", "3", "4"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Messi",
        question: "¿Cuál es el apodo más conocido de Lionel Messi?",
        options: ["El Matador", "La Pulga", "El Pibe", "El Mago"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Messi",
        question: "¿Cuántos goles había marcado Messi con la Selección Argentina hasta finales de 2024, incluyendo la Copa América 2024?",
        options: ["106", "108", "111", "115"],
        correct: 2,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿Cuántas Botas de Oro europeas había ganado Messi hasta finales de 2024?",
        options: ["4", "5", "6", "7"],
        correct: 2,
        difficulty: "hard"
    },
    {
        category: "Messi",
        question: "¿Quién fue el entrenador que hizo debutar a Messi en el primer equipo del FC Barcelona?",
        options: ["Pep Guardiola", "Tito Vilanova", "Frank Rijkaard", "Louis van Gaal"],
        correct: 2,
        difficulty: "medium"
    },

    // BOCA JUNIORS (30+ preguntas)
    {
        category: "Boca",
        question: "¿En qué fecha exacta se fundó el Club Atlético Boca Juniors?",
        options: ["3 de abril de 1905", "3 de mayo de 1905", "3 de abril de 1904", "1 de abril de 1905"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Cuántas Copas Libertadores de América había ganado Boca Juniors hasta finales de 2024?",
        options: ["5", "6", "7", "8"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Boca",
        question: "¿Quién es el máximo goleador histórico de Boca Juniors?",
        options: ["Francisco Varallo", "Martín Palermo", "Juan Román Riquelme", "Roberto Cherro"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Cuántos goles oficiales marcó Martín Palermo en Boca Juniors?",
        options: ["236", "238", "234", "240"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Boca",
        question: "¿Cuál es la capacidad habilitada aproximada y oficial de La Bombonera a finales de 2024?",
        options: ["49.000", "54.000", "60.000", "57.000"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿En qué año se inauguró oficialmente el estadio La Bombonera?",
        options: ["1938", "1940", "1941", "1939"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Boca",
        question: "¿Cuál de estos colores usó Boca Juniors en sus primeras camisetas antes del azul y oro, inspirado por la Juventus?",
        options: ["Verde y blanco", "Rosa", "Blanca con tiras negras finas", "Celeste"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Cuántas Copas Intercontinentales (formato anterior al Mundial de Clubes FIFA) ganó Boca Juniors?",
        options: ["2", "3", "4", "1"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Ha descendido Boca Juniors alguna vez de la Primera División del fútbol argentino?",
        options: ["Sí, en 1949", "Sí, en 1980", "Sí, dos veces", "Nunca descendió"],
        correct: 3,
        difficulty: "easy"
    },
    {
        category: "Boca",
        question: "¿Quién es el jugador con más partidos disputados en la historia de Boca Juniors?",
        options: ["Roberto Mouzo", "Hugo Gatti", "Silvio Marzolini", "Juan Román Riquelme"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Boca",
        question: "¿En qué año Juan Román Riquelme debutó oficialmente en la primera de Boca?",
        options: ["1995", "1996", "1997", "1998"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Cuál es el apodo más tradicional y conocido de Boca Juniors, relacionado con sus fundadores?",
        options: ["Los Xeneizes", "Los Bosteros", "El Ciclón", "La Academia"],
        correct: 0,
        difficulty: "easy"
    },
    {
        category: "Boca",
        question: "¿Quién fue una figura clave y goleador en la final de la Copa Libertadores 2007 que ganó Boca?",
        options: ["Martín Palermo", "Guillermo Barros Schelotto", "Juan Román Riquelme", "Rodrigo Palacio"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿En qué década Boca Juniors ganó más títulos de Primera División Argentina?",
        options: ["1990-1999", "2000-2009", "1960-1969", "1940-1949"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Boca",
        question: "El apodo 'Xeneize' hace referencia al origen de los fundadores del club, que eran principalmente inmigrantes de:",
        options: ["Génova (Italia)", "Nápoles (Italia)", "Galicia (España)", "País Vasco (España)"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿En qué año Carlos Tevez debutó oficialmente en la primera de Boca Juniors?",
        options: ["2001", "2002", "2000", "2003"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Cuántas Recopas Sudamericanas había ganado Boca Juniors hasta finales de 2024?",
        options: ["3", "4", "2", "5"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Quién fue el director técnico de Boca Juniors durante la conquista de la Copa Libertadores 2000 y 2001?",
        options: ["Carlos Bianchi", "Miguel Ángel Russo", "Alfio Basile", "Oscar Tabárez"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿En qué barrio de Buenos Aires se encuentra el estadio La Bombonera?",
        options: ["La Boca", "Barracas", "San Telmo", "Puerto Madero"],
        correct: 0,
        difficulty: "easy"
    },
    {
        category: "Boca",
        question: "¿Cuántos campeonatos de Primera División del fútbol argentino (ligas) había ganado Boca Juniors hasta finales de 2024?",
        options: ["34", "35", "36", "33"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Boca",
        question: "¿Quién fue el primer presidente de Boca Juniors?",
        options: ["Esteban Baglietto", "Alfredo Scarpati", "Santiago Sana", "Juan Rafael Brichetto"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Boca",
        question: "¿En qué año Diego Armando Maradona tuvo su primer ciclo como jugador en Boca Juniors, ganando el Metropolitano?",
        options: ["1980", "1981", "1982", "1979"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Contra qué equipo europeo Boca Juniors perdió la final de la Copa Intercontinental 2001?",
        options: ["Real Madrid", "AC Milan", "Bayern Munich", "Manchester United"],
        correct: 2,
        difficulty: "hard"
    },
    {
        category: "Boca",
        question: "¿Cuál fue el apodo del exitoso entrenador Carlos Bianchi en Boca Juniors?",
        options: ["El Virrey", "El Bambino", "El Flaco", "El Loco"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿En qué año Boca Juniors ganó su primera Copa Libertadores?",
        options: ["1977", "1978", "1976", "1979"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Cuántas Supercopas Sudamericanas (ya extinta) ganó Boca Juniors?",
        options: ["1 (1989)", "2", "0", "3"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Algún jugador de Boca Juniors ha ganado el Balón de Oro mientras jugaba en el club?",
        options: ["Sí, Maradona en 1981", "Sí, Riquelme en 2001", "Sí, Tevez en 2003", "Ninguno lo ganó jugando en Boca"],
        correct: 3,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Cuál es el nombre completo oficial del estadio de Boca Juniors?",
        options: ["Estadio Alberto J. Armando", "Estadio Camilo Cichero", "La Bombonera de Buenos Aires", "Estadio Brandsen y Del Crucero"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Boca",
        question: "¿Qué jugador de Boca fue famoso por celebrar sus goles como 'El Topo Gigio'?",
        options: ["Martín Palermo", "Carlos Tevez", "Juan Román Riquelme", "Guillermo Barros Schelotto"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "Boca",
        question: "¿Qué colores de barco inspiraron la camiseta azul y oro de Boca Juniors?",
        options: ["Un barco griego", "Un barco sueco", "Un barco italiano", "Un barco inglés"],
        correct: 1,
        difficulty: "medium"
    },

    // RIVER PLATE (25+ preguntas)
    {
        category: "River",
        question: "¿En qué fecha exacta se fundó el Club Atlético River Plate?",
        options: ["25 de mayo de 1901", "25 de mayo de 1900", "26 de mayo de 1901", "25 de mayo de 1904"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿Quién es el máximo goleador histórico de River Plate en el profesionalismo?",
        options: ["Ángel Labruna", "Bernabé Ferreyra", "Enzo Francescoli", "Oscar Más"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿Cuántas Copas Libertadores de América había ganado River Plate hasta finales de 2024?",
        options: ["4", "5", "3", "6"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿En qué año River Plate descendió a la Primera B Nacional?",
        options: ["2010", "2011", "2009", "Nunca descendió"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿Cuál es el apodo más tradicional y conocido de River Plate?",
        options: ["Los Millonarios", "Las Gallinas", "La Máquina", "El Más Grande"],
        correct: 0,
        difficulty: "easy"
    },
    {
        category: "River",
        question: "¿Contra qué equipo River Plate ganó la histórica final de la Copa Libertadores 2018 en Madrid?",
        options: ["Boca Juniors", "Grêmio", "Palmeiras", "Flamengo"],
        correct: 0,
        difficulty: "easy"
    },
    {
        category: "River",
        question: "¿En qué año se inauguró oficialmente el Estadio Monumental?",
        options: ["1937", "1938", "1939", "1936"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "River",
        question: "¿Cuál es la capacidad aproximada del Estadio Monumental tras sus últimas remodelaciones a finales de 2024?",
        options: ["83.000", "84.500", "86.000", "81.000"],
        correct: 2,
        difficulty: "hard"
    },
    {
        category: "River",
        question: "¿En qué año River Plate ganó su primera Copa Libertadores de América?",
        options: ["1985", "1986", "1996", "1976"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿Cuántos títulos de Primera División Argentina (ligas) había ganado River Plate hasta finales de 2024?",
        options: ["36", "37", "38", "35"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿En qué barrio de Buenos Aires se encuentra principalmente el Estadio Monumental?",
        options: ["Belgrano", "Núñez", "Saavedra", "Palermo"],
        correct: 0,
        difficulty: "easy"
    },
    {
        category: "River",
        question: "¿Quién fue el primer presidente de River Plate?",
        options: ["Leopoldo Bard", "Antonio Vespucio Liberti", "Enrique Salvarezza", "José Bacigaluppi"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "River",
        question: "¿Quién era el director técnico de River Plate cuando el equipo descendió?",
        options: ["Ángel Cappa", "Juan José López", "Daniel Passarella", "Matías Almeyda"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿En qué año River Plate logró el ascenso y regresó a la Primera División?",
        options: ["2011", "2012", "2013", "2010"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿En qué año Marcelo Gallardo asumió como director técnico de River Plate?",
        options: ["2013", "2014", "2015", "2012"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿Cuántos títulos oficiales ganó Marcelo Gallardo como director técnico de River Plate?",
        options: ["12", "13", "14", "15"],
        correct: 2,
        difficulty: "hard"
    },
    {
        category: "River",
        question: "¿Cómo se conoció a la famosa delantera de River Plate de la década de 1940?",
        options: ["La Máquina", "El Ballet Azul", "Los Carasucias", "El Equipo de José"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿En qué año River Plate ganó su única Copa Intercontinental?",
        options: ["1985", "1986", "1996", "1997"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿Quién es el jugador con más partidos disputados en la historia de River Plate?",
        options: ["Reinaldo Merlo", "Ángel Labruna", "Amadeo Carrizo", "Ubaldo Fillol"],
        correct: 2,
        difficulty: "hard"
    },
    {
        category: "River",
        question: "¿Cuál es el nombre completo del estadio de River Plate?",
        options: ["Estadio Monumental Antonio Vespucio Liberti", "Estadio Monumental de Núñez", "Estadio Ángel Labruna", "Estadio Monumental José Fierro"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "River",
        question: "¿Qué ídolo de River Plate es conocido como 'El Príncipe'?",
        options: ["Ariel Ortega", "Norberto Alonso", "Enzo Francescoli", "Marcelo Salas"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "River",
        question: "¿Qué apodo despectivo suelen usar los hinchas rivales para referirse a River Plate?",
        options: ["Xeneizes", "Gallinas", "Bosteros", "Cuervos"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "River",
        question: "¿Quién fue el arquero titular de River Plate en la Copa Libertadores ganada en 2018?",
        options: ["Marcelo Barovero", "Germán Lux", "Franco Armani", "Augusto Batalla"],
        correct: 2,
        difficulty: "medium"
    },

    // MUNDIALES (30+ preguntas)
    {
        category: "Mundial",
        question: "¿Cuántos Mundiales de fútbol masculino organizados por la FIFA se habían disputado hasta el de Qatar 2022 inclusive?",
        options: ["21", "22", "23", "20"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Mundial",
        question: "¿Qué país ha ganado más Copas del Mundo de fútbol masculino?",
        options: ["Alemania", "Italia", "Brasil", "Argentina"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "Mundial",
        question: "¿Quién es el máximo goleador en la historia de los Mundiales de fútbol masculino?",
        options: ["Pelé", "Miroslav Klose", "Ronaldo Nazário", "Gerd Müller"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿Cuántos goles marcó Miroslav Klose en Copas del Mundo?",
        options: ["14", "15", "16", "17"],
        correct: 2,
        difficulty: "hard"
    },
    {
        category: "Mundial",
        question: "¿En qué país se disputó la primera Copa del Mundo de fútbol en 1930?",
        options: ["Italia", "Uruguay", "Brasil", "Francia"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿Cuál fue el marcador final (tras la prórroga, antes de penales) de la final del Mundial 2022 entre Argentina y Francia?",
        options: ["Argentina 3 - 3 Francia", "Argentina 2 - 2 Francia", "Argentina 3 - 2 Francia", "Argentina 2 - 1 Francia"],
        correct: 0,
        difficulty: "easy"
    },
    {
        category: "Mundial",
        question: "¿Quién ganó la Bota de Oro al máximo goleador en el Mundial de Qatar 2022?",
        options: ["Lionel Messi", "Kylian Mbappé", "Olivier Giroud", "Julián Álvarez"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿Qué país fue la sede de la Copa del Mundo de fútbol 2018?",
        options: ["Alemania", "Rusia", "Brasil", "Sudáfrica"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Mundial",
        question: "¿En qué año se disputará la próxima Copa del Mundo de fútbol masculino (después de Qatar 2022)?",
        options: ["2025", "2026", "2027", "2030"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Mundial",
        question: "¿Cuántos equipos participaron en la primera Copa del Mundo de 1930?",
        options: ["13", "16", "12", "8"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿Quién marcó el primer gol en la historia de los Mundiales de fútbol?",
        options: ["Lucien Laurent (Francia)", "Héctor Castro (Uruguay)", "Guillermo Stábile (Argentina)", "Bert Patenaude (EEUU)"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Mundial",
        question: "¿Qué dos países fueron co-anfitriones del Mundial de fútbol 2002?",
        options: ["Japón y China", "Corea del Sur y Japón", "China y Corea del Sur", "Tailandia y Japón"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿Quién es el jugador más joven en marcar un gol en una Copa del Mundo?",
        options: ["Pelé (Brasil)", "Manuel Rosas (México)", "Michael Owen (Inglaterra)", "Lionel Messi (Argentina)"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿Cuántos años tenía Pelé cuando ganó su primera Copa del Mundo en 1958?",
        options: ["16", "17", "18", "19"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿En qué Copa del Mundo se utilizó por primera vez el sistema VAR (Video Assistant Referee)?",
        options: ["Brasil 2014", "Rusia 2018", "Qatar 2022", "Sudáfrica 2010"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿En qué Mundial Diego Maradona marcó el famoso gol conocido como 'La Mano de Dios'?",
        options: ["España 1982", "México 1986", "Italia 1990", "Estados Unidos 1994"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Mundial",
        question: "¿Qué tres países serán co-anfitriones de la Copa del Mundo 2026?",
        options: ["EEUU, México, Costa Rica", "Canadá, EEUU, Bahamas", "México, Canadá, Cuba", "Estados Unidos, Canadá y México"],
        correct: 3,
        difficulty: "easy"
    },
    {
        category: "Mundial",
        question: "¿Ha faltado alguna vez Brasil a una Copa del Mundo masculina?",
        options: ["Sí, en 1938", "Nunca ha faltado", "Sí, en 1954", "Sí, en 1930"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Mundial",
        question: "¿Quién fue el primer jugador en ganar tres Copas del Mundo?",
        options: ["Mario Zagallo", "Franz Beckenbauer", "Pelé", "Cafú"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿En qué país se disputó la primera Copa del Mundo de fútbol en el continente africano?",
        options: ["Sudáfrica (2010)", "Egipto (propuesto)", "Nigeria (propuesto)", "Marruecos (propuesto)"],
        correct: 0,
        difficulty: "easy"
    },
    {
        category: "Mundial",
        question: "¿Cuántos hat-tricks (tres goles por un jugador en un partido) se marcaron en el Mundial de Qatar 2022?",
        options: ["1", "2", "3", "0"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿Quién marcó el único hat-trick en la final de un Mundial (Qatar 2022)?",
        options: ["Kylian Mbappé", "Lionel Messi", "Geoff Hurst", "Pelé"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿En qué Copa del Mundo se introdujeron por primera vez las tarjetas amarilla y roja?",
        options: ["Inglaterra 1966", "México 1970", "Alemania 1974", "Argentina 1978"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿Cuántos países diferentes habían ganado la Copa del Mundo de fútbol masculino hasta finales de 2024?",
        options: ["7", "8", "9", "6"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Mundial",
        question: "¿Qué jugador ostenta el récord de más partidos jugados en la historia de los Mundiales masculinos hasta finales de 2024?",
        options: ["Paolo Maldini", "Lothar Matthäus", "Lionel Messi", "Miroslav Klose"],
        correct: 2,
        difficulty: "hard"
    },

    // CHAMPIONS LEAGUE (20+ preguntas)
    {
        category: "Champions",
        question: "¿Qué equipo había ganado más veces la UEFA Champions League (incluyendo la Copa de Europa) hasta finales de 2024?",
        options: ["AC Milan", "Real Madrid", "Liverpool FC", "FC Barcelona"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Champions",
        question: "¿En qué temporada la Copa de Europa fue renombrada oficialmente a UEFA Champions League?",
        options: ["1991-92", "1992-93", "1993-94", "1990-91"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Cuántas UEFA Champions League (incluyendo Copa de Europa) había ganado el Real Madrid hasta finales de 2024?",
        options: ["13", "14", "15", "16"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Quién es el máximo goleador histórico de la UEFA Champions League hasta finales de 2024?",
        options: ["Lionel Messi", "Cristiano Ronaldo", "Robert Lewandowski", "Karim Benzema"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Champions",
        question: "¿Cuántos goles aproximadamente había marcado Cristiano Ronaldo en la UEFA Champions League hasta el final de su participación en el torneo?",
        options: ["140", "135", "145", "130"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Champions",
        question: "¿Qué equipo ganó la primera edición bajo el nombre de UEFA Champions League en la temporada 1992-93?",
        options: ["AC Milan", "FC Barcelona", "Olympique de Marsella", "Manchester United"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Cuál es una de las remontadas más famosas en la historia de la Champions League, conocida como 'La Remontada' del Barcelona al PSG?",
        options: ["Barcelona 6-1 PSG (2017)", "Liverpool 4-0 Barcelona (2019)", "AS Roma 3-0 Barcelona (2018)", "Deportivo 4-0 AC Milan (2004)"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿En qué ciudad se jugó la famosa final de la Champions League de 2005, conocida como 'El Milagro de Estambul'?",
        options: ["Estambul", "Atenas", "Moscú", "Roma"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Qué equipo ganó la UEFA Champions League en la temporada 2022-2023?",
        options: ["Real Madrid", "Manchester City", "Inter de Milán", "Bayern de Múnich"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Cuántas veces había ganado el AC Milan la Champions League (incluyendo Copa de Europa) hasta finales de 2024?",
        options: ["6", "7", "5", "8"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Qué equipo inglés protagonizó 'El Milagro de Estambul' ganando la Champions en 2005?",
        options: ["Manchester United", "Chelsea FC", "Liverpool FC", "Arsenal FC"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Cuál es el récord de goles marcados por un jugador en una sola edición de la Champions League?",
        options: ["15 (Lionel Messi)", "17 (Cristiano Ronaldo)", "16 (Robert Lewandowski)", "14 (Ruud van Nistelrooy)"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Champions",
        question: "¿Qué entrenador había ganado más títulos de Champions League hasta finales de 2024?",
        options: ["Carlo Ancelotti (5)", "Zinedine Zidane (3)", "Pep Guardiola (3)", "Bob Paisley (3)"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Champions",
        question: "¿En qué año el Ajax de Ámsterdam ganó por última vez la Champions League?",
        options: ["1994", "1995", "1996", "1993"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Qué club fue el primero en ganar la Copa de Europa en tres ocasiones consecutivas en la década de 1950?",
        options: ["Real Madrid CF", "AC Milan", "SL Benfica", "Ajax"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Qué equipo perdió dos finales de Champions League contra el Real Madrid en la década de 2010 (2014 y 2016)?",
        options: ["Atlético de Madrid", "Juventus FC", "Liverpool FC", "Borussia Dortmund"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Qué jugador tiene el récord de más apariciones en la UEFA Champions League hasta finales de 2024?",
        options: ["Iker Casillas", "Lionel Messi", "Cristiano Ronaldo", "Xavi Hernández"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿Cuál fue el primer equipo en ganar la Copa de Europa (actual Champions League) en 1956?",
        options: ["AC Milan", "FC Barcelona", "Real Madrid CF", "Manchester United"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Champions",
        question: "¿En qué ciudad se jugó la final de la Champions League 2024?",
        options: ["París", "Múnich", "Londres", "Estambul"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "Champions",
        question: "¿Qué equipo ganó la Champions League 2024?",
        options: ["Borussia Dortmund", "Bayern de Múnich", "Paris Saint-Germain", "Real Madrid"],
        correct: 3,
        difficulty: "easy"
    },

    // ARGENTINA (20+ preguntas)
    {
        category: "Argentina",
        question: "¿Cuántas Copas del Mundo de la FIFA había ganado la Selección Argentina de fútbol masculino hasta finales de 2024?",
        options: ["2", "3", "4", "1"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Argentina",
        question: "¿En qué años Argentina ganó la Copa del Mundo?",
        options: ["1978, 1986, 2022", "1978, 1990, 2014", "1986, 1994, 2022", "1974, 1982, 2018"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿Cuántas Copas América había ganado la Selección Argentina hasta finales de 2024, incluyendo la edición de 2024?",
        options: ["14", "15", "16", "17"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿Quién es el máximo goleador histórico de la Selección Argentina de fútbol masculino hasta finales de 2024?",
        options: ["Diego Maradona", "Gabriel Batistuta", "Lionel Messi", "Hernán Crespo"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "Argentina",
        question: "¿En qué estadio Argentina jugó y ganó la final del Mundial 1978?",
        options: ["Estadio Monumental (River Plate)", "La Bombonera (Boca Juniors)", "Estadio José Amalfitani (Vélez)", "Estadio Gigante de Arroyito (Rosario Central)"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿Contra qué selección Argentina perdió la final del Mundial de Brasil 2014?",
        options: ["Brasil", "Alemania", "Países Bajos", "España"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Argentina",
        question: "¿Quién fue el director técnico de la Selección Argentina que ganó el Mundial de Qatar 2022?",
        options: ["Jorge Sampaoli", "Lionel Scaloni", "Gerardo Martino", "Alejandro Sabella"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Argentina",
        question: "¿En qué año Argentina ganó la Copa América rompiendo una sequía de 28 años sin títulos mayores?",
        options: ["2019", "2021", "2016", "2015"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿Cuántos partidos invicta estuvo la Selección Argentina bajo la dirección de Lionel Scaloni antes de perder con Arabia Saudita en Qatar 2022?",
        options: ["35", "36", "37", "34"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "Argentina",
        question: "¿Quién fue el capitán de la Selección Argentina en la conquista del Mundial 2022?",
        options: ["Ángel Di María", "Lionel Messi", "Emiliano Martínez", "Nicolás Otamendi"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "Argentina",
        question: "¿En qué Copa del Mundo Argentina llegó a la final por primera vez en su historia?",
        options: ["Uruguay 1930", "Italia 1934", "Brasil 1950", "Suecia 1958"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿Cuántas finales de Copa del Mundo había perdido la Selección Argentina hasta finales de 2024?",
        options: ["2", "3", "4", "1"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿Quién fue el primer director técnico en llevar a Argentina a ganar una Copa del Mundo (1978)?",
        options: ["César Luis Menotti", "Carlos Bilardo", "Alfio Basile", "Juan Carlos Lorenzo"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿Quién es el jugador con más partidos disputados en la historia de la Selección Argentina hasta finales de 2024?",
        options: ["Diego Maradona", "Javier Zanetti", "Lionel Messi", "Javier Mascherano"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿Cuántas medallas de oro olímpicas había ganado la Selección Argentina de fútbol masculino hasta finales de 2024?",
        options: ["1", "2", "3", "Ninguna"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿En qué años la Selección Argentina ganó la medalla de oro en fútbol masculino en los Juegos Olímpicos?",
        options: ["Atenas 2004 y Pekín 2008", "Sídney 2000 y Atenas 2004", "Pekín 2008 y Londres 2012", "Atlanta 1996 y Atenas 2004"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "Argentina",
        question: "¿Qué apodo tenía Diego Armando Maradona?",
        options: ["El Pibe de Oro", "El Matador", "El Príncipe", "El Burrito"],
        correct: 0,
        difficulty: "easy"
    },
    {
        category: "Argentina",
        question: "¿Quién marcó el gol de la victoria para Argentina en la final de la Copa América 2021 contra Brasil?",
        options: ["Lionel Messi", "Lautaro Martínez", "Ángel Di María", "Rodrigo De Paul"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿Cuál es el color principal de la camiseta titular de la Selección Argentina?",
        options: ["Azul oscuro", "Blanco", "Celeste y blanco a rayas verticales", "Amarillo"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "Argentina",
        question: "¿Quién fue el entrenador de Argentina en el Mundial de México 1986?",
        options: ["César Luis Menotti", "Carlos Salvador Bilardo", "Alfio Basile", "Marcelo Bielsa"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "Argentina",
        question: "¿Quién fue el arquero titular de Argentina en la conquista del Mundial de Qatar 2022?",
        options: ["Franco Armani", "Gerónimo Rulli", "Juan Musso", "Emiliano Martínez"],
        correct: 3,
        difficulty: "easy"
    },
    {
        category: "Argentina",
        question: "¿Cuál es el máximo goleador argentino en la historia de los Mundiales hasta finales de 2024?",
        options: ["Diego Maradona", "Gabriel Batistuta", "Lionel Messi", "Mario Kempes"],
        correct: 2,
        difficulty: "medium"
    },

    // GENERAL (25+ preguntas)
    {
        category: "General",
        question: "¿Cuántos jugadores componen un equipo de fútbol en el campo de juego durante un partido oficial?",
        options: ["10", "11", "12", "9"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "General",
        question: "¿Cuánto dura reglamentariamente un partido de fútbol profesional, sin contar el tiempo añadido ni prórrogas?",
        options: ["80 minutos", "90 minutos", "100 minutos", "85 minutos"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "General",
        question: "¿En qué fecha se fundó la FIFA (Fédération Internationale de Football Association)?",
        options: ["21 de mayo de 1904", "15 de junio de 1902", "28 de abril de 1905", "4 de julio de 1903"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "General",
        question: "¿A qué país se le atribuye la codificación moderna del fútbol (association football)?",
        options: ["Francia", "Inglaterra", "Brasil", "Escocia"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Cuántas sustituciones (cambios de jugadores) se permiten por equipo en la mayoría de las competiciones oficiales de fútbol (regla post-pandemia)?",
        options: ["3", "4", "5", "6"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿En qué año se fundó la CONMEBOL (Confederación Sudamericana de Fútbol)?",
        options: ["1914", "1916", "1918", "1920"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "General",
        question: "¿Cuál es considerado el club de fútbol más antiguo del mundo reconocido por la FIFA?",
        options: ["Sheffield FC", "Notts County", "Cambridge University AFC", "Hallam FC"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "General",
        question: "¿Qué significa la sigla UEFA?",
        options: ["United European Football Association", "Union of European Football Associations", "Universal European Football Alliance", "Union of Elite Football Assemblies"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿En qué país se disputó la primera Copa Mundial Femenina de la FIFA en 1991?",
        options: ["Estados Unidos", "China", "Suecia", "Alemania"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Cuántas confederaciones continentales componen la FIFA?",
        options: ["5", "6", "7", "4"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Cuál es la altura reglamentaria de una portería de fútbol (desde el suelo hasta el borde inferior del larguero)?",
        options: ["2.34 metros", "2.44 metros", "2.50 metros", "2.40 metros"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿En qué año se establecieron las primeras reglas formalizadas del fuera de juego (offside) por la Football Association inglesa?",
        options: ["1863", "1870", "1888", "1857"],
        correct: 0,
        difficulty: "hard"
    },
    {
        category: "General",
        question: "¿Cuántas federaciones nacionales de fútbol son miembros de la FIFA aproximadamente (a finales de 2024)?",
        options: ["209", "211", "207", "215"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Qué país fue el anfitrión de la primera Copa América en 1916 (entonces Campeonato Sudamericano)?",
        options: ["Argentina", "Uruguay", "Brasil", "Chile"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿En qué año se disputó la primera edición de la Copa Libertadores de América?",
        options: ["1958", "1960", "1962", "1955"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Cuál es el traspaso de futbolista más caro de la historia hasta finales de 2024?",
        options: ["Neymar Jr. (Barcelona a PSG)", "Kylian Mbappé (Mónaco a PSG)", "Philippe Coutinho (Liverpool a Barcelona)", "João Félix (Benfica a Atlético Madrid)"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿En qué liga nacional juega el Manchester City FC?",
        options: ["EFL Championship", "Premier League", "Serie A", "Ligue 1"],
        correct: 1,
        difficulty: "easy"
    },
    {
        category: "General",
        question: "¿Qué significa la sigla VAR en el contexto del fútbol?",
        options: ["Video Assistant Referee", "Video Analysis Review", "Verified Action Replay", "Virtual Assessment Rules"],
        correct: 0,
        difficulty: "easy"
    },
    {
        category: "General",
        question: "¿En qué año se fundó el FC Barcelona?",
        options: ["1899", "1902", "1897", "1905"],
        correct: 0,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Quién ganó el Balón de Oro en el año 2008?",
        options: ["Lionel Messi", "Kaká", "Cristiano Ronaldo", "Fernando Torres"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Qué selección ganó la Eurocopa 2024?",
        options: ["Inglaterra", "Italia", "España", "Francia"],
        correct: 2,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Cuál es el torneo de clubes más prestigioso de Sudamérica?",
        options: ["Copa Sudamericana", "Recopa Sudamericana", "Copa Libertadores", "Suruga Bank Championship"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "General",
        question: "¿Qué jugador es conocido como 'CR7'?",
        options: ["Cristiano Ronaldo", "Ronaldo Nazário", "Ronaldinho", "Lionel Messi"],
        correct: 0,
        difficulty: "easy"
    },
    {
        category: "General",
        question: "¿Cuántos puntos se otorgan por una victoria en la mayoría de las ligas de fútbol?",
        options: ["1", "2", "3", "4"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "General",
        question: "¿En qué país se encuentra la sede de la FIFA?",
        options: ["Francia (París)", "Suiza (Zúrich)", "Bélgica (Bruselas)", "Alemania (Múnich)"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Qué organismo rige el fútbol en Asia?",
        options: ["CAF", "AFC", "OFC", "CONCACAF"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Cuál es la circunferencia reglamentaria de un balón de fútbol talla 5?",
        options: ["60-62 cm", "64-66 cm", "68-70 cm", "72-74 cm"],
        correct: 2,
        difficulty: "hard"
    },
    {
        category: "General",
        question: "¿Quién fue la primera ganadora del Balón de Oro Femenino en 2018?",
        options: ["Megan Rapinoe", "Ada Hegerberg", "Alexia Putellas", "Sam Kerr"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Cómo se llama la principal competición de clubes de fútbol en Norteamérica, Centroamérica y el Caribe?",
        options: ["MLS Cup", "Liga de Campeones de la CONCACAF", "Copa Oro", "Leagues Cup"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿En qué año se jugó el primer partido internacional oficial de fútbol?",
        options: ["1863", "1872", "1888", "1901"],
        correct: 1,
        difficulty: "hard"
    },
    {
        category: "General",
        question: "¿En qué ciudad se encuentra el famoso estadio Maracaná?",
        options: ["São Paulo", "Buenos Aires", "Río de Janeiro", "Montevideo"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "General",
        question: "¿Qué es un 'gol olímpico'?",
        options: ["Un gol anotado en los Juegos Olímpicos", "Un gol anotado directamente desde un saque de esquina", "Un gol anotado desde medio campo", "Un gol de chilena"],
        correct: 1,
        difficulty: "medium"
    },
    {
        category: "General",
        question: "¿Cuál de estos NO es un tipo de sanción disciplinaria con tarjeta en el fútbol?",
        options: ["Tarjeta amarilla", "Tarjeta roja", "Tarjeta azul", "Ninguna de las anteriores es incorrecta"],
        correct: 2,
        difficulty: "easy"
    },
    {
        category: "General",
        question: "¿Qué significa OFC en el mundo del fútbol?",
        options: ["Organización de Fútbol del Caribe", "Oficina Federal de Campeonatos", "Confederación de Fútbol de Oceanía", "Organización de Fútbol Centroamericano"],
        correct: 2,
        difficulty: "medium"
    }
];

// ==================== ESTADO DEL JUEGO ====================
let gameState = {
    currentQuestion: 0,
    score: 0,
    correctAnswers: 0,
    timeLeft: 5, // Cambiado de 15 a 5 segundos
    timer: null,
    questions: [],
    gameStartTime: null,
    gameActive: false,
    totalQuestions: 20,
    speedBonus: 0,
    // Nuevas estadísticas para el ranking
    currentStreak: 0,
    maxStreak: 0,
    responseTimes: [],
    totalGameTime: 0,
    completedQuestions: 0,
    timeOuts: 0,
    perfectAnswers: 0, // Respuestas en menos de 2 segundos
    questionStartTime: null
};

// ==================== CONFIGURACIÓN DEL JUEGO ====================
const GAME_CONFIG = {
    totalQuestions: 20,
    timePerQuestion: 5, // 5 segundos por pregunta
    basePoints: 100,
    maxSpeedBonus: 100,
    categories: ['Messi', 'Boca', 'River', 'Mundial', 'Champions', 'Argentina', 'General']
};

// ==================== FUNCIONES DE PANTALLAS ====================
function showScreen(screenName) {
    console.log('📱 Mostrando pantalla:', screenName);
    
    const screens = ['startScreen', 'gameScreen', 'resultsScreen', 'instructionsScreen'];
    screens.forEach(screen => {
        const element = document.getElementById(screen);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    const targetScreen = document.getElementById(screenName);
    if (targetScreen) {
        targetScreen.style.display = 'block';
        console.log('✅ Pantalla mostrada:', screenName);
    } else {
        console.error('❌ Pantalla no encontrada:', screenName);
    }
}

// ==================== FUNCIONES DEL JUEGO ====================
function startGame() {
    // Reproducir sonido de inicio del juego
    if (window.soundManager) {
        window.soundManager.playSound('gameStart');
    }
    
    console.log('🚀 Starting Crack Rápido game');
    
    // Reset game state
    gameState.currentQuestion = 0;
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.timeLeft = GAME_CONFIG.timePerQuestion;
    gameState.gameActive = true;
    gameState.speedBonus = 0;
    gameState.gameStartTime = Date.now();
    
    // Reset nuevas estadísticas para el ranking
    gameState.currentStreak = 0;
    gameState.maxStreak = 0;
    gameState.responseTimes = [];
    gameState.totalGameTime = 0;
    gameState.completedQuestions = 0;
    gameState.timeOuts = 0;
    gameState.perfectAnswers = 0;
    gameState.questionStartTime = null;
    
    // Get questions for this game
    gameState.questions = getQuestionsForGame();
    
    if (gameState.questions.length === 0) {
        showFeedback('❌ Error: No hay preguntas disponibles', 'incorrect');
        showScreen('startScreen');
        return;
    }
    
    // Update UI
    updateElement('currentScore', gameState.score);
    updateElement('questionNumber', gameState.currentQuestion + 1);
    updateElement('scoreDisplay', gameState.score + ' pts');
    updateProgressBar();
    
    // Load first question
    loadQuestion();
    
    // Show game screen
    showScreen('gameScreen');
    
    // Start timer
    startTimer();
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function loadQuestion() {
    if (gameState.currentQuestion >= gameState.questions.length) {
        endGame();
        return;
    }
    
    const question = gameState.questions[gameState.currentQuestion];
    console.log('📝 Cargando pregunta:', gameState.currentQuestion + 1, '/', gameState.questions.length);
    
    // Registrar tiempo de inicio de la pregunta para tracking
    gameState.questionStartTime = Date.now();
    
    // Actualizar UI
    updateElement('questionText', question.question);
    updateElement('questionNumber', gameState.currentQuestion + 1);
    updateElement('currentScore', gameState.score);
    updateElement('timeLeft', gameState.timeLeft);
    updateElement('questionCategory', question.category);
    
    // Actualizar barra de progreso
    updateProgressBar();
    
    // Cargar opciones con animaciones
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.style.setProperty('--i', index);
            button.innerHTML = `<strong>${String.fromCharCode(65 + index)}.</strong> ${option}`;
            button.onclick = () => selectAnswer(index);
            button.disabled = false; // Asegurar que los botones están habilitados
            
            // Resetear estilos
            button.style.backgroundColor = '';
            button.style.color = '';
            button.style.borderColor = '';
            
            // Añadir efecto hover mejorado para modo extremo
            button.addEventListener('mouseenter', () => {
                if (!button.disabled) {
                    button.style.transform = 'translateX(8px) scale(1.02)';
                    button.style.borderColor = 'var(--accent)';
                }
            });
            
            button.addEventListener('mouseleave', () => {
                if (!button.disabled) {
                    button.style.transform = 'translateX(0) scale(1)';
                    button.style.borderColor = '';
                }
            });
            
            optionsContainer.appendChild(button);
        });
        
        // Añadir animaciones
        addOptionAnimations();
    }
    
    console.log('✅ Pregunta cargada correctamente');
}

function updateProgressBar() {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        const percentage = ((gameState.currentQuestion + 1) / gameState.totalQuestions) * 100;
        progressFill.style.width = percentage + '%';
    }
}

function selectAnswer(selectedIndex) {
    if (!gameState.gameActive) return;
    
    clearTimeout(gameState.timer);
    clearInterval(gameState.timer);
    
    const question = gameState.questions[gameState.currentQuestion];
    const isCorrect = selectedIndex === question.correct;
    
    // Calcular tiempo de respuesta
    const responseTime = gameState.questionStartTime ? (Date.now() - gameState.questionStartTime) / 1000 : GAME_CONFIG.timePerQuestion;
    gameState.responseTimes.push(responseTime);
    gameState.completedQuestions++;
    
    // Actualizar estadísticas de racha
    if (isCorrect) {
        gameState.currentStreak++;
        gameState.maxStreak = Math.max(gameState.maxStreak, gameState.currentStreak);
        
        // Contar respuestas perfectas (menos de 2 segundos)
        if (responseTime <= 2) {
            gameState.perfectAnswers++;
        }
    } else {
        gameState.currentStreak = 0; // Resetear racha
    }
    
    // Reproducir sonido según la respuesta
    if (window.soundManager) {
        if (isCorrect) {
            window.soundManager.playSound('correct');
        } else {
            window.soundManager.playSound('incorrect');
        }
    }
    
    console.log('🎯 Respuesta seleccionada:', selectedIndex, 'Correcta:', question.correct, 'Tiempo:', responseTime.toFixed(2) + 's');
    
    // Pausar timer
    gameState.gameActive = false;
    
    // Visual feedback en los botones
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correct) {
            btn.style.backgroundColor = 'var(--success)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--success)';
        } else if (index === selectedIndex && !isCorrect) {
            btn.style.backgroundColor = 'var(--danger)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--danger)';
        }
    });
    
    if (isCorrect) {
        gameState.correctAnswers++;
        const timeBonus = Math.max(0, gameState.timeLeft - 1) * 20;
        const totalPoints = GAME_CONFIG.basePoints + timeBonus;
        
        gameState.score += totalPoints;
        gameState.speedBonus += timeBonus;
        
        showFeedback(`¡Correcto! +${totalPoints} puntos (${timeBonus} bonus)`, 'correct');
        console.log('✅ Respuesta correcta. Puntos obtenidos:', totalPoints, 'Racha actual:', gameState.currentStreak);
    } else {
        const correctAnswer = question.options[question.correct];
        showFeedback(`Incorrecto. La respuesta era: ${correctAnswer}`, 'incorrect');
        console.log('❌ Respuesta incorrecta. Racha perdida.');
    }
    
    // Actualizar score inmediatamente
    updateElement('currentScore', gameState.score);
    updateElement('scoreDisplay', gameState.score + ' pts');
    
    // Siguiente pregunta después de 2 segundos
    setTimeout(() => {
        gameState.currentQuestion++;
        gameState.gameActive = true;
        
        if (gameState.currentQuestion < gameState.questions.length) {
            loadQuestion();
            startTimer();
        } else {
            endGame();
        }
    }, 2000);
}

function startTimer() {
    gameState.timeLeft = GAME_CONFIG.timePerQuestion;
    updateElement('timeLeft', gameState.timeLeft);
    
    // Resetear color del timer
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.classList.remove('warning', 'danger');
    }
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateElement('timeLeft', gameState.timeLeft);
        
        // Reproducir sonido de tick cuando quedan pocos segundos
        if (gameState.timeLeft <= 3 && gameState.timeLeft > 0 && window.soundManager) {
            window.soundManager.playSound('tick', { volume: 0.5 });
        }
        
        // Cambiar color según tiempo restante
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            if (gameState.timeLeft <= 1) {
                timerDisplay.classList.add('danger');
                timerDisplay.classList.remove('warning');
            } else if (gameState.timeLeft <= 2) {
                timerDisplay.classList.add('warning');
                timerDisplay.classList.remove('danger');
            } else {
                timerDisplay.classList.remove('warning', 'danger');
            }
        }
        
        if (gameState.timeLeft <= 0) {
            timeOut();
        }
    }, 1000);
}

function timeOut() {
    if (!gameState.gameActive) return;
    
    // Registrar timeout en estadísticas
    gameState.timeOuts++;
    gameState.currentStreak = 0; // Resetear racha por timeout
    
    // Registrar tiempo de respuesta como máximo (5 segundos)
    gameState.responseTimes.push(GAME_CONFIG.timePerQuestion);
    gameState.completedQuestions++;
    
    // Reproducir sonido de timeout
    if (window.soundManager) {
        window.soundManager.playSound('timeout');
    }
    
    console.log('⏰ Tiempo agotado. Timeouts:', gameState.timeOuts, 'Racha perdida.');
    clearInterval(gameState.timer);
    gameState.gameActive = false;
    
    const question = gameState.questions[gameState.currentQuestion];
    const correctAnswer = question.options[question.correct];
    
    // Deshabilitar todos los botones y mostrar la respuesta correcta
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correct) {
            btn.style.backgroundColor = 'var(--success)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--success)';
        }
    });
    
    showFeedback(`¡Tiempo agotado! La respuesta era: ${correctAnswer}`, 'timeout');
    
    // Siguiente pregunta después de 2 segundos
    setTimeout(() => {
        gameState.currentQuestion++;
        gameState.gameActive = true;
        
        if (gameState.currentQuestion < gameState.questions.length) {
            loadQuestion();
            startTimer();
        } else {
            endGame();
        }
    }, 2000);
}

function endGame() {
    console.log('🏁 Juego terminado');
    clearInterval(gameState.timer);
    
    // Calcular tiempo total del juego
    gameState.totalGameTime = (Date.now() - gameState.gameStartTime) / 1000;
    
    // Calcular estadísticas finales
    const accuracy = Math.round((gameState.correctAnswers / gameState.questions.length) * 100);
    const averageTime = gameState.responseTimes.length > 0 ? 
        gameState.responseTimes.reduce((a, b) => a + b, 0) / gameState.responseTimes.length : 
        GAME_CONFIG.timePerQuestion;
    const completed = gameState.currentQuestion >= gameState.questions.length;
    
    // Datos del juego para Firebase
    const gameData = {
        // Identificación del juego
        gameType: 'crackrapido',
        gameMode: 'CrackRapido',
        playerName: getPlayerName(),
        userId: getUserId(),
        
        // Estadísticas básicas
        score: gameState.score,
        correctAnswers: gameState.correctAnswers,
        totalQuestions: gameState.questions.length,
        accuracy: accuracy,
        completed: completed,
        
        // Estadísticas avanzadas para ranking
        maxStreak: gameState.maxStreak,
        averageTime: Math.round(averageTime * 100) / 100, // Redondear a 2 decimales
        totalTime: Math.round(gameState.totalGameTime),
        timeOuts: gameState.timeOuts,
        perfectAnswers: gameState.perfectAnswers,
        speedBonus: gameState.speedBonus,
        
        // Datos adicionales
        responseTimes: gameState.responseTimes,
        result: completed ? 'completed' : (gameState.timeOuts > 10 ? 'timeout' : 'incomplete'),
        category: 'general', // Crack Rápido usa preguntas mixtas
        difficulty: 'extreme', // Modo extremo
        gameVersion: 'v2.0'
    };
    
    console.log('📊 Estadísticas finales calculadas:', gameData);
    
    // Guardar en Firebase
    if (window.saveGameToFirebase) {
        window.saveGameToFirebase(gameData).then(() => {
            console.log('✅ Partida guardada en Firebase exitosamente');
            
            // Actualizar estadísticas del jugador
            if (window.updatePlayerStats) {
                window.updatePlayerStats(gameData);
            }
        }).catch(error => {
            console.error('❌ Error guardando partida:', error);
        });
    }
    
    // Reproducir sonido según el rendimiento
    if (window.soundManager) {
        if (accuracy >= 70) { // Si acierta 70% o más, es victoria
            window.soundManager.playSound('victory');
        } else {
            window.soundManager.playSound('defeat');
        }
    }
    
    // Actualizar estadísticas locales
    updateStats();
    
    // Mostrar resultados
    updateElement('finalScore', gameState.score);
    updateElement('correctAnswers', gameState.correctAnswers);
    updateElement('accuracy', accuracy + '%');
    updateElement('speedBonus', gameState.speedBonus);
    
    showScreen('resultsScreen');
    
    console.log('📊 Estadísticas finales del juego:');
    console.log('- Puntuación:', gameState.score);
    console.log('- Respuestas correctas:', gameState.correctAnswers, '/', gameState.questions.length);
    console.log('- Precisión:', accuracy + '%');
    console.log('- Racha máxima:', gameState.maxStreak);
    console.log('- Tiempo promedio:', averageTime.toFixed(2) + 's');
    console.log('- Timeouts:', gameState.timeOuts);
    console.log('- Respuestas perfectas:', gameState.perfectAnswers);
    console.log('- Bonus de velocidad:', gameState.speedBonus);
    console.log('- Tiempo total:', gameState.totalGameTime.toFixed(2) + 's');
    console.log('- Partida completada:', completed);
}

// ==================== FUNCIONES DE UTILIDAD ====================
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showFeedback(message, type) {
    // Remover feedback anterior
    const existingFeedback = document.querySelector('.feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Crear nuevo feedback
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    
    // Añadir iconos según el tipo
    let icon = '';
    switch(type) {
        case 'correct':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'incorrect':
            icon = '<i class="fas fa-times-circle"></i>';
            break;
        case 'timeout':
            icon = '<i class="fas fa-clock"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    feedback.innerHTML = `${icon} ${message}`;
    document.body.appendChild(feedback);
    
    // Remover después de la animación
        setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
    }

function updateStats() {
    const stats = getStoredStats();
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    stats.bestScore = Math.max(stats.bestScore || 0, gameState.score);
    stats.totalScore = (stats.totalScore || 0) + gameState.score;
    stats.totalCorrect = (stats.totalCorrect || 0) + gameState.correctAnswers;
    stats.totalSpeedBonus = (stats.totalSpeedBonus || 0) + gameState.speedBonus;
    
    // Calcular racha más larga
    if (gameState.correctAnswers > (stats.bestStreak || 0)) {
        stats.bestStreak = gameState.correctAnswers;
    }
    
            localStorage.setItem('crackRapidoStats', JSON.stringify(stats));
    
    // Actualizar UI con animación
    animateStatUpdate('bestScore', stats.bestScore);
    animateStatUpdate('gamesPlayed', stats.gamesPlayed);
}

function animateStatUpdate(elementId, newValue) {
    const element = document.getElementById(elementId);
            if (element) {
        element.style.transform = 'scale(1.2)';
        element.style.color = 'var(--accent)';
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'scale(1)';
            element.style.color = 'var(--text-primary)';
        }, 200);
    }
}

function addOptionAnimations() {
    const options = document.querySelectorAll('.option-btn');
    options.forEach((option, index) => {
        option.style.setProperty('--i', index);
    });
}

function getStoredStats() {
    try {
        return JSON.parse(localStorage.getItem('crackRapidoStats')) || {};
    } catch (e) {
        return {};
    }
}

function loadStoredStats() {
    const stats = getStoredStats();
    updateElement('bestScore', stats.bestScore || 0);
    updateElement('gamesPlayed', stats.gamesPlayed || 0);
}

// ==================== FUNCIONES GLOBALES ====================
window.startGame = startGame;
window.showScreen = showScreen;

window.showInstructions = function() {
    console.log('📖 Mostrando instrucciones');
    showScreen('instructionsScreen');
};

window.goHome = function() {
    console.log('🏠 Volviendo al inicio');
    showScreen('startScreen');
};

window.goToGames = function() {
    console.log('🎮 Volviendo a la página de juegos');
    window.location.href = 'games.html';
};

// ==================== FUNCIONES DE OBTENCIÓN DE PREGUNTAS ====================
function getQuestionsForGame() {
    console.log('📋 Obteniendo preguntas para el juego...');
    
    // Mezclar todas las preguntas del banco
    const shuffledQuestions = shuffleArray([...QUESTION_BANK]);
    
    // Tomar las primeras 20 preguntas
    const selectedQuestions = shuffledQuestions.slice(0, GAME_CONFIG.totalQuestions);
    
    console.log(`📋 Seleccionadas ${selectedQuestions.length} preguntas para el juego`);
    
    return selectedQuestions;
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado - Inicializando Crack Rápido Renovado...');
    
    // Cargar estadísticas guardadas
    loadStoredStats();
    
    // Mostrar pantalla de inicio
    showScreen('startScreen');
    
    console.log('✅ Crack Rápido Renovado iniciado correctamente');
    console.log('📊 Banco de preguntas cargado:', QUESTION_BANK.length, 'preguntas');
    console.log('🎮 Listo para jugar!');
    
    // ========================================= 
    // ======== SISTEMA DE SONIDO COMPLETO ======== 
    // ========================================= 
    
    class SoundManager {
        constructor() {
            this.audioContext = null;
            this.sounds = {};
            this.volume = 0.7; // Volumen por defecto 70%
            this.isMuted = false;
            this.currentBackgroundMusic = null;
            this.soundEnabled = true;
            
            // Cargar configuración guardada
            this.loadSoundSettings();
            
            // Inicializar Web Audio API
            this.initAudioContext();
            
            // Crear sonidos usando osciladores y síntesis
            this.createSounds();
        }
        
        initAudioContext() {
            try {
                // Crear contexto de audio compatible con navegadores
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("Audio context initialized successfully");
            } catch (error) {
                console.warn("Web Audio API not supported:", error);
                this.soundEnabled = false;
            }
        }
        
        createSounds() {
            if (!this.audioContext || !this.soundEnabled) return;
            
            // Definir configuraciones de sonidos
            this.soundConfigs = {
                correct: {
                    type: 'success',
                    frequency: [523, 659, 784], // Do-Mi-Sol mayor
                    duration: 0.3,
                    volume: 0.4
                },
                incorrect: {
                    type: 'error', 
                    frequency: [196, 165], // Sol-Mi descendente
                    duration: 0.4,
                    volume: 0.3
                },
                tick: {
                    type: 'tick',
                    frequency: [800],
                    duration: 0.05,
                    volume: 0.15
                },
                victory: {
                    type: 'celebration',
                    frequency: [523, 659, 784, 1047], // Do-Mi-Sol-Do mayor
                    duration: 0.6,
                    volume: 0.5
                },
                defeat: {
                    type: 'sad',
                    frequency: [220, 196, 175], // La-Sol-Fa descendente
                    duration: 0.8,
                    volume: 0.4
                },
                timeout: {
                    type: 'warning',
                    frequency: [300, 250, 200], // Frecuencias descendentes
                    duration: 0.7,
                    volume: 0.4
                },
                gameStart: {
                    type: 'start',
                    frequency: [440, 554, 659], // La-Do#-Mi
                    duration: 0.4,
                    volume: 0.3
                }
            };
        }
        
        playSound(soundName, options = {}) {
            if (!this.audioContext || !this.soundEnabled || this.isMuted) return;
            
            const config = this.soundConfigs[soundName];
            if (!config) {
                console.warn(`Sound "${soundName}" not found`);
                return;
            }
            
            try {
                // Reanudar contexto si está suspendido
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                
                const { frequency, duration, volume: baseVolume } = config;
                const finalVolume = (baseVolume * this.volume * (options.volume || 1));
                
                // Crear osciladores para cada frecuencia
                frequency.forEach((freq, index) => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    // Configurar oscilador
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = this.getOscillatorType(config.type);
                    
                    // Configurar ganancia con envelope
                    const startTime = this.audioContext.currentTime + (index * 0.1);
                    const endTime = startTime + duration;
                    
                    gainNode.gain.setValueAtTime(0, startTime);
                    gainNode.gain.linearRampToValueAtTime(finalVolume, startTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
                    
                    // Conectar nodos
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    // Programar reproducción
                    oscillator.start(startTime);
                    oscillator.stop(endTime);
                });
                
            } catch (error) {
                console.error("Error playing sound:", error);
            }
        }
        
        getOscillatorType(soundType) {
            const types = {
                success: 'sine',
                error: 'triangle', 
                tick: 'square',
                celebration: 'sine',
                sad: 'sawtooth',
                warning: 'triangle',
                start: 'sine'
            };
            return types[soundType] || 'sine';
        }
        
        setVolume(newVolume) {
            this.volume = Math.max(0, Math.min(1, newVolume));
            this.saveSoundSettings();
        }
        
        toggleMute() {
            this.isMuted = !this.isMuted;
            this.saveSoundSettings();
        }
        
        saveSoundSettings() {
            const settings = {
                volume: this.volume,
                isMuted: this.isMuted
            };
            localStorage.setItem('crackRapidoSoundSettings', JSON.stringify(settings));
        }
        
        loadSoundSettings() {
            try {
                const settings = JSON.parse(localStorage.getItem('crackRapidoSoundSettings'));
                if (settings) {
                    this.volume = settings.volume !== undefined ? settings.volume : 0.7;
                    this.isMuted = settings.isMuted || false;
                }
            } catch (error) {
                console.warn("Error loading sound settings:", error);
            }
        }
        
        // Método de limpieza
        destroy() {
            if (this.audioContext) {
                this.audioContext.close();
            }
        }
    }
    
    // Crear instancia global del manager de sonido
    window.soundManager = new SoundManager();
    
    console.log("Sound system initialized for Crack Rápido");
    
    // ========================================= 
    // ======== FIN SISTEMA DE SONIDO ======== 
    // =========================================
    
    // ==================== FUNCIONES DE FIREBASE ====================
    
    // Función para obtener el nombre del jugador
    function getPlayerName() {
        try {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                return userData.displayName || userData.email?.split('@')[0] || 'Jugador Anónimo';
            }
        } catch (e) {
            console.log('No se pudo obtener usuario actual');
        }
        return 'Jugador Anónimo';
    }
    
    // Función para obtener el ID del usuario
    function getUserId() {
        try {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                return userData.uid || null;
            }
        } catch (e) {
            console.log('No se pudo obtener ID de usuario');
        }
        return null;
    }
    
    // Función para guardar la partida en Firebase
    async function saveGameToFirebase(gameData) {
        console.log('🔥 Guardando partida en Firebase...', gameData);
        
        const saveOperation = async () => {
            try {
                const matchRef = collection(db, 'matches');
                const docRef = await addDoc(matchRef, {
                    ...gameData,
                    timestamp: serverTimestamp()
                });
                console.log('✅ Partida guardada con ID:', docRef.id);
                return docRef;
            } catch (error) {
                console.error('❌ Error guardando partida:', error);
                throw error;
            }
        };
        
        const fallback = () => {
            console.log('⚠️ Firebase no disponible, partida no guardada');
        };
        
        return await safeFirestoreOperation(saveOperation, fallback);
    }
    
    // Función para actualizar estadísticas del jugador
    async function updatePlayerStats(gameData) {
        const userId = getUserId();
        if (!userId) {
            console.log('⚠️ Usuario no logueado, no se actualizan estadísticas');
            return;
        }
        
        console.log('📊 Actualizando estadísticas del jugador...');
        
        const updateOperation = async () => {
            try {
                const playerRef = doc(db, 'players', userId);
                const playerDoc = await getDoc(playerRef);
                
                if (playerDoc.exists()) {
                    // Actualizar estadísticas existentes
                    await updateDoc(playerRef, {
                        'crackRapido.totalGames': increment(1),
                        'crackRapido.totalScore': increment(gameData.score),
                        'crackRapido.totalCorrectAnswers': increment(gameData.correctAnswers),
                        'crackRapido.totalQuestions': increment(gameData.totalQuestions),
                        'crackRapido.completedGames': increment(gameData.completed ? 1 : 0),
                        'crackRapido.bestScore': gameData.score, // Firebase no tiene Math.max, lo manejamos en cliente
                        'crackRapido.bestAccuracy': gameData.accuracy,
                        'crackRapido.bestStreak': gameData.maxStreak,
                        'crackRapido.lastPlayed': serverTimestamp()
                    });
                } else {
                    // Crear nuevo documento de jugador
                    await setDoc(playerRef, {
                        playerName: gameData.playerName,
                        userId: userId,
                        crackRapido: {
                            totalGames: 1,
                            totalScore: gameData.score,
                            totalCorrectAnswers: gameData.correctAnswers,
                            totalQuestions: gameData.totalQuestions,
                            completedGames: gameData.completed ? 1 : 0,
                            bestScore: gameData.score,
                            bestAccuracy: gameData.accuracy,
                            bestStreak: gameData.maxStreak,
                            lastPlayed: serverTimestamp()
                        }
                    });
                }
                console.log('✅ Estadísticas del jugador actualizadas');
            } catch (error) {
                console.error('❌ Error actualizando estadísticas:', error);
                throw error;
            }
        };
        
        const fallback = () => {
            console.log('⚠️ Firebase no disponible, estadísticas no actualizadas');
        };
        
        await safeFirestoreOperation(updateOperation, fallback);
    }
    
    // Hacer funciones disponibles globalmente
    window.getPlayerName = getPlayerName;
    window.getUserId = getUserId;
    window.saveGameToFirebase = saveGameToFirebase;
    window.updatePlayerStats = updatePlayerStats;
    
    // ==================== FIN FUNCIONES DE FIREBASE ====================
});

console.log('📦 Crack Rápido Renovado cargado exitosamente');