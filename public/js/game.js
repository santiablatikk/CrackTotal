/**
 * PASALA CHE - Main Game Script
 * This script handles the rosco game logic, including drawing the alphabet circle,
 * loading questions, handling user answers, and game flow.
 */

// Global variables
let username = "";
let selectedDifficulty = 'facil';
let timeLimit = 300; // Default time limit (5 minutes for facil)
let timer;
let timeRemaining;
let currentLetterIndex = 0;
let helpCount = 2; // Number of available hints
let errorCount = 0; // Counter for errors
let letterStatus = {}; // Status of each letter (correct, incorrect, pending, skipped)
let gameQuestions = []; // Game questions
let gameStarted = false;
let letterElements = {}; // Reference to DOM elements of letters
let letterHints = {}; // Track which letters have received hints
let incorrectAnswersList = []; // Track incorrect answers with their correct answers
let incorrectAnswersCount = 0; // Counter for incorrect answers
const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

// Variables adicionales para controlar intentos
let incompleteAttempts = 2; // Contador para respuestas incompletas permitidas
let partialAnswers = {}; // Registro de respuestas parciales por letra

/**
 * Initialize the game when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const loadingOverlay = document.querySelector('.loading-overlay');
  const roscoContainer = document.getElementById('rosco-container');
  const currentLetterDisplay = document.querySelector('.current-letter-display');
  const currentQuestion = document.querySelector('.current-question');
  const currentDefinition = document.querySelector('.current-definition');
  const answerForm = document.getElementById('answer-form');
  const answerInput = document.getElementById('answer-input');
  const helpBtn = document.getElementById('help-btn');
  const submitBtn = document.getElementById('submit-btn');
  const skipBtn = document.getElementById('skip-btn');
  const timer = document.getElementById('timer');
  const errorDots = document.querySelectorAll('.error-dot');
  const soundToggle = document.getElementById('sound-toggle');
  const resultModal = document.getElementById('result-modal');
  const restartBtn = document.getElementById('restart-btn');
  const homeBtn = document.getElementById('home-btn');
  const toast = document.getElementById('toast');
  const toastMessage = document.querySelector('.toast-message');
  
  // NUEVA FUNCIÓN: Limpiar historial al iniciar el juego
  // cleanupExistingGameHistory(); // ¡FUNCIÓN ELIMINADA! Causaba error y detenía la carga
  
  // Stats elements
  const correctCountDisplay = document.getElementById('correct-count');
  const incorrectCountDisplay = document.getElementById('incorrect-count');
  const skippedCountDisplay = document.getElementById('skipped-count');
  const remainingCountDisplay = document.getElementById('remaining-count');
  const finalCorrect = document.getElementById('final-correct');
  const finalIncorrect = document.getElementById('final-incorrect');
  const finalSkipped = document.getElementById('final-skipped');
  
  // Audio elements
  const correctSound = document.getElementById('correctSound');
  const incorrectSound = document.getElementById('incorrectSound');
  const skipSound = document.getElementById('skipSound');
  const gameOverSound = document.getElementById('gameOverSound');
  const clickSound = document.getElementById('clickSound');
  
  // Game state variables
  let questions = [];
  let currentQuestionIndex = 0;
  let correctAnswers = 0;
  let skippedAnswers = 0;
  let timerInterval;
  let errorCount = 0;
  let gameStarted = false;
  let letterElements = {};
  
  // Obtener la dificultad seleccionada de sessionStorage
  function getSelectedDifficulty() {
    // Verificar si hay una dificultad guardada en sessionStorage
    const storedDifficulty = sessionStorage.getItem('selectedDifficulty');
    
    // Si hay una dificultad guardada, actualizar la variable global
    if (storedDifficulty) {
      selectedDifficulty = storedDifficulty;
      
      // Establecer el límite de tiempo según la dificultad
      switch(selectedDifficulty) {
    case 'facil':
          timeLimit = 300; // 5 minutos
      break;
        case 'normal':
          timeLimit = 240; // 4 minutos
      break;
    case 'dificil':
          timeLimit = 200; // 3:20 minutos
      break;
    default:
          timeLimit = 300; // Valor por defecto
      }
  }
  
    // Inicializar remainingTime con el timeLimit
  remainingTime = timeLimit;
  
    return selectedDifficulty;
  }
  
  // The alphabet for the rosco (Spanish alphabet without Ñ)
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  
  // Sound settings
  let soundEnabled = true;
  
  // Inicializar componentes de la interfaz
  function initUI() {
    // Actualizar el texto del botón de ayuda
    updateHelpButtonText();
    
    // Event listeners para los botones
    submitBtn.addEventListener('click', function() {
      if (answerInput.value.trim()) {
        handleAnswer();
      }
    });
    
    skipBtn.addEventListener('click', function() {
      skipQuestion();
    });
    
    // Event listener para el form
    answerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (answerInput.value.trim()) {
        handleAnswer();
    }
    });
}

  // Función para actualizar el botón de ayuda con el contador
  function updateHelpButtonText() {
    document.querySelector('.help-count').textContent = `(${helpCount})`;
  }
  
  // Event listener para el botón de ayuda
  helpBtn.addEventListener('click', function() {
    showHelp();
  });
  
  // Actualizar el texto del botón de ayuda
  updateHelpButtonText();
  
  // Función para mostrar ayuda con las 3 primeras letras
  function showHelp() {
    if (helpCount > 0 && gameStarted) {
      const currentQuestion = questions[currentQuestionIndex];
      const currentLetter = currentQuestion.letter;
      
      // Solo decrementar helpCount si es la primera vez que se pide pista para esta letra
      if (!letterHints[currentLetter]) {
        helpCount--;
        updateHelpButtonText();
        
        // Deshabilitar el botón si no quedan ayudas
        if (helpCount === 0) {
          helpBtn.disabled = true;
          helpBtn.style.opacity = '0.6';
        }
      }
      
      // Guardar la pista para esta letra
      const firstThreeLetters = currentQuestion.answer.substring(0, 3).toUpperCase();
      letterHints[currentLetter] = firstThreeLetters;
      
      // Crear o actualizar un elemento de pista flotante para esta letra
      displayHintElement(currentLetter, firstThreeLetters);
      
      playSound(clickSound);
    } else if (helpCount <= 0) {
      showGameMessage('No tienes más ayudas disponibles', 'warning');
    }
  }
  
  // Función para mostrar un elemento de pista flotante sobre la letra actual
  function displayHintElement(letter, hintText) {
    // Buscar si ya existe un elemento de pista para esta letra
    let hintElement = document.querySelector(`.hint-element[data-letter="${letter}"]`);
    
    // Si no existe, crearlo
    if (!hintElement) {
      hintElement = document.createElement('div');
      hintElement.className = 'hint-element';
      hintElement.dataset.letter = letter;
      document.body.appendChild(hintElement);
    }
    
    // Actualizar contenido y posición
    hintElement.innerHTML = `<span class="hint-text">${hintText}...</span>`;
    
    // Obtener posición de la letra en el rosco
    const letterElem = letterElements[letter];
    if (letterElem) {
      const rect = letterElem.getBoundingClientRect();
      hintElement.style.left = `${rect.left + window.scrollX + rect.width/2 - hintElement.offsetWidth/2}px`;
      hintElement.style.top = `${rect.top + window.scrollY - 40}px`;
      hintElement.style.display = 'block';
    }
  }
  
  // Función para normalizar texto (quitar tildes, ñ, etc.)
  function normalizeText(text) {
    return text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/[^\w\s]/gi, '') // Quitar signos de puntuación
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
      .trim();
  }
  
  // Función para verificar similitud entre strings
  function stringSimilarity(s1, s2) {
    s1 = normalizeText(s1);
    s2 = normalizeText(s2);
    
    // Si son iguales después de normalizar
    if (s1 === s2) return 1;
    
    // Si la respuesta del usuario (s1) contiene la respuesta correcta completa (s2)
    // pero NO al revés (para evitar aceptar respuestas incompletas)
    if (s1.includes(s2)) return 1;
    
    // Para strings cortos, ser más tolerante
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength <= 4) {
      // Para palabras muy cortas (4 letras o menos), permitir un error
      let differences = 0;
      for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
        if (s1[i] !== s2[i]) differences++;
      }
      differences += Math.abs(s1.length - s2.length);
      
      // Si hay máximo 1 error para palabras cortas, considerar similar
      return differences <= 1 ? 0.9 : 0;
    }
    
    // Contar caracteres diferentes (algoritmo simple de distancia)
    let differences = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i] !== s2[i]) differences++;
    }
    
    // Añadir como diferencias los caracteres restantes del string más largo
    differences += Math.abs(s1.length - s2.length);
    
    // Calcular similitud (1 es exacto, 0 es completamente diferente)
    const similarity = 1 - (differences / maxLength);
    
    return similarity;
  }
  
  // Función para verificar si una respuesta es parcial
  function isPartialAnswer(userAnswer, correctAnswer) {
    userAnswer = normalizeText(userAnswer);
    correctAnswer = normalizeText(correctAnswer);
    
    // Si la respuesta correcta tiene espacios (posible nombre y apellido)
    if (correctAnswer.includes(' ')) {
      const parts = correctAnswer.split(' ');
      
      // Comprobar si la respuesta del usuario coincide con alguna parte
      for (const part of parts) {
        if (stringSimilarity(userAnswer, part) > 0.75) {
          return true;
        }
      }
    }
    
    // Si la respuesta del usuario está contenida en la respuesta correcta
    // y tiene al menos 3 caracteres (para evitar falsos positivos)
    if (correctAnswer.includes(userAnswer) && userAnswer.length >= 3) {
      return true;
    }
    
    return false;
  }
  
  // Event listeners
  answerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (answerInput.value.trim()) {
      handleAnswer();
    } else {
      skipQuestion();
    }
  });
  
  // Create the rosco with letters in a clockwise circle
  function createRosco() {
    // Clear any existing letters but keep the question card
    const questionCard = document.querySelector('.question-card');
    roscoContainer.innerHTML = '';
    if (questionCard) {
      roscoContainer.appendChild(questionCard);
    }
    
    const totalLetters = alphabet.length;
    // Detectar si estamos en móvil para usar un radio mucho menor
    const isMobile = window.innerWidth <= 480 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Usar un radio mucho menor en móviles
    const radius = isMobile ? 120 : 260; // Radio reducido para móviles
    const centerX = 300; // Center X coordinate
    const centerY = 300; // Center Y coordinate
    
    // Calculate positions for each letter in a clockwise circle
    alphabet.forEach((letter, index) => {
      // Calculate angle in radians, starting from top and going clockwise
      // Subtract from 2π and start from -π/2 (top position)
      const angle = (2 * Math.PI * index / totalLetters) - (Math.PI / 2);
      
      // Calculate position on the circle using sine and cosine
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
    
      // Create letter element
      const letterElem = document.createElement('div');
      letterElem.className = 'rosco-letter';
      letterElem.id = `letter-${letter}`;
      letterElem.textContent = letter;
      letterElem.dataset.letter = letter;
      letterElem.dataset.index = index;
      letterElem.dataset.status = 'pending';
      
      // Tamaño reducido para móviles
      if (isMobile) {
        letterElem.style.width = '22px';
        letterElem.style.height = '22px';
        letterElem.style.fontSize = '12px';
      }
      
      // Position the letter (adjust for center)
      letterElem.style.left = `${x - (isMobile ? 11 : 27.5)}px`;
      letterElem.style.top = `${y - (isMobile ? 11 : 27.5)}px`;
      
      // Add a more pronounced appearance effect
      letterElem.style.opacity = '0';
      letterElem.style.transform = 'scale(0)';
      
      roscoContainer.appendChild(letterElem);
      
      // Store reference to this element
      letterElements[letter] = letterElem;
      
      // Trigger animation with a staggered delay
      setTimeout(() => {
        letterElem.style.opacity = '1';
        letterElem.style.transform = 'scale(1)';
        letterElem.style.transition = `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.03}s`;
      }, 30);
    });
    
    // Update stats display
    updateStatsDisplay();
  }
  
  // Fetch questions from the server (adapted to the structure in questions.json)
  async function fetchQuestions() {
    try {
      // Fetch both question sets
      const [regularResponse, pasapalabraResponse] = await Promise.all([
        fetch('data/questions.json'), // Ruta relativa
        fetch('data/questions_pasapalabra.json') // Ruta relativa
      ]);
      
      const regularData = await regularResponse.json();
      const pasapalabraData = await pasapalabraResponse.json();
      
      // Combine both data sets
      const combinedData = combineQuestionSets(regularData, pasapalabraData);
      
      // Process questions to format them for the game
      // Exclude questions for the letter Ñ
      questions = [];
      
      // Track selected questions' content to avoid similar ones
      const selectedQuestionTexts = [];
      
      alphabet.forEach(letter => {
        // Find matching letter in the combined data
        const letterData = combinedData.find(item => item.letra === letter);
        
        if (letterData && letterData.preguntas && letterData.preguntas.length > 0) {
          // Get all questions for this letter
          const availableQuestions = letterData.preguntas;
          
          // Shuffle questions to get random order before filtering
          const shuffledQuestions = shuffleArray([...availableQuestions]);
          
          // Find a question that's not too similar to already selected ones
          let selectedQuestion = null;
          
          for (const questionItem of shuffledQuestions) {
            // Check if this question is sufficiently different from already selected ones
            const isTooSimilar = selectedQuestionTexts.some(text => {
              // Calculate similarity between this question and already selected ones
              return calculateQuestionSimilarity(text, questionItem.pregunta) > 0.6;
            });
            
            if (!isTooSimilar) {
              selectedQuestion = questionItem;
              selectedQuestionTexts.push(questionItem.pregunta);
              break;
            }
          }
          
          // If all questions are too similar, just pick the first shuffled one
          if (!selectedQuestion && shuffledQuestions.length > 0) {
            selectedQuestion = shuffledQuestions[0];
            selectedQuestionTexts.push(selectedQuestion.pregunta);
          }
          
          // Add selected question to our game questions
          if (selectedQuestion) {
            // Check if it's a "CONTIENE X" type question or regular
            const isContainsType = selectedQuestion.pregunta.startsWith('CONTIENE ');
            let questionPrefix, questionText;
            
            if (isContainsType) {
              // Extract the CONTIENE part (e.g., "CONTIENE A:")
              const match = selectedQuestion.pregunta.match(/^CONTIENE ([A-Z]):/);
              if (match && match[1]) {
                questionPrefix = `CONTIENE ${match[1]}:`;
                questionText = selectedQuestion.pregunta.replace(/^CONTIENE [A-Z]:/, '').trim();
              } else {
                // If format is different, keep the first part and clean up
                const parts = selectedQuestion.pregunta.split(':');
                if (parts.length > 1) {
                  questionPrefix = parts[0] + ':';
                  questionText = parts.slice(1).join(':').trim();
                } else {
                  questionPrefix = `CONTIENE ${letter}:`;
                  questionText = selectedQuestion.pregunta.replace(/^CONTIENE [A-Z]\s?/, '').trim();
                }
              }
            } else {
              questionPrefix = `Comienza con ${letter}:`;
              questionText = selectedQuestion.pregunta;
            }
            
            questions.push({
              letter: letter,
              question: questionPrefix,
              definition: questionText,
              answer: selectedQuestion.respuesta.toLowerCase().trim()
            });
          } else {
            // Fallback if no questions for a letter
          questions.push({
            letter: letter,
            question: `Comienza con ${letter}:`,
              definition: `No hay preguntas disponibles para la letra ${letter}`,
              answer: 'no disponible'
          });
          }
        } else {
          // Fallback if no questions for a letter
          questions.push({
            letter: letter,
            question: `Comienza con ${letter}:`,
            definition: `No hay preguntas disponibles para la letra ${letter}`,
            answer: 'no disponible'
          });
        }
      });
      
      // Update remaining count
      remainingCountDisplay.textContent = questions.length;
      
      return true;
    } catch (error) {
      console.error('Error fetching questions:', error);
      return false;
    }
  }
  
  // Helper function to combine the two question sets
  function combineQuestionSets(regularData, pasapalabraData) {
    const combinedData = [];
    
    // Process each letter
    alphabet.forEach(letter => {
      const regularLetterData = regularData.find(item => item.letra === letter);
      const pasapalabraLetterData = pasapalabraData.find(item => item.letra === letter);
      
      // Create a new entry for this letter
      const combinedLetterData = { letra: letter, preguntas: [] };
      
      // Add questions from regular set if available
      if (regularLetterData && regularLetterData.preguntas) {
        combinedLetterData.preguntas = [...combinedLetterData.preguntas, ...regularLetterData.preguntas];
      }
      
      // Add questions from pasapalabra set if available
      if (pasapalabraLetterData && pasapalabraLetterData.preguntas) {
        combinedLetterData.preguntas = [...combinedLetterData.preguntas, ...pasapalabraLetterData.preguntas];
      }
      
      // Only add this letter if it has questions
      if (combinedLetterData.preguntas.length > 0) {
        combinedData.push(combinedLetterData);
      }
    });
    
    return combinedData;
  }
  
  // Helper function to shuffle an array (Fisher-Yates algorithm)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Function to calculate similarity between two question texts
  function calculateQuestionSimilarity(text1, text2) {
    // Convert both texts to lowercase for case-insensitive comparison
    const t1 = text1.toLowerCase();
    const t2 = text2.toLowerCase();
    
    // Simple word overlap calculation
    const words1 = t1.split(/\s+/).filter(w => w.length > 3); // Only consider words longer than 3 chars
    const words2 = t2.split(/\s+/).filter(w => w.length > 3);
    
    // Count common significant words
    let commonWords = 0;
    for (const word of words1) {
      if (words2.includes(word)) {
        commonWords++;
      }
    }
    
    // Calculate similarity ratio
    const maxWords = Math.max(words1.length, words2.length);
    if (maxWords === 0) return 0;
    
    return commonWords / maxWords;
  }
  
  // Initialize the game
  async function initGame() {
    loadingOverlay.style.display = 'flex';
    
    // Obtener la dificultad y configurar el tiempo
    getSelectedDifficulty();
    
    // Crear el rosco
    createRosco();
    
    // Cargar preguntas
    const questionsLoaded = await fetchQuestions();
    
    if (!questionsLoaded) {
      currentDefinition.textContent = 'Error al cargar las preguntas. Por favor, recarga la página.';
      loadingOverlay.style.display = 'none';
      return;
    }
    
    // Mostrar primera pregunta
    displayQuestion(0);
    
    // Iniciar temporizador
    startTimer();
    
    // Ocultar overlay de carga
    loadingOverlay.style.display = 'none';
    
    // Enfocar en el input de respuesta
    answerInput.focus();
    
    gameStarted = true;
  }
  
  // Display the current question
  function displayQuestion(index) {
    // Ensure the index is within bounds by wrapping around if needed
    if (index >= questions.length) {
      index = index % questions.length;
    }
    
    const question = questions[index];
    const currentLetter = question.letter;
    
    // Update current letter
    currentLetterDisplay.textContent = currentLetter;
    currentLetterDisplay.setAttribute('data-letter', currentLetter);
    
    // Display the correct question prefix (either "Comienza con X:" or "CONTIENE X:")
    // And handle the definition correctly
    currentQuestion.classList.remove('contains-question-text', 'starts-with-question-text'); // Reset classes first

    if (question.question.startsWith('CONTIENE')) { // Check for CONTIENE
      currentQuestion.textContent = question.question; // Display the full text
      currentQuestion.classList.add('contains-question-text'); // Add class for CONTIENE styling
      currentDefinition.textContent = question.definition;
    } else if (question.question.startsWith('Comienza con')) {
      currentQuestion.textContent = question.question; // Display the full text
      currentQuestion.classList.add('starts-with-question-text'); // Add class for Comienza con styling
      currentDefinition.textContent = question.definition;
    } else {
      // Fallback for any other question format (should not happen with current logic)
    currentQuestion.textContent = question.question;
    currentDefinition.textContent = question.definition;
    }
    
    // Highlight current letter in the rosco
    Object.values(letterElements).forEach(elem => {
      elem.classList.remove('current');
    });
    
    const currentLetterElem = letterElements[currentLetter];
    if (currentLetterElem) {
      // If the question was previously skipped, reset its appearance to pending
      if (currentLetterElem.dataset.status === 'skipped') {
        currentLetterElem.classList.remove('skipped');
        currentLetterElem.dataset.status = 'pending';
        // Update the skipped count
        skippedAnswers--;
        skippedCountDisplay.textContent = skippedAnswers;
      }
      
      currentLetterElem.classList.add('current');
      
      // Si esta letra ya tenía una pista, mostrarla automáticamente
      if (letterHints[currentLetter]) {
        displayHintElement(currentLetter, letterHints[currentLetter]);
      } else {
        // Ocultar cualquier elemento de pista anterior
        hideAllHints();
      }
    }
    
    // Clear input
    answerInput.value = '';
    answerInput.focus();
  
    // Update stats
    updateStatsDisplay();
  }
  
  // Función para ocultar todas las pistas
  function hideAllHints() {
    const hintElements = document.querySelectorAll('.hint-element');
    hintElements.forEach(el => {
      el.style.display = 'none';
    });
  }
  
  // Handle answer submission
  function handleAnswer() {
    if (!gameStarted || currentQuestionIndex >= questions.length) return;
    
    const userAnswer = answerInput.value.toLowerCase().trim();
    const currentQuestion = questions[currentQuestionIndex];
    const currentLetter = currentQuestion.letter;
    const correctAnswer = currentQuestion.answer.toLowerCase().trim();
    
    // Check if answer is empty
    if (userAnswer === '') {
      // Si el input está vacío, tratamos como skip
      skipQuestion();
      return;
    }
  
    const letterElem = letterElements[currentLetter];
    const similarity = stringSimilarity(userAnswer, correctAnswer);
    
    // Si la similitud es alta (>0.75) o son iguales después de normalizar
    if (similarity > 0.75 || normalizeText(userAnswer) === normalizeText(correctAnswer)) {
      // Correct answer - solo cambiamos el color, sin notificación
      letterElem.classList.add('correct');
      letterElem.dataset.status = 'correct';
      correctAnswers++;
      // Sonido sutil
      playSound(correctSound);
      
      // Actualizar contador
      correctCountDisplay.textContent = correctAnswers;
      
      // Eliminar pista si existe
      removeHintForLetter(currentLetter);
      
      // Mover a la siguiente pregunta
      moveToNextQuestion();
    } 
    // Comprobar si es una respuesta parcial
    else if (isPartialAnswer(userAnswer, correctAnswer) && incompleteAttempts > 0) {
      // Si es la primera vez que intenta con esta letra
      const letterKey = currentQuestion.letter;
      
      if (!partialAnswers[letterKey]) {
        incompleteAttempts--;
        partialAnswers[letterKey] = userAnswer;
        
        // Mostrar mensaje genérico sin revelar la respuesta
        showGameMessage("Respuesta incompleta, intente nuevamente", 'warning');
        
        // No avanzar a la siguiente pregunta
        answerInput.value = '';
        answerInput.focus();
      } else {
        // Si ya intentó antes con esta letra
        showGameMessage('Ya has usado una respuesta parcial para esta letra', 'warning');
      }
    } else {
      // Incorrect answer - solo cambiamos el color, sin notificación
      letterElem.classList.add('incorrect');
      letterElem.dataset.status = 'incorrect';
      incorrectAnswersList.push({ 
        letter: currentLetter, 
        correctAnswer: correctAnswer,
        userAnswer: userAnswer
      });
      incorrectAnswersCount++;
      // Sonido sutil
      playSound(incorrectSound);
      
      // Actualizar contador
      incorrectCountDisplay.textContent = incorrectAnswersCount;
      
      // Eliminar pista si existe
      removeHintForLetter(currentLetter);
      
      // Add error
      addError();
      
      // Mover a la siguiente pregunta
      moveToNextQuestion();
    }
    
    // Limpiar el input
    answerInput.value = '';
    
    // Update stats
    updateStatsDisplay();
  }
  
  // Eliminar pista para una letra específica
  function removeHintForLetter(letter) {
    // Eliminar el elemento visual de la pista
    const hintElement = document.querySelector(`.hint-element[data-letter="${letter}"]`);
    if (hintElement) {
      hintElement.remove();
    }
    
    // Eliminar del registro de pistas
    delete letterHints[letter];
  }
  
  // Handle skipping a question
  function skipQuestion() {
    if (!gameStarted || currentQuestionIndex >= questions.length) return;
    
    const currentLetter = questions[currentQuestionIndex].letter;
    const letterElem = letterElements[currentLetter];
    
    // Mark as skipped
    letterElem.classList.add('skipped');
    letterElem.dataset.status = 'skipped';
    skippedAnswers++;
    playSound(skipSound);
    
    // Actualizar contador
    skippedCountDisplay.textContent = skippedAnswers;
    
    // Move to next question
    moveToNextQuestion();
    
    // Update stats
    updateStatsDisplay();
  }
  
  // Move to the next unanswered question
  function moveToNextQuestion() {
    // Update current index
    currentQuestionIndex++;
    
    // Check if we've gone through all questions
    if (currentQuestionIndex >= questions.length) {
      let skippedQuestionFound = false;
      
      // Find the first skipped question (cycling back to A)
      for (let i = 0; i < questions.length; i++) {
        const letter = questions[i].letter;
        const letterElem = letterElements[letter];
        
        // Only look for skipped questions, ignore correct and incorrect
        if (letterElem.dataset.status === 'skipped') {
          currentQuestionIndex = i;
          skippedQuestionFound = true;
          break;
        }
      }
      
      // If no skipped questions remain, or we have 3 errors, end the game
      if (!skippedQuestionFound || errorCount >= 3) {
        endGame();
        return;
      }
      
      // Show message when cycling back to skipped questions
      if (skippedQuestionFound) {
        showGameMessage('¡Continuamos con las preguntas que pasaste!', 'info');
      }
    } else {
      // During the first round, skip questions that are already answered
      const currentLetter = questions[currentQuestionIndex].letter;
      const currentLetterElem = letterElements[currentLetter];
      const status = currentLetterElem.dataset.status;
      
      // If this question was already answered (correct or incorrect), move to next
      if (status === 'correct' || status === 'incorrect') {
        moveToNextQuestion();
        return;
      }
    }
    
    // Display the next question
    displayQuestion(currentQuestionIndex);
    
    // Update stats
    updateStatsDisplay();
    
    // Check if we should end the game (all questions answered except skipped)
    let allAnswered = true;
    let hasSkipped = false;
    
    for (const letter in letterElements) {
      const status = letterElements[letter].dataset.status;
      if (status === 'pending') {
        allAnswered = false;
        break;
      }
      if (status === 'skipped') {
        hasSkipped = true;
      }
    }
    
    // End game if all questions are answered (except skipped) and we have 3 errors
    if ((allAnswered && !hasSkipped) || errorCount >= 3) {
      endGame();
    }
  }
  
  // Start the timer
  function startTimer() {
  clearInterval(timerInterval);
    
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
      remainingTime--;
      
      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        endGame();
      }
      
      updateTimerDisplay();
    }, 1000);
  }
  
  // Update the timer display
  function updateTimerDisplay() {
    // Mostrar solo segundos totales
    timer.textContent = `${remainingTime}`;
    
    // Calcular porcentaje de tiempo restante basado en el tiempo inicial
    const timePercentage = (remainingTime / timeLimit) * 100;
    
    // Remover todas las clases de tiempo
    timer.classList.remove('low-time');
    document.querySelector('.mini-timer').classList.remove('low-time', 'medium-time');
    
    // Cambiar color basado en el porcentaje de tiempo restante
    if (timePercentage <= 15) {
      // Rojo - Menos del 15% del tiempo
      timer.classList.add('low-time');
      document.querySelector('.mini-timer').classList.add('low-time');
    } else if (timePercentage <= 40) {
      // Amarillo - Entre 15% y 40% del tiempo
      document.querySelector('.mini-timer').classList.add('medium-time');
    }
    // Por encima de 40% se mantiene en verde (valor por defecto)
  }
  
  // Add error and check if game should end
  function addError() {
    errorCount++;
    
    // Update error dots
    for (let i = 0; i < errorDots.length; i++) {
      if (i < errorCount) {
        errorDots[i].classList.add('active');
      }
    }
    
    // Check if game should end (3 errors)
    if (errorCount >= 3) {
      endGame();
    }
  }
  
  // End the game
  function endGame() {
    // --- GUARD: Prevent running if game already ended ---
    if (!gameStarted) {
        console.log('[endGame] Prevented duplicate execution because gameStarted is false.');
        return; 
    }
    // --- END GUARD ---

    console.log('[endGame] Executing...'); // Log when endGame actually starts
    
    // Detener el temporizador y establecer el juego como finalizado
    clearInterval(timerInterval);
    gameStarted = false; // Set the flag immediately after the guard
    
    // Track user's attempt details in incorrectAnswersList
    const incorrectItems = incorrectAnswersList.map(item => {
      const question = questions.find(q => q.letter === item.letter);
      return {
        letter: item.letter,
        userAnswer: item.userAnswer || "Sin respuesta",
        correctAnswer: item.correctAnswer,
        question: question ? question.definition : ""
      };
    });
    
    // Determine which modal to show based on end condition
    let modalType;
    let victory = false;
    
    if (errorCount >= 3) {
      // Game ended due to too many errors
      modalType = 'defeat';
      victory = false;
    } else if (remainingTime <= 0) {
      // Game ended due to timeout
      modalType = 'timeout';
      victory = false;
    } else {
      // Check if all questions are answered (not pending or skipped)
      let allAnswered = true;
      let hasSkipped = false;
      
      for (const letter in letterElements) {
        const status = letterElements[letter].dataset.status;
        if (status === 'pending') {
          allAnswered = false;
          break;
        }
        if (status === 'skipped') {
          hasSkipped = true;
        }
      }
      
      // Victory if all questions are answered (except skipped) and less than 3 errors
      if (allAnswered && errorCount < 3) {
        modalType = 'victory';
        victory = true;
      } else if (hasSkipped) {
        // If there are still skipped questions, don't end the game
        return;
      } else {
        // Otherwise, it's a defeat
        modalType = 'defeat';
        victory = false;
      }
    }
    
    // Update stats in the stats modal
    document.getElementById('stats-correct').textContent = correctAnswers;
    document.getElementById('stats-incorrect').textContent = incorrectAnswersCount;
    document.getElementById('stats-skipped').textContent = skippedAnswers;
    
    // Generate incorrect answers list
    generateIncorrectAnswersList(incorrectItems);
    
    // Show the corresponding modal
    const modal = document.getElementById(`${modalType}-modal`);
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // Play game over sound
    playSound(gameOverSound);
    
    // ==================== SAVE GAME RESULTS TO PROFILE ====================
    try {
      // Calcular puntuación basada en respuestas correctas y tiempo restante
      const timeBonus = remainingTime > 0 ? Math.floor(remainingTime / 10) : 0;
      const scoreBase = correctAnswers * 10;
      const difficultyMultiplier = 
        selectedDifficulty === 'dificil' ? 2.0 : 
        selectedDifficulty === 'normal' ? 1.5 : 1.0;
      
      const totalScore = Math.floor((scoreBase + timeBonus) * difficultyMultiplier);
      
      // Asegurar que el nombre de usuario esté guardado
      let username = localStorage.getItem('username');
      if (!username || username === 'undefined' || username === 'null') {
        username = 'Jugador';
        localStorage.setItem('username', username);
      }
      
      // Create a truly unique game ID using timestamp & random component that will never be duplicated
      const timestamp = new Date().toISOString();
      const randomComponent = Math.random().toString(36).substring(2, 10);
      const uniqueGameId = `${timestamp}_${randomComponent}`;
      
      // Recopilar letras respondidas correctamente
      const correctLetters = [];
      for (const letter in letterElements) {
        if (letterElements[letter].dataset.status === 'correct') {
          correctLetters.push(letter);
        }
      }
      
      // Verificar si completó todas las vocales correctamente
      const allVowels = ['A', 'E', 'I', 'O', 'U'];
      const vowelsMastered = allVowels.every(vowel => correctLetters.includes(vowel));
      
      // Contar consonantes correctas
      const consonantsCorrect = correctLetters.filter(letter => !allVowels.includes(letter)).length;
      
      // Verificar secuencia de letras correctas seguidas
      let maxConsecutiveCorrect = 0;
      let currentConsecutive = 0;
      
      for (let i = 0; i < questions.length; i++) {
        const letter = questions[i].letter;
        if (letterElements[letter].dataset.status === 'correct') {
          currentConsecutive++;
          maxConsecutiveCorrect = Math.max(maxConsecutiveCorrect, currentConsecutive);
        } else {
          currentConsecutive = 0;
        }
      }
      
      // Verificar si las primeras 5 preguntas fueron respondidas rápidamente
      const quickStart = timeLimit - remainingTime < 30 && correctAnswers >= 5;
      
      // Verificar si las últimas preguntas fueron todas correctas
      const lastFiveQuestionsCorrect = questions.slice(-5).every(q => 
        letterElements[q.letter].dataset.status === 'correct'
      );
      
      // Crear objeto con los datos del juego
      const gameData = {
        name: username,
        date: timestamp,
        uniqueId: uniqueGameId, // Add a truly unique identifier
        difficulty: selectedDifficulty,
        score: totalScore,
        correct: correctAnswers,
        wrong: incorrectAnswersCount,
        skipped: skippedAnswers,
        timeUsed: timeLimit - remainingTime,
        timeRemaining: remainingTime,
        victory: victory,
        hintsUsed: 2 - helpCount,
        incorrectItems: incorrectItems,
        // Datos adicionales para logros
        correctLetters: correctLetters,
        vowelsMastered: vowelsMastered,
        consonantsCorrect: consonantsCorrect,
        streak: maxConsecutiveCorrect,
        quickStart: quickStart,
        strongFinish: lastFiveQuestionsCorrect
      };
      
      console.log('[endGame] Guardando resultados del juego:', gameData);
      
      // Guardar datos del jugador usando nuestra nueva función
      savePlayerData(gameData);
      
      // Indicar que acabamos de completar un juego
      localStorage.setItem('gameJustCompleted', 'true');
      localStorage.setItem('hasPlayed', 'true');
      localStorage.setItem('lastUniqueGameId', uniqueGameId); // Store the unique ID
      
      // Guardar último timestamp para evitar problemas de caché
      localStorage.setItem('lastGameTimestamp', Date.now().toString());
      
      // Configurar botones de los modales para redirigir al perfil
      configureModalButtons();
      
    } catch (error) {
      console.error('[endGame] Error guardando resultados del juego:', error);
    }
      
      // Mostrar anuncio al finalizar la partida
      if (localStorage.getItem("adConsent") === "true") {
        setTimeout(() => {
          const gameEndAd = document.querySelector('.game-end-ad');
          if (gameEndAd) {
            // Primero mostrar un contenedor de carga mientras el anuncio se prepara
            gameEndAd.innerHTML = `
              <div class="ad-label">PUBLICIDAD</div>
              <div class="ad-loading"></div>
            `;
            gameEndAd.style.display = 'block';
            
            // Después de un breve delay, cargar el anuncio real
            setTimeout(() => {
              gameEndAd.innerHTML = `
                <div class="ad-label">PUBLICIDAD</div>
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-pub-9579152019412427"
                     data-ad-slot="1234567890"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
              `;
              (adsbygoogle = window.adsbygoogle || []).push({});
            }, 600);
          }
        }, 1000); // Mostrar el anuncio un segundo después de que aparezca el modal
    }
  }
  
  // Configurar botones de los modales para redirigir al perfil
  function configureModalButtons() {
    // Configurar botones "Ver logros" en cada modal de resultado
    const achievementsButtons = [
      document.getElementById('victory-stats-btn'),
      document.getElementById('timeout-stats-btn'),
      document.getElementById('defeat-stats-btn')
    ];
    
    achievementsButtons.forEach(button => {
      if (button) {
        // Limpiar event listeners anteriores
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Añadir nuevo event listener
        newButton.addEventListener('click', function() {
          // Verificar si hay logros nuevos para mostrar
          const hasNewAchievements = localStorage.getItem('hasNewAchievements') === 'true';
          const sourceModalId = this.closest('.modal').id;
          
          if (hasNewAchievements) {
            // Si hay logros, mostrarlos uno a uno en modales
            showAchievementsSequentially(sourceModalId);
          } else {
            // Si no hay logros nuevos, ir directamente al modal de estadísticas
            switchToStatsModal(sourceModalId);
          }
        });
        
        // Cambiar el texto del botón según si hay logros o no
        const hasNewAchievements = localStorage.getItem('hasNewAchievements') === 'true';
        newButton.textContent = hasNewAchievements ? 'Ver Logros' : 'Ver Estadísticas';
      }
    });
  }
  
  // Configurar botones en el modal de estadísticas
  function configureStatsModalButtons() {
    // Botón "Ver Perfil"
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
      // Limpiar event listeners anteriores
      const newProfileBtn = profileBtn.cloneNode(true);
      profileBtn.parentNode.replaceChild(newProfileBtn, profileBtn);
      
      // Añadir nuevo event listener
      newProfileBtn.addEventListener('click', function() {
        // Set a very specific flag indicating we're navigating to profile from game results
        localStorage.setItem('navigationState', JSON.stringify({
          from: 'game_results',
          to: 'profile',
          timestamp: Date.now(),
          alreadySaved: true // Explicitly mark that we've already saved
        }));
        window.location.href = 'profile.html?fromGame=true&t=' + Date.now();
      });
    }
    
    // Botón "Ver Ranking"
    const rankingBtn = document.getElementById('ranking-btn');
    if (rankingBtn) {
      // Limpiar event listeners anteriores
      const newRankingBtn = rankingBtn.cloneNode(true);
      rankingBtn.parentNode.replaceChild(newRankingBtn, rankingBtn);
      
      // Añadir nuevo event listener
      newRankingBtn.addEventListener('click', function() {
        // Set a very specific flag indicating we're navigating to ranking from game results
        localStorage.setItem('navigationState', JSON.stringify({
          from: 'game_results',
          to: 'ranking',
          timestamp: Date.now(),
          alreadySaved: true // Explicitly mark that we've already saved
        }));
        window.location.href = 'ranking.html?fromGame=true&t=' + Date.now();
      });
    }
    
    // Botón "Jugar de Nuevo"
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
      // Limpiar event listeners anteriores
      const newPlayAgainBtn = playAgainBtn.cloneNode(true);
      playAgainBtn.parentNode.replaceChild(newPlayAgainBtn, playAgainBtn);
      
      // Añadir nuevo event listener
      newPlayAgainBtn.addEventListener('click', function() {
        // Clear any navigation state when starting a new game
        localStorage.removeItem('navigationState');
        hideStatsModal();
        hideModals();
        resetGame();
      });
    }
    
    // Botón para cerrar estadísticas
    const closeStatsBtn = document.getElementById('close-stats-btn');
    if (closeStatsBtn) {
      // Limpiar event listeners anteriores
      const newCloseStatsBtn = closeStatsBtn.cloneNode(true);
      closeStatsBtn.parentNode.replaceChild(newCloseStatsBtn, closeStatsBtn);
      
      // Añadir nuevo event listener
      newCloseStatsBtn.addEventListener('click', function() {
        hideStatsModal();
      });
    }
  }
  
  // Generate the list of incorrect answers for the stats modal
  function generateIncorrectAnswersList(incorrectItems) {
    const container = document.getElementById('incorrect-answers-list');
    container.innerHTML = '';
    
    if (incorrectItems.length === 0) {
      // Show a congratulatory message if no errors
      container.innerHTML = `
        <div class="no-errors-message">
          <i class="fas fa-check-circle"></i>
          ¡Felicidades! No has cometido ningún error.
        </div>
      `;
      return;
    }
    
    // Add each incorrect answer to the list
    incorrectItems.forEach(item => {
      const answerItem = document.createElement('div');
      answerItem.className = 'incorrect-answer-item';
      
      answerItem.innerHTML = `
        <div class="answer-details">
          <div class="incorrect-letter">${item.letter}</div>
          <div class="answer-text">
            <div class="question-text">${item.question}</div>
            <div class="your-answer">Tu respuesta: ${item.userAnswer}</div>
            <div class="correct-answer">Respuesta correcta: ${item.correctAnswer}</div>
          </div>
        </div>
      `;
      
      container.appendChild(answerItem);
    });
  }
  
  // Update stats display
  function updateStatsDisplay() {
    correctCountDisplay.textContent = correctAnswers;
    incorrectCountDisplay.textContent = incorrectAnswersCount;
    skippedCountDisplay.textContent = skippedAnswers;
    
    // Calculate remaining questions (pending and skipped letters)
    let remaining = 0;
    for (const letter in letterElements) {
      if (letterElements[letter].dataset.status === 'pending' || letterElements[letter].dataset.status === 'skipped') {
        remaining++;
      }
    }
    
    remainingCountDisplay.textContent = remaining;
  }
  
  // Show toast notification
  function showToast(message, type = 'success') {
    // Función deshabilitada para evitar que aparezca el toast
    return;

    // El código original está comentado a continuación
    /*
    toastMessage.textContent = message;
    
    // Set toast type
    toast.className = 'toast';
    toast.classList.add(`toast-${type}`);
    
    // Configurar el ícono según el tipo
    const toastIcon = toast.querySelector('.toast-icon i') || document.createElement('i');
    
    if (!toast.querySelector('.toast-icon')) {
      const iconContainer = document.createElement('div');
      iconContainer.className = 'toast-icon';
      iconContainer.appendChild(toastIcon);
      toast.insertBefore(iconContainer, toastMessage);
    }
    
    // Actualizar el ícono según el tipo de toast
    if (type === 'success') {
      toastIcon.className = 'fas fa-check-circle';
    } else if (type === 'error') {
      toastIcon.className = 'fas fa-times-circle';
    } else if (type === 'warning') {
      toastIcon.className = 'fas fa-exclamation-triangle';
    } else if (type === 'info') {
      toastIcon.className = 'fas fa-info-circle';
    }
    
    // Show the toast
    toast.style.display = 'flex';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        toast.style.display = 'none';
      }, 300);
    }, 3000);
    */
  }
  
  // Play sound
