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

    // Game variables
    let questions = [];
    let currentLetterIndex = 0;
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let passedAnswers = 0;
    let pendingLetters = [];
    let letterStatuses = {}; // 'correct', 'incorrect', 'pending', 'unanswered'
    let hintDisplayed = {}; // Rastrear para qué letras se ha mostrado una pista
    let letterHints = {}; // Almacena las pistas para cada letra
    let selectedQuestionIndices = {}; // Almacena el índice de pregunta seleccionado para cada letra
    let gameErrors = []; // Almacena los errores para mostrarlos en el modal de estadísticas
    
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let totalTime = 240; // Default: Normal difficulty (240 seconds)
    let timeLeft = totalTime;
    let timerInterval;
    let maxErrors = 2; // Maximum number of errors allowed
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
        selectedQuestionIndices = {};
        gameErrors = [];
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
    
    // Setup the letter circles
    function setupLetters() {
        // Clear existing letters
        lettersContainer.innerHTML = '';
        
        // Calculate positions in a circle
        const radius = lettersContainer.offsetWidth / 2;
        const letterSize = 50; // Match the CSS width of letters (updated)
        
        alphabet.split('').forEach((letter, index) => {
            const letterElement = document.createElement('div');
            letterElement.className = 'letter';
            letterElement.textContent = letter;
            letterElement.dataset.letter = letter;
            
            // Añadir un elemento para mostrar la pista
            const hintElement = document.createElement('span');
            hintElement.className = 'letter-hint';
            hintElement.id = `hint-${letter}`;
            letterElement.appendChild(hintElement);
            
            // Calculate position on circle
            const angleRadians = (index / alphabet.length) * 2 * Math.PI;
            
            // Position from center using cos and sin
            // Adjust radius to account for letter size (position on exact edge)
            const adjustedRadius = radius - (letterSize / 2);
            const posX = adjustedRadius * Math.sin(angleRadians);
            const posY = -adjustedRadius * Math.cos(angleRadians);
            
            // Position letter
            letterElement.style.transform = `translate(${posX}px, ${posY}px)`;
            
            lettersContainer.appendChild(letterElement);
            
            // Add click event to jump to that letter
            letterElement.addEventListener('click', () => {
                if (letterStatuses[letter] === 'unanswered' || letterStatuses[letter] === 'pending') {
                    goToLetter(letter);
                }
            });
        });
        
        // Añadir estilos CSS para las pistas
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
    
    // Initialize letter statuses
    function setupLetterStatuses() {
        alphabet.split('').forEach(letter => {
            letterStatuses[letter] = 'unanswered';
            pendingLetters.push(letter);
        });
    }
    
    // Start the game
    function startGame() {
        currentLetterIndex = 0;
        loadQuestion();
    }
    
    // Load a question for the current letter
    function loadQuestion() {
        if (pendingLetters.length === 0) {
            endGame();
            return;
        }
        
        const currentLetter = pendingLetters[currentLetterIndex];
        
        // Find letter data from questions array
        const letterData = questions.find(item => item.letra === currentLetter);
        
        if (letterData) {
            // Verificar si ya tenemos un índice de pregunta seleccionado para esta letra
            if (selectedQuestionIndices[currentLetter] === undefined) {
                // Si no existe, seleccionar uno aleatorio y almacenarlo
                selectedQuestionIndices[currentLetter] = Math.floor(Math.random() * letterData.preguntas.length);
            }
            
            // Usar el índice almacenado para esta letra
            currentQuestionIndex = selectedQuestionIndices[currentLetter];
            const question = letterData.preguntas[currentQuestionIndex];
            
            // Guardar la respuesta para las pistas
            letterHints[currentLetter] = letterData.preguntas[currentQuestionIndex].respuesta.substring(0, 3);
            
            // Update UI
            currentLetterElement.textContent = currentLetter;
            currentLetterTextElement.textContent = currentLetter;
            
            // Set question text and identify question type
                questionTextElement.textContent = question.pregunta;
            
            // Remove any previous question type classes
            questionTextElement.classList.remove('question-type-starts', 'question-type-contains');
            
            // También actualizar el encabezado de la pregunta
            const questionHeader = document.querySelector('.question-header');
            if (questionHeader) {
                questionHeader.classList.remove('question-type-starts', 'question-type-contains');
                
                // Actualizar el texto del encabezado según el tipo de pregunta
                const headerText = questionHeader.querySelector('h3');
                if (headerText) {
                    if (question.pregunta.startsWith('CONTIENE')) {
                        headerText.innerHTML = `Contiene <span id="currentLetterText">${currentLetter}</span>:`;
                        questionHeader.classList.add('question-type-contains');
            } else {
                        headerText.innerHTML = `Comienza con <span id="currentLetterText">${currentLetter}</span>:`;
                        questionHeader.classList.add('question-type-starts');
                    }
                }
            }
            
            // Add appropriate class based on question type
            if (question.pregunta.startsWith('CONTIENE')) {
                questionTextElement.classList.add('question-type-contains');
            } else {
                // Default is "comienza con"
                questionTextElement.classList.add('question-type-starts');
            }
            
            // Highlight current letter
            updateLetterStyles();
            
            // Clear input and focus
            answerInput.value = '';
            answerInput.focus();
            
            // Si esta letra ya tenía una pista mostrada anteriormente, mostrarla automáticamente
            if (hintDisplayed[currentLetter]) {
                showHint();
            }
        } else {
            // Skip this letter if no questions found
            nextLetter();
        }
    }
    
    // Update letter circle styles based on status
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
    
    // Move to the next letter
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
        
        if (letterData) {
            const correctAnswer = letterData.preguntas[currentQuestionIndex].respuesta.toLowerCase();
            userAnswer = userAnswer.toLowerCase().trim();
            
            // Solo verificar si es incompleta cuando realmente parece ser una respuesta parcial
            // y no una respuesta errónea completa
            if (isIncompleteAnswer(userAnswer, correctAnswer) && isPartiallyCorrect(userAnswer, correctAnswer)) {
                if (incompleteAnswersUsed < maxIncompleteAnswers) {
                    incompleteAnswersUsed++;
                    const remainingAttempts = maxIncompleteAnswers - incompleteAnswersUsed;
                    showFeedback(`Respuesta incompleta. Te ${remainingAttempts === 1 ? 'queda 1 intento' : 'quedan ' + remainingAttempts + ' intentos'} para respuestas incompletas.`, 'warning');
                    return;
                }
            }
            
            // Verificar si la respuesta es lo suficientemente correcta (permite errores ortográficos menores)
            const isCorrect = isAnswerCorrectEnough(userAnswer, correctAnswer);
            
            // Si la respuesta es incorrecta, guardar el error para mostrarlo en estadísticas
            if (!isCorrect) {
                const question = letterData.preguntas[currentQuestionIndex].pregunta;
                gameErrors.push({
                    letter: currentLetter,
                    question: question,
                    userAnswer: userAnswer,
                    correctAnswer: correctAnswer
                });
            }
            
            // Update letter status
            letterStatuses[currentLetter] = isCorrect ? 'correct' : 'incorrect';
            
            // Update counters
            if (isCorrect) {
                correctAnswers++;
                // No mostrar modal de correcto
            } else {
                incorrectAnswers++;
                // No mostrar modal de incorrecto
            }
            
            // Update score displays
            updateScoreDisplays();
            
            // Update letter styles to show correct/incorrect
            updateLetterStyles();
            
            // Remove letter from pending list
            pendingLetters.splice(currentLetterIndex, 1);
            
            // Adjust index if needed
            if (currentLetterIndex >= pendingLetters.length && pendingLetters.length > 0) {
                currentLetterIndex = 0;
            }
                
            // Check if game should end
                if (incorrectAnswers > maxErrors) {
                endGame('defeat');
                    return;
                }
            
            if (pendingLetters.length === 0) {
                endGame('victory');
                return;
            }
            
            // Load next question immediately since no feedback is shown
            setTimeout(loadQuestion, 150);
        }
    }
    
    // Determina si una respuesta es incompleta
    function isIncompleteAnswer(userAnswer, correctAnswer) {
        // Si la respuesta es una subcadena exacta de la respuesta correcta
        // y es menos del 80% de la longitud total, se considera incompleta
        if (correctAnswer.includes(userAnswer) && userAnswer.length < correctAnswer.length * 0.8) {
            return true;
        }
        
        // Comprobar si la respuesta contiene solo el apellido o solo el nombre
        const words = correctAnswer.split(' ');
        if (words.length > 1) {
            // Si la respuesta correcta tiene múltiples palabras (nombre y apellido)
            // y el usuario solo ha puesto una parte
            for (const word of words) {
                if (userAnswer === word || userAnswer.startsWith(word) || word.startsWith(userAnswer)) {
                    return true;
                }
            }
            }
            
        // Si la respuesta del usuario es significativamente más corta
        if (userAnswer.length < correctAnswer.length * 0.6) {
            return true;
        }
        
        return false;
    }
    
    // Verifica si la respuesta es parcialmente correcta (contiene parte de la respuesta correcta)
    function isPartiallyCorrect(userAnswer, correctAnswer) {
        // Si la respuesta del usuario está contenida en la respuesta correcta
        if (correctAnswer.includes(userAnswer)) {
            return true;
        }
        
        // Comprobar si alguna palabra de la respuesta correcta está en la respuesta del usuario
        const correctWords = correctAnswer.split(' ');
        const userWords = userAnswer.split(' ');
        
        for (const word of correctWords) {
            if (word.length > 2) { // Solo considerar palabras significativas
                for (const userWord of userWords) {
                    if (userWord.includes(word) || word.includes(userWord)) {
                        return true;
                }
                }
        }
        }
        
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
                return; // No hay más ayudas disponibles
            }
            
            // Incrementar contador de ayudas usadas
                    helpUsed++;
                    
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
        if (letterData) {
            const correctAnswer = letterData.preguntas[currentQuestionIndex].respuesta;
            const hint = correctAnswer.substring(0, 3);
            
            // Mostrar la pista junto a la letra en el rosco
            const letterElement = document.querySelector(`.letter[data-letter="${currentLetter}"]`);
            if (letterElement) {
                letterElement.classList.add('with-hint');
                const hintElement = letterElement.querySelector(`#hint-${currentLetter}`);
                if (hintElement) {
                    hintElement.textContent = hint;
                }
            }
        }
    }
    
    // Mark current letter as "pasapalabra"
    function pasapalabra() {
        const currentLetter = pendingLetters[currentLetterIndex];
        
        // Solo marcar como pendiente y contar si no ha sido pasada antes
        if (letterStatuses[currentLetter] === 'unanswered') {
        letterStatuses[currentLetter] = 'pending';
            passedAnswers++;
            
            // Update score displays
            updateScoreDisplays();
        }
        
        // Move to next letter
        nextLetter();
        
        // Update letter styles
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
        const percentage = (timeLeft / totalTime) * 100;
        timerBar.style.width = `${percentage}%`;
        
        // Update timer count
        const timerCount = document.getElementById('timerCount');
        if (timerCount) {
            timerCount.textContent = timeLeft;
        }
        
        // Change color when time is running out
        if (percentage < 20) {
            timerBar.style.backgroundColor = '#FF5470'; // red
        } else if (percentage < 50) {
            timerBar.style.backgroundColor = '#FF8E3C'; // orange
        } else {
            timerBar.style.backgroundColor = '#31D0AA'; // green
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
        
        const goHomeButton = document.createElement('button');
        goHomeButton.className = 'play-again-button';
        goHomeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Volver a inicio
        `;
        
        buttonsContainer.appendChild(viewStatsButton);
        buttonsContainer.appendChild(viewProfileButton);
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
    
    // Event Listeners
    answerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const userAnswer = answerInput.value.trim();
        
        if (userAnswer) {
            checkAnswer(userAnswer);
        } else {
            // Si la respuesta está vacía, se comporta igual que "Pasala Che"
            pasapalabra();
        }
    });
    
    pasapalabraButton.addEventListener('click', pasapalabra);
    
    // Add help button when game starts
    if (startGameButton) {
        startGameButton.addEventListener('click', function() {
            // Add help button when game starts with a slight delay to ensure DOM is ready
            setTimeout(addHelpButton, 100);
        });
    }
}); 