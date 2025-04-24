document.addEventListener('DOMContentLoaded', function() {
    // Game variables
    let currentLevel = 1;
    let currentQuestion = null;
    let selectedOption = null;
    let questionData = [];
    let usedQuestions = [];
    let gameActive = true;
    
    // Lifelines
    let lifelinesUsed = {
        fiftyFifty: false,
        audienceHelp: false,
        phoneCall: false
    };
    
    // DOM elements
    const questionNumber = document.getElementById('questionNumber');
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const options = document.querySelectorAll('.option');
    const levelDisplay = document.getElementById('levelDisplay');
    const levels = document.querySelectorAll('.level');
    
    // Lifeline elements
    const fiftyFiftyButton = document.getElementById('fiftyFifty');
    const audienceHelpButton = document.getElementById('audienceHelp');
    const phoneCallButton = document.getElementById('phoneCall');
    
    // Game initialization
    function initGame() {
        // Cargar preguntas desde el archivo JSON
        fetch('data/questions.json')
            .then(response => response.json())
            .then(data => {
                // Procesar los datos para adaptarlos al formato del juego
                processQuestions(data);
                
                // Setup first question
                loadQuestion();
                
                // Setup event listeners
                setupEventListeners();
            })
            .catch(error => {
                console.error('Error cargando preguntas:', error);
                questionText.textContent = 'Error cargando preguntas. Por favor, recarga la página.';
                // En caso de error, usar preguntas de respaldo
                generateBackupQuestions();
                loadQuestion();
                setupEventListeners();
            });
    }
    
    // Procesar las preguntas del JSON
    function processQuestions(data) {
        // Limpiar datos existentes
        questionData = [];
        
        // Crear preguntas para cada nivel
        for (let level = 1; level <= 15; level++) {
            // Recorrer todas las letras
            data.forEach(letterData => {
                const letter = letterData.letra;
                const questions = letterData.preguntas;
                
                // Seleccionar preguntas aleatorias para este nivel
                if (questions && questions.length > 0) {
                    const randomIndex = Math.floor(Math.random() * questions.length);
                    const question = questions[randomIndex];
                    
                    // Crear opciones (una correcta y tres incorrectas)
                    let options = [question.respuesta];
                    
                    // Buscar respuestas incorrectas de otras preguntas
                    let incorrectOptions = [];
                    data.forEach(otherLetterData => {
                        otherLetterData.preguntas.forEach(q => {
                            if (q.respuesta !== question.respuesta) {
                                incorrectOptions.push(q.respuesta);
                            }
                        });
                    });
                    
                    // Elegir 3 respuestas incorrectas al azar
                    while (options.length < 4 && incorrectOptions.length > 0) {
                        const randomIncorrectIndex = Math.floor(Math.random() * incorrectOptions.length);
                        const incorrectOption = incorrectOptions[randomIncorrectIndex];
                        
                        if (!options.includes(incorrectOption)) {
                            options.push(incorrectOption);
                        }
                        
                        // Eliminar esta opción para no repetirla
                        incorrectOptions.splice(randomIncorrectIndex, 1);
                    }
                    
                    // Mezclar las opciones
                    options = shuffleArray(options);
                    
                    // Encontrar el índice de la respuesta correcta
                    const correctIndex = options.indexOf(question.respuesta);
                    
                    // Añadir la pregunta al array
                    questionData.push({
                        text: question.pregunta,
                        options: options,
                        correctIndex: correctIndex,
                        level: level
                    });
                }
            });
        }
    }
    
    // Función para mezclar un array (algoritmo Fisher-Yates)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Generate backup questions for the game in case the JSON fails to load
    function generateBackupQuestions() {
        // We should have at least 15 questions (one per level)
        // In a real app this would be loaded from a server/file
        
        questionData = [
            {
                text: "¿Qué selección ganó la Copa del Mundo 2022?",
                options: ["Brasil", "Francia", "Argentina", "Inglaterra"],
                correctIndex: 2,
                level: 1
            },
            {
                text: "¿Qué club tiene más títulos de Champions League?",
                options: ["Barcelona", "Real Madrid", "Bayern Munich", "Liverpool"],
                correctIndex: 1,
                level: 2
            },
            {
                text: "¿Quién es el máximo goleador histórico de la Copa del Mundo?",
                options: ["Pelé", "Cristiano Ronaldo", "Lionel Messi", "Miroslav Klose"],
                correctIndex: 3,
                level: 3
            },
            {
                text: "¿Qué jugador ganó el Balón de Oro en 2022?",
                options: ["Lionel Messi", "Kylian Mbappé", "Karim Benzema", "Robert Lewandowski"],
                correctIndex: 2,
                level: 4
            },
            {
                text: "¿Qué club italiano ha ganado más 'Scudettos'?",
                options: ["AC Milan", "Inter de Milán", "Roma", "Juventus"],
                correctIndex: 3,
                level: 5
            },
            {
                text: "¿Quién es conocido como 'O Rei' del fútbol?",
                options: ["Zico", "Ronaldo", "Pelé", "Garrincha"],
                correctIndex: 2,
                level: 6
            },
            {
                text: "¿Qué club inglés tiene el apodo de 'The Red Devils'?",
                options: ["Liverpool", "Arsenal", "Manchester United", "Chelsea"],
                correctIndex: 2,
                level: 7
            },
            {
                text: "¿En qué año se celebró el primer Mundial de fútbol?",
                options: ["1930", "1928", "1934", "1926"],
                correctIndex: 0,
                level: 8
            },
            {
                text: "¿Qué jugador es conocido como 'La Pulga'?",
                options: ["Neymar", "Lionel Messi", "Luis Suárez", "Ángel Di María"],
                correctIndex: 1,
                level: 9
            },
            {
                text: "¿Qué estadio es conocido como 'La Bombonera'?",
                options: ["Estadio Monumental", "Estadio Azteca", "Estadio Alberto J. Armando", "Camp Nou"],
                correctIndex: 2,
                level: 10
            },
            {
                text: "¿Qué país ha ganado más Copas del Mundo?",
                options: ["Alemania", "Italia", "Argentina", "Brasil"],
                correctIndex: 3,
                level: 11
            },
            {
                text: "¿Qué técnico ha ganado más Champions League?",
                options: ["Carlo Ancelotti", "Pep Guardiola", "José Mourinho", "Sir Alex Ferguson"],
                correctIndex: 0,
                level: 12
            },
            {
                text: "¿Qué jugador ha ganado más Balones de Oro?",
                options: ["Cristiano Ronaldo", "Lionel Messi", "Michel Platini", "Johan Cruyff"],
                correctIndex: 1,
                level: 13
            },
            {
                text: "¿Quién anotó el 'Gol del Siglo' en el Mundial de 1986?",
                options: ["Pelé", "Diego Maradona", "Michel Platini", "Zinedine Zidane"],
                correctIndex: 1,
                level: 14
            },
            {
                text: "¿Qué portero es el único en ganar un Balón de Oro?",
                options: ["Gianluigi Buffon", "Iker Casillas", "Lev Yashin", "Manuel Neuer"],
                correctIndex: 2,
                level: 15
            }
        ];
    }
    
    // Load a question for the current level
    function loadQuestion() {
        if (!gameActive) return;
        
        // Find questions for the current level that haven't been used
        const availableQuestions = questionData.filter(q => 
            q.level === currentLevel && !usedQuestions.includes(q)
        );
        
        if (availableQuestions.length === 0) {
            // If no questions available, try to move to next level or end game
            if (currentLevel < 15) {
                currentLevel++;
                updateLevelDisplay();
                loadQuestion();
            } else {
                endGame(true);
            }
            return;
        }
        
        // Select a random question
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        currentQuestion = availableQuestions[randomIndex];
        usedQuestions.push(currentQuestion);
        
        // Update UI
        questionNumber.textContent = `Pregunta ${currentLevel}`;
        questionText.textContent = currentQuestion.text;
        
        // Reset options
        options.forEach((option, index) => {
            option.classList.remove('selected', 'correct', 'incorrect');
            option.disabled = false;
            option.querySelector('.option-text').textContent = currentQuestion.options[index];
        });
        
        selectedOption = null;
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        // Option selection
        options.forEach(option => {
            option.addEventListener('click', function() {
                if (!gameActive) return;
                
                // Clear previous selection
                options.forEach(opt => opt.classList.remove('selected'));
                
                // Set new selection
                this.classList.add('selected');
                selectedOption = parseInt(this.getAttribute('data-index'));
                
                // Automatic check after short delay
                setTimeout(() => {
                    checkAnswer();
                }, 1000);
            });
        });
        
        // Lifeline event listeners
        if (fiftyFiftyButton) {
            fiftyFiftyButton.addEventListener('click', function() {
                if (!lifelinesUsed.fiftyFifty && gameActive) {
                    useFiftyFifty();
                }
            });
        }
        
        if (audienceHelpButton) {
            audienceHelpButton.addEventListener('click', function() {
                if (!lifelinesUsed.audienceHelp && gameActive) {
                    useAudienceHelp();
                }
            });
        }
        
        if (phoneCallButton) {
            phoneCallButton.addEventListener('click', function() {
                if (!lifelinesUsed.phoneCall && gameActive) {
                    usePhoneCall();
                }
            });
        }
    }
    
    // Check if the answer is correct
    function checkAnswer() {
        if (selectedOption === null || !gameActive) return;
        
        const selectedElement = options[selectedOption];
        const correctElement = options[currentQuestion.correctIndex];
        
        // Disable all options
        options.forEach(opt => opt.disabled = true);
        
        if (selectedOption === currentQuestion.correctIndex) {
            // Correct answer
            selectedElement.classList.add('correct');
            
            // Play correct sound effect (if implemented)
            
            // Show feedback and move to next level after delay
            setTimeout(() => {
                currentLevel++;
                
                if (currentLevel > 15) {
                    // Player won the game
                    endGame(true);
                } else {
                    updateLevelDisplay();
                    loadQuestion();
                }
            }, 2000);
        } else {
            // Wrong answer
            selectedElement.classList.add('incorrect');
            correctElement.classList.add('correct');
            
            // Play incorrect sound effect (if implemented)
            
            // Show feedback and end game after delay
            setTimeout(() => {
                endGame(false);
            }, 2000);
        }
    }
    
    // Update the level display
    function updateLevelDisplay() {
        // Update level number
        levelDisplay.textContent = `Nivel ${currentLevel}`;
        
        // Update progress sidebar
        levels.forEach(level => {
            level.classList.remove('current');
            
            const levelNum = parseInt(level.getAttribute('data-level'));
            if (levelNum === currentLevel) {
                level.classList.add('current');
            }
        });
    }
    
    // Use 50:50 lifeline
    function useFiftyFifty() {
        // Mark as used
        lifelinesUsed.fiftyFifty = true;
        fiftyFiftyButton.classList.add('used');
        
        // Find the correct option
        const correctIndex = currentQuestion.correctIndex;
        
        // Get incorrect indexes
        let incorrectIndexes = [];
        for (let i = 0; i < options.length; i++) {
            if (i !== correctIndex) {
                incorrectIndexes.push(i);
            }
        }
        
        // Shuffle and select two to remove
        incorrectIndexes = shuffleArray(incorrectIndexes);
        const indexesToRemove = incorrectIndexes.slice(0, 2);
        
        // Remove two incorrect options
        indexesToRemove.forEach(index => {
            options[index].disabled = true;
            options[index].style.opacity = '0.3';
            options[index].querySelector('.option-text').textContent = '';
        });
    }
    
    // Use Audience Help lifeline
    function useAudienceHelp() {
        // Mark as used
        lifelinesUsed.audienceHelp = true;
        audienceHelpButton.classList.add('used');
        
        // Generate audience vote percentages
        const correctIndex = currentQuestion.correctIndex;
        let percentages = [15, 25, 30, 30]; // Base percentages
        
        // Boost correct answer and adjust others
        percentages[correctIndex] = 50 + Math.floor(Math.random() * 30); // 50-80%
        
        // Adjust other percentages to total 100%
        let remainingPercentage = 100 - percentages[correctIndex];
        let remainingOptions = 3;
        
        for (let i = 0; i < 4; i++) {
            if (i !== correctIndex) {
                if (remainingOptions > 1) {
                    let percentage = Math.max(5, Math.min(25, Math.floor(remainingPercentage / remainingOptions)));
                    percentage = Math.floor(percentage + (Math.random() * 10) - 5); // Add some randomness
                    percentages[i] = Math.max(5, percentage); // Ensure at least 5%
                    remainingPercentage -= percentages[i];
                    remainingOptions--;
                } else {
                    percentages[i] = remainingPercentage;
                }
            }
        }
        
        // Display results to player
        for (let i = 0; i < 4; i++) {
            const option = options[i];
            const percentage = percentages[i];
            
            // Create and show percentage bar
            const percentBar = document.createElement('div');
            percentBar.className = 'audience-percent';
            percentBar.innerHTML = `<div class="audience-bar" style="width: ${percentage}%"></div><span>${percentage}%</span>`;
            
            option.appendChild(percentBar);
        }
    }
    
    // Use Phone Call lifeline
    function usePhoneCall() {
        // Mark as used
        lifelinesUsed.phoneCall = true;
        phoneCallButton.classList.add('used');
        
        // Friend's response logic
        const correctIndex = currentQuestion.correctIndex;
        const isCorrect = Math.random() < 0.7; // 70% chance of being correct
        
        let friendAnswer;
        if (isCorrect) {
            friendAnswer = correctIndex;
        } else {
            // Choose a random incorrect answer
            let incorrectOptions = [];
            for (let i = 0; i < 4; i++) {
                if (i !== correctIndex) {
                    incorrectOptions.push(i);
                }
            }
            const randomIncorrect = Math.floor(Math.random() * incorrectOptions.length);
            friendAnswer = incorrectOptions[randomIncorrect];
        }
        
        // Show friend's answer in a modal or as a message
        const confidenceLevel = isCorrect ? 
            Math.floor(65 + Math.random() * 35) : // 65-100% if correct
            Math.floor(40 + Math.random() * 40);  // 40-80% if incorrect
        
        // Display to player
        const messageContainer = document.createElement('div');
        messageContainer.className = 'phone-call-message';
        messageContainer.innerHTML = `
            <p>Tu amigo dice: "Estoy casi seguro (${confidenceLevel}%) que la respuesta es la ${String.fromCharCode(65 + friendAnswer)}"</p>
        `;
        
        // Add message to the question container
        const questionBlock = document.querySelector('.question-block');
        if (questionBlock) {
            questionBlock.appendChild(messageContainer);
        }
    }
    
    // End the game
    function endGame(isWinner) {
        gameActive = false;
        
        if (isWinner) {
            // Show winning message
            // Implement winning animation and prize display
        } else {
            // Show losing message with consolation prize if any
            // Implement losing animation
        }
        
        // Determine the prize money
        let prizeMoney = "0";
        if (currentLevel > 10) {
            prizeMoney = "32,000";
        } else if (currentLevel > 5) {
            prizeMoney = "1,000";
        } else if (currentLevel > 0) {
            prizeMoney = "0";
        }
        
        // Show game result
        const resultMessage = isWinner ? 
            `¡Felicidades! ¡Has ganado $1,000,000!` : 
            `Juego terminado. Te llevas $${prizeMoney}`;
        
        // Create and display the modal
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <h3 class="modal-title">${isWinner ? '¡GANADOR!' : 'JUEGO TERMINADO'}</h3>
            <p class="game-promo">${resultMessage}</p>
            <button id="playAgainButton" class="primary-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12A10 10 0 1 0 12 2"></path><path d="M2 12a10 10 0 0 1 10-10"></path><path d="m2 12 6-6"></path><path d="m2 12 6 6"></path></svg>
                Jugar de Nuevo
            </button>
            <button id="backToGamesButton" class="secondary-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
                Volver a Juegos
            </button>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Add event listeners for buttons
        document.getElementById('playAgainButton').addEventListener('click', function() {
            modalOverlay.remove();
            resetGame();
        });
        
        document.getElementById('backToGamesButton').addEventListener('click', function() {
            window.location.href = 'games.html';
        });
    }
    
    // Reset the game to play again
    function resetGame() {
        // Reset game variables
        currentLevel = 1;
        selectedOption = null;
        usedQuestions = [];
        gameActive = true;
        
        lifelinesUsed = {
            fiftyFifty: false,
            audienceHelp: false,
            phoneCall: false
        };
        
        // Reset UI
        if (fiftyFiftyButton) fiftyFiftyButton.classList.remove('used');
        if (audienceHelpButton) audienceHelpButton.classList.remove('used');
        if (phoneCallButton) phoneCallButton.classList.remove('used');
        
        // Reset level display
        updateLevelDisplay();
        
        // Remove any audience help or phone call elements
        document.querySelectorAll('.audience-percent, .phone-call-message').forEach(el => el.remove());
        
        // Reset options
        options.forEach(option => {
            option.disabled = false;
            option.style.opacity = '1';
            option.classList.remove('selected', 'correct', 'incorrect');
        });
        
        // Load a new question
        loadQuestion();
    }
    
    // Start the game when DOM is loaded
    initGame();
}); 