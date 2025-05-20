const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const fs = require('fs'); // Added for file system operations
const path = require('path'); // Added for constructing file paths

// --- Constants ---
const MAX_LEVELS = 6;
const QUESTIONS_PER_LEVEL = 5; // Number of questions per level before advancing
const DATA_DIR = path.join(__dirname, 'data'); // Assuming 'data' folder is in the same directory as server.js

// --- Mentiroso Game Challenges (Placeholder) ---
let gameChallengesMentiroso = []; 
// --- End Mentiroso Game Challenges ---

// --- Server Setup ---
// We need an HTTP server primarily to handle the WebSocket upgrade requests.
const server = http.createServer((req, res) => {
    // Basic response for any HTTP request other than WebSocket upgrade
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running.');
});

// Obtener puerto de Render o usar 8081 por defecto
const PORT = process.env.PORT || 8081;

// Attach WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

server.listen(PORT, () => {
    console.log(`Servidor HTTP y WebSocket iniciado en el puerto ${PORT}...`);
    loadQuestions(); // Load questions for Quien Sabe Mas
    loadMentirosoChallenges(); // Load challenges for Mentiroso
});

// --- Game Data Loading ---
let allQuestions = {}; // Store questions globally { level: [processedQuestion, ...] }

function processRawQuestion(rawQ, level) {
    // Ensure basic structure exists based on level
    if (!rawQ || typeof rawQ.pregunta !== 'string' || typeof rawQ.respuesta_correcta !== 'string') {
        console.warn(`[L${level} - ERROR FORMATO BASICO] Pregunta saltada. Falta 'pregunta' o 'respuesta_correcta' como string. Pregunta: ${rawQ ? rawQ.pregunta : 'DESCONOCIDA'}`);
        return null;
    }

    let optionsArray = [];
    let correctIndex = -1;
    let correctAnswerText = '';
    const optionKeys = ['A', 'B', 'C', 'D'];

    // ALL LEVELS will now be processed this way:
    if (!rawQ.opciones || typeof rawQ.opciones !== 'object' || rawQ.opciones === null) { // Añadido chequeo de null
        console.warn(`[L${level} - ERROR OPCIONES] Pregunta saltada. Falta 'opciones' o no es un objeto. Pregunta: ${rawQ.pregunta}`);
        return null;
    }

    optionsArray = optionKeys.map(key => {
        const optionValue = rawQ.opciones[key];
        if (typeof optionValue !== 'string') {
            console.warn(`[L${level} - ERROR OPCION INDIVIDUAL] Opción '${key}' para la pregunta '${rawQ.pregunta}' no es un string. Valor: ${optionValue}`);
            return undefined; // Marcar como indefinido para filtrarlo luego
        }
        return optionValue;
    });

    // Filtrar opciones indefinidas y verificar que queden 4
    const validOptionsArray = optionsArray.filter(opt => opt !== undefined);
    if (validOptionsArray.length !== 4) {
        console.warn(`[L${level} - ERROR NUMERO OPCIONES] Pregunta saltada. No tiene exactamente 4 opciones de texto válidas después de procesar. Pregunta: ${rawQ.pregunta}. Opciones procesadas: [${validOptionsArray.join(', ')}]`);
        return null;
    }
    // Usar validOptionsArray para el resto de la lógica
    optionsArray = validOptionsArray;


    correctIndex = optionKeys.indexOf(rawQ.respuesta_correcta); // rawQ.respuesta_correcta MUST be 'A', 'B', 'C', or 'D'
    if (correctIndex === -1) {
        console.warn(`[L${level} - ERROR RESPUESTA] Clave de respuesta correcta inválida ('${rawQ.respuesta_correcta}') para P: ${rawQ.pregunta}. Debe ser A, B, C, o D.`);
        return null;
    }
    correctAnswerText = optionsArray[correctIndex];

    const normalizedCorrectAnswer = correctAnswerText.toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "");

    if (!normalizedCorrectAnswer) {
        console.warn(`[L${level} - ERROR TEXTO RESPUESTA] No se pudo determinar texto de respuesta válido para P: ${rawQ.pregunta}`);
        return null;
    }

    return {
        text: rawQ.pregunta,
        options: optionsArray,
        correctIndex: correctIndex,
        correctAnswerText: normalizedCorrectAnswer,
        level: level
    };
}

function loadQuestions() {
    console.log("===========================================");
    console.log("       CARGANDO PREGUNTAS - INICIO         ");
    console.log("===========================================");
    console.log(`Buscando preguntas en el directorio: ${DATA_DIR}...`);
    allQuestions = {};
    let totalLoadedOverall = 0;
    let totalProcessedOverall = 0;

    try {
        for (let level = 1; level <= MAX_LEVELS; level++) {
            console.log(`--- Cargando Nivel ${level} ---`);
            const filePath = path.join(DATA_DIR, `level_${level}.json`);
            let questionsForThisLevelProcessed = 0;
            let questionsForThisLevelValid = 0;

            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                let jsonData;
                try {
                    jsonData = JSON.parse(fileContent);
                } catch (parseError) {
                    console.error(`[NIVEL ${level}] ERROR FATAL: El archivo JSON está malformado y no se pudo parsear: ${filePath}. Error: ${parseError.message}`);
                    allQuestions[level] = [];
                    continue; // Saltar al siguiente nivel
                }
                
                if (jsonData && jsonData.preguntas && Array.isArray(jsonData.preguntas)) {
                    questionsForThisLevelProcessed = jsonData.preguntas.length;
                    totalProcessedOverall += questionsForThisLevelProcessed;

                    allQuestions[level] = jsonData.preguntas
                                            .map(q => processRawQuestion(q, level))
                                            .filter(q => q !== null);
                    questionsForThisLevelValid = allQuestions[level].length;
                    totalLoadedOverall += questionsForThisLevelValid;
                    
                    if (questionsForThisLevelProcessed === 0) {
                        console.warn(`[NIVEL ${level}] No se encontraron preguntas en el array 'preguntas' en ${filePath}.`);
                    } else if (questionsForThisLevelValid === 0 && questionsForThisLevelProcessed > 0) {
                        console.error(`[NIVEL ${level}] Se procesaron ${questionsForThisLevelProcessed} preguntas, pero NINGUNA fue válida. Revisa los logs de errores para este nivel.`);
                    } else {
                        console.log(`[NIVEL ${level}] Procesadas: ${questionsForThisLevelProcessed}, Válidas cargadas: ${questionsForThisLevelValid}.`);
                    }
                } else {
                    console.error(`[NIVEL ${level}] ERROR FORMATO: No se encontró el array 'preguntas' o el formato es incorrecto en ${filePath}.`);
                    allQuestions[level] = [];
                }
            } else {
                console.warn(`[NIVEL ${level}] ARCHIVO NO ENCONTRADO: ${filePath}`);
                allQuestions[level] = [];
            }
            console.log(`--- Fin Carga Nivel ${level} ---`);
        }
        console.log("===========================================");
        console.log("        CARGANDO PREGUNTAS - FIN           ");
        console.log(`Total de preguntas procesadas en todos los niveles: ${totalProcessedOverall}`);
        console.log(`Total de preguntas VÁLIDAS cargadas en todos los niveles: ${totalLoadedOverall}`);
        console.log("===========================================");
        if (totalLoadedOverall === 0 && totalProcessedOverall > 0) {
             console.error("CRITICO: Se procesaron preguntas, pero NINGUNA fue válida globalmente. El juego no funcionará.");
        } else if (totalLoadedOverall === 0) {
            console.error("CRITICO: No se cargaron preguntas válidas. El juego no puede funcionar.");
        }
    } catch (error) {
        console.error("ERROR GENERAL DURANTE LA CARGA DE PREGUNTAS:", error);
        allQuestions = {};
    }
}

