// --- Importaciones de Firebase ---
import { db } from './firebase-init.js'; // Importar la instancia de DB
import {
    collection, doc, setDoc, addDoc, Timestamp, increment, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Game variables (Declare totalTime globally/module scope) ---
let totalTime = 240; // Default: Normal difficulty (240 seconds)
let currentPlayerName = 'Jugador Anónimo'; // <-- Variable para guardar el nombre
let logrosAlInicioDePartida = {}; // <<< NUEVA VARIABLE GLOBAL PARA LOGROS

// <<<--- NUEVAS VARIABLES DE SEGUIMIENTO DE LOGROS POR PARTIDA --- >>>
let pasapalabraUsadoEnPartida = 0;
let errorEnLetraAEstaPartida = false;
let letrasAcertadasSeguidasEstaPartida = 0;
let maxLetrasAcertadasSeguidasEstaPartida = 0;
let estuvoAUnErrorDePerderEstaPartida = false;
let letrasVisitadasEnVueltaActual = new Set();
let todasLetrasVisitadasAlMenosUnaVez = false;
let usoAyudaYAciertoEnMismaPregunta = false;
let ultimaLetraPendienteAntesDeVictoria = false;
// <<<--- FIN NUEVAS VARIABLES --- >>>

document.addEventListener('DOMContentLoaded', function() {
    // <-- Leer el nombre del jugador UNA VEZ al cargar -->
    currentPlayerName = localStorage.getItem('playerName') || 'Jugador Anónimo';
    console.log("Player name loaded on init:", currentPlayerName);

    // Stats Profile Keys
    const STATS_KEY = 'pasalacheUserStats';
    const HISTORY_KEY = 'pasalacheGameHistory'; // Nueva clave para el historial
    const HISTORY_LIMIT = 15; // Límite de partidas en el historial

    // Define alphabet here so it's available to functions within this scope
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // --- Obtener Nombre/ID de Usuario --- 
    function getCurrentUserId() {
        // Usamos el nombre como ID simple. Podría mejorarse con un ID único real.
        const name = localStorage.getItem('playerName') || 'JugadorAnónimo';
        console.log("Nombre obtenido para ID:", name); // <--- Log temporal
        // Reemplazar espacios o caracteres inválidos para IDs de Firestore si es necesario
        return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''); 
    }
    function getCurrentDisplayName() {
        // const name = localStorage.getItem('playerName') || 'Jugador Anónimo'; <--- REMOVED
        // console.log("Nombre obtenido para Display:", name); // <--- REMOVED
        // return name; <--- REMOVED
        return currentPlayerName; // <-- Devolver el nombre guardado en la variable
    }

    // +++ Nueva función para normalizar respuestas +++
    function normalizeResponseText(text) {
        if (typeof text !== 'string') return '';
        return text.toLowerCase()
                   .trim()
                   .normalize("NFD") // Descomponer acentos y diéresis
                   .replace(/\p{Diacritic}/gu, ""); // Eliminar marcas diacríticas Unicode
    }
    // +++ Fin nueva función +++

    // Function to get default stats object
    function getDefaultStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0, // Completed rosco
            gamesLostByErrors: 0,
            gamesLostByTimeout: 0,
            totalCorrectAnswers: 0,
            totalIncorrectAnswers: 0,
            totalPassedAnswers: 0, // Track total passes if needed
            totalHelpUsed: 0,
            bestScore: 0, // Max correct answers in a game
            fastestWinTime: null, // Time in seconds
            // Add more stats as needed
        };
    }

    // Function to load stats from localStorage
    function loadProfileStats() {
        const statsJson = localStorage.getItem(STATS_KEY);
        if (statsJson) {
            try {
                // Merge saved stats with defaults to ensure all keys exist
                return { ...getDefaultStats(), ...JSON.parse(statsJson) };
            } catch (e) {
                console.error("Error parsing profile stats:", e);
                localStorage.removeItem(STATS_KEY); // Clear corrupted data
                return getDefaultStats();
            }
        } else {
            return getDefaultStats();
        }
    }

    // Function to save stats to localStorage
    function saveProfileStats(stats) {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        } catch (e) {
            console.error("Error saving profile stats:", e);
        }
    }

    // --- Funciones para el Historial --- 
    function loadGameHistory() {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        if (historyJson) {
            try {
                return JSON.parse(historyJson);
            } catch (e) {
                console.error("Error parsing game history:", e);
                localStorage.removeItem(HISTORY_KEY); // Clear corrupted data
                return [];
            }
        } else {
            return [];
        }
    }

    function saveGameHistory(history) {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error("Error saving game history:", e);
        }
    }

    function addGameToHistory(gameResult) {
        let history = loadGameHistory();
        history.unshift(gameResult); // Añadir al principio (más reciente primero)
        
        // Mantener el límite del historial
        if (history.length > HISTORY_LIMIT) {
            history = history.slice(0, HISTORY_LIMIT);
        }
        
        saveGameHistory(history);
    }
    // --- Fin Funciones para el Historial ---

    // --- Simple Debounce Function ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Game variables
    let questions = [];
    let currentLetterIndex = 0;
    let currentQuestionIndex = 0; // This will now store the index *within* the letter's questions array
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let passedAnswers = 0;
    let pendingLetters = [];
    let letterStatuses = {}; // 'correct', 'incorrect', 'pending', 'unanswered'
    let hintDisplayed = {};
    let letterHints = {};
    let gameErrors = [];
    let usedAnswerSignatures = new Set(); // <--- Track used answers for the current game
    let gameUsedQuestionIndices = {}; // <<<--- Reset used QUESTIONS for new game
    alphabet.split('').forEach(letter => { gameUsedQuestionIndices[letter] = []; }); // Initialize arrays
    let timeLeft = totalTime;
    let timerInterval;
    let maxErrors = 3; // Maximum number of errors allowed
    let helpUsed = 0; // Track help usage
    let maxHelp = 2; // Maximum number of helps
    let incompleteAnswersUsed = 0; // Track incomplete answers
    let maxIncompleteAnswers = 2; // Maximum incomplete answers allowed
    let completedRounds = 0; // Contador de vueltas completas
    
    // <<<--- MOVED DOM ELEMENT VARIABLES HERE --- >>>
    const lettersContainer = document.getElementById('lettersContainer');
    const currentLetterElement = document.getElementById('currentLetter');
    const currentLetterTextElement = document.getElementById('currentLetterText');
    const questionTextElement = document.getElementById('questionText');
    const answerForm = document.getElementById('answerForm');
    const answerInput = document.getElementById('answerInput');
    const pasapalabraButton = document.getElementById('pasapalabraButton');
    const submitAnswerBtnIcon = document.getElementById('submitAnswerBtnIcon');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const correctCountDisplay = document.getElementById('correctCount');
    const passedCountDisplay = document.getElementById('passedCount');
    const incorrectCountDisplay = document.getElementById('incorrectCount');
    const timerBar = document.getElementById('timerBar');
    const gameRulesModal = document.getElementById('gameRulesModal');
    const startGameButton = document.getElementById('startGameButton');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const helpButton = document.getElementById('helpButton');
    const timerCount = document.getElementById('timerCount');
    const gameContainer = document.getElementById('gameContainer');
    const playerNameDisplay = document.querySelector('.player-name');
    // --- End Moved DOM Elements ---
    
    // --- NUEVOS Elementos DOM para Pantalla de Carga ---
    const loadingStartScreen = document.getElementById('loadingStartScreen');
    const loadingMessageText = document.getElementById('loadingMessageText');
    const startGameAfterLoadingButton = document.getElementById('startGameAfterLoadingButton');
    // --- FIN NUEVOS Elementos DOM ---
    
    // <<< Referencia para el event listener del botón de inicio >>>
    let startGameClickListener = null;
    
    // Rules modal elements
    // const gameRulesModal = document.getElementById('gameRulesModal');
    // const startGameButton = document.getElementById('startGameButton');
    // const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    
    // Handle difficulty selection
    difficultyButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set game time and maxErrors based on difficulty
            const difficulty = this.getAttribute('data-difficulty');
            switch(difficulty) {
                case 'facil':
                    totalTime = 360; // Antes 300. Usuario indica 360s.
                    maxErrors = 4;   // Antes 4. Para ganar con hasta 4 errores, se pierde con 5.
                    break;
                case 'dificil':
                    totalTime = 240; // Antes 180. Usuario indica 240s.
                    maxErrors = 2;   // Antes 2. Para ganar con hasta 2 errores, se pierde con 3.
                    break;
                default: // normal (medio)
                    totalTime = 300; // Antes 240. Usuario indica 300s para MEDIO.
                    maxErrors = 3;   // Antes 3. Para ganar con hasta 3 errores, se pierde con 4.
            }
            console.log(`Dificultad seleccionada: ${difficulty}, Tiempo: ${totalTime}s, Errores Máx (umbral de derrota): ${maxErrors}`);
        });
    });
    
    // Start button click handler
    if (startGameButton) {
        startGameButton.addEventListener('click', function() {
            // Hide the modal
            gameRulesModal.classList.remove('active');
            
            // Initialize the game
            initGame();
        });
    }
    
    // Initialize the game
    function initGame() {
        // <<< INICIO: GUARDAR ESTADO INICIAL DE LOGROS >>>
        if (window.CrackTotalLogrosAPI && typeof window.CrackTotalLogrosAPI.cargarLogros === 'function') {
            try {
                logrosAlInicioDePartida = JSON.parse(JSON.stringify(window.CrackTotalLogrosAPI.cargarLogros()));
                console.log("Estado de logros al inicio de la partida:", logrosAlInicioDePartida);
            } catch (e) {
                console.error("Error al clonar logros iniciales:", e);
                logrosAlInicioDePartida = {}; // Fallback a objeto vacío
            }
        } else {
            console.warn("CrackTotalLogrosAPI no está disponible al iniciar el juego. No se podrán rastrear nuevos logros para esta partida.");
            logrosAlInicioDePartida = {};
        }
        // <<< FIN: GUARDAR ESTADO INICIAL DE LOGROS >>>

        // --- MOSTRAR PANTALLA DE CARGA, OCULTAR JUEGO --- 
        if (loadingStartScreen) loadingStartScreen.style.display = 'flex'; // Mostrar pantalla de carga
        if (gameContainer) gameContainer.style.display = 'none'; // Ocultar contenedor del juego
        if (startGameAfterLoadingButton) {
            startGameAfterLoadingButton.disabled = true;
            startGameAfterLoadingButton.textContent = 'Cargando Preguntas...';
        }
        if (loadingMessageText) loadingMessageText.textContent = 'Consultando el VAR de las preguntas...';
        // --- FIN MOSTRAR PANTALLA DE CARGA ---

        // Reset game state
        currentLetterIndex = 0;
        correctAnswers = 0;
        incorrectAnswers = 0;
        passedAnswers = 0;
        pendingLetters = [];
        letterStatuses = {};
        hintDisplayed = {};
        letterHints = {};
        gameErrors = [];
        usedAnswerSignatures = new Set(); // <--- Reset used answers for new game
        gameUsedQuestionIndices = {}; // <<<--- Reset used QUESTIONS for new game
        alphabet.split('').forEach(letter => { gameUsedQuestionIndices[letter] = []; }); // Initialize arrays
        timeLeft = totalTime;
        helpUsed = 0;
        incompleteAnswersUsed = 0;
        completedRounds = 0;
        
        // Update score displays
        updateScoreDisplays();
        
        // <<<--- START: Fetch questions from the single merged file --- >>>
        const questionFile = 'data/preguntas_finalisimas_v4.json';

        fetch(questionFile)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for file ${questionFile}`);
                }
                return response.json();
            })
            .then(loadedQuestions => {
                // Assign the loaded questions directly
                questions = loadedQuestions; // Assumes the merged file has the correct array structure

                // Optional: Shuffle questions within each letter for randomness (if needed)
                questions.forEach(letterData => {
                    if (letterData.preguntas && Array.isArray(letterData.preguntas)) {
                        letterData.preguntas.sort(() => Math.random() - 0.5);
                    }
                });
                // <<<--- END: Fetch questions from the single merged file --- >>>

                // Check if questions were loaded correctly
                if (!questions || !Array.isArray(questions) || questions.length === 0) {
                    console.error("Error: No se pudieron cargar las preguntas o el archivo está vacío.");
                    if (loadingMessageText) loadingMessageText.textContent = 'Error al cargar preguntas. Intenta recargar la página.';
                    if (startGameAfterLoadingButton) {
                        startGameAfterLoadingButton.textContent = 'Error de Carga';
                        startGameAfterLoadingButton.disabled = true; 
                    }
                    // No mostrar el botón de reintento aquí, ya que la lógica de reintento requeriría re-llamar initGame o fetch.
                    // Es mejor que el usuario recargue la página si esto falla críticamente.
                    return; // Stop game initialization
                }
                
                console.log("Preguntas cargadas y mezcladas.");

                // --- PREPARAR JUEGO PERO NO INICIAR VISUALMENTE --- 
                // setupLetters(); 
                // setupLetterStatuses();
                // NO LLAMAR A startGame() aquí todavía

                // --- ACTUALIZAR BOTÓN Y MENSAJE DE CARGA --- 
                if (loadingMessageText) loadingMessageText.textContent = '¡Todo listo para jugar!';
                if (startGameAfterLoadingButton) {
                    startGameAfterLoadingButton.textContent = '¡COMENZAR AHORA!';
                    startGameAfterLoadingButton.disabled = false;
                    
                    // Eliminar listener previo si existe para evitar duplicados
                    if (startGameClickListener) {
                        startGameAfterLoadingButton.removeEventListener('click', startGameClickListener);
                    }
                    
                    // Definir el nuevo listener
                    startGameClickListener = () => {
                        if (loadingStartScreen) loadingStartScreen.style.display = 'none';
                        if (gameContainer) gameContainer.style.display = 'flex'; // O 'block' según tus CSS para gameContainer
                        
                        // Ahora sí, configurar y empezar el juego visualmente
                        setupLetters(); 
                        setupLetterStatuses();
                        startGame(); // Inicia timer y carga la primera pregunta
                        
                        // Añadir botón de ayuda después de que el juego es visible y configurado
                        // setTimeout(addHelpButton, 100); // <-- MOVIDO para después de startGame()
                    };
                    
                    startGameAfterLoadingButton.addEventListener('click', startGameClickListener);
                }

            })
            .catch(error => {
                console.error('Error loading questions:', error);
                if (loadingMessageText) loadingMessageText.textContent = `Error cargando preguntas: ${error.message}. Revisa la consola e intenta recargar.`;
                if (startGameAfterLoadingButton) {
                    startGameAfterLoadingButton.textContent = 'Error de Carga';
                    startGameAfterLoadingButton.disabled = true;
                }
            });
    }
    
    // Setup the letter structure (called once)
    function setupLetters() {
        lettersContainer.innerHTML = ''; // Clear existing letters
        alphabet.split('').forEach((letter) => {
            const letterElement = document.createElement('div');
            letterElement.className = 'letter';
            letterElement.textContent = letter;
            letterElement.dataset.letter = letter;

            const hintElement = document.createElement('span');
            hintElement.className = 'letter-hint';
            hintElement.id = `hint-${letter}`;
            letterElement.appendChild(hintElement);

            lettersContainer.appendChild(letterElement);

            // Add click event to jump to that letter
            letterElement.addEventListener('click', () => {
                if (letterStatuses[letter] === 'unanswered' || letterStatuses[letter] === 'pending') {
                    goToLetter(letter);
                }
            });
        });
        positionLetters(); // Position letters initially

        // Add hint styles if not present
        if (!document.getElementById('hint-styles')) {
            const style = document.createElement('style');
            style.id = 'hint-styles';
            style.textContent = `
                .letter-hint {
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 12px;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 2px 5px;
                    border-radius: 3px;
                    margin-top: 5px;
                    white-space: nowrap;
                    display: none;
                }
                .letter.with-hint .letter-hint {
                    display: block;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Position letters dynamically (can be called on resize)
    function positionLetters() {
        if (!lettersContainer) return; // Exit if container not found

        const allLetterElements = lettersContainer.querySelectorAll('.letter');
        if (!allLetterElements || allLetterElements.length === 0) return; // Exit if no letters

        const containerWidth = lettersContainer.offsetWidth;
        const radius = containerWidth / 2;

        // Get letter size dynamically from the first letter element
        const firstLetterStyle = window.getComputedStyle(allLetterElements[0]);
        const letterSize = parseFloat(firstLetterStyle.width); // Use width (assuming square)

        if (isNaN(letterSize) || letterSize <= 0) {
            console.error("Could not determine letter size dynamically.");
            return; // Cannot position without size
        }

        const adjustedRadius = radius - (letterSize / 2);

        allLetterElements.forEach((letterElement, index) => {
            const angleRadians = (index / alphabet.length) * 2 * Math.PI;
            const posX = adjustedRadius * Math.sin(angleRadians);
            const posY = -adjustedRadius * Math.cos(angleRadians);
            letterElement.style.transform = `translate(${posX}px, ${posY}px)`;
        });
    }

    // Setup the letter statuses (called once)
    function setupLetterStatuses() {
        alphabet.split('').forEach(letter => {
            letterStatuses[letter] = 'unanswered';
            pendingLetters.push(letter);
        });
    }

    // Start the game logic
    function startGame() {
        currentLetterIndex = 0;
        startTimer();
        loadQuestion();
        addHelpButton(); // <-- LLAMAR addHelpButton AQUÍ
    }
    
    // Load question for the current letter
    function loadQuestion() {
        console.log(`--- loadQuestion called. Index: ${currentLetterIndex}, Pending Letters: [${pendingLetters.join(', ')}] ---`); // Log at start
        const questionTextElement = document.getElementById('questionText');
        const currentLetterTextElement = document.getElementById('currentLetterText');
        const questionHeader = document.querySelector('.question-header');
        const headerText = questionHeader?.querySelector('h3');

        if (!questionTextElement || !currentLetterTextElement || !questionHeader || !headerText) {
            console.error("Critical UI elements for question display not found!");
            if(timerInterval) clearInterval(timerInterval);
            // Display error to user?
            return;
        }

        if (pendingLetters.length === 0) {
            endGame('victory'); // Victoria si no quedan letras pendientes
            return;
        }

        // NUEVA COMPROBACIÓN: Si todas las letras restantes ya fueron respondidas incorrectamente
        const allRemainingAreIncorrect = pendingLetters.every(letter => letterStatuses[letter] === 'incorrect');
        if (pendingLetters.length > 0 && allRemainingAreIncorrect) {
            console.log("Todas las letras pendientes han sido respondidas incorrectamente. Finalizando juego.");
            // Si se llegó aquí, no se ganó y todas las letras tuvieron su oportunidad y fueron incorrectas.
            // Se considera una derrota porque el rosco no se completó satisfactoriamente.
            endGame('defeat'); 
            return;
        }

        const currentLetter = pendingLetters[currentLetterIndex];
        // <<<--- LÓGICA PARA 'todas_letras_pasadas_una_vuelta' --- >>>
        if (currentLetter) { // Asegurarse de que currentLetter no es undefined
            letrasVisitadasEnVueltaActual.add(currentLetter);
            if (letrasVisitadasEnVueltaActual.size === alphabet.length) {
                todasLetrasVisitadasAlMenosUnaVez = true;
            }
        }
        // <<<--- FIN LÓGICA --- >>>
        const letterData = questions.find(item => item.letra === currentLetter);

        if (letterData && letterData.preguntas && letterData.preguntas.length > 0) {
            let question = null;
            let currentQuestionIndex = -1; // Keep track of the index being shown
            let foundQuestion = false;
            let potentialQuestion = null;
            let potentialAnswer = null;

            // Find the first question index for this letter that hasn't been *correctly* answered yet
            // AND whose answer doesn't conflict with previous correct answers.
            // Iterate sequentially through the pre-shuffled list
            for (let testIndex = 0; testIndex < letterData.preguntas.length; testIndex++) {
                // Skip if this specific index has ALREADY BEEN ANSWERED CORRECTLY
                if (gameUsedQuestionIndices[currentLetter] && gameUsedQuestionIndices[currentLetter].includes(testIndex)) {
                    continue;
                }

                potentialQuestion = letterData.preguntas[testIndex];
                potentialAnswer = potentialQuestion.respuesta;

                // Skip if answer conflicts with already CORRECTED answers 
                if (checkAnswerConflict(potentialAnswer, usedAnswerSignatures)) {
                     continue; 
                }

                // Found a suitable question (not answered correctly yet, no answer conflict)
                currentQuestionIndex = testIndex; // Store the index we are showing
                // DO NOT mark as used here anymore -> gameUsedQuestionIndices[currentLetter].push(currentQuestionIndex); 
                question = potentialQuestion;
                letterHints[currentLetter] = potentialAnswer.substring(0, 3); // Prepare hint
                foundQuestion = true;
                break; // Exit loop once a suitable question is found
            }

            if (!foundQuestion) {
                console.warn(`No suitable (unused, non-conflicting) question found for letter ${currentLetter}. Treating as passed.`);
                // If no question could be found (e.g., all conflict or were somehow marked used)
                // Treat it as if the user passed silently.
                pasapalabra(true); 
                return; 
            }

            // --- Display the found question --- 
            console.log(`Displaying question for letter: ${currentLetter}. Question: ${question.pregunta.substring(0,30)}...`); // Log before display update
            currentLetterTextElement.textContent = currentLetter;
            questionTextElement.textContent = question.pregunta;

            // Remove previous type classes
            questionTextElement.classList.remove('question-type-starts', 'question-type-contains');
            questionHeader.classList.remove('question-type-starts', 'question-type-contains');

            // Update header and question text style based on type
            if (question.pregunta.startsWith('CONTIENE')) {
                headerText.innerHTML = `Contiene <span id="currentLetterText">${currentLetter}</span>:`;
                questionHeader.classList.add('question-type-contains');
                questionTextElement.classList.add('question-type-contains');
            } else {
                headerText.innerHTML = `Comienza con <span id="currentLetterText">${currentLetter}</span>:`;
                questionHeader.classList.add('question-type-starts');
                questionTextElement.classList.add('question-type-starts');
            }

            updateLetterStyles();
            answerInput.value = '';
            answerInput.focus();

            if (hintDisplayed[currentLetter]) {
                showHint();
            }
            // --- End Display --- 

        } else {
            // No questions for this letter or invalid data
            console.warn(`No questions found or invalid data for letter ${currentLetter}. Skipping.`);
            nextLetter(); // Skip to the next letter
        }
    }
    
    // Update letter styles based on status
    function updateLetterStyles() {
        document.querySelectorAll('.letter').forEach(element => {
            const letter = element.dataset.letter;
            element.className = 'letter'; // Reset classes
            
            // Add status class
            if (letterStatuses[letter] === 'correct') {
                element.classList.add('correct');
            } else if (letterStatuses[letter] === 'incorrect') {
                element.classList.add('incorrect');
            } else if (letterStatuses[letter] === 'pending') {
                element.classList.add('pending');
            }
            
            // Highlight current letter
            if (letter === pendingLetters[currentLetterIndex]) {
                element.classList.add('active');
            }
            
            // Mostrar pista si ya fue revelada
            if (hintDisplayed[letter]) {
                element.classList.add('with-hint');
                const hintElement = element.querySelector(`#hint-${letter}`);
                if (hintElement) {
                    hintElement.textContent = letterHints[letter];
                }
            }
        });
    }
    
    // Move to the next available letter
    function nextLetter() {
        // Incrementar el índice para ir a la siguiente letra
        currentLetterIndex = (currentLetterIndex + 1) % pendingLetters.length;
        
        // Si volvemos al principio, incrementar el contador de vueltas completadas
        if (currentLetterIndex === 0 && pendingLetters.length > 0) {
            completedRounds++;
            // <<<--- RESET PARA 'todas_letras_pasadas_una_vuelta' (si se quiere por vuelta y no por partida) --- >>>
            // letrasVisitadasEnVueltaActual.clear(); // Si el logro fuera por *cada* vuelta completa
            // <<<--- FIN RESET --- >>>

            // Al completar una vuelta, limpiar el estado "pending"
            if (completedRounds > 0) {
                for (let letter of pendingLetters) {
                    if (letterStatuses[letter] === 'pending') {
                        letterStatuses[letter] = 'unanswered';
                    }
                }
                // Actualizar la visualización de las letras
                updateLetterStyles();
            }
        }
        
        loadQuestion();
    }
    
    // Go to a specific letter
    function goToLetter(letter) {
        const index = pendingLetters.indexOf(letter);
        if (index !== -1) {
            currentLetterIndex = index;
            loadQuestion();
        }
    }
    
    // Check the user's answer
    function checkAnswer(userAnswer) {
        const currentLetter = pendingLetters[currentLetterIndex];
        const letterData = questions.find(item => item.letra === currentLetter);

        // Ensure currentQuestionIndex is valid for the letterData
        if (letterData && letterData.preguntas && currentQuestionIndex < letterData.preguntas.length) {
            const correctAnswerFull = letterData.preguntas[currentQuestionIndex].respuesta;
            
            // Normalizar ambas respuestas usando la nueva función
            const correctAnswerNorm = normalizeResponseText(correctAnswerFull);
            const userAnswerNorm = normalizeResponseText(userAnswer);

            let isCorrect = false; // Initialize isCorrect

            // Check for incompleteness first...
            if (isIncompleteAnswer(userAnswerNorm, correctAnswerNorm)) {
                 if (incompleteAnswersUsed < maxIncompleteAnswers) {
                    incompleteAnswersUsed++;
                    const remainingAttempts = maxIncompleteAnswers - incompleteAnswersUsed;
                    // Show specific feedback for incomplete answer
                    showIncompleteFeedback(`Respuesta incompleta. Te ${remainingAttempts === 1 ? 'queda 1 intento' : 'quedan ' + remainingAttempts + ' intentos'} para respuestas incompletas.`);
                    // DO NOT clear input here, let user edit
                    // answerInput.value = '';
                    answerInput.focus();
                    return; // Stop processing for this attempt
                } else {
                     // User is out of incomplete attempts, show message and treat as incorrect
                     showTemporaryFeedback("Respuesta incompleta y sin intentos restantes. Se cuenta como error.", "error", 3000);
                     // Fall through to the incorrect logic below
                     console.log("Incomplete answer, but no attempts left. Treating as incorrect.");
                     // No return here, let it be processed as incorrect
                }
            }

            // Check for correctness if not handled as incomplete
            isCorrect = isAnswerCorrectEnough(userAnswerNorm, correctAnswerNorm);

            if (!isCorrect) {
                // --- INCORRECT --- 
                incorrectAnswers++; // Increment incorrect count
                // <<<--- LÓGICA PARA LOGROS DE ERROR --- >>>
                if (currentLetter === 'A' && correctAnswers === 0 && incorrectAnswers === 1 && passedAnswers === 0) { //Aproximado para primer error en A
                    errorEnLetraAEstaPartida = true;
                }
                if (incorrectAnswers === maxErrors -1) {
                    estuvoAUnErrorDePerderEstaPartida = true;
                }
                letrasAcertadasSeguidasEstaPartida = 0; // Reset racha de aciertos
                // <<<--- FIN LÓGICA --- >>>
                profileStats.totalIncorrectAnswers += 1; // Update aggregate stats
                
                // Record error details
                const questionText = letterData.preguntas[currentQuestionIndex].pregunta;
                gameErrors.push({
                    letter: currentLetter,
                    question: questionText,
                    userAnswer: userAnswer,
                    correctAnswer: correctAnswerFull
                });

                // Mark letter status
                letterStatuses[currentLetter] = 'incorrect';
                
                // --- Check for DEFEAT --- 
                if (incorrectAnswers >= maxErrors) {
                    saveProfileStats(profileStats); 
                    endGame('defeat');
                    return; // Stop execution
                }

                // --- NUEVA VERIFICACIÓN DE ROSCO COMPLETO (POR RESPUESTAS TOTALES) ---
                if (correctAnswers + incorrectAnswers === alphabet.length) {
                    saveProfileStats(profileStats);
                    // Si llegamos aquí, es porque incorrectAnswers < maxErrors (chequeo previo)
                    // y el rosco está completo.
                    endGame('victory');
                    return; // Juego terminado
                }
                
                // --- Update UI and move to next letter --- 
                updateScoreDisplays();
                updateLetterStyles();
                // DO NOT remove from pendingLetters
                nextLetter(); // Move to the next letter immediately

            } else {
                // --- CORRECT --- 
                correctAnswers++;
                // <<<--- LÓGICA PARA LOGROS DE ACIERTO --- >>>
                letrasAcertadasSeguidasEstaPartida++;
                if (letrasAcertadasSeguidasEstaPartida > maxLetrasAcertadasSeguidasEstaPartida) {
                    maxLetrasAcertadasSeguidasEstaPartida = letrasAcertadasSeguidasEstaPartida;
                }
                if (hintDisplayed[currentLetter] && letterHints[currentLetter]) { // Si se usó ayuda para esta pregunta
                    usoAyudaYAciertoEnMismaPregunta = true; // Marcar para logro 'ayuda_sabia'
                }
                 // Para 'ultima_letra_victoria'
                if (pendingLetters.length === 1) {
                    ultimaLetraPendienteAntesDeVictoria = true;
                }
                // <<<--- FIN LÓGICA --- >>>
                profileStats.totalCorrectAnswers += 1; // Update aggregate stats

                // <<<--- MARK QUESTION AS USED HERE (on correct answer) --- >>>
                if (!gameUsedQuestionIndices[currentLetter].includes(currentQuestionIndex)){
                    gameUsedQuestionIndices[currentLetter].push(currentQuestionIndex);
                }
                usedAnswerSignatures.add(correctAnswerNorm); // Add CORRECT answer signature (ya normalizada)
                console.log("Added to used signatures:", correctAnswerNorm, usedAnswerSignatures);

                // Mark letter status
                letterStatuses[currentLetter] = 'correct';

                // --- Update UI and remove letter --- 
                updateScoreDisplays();
                updateLetterStyles();
                const indexToRemove = pendingLetters.indexOf(currentLetter);
                if (indexToRemove > -1) {
                    pendingLetters.splice(indexToRemove, 1);
                }

                // Adjust index for next question load
                if (currentLetterIndex >= pendingLetters.length && pendingLetters.length > 0) {
                    currentLetterIndex = 0; 
                } // No change needed if index is still valid

                // --- VERIFICACIÓN DE ROSCO COMPLETO (POR RESPUESTAS TOTALES) ---
                if (correctAnswers + incorrectAnswers === alphabet.length) {
                    saveProfileStats(profileStats);
                    if (incorrectAnswers < maxErrors) {
                        endGame('victory');
                    } else {
                        endGame('defeat'); // Se completó, pero con demasiados errores
                    }
                    return; // Juego terminado
                }

                // Condición 1: Completar el rosco (todas las letras acertadas) // <-- ESTE BLOQUE SERÁ ELIMINADO POR EL ANTERIOR
                // if (pendingLetters.length === 0) {
                //     saveProfileStats(profileStats); // Guardar stats antes de llamar a endGame
                //     if (incorrectAnswers < maxErrors) { // maxErrors ya depende de la dificultad
                //         endGame('victory');
                //     } else {
                //         endGame('defeat'); // Demasiados errores aunque se haya completado el rosco
                //     }
                //     return; // Stop execution
                // }

                // Condición 2: Victoria anticipada por alto rendimiento
                // const VICTORIA_ANTICIPADA_ACIERTOS = 22; 
                // if (correctAnswers >= VICTORIA_ANTICIPADA_ACIERTOS && incorrectAnswers < maxErrors) {
                //     console.log(`Victoria anticipada: ${correctAnswers} aciertos con ${incorrectAnswers} errores (límite ${maxErrors}).`);
                //     saveProfileStats(profileStats); 
                //     endGame('victory');
                //     return; // Stop execution
                // }

                console.log(`Correct answer for ${currentLetter}. Pending letters: [${pendingLetters.join(', ')}]}. Next index: ${currentLetterIndex}.`); // Log before timeout

                // --- Load next question after delay --- 
                setTimeout(() => {
                     answerInput.value = ''; 
                     // Check if the game hasn't ended in the meantime
                     if (timerInterval) { // Check if timer is still active as proxy for game state
                         console.log(`Timeout finished. Calling loadQuestion for index: ${currentLetterIndex}, letter: ${pendingLetters[currentLetterIndex]}`); // Log inside timeout
                         loadQuestion();
                     } else {
                         console.error("Timeout finished, BUT timerInterval was null/cleared. Skipping loadQuestion."); // Log if timerInterval is missing
                     } 
                }, 150); 
            }

        } else {
            console.error(`Could not find question data for letter ${currentLetter} at index ${currentQuestionIndex}`);
            // Maybe skip the letter or show an error
            nextLetter();
        }
    }
    
    // Determina si una respuesta es incompleta (REFINED LOGIC)
    function isIncompleteAnswer(userAnswerNorm, correctAnswerNorm) {
        // Normalize further: remove extra spaces
        userAnswerNorm = userAnswerNorm.replace(/\s+/g, ' ').trim();
        correctAnswerNorm = correctAnswerNorm.replace(/\s+/g, ' ').trim();

        // Exact match is never incomplete
        if (userAnswerNorm === correctAnswerNorm) {
            return false;
        }

        // If user answer is significantly longer, it's not 'incomplete'
        // Allows for minor additions like "Club", "FC", etc.
        if (userAnswerNorm.length > correctAnswerNorm.length + 10) {
             return false;
        }

        // Avoid flagging if similarity is very high (likely a typo, not incompleteness)
        const similarity = calculateStringSimilarity(userAnswerNorm, correctAnswerNorm);
        if (similarity > 0.90) { // If 90% similar or more, treat as correct/incorrect
            return false;
        }

        const userWords = userAnswerNorm.split(' ').filter(w => w.length > 1); // Ignore short/empty words
        const correctWords = correctAnswerNorm.split(' ').filter(w => w.length > 1);

        // If correct answer is a single word, incomplete if user answer is a starting substring
        if (correctWords.length === 1 && userWords.length === 1) {
            // Check if user answer starts the correct answer AND is meaningfully shorter
            if (correctAnswerNorm.startsWith(userAnswerNorm) &&
                userAnswerNorm.length < correctAnswerNorm.length &&
                userAnswerNorm.length >= 3) { // Require at least 3 chars to count as incomplete start
                return true;
            }
        }

        // If correct answer has multiple words
        if (correctWords.length > 1) {
            // Case 1: User provided only a *proper* subset of the correct words
            // Check if all user words are present in the correct answer words
            let allUserWordsFound = userWords.length > 0 && userWords.every(uw => correctWords.includes(uw));
            if (allUserWordsFound && userWords.length < correctWords.length) {
                // This means user typed *some* correct words, but missed others.
                // Example: Correct="Lionel Messi", User="Lionel" -> true
                // Example: Correct="Real Madrid", User="Real" -> true
                return true;
            }

            // Case 2: User answer is a starting substring of the multi-word correct answer
            // Example: Correct="Real Madrid Club de Futbol", User="Real Madrid"
            // This might be considered incomplete depending on strictness.
            // Let's be less strict here: if it startsWith and similarity is decent (but not too high)
            // We already checked for high similarity above.
            if (correctAnswerNorm.startsWith(userAnswerNorm) &&
                userAnswerNorm.length < correctAnswerNorm.length &&
                userWords.length < correctWords.length) { // Ensure fewer words were typed
                // If similarity is moderate (e.g., > 0.6) it indicates they are on the right track but incomplete
                 if (similarity > 0.6) {
                     return true;
                 }
            }
        }

        // If none of the above specific incomplete conditions match, it's not incomplete.
        return false;
    }
    
    // Compare answers with tolerance for minor errors
    function isAnswerCorrectEnough(userAnswerNorm, correctAnswerNorm) { // Ambas ya vienen normalizadas
        // Exact match
        if (userAnswerNorm === correctAnswerNorm) {
            return true;
        }
        
        // Si la respuesta del usuario (ya normalizada) contiene la respuesta correcta (ya normalizada) completa
        // y la respuesta correcta es suficientemente larga para evitar falsos positivos con palabras cortas.
        if (correctAnswerNorm.length > 3 && userAnswerNorm.includes(correctAnswerNorm)) {
            return true;
        }
        
        // Calculate similarity and distance
        const similarityResult = calculateStringSimilarity(userAnswerNorm, correctAnswerNorm);

        // Permitir errores menores si la similitud es alta Y la distancia es mínima
        const similarityThreshold = 0.80; // Ajustado de 0.85 a 0.80
        const maxAllowedTypos = 2;    // Ajustado de 1 a 2

        return similarityResult.similarity >= similarityThreshold && similarityResult.distance <= maxAllowedTypos;
    }
    
    // Calculate string similarity (Levenshtein distance based)
    function calculateStringSimilarity(a, b) {
        if (a.length === 0) return { distance: 0, similarity: 0 };
        if (b.length === 0) return { distance: 0, similarity: 0 };
        
        // Calculate Levenshtein distance
        const matrix = [];
        
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        
        for (let i = 0; i <= a.length; i++) {
            matrix[0][i] = i;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i-1) === a.charAt(j-1)) {
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i-1][j-1] + 1, // Substitution
                        matrix[i][j-1] + 1,   // Insertion
                        matrix[i-1][j] + 1    // Deletion
                    );
                }
            }
        }
        
        // Calculate similarity as a percentage
        const maxLength = Math.max(a.length, b.length);
        const distance = matrix[b.length][a.length];
        const similarity = maxLength === 0 ? 1 : 1 - (distance / maxLength); // Handle empty strings case
        return { distance, similarity }; // Return both values
    }
    
    // Add help button functionality
    function addHelpButton() {
        const questionCard = document.querySelector('.question-card'); // Mover la obtención aquí dentro
        
        // <<< AÑADIR VERIFICACIÓN DE EXISTENCIA DE questionCard >>>
        if (!questionCard) {
            console.warn("addHelpButton: questionCard no encontrado en el DOM. No se pudo añadir/actualizar el botón de ayuda.");
            return; // Salir si no se encuentra el contenedor
        }
        // <<< FIN VERIFICACIÓN >>>

        // Check if help button already exists
        if (document.getElementById('helpButton')) {
            // Update help button text
            const helpButton = document.getElementById('helpButton');
            helpButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                HELP (${maxHelp - helpUsed})
            `;
            
            // Disable button if all help used
            if (helpUsed >= maxHelp) {
                helpButton.disabled = true;
                helpButton.classList.add('disabled');
            } else {
                helpButton.disabled = false;
                helpButton.classList.remove('disabled');
            }
            
            // Asegurar que el botón tenga el evento click
            helpButton.onclick = showHint;
            return;
        }
        
        // Create help button if it doesn't exist
        const helpButton = document.createElement('button');
        helpButton.type = 'button';
        helpButton.id = 'helpButton';
        helpButton.className = 'help-button';
        helpButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            HELP (${maxHelp - helpUsed})
        `;
        
        // Disable button if all help used
        if (helpUsed >= maxHelp) {
            helpButton.disabled = true;
            helpButton.classList.add('disabled');
        }
        
        // Add help functionality
        helpButton.onclick = showHint;
        
        // Insert help button in the right place
        questionCard.appendChild(helpButton);
    }
    
    // Función para mostrar pista
    function showHint() {
                const currentLetter = pendingLetters[currentLetterIndex];
        
        // Si ya se mostró la pista para esta letra, no consumir un HELP adicional
        if (!hintDisplayed[currentLetter]) {
            // Verificar si quedan ayudas disponibles
            if (helpUsed >= maxHelp) {
                // Optional: Show a message saying no more help available
                showTemporaryFeedback("No quedan más ayudas disponibles.", "info", 2000);
                return;
            }

            // Incrementar contador de ayudas usadas
                    helpUsed++;
                    profileStats.totalHelpUsed += 1; // Track aggregated help usage immediately

            // Actualizar el botón de ayuda
            const helpButton = document.getElementById('helpButton');
            if (helpButton) {
                helpButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    HELP (${maxHelp - helpUsed})
                    `;

                // Deshabilitar botón si ya no quedan ayudas
                    if (helpUsed >= maxHelp) {
                    helpButton.disabled = true;
                    helpButton.classList.add('disabled');
                    }
                }
            
            // Marcar que ya se mostró la pista para esta letra
            hintDisplayed[currentLetter] = true;
            // <<<--- LÓGICA PARA 'ayuda_sabia' (marcar que se usó ayuda) --- >>>
            // No se resetea usoAyudaYAciertoEnMismaPregunta aquí, se evalúa al acertar.
            // <<<--- FIN LÓGICA --- >>>
        }
        
        // Obtener la respuesta correcta
        const letterData = questions.find(item => item.letra === currentLetter);
        if (letterData && letterData.preguntas && currentQuestionIndex < letterData.preguntas.length) {
            const correctAnswer = letterData.preguntas[currentQuestionIndex].respuesta;
            const hint = correctAnswer.substring(0, 3); // Keep 3-letter hint

            // Mostrar la pista junto a la letra en el rosco
            const letterElement = document.querySelector(`.letter[data-letter="${currentLetter}"]`);
            if (letterElement) {
                letterElement.classList.add('with-hint');
                const hintElement = letterElement.querySelector(`#hint-${currentLetter}`);
                if (hintElement) {
                    hintElement.textContent = hint;
                }
            }
        } else {
             console.warn(`Could not find question data for letter ${currentLetter} to show hint.`);
        }
    }
    
    // Mark current letter as "pasapalabra"
    function pasapalabra(silent = false) { // Added silent parameter
        const currentLetter = pendingLetters[currentLetterIndex];
        // <<<--- LÓGICA PARA LOGROS DE PASAPALABRA --- >>>
        if (!silent) { // Solo contar pases iniciados por el usuario
           pasapalabraUsadoEnPartida++;
           profileStats.totalPassedAnswers +=1; // Actualizar stats globales de pases
        }
        letrasAcertadasSeguidasEstaPartida = 0; // Reset racha de aciertos al pasar
        // <<<--- FIN LÓGICA --- >>>

        // Only count as a user pass if not silent
        if (!silent && letterStatuses[currentLetter] === 'unanswered') {
            letterStatuses[currentLetter] = 'pending';
            passedAnswers++;
            updateScoreDisplays();
        } else if (letterStatuses[currentLetter] === 'unanswered') {
            // Mark as pending even if silent, so it cycles
            letterStatuses[currentLetter] = 'pending';
        }

        nextLetter();
        updateLetterStyles();
    }
    
    // Show feedback after answering (now just returns immediately)
    function showAnswerFeedback(isCorrect, correctAnswer) {
        // No feedback message shown - we just return immediately
        // Only letter color will indicate if answer was correct
        return Promise.resolve();
    }
    
    // Update the score display
    function updateScore() {
        scoreDisplay.textContent = `${correctAnswers}/${alphabet.length}`;
    }

    function updateScoreDisplays() {
        // Update all score displays
        updateScore();
    }
    
    // Start the timer
    function startTimer() {
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endGame('timeout');
            }
        }, 1000);
    }
    
    // Update timer display
    function updateTimerDisplay() {
        // Ensure totalTime is not zero to avoid division by zero
        if (totalTime <= 0) {
            timerBar.style.width = '0%';
            return;
        }

        const percentage = Math.max(0, (timeLeft / totalTime) * 100); // Ensure percentage is not negative
        timerBar.style.width = `${percentage}%`;

        // Update timer count
        const timerCount = document.getElementById('timerCount');
        if (timerCount) {
            timerCount.textContent = Math.max(0, timeLeft); // Ensure displayed time is not negative
        }

        // Change color when time is running out
        if (percentage < 20) {
            timerBar.style.backgroundColor = '#FF5470'; // red
        } else if (percentage < 50) {
            timerBar.style.backgroundColor = '#FF8E3C'; // orange
        } else {
            timerBar.style.backgroundColor = '#31D0AA'; // green (default)
        }
    }
    
    // End the game
    async function endGame(result = 'timeout') { // <--- Convertida a async
        clearInterval(timerInterval);

        // --- Deshabilitar Controles INMEDIATAMENTE ---
        if (answerInput) answerInput.disabled = true;
        if (pasapalabraButton) pasapalabraButton.disabled = true;
        if (submitAnswerBtnIcon) submitAnswerBtnIcon.disabled = true;
        const helpButton = document.getElementById('helpButton');
        if (helpButton) helpButton.disabled = true;
        // --- Fin Deshabilitar Controles ---
        
        const timeSpent = totalTime - timeLeft;
        // CALCULAR timeFormatted AQUÍ
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // --- MOVER CÁLCULO DE ESTADÍSTICAS AQUÍ ARRIBA ---
        const totalAnswered = correctAnswers + incorrectAnswers;
        const unanswered = alphabet.length - totalAnswered; // Se usa alphabet.length que es el total de letras
        const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
        // --- FIN MOVER CÁLCULO ---
        
        // --- Actualizar Estadísticas LOCALES --- 
        let profileStats = loadProfileStats();
        profileStats.gamesPlayed += 1;
        profileStats.totalCorrectAnswers += correctAnswers;
        profileStats.totalIncorrectAnswers += incorrectAnswers;
        profileStats.totalPassedAnswers += passedAnswers; // Assuming you track this
        profileStats.totalHelpUsed += helpUsed;

        let isWin = false;
        if (result === 'victory') {
            profileStats.gamesWon += 1;
            isWin = true;
            if (profileStats.fastestWinTime === null || timeSpent < profileStats.fastestWinTime) {
                profileStats.fastestWinTime = timeSpent;
            }
        } else if (result === 'defeat') {
            profileStats.gamesLostByErrors += 1;
        } else { // timeout
            profileStats.gamesLostByTimeout += 1;
        }

        if (correctAnswers > profileStats.bestScore) {
            profileStats.bestScore = correctAnswers;
        }

        saveProfileStats(profileStats);
        // --- Fin Actualizar Estadísticas LOCALES ---

        // --- INICIO: Guardar Partida en el HISTORIAL LOCAL ---
        const gameResultForHistory = {
            timestamp: new Date().toISOString(), // Usar ISO string para mejor compatibilidad
            result: result, // 'victory', 'defeat', or 'timeout'
            difficulty: document.querySelector('.difficulty-btn.active')?.dataset.difficulty || 'normal',
            correctAnswers: correctAnswers, // Aciertos de la partida actual
            incorrectAnswers: incorrectAnswers, // Errores de la partida actual
            timeSpent: timeSpent, // Tiempo en segundos
            timeSpentFormatted: timeFormatted, // timeFormatted AHORA ESTÁ DEFINIDO
        };
        addGameToHistory(gameResultForHistory);
        // --- FIN: Guardar Partida en el HISTORIAL LOCAL ---

        // --- INICIO: Guardar Resultados en FIREBASE ---
        try {
            const userId = getCurrentUserId(); // e.g., 'JugadorAnónimo' or 'PlayerName_NoSpace'
            const userDisplayName = getCurrentDisplayName(); // e.g., 'Jugador Anónimo' or 'Player Name'
            const difficultyActual = document.querySelector('.difficulty-btn.active')?.dataset.difficulty || 'normal';

            if (userId && userDisplayName) {
                // 1. Actualizar/crear el documento del usuario en la colección 'users'
                const userDocRef = doc(db, "users", userId);
                const userUpdateData = {
                    displayName: userDisplayName,
                    totalScore: increment(correctAnswers),
                    matchesPlayed: increment(1),
                    lastPlayed: serverTimestamp()
                };
                if (result === 'victory') {
                    userUpdateData.wins = increment(1);
                    // Potentially update fastestWinTime if it's a win and better than current
                    // This needs reading the doc first or a transaction, for simplicity, can be added later
                } else { // defeat or timeout
                    userUpdateData.totalLosses = increment(1);
                }
                userUpdateData.totalErrors = increment(incorrectAnswers); // Assuming incorrectAnswers is tracked

                await setDoc(userDocRef, userUpdateData, { merge: true });
                console.log("User stats updated in Firebase for:", userId);

                // 2. Añadir la partida a la colección 'matches'
                const matchDocData = {
                    timestamp: serverTimestamp(),
                    result: result, // 'victory', 'defeat', 'timeout'
                    difficulty: difficultyActual,
                    timeSpent: timeSpent,
                    players: [{
                        playerId: userId,
                        displayName: userDisplayName,
                        score: correctAnswers, // Score for this specific game (correct answers)
                        errors: incorrectAnswers
                    }],
                    passes: passedAnswers, // Pasalache specific
                    gameMode: "Pasalache" // To distinguish from other games
                };
                await addDoc(collection(db, "matches"), matchDocData);
                console.log("Match data added to Firebase.");

            } else {
                console.warn("User ID or Display Name not available, cannot save to Firebase.");
            }
        } catch (error) {
            console.error("Error saving game result to Firebase:", error);
            // Optionally, inform the user via a modal or a non-intrusive message
            showTemporaryFeedback("Error al guardar el ranking online.", "error", 5000);
        }
        // --- FIN: Guardar Resultados en FIREBASE ---

        // <<<--- INICIO: INTENTAR DESBLOQUEAR LOGROS RELEVANTES A LA PARTIDA ACTUAL --- >>>
        if (window.CrackTotalLogrosAPI && typeof window.CrackTotalLogrosAPI.intentarDesbloquearLogro === 'function') {
            console.log("PASA: Intentando desbloquear logros...");
            let desbloqueado; 
            const dificultadActual = document.querySelector('.difficulty-btn.active')?.dataset.difficulty || 'normal';

            // Logros basados en número de partidas jugadas (profileStats)
            if (profileStats.gamesPlayed >= 1) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('partida_1');
            if (profileStats.gamesPlayed >= 5) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('partida_5');
            if (profileStats.gamesPlayed >= 25) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('partida_25');
            if (profileStats.gamesPlayed >= 50) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('partida_50'); // NUEVO
            if (profileStats.gamesPlayed >= 100) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('partida_100');
            if (profileStats.gamesPlayed >= 250) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('partida_250'); // NUEVO

            // Logros de Victoria (profileStats y resultado partida)
            if (isWin) { // isWin se define más arriba en tu código existente
                window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_1');
                if (profileStats.gamesWon >= 5) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_5'); // NUEVO
                if (profileStats.gamesWon >= 25) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_25'); // NUEVO
                if (profileStats.gamesWon >= 50) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_50'); // NUEVO
                
                // Logros de racha (requieren que profileStats tenga currentWinStreak, si no, omitir o adaptar)
                // Asumiendo que se actualiza profileStats.currentWinStreak en algún lado
                // if (profileStats.currentWinStreak >= 2) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('racha_2');
                // if (profileStats.currentWinStreak >= 3) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('racha_3'); // NUEVO
                // if (profileStats.currentWinStreak >= 5) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('racha_5');
                // if (profileStats.currentWinStreak >= 10) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('racha_10');
            }

            // Logros de Aciertos en la Partida (correctAnswers)
            if (correctAnswers >= 5) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('aciertos_5'); // NUEVO
            if (correctAnswers >= 10) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('aciertos_10');
            if (correctAnswers >= 15) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('aciertos_15');
            if (correctAnswers >= 20) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('aciertos_20');
            if (correctAnswers >= 25) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('aciertos_25');
            if (correctAnswers === 26) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('rosco_casi_perfecto'); // NUEVO
            if (isWin && correctAnswers === alphabet.length) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('rosco_completo');
            if (correctAnswers === 13) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('aciertos_exactos_13'); // NUEVO
            
            // Logros de Aciertos Totales (profileStats)
            if (profileStats.totalCorrectAnswers >= 100) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('total_aciertos_100');
            if (profileStats.totalCorrectAnswers >= 250) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('total_aciertos_250'); // NUEVO
            if (profileStats.totalCorrectAnswers >= 500) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('total_aciertos_500');
            if (profileStats.totalCorrectAnswers >= 1000) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('total_aciertos_1000');
            if (profileStats.totalCorrectAnswers >= 2000) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('total_aciertos_2000'); // NUEVO

            // Logro de Precisión
            if (isWin && accuracy >= 90) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('precision_alta_partida'); // NUEVO

            // Logros de Dificultad y Desafío específicos de la partida
            if (isWin) {
                if (dificultadActual === 'facil') window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_facil');
                if (dificultadActual === 'normal') {
                    window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_normal');
                    if (incorrectAnswers === 0) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('dificultad_normal_perfecta'); // NUEVO
                }
                if (dificultadActual === 'dificil') {
                    window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_dificil');
                    // if (profileStats.gamesWonDificil >= 5) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victorias_dificil_5'); // Necesita gamesWonDificil en profileStats
                    if (helpUsed === 0) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_dificil_sin_ayuda'); // NUEVO
                    if (incorrectAnswers === 0) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_sin_errores_dificil'); // NUEVO
                }
                if (incorrectAnswers === 0) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('partida_perfecta');
                if (helpUsed === 0 && incorrectAnswers === 0) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('sin_ayuda_ni_errores'); // NUEVO
                if (helpUsed === 0) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('sin_ayuda');
                if (timeSpent < 120) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_rapida');
                if (timeSpent > 240) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_lenta');
                if (pasapalabraUsadoEnPartida === 0) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_sin_pasar'); // NUEVO
                if (estuvoAUnErrorDePerderEstaPartida) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_remontada'); // NUEVO
                if (completedRounds <= 0 && correctAnswers === alphabet.length) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('rosco_en_primera_vuelta'); // NUEVO (asume completedRounds es 0 en la primera vuelta)
                if (errorEnLetraAEstaPartida) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('primera_pregunta_error_luego_victoria'); // NUEVO
                if (ultimaLetraPendienteAntesDeVictoria && pendingLetters.length === 0) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('ultima_letra_victoria'); // NUEVO
                 if (incorrectAnswers === maxErrors) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_limite');
                 if (timeLeft < 10 && timeLeft > 0) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_agonica');
                 if (helpUsed === 1) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('victoria_con_1_ayuda'); // NUEVO
            }

            // Logros Misceláneos (Algunos dependen de stats globales que se actualizan aquí, otros de la partida)
            // if (profileStats.totalPassedAnswers >= 50) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('pasa_50'); // Necesita que totalPassedAnswers se guarde en profileStats
            if (pasapalabraUsadoEnPartida > 15) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('pasa_mucho_partida'); // NUEVO
            // if (profileStats.totalHelpUsed >= 25) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('help_25'); // Ya cubierto por totalHelpUsed en profileStats
            if (usoAyudaYAciertoEnMismaPregunta) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('ayuda_sabia'); // NUEVO
            // if (profileStats.answeredCorrectlyWithLetterA >= 10) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('rey_a'); // Necesita contador específico
            // if (profileStats.gamesLost >= 10) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('corazon_valiente'); // Necesita gamesLost en profileStats
            if (maxLetrasAcertadasSeguidasEstaPartida >= 5) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('letras_seguidas_5'); // NUEVO
            if (result === 'defeat' && correctAnswers >= 20) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('derrota_honrosa'); // NUEVO
            if (result !== 'victory' && timeSpent < 30) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('partida_rapidisima_perdida'); // NUEVO
            if (timeSpent > 600) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('partida_10_min'); // NUEVO
            if (incorrectAnswers === 1) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('errores_exactos_1'); // NUEVO
            if (todasLetrasVisitadasAlMenosUnaVez) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('todas_letras_pasadas_una_vuelta'); // NUEVO

            // --- Logros de racha (necesitan un manejo más específico de 'currentWinStreak' en profileStats) ---
            // Ejemplo si se añade 'currentWinStreak' a profileStats y se actualiza correctamente:
            /*
            if (isWin) {
                profileStats.currentWinStreak = (profileStats.currentWinStreak || 0) + 1;
            } else {
                profileStats.currentWinStreak = 0;
            }
            saveProfileStats(profileStats); // Guardar racha actualizada

            if (profileStats.currentWinStreak >= 2) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('racha_2');
            if (profileStats.currentWinStreak >= 3) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('racha_3');
            if (profileStats.currentWinStreak >= 5) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('racha_5');
            if (profileStats.currentWinStreak >= 10) window.CrackTotalLogrosAPI.intentarDesbloquearLogro('racha_10');
            */
           // --- Fin ejemplo racha ---


        } else {
            console.warn("PASA: CrackTotalLogrosAPI no está disponible al finalizar el juego.");
        }
        // <<<--- FIN: INTENTAR DESBLOQUEAR LOGROS --- >>>

        // <<<--- INICIO: DETECTAR Y MOSTRAR NUEVOS LOGROS --- >>>
        let nuevosLogrosDesbloqueadosEnEstaPartida = [];
        if (window.CrackTotalLogrosAPI && typeof window.CrackTotalLogrosAPI.cargarLogros === 'function' && typeof window.CrackTotalLogrosAPI.getTodosLosLogrosDef === 'function') {
            const logrosDespuesPartida = window.CrackTotalLogrosAPI.cargarLogros();
            const todosLosLogrosDef = window.CrackTotalLogrosAPI.getTodosLosLogrosDef();

            todosLosLogrosDef.forEach(logroDef => {
                const idLogro = logroDef.id;
                const estabaDesbloqueadoAntes = logrosAlInicioDePartida[idLogro]?.unlocked === true;
                const estaDesbloqueadoAhora = logrosDespuesPartida[idLogro]?.unlocked === true;

                if (estaDesbloqueadoAhora && !estabaDesbloqueadoAntes) {
                    // Usar directamente logroDef que viene de todosLosLogrosDef, que ya es la definición completa
                    nuevosLogrosDesbloqueadosEnEstaPartida.push(logroDef);
                }
            });

            if (nuevosLogrosDesbloqueadosEnEstaPartida.length > 0) {
                console.log("Nuevos logros desbloqueados en esta partida:", nuevosLogrosDesbloqueadosEnEstaPartida.map(l => l.title));
                await mostrarModalesDeLogrosSecuencialmente(nuevosLogrosDesbloqueadosEnEstaPartida);
            }
        } else {
            console.warn("CrackTotalLogrosAPI no disponible para verificar nuevos logros.");
        }
        // <<<--- FIN: DETECTAR Y MOSTRAR NUEVOS LOGROS --- >>>

        // --- Lógica del Modal de Resultado de Partida (EXISTENTE) --- 
        // const totalAnswered = correctAnswers + incorrectAnswers; // <-- YA DEFINIDO ARRIBA
        // const unanswered = alphabet.length - totalAnswered; // <-- YA DEFINIDO ARRIBA
        // const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0; // <-- YA DEFINIDO ARRIBA
        // Estas variables ya fueron calculadas y están disponibles en este alcance:
        // const minutes = Math.floor(timeSpent / 60);
        // const seconds = timeSpent % 60;
        // const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        let modalType, modalTitle, modalMessage, modalColor, modalIcon;
        
        switch (result) {
            case 'victory':
                modalType = 'victory';
                modalTitle = '¡VICTORIA!';
                modalMessage = `Has completado el rosco con ${correctAnswers} respuestas correctas.`;
                modalColor = 'var(--gradient-secondary)';
                modalIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2"></path></svg>`;
                break;
            case 'defeat':
                modalType = 'defeat';
                modalTitle = '¡GAME OVER!';
                modalMessage = `Has superado el máximo de errores permitidos.`;
                modalColor = 'var(--gradient-accent)';
                modalIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
                break;
            default: // timeout
                modalType = 'timeout';
                modalTitle = '¡TIEMPO AGOTADO!';
                modalMessage = `Se acabó el tiempo.`;
                modalColor = 'linear-gradient(135deg, #FFB74B, #FFD74B)';
                modalIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
                break;
        }
        
        createResultModal(modalType, modalTitle, modalMessage, modalColor, modalIcon, {
            correctAnswers,
            incorrectAnswers,
            unanswered,
            timeFormatted,
            accuracy
        });
    }
    
    // Create a modal for the game result
    function createResultModal(type, title, message, color, icon, stats) {
        // Remove any existing game result modal
        const existingModal = document.querySelector('.game-result-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal container
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay game-result-modal active';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content result-modal';
        modalContent.style.background = 'linear-gradient(135deg, rgba(23, 25, 35, 0.95), rgba(16, 17, 25, 0.97))';
        modalContent.style.borderColor = color.split(',')[0].replace('linear-gradient(', '').trim();
        
        // Create modal header with icon
        const modalHeader = document.createElement('div');
        modalHeader.className = 'result-modal-header';
        modalHeader.classList.add(`result-header-${type}`);
        modalHeader.innerHTML = `
            <div class="result-icon">${icon}</div>
            <h2 class="result-title">${title}</h2>
            <p class="result-message">${message}</p>
        `;
        
        // Create stats container
        const statsContainer = document.createElement('div');
        statsContainer.className = 'result-stats';
        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Aciertos</span>
                <span class="stat-value correct-stat">${stats.correctAnswers}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Errores</span>
                <span class="stat-value incorrect-stat">${stats.incorrectAnswers}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Sin responder</span>
                <span class="stat-value">${stats.unanswered}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Tiempo usado</span>
                <span class="stat-value">${stats.timeFormatted}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Precisión</span>
                <span class="stat-value">${stats.accuracy}%</span>
            </div>
        `;
        
        // --- Create buttons Container --- 
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'result-buttons'; // Use a general class

        // --- Botones de Acción (Estadísticas, Perfil, Ranking, Inicio) ---
        const actionButtonsWrapper = document.createElement('div');
        actionButtonsWrapper.className = 'result-action-buttons'; // Wrapper for non-share buttons
        
        const viewStatsButton = document.createElement('button');
        viewStatsButton.className = 'modal-button secondary-button'; // Style adjustment
        viewStatsButton.innerHTML = `
            <i class="fas fa-chart-bar"></i>
            Ver Errores
        `;

        const viewProfileButton = document.createElement('button');
        viewProfileButton.className = 'modal-button secondary-button'; // Style adjustment
        viewProfileButton.innerHTML = `
            <i class="fas fa-user"></i>
            Ver Perfil
        `;
        
        const viewRankingButton = document.createElement('button');
        viewRankingButton.className = 'modal-button secondary-button'; // Style adjustment
        viewRankingButton.innerHTML = `
             <i class="fas fa-trophy"></i>
            Ver Ranking
        `;
        
        actionButtonsWrapper.appendChild(viewStatsButton);
        actionButtonsWrapper.appendChild(viewProfileButton);
        actionButtonsWrapper.appendChild(viewRankingButton);

        // --- Botones de Compartir --- 
        const shareButtonsWrapper = document.createElement('div');
        shareButtonsWrapper.className = 'result-share-buttons'; // Wrapper for share buttons

        const shareTwitterButton = document.createElement('button');
        shareTwitterButton.className = 'modal-button share-button twitter-share-button';
        shareTwitterButton.innerHTML = `
            <i class="fab fa-twitter"></i> Compartir en Twitter
        `;

        const shareWhatsAppButton = document.createElement('button');
        shareWhatsAppButton.className = 'modal-button share-button whatsapp-share-button';
        shareWhatsAppButton.innerHTML = `
            <i class="fab fa-whatsapp"></i> Compartir en WhatsApp
        `;

        shareButtonsWrapper.appendChild(shareTwitterButton);
        shareButtonsWrapper.appendChild(shareWhatsAppButton);
        
        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(statsContainer);
        buttonsContainer.appendChild(actionButtonsWrapper); // Add action buttons first
        buttonsContainer.appendChild(shareButtonsWrapper); // Add share buttons below
        modalContent.appendChild(buttonsContainer);
        modalOverlay.appendChild(modalContent);
        
        // Add modal to the DOM
        document.body.appendChild(modalOverlay);
        
        // --- Add event listeners --- 
        viewStatsButton.addEventListener('click', () => {
            showStatsDetailModal(); // This function should already exist
        });

        viewProfileButton.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
        
        viewRankingButton.addEventListener('click', () => {
            window.location.href = 'ranking.html';
        });

        // --- Event Listener for Twitter Share ---
        shareTwitterButton.addEventListener('click', () => {
            const score = stats.correctAnswers;
            const total = alphabet.length;
            const gameUrl = 'https://www.cracktotal.com/pasalache.html'; 
            const twitterHandle = '@cracktotal_';
            let tweetText = `¡Hice ${score}/${total} en el #PasalaChe de #CrackTotal! ⚽️🇦🇷 ¿Te animás a superarme? ${twitterHandle}`; 
            
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(gameUrl)}`;
            window.open(twitterUrl, '_blank');
        });

        // --- Event Listener for WhatsApp Share ---
        shareWhatsAppButton.addEventListener('click', () => {
            const score = stats.correctAnswers;
            const total = alphabet.length;
            const gameUrl = 'https://www.cracktotal.com/pasalache.html'; 
            let whatsappText = `¡Hice ${score}/${total} en el Pasala Che de Crack Total! ⚽️🇦🇷 ¿Te animás a superarme? ${gameUrl}`;

            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
            window.open(whatsappUrl, '_blank');
        });

    }
    
    // Show detailed statistics modal
    function showStatsDetailModal() {
        // Remove any existing stats modal
        const existingModal = document.querySelector('.stats-detail-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal container
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay stats-detail-modal active';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content stats-modal';
        
        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'stats-modal-header';
        modalHeader.innerHTML = `
            <h2 class="stats-title">Estadísticas Detalladas</h2>
            <p class="stats-subtitle">Resumen de tu partida</p>
        `;
        
        // Create errors list - Ahora primero
        const errorsContainer = document.createElement('div');
        errorsContainer.className = 'errors-container';
        
        let errorsHTML = `<h3 class="errors-title">Errores cometidos</h3>`;
        
        if (gameErrors.length > 0) {
            errorsHTML += `<div class="errors-list">`;
            gameErrors.forEach(error => {
                errorsHTML += `
                    <div class="error-item">
                        <div class="error-letter">${error.letter}</div>
                        <div class="error-details">
                            <div class="error-question">${error.question}</div>
                            <div class="error-answers">
                                <span class="user-answer">Tu respuesta: <strong>${error.userAnswer}</strong></span>
                                <span class="correct-answer">Respuesta correcta: <strong>${error.correctAnswer}</strong></span>
                            </div>
                        </div>
                    </div>
                `;
            });
            errorsHTML += `</div>`;
        } else {
            errorsHTML += `<p class="no-errors">¡No has cometido ningún error! ¡Excelente!</p>`;
        }
        
        errorsContainer.innerHTML = errorsHTML;
        
        // Create performance summary - Ahora después de los errores
        const performanceSummary = document.createElement('div');
        performanceSummary.className = 'performance-summary';
        
        // Calculate stats
        const accuracy = (correctAnswers + incorrectAnswers) > 0 ? Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 100) : 0;
        const completionPercentage = Math.round((correctAnswers / alphabet.length) * 100);
        
        performanceSummary.innerHTML = `
            <h3 class="stats-subtitle" style="margin-bottom: 15px; text-align: center;">Resumen de Rendimiento</h3>
            <div class="performance-stats">
                <div class="performance-item">
                    <span class="performance-value">${completionPercentage}%</span>
                    <span class="performance-label">Completado</span>
                </div>
                <div class="performance-item">
                    <span class="performance-value">${accuracy}%</span>
                    <span class="performance-label">Precisión</span>
                </div>
                <div class="performance-item">
                    <span class="performance-value">${helpUsed}/${maxHelp}</span>
                    <span class="performance-label">Pistas usadas</span>
                </div>
            </div>
        `;
        
        // Create buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'stats-buttons';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-button secondary';
        closeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>
            Cerrar
        `;

        const viewProfileButton = document.createElement('button');
        viewProfileButton.className = 'modal-button';
        viewProfileButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Ver Perfil
        `;
        
        buttonsContainer.appendChild(closeButton);
        buttonsContainer.appendChild(viewProfileButton);
        
        // Assemble modal - Cambiado el orden: errores arriba, estadísticas abajo
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(errorsContainer);
        modalContent.appendChild(performanceSummary);
        modalContent.appendChild(buttonsContainer);
        modalOverlay.appendChild(modalContent);
        
        // Add modal to the DOM
        document.body.appendChild(modalOverlay);
        
        // Add event listeners
        closeButton.addEventListener('click', () => {
            modalOverlay.remove();
        });

        viewProfileButton.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }
    
    // Function to show temporary feedback messages (like incomplete warnings)
    function showTemporaryFeedback(message, type = 'warning', duration = 2500) {
        // Remove existing temporary feedback
        const existingFeedback = document.querySelector('.temporary-feedback-modal');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        const modalOverlay = document.createElement('div');
        // Basic overlay styling (can be enhanced with CSS)
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.right = '0';
        modalOverlay.style.bottom = '0';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        modalOverlay.style.display = 'flex';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.alignItems = 'center';
        modalOverlay.style.zIndex = '1100';
        modalOverlay.style.opacity = '0';
        modalOverlay.style.transition = 'opacity 0.3s ease';
        modalOverlay.className = 'modal-overlay temporary-feedback-modal'; // Add class for potential CSS targeting

        const modalContent = document.createElement('div');
        // Basic content styling (can be enhanced with CSS)
        modalContent.style.background = 'var(--background-alt, #242629)';
        modalContent.style.padding = '25px';
        modalContent.style.borderRadius = '12px';
        modalContent.style.maxWidth = '350px';
        modalContent.style.textAlign = 'center';
        modalContent.style.color = 'var(--text, #FFFFFE)';
        modalContent.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        modalContent.style.transform = 'scale(0.95)';
        modalContent.style.transition = 'transform 0.3s ease';
        modalContent.className = 'modal-content feedback-content'; // Add class

        // Add icon based on type
        let iconHtml = '';
        let color = 'var(--accent)'; // Default yellow/orange for warning
        if (type === 'warning') {
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12" y2="17"></line></svg>`;
            color = 'var(--accent, #FF8E3C)';
        } else if (type === 'info') {
             iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
             color = 'var(--primary-light, #AB8BFA)';
        } // Add other types if needed

        modalContent.innerHTML = `
            <div style="color: ${color}; margin-bottom: 10px;">${iconHtml}</div>
            <p style="font-size: 1rem; color: var(--text, #FFFFFE); margin: 0;">${message}</p>
        `;
        modalContent.style.border = `2px solid ${color}`;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Trigger fade-in and scale-up animation
        requestAnimationFrame(() => {
            modalOverlay.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        });


        // Auto-remove after duration
        const timeoutId = setTimeout(() => {
            modalOverlay.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95)';
            // Optional: Add fade-out animation before removing
            setTimeout(() => modalOverlay.remove(), 300); // Wait for fade animation
        }, duration);

        // Allow clicking overlay to dismiss early
        modalOverlay.addEventListener('click', () => {
             clearTimeout(timeoutId); // Prevent auto-removal if clicked
             modalOverlay.style.opacity = '0';
             modalContent.style.transform = 'scale(0.95)';
             setTimeout(() => modalOverlay.remove(), 300);
        });
    }

    // Simple alias for the specific incomplete feedback
    function showIncompleteFeedback(message) {
        showTemporaryFeedback(message, 'warning', 2000); // Show for 2 seconds (changed from 3000)
    }

    // Event Listeners
    if (answerForm) {
        answerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const userAnswer = answerInput.value.trim();
            if (userAnswer === '') { // Si la respuesta está vacía al presionar Enter
                pasapalabra();      // Ejecutar pasapalabra
            } else {
                checkAnswer(userAnswer); // Si no está vacía, comprobar respuesta
            }
        });
    }

    if (submitAnswerBtnIcon) {
        submitAnswerBtnIcon.addEventListener('click', function() {
            const userAnswer = answerInput.value.trim();
            if (userAnswer === '') { // Si la respuesta está vacía
                pasapalabra();      // Ejecutar pasapalabra
            } else {
                checkAnswer(userAnswer); // Si no está vacía, comprobar respuesta
            }
        });
    }

    if (pasapalabraButton) {
        pasapalabraButton.addEventListener('click', pasapalabra);
    }

    // Add help button when game starts
    if (startGameButton) {
        startGameButton.addEventListener('click', function() {
            // Add help button when game starts with a slight delay to ensure DOM is ready
            // setTimeout(addHelpButton, 100); // Movido a después de que el usuario hace clic en "COMENZAR AHORA!"
        });
    }

    // Add debounced resize listener
    const debouncedPositionLetters = debounce(positionLetters, 250); // Adjust debounce time (ms) as needed
    window.addEventListener('resize', debouncedPositionLetters);

    // --- Initial Setup ---
    // Display rules modal on load
    if (gameRulesModal) {
        // Make sure it's active initially
        if (!gameRulesModal.classList.contains('active')) {
            gameRulesModal.classList.add('active');
        }
        // Ensure player name is loaded if available
        const playerName = localStorage.getItem('playerName') || 'Jugador';
        const playerNameDisplay = document.querySelector('.player-name');
        if (playerNameDisplay) {
            playerNameDisplay.textContent = playerName;
        }
    } else {
        // If no rules modal, maybe initialize game directly or show error
        console.error("Game rules modal not found. Cannot start game.");
        // Optionally, try to init game if the structure allows
        // initGame(); // Be cautious calling this if modal handles setup
    }

    // --- Global Profile Stats Variable ---
    let profileStats = loadProfileStats(); // Load stats once at the beginning

    // --- Helper Function to Check Answer Conflict ---
    function checkAnswerConflict(potentialAnswer, usedSignatures) {
        const potentialAnswerNorm = normalizeResponseText(potentialAnswer); // Normalizar la respuesta potencial
        if (!potentialAnswerNorm) return false; // Empty answer is not a conflict

        const potentialWords = potentialAnswerNorm.split(' ').filter(w => w.length > 2); // Defined once for the potentialAnswer

        for (const usedAnswerSignature of usedSignatures) { // usedSignatures ya contiene respuestas normalizadas
            const usedAnswerNorm = usedAnswerSignature;

            // 1. Explicitly check for exact normalized match first for clarity and safety
            if (potentialAnswerNorm === usedAnswerNorm) {
                console.log(`Conflict (EXACT normalized match): '${potentialAnswerNorm}' vs '${usedAnswerNorm}'`);
                return true;
            }

            // 2. Check full containment (if not an exact match)
            // This logic is from the original file, ensure it's effective.
            // It aims to catch partial matches like "Messi" vs "Lionel Messi".
            if (usedAnswerNorm.includes(potentialAnswerNorm) || potentialAnswerNorm.includes(usedAnswerNorm)) {
                if (potentialAnswerNorm.length > 1 && usedAnswerNorm.length > 1) {
                    // If one contains the other, AND (they are very different in length OR not very similar by string metric)
                    // then it's a conflict.
                    if (Math.abs(potentialAnswerNorm.length - usedAnswerNorm.length) > 2 || calculateStringSimilarity(potentialAnswerNorm, usedAnswerNorm).similarity < 0.95) {
                        console.log(`Conflict (Containment Rule): '${potentialAnswerNorm}' vs '${usedAnswerNorm}'`);
                        return true;
                    }
                }
            }

            // 3. Check for significant word overlap (if not an exact match and not caught by containment)
            const usedWords = usedAnswerNorm.split(' ').filter(w => w.length > 2); // Words from the already used answer
            const commonWords = potentialWords.filter(pw => usedWords.includes(pw));

            // Conflict if > 1 common significant word
            if (commonWords.length > 1) {
                 console.log(`Conflict (Multiple Common Words): '${potentialAnswerNorm}' vs '${usedAnswerNorm}' (Common: ${commonWords.join(',')})`);
                 return true;
            }
            // Conflict if exactly 1 common significant word AND both answers are considered short (e.g., mostly consisting of this one word)
            if (commonWords.length === 1 && potentialWords.length <= 2 && usedWords.length <= 2) {
                // This part is to catch "River" vs "River Plate" where "River" is the single common word.
                // Ensure the common word found is indeed part of both sets after filtering.
                 if (potentialWords.includes(commonWords[0]) && usedWords.includes(commonWords[0])) {
                    console.log(`Conflict (Single Common Word in Short Answers): '${potentialAnswerNorm}' vs '${usedAnswerNorm}' (Common: ${commonWords[0]})`);
                    return true;
                 }
            }
        }
        return false; // No conflict found
    }

    // <<<--- INICIO: NUEVAS FUNCIONES PARA MODALES DE LOGROS --- >>>
    async function mostrarModalesDeLogrosSecuencialmente(logrosAMostrar) {
        console.log("PASA: Logros nuevos para mostrar en modales:", logrosAMostrar); // <<< LOG AÑADIDO
        const logrosDefGlobales = window.CrackTotalLogrosAPI && typeof window.CrackTotalLogrosAPI.getTodosLosLogrosDef === 'function' 
            ? window.CrackTotalLogrosAPI.getTodosLosLogrosDef() 
            : [];

        if (!logrosDefGlobales || logrosDefGlobales.length === 0) {
            console.warn("PASA: No se pudieron obtener las definiciones de logros. Saltando modales de logros.");
            return; // Retorna una promesa resuelta si no hay definiciones
        }

        for (const logroResumido of logrosAMostrar) {
            // Buscamos la definición completa del logro que incluye el ícono y descripción
            const logroCompleto = logrosDefGlobales.find(l => l.id === logroResumido.id);
            if (logroCompleto) {
                await new Promise(resolve => {
                    crearModalLogroIndividual(logroCompleto, resolve);
                });
            } else {
                console.warn("No se encontró definición completa para el logro ID:", logroResumido.id);
            }
        }
    }

    function crearModalLogroIndividual(logroInfo, callbackContinuar) {
        // Remover modal de logro previo si existe
        const modalPrevio = document.querySelector('.logro-desbloqueado-modal');
        if (modalPrevio) {
            modalPrevio.remove();
        }

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay logro-desbloqueado-modal active'; // Nueva clase para este modal
        // Estilos básicos (pueden mejorarse con CSS dedicado)
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modalOverlay.style.zIndex = '1200'; // Encima del modal de resultado si algo sale mal

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content'; // Reutilizar clase si es apropiado
        modalContent.style.textAlign = 'center';
        modalContent.style.padding = '30px';
        modalContent.style.background = 'var(--background-alt, #2a2d34)';
        modalContent.style.borderRadius = '12px';
        modalContent.style.border = '2px solid var(--accent, #FF8E3C)';
        modalContent.style.maxWidth = '400px';

        // Tratar de obtener la definición completa del logro de `todosLosLogros` (la variable global en `logros.js`)
        // Esto es un poco hacky. Sería mejor si `getTodosLosLogrosDef` devolviera toda la info.
        // Por ahora, intentaremos accederla si `logros.js` la expone globalmente o a través de la API.
        let logroDefCompleta = null;
        if (window.CrackTotalLogrosAPI && typeof window.CrackTotalLogrosAPI.getTodosLosLogrosDef === 'function') {
            const todasLasDefs = window.CrackTotalLogrosAPI.getTodosLosLogrosDef();
             // La API actual solo devuelve id y title. Necesitamos la definición completa que está en `todosLosLogros` en `logros.js`
             // Esta parte necesita ajuste para acceder al icono y descripción correctos.
             // Por ahora, usamos lo que tenemos de logroInfo (que ya debería ser la def completa gracias al cambio en mostrarModalesDeLogrosSecuencialmente).
            logroDefCompleta = logroInfo;
        }


        const iconHtml = logroDefCompleta && logroDefCompleta.icon ? `<i class="fas ${logroDefCompleta.icon} fa-3x" style="color: var(--accent, #FF8E3C); margin-bottom: 15px;"></i>` : '<i class="fas fa-medal fa-3x" style="color: var(--accent, #FF8E3C); margin-bottom: 15px;"></i>'; // Icono por defecto
        const titleHtml = `<h3 style="color: var(--text-bright, #FFFFFE); margin-top: 0; margin-bottom: 10px; font-size: 1.6em;">¡Logro Desbloqueado!</h3>`;
        const logroTitleHtml = `<p style="color: var(--accent-light, #FFD166); font-size: 1.3em; margin-bottom: 15px; font-weight: bold;">${logroInfo.title}</p>`;
        const logroDescriptionHtml = logroDefCompleta && logroDefCompleta.description ? `<p style="color: var(--text, #D1D0C5); font-size: 1em; margin-bottom: 25px;">${logroDefCompleta.description}</p>` : '';

        const continueButton = document.createElement('button');
        continueButton.className = 'primary-button logro-modal-continue-btn'; // Reutilizar clase de botón y añadir una específica
        continueButton.textContent = 'Continuar';
        // Estilos directos para asegurar prominencia y coherencia:
        continueButton.style.padding = '12px 28px';
        continueButton.style.fontSize = '1.15em';
        continueButton.style.fontWeight = '600';
        continueButton.style.letterSpacing = '0.5px';
        continueButton.style.marginTop = '20px'; // Más espacio arriba
        continueButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        continueButton.style.transition = 'background-color 0.3s ease, transform 0.2s ease';

        // Efecto hover simple vía JS (CSS es preferible para esto, pero para mantenerlo aquí)
        continueButton.onmouseover = () => {
            // Este estilo debería idealmente venir de una clase :hover en CSS
            // pero para el ejemplo, si primary-button no lo tiene suficientemente fuerte:
            // continueButton.style.backgroundColor = 'var(--primary-dark, #6a4fd0)'; // Un tono más oscuro de primary
        };
        continueButton.onmouseout = () => {
            // Revertir al color original si se cambió el fondo en hover
            // continueButton.style.backgroundColor = 'var(--primary, #7F5AF0)';
        };

        continueButton.onclick = () => {
            modalOverlay.remove();
            callbackContinuar();
        };

        modalContent.innerHTML = iconHtml + titleHtml + logroTitleHtml + logroDescriptionHtml;
        modalContent.appendChild(continueButton);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
    }
    // <<<--- FIN: NUEVAS FUNCIONES PARA MODALES DE LOGROS --- >>>
}); 