function playSound(sound) {
    if (soundEnabled && sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.log('Error playing sound:', e));
    }
  }
  
  // Toggle sound
  function toggleSound() {
    soundEnabled = !soundEnabled;
    
    const icon = soundToggle.querySelector('i');
    if (!soundEnabled) {
      icon.className = 'fas fa-volume-mute';
      soundToggle.classList.add('muted');
  } else {
      icon.className = 'fas fa-volume-up';
      soundToggle.classList.remove('muted');
    }
    
    // Play click sound if sound is enabled
    if (soundEnabled) {
      playSound(clickSound);
    }
  }
  
  // Reset the game
  function resetGame() {
    // Reset game state
    currentQuestionIndex = 0;
    correctAnswers = 0;
    incorrectAnswersList = [];
    incorrectAnswersCount = 0;
    skippedAnswers = 0;
    
    // Restablecer el tiempo según la dificultad seleccionada
    getSelectedDifficulty();
    
    errorCount = 0;
    helpCount = 2; // Restablecer contador de pistas
    
    // Eliminar todas las pistas
    letterHints = {};
    hideAllHints();
    
    // Restablecer botón de ayuda
    helpBtn.disabled = false;
    helpBtn.style.opacity = '1';
    updateHelpButtonText();
    
    // Restablecer intentos incompletos y respuestas parciales
    incompleteAttempts = 2;
    partialAnswers = {};
    
    // Hide all modals
    hideModals();
    
    // Reset UI
    errorDots.forEach(dot => dot.classList.remove('active'));
    
    // Initialize game again
    initGame();
  }
  
  // Event listeners
  soundToggle.addEventListener('click', function() {
    toggleSound();
  });
  
  // Stats buttons on result modals
  document.getElementById('victory-stats-btn').addEventListener('click', function() {
    switchToStatsModal('victory-modal');
  });
  
  document.getElementById('timeout-stats-btn').addEventListener('click', function() {
    switchToStatsModal('timeout-modal');
  });
  
  document.getElementById('defeat-stats-btn').addEventListener('click', function() {
    switchToStatsModal('defeat-modal');
  });
  
  // Function to switch from a result modal to the stats modal
  function switchToStatsModal(sourceModalId) {
    console.log("Switching to stats modal from:", sourceModalId);
    
    // Get the source and target modals
    const sourceModal = document.getElementById(sourceModalId);
    const statsModal = document.getElementById('stats-modal');
    
    if (!statsModal) {
      console.error("Stats modal not found!");
      return;
    }
    
    // Force any necessary style resets on the stats modal
    statsModal.style.display = 'none';
    statsModal.classList.remove('show');
    
    // First fade out the source modal
    if (sourceModal) {
      sourceModal.classList.remove('show');
      
      setTimeout(() => {
        // Hide the source modal completely
      sourceModal.style.display = 'none';
    
        // Show the stats modal with display:flex first
      statsModal.style.display = 'flex';
      
        // Force browser reflow before adding the show class
      void statsModal.offsetWidth;
      
        // Then add the show class to trigger the animation
        requestAnimationFrame(() => {
      statsModal.classList.add('show');
          console.log("Stats modal should now be visible");
        });
      }, 400); // Wait for source modal fade out
    } else {
      // If no source modal, just show the stats modal
      statsModal.style.display = 'flex';
      
      // Force browser reflow
      void statsModal.offsetWidth;
      
      // Add show class
      requestAnimationFrame(() => {
        statsModal.classList.add('show');
      });
    }
  }
  
  // Hide stats modal
  function hideStatsModal() {
    console.log("Hiding stats modal");
    const statsModal = document.getElementById('stats-modal');
    
    if (statsModal) {
      // Remove show class first to trigger fade out
      statsModal.classList.remove('show');
      
      // Wait for animation to complete before hiding completely
      setTimeout(() => {
        statsModal.style.display = 'none';
      }, 500); // Match the CSS transition duration
    }
  }
  
  // Function to hide all modals
  function hideModals() {
    const modals = document.querySelectorAll('.result-modal, #achievements-modal');
    modals.forEach(modal => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    });
  }
  
  // Llamar a la inicialización de la UI
  initUI();
  
  // Initialize game on page load
  initGame();

  // Add this function near the top of the file, after other initialization code
  function adjustRoscoForMobile() {
    // Only apply on mobile devices
    if (window.innerWidth > 768 && !isMobileDevice()) return;
    
    // Function to check if it's a mobile device
    function isMobileDevice() {
      const deviceType = detectDeviceType();
      return deviceType === 'mobile' || deviceType === 'mobile-landscape' || deviceType === 'tablet';
    }
    
    // Get all rosco letters
    const letters = document.querySelectorAll('.rosco-letter');
    if (!letters.length) return;
    
    // Handle the rosco container
    const roscoContainer = document.getElementById('rosco-container');
    if (!roscoContainer) return;
    
    // Calculate the optimal positioning of letters
    positionLettersInCircle(letters, roscoContainer);
    
    // Handle input focus/blur to deal with virtual keyboard
    const answerInput = document.getElementById('answer-input');
    if (answerInput) {
      answerInput.addEventListener('focus', function() {
        document.body.classList.add('keyboard-open');
        adjustForKeyboard(true);
      });
      
      answerInput.addEventListener('blur', function() {
        document.body.classList.remove('keyboard-open');
        adjustForKeyboard(false);
        // Re-position letters after keyboard closes
        setTimeout(() => positionLettersInCircle(letters, roscoContainer), 300);
      });
    }
    
    // Reposition on orientation change
    window.addEventListener('orientationchange', function() {
      setTimeout(() => positionLettersInCircle(letters, roscoContainer), 300);
    });
    
    // Reposition on resize
    window.addEventListener('resize', function() {
      if (window.innerWidth <= 768 || isMobileDevice()) {
        positionLettersInCircle(letters, roscoContainer);
      }
    });
  }

  // Position letters in a perfect circle
  function positionLettersInCircle(letters, container) {
    // Dimensions of the container
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    // Get the question card size
    const questionCard = document.querySelector('.question-card');
    const questionCardRadius = questionCard ? 
      Math.max(questionCard.offsetWidth, questionCard.offsetHeight) / 2 : 
      containerRect.width * 0.3;
    
    // Calculate radius for letter placement (outside the question card)
    // Adjust radius for mobile to be smaller
    const isMobile = window.innerWidth <= 480;
    const radius = isMobile ? 
      Math.min(centerX, centerY) * 0.7 : // 70% para móviles 
      centerX * 0.8;                     // 80% para escritorio
    
    // Position each letter around the circle
    letters.forEach((letter, index) => {
      const totalLetters = letters.length;
      // Calculate angle (starting from top, clockwise)
      const angle = (index / totalLetters) * 2 * Math.PI - (Math.PI / 2);
      
      // Calculate x,y position
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
        
      // Position the letter (centered at x,y)
      letter.style.position = 'absolute';
      letter.style.left = `${x - letter.offsetWidth/2}px`;
      letter.style.top = `${y - letter.offsetHeight/2}px`;
      letter.style.transform = 'none'; // Reset any transforms
      
      // Highlight current letter
      if (letter.classList.contains('current')) {
        letter.style.transform = 'scale(1.2)';
        letter.style.zIndex = '10';
      }
    });
  }

  // Adjust layout when keyboard appears/disappears
  function adjustForKeyboard(isOpen) {
    const roscoContainer = document.getElementById('rosco-container');
    const statusPanel = document.querySelector('.rosco-status');
    const footer = document.querySelector('.site-footer');
    const questionCard = document.querySelector('.question-card');
    
    if (isOpen) {
      // Keyboard is open - create more space
      if (roscoContainer) {
        roscoContainer.style.transform = 'scale(0.75)';
        roscoContainer.style.height = '45vh';
        roscoContainer.style.marginTop = '0';
      }
      
      if (questionCard) {
        // Mover la tarjeta de preguntas ligeramente hacia arriba
        questionCard.style.top = '40%';
      }
      
      if (statusPanel) {
        statusPanel.style.opacity = '0.5';
        statusPanel.style.transform = 'scale(0.9)';
      }
      
      if (footer) {
        footer.style.display = 'none';
      }
      
      // Asegurar que el contenido sea visible por encima del teclado
      window.scrollTo(0, 0);
    } else {
      // Keyboard is closed - restore layout
      if (roscoContainer) {
        roscoContainer.style.transform = '';
        roscoContainer.style.height = '';
        roscoContainer.style.marginTop = '';
      }
      
      if (questionCard) {
        questionCard.style.top = '';
      }
      
      if (statusPanel) {
        statusPanel.style.opacity = '';
        statusPanel.style.transform = '';
      }
      
      if (footer) {
        footer.style.display = '';
      }
    }
  }

  // Initialize mobile optimizations
  document.addEventListener('DOMContentLoaded', function() {
    // Call the mobile adjustment function
    adjustRoscoForMobile();
    
    // Prevent zoom on double tap (iOS Safari)
    document.addEventListener('touchend', function(e) {
      const now = Date.now();
      const lastTouch = window.lastTouch || now + 1;
      const delta = now - lastTouch;
      
      if (delta < 300 && delta > 0) {
        e.preventDefault();
      }
      
      window.lastTouch = now;
    }, false);
  });

  // Call the adjustment function on page load and window resize
  window.addEventListener('load', adjustRoscoForMobile);
  window.addEventListener('resize', adjustRoscoForMobile);

  // Add orientation change event handler for mobile devices
  window.addEventListener('orientationchange', function() {
    setTimeout(adjustRoscoForMobile, 100); // Slight delay to ensure DOM is updated
  });

  // Redirección al ranking
  const rankingBtn = document.getElementById('ranking-btn');
  if (rankingBtn) {
    rankingBtn.addEventListener('click', function() {
      window.location.href = 'ranking.html';
    });
  }
  
  // Redirección al perfil
  const profileBtn = document.getElementById('profile-btn');
  if (profileBtn) {
    profileBtn.addEventListener('click', function() {
      window.location.href = 'profile.html';
    });
  }
  
  // Redirección a Futbol Millonario
  const millonarioBtn = document.getElementById('millonario-btn');
  if (millonarioBtn) {
    millonarioBtn.addEventListener('click', function() {
      window.location.href = 'millonario/index.html';
    });
  }
  
  // Redirección al about
  const aboutBtn = document.getElementById('about-btn');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', function() {
      window.location.href = 'about.html';
    });
  }

  // Toggle menu
  const menuToggle = document.getElementById('menu-toggle');
  const optionsMenu = document.getElementById('options-menu');
  
  if (menuToggle && optionsMenu) {
    menuToggle.addEventListener('click', function() {
      optionsMenu.classList.toggle('hide');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!optionsMenu.contains(e.target) && e.target !== menuToggle) {
        optionsMenu.classList.add('hide');
      }
    });
  }
});