// --- Mentiroso Challenge Loading Function (Placeholder) ---
function loadMentirosoChallenges() {
    console.log("Loading Mentiroso challenges...");
    gameChallengesMentiroso = [
        // --- List Challenges ---
        {
            id: "LC001",
            text_template: "Puedo nombrar X campeones de la Copa Libertadores (equipos).",
            type: 'list',
            category: "Copa Libertadores",
            data: {
                validation_list: ["independiente", "boca juniors", "penarol", "river plate", "estudiantes", "santos", "palmeiras", "gremio", "sao paulo", "flamengo", "nacional", "olimpia", "cruzeiro", "atletico nacional", "vasco da gama", "colo-colo", "liga de quito", "once caldas", "corinthians", "atletico mineiro", "san lorenzo", "racing club", "argentinos juniors", "velez sarsfield", "internacional", "fluminense"],
                time_limit_seconds: 60,
                answer_entity: "equipo" 
            },
            placeholder_details: {}
        },
        {
            id: "LP001",
            text_template: "Puedo nombrar X jugadores argentinos que hayan ganado el Balón de Oro.",
            type: 'list',
            category: "Premios Individuales",
            data: {
                validation_list: ["alfredo di stefano", "omar sivori", "lionel messi"],
                time_limit_seconds: 45,
                answer_entity: "jugador"
            },
            placeholder_details: {}
        },
        {
            id: "LE001",
            text_template: "Puedo nombrar X equipos ingleses que hayan ganado la Champions League.",
            type: 'list',
            category: "Champions League",
            data: {
                validation_list: ["manchester united", "liverpool", "chelsea", "nottingham forest", "aston villa", "manchester city", "arsenal", "leeds united", "tottenham hotspur"],
                time_limit_seconds: 50,
                answer_entity: "equipo"
            },
            placeholder_details: {}
        },
        {
            id: "LM001",
            text_template: "Puedo nombrar X selecciones que llegaron a la final del Mundial {mundial_year}.",
            type: 'list',
            category: "Mundiales",
            data: {
                get_validation_list: (details) => {
                    if (!details) return [];
                    if (details.mundial_year === "2002") return ["brasil", "alemania"];
                    if (details.mundial_year === "2014") return ["alemania", "argentina"];
                    if (details.mundial_year === "2022") return ["argentina", "francia"];
                    if (details.mundial_year === "1990") return ["alemania federal", "argentina"];
                    return [];
                },
                time_limit_seconds: 30,
                answer_entity: "seleccion"
            },
            placeholder_details: { mundial_year: () => ["2022", "2014", "2002", "1990"][Math.floor(Math.random() * 4)] }
        },
        {
            id: "LJ001",
            text_template: "Puedo nombrar X jugadores que hayan jugado tanto en River Plate como en Boca Juniors (Superclásico).",
            type: 'list',
            category: "Clubes Argentinos",
            data: {
                validation_list: [
                    "gabriel batistuta", "claudio caniggia", "oscar ruggeri", "julio cesar caceres", "nelson vivas", 
                    "ricardo gareca", "jonatan maidana", "lucas pratto", "juan jose lopez", "norberto alonso", 
                    "alberto tarantini", "hugo orlando gatti", "sergio berti", "fernando gamboa", "jorge higuain", 
                    "jose luis luna", "abel balbo", "sebastian rambert", "lucas castroman", "nelson cuevas",
                    "jesus mendez", "bruno urribarri", "jonathan fabbro", "nicolas bertolo", "milton casco", "lucas viatri", "facundo colidio"
                ],
                time_limit_seconds: 75,
                answer_entity: "jugador"
            },
            placeholder_details: {}
        },
        {
            id: "LG001",
            text_template: "Puedo nombrar X máximos goleadores históricos de la Selección Argentina.",
            type: 'list',
            category: "Selecciones Nacionales",
            data: {
                validation_list: ["lionel messi", "gabriel batistuta", "sergio aguero", "hernan crespo", "diego maradona", "gonzalo higuain", "angel di maria", "lautaro martinez", "leopoldo luque", "daniel passarella", "mario kempes", "jose sanfilippo", "luis artime", "herminio masantonio", "rene pontoni", "angel labruna"],
                time_limit_seconds: 60,
                answer_entity: "jugador"
            },
            placeholder_details: {}
        },
         {
            id: "LE002",
            text_template: "Puedo nombrar X equipos españoles que hayan ganado la Europa League (o Copa UEFA).",
            type: 'list',
            category: "Competiciones Europeas",
            data: {
                validation_list: ["sevilla", "atletico madrid", "real madrid", "valencia", "villarreal", "espanyol", "athletic club", "alaves", "celta de vigo", "malaga", "getafe"],
                time_limit_seconds: 50,
                answer_entity: "equipo"
            },
            placeholder_details: {}
        },
        {
            id: "LM002",
            text_template: "Puedo nombrar X países anfitriones de la Copa Mundial de la FIFA.",
            type: 'list',
            category: "Mundiales",
            data: {
                validation_list: ["uruguay", "italia", "francia", "brasil", "suiza", "suecia", "chile", "inglaterra", "mexico", "alemania", "argentina", "españa", "estados unidos", "corea del sur", "japon", "sudafrica", "rusia", "qatar", "canada", "alemania occidental", "alemania federal"],
                time_limit_seconds: 70,
                answer_entity: "país"
            },
            placeholder_details: {}
        },
        {
            id: "LC002",
            text_template: "Puedo nombrar X equipos que han ganado la Serie A de Italia.",
            type: 'list',
            category: "Ligas Europeas",
            data: {
                validation_list: ["juventus", "inter de milan", "ac milan", "genoa", "torino", "bologna", "pro vercelli", "roma", "napoli", "lazio", "fiorentina", "cagliari", "sampdoria", "hellas verona", "perugia", "udinese", "atalanta", "parma"],
                time_limit_seconds: 70,
                answer_entity: "equipo"
            },
            placeholder_details: {}
        },
        {
            id: "LC003",
            text_template: "Puedo nombrar X jugadores que hayan ganado el premio Puskás.",
            type: 'list',
            category: "Premios Individuales",
            data: {
                validation_list: ["cristiano ronaldo", "hamit altintop", "neymar", "miroslav stoch", "zlatan ibrahimovic", "james rodriguez", "wendell lira", "mohd faiz subri", "olivier giroud", "mohamed salah", "daniel zsori", "son heung-min", "erik lamela", "marcin oleksy", "alejandro garnacho", "nuno santos", "patrik schick", "mehdi taremi", "caroline weir"],
                time_limit_seconds: 60,
                answer_entity: "jugador"
            },
            placeholder_details: {}
        },
        {
            id: "LC004",
            text_template: "Puedo nombrar X estadios que fueron sedes de una final de Copa del Mundo (masculina).",
            type: 'list',
            category: "Mundiales",
            data: {
                validation_list: ["estadio centenario", "estadio nacional de italia pnf", "estadio olimpico yves-du-manoir", "estadio maracana", "wankdorfstadion", "rasundastadion", "estadio nacional de chile", "wembley stadium", "estadio azteca", "olympiastadion munich", "estadio monumental antonio vespucio liberti", "estadio santiago bernabeu", "stadio olimpico roma", "rose bowl", "stade de france", "estadio internacional de yokohama", "olympiastadion berlin", "soccer city", "estadio lusail", "parc des princes", "stadio san siro", "de kuip", "praterstadion", "heysel stadium", "camp nou", "la cartuja"],
                time_limit_seconds: 90,
                answer_entity: "estadio"
            },
            placeholder_details: {}
        },
        {
            id: "LC005",
            text_template: "Puedo nombrar X selecciones africanas que hayan jugado al menos una fase de cuartos de final en un Mundial (masculino).",
            type: 'list',
            category: "Mundiales",
            data: {
                validation_list: ["camerun", "senegal", "ghana", "marruecos"],
                time_limit_seconds: 45,
                answer_entity: "seleccion"
            },
            placeholder_details: {}
        },
        {
            id: "LDT001",
            text_template: "Puedo nombrar X directores técnicos que hayan ganado la Copa Libertadores.",
            type: 'list',
            category: "Directores Técnicos",
            data: {
                validation_list: ["carlos bianchi", "osvaldo zubeldia", "helenio herrera", "lula", "roberto scarone", "jose pastoriza", "telê santana", "marcelo gallardo", "luiz felipe scolari", "edgardo bauza", "reinaldo rueda", "tite", "jorge jesus", "abel ferreira", "juan carlos lorenzo", "nery pumpido", "alfio basile", "jose pekerman", "miguel angel russo", "ramon diaz", "gerardo martino"],
                time_limit_seconds: 80,
                answer_entity: "director técnico"
            },
            placeholder_details: {}
        },
        {
            id: "LCL002",
            text_template: "Puedo nombrar X clubes que hayan ganado la Bundesliga alemana (desde 1963).",
            type: 'list',
            category: "Ligas Europeas",
            data: {
                validation_list: ["bayern munich", "borussia dortmund", "borussia monchengladbach", "werder bremen", "hamburgo sv", "vfb stuttgart", "fc koln", "fc kaiserslautern", "eintracht braunschweig", "tsv 1860 munich", "fc nurnberg", "vfl wolfsburg", "bayer leverkusen", "schalke 04", "rb leipzig", "hertha bsc"],
                time_limit_seconds: 70,
                answer_entity: "club"
            },
            placeholder_details: {}
        },
        {
            id: "LC006",
            text_template: "Puedo nombrar X jugadores que hayan marcado un hat-trick en una final de la Champions League (o Copa de Europa).",
            type: 'list',
            category: "Champions League",
            data: {
                validation_list: ["ferenc puskas", "pierino prati"], 
                time_limit_seconds: 50,
                answer_entity: "jugador"
            },
            placeholder_details: {}
        },
        {
            id: "LC007",
            text_template: "Puedo nombrar X equipos ingleses que hayan llegado a la final de la Europa League (o Copa UEFA).",
            type: 'list',
            category: "Competiciones Europeas",
            data: {
                validation_list: ["liverpool", "tottenham hotspur", "ipswich town", "wolverhampton wanderers", "arsenal", "middlesbrough", "fulham", "chelsea", "manchester united"],
                time_limit_seconds: 75,
                answer_entity: "equipo"
            },
            placeholder_details: {}
        },
        {
            id: "LC008",
            text_template: "Puedo nombrar X jugadores brasileños que hayan ganado el Balón de Oro.",
            type: 'list',
            category: "Premios Individuales",
            data: {
                validation_list: ["ronaldo", "rivaldo", "ronaldinho", "kaka"],
                time_limit_seconds: 45,
                answer_entity: "jugador"
            },
            placeholder_details: {}
        },
        {
            id: "LC009",
            text_template: "Puedo nombrar X selecciones que hayan ganado la Copa Africana de Naciones.",
            type: 'list',
            category: "Competiciones Internacionales",
            data: {
                validation_list: ["egipto", "camerun", "ghana", "nigeria", "costa de marfil", "argelia", "rd congo", "zambia", "tunez", "sudan", "etiopia", "marruecos", "sudafrica", "congo", "senegal", "mali", "burkina faso", "guinea", "uganda", "togo"],
                time_limit_seconds: 80,
                answer_entity: "seleccion"
            },
            placeholder_details: {}
        },
        {
            id: "LC010",
            text_template: "Puedo nombrar X ciudades que han tenido dos o más equipos diferentes campeones de la Champions League/Copa de Europa.",
            type: 'list',
            category: "Champions League",
            data: {
                validation_list: ["milano"], 
                time_limit_seconds: 40,
                answer_entity: "ciudad"
            },
            placeholder_details: {}
        },
        {
            id: "LFP001", 
            text_template: "Puedo nombrar X futbolistas que hayan sido máximos goleadores de la Premier League en al menos una temporada.",
            type: 'list',
            category: "Ligas Europeas",
            data: {
                validation_list: ["alan shearer", "teddy sheringham", "andy cole", "chris sutton", "robbie fowler", "dion dublin", "michael owen", "jimmy floyd hasselbaink", "dwight yorke", "kevin phillips", "thierry henry", "ruud van nistelrooy", "didier drogba", "cristiano ronaldo", "nicolas anelka", "carlos tevez", "dimitar berbatov", "robin van persie", "luis suarez", "sergio aguero", "harry kane", "mohamed salah", "pierre-emerick aubameyang", "sadio mane", "jamie vardy", "son heung-min", "erling haaland", "mark viduka", "james beattie", "marcus stewart", "les ferdinand", "ian wright", "ole gunnar solskjaer", "eidur gudjohnsen", "yakubu aiyegbeni", "emmanuel adebayor", "fernando torres", "darren bent"],
                time_limit_seconds: 120,
                answer_entity: "futbolista"
            },
            placeholder_details: {}
        },
        // --- Structured Challenges ---
        {
            id: "SCM001",
            text_template: "Puedo responder correctamente X preguntas sobre Diego Maradona.",
            type: 'structured',
            category: "Jugadores Legendarios",
            data: {
                questions: [
                    { q_id:"scm001_1", text: "¿Maradona ganó un Mundial Juvenil con Argentina?", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"scm001_2", text: "¿En qué equipo europeo es más ídolo Maradona?", type: "MC", options: ["Barcelona", "Napoli", "Sevilla", "Boca Juniors"], correctAnswer: "Napoli" },
                    { q_id:"scm001_3", text: "Maradona fue entrenador de la Selección Argentina en el Mundial 2014.", type: "VF", correctAnswer: "falso" }, 
                    { q_id:"scm001_4", text: "¿Cuál de estos apodos NO era de Maradona?", type: "MC", options: ["El Pibe de Oro", "Barrilete Cósmico", "D10S", "El Príncipe"], correctAnswer: "El Príncipe" } 
                ],
                time_limit_seconds_per_question: 20, 
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCL001",
            text_template: "Puedo responder X preguntas sobre la Champions League.",
            type: 'structured',
            category: "Competiciones Europeas",
            data: {
                questions: [
                    { q_id:"scl001_1", text: "El Real Madrid ha ganado más de 10 Champions Leagues.", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"scl001_2", text: "¿Qué equipo ganó la primera edición de la Champions League (Copa de Europa)?", type: "MC", options: ["AC Milan", "Real Madrid", "Benfica", "Manchester United"], correctAnswer: "Real Madrid" },
                    { q_id:"scl001_3", text: "Un equipo inglés nunca ha ganado la Champions League invicto.", type: "VF", correctAnswer: "falso" }, 
                    { q_id:"scl001_4", text: "¿Cuál de estos jugadores NO ha ganado la Champions League 5 veces o más?", type: "MC", options: ["Cristiano Ronaldo", "Paolo Maldini", "Lionel Messi", "Zlatan Ibrahimovic"], correctAnswer: "Zlatan Ibrahimovic" }
                ],
                time_limit_seconds_per_question: 25,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCA001",
            text_template: "Puedo responder X preguntas sobre la Copa América.",
            type: 'structured',
            category: "Selecciones Nacionales",
            data: {
                questions: [
                    { q_id:"sca001_1", text: "Argentina y Uruguay son las selecciones con más Copas América ganadas.", type: "VF", correctAnswer: "verdadero"},
                    { q_id:"sca001_2", text: "¿Qué selección ganó la Copa América Centenario en 2016?", type: "MC", options: ["Argentina", "Brasil", "Chile", "Colombia"], correctAnswer: "Chile" },
                    { q_id:"sca001_3", text: "Brasil nunca ha ganado la Copa América jugando de local.", type: "VF", correctAnswer: "falso" },
                    { q_id:"sca001_4", text: "La Copa América 2021 se jugó principalmente en Colombia.", type:"VF", correctAnswer: "falso"}
                ],
                time_limit_seconds_per_question: 20,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCR001",
            text_template: "Puedo responder X preguntas sobre reglas básicas del fútbol.",
            type: 'structured',
            category: "Reglas del Fútbol",
            data: {
                questions: [
                    { q_id:"scr001_1", text: "Un saque de banda debe realizarse con ambas manos y por encima de la cabeza.", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"scr001_2", text: "¿Cuántos jugadores como máximo pueden estar en el campo por equipo durante un partido oficial?", type: "MC", options: ["10", "11", "12", "9"], correctAnswer: "11" },
                    { q_id:"scr001_3", text: "Un jugador está en fuera de juego si se encuentra más cerca de la línea de meta contraria que el balón y el penúltimo adversario, en el momento que el balón le es jugado por un compañero.", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"scr001_4", text: "¿Desde qué distancia se patea un penal estándar?", type: "MC", options: ["9 metros", "10 metros", "11 metros", "12 metros"], correctAnswer: "11 metros" },
                    { q_id:"scr001_5", text: "Una tarjeta amarilla significa expulsión inmediata.", type: "VF", correctAnswer: "falso" }
                ],
                time_limit_seconds_per_question: 20,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCP001",
            text_template: "Puedo responder X preguntas sobre Pelé.",
            type: 'structured',
            category: "Jugadores Legendarios",
            data: {
                questions: [
                    { q_id:"scp001_1", text: "¿Pelé ganó 3 Copas del Mundo con Brasil?", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"scp001_2", text: "¿En qué club brasileño jugó Pelé la mayor parte de su carrera?", type: "MC", options: ["Flamengo", "Corinthians", "Santos", "Palmeiras"], correctAnswer: "Santos" },
                    { q_id:"scp001_3", text: "Pelé nunca jugó en un equipo fuera de Brasil.", type: "VF", correctAnswer: "falso" }, 
                    { q_id:"scp001_4", text: "¿Cuál de estos apodos NO se asocia comúnmente con Pelé?", type: "MC", options: ["O Rei", "La Perla Negra", "El Fenómeno", "Gaspar"], correctAnswer: "El Fenómeno" } 
                ],
                time_limit_seconds_per_question: 25,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCWC01",
            text_template: "Puedo responder X preguntas sobre la Copa Mundial de la FIFA 1986.",
            type: 'structured',
            category: "Mundiales",
            data: {
                questions: [
                    { q_id:"scwc01_1", text: "Argentina ganó el Mundial de 1986.", type: "VF", correctAnswer: "verdadero"},
                    { q_id:"scwc01_2", text: "¿Qué jugador fue la gran figura de Argentina en ese Mundial?", type: "MC", options: ["Mario Kempes", "Daniel Passarella", "Jorge Valdano", "Diego Maradona"], correctAnswer: "Diego Maradona" },
                    { q_id:"scwc01_3", text: "El famoso gol conocido como 'La Mano de Dios' ocurrió en un partido contra Italia.", type: "VF", correctAnswer: "falso"}, 
                    { q_id:"scwc01_4", text: "¿Qué país fue el anfitrión del Mundial 1986?", type: "MC", options: ["Colombia", "México", "Estados Unidos", "España"], correctAnswer: "México"}
                ],
                time_limit_seconds_per_question: 20,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCCRUYFF01",
            text_template: "Puedo responder X preguntas sobre Johan Cruyff.",
            type: 'structured',
            category: "Jugadores Legendarios",
            data: {
                questions: [
                    { q_id:"sccruyff01_1", text: "Johan Cruyff ganó la Copa del Mundo con Holanda como jugador.", type: "VF", correctAnswer: "falso" },
                    { q_id:"sccruyff01_2", text: "¿Con qué club ganó Cruyff tres Copas de Europa consecutivas como jugador?", type: "MC", options: ["Barcelona", "Ajax", "Feyenoord", "Real Madrid"], correctAnswer: "Ajax" },
                    { q_id:"sccruyff01_3", text: "Cruyff fue el principal exponente del 'Fútbol Total'.", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"sccruyff01_4", text: "Como entrenador, Cruyff dirigió al famoso 'Dream Team' de qué club?", type: "MC", options: ["Ajax", "PSV Eindhoven", "Barcelona", "Valencia"], correctAnswer: "Barcelona" }
                ],
                time_limit_seconds_per_question: 25,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCEURO01",
            text_template: "Puedo responder X preguntas sobre la Eurocopa (Campeonato Europeo de la UEFA).",
            type: 'structured',
            category: "Competiciones Internacionales",
            data: {
                questions: [
                    { q_id:"sceuro01_1", text: "Alemania y España son las selecciones con más Eurocopas ganadas.", type: "VF", correctAnswer: "verdadero"},
                    { q_id:"sceuro01_2", text: "¿Qué selección ganó la Eurocopa 2004 de forma sorpresiva?", type: "MC", options: ["Portugal", "Grecia", "República Checa", "Holanda"], correctAnswer: "Grecia" },
                    { q_id:"sceuro01_3", text: "La Eurocopa se juega cada 2 años.", type: "VF", correctAnswer: "falso"}, 
                    { q_id:"sceuro01_4", text: "¿En qué año se jugó la primera Eurocopa?", type: "MC", options: ["1956", "1960", "1964", "1968"], correctAnswer: "1960"}
                ],
                time_limit_seconds_per_question: 20,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCWCIT90",
            text_template: "Puedo responder X preguntas sobre la Copa Mundial de la FIFA Italia 1990.",
            type: 'structured',
            category: "Mundiales",
            data: {
                questions: [
                    { q_id:"scwcit90_1", text: "Alemania Federal ganó el Mundial de 1990.", type: "VF", correctAnswer: "verdadero"},
                    { q_id:"scwcit90_2", text: "¿Contra qué selección jugó Alemania Federal la final?", type: "MC", options: ["Italia", "Inglaterra", "Argentina", "Brasil"], correctAnswer: "Argentina" },
                    { q_id:"scwcit90_3", text: "Roger Milla, delantero de Camerún, fue el jugador más viejo en marcar un gol en ese mundial.", type: "VF", correctAnswer: "verdadero"},
                    { q_id:"scwcit90_4", text: "¿Cuál fue la mascota oficial de Italia '90?", type: "MC", options: ["Naranjito", "Pique", "Ciao", "Footix"], correctAnswer: "Ciao"},
                    { q_id:"scwcit90_5", text: "El goleador del torneo fue Salvatore Schillaci de Italia.", type: "VF", correctAnswer: "verdadero"}
                ],
                time_limit_seconds_per_question: 22,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCVAR01",
            text_template: "Puedo responder X preguntas sobre el VAR (Video Assistant Referee).",
            type: 'structured',
            category: "Reglas del Fútbol",
            data: {
                questions: [
                    { q_id:"scvar01_1", text: "El VAR puede intervenir en cualquier decisión arbitral durante el partido.", type: "VF", correctAnswer: "falso" }, 
                    { q_id:"scvar01_2", text: "¿En cuál de estas situaciones NO suele intervenir el VAR?", type: "MC", options: ["Goles", "Penales", "Tarjetas rojas directas", "Saques de banda"], correctAnswer: "Saques de banda" },
                    { q_id:"scvar01_3", text: "La decisión final después de una revisión del VAR siempre la toma el árbitro principal en el campo.", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"scvar01_4", text: "El VAR se utilizó oficialmente por primera vez en una Copa del Mundo en 2014.", type: "VF", correctAnswer: "falso" } 
                ],
                time_limit_seconds_per_question: 25,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCACM01",
            text_template: "Puedo responder X preguntas sobre la historia del AC Milan.",
            type: 'structured',
            category: "Clubes Históricos",
            data: {
                questions: [
                    { q_id:"scacm01_1", text: "El AC Milan ha ganado más Champions Leagues que cualquier otro equipo italiano.", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"scacm01_2", text: "¿Cuál es el apodo principal del AC Milan?", type: "MC", options: ["I Nerazzurri", "I Rossoneri", "I Bianconeri", "I Giallorossi"], correctAnswer: "I Rossoneri" },
                    { q_id:"scacm01_3", text: "Paolo Maldini jugó toda su carrera profesional en el AC Milan.", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"scacm01_4", text: "El AC Milan comparte su estadio, San Siro, con la Juventus.", type: "VF", correctAnswer: "falso" } 
                ],
                time_limit_seconds_per_question: 20,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        },
        {
            id: "SCFWC01", 
            text_template: "Puedo responder X preguntas sobre la Copa Mundial Femenina de la FIFA.",
            type: 'structured',
            category: "Fútbol Femenino",
            data: {
                questions: [
                    { q_id:"scfwc01_1", text: "Estados Unidos es la selección con más Copas Mundiales Femeninas ganadas.", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"scfwc01_2", text: "¿En qué año se celebró la primera Copa Mundial Femenina oficial de la FIFA?", type: "MC", options: ["1987", "1991", "1995", "1999"], correctAnswer: "1991" },
                    { q_id:"scfwc01_3", text: "Marta Vieira da Silva (Brasil) es la máxima goleadora histórica de los Mundiales Femeninos.", type: "VF", correctAnswer: "verdadero" },
                    { q_id:"scfwc01_4", text: "Ninguna selección europea ha ganado la Copa Mundial Femenina más de una vez.", type: "VF", correctAnswer: "falso" } 
                ],
                time_limit_seconds_per_question: 25,
                answer_entity: "pregunta"
            },
            placeholder_details: {}
        }
    ];

    if (gameChallengesMentiroso.length > 0) {
        console.log(`Loaded ${gameChallengesMentiroso.length} Mentiroso challenges.`);
    } else {
        console.warn("No Mentiroso challenges loaded. Mentiroso game might not function correctly.");
    }
}
// --- End Mentiroso Challenge Loading ---

// --- Game State Management ---
const clients = new Map(); // Map<WebSocket, {id: string, roomId: string | null}>
const rooms = new Map(); // Map<string, Room>
// interface Room {
//     roomId: string;
//     players: { player1: Player | null, player2: Player | null };
//     password?: string;
//     gameActive: boolean;
//     spectators: WebSocket[]; // Optional
//     // Game state added:
//     currentTurn: string | null; // Player ID of the current turn
//     currentLevel: number;
//     questionsAnsweredInLevel: number;
//     usedQuestionIndices: { [level: number]: number[] }; // Tracks indices used per level
//     currentQuestion: any | null; // The question object currently active
//     optionsSent: boolean; // Track if options were sent for current level > 1 question
//     fiftyFiftyUsed: boolean; // Track if 50/50 was used for current question turn
//     questionsPerLevel: number; // Config stored per room
// }
// interface Player {
//     id: string;
//     name: string;
//     ws: WebSocket;
//     score: number;
// }

// --- Helper Functions ---
function generateUniqueId() {
    return Math.random().toString(36).substring(2, 9);
}

function generateRoomId() {
    let newId;
    do {
        newId = Math.floor(1000 + Math.random() * 9000).toString();
    } while (rooms.has(newId));
    return newId;
}

// NEW FUNCTION: Broadcast available rooms to lobby clients
function broadcastAvailableRooms() {
    console.log('--- Broadcasting Available Rooms ---');
    const availableRoomsList = [];
    for (const [roomId, room] of rooms.entries()) {
        // Criteria: Not active, waiting for player 2
        if (!room.gameActive && room.players.player1 && !room.players.player2) { // NEW CRITERIA: list all non-active rooms with 1 player
            console.log(`Room ${roomId} is available (Player: ${room.players.player1.name}, Password: ${room.password ? 'Yes' : 'No'}, Type: ${room.gameType || 'default'})`);
            availableRoomsList.push({
                id: roomId,
                playerCount: 1, // Always 1 if it meets criteria
                maxPlayers: 2,
                requiresPassword: !!room.password, // True if room.password is a non-empty string
                // Optionally add creator's name if needed by client UI
                 creatorName: room.players.player1.name,
                 gameType: room.gameType || 'quiensabemas' // Default to quiensabemas if not specified
            });
        }
    }

    const message = {
        type: 'availableRooms',
        payload: { rooms: availableRoomsList }
    };
    const messageString = JSON.stringify(message);
    let lobbyCount = 0;

    // Send to clients in the lobby (roomId is null)
    clients.forEach((clientInfo, ws) => {
        if (clientInfo.roomId === null && ws.readyState === WebSocket.OPEN) {
            ws.send(messageString);
            lobbyCount++;
        }
    });
    console.log(`Sent available rooms list to ${lobbyCount} client(s) in lobby.`);
    console.log('--- Finished Broadcasting Rooms ---');
}

// Broadcast to everyone IN THE ROOM (players and spectators)
function broadcastToRoom(roomId, message, senderWs = null) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageString = JSON.stringify(message);
    // console.log(`Broadcasting to room ${roomId}:`, messageString); // Verbose

    const players = [room.players.player1, room.players.player2].filter(p => p);
    players.forEach(player => {
        // Ensure player.ws exists before checking readyState
        if (player && player.ws && player.ws !== senderWs && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(messageString);
        }
    });
    if (room.spectators) { // Check if spectators array exists
    room.spectators.forEach(spectatorWs => {
         if (spectatorWs !== senderWs && spectatorWs.readyState === WebSocket.OPEN) {
             spectatorWs.send(messageString);
         }
    });
    }
}

// Send message safely to a specific WebSocket client
function safeSend(ws, message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        // console.warn("Attempted to send message to a closed or invalid WebSocket."); // Can be noisy
    }
}

// --- WebSocket Event Handlers ---
wss.on('connection', (ws, req) => {
    const clientId = generateUniqueId();
    clients.set(ws, { id: clientId, roomId: null });
    console.log(`Client connected: ${clientId} (Total: ${clients.size})`);
    safeSend(ws, { type: 'yourInfo', payload: { playerId: clientId } });
    // Send available rooms to the new client
    broadcastAvailableRooms();

    ws.on('message', (message) => {
        let parsedMessage;
        try {
            // Limit message size to prevent abuse
             const messageString = message.toString(); // Ensure it's a string
            if (messageString.length > 4096) {
                console.warn(`Message too long from ${clientId}. Closing connection.`);
                ws.terminate();
                return;
            }
            parsedMessage = JSON.parse(messageString);
            // console.log(`Received from ${clientId}:`, parsedMessage); // Less verbose logging
            handleClientMessage(ws, parsedMessage);
        } catch (error) {
            console.error(`Failed to parse message or handle: ${message}`, error);
            safeSend(ws, { type: 'errorMessage', payload: { error: 'Invalid message format.' } });
        }
    });

    ws.on('close', () => {
        const clientInfo = clients.get(ws);
        if (clientInfo) {
            console.log(`Client disconnected: ${clientInfo.id}`);
            handleDisconnect(ws, clientInfo.id, clientInfo.roomId);
            clients.delete(ws);
            console.log(`Client removed. Total clients: ${clients.size}`);
        } else {
            // console.log('Unknown client disconnected.'); // Less verbose
        }
    });

    ws.on('error', (error) => {
        const clientInfo = clients.get(ws);
        const clientId = clientInfo ? clientInfo.id : 'unknown';
        console.error(`WebSocket error for client ${clientId}:`, error);
        // Attempt graceful disconnect and cleanup if possible
        if (clientInfo) {
            handleDisconnect(ws, clientInfo.id, clientInfo.roomId); // Try cleanup
            clients.delete(ws);
            console.log(`Client removed after error. Total clients: ${clients.size}`);
        }
        // Terminate the connection if it's still open
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
             ws.terminate();
        }
    });
});

// --- Message Routing ---
function handleClientMessage(ws, message) {
    const clientInfo = clients.get(ws);
    if (!clientInfo) { return; } // Should not happen if client is connected

    // Log message type and player ID for debugging
    // console.log(`Handling message type: ${message.type} from player ${clientInfo.id}`);

    switch (message.type) {
        case 'createRoom':
            handleCreateRoom(ws, clientInfo, message.payload);
            break;
        case 'joinRoom':
            handleJoinRoom(ws, clientInfo, message.payload);
            break;
        case 'joinRandomRoom':
             handleJoinRandomRoom(ws, clientInfo, message.payload);
             break;
        case 'leaveRoom': // Added leave room handler
            handleLeaveRoom(ws, clientInfo);
            break;
        // --- Game Actions (Quien Sabe Mas) ---
        case 'submitAnswer':
             handleSubmitAnswer(ws, clientInfo, message.payload);
             break;
        case 'requestOptions':
            handleRequestOptions(ws, clientInfo);
             break;
        case 'requestFiftyFifty':
            handleRequestFiftyFifty(ws, clientInfo);
             break;
        // --- Mentiroso Game Actions ---
        case 'createMentirosoRoom':
            handleCreateMentirosoRoom(ws, clientInfo, message.payload);
            break;
        case 'joinMentirosoRoom':
            handleJoinMentirosoRoom(ws, clientInfo, message.payload);
            break;
        case 'mentirosoDeclare':
            handleMentirosoDeclare(ws, clientInfo, message.payload);
            break;
        case 'mentirosoCallLiar':
            handleMentirosoCallLiar(ws, clientInfo, message.payload);
            break;
        case 'mentirosoSubmitDemonstration':
            handleMentirosoSubmitDemonstration(ws, clientInfo, message.payload);
            break;
        case 'mentirosoSubmitValidation':
            handleMentirosoSubmitValidation(ws, clientInfo, message.payload);
            break;
        default:
            console.warn(`Unknown message type received from ${clientInfo.id}: ${message.type}`);
            safeSend(ws, { type: 'errorMessage', payload: { error: `Unknown message type: ${message.type}` } });
    }
}

// --- Handler Implementations ---

function handleCreateRoom(ws, clientInfo, payload) {
    if (clientInfo.roomId) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Ya estás en una sala.' } });
        return;
    }
    const roomId = generateRoomId();
    const playerName = payload.playerName || `Jugador_${clientInfo.id.substring(0, 4)}`;
    const password = payload.password || ''; // Empty string if no password

    const player1 = {
        id: clientInfo.id,
        name: playerName,
        ws: ws,
        score: 0
    };

    const newRoom = {
        roomId: roomId,
        gameType: 'quiensabemas', // Explicitly set gameType
        players: { player1: player1, player2: null },
        password: password,
        gameActive: false,
        spectators: [],
        // Game state initialization (will be properly set in startGame)
        currentTurn: null,
        currentLevel: 1,
        questionsAnsweredInLevel: 0,
        usedQuestionIndices: {},
        currentQuestion: null,
        optionsSent: false,
        fiftyFiftyUsed: false,
        questionsPerLevel: QUESTIONS_PER_LEVEL // Store config per room
    };

    rooms.set(roomId, newRoom);
    clientInfo.roomId = roomId; // Update client's state

    console.log(`Room ${roomId} created by ${playerName} (${clientInfo.id}). Password: ${password ? 'Yes' : 'No'}`);
    safeSend(ws, { type: 'roomCreated', payload: { roomId: roomId } });

    // Broadcast updated room list to lobby
    broadcastAvailableRooms();
}

function handleJoinRoom(ws, clientInfo, payload) {
    if (clientInfo.roomId) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Ya estás en una sala.' } });
        return;
    }
    // Ensure payload exists before destructuring
    if (!payload) {
         safeSend(ws, { type: 'joinError', payload: { error: 'Invalid join request.' } });
        return;
    }
    const { roomId, password, playerName } = payload;
     if (!roomId) {
         safeSend(ws, { type: 'joinError', payload: { error: 'Room ID is required.' } });
         return;
     }
    const room = rooms.get(roomId);

    if (!room) {
        safeSend(ws, { type: 'joinError', payload: { error: `La sala ${roomId} no existe.` } });
        return;
    }

    // Check password
    if (room.password && room.password !== password) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Contraseña incorrecta.' } });
        return;
    }

    // Check if room is full
    if (room.players.player1 && room.players.player2) {
        safeSend(ws, { type: 'joinError', payload: { error: 'La sala ya está llena.' } });
        return;
    }

    // Ensure player1 exists before proceeding
    if (!room.players.player1) {
        console.error(`Room ${roomId} has no player 1, cannot join.`);
        safeSend(ws, { type: 'joinError', payload: { error: 'Error interno de la sala.' } });
        return;
    }


    // Add player 2
    const player2 = {
        id: clientInfo.id,
        name: playerName || `Jugador_${clientInfo.id.substring(0, 4)}`,
        ws: ws,
        score: 0
    };
    room.players.player2 = player2;
    clientInfo.roomId = roomId; // Update client's state

    console.log(`${player2.name} (${clientInfo.id}) joined room ${roomId}`);

    // Notify both players they are joined and prepare for game start
    const playersInfo = {
        player1: { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score },
        player2: { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score }
    };

    // Send join success specifically to the joining player (player 2)
    safeSend(ws, { type: 'joinSuccess', payload: { roomId: roomId, players: playersInfo } });

    // Notify player 1 that player 2 joined
    safeSend(room.players.player1.ws, { type: 'playerJoined', payload: { players: playersInfo } });

    // Start the game now that both players are in
    startGame(roomId);

    // Broadcast updated room list (room is now full or private, so might disappear from public list)
    broadcastAvailableRooms();
}

function handleJoinRandomRoom(ws, clientInfo, payload) {
    if (clientInfo.roomId) {
        safeSend(ws, { type: 'randomJoinError', payload: { error: 'Ya estás en una sala.' } });
        return;
    }

    let availableRoomId = null;
    // Find a public room with exactly one player
    for (const [roomId, room] of rooms.entries()) {
        if (!room.password && room.players.player1 && !room.players.player2 && !room.gameActive) {
             // Ensure the only player isn't the one trying to join
             if (room.players.player1.id !== clientInfo.id) {
                // Check gameType if provided in payload, otherwise join any
                if (payload && payload.gameType && room.gameType !== payload.gameType) {
                    continue; // Skip if game types don't match
                }
                availableRoomId = roomId;
                break;
            }
        }
    }

    if (availableRoomId) {
        // Join the found room
        console.log(`Found random room ${availableRoomId} for ${clientInfo.id}`);
         handleJoinRoom(ws, clientInfo, {
            roomId: availableRoomId,
            password: '', // Public room, no password
            playerName: payload ? payload.playerName : undefined, // Handle potential missing payload
            // gameType is implicitly handled by the room found
        });
    } else {
        // No room found, maybe create a new public room instead?
        const targetGameType = (payload && payload.gameType) || 'quiensabemas'; // Default to QSM if not specified
        console.log(`No random ${targetGameType} room found for ${clientInfo.id}. Creating new public ${targetGameType} room.`);
        if (targetGameType === 'mentiroso') {
            handleCreateMentirosoRoom(ws, clientInfo, { playerName: payload ? payload.playerName : undefined, password: '' });
        } else {
            handleCreateRoom(ws, clientInfo, { playerName: payload ? payload.playerName : undefined, password: '' });
        }
    }
}

function handleLeaveRoom(ws, clientInfo) {
    const roomId = clientInfo.roomId;
    if (!roomId) {
        // safeSend(ws, { type: 'errorMessage', payload: { error: 'You are not in a room.' } });
        return; // Not in a room, nothing to leave
    }

    const room = rooms.get(roomId);
    if (!room) {
        console.warn(`Client ${clientInfo.id} tried to leave non-existent room ${roomId}`);
        clientInfo.roomId = null; // Correct client state anyway
        return;
    }

    console.log(`Player ${clientInfo.id} is leaving room ${roomId}`);
    const leavingPlayerId = clientInfo.id;
    let remainingPlayer = null;
    let leavingPlayerName = 'Opponent';

    // Remove player from room and get their name
    if (room.players.player1 && room.players.player1.id === leavingPlayerId) {
        leavingPlayerName = room.players.player1.name;
        remainingPlayer = room.players.player2;
        room.players.player1 = null;
    } else if (room.players.player2 && room.players.player2.id === leavingPlayerId) {
        leavingPlayerName = room.players.player2.name;
        remainingPlayer = room.players.player1;
        room.players.player2 = null;
    }

    // Update client state (must happen after checking room)
    clientInfo.roomId = null;

    // Check room status
    if (!room.players.player1 && !room.players.player2) {
        // Room is empty, delete it
        console.log(`Room ${roomId} is empty, deleting.`);
        rooms.delete(roomId);
    } else if (remainingPlayer && room.gameActive) {
        // Game was active, opponent left, remaining player wins
        console.log(`Game in room ${roomId} ended due to player ${leavingPlayerId} leaving.`);
        // Use the name we captured before setting the player to null
        endGame(roomId, `${leavingPlayerName} left the game.`);
        // Notify the remaining player
        safeSend(remainingPlayer.ws, {
            type: 'gameOver',
            payload: {
                reason: `${leavingPlayerName} left the game.`, // Use a generic payload, endGame handles details
                 winnerId: remainingPlayer.id // Indicate winner explicitly
            }
        });
        // Room might persist until the winner leaves or manually removed
        room.gameActive = false; // Mark game as inactive
    } else if (remainingPlayer) {
        // Game wasn't active (lobby), just notify remaining player opponent left
        safeSend(remainingPlayer.ws, {
            type: 'opponentLeftLobby',
            payload: { message: `${leavingPlayerName} has left the lobby.` }
         });
    }

    // Broadcast updated room list (room might become available or be deleted)
    broadcastAvailableRooms();
}

// --- Game Logic Handlers ---

function startGame(roomId) {
    const room = rooms.get(roomId);
    // Add rigorous checks
    if (!room) {
         console.error(`startGame called for non-existent room: ${roomId}`);
         return;
     }
    if (!room.players.player1 || !room.players.player2) {
        console.error(`Cannot start game in room ${roomId}: Missing players. P1:${!!room.players.player1}, P2:${!!room.players.player2}`);
        // Maybe notify players if possible?
        return;
    }
     if (room.gameActive) {
         console.warn(`startGame called for already active room: ${roomId}`);
         return; // Prevent restarting an active game
     }

    console.log(`Starting game in room ${roomId}...`);

    // Initialize game state
    room.gameActive = true;
    room.currentLevel = 1;
    room.questionsAnsweredInLevel = 0;
    room.usedQuestionIndices = {}; // Reset used questions for new game
    for (let l = 1; l <= MAX_LEVELS; l++) { // Initialize for all potential levels
        room.usedQuestionIndices[l] = [];
    }
    room.currentQuestion = null;
    room.players.player1.score = 0; // Reset scores
    room.players.player2.score = 0;
    room.optionsSent = false;
    room.fiftyFiftyUsed = false;

    // Randomly select starting player
    room.currentTurn = Math.random() < 0.5 ? room.players.player1.id : room.players.player2.id;
    // console.log(`Room ${roomId} - Game state initialized. Starting turn: ${room.currentTurn}`); // Less verbose

    const playersInfo = {
        player1: { id: room.players.player1.id, name: room.players.player1.name, score: 0 },
        player2: { id: room.players.player2.id, name: room.players.player2.name, score: 0 }
    };

    // Send gameStart message to both players
    const startMessage = { type: 'gameStart', payload: { players: playersInfo, startingPlayerId: room.currentTurn } };
    // console.log(`Room ${roomId} - Sending gameStart message...`); // Less verbose
    safeSend(room.players.player1.ws, startMessage);
    safeSend(room.players.player2.ws, startMessage);
    // console.log(`Room ${roomId} - gameStart message sent.`); // Less verbose

    // Send the first question immediately
    // console.log(`Room ${roomId} - Calling sendNextQuestion for the first time...`); // Less verbose
    // Add a small delay before sending the first question?
    setTimeout(() => {
    sendNextQuestion(roomId);
        // console.log(`Room ${roomId} - Returned from first call to sendNextQuestion.`); // Less verbose
    }, 50); // Short delay (50ms)
}

function sendNextQuestion(roomId) {
    // console.log(`DEBUG: sendNextQuestion called for room ${roomId}`); // Less verbose
    const room = rooms.get(roomId);
    if (!room || !room.gameActive) {
         // console.log(`DEBUG: sendNextQuestion aborted for room ${roomId} - Room not found or game not active.`); // Less verbose
        return;
    }
    // Ensure players are still present
    if (!room.players.player1 || !room.players.player2) {
        console.warn(`DEBUG: sendNextQuestion aborted for room ${roomId} - Player missing.`);
        // Game might have ended due to disconnect between answer and next question
        return;
    }


    console.log(`Sending next question for room ${roomId}, Level ${room.currentLevel}`);

    // Check for level advancement
    if (room.questionsAnsweredInLevel >= room.questionsPerLevel) {
        room.currentLevel++;
        room.questionsAnsweredInLevel = 0;
        console.log(`Advancing room ${roomId} to Level ${room.currentLevel}`);
    }

    // Check if game should end (max level reached)
    if (room.currentLevel > MAX_LEVELS) {
        console.log(`Room ${roomId} reached max level.`);
        endGame(roomId, "Completed all levels!");
        return;
    }

    // Ensure the level exists in loaded questions
     // console.log(`DEBUG: Checking questions for Level ${room.currentLevel}...`); // Less verbose
    if (!allQuestions[room.currentLevel] || allQuestions[room.currentLevel].length === 0) {
        console.error(`CRITICAL: No questions available for Level ${room.currentLevel} in room ${roomId}. Ending game.`); // Keep critical error
        endGame(roomId, "Error: No questions available for this level.");
        return;
    }
     // console.log(`DEBUG: Found ${allQuestions[room.currentLevel].length} questions for Level ${room.currentLevel}.`); // Less verbose

    // Select a random, unused question for the current level
    const questionsForLevel = allQuestions[room.currentLevel];
     // Ensure the array exists before accessing it
     if (!room.usedQuestionIndices[room.currentLevel]) {
        room.usedQuestionIndices[room.currentLevel] = [];
    }
    const usedIndices = room.usedQuestionIndices[room.currentLevel];
    const availableIndices = questionsForLevel
        .map((_, index) => index)
        .filter(index => !usedIndices.includes(index));

     // console.log(`DEBUG: Level ${room.currentLevel} - Used Indices: [${usedIndices.join(', ')}, Available Indices: [${availableIndices.join(', ')}]`); // Less verbose

    if (availableIndices.length === 0) {
        console.warn(`No unused questions left for Level ${room.currentLevel} in room ${roomId}. Ending game.`);
        endGame(roomId, `Ran out of questions for Level ${room.currentLevel}.`);
        return;
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    room.currentQuestion = questionsForLevel[randomIndex];
     // console.log(`DEBUG: Selected question index ${randomIndex} for Level ${room.currentLevel}. Text: ${room.currentQuestion.text}`); // Less verbose

    // Mark question as used for this room and level
    room.usedQuestionIndices[room.currentLevel].push(randomIndex);

    // Increment count AFTER selecting the question for this turn
    room.questionsAnsweredInLevel++;

    // Reset turn-specific state
    room.optionsSent = false;
    room.fiftyFiftyUsed = false;

    // Prepare payload (exclude answer info)
    const questionPayload = {
        level: room.currentQuestion.level,
        text: room.currentQuestion.text,
        // Send options immediately for levels > 1 for simplicity
        options: room.currentQuestion.options // NEW WAY: Always send processed options
    };

     // Ensure players exist before accessing properties
     const player1Info = room.players.player1 ? { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score } : null;
     const player2Info = room.players.player2 ? { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score } : null;

     if (!player1Info || !player2Info) {
          console.error(`DEBUG: Player data missing when sending newQuestion for room ${roomId}`); // Keep Error
          return; // Cannot proceed without player info
      }

     const playersInfo = { player1: player1Info, player2: player2Info };


     const message = {
         type: 'newQuestion',
         payload: {
            question: questionPayload,
            questionNumber: room.questionsAnsweredInLevel,
            totalQuestionsInLevel: room.questionsPerLevel,
             currentTurn: room.currentTurn,
            players: playersInfo
        }
    };

    console.log(`Room ${roomId} - Sending Q${room.questionsAnsweredInLevel} L${room.currentLevel}, Turn: ${room.currentTurn}`); // Keep this summary log
     // console.log(`DEBUG: Broadcasting newQuestion message for room ${roomId}...`); // Less verbose
    broadcastToRoom(roomId, message);
    // Also send individually to handle cases where broadcast might miss one? Redundant if broadcast works? Let's rely on broadcast for now.
    // safeSend(room.players.player1.ws, message);
    // safeSend(room.players.player2.ws, message);
     // console.log(`DEBUG: newQuestion message sent for room ${roomId}.`); // Less verbose
}

function handleSubmitAnswer(ws, clientInfo, payload) {
    const roomId = clientInfo.roomId;
    const room = rooms.get(roomId);

    if (!room || !room.gameActive) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Game not active.' } });
        return;
    }
    if (clientInfo.id !== room.currentTurn) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Not your turn.' } });
        return;
    }
    if (!room.currentQuestion) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No active question.' } });
        return;
    }
    // Check players still exist
    if (!room.players.player1 || !room.players.player2) {
         console.warn(`handleSubmitAnswer called in room ${roomId} but a player is missing.`);
         // If a player is missing, end the game
         if (room.gameActive) endGame(roomId, "Player disconnected before answering.");
         return; // Avoid errors if a player disconnected right before answering
    }

    const question = room.currentQuestion;
    let isCorrect = false;
    let pointsAwarded = 0;
    let submittedAnswerIndex = -1; // For levels > 1 option clicks

    // Normalize submitted text answer if present
    // const playerAnswerText = payload && typeof payload.answerText === 'string'
    //     ? payload.answerText.toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "")
    //     : ''; // REMOVED
    // submittedAnswerText = payload?.answerText || ''; // Keep original for display // REMOVED

    if (payload && typeof payload.selectedIndex === 'number') {
            // If no text, check for selected index (options must have been requested)
             submittedAnswerIndex = payload.selectedIndex;
            if (submittedAnswerIndex >= 0 && submittedAnswerIndex < question.options.length) {
                // Check if options were actually sent before accepting index answer
            // For QSM 1v1, options are always sent with the question now for all levels.
            // if (!room.optionsSent) { // This check might be less relevant if options are always with question
            //     console.warn(`Room ${roomId} Answer: Index submitted but options were not requested/sent.`);
            //     safeSend(ws, { type: 'errorMessage', payload: { error: 'Cannot answer with index before requesting options.' } });
            //     return;
            // }
                isCorrect = submittedAnswerIndex === question.correctIndex;
            // answerMethod = 'index'; // Already set to index
             console.log(`Room ${roomId} L${question.level} Answer (Index): Submitted Index=${submittedAnswerIndex}, Correct Index=${question.correctIndex}, Result=${isCorrect}`); // Keep answer logs
            } else {
                 // console.warn(`Room ${roomId} L>1 Answer: Invalid index submitted:`, payload.selectedIndex); // Less verbose
                 safeSend(ws, { type: 'errorMessage', payload: { error: 'Invalid answer format (index out of bounds).' } });
                 return; // Invalid submission
            }
        } else {
            // Neither text nor valid index provided for Level > 1
        console.warn(`Room ${roomId} L${question.level} Answer: No valid answer submitted (no selectedIndex). Payload:`, payload);
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Invalid answer format (missing selectedIndex).' } });
            return; // Invalid submission
    }

    // --- Score Calculation & Result Payload --- 
    const currentPlayer = room.players.player1.id === clientInfo.id ? room.players.player1 : room.players.player2;
    if (isCorrect) {
        // --- New Scoring Logic --- 
        // if (question.level === 1) { // OLD LEVEL 1 SCORING
        //     pointsAwarded = 1;
        // } else { // Levels 2-6 // OLD L>1 SCORING
        //     if (answerMethod === 'text') { // Answered without requesting options // TEXT METHOD REMOVED
        //         pointsAwarded = 2;
        //     } else { // Answered using options index
        //         if (room.fiftyFiftyUsed) {
        //             pointsAwarded = 0.5;
        //         } else {
        //             pointsAwarded = 1;
        //         }
        //     }
        // }

        // --- UNIFIED SCORING LOGIC FOR ALL LEVELS (ANSWERED BY INDEX) --- 
                if (room.fiftyFiftyUsed) {
            pointsAwarded = 0.5; // Half points if 50/50 was used
                } else {
            pointsAwarded = 1;   // Full point if answered correctly without 50/50
        }
        // For QSM 1v1, there's no concept of answering by text *before* options for levels > 1 anymore.
        // All answers are via selectedIndex.
        // The `optionsSent` flag might be less critical if options always come with the question.
        // If we want to re-introduce higher points for answering a hypothetical text input before options are shown for L>1 (not current setup):
        // We would need a way for the client to submit text for L>1 *instead* of an index, and then handle that path.
        // Given the current client sends selectedIndex, this scoring is simpler.

        // --- End New Scoring Logic ---
        currentPlayer.score += pointsAwarded;
    } else {
        pointsAwarded = 0; // Explicitly set to 0 if incorrect
    }

    // Correct answer text normalization should happen during question loading now
    // const normalizedCorrectAnswerText = question.correctAnswerText.toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "");

    const resultPayload = {
        isCorrect: isCorrect,
        pointsAwarded: pointsAwarded,
        // Send the already normalized correctAnswerText from the question object
        correctAnswerText: question.correctAnswerText.toUpperCase(), 
        correctIndex: question.correctIndex, // Send correct index (will be -1 for L1)
        forPlayerId: clientInfo.id,
        // submittedAnswerText: answerMethod === 'text' ? submittedAnswerText : null, // REMOVED
        submittedAnswerText: null, // No text submission method anymore
        selectedIndex: submittedAnswerIndex // Send submitted index (was always by index)
    };

    // Send result to everyone in the room
    broadcastToRoom(roomId, { type: 'answerResult', payload: resultPayload });

    // Switch turn
    room.currentTurn = room.players.player1.id === clientInfo.id ? room.players.player2.id : room.players.player1.id;

    // Prepare state update message
     const playersInfo = {
        player1: { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score },
        player2: { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score }
    };
    const updatePayload = { currentTurn: room.currentTurn, players: playersInfo };
    const updateMessage = { type: 'updateState', payload: updatePayload };

     // Send state update to everyone
     broadcastToRoom(roomId, updateMessage);

    // Send next question after a short delay to allow clients to process result
    setTimeout(() => {
         // Check if room still exists and game is active before sending next question
         const currentRoom = rooms.get(roomId);
         if (currentRoom && currentRoom.gameActive) {
            sendNextQuestion(roomId);
         } else {
              // console.log(`DEBUG: Skipping sendNextQuestion for room ${roomId} as it no longer exists or game is inactive.`); // Less verbose
         }
    }, 1500); // Adjust delay as needed (e.g., 1.5 seconds)
}

function handleRequestOptions(ws, clientInfo) {
    const roomId = clientInfo.roomId;
    const room = rooms.get(roomId);

    // Add check for currentQuestion existence
    if (!room || !room.gameActive || clientInfo.id !== room.currentTurn || !room.currentQuestion || room.currentQuestion.level === 1) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Cannot request options now.' } });
         return;
    }
    if (room.optionsSent) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Options already requested/sent.' } });
         return;
     }

    room.optionsSent = true;
    // Ensure currentQuestion has options before sending
     if (!room.currentQuestion.options || room.currentQuestion.options.length === 0) {
          console.error(`Room ${roomId} - Cannot provide options for question without options array.`);
          safeSend(ws, { type: 'errorMessage', payload: { error: 'Error retrieving options for this question.' } });
          room.optionsSent = false; // Reset flag if failed
        return;
    }
    const optionsPayload = { options: room.currentQuestion.options };
    // console.log(`Room ${roomId} - Sending options to ${clientInfo.id}`); // Less verbose
    safeSend(ws, { type: 'optionsProvided', payload: optionsPayload });
}

function handleRequestFiftyFifty(ws, clientInfo) {
    const roomId = clientInfo.roomId;
    const room = rooms.get(roomId);

    // Add check for currentQuestion existence
     if (!room || !room.gameActive || clientInfo.id !== room.currentTurn || !room.currentQuestion || room.currentQuestion.level === 1 || !room.optionsSent || room.fiftyFiftyUsed) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Cannot use 50/50 now.' } });
         return;
     }
    // Ensure options array exists and has enough elements
     if (!room.currentQuestion.options || room.currentQuestion.options.length < 4) {
          console.error(`Room ${roomId} - Cannot apply 50/50: Invalid options data.`);
          safeSend(ws, { type: 'errorMessage', payload: { error: 'Error applying 50/50.' } });
         return;
     }

    room.fiftyFiftyUsed = true;
    const correctIndex = room.currentQuestion.correctIndex;
    const optionsCount = room.currentQuestion.options.length; // Should be 4
    let indicesToRemove = [];

    // Generate indices 0, 1, 2, 3
    const allIndices = Array.from({ length: optionsCount }, (_, i) => i);
    // Filter out the correct index
    const incorrectIndices = allIndices.filter(index => index !== correctIndex);

    // Shuffle incorrect indices
    for (let i = incorrectIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [incorrectIndices[i], incorrectIndices[j]] = [incorrectIndices[j], incorrectIndices[i]];
    }

    // Take the first two shuffled incorrect indices
    indicesToRemove = incorrectIndices.slice(0, 2);


    if (indicesToRemove.length === 2) {
        const fiftyFiftyPayload = { optionsToRemove: indicesToRemove };
        // console.log(`Room ${roomId} - Sending 50/50 removal indices ${indicesToRemove} to ${clientInfo.id}`); // Less verbose
        safeSend(ws, { type: 'fiftyFiftyApplied', payload: fiftyFiftyPayload });
    } else {
        // Fallback logic (should ideally not be reached with 4 options)
        console.error(`Room ${roomId} - Failed to select 2 indices for 50/50. Incorrect Indices:`, incorrectIndices);
        room.fiftyFiftyUsed = false; // Reset if failed
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Failed to apply 50/50.' } });
}
}


