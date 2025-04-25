document.addEventListener('DOMContentLoaded', function() {
    // Stats Profile Keys
    const STATS_KEY = 'pasalacheUserStats';
    const HISTORY_KEY = 'pasalacheGameHistory'; // Nueva clave para el historial
    const HISTORY_LIMIT = 15; // Límite de partidas en el historial

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
    
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let totalTime = 240; // Default: Normal difficulty (240 seconds)
    let timeLeft = totalTime;
    let timerInterval;
    let maxErrors = 3; // Maximum number of errors allowed
    let helpUsed = 0; // Track help usage
    let maxHelp = 2; // Maximum number of helps
    let incompleteAnswersUsed = 0; // Track incomplete answers
    let maxIncompleteAnswers = 2; // Maximum incomplete answers allowed
    let completedRounds = 0; // Contador de vueltas completas
    
    // DOM elements
    const lettersContainer = document.getElementById('lettersContainer');
    const currentLetterElement = document.getElementById('currentLetter');
    const currentLetterTextElement = document.getElementById('currentLetterText');
    const questionTextElement = document.getElementById('questionText');
    const answerForm = document.getElementById('answerForm');
    const answerInput = document.getElementById('answerInput');
    const pasapalabraButton = document.getElementById('pasapalabraButton');
    const submitButton = document.getElementById('submitButton');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const correctCountDisplay = document.getElementById('correctCount');
    const passedCountDisplay = document.getElementById('passedCount');
    const incorrectCountDisplay = document.getElementById('incorrectCount');
    const timerBar = document.getElementById('timerBar');
    
    // Rules modal elements
    const gameRulesModal = document.getElementById('gameRulesModal');
    const startGameButton = document.getElementById('startGameButton');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    
    // Handle difficulty selection
    difficultyButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set game time based on difficulty
            const difficulty = this.getAttribute('data-difficulty');
            switch(difficulty) {
                case 'facil':
                    totalTime = 300; // 5 minutes
                    break;
                case 'dificil':
                    totalTime = 180; // 3 minutes
                    break;
                default:
                    totalTime = 240; // 4 minutes (normal)
            }
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
        timeLeft = totalTime;
        helpUsed = 0;
        incompleteAnswersUsed = 0;
        completedRounds = 0;
        
        // Update score displays
        updateScoreDisplays();
        
        // Fetch questions
        fetch('data/questions_pasapalabra.json')
            .then(response => response.json())
            .then(data => {
                questions = data;
                setupLetters();
                setupLetterStatuses();
                startGame();
                startTimer();
            })
            .catch(error => {
                console.error('Error loading questions:', error);
                questionTextElement.textContent = 'Error cargando preguntas. Por favor, recarga la página.';
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
        loadQuestion();
    }
    
    // Load question for the current letter
    function loadQuestion() {
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
            endGame();
            return;
        }

        const currentLetter = pendingLetters[currentLetterIndex];
        const letterData = questions.find(item => item.letra === currentLetter);

        if (letterData && letterData.preguntas && letterData.preguntas.length > 0) {
            let foundQuestion = false;
            let question = null;

            // Create a list of indices and shuffle them to try randomly
            let availableIndices = Array.from(letterData.preguntas.keys());
            availableIndices.sort(() => Math.random() - 0.5); // Shuffle indices

            for (let i = 0; i < availableIndices.length; i++) {
                let testIndex = availableIndices[i];
                let potentialQuestion = letterData.preguntas[testIndex];
                let potentialAnswer = potentialQuestion.respuesta;

                if (!checkAnswerConflict(potentialAnswer, usedAnswerSignatures)) {
                    // Found a non-conflicting question
                    currentQuestionIndex = testIndex; // Store the index of the selected question
                    question = potentialQuestion;
                    letterHints[currentLetter] = potentialAnswer.substring(0, 3);
                    foundQuestion = true;
                    break; // Exit loop once a valid question is found
                }
            }

            if (!foundQuestion) {
                console.warn(`No non-conflicting question found for letter ${currentLetter}. Skipping.`);
                // Automatically pass the word if no valid question is found after checking all
                pasapalabra(true); // Pass silently without counting as user action
                return; // Exit function to avoid displaying anything
            }

            // --- Display the found question --- 
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
            
            // Al completar una vuelta, limpiar el estado "pending" de todas las letras
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
            const correctAnswerNorm = correctAnswerFull.toLowerCase().trim();
            const userAnswerNorm = userAnswer.toLowerCase().trim();

            // 1. Check for INCOMPLETENESS first
            if (isIncompleteAnswer(userAnswerNorm, correctAnswerNorm)) {
                if (incompleteAnswersUsed < maxIncompleteAnswers) {
                    incompleteAnswersUsed++;
                    const remainingAttempts = maxIncompleteAnswers - incompleteAnswersUsed;
                    // Show specific feedback for incomplete answer
                    showIncompleteFeedback(`Respuesta incompleta. Te ${remainingAttempts === 1 ? 'queda 1 intento' : 'quedan ' + remainingAttempts + ' intentos'} para respuestas incompletas.`);
                    // DO NOT clear input here, let user edit
                    // answerInput.value = '';
                    answerInput.focus();
                    return; // Stop processing for this answer attempt
                } else {
                     // User is out of incomplete attempts, show message and treat as incorrect
                     showTemporaryFeedback("Respuesta incompleta y sin intentos restantes. Se cuenta como error.", "error", 3000);
                     // Fall through to the incorrect logic below
                     console.log("Incomplete answer, but no attempts left. Treating as incorrect.");
                     // No return here, let it be processed as incorrect
                }
            }

            // 2. If not incomplete (or out of attempts), check for CORRECTNESS
            const isCorrect = isAnswerCorrectEnough(userAnswerNorm, correctAnswerNorm);

            if (!isCorrect) {
                // Record error details ONLY if it wasn't an incomplete answer out of attempts
                if (!isIncompleteAnswer(userAnswerNorm, correctAnswerNorm) || incompleteAnswersUsed >= maxIncompleteAnswers) {
                    const question = letterData.preguntas[currentQuestionIndex].pregunta;
                    gameErrors.push({
                        letter: currentLetter,
                        question: question,
                        userAnswer: userAnswer, // Store original user input
                        correctAnswer: correctAnswerFull // Store original correct answer
                    });
                }
                incorrectAnswers++; // Increment incorrect count if !isCorrect
            }

            // Update status and counters
            letterStatuses[currentLetter] = isCorrect ? 'correct' : 'incorrect';
            if (isCorrect) {
                correctAnswers++;
                usedAnswerSignatures.add(correctAnswerNorm); // Add CORRECT answer signature
                console.log("Added to used signatures:", correctAnswerNorm, usedAnswerSignatures);
                // Update aggregated stats immediately
                profileStats.totalCorrectAnswers += 1;
            } else {
                 // incorrectAnswers already incremented above
                 // Update aggregated stats immediately
                 profileStats.totalIncorrectAnswers += 1;
            }

            // Common updates after correct or incorrect (but not incomplete with attempts left)
            updateScoreDisplays();
            updateLetterStyles();
            pendingLetters.splice(currentLetterIndex, 1); // Remove from pending

            // Adjust index for next question
            if (currentLetterIndex >= pendingLetters.length && pendingLetters.length > 0) {
                currentLetterIndex = 0; // Wrap around if needed
            } else if (pendingLetters.length === 0) {
                 // No letters left, handled below
            } else {
                 // currentLetterIndex remains valid, no change needed before loadQuestion
            }

            // Check end game conditions AFTER processing the answer
            if (incorrectAnswers >= maxErrors) { // Use >= because we check after incrementing
                saveProfileStats(profileStats); // Save stats before ending
                endGame('defeat');
                return; // End game due to errors
            }
            if (pendingLetters.length === 0) {
                saveProfileStats(profileStats); // Save stats before ending
                endGame('victory');
                return; // End game successfully
            }

            // Load next question if game continues
            setTimeout(() => {
                 answerInput.value = ''; // Clear input AFTER processing and BEFORE next question
                 loadQuestion();
            }, 150); // Short delay to show letter color change

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
    function isAnswerCorrectEnough(userAnswer, correctAnswer) {
        // Exact match
        if (userAnswer === correctAnswer) {
            return true;
        }
        
        // Si la respuesta del usuario contiene la respuesta correcta completa
        // (por ejemplo, "Real Madrid Club de Fútbol" cuando la respuesta es "Real Madrid")
        if (userAnswer.includes(correctAnswer)) {
            return true;
        }
        
        // Comprobar el caso inverso pero con un alto umbral de similitud
        // Si la respuesta correcta está casi completamente contenida en la respuesta del usuario
        const correctWords = correctAnswer.split(' ');
        let allWordsFound = true;
        
        for (const word of correctWords) {
            if (word.length > 2) { // Solo verificar palabras significativas (más de 2 letras)
                // Buscar la palabra en la respuesta del usuario con cierta tolerancia
                const wordFound = userAnswer.split(' ').some(userWord => 
                    calculateStringSimilarity(userWord, word) > 0.85
                );
                
                if (!wordFound) {
                    allWordsFound = false;
                    break;
                }
            }
        }
        
        if (allWordsFound) {
            return true;
        }
        
        // Calculate similarity for the entire string comparison
        const similarity = calculateStringSimilarity(userAnswer, correctAnswer);
        
        // Permitir errores menores si la similitud es alta
        // Umbral ajustado para ser más tolerante con errores ortográficos menores
        return similarity > 0.85;
    }
    
    // Calculate string similarity (Levenshtein distance based)
    function calculateStringSimilarity(a, b) {
        if (a.length === 0) return 0;
        if (b.length === 0) return 0;
        
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
        return 1 - (distance / maxLength);
    }
    
    // Add help button functionality
    function addHelpButton() {
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
        const questionCard = document.querySelector('.question-card');
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
    function endGame(result = 'timeout') {
        clearInterval(timerInterval);
        
        const timeSpent = totalTime - timeLeft;
        
        // --- Actualizar Estadísticas Agregadas --- 
        let profileStats = loadProfileStats();
        profileStats.gamesPlayed += 1;
        profileStats.totalCorrectAnswers += correctAnswers;
        profileStats.totalIncorrectAnswers += incorrectAnswers;
        profileStats.totalPassedAnswers += passedAnswers; // Assuming you track this
        profileStats.totalHelpUsed += helpUsed;

        if (result === 'victory') {
            profileStats.gamesWon += 1;
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
        // --- Fin Actualizar Estadísticas Agregadas ---

        // --- Guardar Partida en Historial --- 
        const gameDataForHistory = {
            date: new Date().toISOString(), // Guardar fecha en formato ISO
            result: result, // 'victory', 'defeat', 'timeout'
            score: correctAnswers,
            errors: incorrectAnswers, 
            time: timeSpent,
            difficulty: document.querySelector('.difficulty-btn.active')?.getAttribute('data-difficulty') || 'normal' // Guardar dificultad
        };
        addGameToHistory(gameDataForHistory);
        // --- Fin Guardar Partida en Historial ---
        
        // --- Lógica del Modal (sin cambios) --- 
        const totalAnswered = correctAnswers + incorrectAnswers;
        const unanswered = alphabet.length - totalAnswered;
        const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
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
        modalHeader.style.background = color;
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
        
        // Create buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'result-buttons';
        
        const viewStatsButton = document.createElement('button');
        viewStatsButton.className = 'stats-button';
        viewStatsButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
            Ver Estadísticas
        `;

        const viewProfileButton = document.createElement('button');
        viewProfileButton.className = 'profile-button';
        viewProfileButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Ver Perfil
        `;
        
        // ---> NEW BUTTON START <---
        const viewRankingButton = document.createElement('button');
        // Reuse profile style, add specific class if needed later for different styling
        viewRankingButton.className = 'ranking-button profile-button'; 
        viewRankingButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg> <!-- Trophy Icon -->
            Ver Ranking
        `;
        // ---> NEW BUTTON END <---
        
        const goHomeButton = document.createElement('button');
        goHomeButton.className = 'play-again-button';
        goHomeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Volver a inicio
        `;
        
        buttonsContainer.appendChild(viewStatsButton);
        buttonsContainer.appendChild(viewProfileButton);
        buttonsContainer.appendChild(viewRankingButton); // Append the new button
        buttonsContainer.appendChild(goHomeButton);
        
        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(statsContainer);
        modalContent.appendChild(buttonsContainer);
        modalOverlay.appendChild(modalContent);
        
        // Add modal to the DOM
        document.body.appendChild(modalOverlay);
        
        // Add event listeners
        viewStatsButton.addEventListener('click', () => {
            showStatsDetailModal();
        });

        viewProfileButton.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
        
        viewRankingButton.addEventListener('click', () => {
            window.location.href = 'ranking.html';
        });
        
        goHomeButton.addEventListener('click', () => {
            modalOverlay.remove(); 
            window.location.href = 'games.html'; 
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
        closeButton.className = 'stats-close-button';
        closeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>
            Cerrar
        `;

        const viewProfileButton = document.createElement('button');
        viewProfileButton.className = 'profile-button';
        viewProfileButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Ver Perfil
        `;
        
        const goHomeButton = document.createElement('button');
        goHomeButton.className = 'stats-play-again-button';
        goHomeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Volver a inicio
        `;
        
        buttonsContainer.appendChild(closeButton);
        buttonsContainer.appendChild(viewProfileButton);
        buttonsContainer.appendChild(goHomeButton);
        
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
        
        goHomeButton.addEventListener('click', () => {
            modalOverlay.remove(); 
            const resultModal = document.querySelector('.game-result-modal');
            if (resultModal) {
                resultModal.remove();
            }
            window.location.href = 'games.html';
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
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
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
            if (!userAnswer) {
                pasapalabra();
            } else {
                checkAnswer(userAnswer);
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
            setTimeout(addHelpButton, 100);
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
        const playerName = localStorage.getItem('crackTotalUsername') || 'Jugador';
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
        const potentialAnswerNorm = potentialAnswer.toLowerCase().trim();
        if (!potentialAnswerNorm) return false; // Empty answer is not a conflict

        const potentialWords = potentialAnswerNorm.split(' ').filter(w => w.length > 2); // Ignore short words

        for (const usedAnswerNorm of usedSignatures) {
            // 1. Check full containment (either way)
            if (usedAnswerNorm.includes(potentialAnswerNorm) || potentialAnswerNorm.includes(usedAnswerNorm)) {
                // Avoid trivial contains like 'a' in 'apple'
                if (potentialAnswerNorm.length > 1 && usedAnswerNorm.length > 1) {
                    console.log(`Conflict (containment): '${potentialAnswerNorm}' vs '${usedAnswerNorm}'`);
                    return true; // Conflict: One contains the other
                }
            }

            // 2. Check for significant word overlap
            const usedWords = usedAnswerNorm.split(' ').filter(w => w.length > 2);
            const commonWords = potentialWords.filter(pw => usedWords.includes(pw));

            // Conflict if > 1 common word, or 1 common word and answers are short (<= 2 significant words)
            if (commonWords.length > 1 || (commonWords.length === 1 && potentialWords.length <= 2 && usedWords.length <= 2)) {
                 console.log(`Conflict (words): '${potentialAnswerNorm}' vs '${usedAnswerNorm}'`);
                 return true;
            }
        }
        return false; // No conflict found
    }
}); 