// Función para mostrar mensajes sutiles
function showGameMessage(message, type = 'info') {
  // Buscar o crear el elemento para el mensaje
  let gameMessage = document.querySelector('.game-message');
  
  if (!gameMessage) {
    gameMessage = document.createElement('div');
    gameMessage.className = 'game-message';
    document.body.appendChild(gameMessage);
  }
  
  // Limpiar clases previas
  gameMessage.className = 'game-message';
  
  if (type) {
    gameMessage.classList.add(`toast-${type}`);
  }
  
  // Establecer el mensaje
  gameMessage.textContent = message;
  
  // Mostrar el mensaje (la animación y ocultación se maneja en CSS)
  gameMessage.style.display = 'block';
  
  // Eliminar el mensaje después de que termine la animación
      setTimeout(() => {
    gameMessage.style.display = 'none';
  }, 5000); // Aumentado a 5000 milisegundos (5 segundos)
}

// Close button on stats modal
document.getElementById('close-stats-btn').addEventListener('click', function() {
  hideStatsModal();
});

// New navigation buttons for the stats modal
document.getElementById('profile-btn').addEventListener('click', function() {
  window.location.href = 'profile.html';
});

document.getElementById('ranking-btn').addEventListener('click', function() {
  window.location.href = 'ranking.html';
});