// --- End Game & Cleanup ---

function endGame(roomId, reason = "Game finished") {
    const room = rooms.get(roomId);
    if (!room) return;
     // Check if game is already inactive to prevent double execution
     if (!room.gameActive) {
          // console.log(`Game in room ${roomId} is already inactive. Ignoring endGame call.`); // Less verbose
          return;
      }


    console.log(`Ending game in room ${roomId}. Reason: ${reason}`);
    room.gameActive = false;

    let winnerId = null;
    let draw = false;
    const p1 = room.players.player1;
    const p2 = room.players.player2;

    // Determine winner based on score, handle cases where a player might be null
    if (p1 && p2) {
        if (p1.score > p2.score) winnerId = p1.id;
        else if (p2.score > p1.score) winnerId = p2.id;
        else draw = true;
    } else if (p1 && !p2) {
         winnerId = p1.id; // Player 1 wins if player 2 disconnected earlier
         reason = reason || `${p1.name} wins! Opponent disconnected.`; // Adjust reason if needed
    } else if (!p1 && p2) {
         winnerId = p2.id; // Player 2 wins if player 1 disconnected earlier
         reason = reason || `${p2.name} wins! Opponent disconnected.`; // Adjust reason if needed
    } else {
         // Both players null? Should not happen if called correctly, but handle defensively
         console.warn(`endGame called for room ${roomId} with no players.`);
         reason = reason || "Game ended unexpectedly.";
    }


    const finalScores = {};
    if (p1) finalScores[p1.id] = p1.score;
    if (p2) finalScores[p2.id] = p2.score;

    const gameOverPayload = {
            finalScores: finalScores,
            winnerId: winnerId,
            draw: draw,
            reason: reason
    };

    // Send gameOver message to both players (if they exist and are connected)
    const message = { type: 'gameOver', payload: gameOverPayload };
    if (p1) safeSend(p1.ws, message);
    if (p2) safeSend(p2.ws, message);

    // Consider cleanup: Keep room until players disconnect?
    // Let's keep it for now, disconnect logic handles removal.
    console.log(`Game ended for room ${roomId}. Final state sent.`);
}

