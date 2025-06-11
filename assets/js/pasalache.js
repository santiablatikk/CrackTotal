// --- Firebase ---
// Utilizamos las funciones y objetos proporcionados por firebase-init.js
// db, isFirebaseAvailable, safeFirestoreOperation están disponibles
// desde los scripts cargados anteriormente

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
            
            // Configurar controles UI
            this.setupSoundControls();
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
                pasapalabra: {
                    type: 'neutral',
                    frequency: [440, 523], // La-Do
                    duration: 0.2,
                    volume: 0.25
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
                buttonClick: {
                    type: 'click',
                    frequency: [600],
                    duration: 0.1,
                    volume: 0.2
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
                
                // Efecto visual en el botón de sonido
                this.triggerSoundWaveEffect();
                
            } catch (error) {
                console.error("Error playing sound:", error);
            }
        }
        
        getOscillatorType(soundType) {
            const types = {
                success: 'sine',
                error: 'triangle', 
                neutral: 'square',
                tick: 'square',
                celebration: 'sine',
                sad: 'sawtooth',
                click: 'square',
                start: 'sine'
            };
            return types[soundType] || 'sine';
        }
        
        triggerSoundWaveEffect() {
            const soundButton = document.getElementById('soundButton');
            if (soundButton) {
                soundButton.classList.add('playing');
                setTimeout(() => soundButton.classList.remove('playing'), 600);
            }
        }
        
        setVolume(newVolume) {
            this.volume = Math.max(0, Math.min(1, newVolume));
            this.saveSoundSettings();
            this.updateVolumeDisplay();
            
            // Cambiar ícono según el volumen
            this.updateSoundIcon();
        }
        
        toggleMute() {
            this.isMuted = !this.isMuted;
            this.updateSoundIcon();
            this.saveSoundSettings();
        }
        
        updateSoundIcon() {
            const soundIcon = document.getElementById('soundIcon');
            const soundButton = document.getElementById('soundButton');
            
            if (!soundIcon || !soundButton) return;
            
            soundButton.classList.remove('muted');
            
            if (this.isMuted || this.volume === 0) {
                soundIcon.className = 'fas fa-volume-mute';
                soundButton.classList.add('muted');
            } else if (this.volume < 0.3) {
                soundIcon.className = 'fas fa-volume-down';
            } else if (this.volume < 0.7) {
                soundIcon.className = 'fas fa-volume-up';
            } else {
                soundIcon.className = 'fas fa-volume-up';
            }
        }
        
        updateVolumeDisplay() {
            const volumeSlider = document.getElementById('volumeSlider');
            const volumePercentage = document.getElementById('volumePercentage');
            
            if (volumeSlider) {
                volumeSlider.value = this.volume * 100;
            }
            
            if (volumePercentage) {
                volumePercentage.textContent = Math.round(this.volume * 100) + '%';
            }
        }
        
        setupSoundControls() {
            const soundButton = document.getElementById('soundButton');
            const volumeSlider = document.getElementById('volumeSlider');
            const soundControl = document.getElementById('soundControl');
            
            if (soundButton) {
                soundButton.addEventListener('click', () => {
                    this.toggleMute();
                    soundControl?.classList.toggle('active');
                });
            }
            
            if (volumeSlider) {
                volumeSlider.addEventListener('input', (e) => {
                    const newVolume = parseFloat(e.target.value) / 100;
                    this.setVolume(newVolume);
                    
                    // Si el volumen cambia, des-mutear automáticamente
                    if (this.isMuted && newVolume > 0) {
                        this.isMuted = false;
                        this.updateSoundIcon();
                    }
                });
                
                volumeSlider.addEventListener('change', () => {
                    // No reproducir sonido al cambiar volumen
                });
            }
            
            // Cerrar slider al hacer click fuera
            document.addEventListener('click', (e) => {
                if (soundControl && !soundControl.contains(e.target)) {
                    soundControl.classList.remove('active');
                }
            });
            
            // Inicializar displays
            this.updateSoundIcon();
            this.updateVolumeDisplay();
        }
        
        saveSoundSettings() {
            const settings = {
                volume: this.volume,
                isMuted: this.isMuted
            };
            localStorage.setItem('pasalacheSoundSettings', JSON.stringify(settings));
        }
        
        loadSoundSettings() {
            try {
                const settings = JSON.parse(localStorage.getItem('pasalacheSoundSettings'));
                if (settings) {
                    this.volume = settings.volume !== undefined ? settings.volume : 0.7;
                    this.isMuted = settings.isMuted || false;
                }
            } catch (error) {
                console.warn("Error loading sound settings:", error);
            }
        }
        
        // Método para reproducir música de fondo (opcional)
        playBackgroundMusic() {
            // Implementar si se desea música de fondo
            // Por ahora, solo efectos de sonido
        }
        
        stopBackgroundMusic() {
            if (this.currentBackgroundMusic) {
                this.currentBackgroundMusic.stop();
                this.currentBackgroundMusic = null;
            }
        }
        
        // Método de limpieza
        destroy() {
            this.stopBackgroundMusic();
            if (this.audioContext) {
                this.audioContext.close();
            }
        }
    }
    
    // Crear instancia global del manager de sonido
    window.soundManager = new SoundManager();
    
    console.log("Sound system initialized");
    
    // ========================================= 
    // ======== FIN SISTEMA DE SONIDO ======== 
    // =========================================

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
    let currentQuestionData = null; // NEW: Store current question data for validation
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
    const difficultyCards = document.querySelectorAll('.difficulty-card');
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
    
    // Handle difficulty selection - Updated to support both buttons and cards
    function handleDifficultySelection(difficulty, element) {
        // Remove active class from all buttons and cards
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        difficultyCards.forEach(card => card.classList.remove('active'));
        
        // Add active class to clicked element
        element.classList.add('active');
        
        // Set game time and maxErrors based on difficulty
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
    }
    
    // Add event listeners for difficulty buttons (legacy support)
    difficultyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const difficulty = this.getAttribute('data-difficulty');
            handleDifficultySelection(difficulty, this);
        });
    });
    
    // Add event listeners for difficulty cards (new design)
    difficultyCards.forEach(card => {
        card.addEventListener('click', function() {
            const difficulty = this.getAttribute('data-difficulty');
            handleDifficultySelection(difficulty, this);
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
        currentQuestionIndex = 0;
        currentQuestionData = null; // Clear question data
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
        const questionFile = 'assets/data/preguntas_combinadas.json';

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

            // Add click event to jump to that letter (solo para letras no contestadas o pendientes)
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
        
        // Reproducir sonido de inicio del juego
        if (window.soundManager) {
            window.soundManager.playSound('gameStart');
        }
        
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

        // Las letras incorrectas ya no están en pendingLetters, por lo que esta verificación ya no es necesaria

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
            let testQuestionIndex = -1; // Keep track of the index being tested
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
                testQuestionIndex = testIndex; // Store the index we are showing
                // DO NOT mark as used here anymore -> gameUsedQuestionIndices[currentLetter].push(testQuestionIndex); 
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

            // --- Store question data globally for validation --- 
            currentQuestionIndex = testQuestionIndex;
            currentQuestionData = {
                letter: currentLetter,
                question: question,
                answer: potentialAnswer,
                fullQuestion: question.pregunta
            };
            console.log(`Question loaded for ${currentLetter} at index ${currentQuestionIndex}:`, question.pregunta.substring(0,50) + '...');

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
        const currentLetter = pendingLetters[currentLetterIndex];
        
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
            if (letter === currentLetter) {
                element.classList.add('active');
                
                // Mostrar pista solo si ya fue revelada y ES la letra activa
                if (hintDisplayed[letter]) {
                    element.classList.add('with-hint');
                    const hintElement = element.querySelector(`#hint-${letter}`);
                    if (hintElement) {
                        hintElement.textContent = letterHints[letter];
                    }
                }
            } else {
                // Si no es la letra activa, ocultar la pista
                element.classList.remove('with-hint');
                const hintElement = element.querySelector(`#hint-${letter}`);
                if (hintElement) {
                    hintElement.textContent = '';
                }
            }
        });
    }
    
    // Move to the next available letter
    function nextLetter() {
        // Clear current question data when moving to next letter
        currentQuestionData = null;
        
        // Incrementar el índice para ir a la siguiente letra
        currentLetterIndex = (currentLetterIndex + 1) % pendingLetters.length;
        
        // Si volvemos al principio, incrementar el contador de vueltas completadas
        if (currentLetterIndex === 0 && pendingLetters.length > 0) {
            completedRounds++;
            // <<<--- RESET PARA 'todas_letras_pasadas_una_vuelta' (si se quiere por vuelta y no por partida) --- >>>
            // letrasVisitadasEnVueltaActual.clear(); // Si el logro fuera por *cada* vuelta completa
            // <<<--- FIN RESET --- >>>

            // Al completar una vuelta, limpiar el estado "pending" para que las letras puedan volver a jugarse
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
            // Clear current question data when jumping to specific letter
            currentQuestionData = null;
            currentLetterIndex = index;
            loadQuestion();
        }
    }
    
    // Check the user's answer
    function checkAnswer(userAnswer) {
        try {
            const currentLetter = pendingLetters[currentLetterIndex];
            
            // Validate that we have current question data and it matches current letter
            if (!currentQuestionData || currentQuestionData.letter !== currentLetter) {
                console.error(`Question data mismatch! Expected ${currentLetter}, got ${currentQuestionData?.letter || 'null'}`);
                // Try to reload question
                loadQuestion();
                return;
            }

        const letterData = questions.find(item => item.letra === currentLetter);

        // Ensure currentQuestionIndex is valid for the letterData and matches stored data
        if (letterData && letterData.preguntas && currentQuestionIndex < letterData.preguntas.length) {
            // Double-check that the stored question matches what's in the array
            const actualQuestion = letterData.preguntas[currentQuestionIndex];
            if (actualQuestion.pregunta !== currentQuestionData.fullQuestion) {
                console.error(`Question index mismatch! Stored question doesn't match array question.`);
                // Try to reload question
                loadQuestion();
                return;
            }

            const correctAnswerFull = currentQuestionData.answer; // Use stored answer
            
            // Normalizar ambas respuestas usando la nueva función
            const correctAnswerNorm = normalizeResponseText(correctAnswerFull);
            const userAnswerNorm = normalizeResponseText(userAnswer);

            let isCorrect = false; // Initialize isCorrect

            // Check for incompleteness first...
            if (isIncompleteAnswer(userAnswerNorm, correctAnswerNorm)) {
                 if (incompleteAnswersUsed < maxIncompleteAnswers) {
                    incompleteAnswersUsed++;
                    const remainingAttempts = maxIncompleteAnswers - incompleteAnswersUsed;
                    // Show specific feedback for incomplete answer with enhanced modal
                    showEnhancedIncompleteFeedback(`Respuesta incompleta. Te ${remainingAttempts === 1 ? 'queda 1 intento' : 'quedan ' + remainingAttempts + ' intentos'} para respuestas incompletas.`, remainingAttempts);
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
                
                // Reproducir sonido de respuesta incorrecta
                if (window.soundManager) {
                    window.soundManager.playSound('incorrect');
                }
                
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
                const questionText = currentQuestionData.fullQuestion; // Use stored question
                gameErrors.push({
                    letter: currentLetter,
                    question: questionText,
                    userAnswer: userAnswer,
                    correctAnswer: correctAnswerFull
                });

                // Mark letter status
                letterStatuses[currentLetter] = 'incorrect';
                
                // --- REMOVER LETRA INCORRECTA DE pendingLetters --- 
                const indexToRemove = pendingLetters.indexOf(currentLetter);
                if (indexToRemove > -1) {
                    // Guardar información antes de remover
                    const letterToRemove = pendingLetters[indexToRemove];
                    
                    // Remover la letra incorrecta
                    pendingLetters.splice(indexToRemove, 1);
                    
                    // NUEVA LÓGICA SIMPLIFICADA: 
                    // Después de remover una letra, ajustar índice para no volver hacia atrás
                    
                    if (indexToRemove < currentLetterIndex) {
                        // Si removimos una letra ANTES de donde estábamos, decrementar para compensar
                        currentLetterIndex--;
                    } else if (indexToRemove === currentLetterIndex) {
                        // Si removimos la letra actual, el índice ya apunta a la siguiente
                        // No hacer nada, ya que splice automáticamente "desplaza" las letras
                    }
                    // Si removimos una letra DESPUÉS, no afecta nuestro índice actual
                    
                    // Verificar límites del array
                    if (currentLetterIndex >= pendingLetters.length) {
                        currentLetterIndex = 0; // Solo volver al principio si ya no hay letras adelante
                    }
                    
                    console.log(`Letra ${letterToRemove} removida. Índice ajustado a: ${currentLetterIndex}. Letras restantes: [${pendingLetters.join(', ')}]`);
                }
                
                // --- Check for DEFEAT --- 
                if (incorrectAnswers >= maxErrors) {
                    saveProfileStats(profileStats); 
                    endGame('defeat');
                    return; // Stop execution
                }

                // --- VERIFICACIÓN DE ROSCO COMPLETO (TODAS LAS LETRAS CONTESTADAS) ---
                if (pendingLetters.length === 0) {
                    saveProfileStats(profileStats);
                    // Si no quedan letras pendientes, el rosco está completo
                    // La victoria depende de si no se superó el máximo de errores
                    if (incorrectAnswers < maxErrors) {
                        endGame('victory');
                    } else {
                        endGame('defeat');
                    }
                    return; // Juego terminado
                }
                
                // --- Update UI --- 
                updateScoreDisplays();
                updateLetterStyles();
                
                // Si no quedan letras pendientes después de este error, el juego debe terminar
                if (pendingLetters.length === 0) {
                    saveProfileStats(profileStats);
                    if (incorrectAnswers < maxErrors) {
                        endGame('victory');
                    } else {
                        endGame('defeat');
                    }
                    return;
                }
                
                // Cargar la siguiente pregunta directamente (no usar nextLetter para evitar incrementar el índice)
                loadQuestion();

            } else {
                // --- CORRECT --- 
                correctAnswers++;
                
                // Reproducir sonido de respuesta correcta
                if (window.soundManager) {
                    window.soundManager.playSound('correct');
                }
                
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

                // --- VERIFICACIÓN: ROSCO COMPLETO (NO QUEDAN LETRAS PENDIENTES) ---
                if (pendingLetters.length === 0) {
                    saveProfileStats(profileStats); // Guardar stats antes de llamar a endGame
                    endGame('victory'); // Victoria al completar el rosco
                    return; // Stop execution
                }

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
        } catch (error) {
            console.error("Error en checkAnswer:", error);
            // En caso de error, intentar ir a la siguiente letra
            try {
                nextLetter();
            } catch (e) {
                console.error("Error adicional al intentar nextLetter:", e);
            }
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
        
        // NUEVO: Si la respuesta correcta contiene la respuesta del usuario completa
        // Esta comprobación maneja casos donde el usuario pone más información que la correcta
        // Por ejemplo, si la respuesta correcta es "carlos tevez" y el usuario pone "carlos alberto tevez"
        if (userAnswerNorm.length > 3 && correctAnswerNorm.includes(userAnswerNorm)) {
            return true;
        }
        
        // NUEVO: Comprobación por palabras - si todas las palabras de la respuesta correcta están en la del usuario
        const correctWords = correctAnswerNorm.split(' ').filter(w => w.length > 2);
        const userWords = userAnswerNorm.split(' ').filter(w => w.length > 2);
        
        if (correctWords.length > 0 && userWords.length >= correctWords.length) {
            // Verificar si todas las palabras importantes de la respuesta correcta están en la respuesta del usuario
            const allCorrectWordsInUserAnswer = correctWords.every(word => 
                userWords.some(userWord => userWord.includes(word) || word.includes(userWord))
            );
            
            if (allCorrectWordsInUserAnswer) {
                return true;
            }
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
        
        // Clear current question data when passing
        currentQuestionData = null;
        
        // Reproducir sonido de pasapalabra (solo si no es silencioso)
        if (!silent && window.soundManager) {
            window.soundManager.playSound('pasapalabra');
        }
        
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

        // Check if game should end (no more letters to play)
        if (pendingLetters.length === 0) {
            saveProfileStats(profileStats);
            if (incorrectAnswers < maxErrors) {
                endGame('victory');
            } else {
                endGame('defeat');
            }
            return;
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
            
            // Reproducir sonido de tick cuando quedan pocos segundos
            if (timeLeft <= 10 && timeLeft > 0 && window.soundManager) {
                window.soundManager.playSound('tick', { volume: 0.5 });
            }
            
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
    function endGame(result = 'timeout') { // Quitamos async para evitar bloqueos
        clearInterval(timerInterval);

        // Reproducir sonido según el resultado
        if (window.soundManager) {
            if (result === 'victory') {
                window.soundManager.playSound('victory');
            } else {
                window.soundManager.playSound('defeat');
            }
        }

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

        // --- MOSTRAR MODAL DE RESULTADO INMEDIATAMENTE ---
        // --- Create modal for the game result ---
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
        
        try {
            createResultModal(modalType, modalTitle, modalMessage, modalColor, modalIcon, {
                correctAnswers,
                incorrectAnswers,
                unanswered,
                timeFormatted,
                accuracy
            });
        } catch (error) {
            console.error("Error al mostrar modal de resultado:", error);
            alert(`¡${modalTitle} ${modalMessage}`); // Fallback simple si falla el modal
        }

        // --- INICIO: Guardar Resultados en FIREBASE ---
        // Intentar guardar en Firebase usando la versión compat
        setTimeout(() => {
            try {
                if (window.firebase && window.firebase.firestore) {
                    const userId = getCurrentUserId(); 
                    const userDisplayName = getCurrentDisplayName();
                    const difficultyActual = document.querySelector('.difficulty-btn.active')?.dataset.difficulty || 'normal';
                    const db = window.firebase.firestore();
                    
                    console.log("Guardando partida en Firebase:", {
                        userId,
                        userDisplayName,
                        result,
                        correctAnswers,
                        incorrectAnswers,
                        timeSpent
                    });
                    
                    // 1. Actualizar el documento del usuario
                    db.collection("users").doc(userId).set({
                        displayName: userDisplayName,
                        totalScore: window.firebase.firestore.FieldValue.increment(correctAnswers),
                        matchesPlayed: window.firebase.firestore.FieldValue.increment(1),
                        lastPlayed: window.firebase.firestore.FieldValue.serverTimestamp(),
                        totalErrors: window.firebase.firestore.FieldValue.increment(incorrectAnswers),
                        ...(result === 'victory' 
                            ? { wins: window.firebase.firestore.FieldValue.increment(1) } 
                            : { totalLosses: window.firebase.firestore.FieldValue.increment(1) })
                    }, { merge: true })
                    .then(() => console.log("Datos de usuario guardados exitosamente"))
                    .catch(error => console.error("Error al guardar datos de usuario:", error));
                    
                    // 2. Añadir la partida a matches
                    db.collection("matches").add({
                        timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                        gameMode: "Pasalache",
                        result: result,
                        difficulty: difficultyActual,
                        timeSpent: timeSpent,
                        score: correctAnswers,
                        incorrectAnswers: incorrectAnswers,
                        passes: passedAnswers,
                        playerName: userDisplayName,
                        userId: userId
                    })
                    .then(() => console.log("Partida guardada exitosamente"))
                    .catch(error => console.error("Error al guardar partida:", error));
                } else {
                    console.log("Firebase no disponible, guardando solo localmente");
                }
            } catch (error) {
                console.error("Error al guardar en Firebase:", error);
            }
        }, 0);
        // --- FIN: Guardar Resultados en FIREBASE ---

        // <<<--- INICIO: INTENTAR DESBLOQUEAR LOGROS RELEVANTES A LA PARTIDA ACTUAL --- >>>
        // Desactivamos temporalmente los logros para evitar errores
        console.log("Procesamiento de logros desactivado temporalmente");
        
        /*
        if (window.CrackTotalLogrosAPI && typeof window.CrackTotalLogrosAPI.intentarDesbloquearLogro === 'function') {
            // Código desactivado temporalmente
        } else {
            console.warn("PASA: CrackTotalLogrosAPI no está disponible al finalizar el juego.");
        }
        */
        // <<<--- FIN: INTENTAR DESBLOQUEAR LOGROS --- >>>

        // <<<--- INICIO: DETECTAR Y MOSTRAR NUEVOS LOGROS --- >>>
        // Desactivamos temporalmente los logros para evitar errores
        console.log("Procesamiento de logros desactivado temporalmente");
        
        /*
        setTimeout(() => {
            try {
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
                        mostrarModalesDeLogrosSecuencialmente(nuevosLogrosDesbloqueadosEnEstaPartida);
                    }
                } else {
                    console.warn("CrackTotalLogrosAPI no disponible para verificar nuevos logros.");
                }
            } catch (error) {
                console.error("Error al procesar logros:", error);
            }
        }, 100);
        */
        // <<<--- FIN: DETECTAR Y MOSTRAR NUEVOS LOGROS --- >>>

        // --- Lógica del Modal de Resultado de Partida (EXISTENTE) --- 
        // Ya movimos la creación del modal para que se muestre antes de cualquier operación asíncrona
        // El modal ya se está mostrando en este punto, así que no necesitamos llamar a createResultModal nuevamente
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
        modalOverlay.id = 'gameResultModal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content result-modal';
        
        // Create modal header with icon
        const modalHeader = document.createElement('div');
        modalHeader.className = 'result-modal-header';
        modalHeader.classList.add(`result-header-${type}`);
        modalHeader.innerHTML = `
            <div class="result-icon">${icon}</div>
            <h2 class="result-title">${title}</h2>
            <p class="result-message">${message}</p>
        `;
        
        // Create horizontal layout container
        const horizontalLayout = document.createElement('div');
        horizontalLayout.className = 'modal-horizontal-layout';
        
        // Create stats container (left side)
        const statsContainer = document.createElement('div');
        statsContainer.className = 'result-stats';
        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label"><i class="fas fa-check-circle"></i> Aciertos</span>
                <span class="stat-value correct-stat">${stats.correctAnswers}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><i class="fas fa-times-circle"></i> Errores</span>
                <span class="stat-value incorrect-stat">${stats.incorrectAnswers}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><i class="fas fa-question-circle"></i> Sin responder</span>
                <span class="stat-value">${stats.unanswered}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><i class="fas fa-clock"></i> Tiempo usado</span>
                <span class="stat-value">${stats.timeFormatted}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><i class="fas fa-bullseye"></i> Precisión</span>
                <span class="stat-value">${stats.accuracy}%</span>
            </div>
        `;
        
        // Create sidebar for additional info (right side)
        const sidebar = document.createElement('div');
        sidebar.className = 'modal-sidebar';
        
        // Quick stats summary for sidebar
        const quickStats = document.createElement('div');
        quickStats.className = 'errors-container';
        
        let sidebarContent = `<h3 class="errors-title">Resumen Rápido</h3>`;
        
        if (gameErrors.length > 0) {
            sidebarContent += `
                <div class="quick-summary">
                    <p style="color: rgba(255, 255, 255, 0.8); font-size: 0.875rem; margin-bottom: 16px; text-align: center;">
                        Has cometido <strong>${gameErrors.length}</strong> error${gameErrors.length > 1 ? 'es' : ''} durante la partida.
                    </p>
                </div>
                <div class="errors-list">
            `;
            gameErrors.slice(0, 3).forEach(error => { // Show only first 3 errors
                sidebarContent += `
                    <div class="error-item">
                        <div class="error-letter">${error.letter}</div>
                        <div class="error-details">
                            <div class="error-question">${error.question.substring(0, 80)}...</div>
                            <div class="error-answers">
                                <span class="user-answer">Tu respuesta: <strong>${error.userAnswer}</strong></span>
                                <span class="correct-answer">Correcta: <strong>${error.correctAnswer}</strong></span>
                            </div>
                        </div>
                    </div>
                `;
            });
            sidebarContent += `</div>`;
            
            if (gameErrors.length > 3) {
                sidebarContent += `
                    <div style="text-align: center; margin-top: 16px;">
                        <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem;">
                            Y ${gameErrors.length - 3} error${gameErrors.length - 3 > 1 ? 'es' : ''} más...
                        </p>
                    </div>
                `;
            }
        } else {
            sidebarContent += `
                <div class="no-errors">
                    <i class="fas fa-trophy" style="font-size: 2rem; color: #31E5B2; margin-bottom: 12px;"></i>
                    <p>¡Perfecto!</p>
                    <p style="font-size: 0.875rem; margin-top: 8px;">No has cometido ningún error.</p>
                </div>
            `;
        }
        
        quickStats.innerHTML = sidebarContent;
        sidebar.appendChild(quickStats);
        
        // Assemble horizontal layout
        horizontalLayout.appendChild(statsContainer);
        horizontalLayout.appendChild(sidebar);
        
        // --- Create buttons Container --- 
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'result-buttons';

        // --- Botones principales de acción ---
        const playAgainButton = document.createElement('button');
        playAgainButton.className = 'modal-button primary play-again-button';
        playAgainButton.innerHTML = `
            <i class="fas fa-redo-alt"></i>
            Jugar Otra Vez
        `;

        const backToGamesButton = document.createElement('button');
        backToGamesButton.className = 'modal-button tertiary back-games-button';
        backToGamesButton.innerHTML = `
            <i class="fas fa-gamepad"></i>
            Volver a Juegos
        `;

        // --- Botones secundarios ---
        const viewProfileButton = document.createElement('button');
        viewProfileButton.className = 'modal-button secondary-button';
        viewProfileButton.innerHTML = `
            <i class="fas fa-user"></i>
            Ver Perfil
        `;
        
        const shareTwitterButton = document.createElement('button');
        shareTwitterButton.className = 'modal-button share-button twitter-x-button';
        shareTwitterButton.innerHTML = `
            <i class="fab fa-x-twitter"></i> Compartir
        `;

        const shareWhatsAppButton = document.createElement('button');
        shareWhatsAppButton.className = 'modal-button share-button';
        shareWhatsAppButton.innerHTML = `
            <i class="fab fa-whatsapp"></i> Compartir
        `;

        // Añadir botones al contenedor
        buttonsContainer.appendChild(playAgainButton);
        buttonsContainer.appendChild(backToGamesButton);
        buttonsContainer.appendChild(viewProfileButton);
        buttonsContainer.appendChild(shareTwitterButton);
        buttonsContainer.appendChild(shareWhatsAppButton);
        
        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(horizontalLayout);
        modalContent.appendChild(buttonsContainer);
        modalOverlay.appendChild(modalContent);
        
        // Add modal to the DOM
        document.body.appendChild(modalOverlay);
        
        // --- Add event listeners --- 
        viewProfileButton.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });

        shareTwitterButton.addEventListener('click', () => {
            const score = stats.correctAnswers;
            const total = alphabet.length;
            const gameUrl = 'https://www.cracktotal.com/pasalache.html'; 
            const twitterHandle = '@cracktotal_';
            let tweetText = `¡Hice ${score}/${total} en el #PasalaChe de #CrackTotal! ⚽️🇦🇷 ¿Te animás a superarme? ${twitterHandle}`; 
            
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(gameUrl)}`;
            window.open(twitterUrl, '_blank');
        });

        shareWhatsAppButton.addEventListener('click', () => {
            const score = stats.correctAnswers;
            const total = alphabet.length;
            const gameUrl = 'https://www.cracktotal.com/pasalache.html'; 
            let whatsappText = `¡Hice ${score}/${total} en el Pasala Che de Crack Total! ⚽️🇦🇷 ¿Te animás a superarme? ${gameUrl}`;

            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
            window.open(whatsappUrl, '_blank');
        });

        // --- Add event listeners --- 
        playAgainButton.addEventListener('click', () => {
            modalOverlay.remove();
            location.reload(); // Recargar la página para empezar una nueva partida
        });

        backToGamesButton.addEventListener('click', () => {
            window.location.href = 'games.html';
        });

        viewProfileButton.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });

        shareTwitterButton.addEventListener('click', () => {
            const score = stats.correctAnswers;
            const total = alphabet.length;
            const gameUrl = 'https://www.cracktotal.com/pasalache.html'; 
            const twitterHandle = '@cracktotal_';
            let tweetText = `¡Hice ${score}/${total} en el #PasalaChe de #CrackTotal! ⚽️🇦🇷 ¿Te animás a superarme? ${twitterHandle}`; 
            
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(gameUrl)}`;
            window.open(twitterUrl, '_blank');
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
        modalOverlay.id = 'statsDetailModal';
        
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
        
        // Create horizontal layout container
        const horizontalLayout = document.createElement('div');
        horizontalLayout.className = 'modal-horizontal-layout';
        
        // Create performance summary (left side)
        const performanceSummary = document.createElement('div');
        performanceSummary.className = 'performance-summary';
        
        // Calculate stats
        const accuracy = (correctAnswers + incorrectAnswers) > 0 ? Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 100) : 0;
        const completionPercentage = Math.round((correctAnswers / alphabet.length) * 100);
        
        performanceSummary.innerHTML = `
            <div class="performance-item">
                <span class="performance-label"><i class="fas fa-percentage"></i> Completado</span>
                <span class="performance-value">${completionPercentage}%</span>
            </div>
            <div class="performance-item">
                <span class="performance-label"><i class="fas fa-bullseye"></i> Precisión</span>
                <span class="performance-value">${accuracy}%</span>
            </div>
            <div class="performance-item">
                <span class="performance-label"><i class="fas fa-lightbulb"></i> Pistas usadas</span>
                <span class="performance-value">${helpUsed}/${maxHelp}</span>
            </div>
            <div class="performance-item">
                <span class="performance-label"><i class="fas fa-forward"></i> Pasapalabras</span>
                <span class="performance-value">${passedAnswers || 0}</span>
            </div>
        `;
        
        // Create errors container (right side - sidebar)
        const sidebar = document.createElement('div');
        sidebar.className = 'modal-sidebar';
        
        const errorsContainer = document.createElement('div');
        errorsContainer.className = 'errors-container';
        
        let errorsHTML = `<h3 class="errors-title">Errores Cometidos</h3>`;
        
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
            errorsHTML += `<div class="no-errors">¡No has cometido ningún error! ¡Excelente!</div>`;
        }
        
        errorsContainer.innerHTML = errorsHTML;
        sidebar.appendChild(errorsContainer);
        
        // Assemble horizontal layout
        horizontalLayout.appendChild(performanceSummary);
        horizontalLayout.appendChild(sidebar);
        
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
        
        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(horizontalLayout);
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
        modalContent.style.position = 'relative'; // Necesario para posicionar el botón X
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

        // Crear botón de cierre (X)
        const closeButton = document.createElement('button');
        closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        closeButton.className = 'feedback-close-btn';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '8px';
        closeButton.style.right = '8px';
        closeButton.style.background = 'transparent';
        closeButton.style.border = 'none';
        closeButton.style.color = 'var(--text-light, #94A1B2)';
        closeButton.style.cursor = 'pointer';
        closeButton.style.padding = '4px';
        closeButton.style.borderRadius = '50%';
        closeButton.style.display = 'flex';
        closeButton.style.alignItems = 'center';
        closeButton.style.justifyContent = 'center';
        closeButton.style.transition = 'background-color 0.2s ease, color 0.2s ease';
        
        // Hover state (inline por ahora)
        closeButton.onmouseover = () => {
            closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            closeButton.style.color = 'white';
        };
        closeButton.onmouseout = () => {
            closeButton.style.backgroundColor = 'transparent';
            closeButton.style.color = 'var(--text-light, #94A1B2)';
        };

        modalContent.innerHTML = `
            <div style="color: ${color}; margin-bottom: 10px;">${iconHtml}</div>
            <p style="font-size: 1rem; color: var(--text, #FFFFFE); margin: 0;">${message}</p>
        `;
        modalContent.style.border = `2px solid ${color}`;

        // Añadir el botón de cierre al contenido del modal
        modalContent.appendChild(closeButton);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Función para cerrar el modal
        const closeModal = () => {
            clearTimeout(timeoutId); // Detener el cierre automático
            modalOverlay.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95)';
            setTimeout(() => modalOverlay.remove(), 300); // Esperar a que termine la animación
        };

        // Event listener para el botón de cierre
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que el clic se propague al overlay
            closeModal();
        });

        // Event listener para teclas Escape y Enter
        const keyHandler = (e) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                closeModal();
                document.removeEventListener('keydown', keyHandler); // Limpiar el event listener
            }
        };
        document.addEventListener('keydown', keyHandler);

        // Trigger fade-in and scale-up animation
        requestAnimationFrame(() => {
            modalOverlay.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        });

        // Auto-remove after duration
        const timeoutId = setTimeout(() => {
            closeModal();
            document.removeEventListener('keydown', keyHandler); // Limpiar el event listener
        }, duration);

        // Allow clicking overlay to dismiss early
        modalOverlay.addEventListener('click', () => {
            closeModal();
            document.removeEventListener('keydown', keyHandler); // Limpiar el event listener
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
        
        // Add click outside modal functionality to return to games.html
        gameRulesModal.addEventListener('click', function(e) {
            // Si el click fue en el overlay (fondo) y no en el contenido del modal
            if (e.target === gameRulesModal) {
                window.location.href = 'games.html';
            }
        });
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

        // Obtener la definición completa del logro desde el sistema global de logros
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

    // Enhanced function for incomplete feedback with better UX
    function showEnhancedIncompleteFeedback(message, remainingAttempts) {
        // Remove existing incomplete feedback
        const existingFeedback = document.querySelector('.enhanced-incomplete-modal');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay enhanced-incomplete-modal';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.right = '0';
        modalOverlay.style.bottom = '0';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modalOverlay.style.display = 'flex';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.alignItems = 'center';
        modalOverlay.style.zIndex = '1200';
        modalOverlay.style.opacity = '0';
        modalOverlay.style.transition = 'opacity 0.3s ease';

        const modalContent = document.createElement('div');
        modalContent.className = 'enhanced-incomplete-content';
        modalContent.style.background = 'linear-gradient(135deg, rgba(255, 142, 60, 0.15), rgba(255, 193, 7, 0.1))';
        modalContent.style.backdropFilter = 'blur(20px)';
        modalContent.style.padding = '30px';
        modalContent.style.borderRadius = '16px';
        modalContent.style.maxWidth = '420px';
        modalContent.style.textAlign = 'center';
        modalContent.style.color = 'white';
        modalContent.style.boxShadow = '0 15px 35px rgba(0,0,0,0.4), 0 0 0 1px rgba(255, 142, 60, 0.3)';
        modalContent.style.border = '2px solid rgba(255, 142, 60, 0.4)';
        modalContent.style.transform = 'scale(0.9) translateY(20px)';
        modalContent.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        modalContent.style.position = 'relative';

        const iconHtml = `
            <div style="color: #FF8E3C; margin-bottom: 15px; font-size: 3rem;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
        `;

        const titleHtml = `
            <h3 style="color: #FFD166; margin: 0 0 15px 0; font-size: 1.4rem; font-weight: 700;">
                ¡Respuesta Incompleta!
            </h3>
        `;

        const messageHtml = `
            <p style="color: rgba(255,255,255,0.95); margin: 0 0 20px 0; font-size: 1rem; line-height: 1.5;">
                ${message}
            </p>
        `;

        const attemptsIndicator = remainingAttempts > 0 ? `
            <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 25px;">
                ${Array.from({length: maxIncompleteAnswers}, (_, i) => {
                    const isUsed = i < (maxIncompleteAnswers - remainingAttempts);
                    return `<div style="
                        width: 12px; 
                        height: 12px; 
                        border-radius: 50%; 
                        background: ${isUsed ? '#FF5A5A' : '#31E5B2'};
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    "></div>`;
                }).join('')}
            </div>
        ` : '';

        const instructionHtml = `
            <p style="color: rgba(255,255,255,0.8); margin: 0 0 25px 0; font-size: 0.9rem; font-style: italic;">
                Edita tu respuesta y presiona <strong>Enter<strong> para continuar
            </p>
        `;

        modalContent.innerHTML = iconHtml + titleHtml + messageHtml + attemptsIndicator + instructionHtml;
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Función para cerrar el modal
        const closeModal = () => {
            modalOverlay.style.opacity = '0';
            modalContent.style.transform = 'scale(0.9) translateY(20px)';
            setTimeout(() => {
                if (modalOverlay.parentNode) {
                    modalOverlay.remove();
                }
                // Re-focus input after modal is closed
                if (answerInput) {
                    answerInput.focus();
                }
            }, 300);
        };

        // Close on Enter key or Escape
        const keyHandler = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);

        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
                document.removeEventListener('keydown', keyHandler);
            }
        });

        // Auto-close after 4 seconds
        setTimeout(() => {
            if (modalOverlay.parentNode) {
                closeModal();
                document.removeEventListener('keydown', keyHandler);
            }
        }, 4000);

        // Trigger fade-in animation
        requestAnimationFrame(() => {
            modalOverlay.style.opacity = '1';
            modalContent.style.transform = 'scale(1) translateY(0)';
        });
    }

    // Simple alias for the specific incomplete feedback
    function showIncompleteFeedback(message) {
        showTemporaryFeedback(message, 'warning', 2000); // Show for 2 seconds (changed from 3000)
    }
}); 