document.getElementById('play-again-btn').addEventListener('click', function() {
  hideStatsModal();
  hideModals();
  resetGame();
});

// Después de guardar los resultados del juego en endGame() o donde corresponda

// Asegurar que la información del jugador se guarde correctamente
function savePlayerData(gameData) {
  try {
    // SAFETY CHECK: Verify if we're seeing a duplicate save attempt by looking for recently saved identical game data
    const recentlySavedGame = localStorage.getItem('lastSavedGameData');
    if (recentlySavedGame) {
      try {
        const savedGame = JSON.parse(recentlySavedGame);
        // Check if this looks like an identical game (same date, score, correct/wrong counts)
        if (savedGame.date === gameData.date && 
            savedGame.score === gameData.score && 
            savedGame.correct === gameData.correct && 
            savedGame.wrong === gameData.wrong &&
            savedGame.difficulty === gameData.difficulty) {
          console.log('[savePlayerData] PREVENTED DUPLICATE SAVE: This exact game appears to have been saved already.');
          return; // Exit early - do not save again
        }
      } catch (e) {
        console.error('[savePlayerData] Error parsing lastSavedGameData:', e);
        // Continue with save if there was an error parsing
      }
    }
    
    // If we get here, this appears to be a unique save request
    
    // Store this game data temporarily to detect duplicates
    localStorage.setItem('lastSavedGameData', JSON.stringify({
      date: gameData.date,
      score: gameData.score,
      correct: gameData.correct,
      wrong: gameData.wrong,
      difficulty: gameData.difficulty
    }));
    
    // Regular save flow continues
    if (gameData.name) {
      localStorage.setItem('username', gameData.name);
    }
    localStorage.setItem('lastGameStats', JSON.stringify({
      score: gameData.score || 0,
      correct: gameData.correct || 0,
      wrong: gameData.wrong || 0,
      skipped: gameData.skipped || 0,
      difficulty: gameData.difficulty || 'normal',
      victory: gameData.victory || false,
      date: new Date().toISOString()
    }));
    
    const userIP = localStorage.getItem('userIP');
    let ipForSaving = userIP;

    const saveTasks = (ip) => {
      if (!ip) return;
      // 1. Guardar en historial local
      if (saveGameToHistory(gameData, ip)) {
          // 2. Comprobar logros DESPUÉS de guardar en historial (si tiene éxito)
          // Pasar una copia de gameData por si acaso
          checkAchievements({ ...gameData }, ip); 
      }
      // 3. Guardar en Firebase (puede ocurrir en paralelo o después)
      saveGameToFirebase(gameData, ip);
    };

    if (userIP) {
      saveTasks(userIP);
    } else {
      detectAndSaveUserIP().then(ip => {
        ipForSaving = ip;
        saveTasks(ip);
      });
    }
    
    console.log('[savePlayerData] Datos del jugador procesados para guardado.');
  } catch (error) {
    console.error('[savePlayerData] Error al guardar datos del jugador:', error);
  }
}