function handleDisconnect(ws, clientId, roomId) {
    console.log(`Handling disconnect for ${clientId} in room ${roomId || 'lobby'}`);
    if (roomId) {
    const room = rooms.get(roomId);
        if (room) {
    let remainingPlayer = null;
    let disconnectedPlayerName = 'Opponent';
            let wasGameActive = room.gameActive; // Check game status *before* modifying players

            // Identify players and check if game was active
    if (room.players.player1 && room.players.player1.id === clientId) {
        disconnectedPlayerName = room.players.player1.name;
        room.players.player1 = null;
                remainingPlayer = room.players.player2;
    } else if (room.players.player2 && room.players.player2.id === clientId) {
        disconnectedPlayerName = room.players.player2.name;
        room.players.player2 = null;
                remainingPlayer = room.players.player1;
            }

            if (!room.players.player1 && !room.players.player2) {
                // Both players gone (or only one was ever there), remove room
                console.log(`Room ${roomId} empty after disconnect, removing.`);
             rooms.delete(roomId);
            } else if (remainingPlayer && wasGameActive) { // Use the captured status
                // Game was active, notify remaining player and end game immediately
                console.log(`Game in room ${roomId} ended due to player ${clientId} disconnecting.`); // Keep important disconnect log
                // End the game *before* sending the final message to ensure state is updated
                endGame(roomId, `${disconnectedPlayerName} disconnected. ${remainingPlayer.name} wins!`);
                // The endGame function now sends the gameOver message. No need to send another one here.
                 room.gameActive = false; // Ensure game is marked inactive again if endGame didn't run fully
            } else if (remainingPlayer) {
                 // Game not active (lobby), notify remaining player opponent left
            safeSend(remainingPlayer.ws, {
                     type: 'opponentLeftLobby',
                payload: { message: `${disconnectedPlayerName} left the lobby.` }
            });
            }
            // Broadcast updated room list if needed
            broadcastAvailableRooms();
        } else {
             console.warn(`Disconnect in room ${roomId}, but room not found in rooms map.`);
        }
    }
    // Client record is deleted in the main 'close' handler AFTER this function runs
}

