document.addEventListener('DOMContentLoaded', function() {
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
    let userErrors = []; // Almacena los errores del usuario: {letter, userAnswer, correctAnswer}
    
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
        timeLeft = totalTime;
        helpUsed = 0;
        incompleteAnswersUsed = 0;
        completedRounds = 0;
        userErrors = [];
        
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
            endGame('victory');
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
            
            // Al completar una vuelta, cambiar todas las letras "pending" a "unanswered"
            for (let letter of alphabet.split('')) {
                if (letterStatuses[letter] === 'pending') {
                    letterStatuses[letter] = 'unanswered';
                }
            }
            
            // Actualizar la visualización de las letras
            updateLetterStyles();
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
            
            // Update letter status
            letterStatuses[currentLetter] = isCorrect ? 'correct' : 'incorrect';
            
            // Update counters
            if (isCorrect) {
                correctAnswers++;
                // No mostrar modal de correcto
            } else {
                incorrectAnswers++;
                // Guardar el error para mostrarlo al final
                userErrors.push({
                    letter: currentLetter,
                    question: letterData.preguntas[currentQuestionIndex].pregunta,
                    userAnswer: userAnswer,
                    correctAnswer: letterData.preguntas[currentQuestionIndex].respuesta
                });
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
        
        // Siempre marcar como pending al pasar la palabra
        letterStatuses[currentLetter] = 'pending';
        
        // Solo incrementar el contador si antes estaba como unanswered
        if (letterStatuses[currentLetter] === 'unanswered') {
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
        correctCountDisplay.textContent = correctAnswers;
        passedCountDisplay.textContent = passedAnswers;
        incorrectCountDisplay.textContent = incorrectAnswers;
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
    function endGame(reason = 'timeout') {
        clearInterval(timerInterval);
        
        // Calculate score
        const totalAnswered = correctAnswers + incorrectAnswers;
        const unanswered = alphabet.length - totalAnswered;
        const timeSpent = totalTime - timeLeft;
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        
        // Crear el modal de resultado
        const resultModal = document.createElement('div');
        resultModal.className = 'modal-overlay active';
        resultModal.id = 'resultModal';
        
        let modalContent = '';
        switch(reason) {
            case 'victory':
                modalContent = `
                    <div class="modal-content result-modal victory">
                        <div class="result-header">
                            <div class="result-icon-container">
                                <svg class="result-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            </div>
                            <h2>¡VICTORIA!</h2>
                        </div>
                        <div class="result-message">
                            <p class="congrats">¡Felicidades! Has completado el rosco correctamente.</p>
                            <div class="stats-summary">
                                <div class="stat-item">
                                    <span class="stat-label">Correctas</span>
                                    <span class="stat-value">${correctAnswers}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Incorrectas</span>
                                    <span class="stat-value">${incorrectAnswers}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Tiempo</span>
                                    <span class="stat-value">${minutes}m ${seconds}s</span>
                                </div>
                            </div>
                        </div>
                        <button id="viewStatsButton" class="primary-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                            Ver estadísticas
                        </button>
                    </div>
                `;
                break;
            case 'defeat':
                modalContent = `
                    <div class="modal-content result-modal defeat">
                        <div class="result-header">
                            <div class="result-icon-container">
                                <svg class="result-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>
                            </div>
                            <h2>¡DERROTA!</h2>
                        </div>
                        <div class="result-message">
                            <p class="congrats">Has alcanzado el máximo de errores permitidos.</p>
                            <div class="stats-summary">
                                <div class="stat-item">
                                    <span class="stat-label">Correctas</span>
                                    <span class="stat-value">${correctAnswers}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Incorrectas</span>
                                    <span class="stat-value">${incorrectAnswers}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Tiempo</span>
                                    <span class="stat-value">${minutes}m ${seconds}s</span>
                                </div>
                            </div>
                        </div>
                        <button id="viewStatsButton" class="primary-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                            Ver estadísticas
                        </button>
                    </div>
                `;
                break;
            case 'timeout':
                modalContent = `
                    <div class="modal-content result-modal timeout">
                        <div class="result-header">
                            <div class="result-icon-container">
                                <svg class="result-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <h2>¡TIEMPO AGOTADO!</h2>
                        </div>
                        <div class="result-message">
                            <p class="congrats">Se acabó el tiempo.</p>
                            <div class="stats-summary">
                                <div class="stat-item">
                                    <span class="stat-label">Correctas</span>
                                    <span class="stat-value">${correctAnswers}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Incorrectas</span>
                                    <span class="stat-value">${incorrectAnswers}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Sin responder</span>
                                    <span class="stat-value">${unanswered}</span>
                                </div>
                            </div>
                        </div>
                        <button id="viewStatsButton" class="primary-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                            Ver estadísticas
                        </button>
                    </div>
                `;
                break;
        }
        
        resultModal.innerHTML = modalContent;
        document.body.appendChild(resultModal);
        
        // Añadir estilos para los modales si no existen
        if (!document.getElementById('result-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'result-modal-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                
                .modal-overlay {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.85);
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                    animation: fadeIn 0.4s ease-out forwards;
                }
                
                .modal-content {
                    position: relative;
                    border-radius: 24px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                    animation: slideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    overflow: hidden;
                }
                
                .result-modal {
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                    padding: 0;
                    border-radius: 24px;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
                    transform: translateY(0);
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    overflow: hidden;
                }
                
                .result-modal:hover {
                    transform: translateY(-8px);
                }
                
                .result-header {
                    margin: 0;
                    padding: 40px 30px 25px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                }
                
                .victory .result-header {
                    background: linear-gradient(135deg, #31D0AA, #25A485);
                }
                
                .defeat .result-header {
                    background: linear-gradient(135deg, #FF5470, #E73A56);
                }
                
                .timeout .result-header {
                    background: linear-gradient(135deg, #FF8E3C, #E67522);
                }
                
                .result-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
                    background-size: 200% 100%;
                    animation: shimmer 4s infinite linear;
                }
                
                .result-header h2 {
                    font-size: 38px;
                    font-weight: 800;
                    margin: 25px 0 0;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
                    letter-spacing: 2px;
                    z-index: 1;
                }
                
                .result-icon-container {
                    width: 110px;
                    height: 110px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 15px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 8px rgba(255, 255, 255, 0.15);
                    z-index: 1;
                    position: relative;
                    animation: float 3s ease-in-out infinite;
                }
                
                .result-icon-container::after {
                    content: '';
                    position: absolute;
                    top: -15px;
                    left: -15px;
                    right: -15px;
                    bottom: -15px;
                    border-radius: 50%;
                    background: transparent;
                    border: 3px solid rgba(255, 255, 255, 0.2);
                    animation: pulse 2s infinite;
                }
                
                .victory .result-icon-container {
                    background: linear-gradient(135deg, #43E5BE, #31D0AA);
                }
                
                .defeat .result-icon-container {
                    background: linear-gradient(135deg, #FF5470, #E73A56);
                }
                
                .timeout .result-icon-container {
                    background: linear-gradient(135deg, #FF8E3C, #E67522);
                }
                
                .result-icon {
                    stroke: white;
                    stroke-width: 2.5;
                    width: 60px;
                    height: 60px;
                }
                
                .result-message {
                    margin: 0;
                    padding: 35px 30px;
                    background: #ffffff;
                }
                
                .result-message p.congrats {
                    margin: 0 0 20px;
                    font-size: 20px;
                    font-weight: 600;
                    line-height: 1.5;
                    color: #444;
                }
                
                .stats-summary {
                    display: flex;
                    justify-content: space-between;
                    margin: 25px 0 10px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                
                .stat-item {
                    flex: 1;
                    min-width: 80px;
                    background: #f8f9fa;
                    border-radius: 16px;
                    padding: 16px 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .stat-item:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.12);
                }
                
                .victory .stat-item:hover {
                    background: rgba(49, 208, 170, 0.1);
                }
                
                .defeat .stat-item:hover {
                    background: rgba(255, 84, 112, 0.1);
                }
                
                .timeout .stat-item:hover {
                    background: rgba(255, 142, 60, 0.1);
                }
                
                .stat-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: #777;
                    margin-bottom: 5px;
                }
                
                .stat-value {
                    font-size: 28px;
                    font-weight: 700;
                    color: #333;
                    line-height: 1;
                }
                
                .victory .primary-button {
                    background: linear-gradient(135deg, #31D0AA, #25A485);
                    margin: 0;
                    width: 100%;
                    border-radius: 0;
                    height: 60px;
                    font-size: 17px;
                    box-shadow: none;
                    border-top: 1px solid rgba(0, 0, 0, 0.05);
                }
                
                .defeat .primary-button {
                    background: linear-gradient(135deg, #FF5470, #E73A56);
                    margin: 0;
                    width: 100%;
                    border-radius: 0;
                    height: 60px;
                    font-size: 17px;
                    box-shadow: none;
                    border-top: 1px solid rgba(0, 0, 0, 0.05);
                }
                
                .timeout .primary-button {
                    background: linear-gradient(135deg, #FF8E3C, #E67522);
                    margin: 0;
                    width: 100%;
                    border-radius: 0;
                    height: 60px;
                    font-size: 17px;
                    box-shadow: none;
                    border-top: 1px solid rgba(0, 0, 0, 0.05);
                }
                
                .primary-button:hover {
                    transform: none;
                    box-shadow: none;
                    filter: brightness(1.1);
                }
                
                .primary-button:active {
                    transform: none;
                    box-shadow: none;
                    filter: brightness(0.95);
                }
                
                .primary-button svg {
                    margin-right: 10px;
                    transition: transform 0.3s ease;
                }
                
                .primary-button:hover svg {
                    transform: translateX(3px);
                }
                
                .victory {
                    background: white;
                    color: #333;
                    border: none;
                    overflow: hidden;
                }
                
                .defeat {
                    background: white;
                    color: #333;
                    border: none;
                    overflow: hidden;
                }
                
                .timeout {
                    background: white;
                    color: #333;
                    border: none;
                    overflow: hidden;
                }
                
                /* Stats Modal Styles */
                .stats-modal {
                    max-width: 700px;
                    width: 90%;
                    max-height: 85vh;
                    overflow-y: auto;
                    background: #fff;
                    color: #333;
                    padding: 0;
                    border-radius: 24px;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
                }
                
                .stats-modal h2 {
                    color: white;
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0;
                    text-align: center;
                    padding: 25px 20px;
                    background: linear-gradient(135deg, #31D0AA, #25A485);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                
                .stats-modal .stats-content {
                    padding: 30px;
                }
                
                .stats-modal h3 {
                    font-size: 22px;
                    font-weight: 600;
                    margin: 35px 0 20px;
                    color: #333;
                    position: relative;
                    padding-left: 18px;
                }
                
                .stats-modal h3::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 6px;
                    background: linear-gradient(to bottom, #31D0AA, #25A485);
                    border-radius: 3px;
                }
                
                .stats-modal .stats-summary {
                    background: #f8f9fa;
                    border-radius: 20px;
                    padding: 25px;
                    margin: 0 0 30px;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 15px;
                }
                
                .stats-modal .stat-item {
                    background: white;
                    color: #333;
                    border-radius: 16px;
                    padding: 20px 15px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
                    margin: 0;
                }
                
                .stats-modal .stat-label {
                    color: #666;
                    font-size: 13px;
                    font-weight: 500;
                }
                
                .stats-modal .stat-value {
                    color: #333;
                    font-size: 26px;
                    font-weight: 700;
                    margin-top: 5px;
                }
                
                .performance-insights {
                    background: #f8f9fa;
                    border-radius: 20px;
                    padding: 25px;
                    margin: 0 0 35px;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
                }
                
                .insight-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
                }
                
                .insight-item:last-child {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: none;
                }
                
                .insight-item svg {
                    color: #31D0AA;
                    margin-right: 20px;
                    flex-shrink: 0;
                    width: 40px;
                    height: 40px;
                    padding: 8px;
                    background: rgba(49, 208, 170, 0.1);
                    border-radius: 12px;
                }
                
                .insight-content {
                    flex: 1;
                }
                
                .insight-label {
                    display: block;
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 6px;
                }
                
                .insight-value {
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                }
                
                .stats-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 25px 0 35px;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
                    background: white;
                }
                
                .stats-table th {
                    background: #f4f6f8;
                    color: #333;
                    font-weight: 600;
                    text-align: left;
                    padding: 18px 20px;
                    font-size: 15px;
                    border-bottom: 2px solid #eaedf0;
                }
                
                .stats-table td {
                    padding: 16px 20px;
                    border-bottom: 1px solid #eaedf0;
                    font-size: 14px;
                    vertical-align: middle;
                    transition: all 0.2s;
                }
                
                .stats-table tr:last-child td {
                    border-bottom: none;
                }
                
                .stats-table .error-row {
                    background-color: rgba(255, 84, 112, 0.02);
                    transition: all 0.3s;
                }
                
                .stats-table .error-row:hover {
                    background-color: rgba(255, 84, 112, 0.08);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.05);
                    z-index: 1;
                    position: relative;
                }
                
                .stats-table .letter-cell {
                    font-weight: 700;
                    font-size: 18px;
                    color: #333;
                    width: 70px;
                    text-align: center;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                
                .stats-table .user-answer {
                    color: #FF5470;
                    text-decoration: line-through;
                    font-style: italic;
                }
                
                .stats-table .correct-answer {
                    color: #31D0AA;
                    font-weight: 600;
                }
                
                .button-group {
                    display: flex;
                    justify-content: center;
                    margin: 0;
                }
                
                .stats-modal .primary-button {
                    background: linear-gradient(135deg, #31D0AA, #25A485);
                    color: white;
                    padding: 20px 30px;
                    font-size: 17px;
                    font-weight: 600;
                    border-radius: 0;
                    width: 100%;
                    margin: 0;
                    height: 70px;
                    box-shadow: none;
                    border-top: 1px solid rgba(0, 0, 0, 0.05);
                }
                
                .stats-modal .primary-button:hover {
                    filter: brightness(1.1);
                }
                
                .perfect-score {
                    background: linear-gradient(135deg, rgba(49, 208, 170, 0.15), rgba(49, 208, 170, 0.05));
                    padding: 35px;
                    border-radius: 20px;
                    text-align: center;
                    margin: 30px 0 40px;
                    position: relative;
                    overflow: hidden;
                }
                
                .perfect-score::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
                    background-size: 200% 100%;
                    animation: shimmer 3s infinite linear;
                    pointer-events: none;
                }
                
                .perfect-icon {
                    width: 90px;
                    height: 90px;
                    margin: 0 auto 20px;
                    background: linear-gradient(135deg, #43E5BE, #31D0AA);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 15px 25px rgba(49, 208, 170, 0.35), 0 0 0 10px rgba(49, 208, 170, 0.1);
                    animation: float 3s ease-in-out infinite;
                    position: relative;
                }
                
                .perfect-icon::after {
                    content: '';
                    position: absolute;
                    top: -10px;
                    left: -10px;
                    right: -10px;
                    bottom: -10px;
                    border-radius: 50%;
                    background: transparent;
                    border: 3px solid rgba(49, 208, 170, 0.3);
                    animation: pulse 2s infinite;
                }
                
                .perfect-icon svg {
                    width: 50px;
                    height: 50px;
                    stroke: white;
                    stroke-width: 2;
                }
                
                .perfect-score h3 {
                    color: #31D0AA;
                    font-size: 28px;
                    margin: 0 0 15px;
                    padding: 0;
                }
                
                .perfect-score h3::before {
                    display: none;
                }
                
                .perfect-score p {
                    color: #555;
                    font-size: 16px;
                    line-height: 1.6;
                    max-width: 400px;
                    margin: 0 auto;
                }
                
                /* Scrollbar styling */
                .stats-modal::-webkit-scrollbar {
                    width: 10px;
                }
                
                .stats-modal::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                
                .stats-modal::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 10px;
                }
                
                .stats-modal::-webkit-scrollbar-thumb:hover {
                    background: #a1a1a1;
                }
                
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .result-header {
                        padding: 30px 20px 20px;
                    }
                    
                    .result-message {
                        padding: 25px 20px;
                    }
                    
                    .result-header h2 {
                        font-size: 30px;
                    }
                    
                    .result-icon-container {
                        width: 90px;
                        height: 90px;
                    }
                    
                    .result-message p.congrats {
                        font-size: 16px;
                    }
                    
                    .stats-summary {
                        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    }
                    
                    .stat-item {
                        padding: 12px 10px;
                    }
                    
                    .stat-value {
                        font-size: 22px;
                    }
                    
                    .stats-modal h2 {
                        font-size: 24px;
                        padding: 20px 15px;
                    }
                    
                    .stats-modal .stats-content {
                        padding: 20px;
                    }
                    
                    .stats-modal h3 {
                        font-size: 18px;
                    }
                    
                    .stats-table th, 
                    .stats-table td {
                        padding: 12px 10px;
                    }
                    
                    .perfect-icon {
                        width: 70px;
                        height: 70px;
                    }
                    
                    .perfect-score h3 {
                        font-size: 22px;
                    }
                }
                
                @media (max-width: 480px) {
                    .result-header h2 {
                        font-size: 26px;
                    }
                    
                    .result-icon-container {
                        width: 80px;
                        height: 80px;
                    }
                    
                    .result-icon {
                        width: 45px;
                        height: 45px;
                    }
                    
                    .stat-label {
                        font-size: 12px;
                    }
                    
                    .stat-value {
                        font-size: 20px;
                    }
                    
                    .stats-table {
                        display: block;
                        overflow-x: auto;
                    }
                    
                    .perfect-score {
                        padding: 25px 15px;
                    }
                    
                    .perfect-icon {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .perfect-icon svg {
                        width: 35px;
                        height: 35px;
                    }
                    
                    .perfect-score h3 {
                        font-size: 20px;
                    }
                    
                    .perfect-score p {
                        font-size: 14px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Añadir evento para mostrar el modal de estadísticas
        document.getElementById('viewStatsButton').addEventListener('click', showStatsModal);
    }
    
    // Función para mostrar el modal de estadísticas
    function showStatsModal() {
        // Ocultar el modal de resultado
        const resultModal = document.getElementById('resultModal');
        if (resultModal) {
            resultModal.remove();
        }
        
        // Crear modal de estadísticas
        const statsModal = document.createElement('div');
        statsModal.className = 'modal-overlay active';
        statsModal.id = 'statsModal';
        
        // Calcular estadísticas adicionales
        // Correct the totalTime access by using the global variable directly
        const timeUsed = totalTime - timeLeft;
        const minutes = Math.floor(timeUsed / 60);
        const seconds = timeUsed % 60;
        const accuracy = correctAnswers > 0 ? Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 100) : 0;
        const totalAnswered = correctAnswers + incorrectAnswers;
        const completion = Math.round((totalAnswered / alphabet.length) * 100);
        const averageTimePerAnswer = totalAnswered > 0 ? Math.round(timeUsed / totalAnswered) : 0;
        
        // Crear contenido para la tabla de errores
        let errorsTableContent = '';
        if (userErrors.length > 0) {
            errorsTableContent = `
                <h3>Análisis de Errores</h3>
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Letra</th>
                            <th>Pregunta</th>
                            <th>Tu respuesta</th>
                            <th>Respuesta correcta</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            userErrors.forEach(error => {
                errorsTableContent += `
                    <tr class="error-row">
                        <td class="letter-cell">${error.letter}</td>
                        <td>${error.question}</td>
                        <td class="user-answer">${error.userAnswer}</td>
                        <td class="correct-answer">${error.correctAnswer}</td>
                    </tr>
                `;
            });
            
            errorsTableContent += `
                    </tbody>
                </table>
            `;
        } else {
            // Mostrar mensaje de felicitación si no hay errores
            errorsTableContent = `
                <div class="perfect-score">
                    <div class="perfect-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </div>
                    <h3>¡Puntuación Perfecta!</h3>
                    <p>No has cometido ningún error. ¡Felicidades por tu excelente desempeño!</p>
                </div>
            `;
        }
        
        // Contenido del modal - Ahora con errores primero y estadísticas después
        statsModal.innerHTML = `
            <div class="modal-content stats-modal">
                <h2>Análisis de la Partida</h2>
                
                <div class="stats-content">
                    ${errorsTableContent}
                    
                    <h3>Desempeño del Jugador</h3>
                    <div class="game-stats-container">
                        <div class="game-stats-summary">
                            <div class="stat-group">
                                <div class="stat-item ${accuracy >= 80 ? 'good' : accuracy >= 50 ? 'medium' : 'poor'}">
                                    <div class="stat-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    </div>
                                    <div class="stat-info">
                                        <span class="stat-label">Precisión</span>
                                        <span class="stat-value">${accuracy}%</span>
                                    </div>
                                </div>
                                
                                <div class="stat-item ${completion >= 80 ? 'good' : completion >= 50 ? 'medium' : 'poor'}">
                                    <div class="stat-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    </div>
                                    <div class="stat-info">
                                        <span class="stat-label">Completado</span>
                                        <span class="stat-value">${completion}%</span>
                                    </div>
                                </div>
                                
                                <div class="stat-item">
                                    <div class="stat-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    </div>
                                    <div class="stat-info">
                                        <span class="stat-label">Tiempo por letra</span>
                                        <span class="stat-value">${averageTimePerAnswer}s</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="rosco-stats">
                                <div class="rosco-stat rosco-correct">
                                    <span class="rosco-stat-label">Correctas</span>
                                    <span class="rosco-stat-value">${correctAnswers}</span>
                                </div>
                                <div class="rosco-stat rosco-incorrect">
                                    <span class="rosco-stat-label">Incorrectas</span>
                                    <span class="rosco-stat-value">${incorrectAnswers}</span>
                                </div>
                                <div class="rosco-stat">
                                    <span class="rosco-stat-label">Tiempo</span>
                                    <span class="rosco-stat-value">${minutes}m ${seconds}s</span>
                                </div>
                            </div>
                            
                            <div class="performance-rating">
                                <div class="rating-label">Rendimiento general:</div>
                                <div class="rating-value ${accuracy >= 80 ? 'excellent' : accuracy >= 60 ? 'good' : accuracy >= 40 ? 'average' : 'poor'}">${getRatingText(accuracy)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="button-group">
                    <button id="playAgainButton" class="primary-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Volver a inicio
                    </button>
                </div>
            </div>
        `;
        
        // Añadir estilos adicionales para el modal de estadísticas si no existen
        if (!document.getElementById('stats-modal-extra-styles')) {
            const style = document.createElement('style');
            style.id = 'stats-modal-extra-styles';
            style.textContent = `
                .game-stats-container {
                    margin-bottom: 30px;
                }
                
                .game-stats-summary {
                    background: #1A1C25;
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    color: #fff;
                }
                
                .stat-group {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .stat-item {
                    display: flex;
                    align-items: center;
                    background: #242736;
                    padding: 15px;
                    border-radius: 12px;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    border: 1px solid rgba(131, 93, 255, 0.15);
                }
                
                .stat-item:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    border-color: rgba(131, 93, 255, 0.3);
                }
                
                .stat-icon {
                    width: 40px;
                    height: 40px;
                    min-width: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 12px;
                }
                
                .stat-item.good .stat-icon {
                    background: rgba(49, 208, 170, 0.15);
                }
                
                .stat-item.medium .stat-icon {
                    background: rgba(255, 142, 60, 0.15);
                }
                
                .stat-item.poor .stat-icon {
                    background: rgba(255, 84, 112, 0.15);
                }
                
                .stat-icon svg {
                    width: 24px;
                    height: 24px;
                    stroke-width: 2.5;
                }
                
                .stat-item.good .stat-icon svg {
                    stroke: #31D0AA;
                }
                
                .stat-item.medium .stat-icon svg {
                    stroke: #FF8E3C;
                }
                
                .stat-item.poor .stat-icon svg {
                    stroke: #FF5470;
                }
                
                .stat-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .stat-label {
                    font-size: 13px;
                    color: #94A1B2;
                    margin-bottom: 3px;
                }
                
                .stat-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #FFFFFE;
                }
                
                .rosco-stats {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .rosco-stat {
                    flex: 1;
                    background: #242736;
                    border-radius: 12px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
                    transition: transform 0.2s ease;
                    border: 1px solid rgba(131, 93, 255, 0.15);
                }
                
                .rosco-stat:hover {
                    transform: translateY(-3px);
                    border-color: rgba(131, 93, 255, 0.3);
                }
                
                .rosco-stat-label {
                    font-size: 12px;
                    color: #94A1B2;
                    margin-bottom: 5px;
                }
                
                .rosco-stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #FFFFFE;
                }
                
                .rosco-correct .rosco-stat-value {
                    color: #31D0AA;
                }
                
                .rosco-incorrect .rosco-stat-value {
                    color: #FF5470;
                }
                
                .performance-rating {
                    background: #242736;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
                    border: 1px solid rgba(131, 93, 255, 0.15);
                }
                
                .rating-label {
                    font-size: 14px;
                    color: #94A1B2;
                    margin-bottom: 8px;
                }
                
                .rating-value {
                    font-size: 22px;
                    font-weight: 700;
                    padding: 8px 16px;
                    border-radius: 20px;
                    background: #1A1C25;
                }
                
                .rating-value.excellent {
                    color: #31D0AA;
                    background: rgba(49, 208, 170, 0.15);
                }
                
                .rating-value.good {
                    color: #0095FF;
                    background: rgba(0, 149, 255, 0.15);
                }
                
                .rating-value.average {
                    color: #FF8E3C;
                    background: rgba(255, 142, 60, 0.15);
                }
                
                .rating-value.poor {
                    color: #FF5470;
                    background: rgba(255, 84, 112, 0.15);
                }
                
                .perfect-score {
                    margin: 0 0 30px;
                }
                
                #statsModal .modal-content {
                    background: linear-gradient(135deg, rgba(23, 25, 35, 0.95), rgba(16, 17, 25, 0.97));
                    border: 1px solid rgba(131, 93, 255, 0.3);
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(131, 93, 255, 0.2);
                }
                
                @media (max-width: 768px) {
                    .stat-group {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }
                    
                    .rosco-stats {
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .rosco-stat {
                        padding: 12px;
                    }
                    
                    .rosco-stat-value {
                        font-size: 20px;
                    }
                    
                    .rating-value {
                        font-size: 18px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(statsModal);
        
        // Evento para volver al inicio
        document.getElementById('playAgainButton').addEventListener('click', () => {
            // Ocultar el modal de estadísticas
            statsModal.remove();
            
            // Redirigir a la página de inicio (games.html)
            window.location.href = 'games.html';
        });
        
        // Añadir animación a las filas de la tabla
        setTimeout(() => {
            const rows = document.querySelectorAll('.error-row');
            rows.forEach((row, index) => {
                row.style.opacity = '0';
                row.style.transform = 'translateY(20px)';
                row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                
                setTimeout(() => {
                    row.style.opacity = '1';
                    row.style.transform = 'translateY(0)';
                }, 100 * index);
            });
        }, 300);
    }
    
    // Función para obtener texto de calificación basado en la precisión
    function getRatingText(accuracy) {
        if (accuracy >= 90) {
            return '¡Excelente! 🏆';
        } else if (accuracy >= 75) {
            return '¡Muy bueno! 🌟';
        } else if (accuracy >= 60) {
            return 'Bueno 👍';
        } else if (accuracy >= 40) {
            return 'Regular 🔄';
        } else {
            return 'Necesitas práctica 💪';
        }
    }
    
    // Función para mostrar mensajes temporales
    function showFeedback(message, type = 'info') {
        // Buscar si ya hay un elemento de feedback
        let feedbackElement = document.querySelector('.feedback-message');
        
        // Si no existe, crear uno nuevo
        if (!feedbackElement) {
            feedbackElement = document.createElement('div');
            feedbackElement.className = 'feedback-message';
            
            // Añadir al DOM
            const questionCard = document.querySelector('.question-card');
            if (questionCard) {
                questionCard.appendChild(feedbackElement);
            }
        }
        
        // Actualizar clase para el tipo de mensaje
        feedbackElement.className = `feedback-message ${type}`;
        feedbackElement.textContent = message;
        
        // Mostrar y ocultar después de un tiempo
        feedbackElement.style.display = 'block';
        
        // Clear any existing timeout
        if (feedbackElement.hideTimeout) {
            clearTimeout(feedbackElement.hideTimeout);
        }
        
        // Set a new timeout
        feedbackElement.hideTimeout = setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 3000);
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