// Función para guardar partida en Firebase
function saveGameToFirebase(gameData, userIP) {
  try {
    // Verificar si Firebase está disponible
    if (window.firebaseAvailable && typeof firebase !== 'undefined' && firebase.firestore) {
      const db = firebase.firestore();
      
      // Preparar datos para guardar
      const gameRecord = {
        playerName: gameData.name || 'Anónimo',
        playerId: userIP,
        userIP: userIP,
        score: gameData.score || 0,
        correct: gameData.correct || 0,
        wrong: gameData.wrong || 0,
        skipped: gameData.skipped || 0,
        difficulty: gameData.difficulty || 'normal',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        victory: gameData.victory || false,
        timeUsed: gameData.timeUsed || 0,
        deviceType: detectDeviceType()
      };
      
      // Guardar en Firestore
      db.collection('gameHistory').add(gameRecord)
        .then(() => {
          console.log('Partida guardada en Firebase correctamente');
          // Marcar que el juego fue enviado a Firebase
          localStorage.setItem('lastGameSentToFirebase', 'true');
        })
        .catch(error => {
          console.error('Error al guardar partida en Firebase:', error);
        });
    } else {
      console.log('Firebase no está disponible, los datos se guardan solo localmente');
    }
  } catch (error) {
    console.error('Error al intentar guardar en Firebase:', error);
  }
}