// --- Mentiroso Game Handler Stubs ---
function handleCreateMentirosoRoom(ws, clientInfo, payload) {
    console.log(`Mentiroso: Client ${clientInfo.id} requests to create room with payload:`, payload);
    // Basic validation: if already in a room
    if (clientInfo.roomId) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Ya estás en una sala.', gameType: 'mentiroso' } });
        return;
    }

    const roomId = generateRoomId();
    const playerName = payload.playerName || `Jugador_${clientInfo.id.substring(0, 4)}`;
    const password = payload.password || ''; // Empty string if no password

    const player1 = {
        id: clientInfo.id,
        name: playerName,
        ws: ws,
        score: 0
    };

    const newMentirosoRoom = {
        roomId: roomId,
        gameType: 'mentiroso',
        players: { player1: player1, player2: null },
        password: password,
        gameActive: false,
        spectators: [],
        currentTurn: null,
        currentChallenge: null,
        currentDeclarations: [],
        roundNumber: 0,
        maxRounds: 5, // Example, can be configurable
        demonstrationState: null,
        // Mentiroso specific game state to be added
    };

    rooms.set(roomId, newMentirosoRoom);
    clientInfo.roomId = roomId;

    console.log(`Mentiroso Room ${roomId} created by ${playerName} (${clientInfo.id}). Password: ${password ? 'Yes' : 'No'}`);
    safeSend(ws, { type: 'mentirosoRoomCreated', payload: { roomId: roomId, playerId: clientInfo.id } });
    broadcastAvailableRooms(); // Update lobby
}

