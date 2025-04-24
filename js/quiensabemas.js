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
        // In a real application, you would load questions from a database or file
        // For now, we'll use some mock questions
        generateQuestions();
        
        // Setup first question
        loadQuestion();
        
        // Setup event listeners
        setupEventListeners();
    }
    
    // Generate mock questions for the game
    function generateQuestions() {
        // We should have at least 15 questions (one per level)
        // In a real app this would be loaded from a server/file
        
        // Example format for each question
        // { 
        //   text: "Question text",
        //   options: ["Option A", "Option B", "Option C", "Option D"],
        //   correctIndex: 0, // index of correct option
        //   level: 1 // difficulty level 1-15
        // }
        
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
                selectedOption = parseInt(this.dataset.index);
                
                // Enable submit after a short delay to avoid accidental submissions
                setTimeout(() => {
                    if (gameActive && selectedOption !== null) {
                        checkAnswer();
                    }
                }, 500);
            });
        });
        
        // Lifeline: 50/50
        fiftyFiftyButton.addEventListener('click', function() {
            if (!gameActive || lifelinesUsed.fiftyFifty) return;
            
            useFiftyFifty();
            lifelinesUsed.fiftyFifty = true;
            this.classList.add('used');
        });
        
        // Lifeline: Audience Help
        audienceHelpButton.addEventListener('click', function() {
            if (!gameActive || lifelinesUsed.audienceHelp) return;
            
            useAudienceHelp();
            lifelinesUsed.audienceHelp = true;
            this.classList.add('used');
        });
        
        // Lifeline: Phone a Friend
        phoneCallButton.addEventListener('click', function() {
            if (!gameActive || lifelinesUsed.phoneCall) return;
            
            usePhoneCall();
            lifelinesUsed.phoneCall = true;
            this.classList.add('used');
        });
    }
    
    // Check if the selected answer is correct
    function checkAnswer() {
        if (selectedOption === null) return;
        
        gameActive = false;
        const selectedElement = options[selectedOption];
        const correctOption = options[currentQuestion.correctIndex];
        
        // Highlight correct answer
        correctOption.classList.add('correct');
        
        if (selectedOption === currentQuestion.correctIndex) {
            // Correct answer
            setTimeout(() => {
                if (currentLevel === 15) {
                    // Player won the game
                    endGame(true);
                } else {
                    // Advance to next level
                    currentLevel++;
                    updateLevelDisplay();
                    gameActive = true;
                    loadQuestion();
                }
            }, 2000);
        } else {
            // Wrong answer
            selectedElement.classList.add('incorrect');
            
            setTimeout(() => {
                endGame(false);
            }, 2000);
        }
    }
    
    // Update the level display in the UI
    function updateLevelDisplay() {
        levelDisplay.textContent = `Nivel ${currentLevel}`;
        
        // Update levels sidebar
        levels.forEach(level => {
            const levelNum = parseInt(level.dataset.level);
            level.classList.remove('current', 'completed');
            
            if (levelNum === currentLevel) {
                level.classList.add('current');
            } else if (levelNum < currentLevel) {
                level.classList.add('completed');
            }
        });
    }
    
    // 50/50 lifeline functionality
    function useFiftyFifty() {
        const correctIndex = currentQuestion.correctIndex;
        let optionsToRemove = 2;
        let availableIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
        
        // Shuffle available indices
        availableIndices.sort(() => Math.random() - 0.5);
        
        // Remove two wrong options
        while (optionsToRemove > 0 && availableIndices.length > 0) {
            const indexToRemove = availableIndices.pop();
            options[indexToRemove].disabled = true;
            options[indexToRemove].querySelector('.option-text').textContent = '';
            optionsToRemove--;
        }
    }
    
    // Audience Help lifeline functionality
    function useAudienceHelp() {
        const correctIndex = currentQuestion.correctIndex;
        
        // Simulate audience percentages
        const percentages = [];
        let remainingPercentage = 100;
        
        // Assign higher percentage to correct answer (40-60%)
        const correctPercentage = Math.floor(Math.random() * 21) + 40;
        percentages[correctIndex] = correctPercentage;
        remainingPercentage -= correctPercentage;
        
        // Distribute remaining percentage among wrong answers
        for (let i = 0; i < 4; i++) {
            if (i !== correctIndex) {
                if (i === 3) {
                    // Last option gets whatever is left
                    percentages[i] = remainingPercentage;
                } else {
                    // Random distribution
                    const p = Math.min(Math.floor(Math.random() * remainingPercentage), remainingPercentage - 1);
                    percentages[i] = p > 0 ? p : 1; // Ensure at least 1%
                    remainingPercentage -= percentages[i];
                }
            }
        }
        
        // Display percentages
        options.forEach((option, index) => {
            const optionText = option.querySelector('.option-text');
            optionText.textContent = `${currentQuestion.options[index]} (${percentages[index]}%)`;
        });
    }
    
    // Phone a Friend lifeline functionality
    function usePhoneCall() {
        const correctIndex = currentQuestion.correctIndex;
        
        // 70% chance the friend gives correct answer
        const isCorrect = Math.random() < 0.7;
        
        let message;
        if (isCorrect) {
            message = `Tu amigo dice: "Estoy bastante seguro de que la respuesta es ${String.fromCharCode(65 + correctIndex)}."`;
        } else {
            // Friend gives wrong answer
            let wrongIndex;
            do {
                wrongIndex = Math.floor(Math.random() * 4);
            } while (wrongIndex === correctIndex);
            
            message = `Tu amigo dice: "No estoy completamente seguro, pero creo que es ${String.fromCharCode(65 + wrongIndex)}."`;
        }
        
        // Display message
        const helpMessage = document.createElement('div');
        helpMessage.className = 'help-message';
        helpMessage.textContent = message;
        
        document.querySelector('.question-block').appendChild(helpMessage);
        
        // Remove message after 6 seconds
        setTimeout(() => {
            helpMessage.remove();
        }, 6000);
    }
    
    // End the game and show results
    function endGame(isWinner) {
        gameActive = false;
        
        // Create result message
        let message;
        let prizeAmount;
        
        if (isWinner) {
            message = '¡Felicidades! ¡Has ganado el juego!';
            prizeAmount = '$1,000,000';
        } else {
            message = 'Juego terminado';
            
            // Determine prize based on safe points (levels 5 and 10)
            if (currentLevel > 10) {
                prizeAmount = '$32,000';
            } else if (currentLevel > 5) {
                prizeAmount = '$1,000';
            } else {
                prizeAmount = '$0';
            }
        }
        
        // Create result overlay
        const resultOverlay = document.createElement('div');
        resultOverlay.className = 'result-overlay';
        resultOverlay.innerHTML = `
            <div class="result-card">
                <h2>${message}</h2>
                <p>Has llegado al nivel ${currentLevel}</p>
                <p>Premio: <strong>${prizeAmount}</strong></p>
                <button id="playAgainButton" class="primary-button">Jugar de nuevo</button>
            </div>
        `;
        
        document.querySelector('.game-layout').appendChild(resultOverlay);
        
        // Add event listener to play again button
        document.getElementById('playAgainButton').addEventListener('click', () => {
            window.location.reload();
        });
    }
    
    // Initialize the game
    initGame();
}); 