// Function to detect device type - enhanced version
function detectDeviceType() {
  // Check screen size first for responsive design
  const isMobileSize = window.innerWidth <= 768;
  
  // Check for mobile user agent as fallback
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || 
                        navigator.maxTouchPoints > 0 ||
                        navigator.msMaxTouchPoints > 0;
  
  // Return device type
  if (isMobileSize || isMobileAgent) {
    if (window.innerWidth > window.innerHeight) {
      return 'mobile-landscape';
    }
    return 'mobile';
  }
  
  if (isTouchDevice) {
    return 'tablet';
  }
  
  return 'desktop';
}

// Función para guardar partida en el historial LOCAL
function saveGameToHistory(gameData, userIP) {
  try {
    console.log('[saveGameToHistory] Attempting to save game for IP:', userIP, 'Data:', gameData);
    
    // Verificación: confirmar que tenemos los datos necesarios
    if (!gameData || !userIP) {
      console.error('[saveGameToHistory] Missing gameData or userIP');
      return false;
    }
    
    // Verificación: confirmar que gameData tiene una fecha
    if (!gameData.date) {
      console.error('[saveGameToHistory] Game data missing date property');
      return false;
    }
    
    const historyKey = `gameHistory_${userIP}`;
    let history = [];
    const existingHistory = localStorage.getItem(historyKey);
    
    if (existingHistory) {
      try {
        history = JSON.parse(existingHistory);
        if (!Array.isArray(history)) history = [];
        console.log(`[saveGameToHistory] Loaded existing history length: ${history.length}`);
      } catch (e) {
        console.error('[saveGameToHistory] Error parsing existing history:', e);
        localStorage.removeItem(historyKey); // Clear corrupted data
        history = [];
      }
    }

    // Verificación INMEDIATA: si existe un uniqueId, verificar si ya existe antes de continuar
    if (gameData.uniqueId) {
      // Buscar si este uniqueId ya existe en la historia
      const hasExistingEntry = history.some(entry => entry.uniqueId === gameData.uniqueId);
      if (hasExistingEntry) {
        console.log(`[saveGameToHistory] DUPLICATE REJECTED: Game with uniqueId ${gameData.uniqueId} already exists`);
        return true; // Devolvemos true porque técnicamente el juego ya está guardado
      }
    }
    
    // Verificación ALTERNATIVA: verificar por similitud de timestamp y resultados
    if (!gameData.uniqueId) {
      try {
        // Redondear para simplificar comparación
        const gameTimestamp = new Date(gameData.date).setSeconds(0, 0);
        
        // Buscar partidas recientes con resultados idénticos
        const similarGames = history.filter(entry => {
          try {
            const entryTimestamp = new Date(entry.date).setSeconds(0, 0);
            // Si la diferencia de tiempo es menor a 60 segundos y los resultados son iguales
            const timeClose = Math.abs(gameTimestamp - entryTimestamp) < 60000; // 60 segundos
            const sameResults = 
              gameData.score === entry.score && 
              gameData.correct === entry.correct && 
              gameData.wrong === entry.wrong &&
              gameData.difficulty === entry.difficulty;
            
            return timeClose && sameResults;
          } catch (e) {
            return false;
          }
        });
        
        if (similarGames.length > 0) {
          console.log(`[saveGameToHistory] DUPLICATE by SIMILARITY: Found ${similarGames.length} similar games within 60s`);
          return true; // Consideramos que esta partida ya está representada
        }
      } catch (e) {
        console.warn('[saveGameToHistory] Error in similarity check:', e);
        // Continuar con el guardado incluso si falla la comprobación
      }
    }

    // Si llegamos aquí, no es un duplicado claro - Añadir al comienzo del array
    history.unshift(gameData);
    console.log(`[saveGameToHistory] History length after adding new game: ${history.length}`);

    // --- De-duplicación completa como última capa de protección ---
    // Primero por uniqueId (si existe)
    const uniqueHistory = [];
    const seenUniqueIds = new Set(); 
    const seenKeys = new Set();

    for (const entry of history) {
      // Priorizar uniqueId
      if (entry.uniqueId) {
        if (!seenUniqueIds.has(entry.uniqueId)) {
          seenUniqueIds.add(entry.uniqueId);
          uniqueHistory.push(entry);
        } else {
          console.log(`[saveGameToHistory] Removing duplicate by uniqueId: ${entry.uniqueId}`);
        }
      } else {
        // Para entradas sin uniqueId, usar una clave compuesta
        let entryTimestamp = 'invalid_date';
        try {
          entryTimestamp = new Date(entry.date).setSeconds(0, 0);
        } catch (e) {
          entryTimestamp = entry.date || `invalid-${Math.random()}`;
        }

        // Clave más completa con todos los valores relevantes
        const uniqueKey = `${entryTimestamp}-${entry.score || 0}-${entry.victory}-${entry.difficulty || 'unknown'}-${entry.correct || 0}-${entry.wrong || 0}`;

        if (!seenKeys.has(uniqueKey)) {
          seenKeys.add(uniqueKey);
          uniqueHistory.push(entry);
        } else {
          console.log(`[saveGameToHistory] Removing duplicate by composite key: ${uniqueKey}`);
        }
      }
    }

    console.log(`[saveGameToHistory] Unique history length after de-duplication: ${uniqueHistory.length}`);

    // Limitar a 50 entradas (más recientes primero)
    const limitedHistory = uniqueHistory.slice(0, 50);
    
    // Guardar historial actualizado
    localStorage.setItem(historyKey, JSON.stringify(limitedHistory));
    console.log('[saveGameToHistory] Game history saved successfully');
    return true; // Indicar éxito
  } catch (error) {
    console.error('[saveGameToHistory] Critical error during local history saving:', error);
    return false; // Indicar fallo
  }
}