function handleJoinMentirosoRoom(ws, clientInfo, payload) {
    console.log(`Mentiroso: Client ${clientInfo.id} requests to join room with payload:`, payload);
     if (clientInfo.roomId) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Ya estás en una sala.', gameType: 'mentiroso' } });
        return;
    }
    if (!payload || !payload.roomId) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Room ID is required.', gameType: 'mentiroso' } });
        return;
    }
    const { roomId, password, playerName } = payload;
    const room = rooms.get(roomId);

    if (!room || room.gameType !== 'mentiroso') {
        safeSend(ws, { type: 'joinError', payload: { error: `La sala Mentiroso ${roomId} no existe o no es de tipo Mentiroso.`, gameType: 'mentiroso' } });
        return;
    }
    if (room.password && room.password !== password) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Contraseña incorrecta.', gameType: 'mentiroso' } });
        return;
    }
    if (room.players.player1 && room.players.player2) {
        safeSend(ws, { type: 'joinError', payload: { error: 'La sala Mentiroso ya está llena.', gameType: 'mentiroso' } });
        return;
    }
    if (!room.players.player1) {
        console.error(`Mentiroso Room ${roomId} has no player 1, cannot join.`);
        safeSend(ws, { type: 'joinError', payload: { error: 'Error interno de la sala Mentiroso.' , gameType: 'mentiroso'} });
        return;
    }

    const player2 = {
        id: clientInfo.id,
        name: playerName || `Jugador_${clientInfo.id.substring(0, 4)}`,
        ws: ws,
        score: 0
    };
    room.players.player2 = player2;
    clientInfo.roomId = roomId;

    console.log(`Mentiroso: ${player2.name} (${clientInfo.id}) joined room ${roomId}`);
    const playersInfo = {
        player1: { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score },
        player2: { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score }
    };

    safeSend(ws, { type: 'mentirosoJoinSuccess', payload: { roomId: roomId, players: playersInfo } });
    safeSend(room.players.player1.ws, { type: 'mentirosoPlayerJoined', payload: { players: playersInfo } });
    
    startMentirosoGame(roomId);
    broadcastAvailableRooms();
}

function handleMentirosoDeclare(ws, clientInfo, payload) {
    console.log(`Mentiroso: Client ${clientInfo.id} declares in room ${clientInfo.roomId}:`, payload);
    const room = rooms.get(clientInfo.roomId);
    if (!room || !room.gameActive || room.currentTurn !== clientInfo.id || room.gameType !== 'mentiroso') {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No es tu turno o la partida no está activa.' } });
        return;
    }
    if (!payload || typeof payload.amount !== 'number' || payload.amount <= 0) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Declaración inválida.' } });
        return;
    }
    const amount = payload.amount;
    const lastDeclaration = room.currentDeclarations.length > 0 ? room.currentDeclarations[room.currentDeclarations.length - 1] : null;

    if (lastDeclaration && amount <= lastDeclaration.amount) {
         safeSend(ws, { type: 'errorMessage', payload: { error: 'Debes declarar un número mayor al anterior.' } });
         return;
    }
     if (room.currentChallenge.type === 'structured' && amount > room.currentChallenge.data.questions.length) {
        safeSend(ws, { type: 'errorMessage', payload: { error: `No puedes declarar más de ${room.currentChallenge.data.questions.length} preguntas.` } });
        return;
    }


    const declarerName = clientInfo.id === room.players.player1.id ? room.players.player1.name : room.players.player2.name;
    room.currentDeclarations.push({ player: declarerName, playerId: clientInfo.id, amount: amount });
    
    // Switch turn
    room.currentTurn = clientInfo.id === room.players.player1.id ? room.players.player2.id : room.players.player1.id;

    const updatePayload = {
        declarationsLog: room.currentDeclarations,
        currentTurn: room.currentTurn,
        players: getPlayerInfoForClients(room)
    };
    broadcastToRoom(clientInfo.roomId, { type: 'mentirosoDeclarationUpdate', payload: updatePayload });
    
    // If new turn is AI (assuming P2 is AI for now, will need proper 2-player logic)
    // This AI logic is a placeholder and should be expanded for real multiplayer.
    // For now, if it's P2's turn (and P2 is human), they will act.
    // If P2 were AI, this is where AI logic would be triggered.
}

function handleMentirosoCallLiar(ws, clientInfo, payload) {
    console.log(`Mentiroso: Client ${clientInfo.id} calls liar in room ${clientInfo.roomId}`);
    const room = rooms.get(clientInfo.roomId);
    if (!room || !room.gameActive || room.currentTurn !== clientInfo.id || room.gameType !== 'mentiroso') {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No puedes cantar mentiroso ahora.' } });
        return;
    }
    if (room.currentDeclarations.length === 0) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No hay declaraciones para desafiar.' } });
        return;
    }

    const lastDeclaration = room.currentDeclarations[room.currentDeclarations.length -1];
    if (lastDeclaration.playerId === clientInfo.id) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No puedes acusarte a ti mismo.'}});
        return;
    }

    const demonstratorId = lastDeclaration.playerId;
    const challengerId = clientInfo.id; // The one who called liar
    const declaredAmount = lastDeclaration.amount;
    
    room.demonstrationState = {
        demonstratorId: demonstratorId,
        challengerId: challengerId,
        declaredAmount: declaredAmount,
        challengeData: room.currentChallenge, // The full challenge object
        answersSubmitted: [],
        timeLimit: (room.currentChallenge.type === 'list' ? room.currentChallenge.data.time_limit_seconds : room.currentChallenge.data.time_limit_seconds_per_question * declaredAmount) || 60,
        isAiDemonstrating: false // This will be true if the server controls an AI player
    };
    
    // Notify demonstrator to start
    const demonstratorWs = getPlayerWs(room, demonstratorId);
    if (demonstratorWs) {
        safeSend(demonstratorWs, { 
            type: 'mentirosoDemonstrationRequired', 
            payload: {
                demonstratorId: demonstratorId,
                challengerId: challengerId,
                declaredAmount: declaredAmount,
                challenge: room.currentChallenge, // Send the challenge details
                timeLimit: room.demonstrationState.timeLimit
            }
        });
    }

    // Notify challenger (and any spectators) to wait
    const challengerWs = getPlayerWs(room, challengerId);
    const waitingPayload = {
        demonstratorId: demonstratorId,
        demonstratorName: getPlayerName(room, demonstratorId),
        challengerId: challengerId,
        declaredAmount: declaredAmount,
        challengeText: formatMentirosoChallengeText(room.currentChallenge, declaredAmount)
    };
    // Send to challenger
    if (challengerWs) {
        safeSend(challengerWs, {type: 'mentirosoDemonstrationWait', payload: waitingPayload});
    }
    // Send to other player if they are not the demonstrator or challenger (e.g. spectator, or if P1 calls P2, P2 needs to know)
    // In a 2-player game, the other player is the demonstrator.
    const otherPlayerId = (demonstratorId === room.players.player1.id) ? room.players.player2.id : room.players.player1.id;
    if (otherPlayerId !== challengerId && otherPlayerId !== demonstratorId) { // Should not happen in 2 player
         const otherPlayerWs = getPlayerWs(room, otherPlayerId);
         if(otherPlayerWs) safeSend(otherPlayerWs, {type: 'mentirosoDemonstrationWait', payload: waitingPayload});
    }


    // TODO: Start server-side timer for demonstration if not AI
    // For now, client will manage its own timer and submit. Server can have a fallback timeout.
    console.log(`Mentiroso: Room ${room.roomId}, ${getPlayerName(room, challengerId)} called liar on ${getPlayerName(room, demonstratorId)} for ${declaredAmount}`);
}

function handleMentirosoSubmitDemonstration(ws, clientInfo, payload) {
    console.log(`Mentiroso: Client ${clientInfo.id} submits demonstration in room ${clientInfo.roomId}:`, payload);
    const room = rooms.get(clientInfo.roomId);

    if (!room || !room.gameActive || room.gameType !== 'mentiroso' || !room.demonstrationState) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No hay una demostración activa.' } });
        return;
    }
    if (clientInfo.id !== room.demonstrationState.demonstratorId) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No te toca demostrar.' } });
        return;
    }
    if (!payload || !payload.answers) {
         safeSend(ws, { type: 'errorMessage', payload: { error: 'No se recibieron respuestas.' } });
        return;
    }

    // Process answers
    evaluateMentirosoDemonstration(room, payload.answers);
}

// --- Mentiroso Game Logic Stubs ---
function startMentirosoGame(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.players.player1 || !room.players.player2 || room.gameType !== 'mentiroso') {
        console.error(`Mentiroso: Cannot start game in room ${roomId}, players not ready or wrong game type.`);
        return;
    }
    room.gameActive = true;
    room.scoreP1 = 0; // Assuming score is tracked on player objects room.players.player1.score
    room.scoreP2 = 0; // room.players.player2.score
    room.players.player1.score = 0;
    room.players.player2.score = 0;
    room.roundNumber = 0; // Will be incremented by startMentirosoRound
    room.currentDeclarations = [];
    room.demonstrationState = null;
    
    // Randomly select starting player
    room.currentTurn = Math.random() < 0.5 ? room.players.player1.id : room.players.player2.id;
    
    console.log(`Mentiroso: Starting game in room ${roomId}. First turn: ${getPlayerName(room, room.currentTurn)}`);
    
    startMentirosoRound(roomId); // This will send the first challenge
}