// Verificar logros basados en los resultados de una partida
function checkAchievements(gameData, userIP) {
  if (!gameData || !userIP) return;
  console.log("Verificando logros para:", gameData);

  // Array para almacenar los logros desbloqueados en esta partida
  const newlyUnlockedAchievements = [];

  // Cargar logros desde logros.html
  loadAchievementsFromPage(function(achievements) {
    if (!achievements || !Array.isArray(achievements)) {
      console.error("No se pudieron cargar los logros desde logros.html");
      
      // Asegurarse de que no haya bandera de nuevos logros
      localStorage.removeItem('hasNewAchievements');
      
      // Actualizar textos de botones
      updateModalButtonsText(false);
      return; 
  }

    // Obtener datos adicionales
    const gameHistory = getPlayerGameHistory(userIP);
    const totalGames = gameHistory.length;
    const totalScore = calculateTotalScore(gameHistory);
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

    // VERIFICACIÓN DE LOGROS ORIGINALES
  // Logro: Primer juego (siempre se verifica)
    checkAndUnlock('first_game', userIP, true, newlyUnlockedAchievements, achievements);
  
  // Logro: Partida perfecta (sin errores y con aciertos)
  if ((gameData.wrong || 0) === 0 && (gameData.correct || 0) > 0) {
      checkAndUnlock('perfect_game', userIP, true, newlyUnlockedAchievements, achievements);
  }
  
  // Logro: Velocista (menos de 2 minutos y con aciertos)
  if ((gameData.timeUsed || 0) < 120 && (gameData.correct || 0) > 0) {
      checkAndUnlock('speed_demon', userIP, true, newlyUnlockedAchievements, achievements);
  }
  
  // Logro: Ganar partidas (contador)
  if (gameData.victory) {
      checkAndUnlock('five_wins', userIP, true, newlyUnlockedAchievements, achievements);
  }
  
  // Logro: Ganar en dificultad difícil
  if (gameData.victory && gameData.difficulty === 'dificil') {
      checkAndUnlock('hard_mode', userIP, true, newlyUnlockedAchievements, achievements);
  }
  
  // Logro: Sin usar pistas (y con aciertos)
  if ((gameData.hintsUsed || 0) === 0 && (gameData.correct || 0) > 0) {
      checkAndUnlock('no_help', userIP, true, newlyUnlockedAchievements, achievements);
  }
  
  // Logro: Sin pasar preguntas (y con aciertos)
  if ((gameData.skipped || 0) === 0 && (gameData.correct || 0) > 0) {
      checkAndUnlock('no_pass', userIP, true, newlyUnlockedAchievements, achievements);
  }
  
  // Logro: Rey de la remontada
  if (gameData.victory && (gameData.wrong || 0) >= 5) {
      checkAndUnlock('comeback_king', userIP, true, newlyUnlockedAchievements, achievements);
  }
  
  // Logro: Búho nocturno (jugar después de medianoche)
  if (currentHour >= 0 && currentHour < 5) {
      checkAndUnlock('night_owl', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    // VERIFICACIÓN DE NUEVOS LOGROS
    
    // Logros por hora del día
    if (currentHour < 7) {
      checkAndUnlock('early_bird', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    if (currentHour >= 12 && currentHour < 14) {
      checkAndUnlock('lunch_break', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    // Logros por cantidad de partidas
    if (totalGames >= 10) {
      checkAndUnlock('milestone_10', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    if (totalGames >= 50) {
      checkAndUnlock('milestone_50', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    if (totalGames >= 100) {
      checkAndUnlock('milestone_100', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    // Logros de fin de semana
    if (isWeekend) {
      const weekendGames = countWeekendGames(gameHistory);
      if (weekendGames >= 3) {
        checkAndUnlock('weekend_warrior', userIP, true, newlyUnlockedAchievements, achievements);
      }
    }
    
    // Logros por juego actual
    if (gameData.timeRemaining < 10 && gameData.timeRemaining > 0 && gameData.victory) {
      checkAndUnlock('close_call', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    // Logro de remontada definitiva
    if (gameData.victory && (gameData.wrong || 0) >= 8) {
      checkAndUnlock('ultimate_comeback', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    // Logros de puntuación alta en una partida
    if (gameData.score >= 200) {
      checkAndUnlock('high_score_200', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    if (gameData.score >= 300) {
      checkAndUnlock('high_score_300', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    if (gameData.score >= 400) {
      checkAndUnlock('high_score_400', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    // Logros de puntuación acumulada
    if (totalScore >= 1000) {
      checkAndUnlock('score_1000', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    if (totalScore >= 5000) {
      checkAndUnlock('score_5000', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    if (totalScore >= 10000) {
      checkAndUnlock('score_10000', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    // Logro definitivo: sin ayuda en difícil
    if (gameData.victory && gameData.difficulty === 'dificil' && 
        (gameData.hintsUsed || 0) === 0 && (gameData.skipped || 0) === 0) {
      checkAndUnlock('no_help_hard', userIP, true, newlyUnlockedAchievements, achievements);
    }
    
    console.log("Verificación de logros completada. Logros desbloqueados:", newlyUnlockedAchievements.length);
    
    // Si hay logros desbloqueados, mostrarlos uno a uno
    if (newlyUnlockedAchievements.length > 0) {
      // Guardar los logros para mostrarlos después
      localStorage.setItem('newlyUnlockedAchievements', JSON.stringify(newlyUnlockedAchievements));
      // Actualizar la bandera para indicar que hay logros para mostrar
      localStorage.setItem('hasNewAchievements', 'true');
      console.log("Logros guardados para mostrar:", newlyUnlockedAchievements);
    } else {
      // Si no hay logros nuevos, limpiar cualquier dato anterior
      localStorage.removeItem('newlyUnlockedAchievements');
      localStorage.removeItem('hasNewAchievements');
    }
    
    // Actualizar los textos de los botones según los logros encontrados
    updateModalButtonsText(newlyUnlockedAchievements.length > 0);
  });
}

// Funciones auxiliares para verificar logros

// Obtener historial de juegos del jugador
function getPlayerGameHistory(userIP) {
  const historyKey = `gameHistory_${userIP}`;
  try {
    const history = localStorage.getItem(historyKey);
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error("Error al obtener historial de juegos:", e);
    return [];
  }
}

// Calcular puntaje total de todas las partidas
function calculateTotalScore(gameHistory) {
  return gameHistory.reduce((total, game) => {
    return total + (game.score || 0);
  }, 0);
}

// Contar juegos en fin de semana
function countWeekendGames(gameHistory) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return gameHistory.filter(game => {
    if (!game.date) return false;
    const gameDate = new Date(game.date);
    if (gameDate < oneWeekAgo) return false;
    
    const day = gameDate.getDay();
    return day === 0 || day === 6; // 0 es domingo, 6 es sábado
  }).length;
}