function startMentirosoRound(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.gameActive || room.gameType !== 'mentiroso') return;

    room.roundNumber++;
    if (room.roundNumber > room.maxRounds) {
        endMentirosoGame(roomId, "Se alcanzó el límite de rondas.");
        return;
    }

    room.currentDeclarations = [];
    room.demonstrationState = null;
    // Select a new challenge (basic random selection for now)
    if (gameChallengesMentiroso.length === 0) {
        console.error("CRITICAL: No Mentiroso challenges loaded. Cannot start round.");
        endMentirosoGame(roomId, "Error: No hay desafíos disponibles.");
        return;
    }
    room.currentChallenge = { ...gameChallengesMentiroso[Math.floor(Math.random() * gameChallengesMentiroso.length)] };
    
    // If challenge has placeholder_details, resolve them
    if (room.currentChallenge.placeholder_details) {
        room.currentChallenge.runtime_details = {};
        for (const key in room.currentChallenge.placeholder_details) {
            if (typeof room.currentChallenge.placeholder_details[key] === 'function') {
                room.currentChallenge.runtime_details[key] = room.currentChallenge.placeholder_details[key]();
            } else {
                room.currentChallenge.runtime_details[key] = room.currentChallenge.placeholder_details[key];
            }
        }
    }


    const roundStartPayload = {
        roundNumber: room.roundNumber,
        maxRounds: room.maxRounds,
        challenge: room.currentChallenge,
        challengeText: formatMentirosoChallengeText(room.currentChallenge, "_"), // Initial text
        currentTurn: room.currentTurn,
        players: getPlayerInfoForClients(room)
    };
    broadcastToRoom(roomId, { type: 'mentirosoNewRound', payload: roundStartPayload });
    console.log(`Mentiroso: Room ${roomId} starting round ${room.roundNumber}. Challenge: ${room.currentChallenge.id}. Turn: ${getPlayerName(room, room.currentTurn)}`);
}

function evaluateMentirosoDemonstration(room, submittedAnswers) {
    if (!room.demonstrationState) return;

    const { demonstratorId, challengerId, declaredAmount, challengeData } = room.demonstrationState;
    let wasSuccessful = false;
    let actualCorrectAnswers = 0;

    if (challengeData.type === 'list') {
        let validationList = challengeData.data.validation_list;
        if (typeof challengeData.data.get_validation_list === 'function') {
            validationList = challengeData.data.get_validation_list(challengeData.runtime_details || {});
        }
        const normalizedValidationList = validationList.map(item => normalizeMentirosoText(item));
        const normalizedUserAnswers = submittedAnswers.map(ans => normalizeMentirosoText(ans)).filter(ans => ans.length > 0);
        const uniqueUserAnswers = [...new Set(normalizedUserAnswers)];

        uniqueUserAnswers.forEach(userAns => {
            if (normalizedValidationList.includes(userAns)) {
                actualCorrectAnswers++;
            }
        });
        wasSuccessful = actualCorrectAnswers >= declaredAmount;
    } else if (challengeData.type === 'structured') {
        // Answers should be an array of { question_id, user_answer }
        const questionsAttempted = challengeData.data.questions.slice(0, declaredAmount);
        submittedAnswers.forEach(userAnswerObj => {
            const questionDef = questionsAttempted.find(q => q.q_id === userAnswerObj.question_id);
            if (questionDef && normalizeMentirosoText(userAnswerObj.user_answer) === normalizeMentirosoText(questionDef.correctAnswer)) {
                actualCorrectAnswers++;
            }
        });
        wasSuccessful = actualCorrectAnswers >= declaredAmount;
    }

    let roundWinnerId, roundLoserId;
    if (wasSuccessful) {
        roundWinnerId = demonstratorId;
        roundLoserId = challengerId;
        getPlayerById(room, demonstratorId).score++;
    } else {
        roundWinnerId = challengerId;
        roundLoserId = demonstratorId;
        getPlayerById(room, challengerId).score++;
    }
    
    room.demonstrationState = null; // Clear demonstration state

    const resultPayload = {
        roundWinnerId: roundWinnerId,
        roundWinnerName: getPlayerName(room, roundWinnerId),
        roundLoserId: roundLoserId,
        roundLoserName: getPlayerName(room, roundLoserId),
        wasSuccessfulDemonstration: wasSuccessful,
        declaredAmount: declaredAmount,
        actualCorrectAnswers: actualCorrectAnswers, // How many they actually got right
        challengeType: challengeData.type,
        players: getPlayerInfoForClients(room), // Includes updated scores
        reason: wasSuccessful ? `${getPlayerName(room, demonstratorId)} demostró con éxito!` : `${getPlayerName(room, demonstratorId)} no pudo demostrarlo.`,
        roundNumber: room.roundNumber
    };
    broadcastToRoom(room.roomId, { type: 'mentirosoRoundResult', payload: resultPayload });

    // Set next turn to round winner
    room.currentTurn = roundWinnerId;

    // Check for game end or start next round
    if (room.roundNumber >= room.maxRounds) {
        endMentirosoGame(room.roomId, "Se completaron todas las rondas.");
    } else {
        // Add a delay before starting next round
        setTimeout(() => startMentirosoRound(room.roomId), 3000); // 3 second delay
    }
}

function endMentirosoGame(roomId, reason = "Juego Terminado") {
    const room = rooms.get(roomId);
    if (!room || room.gameType !== 'mentiroso') return;

    room.gameActive = false;
    console.log(`Mentiroso: Ending game in room ${roomId}. Reason: ${reason}`);

    let winnerId = null;
    let draw = false;
    const p1 = room.players.player1;
    const p2 = room.players.player2;

    if (p1 && p2) {
        if (p1.score > p2.score) winnerId = p1.id;
        else if (p2.score > p1.score) winnerId = p2.id;
        else draw = true;
    } else if (p1 && !p2) { // P2 disconnected
        winnerId = p1.id;
        reason = `${p2 ? p2.name : 'Oponente'} se desconectó.`;
    } else if (!p1 && p2) { // P1 disconnected
        winnerId = p2.id;
        reason = `${p1 ? p1.name : 'Oponente'} se desconectó.`;
    }

    const gameOverPayload = {
        winnerId: winnerId,
        winnerName: winnerId ? getPlayerName(room, winnerId) : null,
        draw: draw,
        finalScores: getPlayerInfoForClients(room), // Contains scores
        reason: reason
    };
    broadcastToRoom(roomId, { type: 'mentirosoGameOver', payload: gameOverPayload });

    // Room can be kept for a bit or cleaned up after players leave.
    // For now, let leaveRoom handler deal with cleanup.
}

// --- Mentiroso Helper Functions ---
function getPlayerInfoForClients(room) {
    if (!room || !room.players) return {};
    const p1 = room.players.player1;
    const p2 = room.players.player2;
    return {
        player1: p1 ? { id: p1.id, name: p1.name, score: p1.score } : null,
        player2: p2 ? { id: p2.id, name: p2.name, score: p2.score } : null,
    };
}

function getPlayerWs(room, playerId) {
    if (!room || !playerId) return null;
    if (room.players.player1 && room.players.player1.id === playerId) return room.players.player1.ws;
    if (room.players.player2 && room.players.player2.id === playerId) return room.players.player2.ws;
    return null;
}

function getPlayerName(room, playerId) {
    if (!room || !playerId) return 'Desconocido';
    if (room.players.player1 && room.players.player1.id === playerId) return room.players.player1.name;
    if (room.players.player2 && room.players.player2.id === playerId) return room.players.player2.name;
    return 'Desconocido';
}

function getPlayerById(room, playerId) {
    if (!room || !playerId) return null;
    if (room.players.player1 && room.players.player1.id === playerId) return room.players.player1;
    if (room.players.player2 && room.players.player2.id === playerId) return room.players.player2;
    return null;
}


function formatMentirosoChallengeText(challenge, amount = "X") {
    if (!challenge || !challenge.text_template) return "Error: Desafío no encontrado.";
    let text = challenge.text_template.replace("X", `${amount.toString()}`);
    if (challenge.runtime_details) {
        for (const key in challenge.runtime_details) {
            text = text.replace(`{${key}}`, `${challenge.runtime_details[key]}`);
        }
    }
    return text;
}

function normalizeMentirosoText(text) {
    if (!text) return "";
    return text.toString().trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s]/gi, ''); // Remove special characters except spaces
}

// Handler para la validación manual del rival
function handleMentirosoSubmitValidation(ws, clientInfo, payload) {
    const room = rooms.get(clientInfo.roomId);
    if (!room || !room.gameActive || !room.demonstrationState) return;

    // Solo el challenger puede validar
    if (clientInfo.id !== room.demonstrationState.challengerId) return;

    const validations = payload.validations; // Array de true/false
    const declaredAmount = room.demonstrationState.declaredAmount;
    let correctCount = 0;
    validations.forEach(v => { if (v) correctCount++; });

    // Decide el ganador según la validación
    let wasSuccessful = correctCount >= declaredAmount;
    let roundWinnerId, roundLoserId;
    if (wasSuccessful) {
        roundWinnerId = room.demonstrationState.demonstratorId;
        roundLoserId = room.demonstrationState.challengerId;
        getPlayerById(room, roundWinnerId).score++;
    } else {
        roundWinnerId = room.demonstrationState.challengerId;
        roundLoserId = room.demonstrationState.demonstratorId;
        getPlayerById(room, roundWinnerId).score++;
    }

    // Prepara el resultado
    const resultPayload = {
        roundWinnerId,
        roundWinnerName: getPlayerName(room, roundWinnerId),
        roundLoserId,
        roundLoserName: getPlayerName(room, roundLoserId),
        wasSuccessfulDemonstration: wasSuccessful,
        declaredAmount,
        actualCorrectAnswers: correctCount,
        challengeType: room.demonstrationState.challengeData.type,
        players: getPlayerInfoForClients(room),
        reason: wasSuccessful
            ? `${getPlayerName(room, roundWinnerId)} demostró con éxito (${correctCount}/${declaredAmount})`
            : `${getPlayerName(room, roundLoserId)} no pudo demostrarlo (${correctCount}/${declaredAmount})`,
        roundNumber: room.roundNumber,
        validationInfo: `Respuestas validadas como correctas: ${correctCount} de ${declaredAmount}`
    };
    broadcastToRoom(room.roomId, { type: 'mentirosoRoundResult', payload: resultPayload });

    // Siguiente ronda o fin
    room.currentTurn = roundWinnerId;
    room.demonstrationState = null;
    if (room.roundNumber >= room.maxRounds) {
        endMentirosoGame(room.roomId, "Se completaron todas las rondas.");
    } else {
        setTimeout(() => startMentirosoRound(room.roomId), 3000);
    }
}

// --- End Mentiroso Game Logic Stubs ---


console.log("Server script initialized. Waiting for connections...");

// Graceful shutdown (optional but good practice)
process.on('SIGINT', () => {
    console.log('\nGracefully shutting down...');
    wss.close(() => {
        console.log('WebSocket server closed.');
        server.close(() => {
            console.log('HTTP server closed.');
            process.exit(0);
        });
    });
}); 