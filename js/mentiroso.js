// mentiroso.js - Lógica para el juego Mentiroso de Crack Total

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// --- Variables Globales ---
const state = {
    localPlayerId: null,
    roomId: null,
    playerName: '',
    role: null, // 'player1', 'player2'
    currentTurn: null,
    gameActive: false,
    players: {
        player1: null,
        player2: null
    },
    roundNumber: 0,
    maxRounds: 6,
    currentChallenge: null,
    declarations: [],
    demonstrationInProgress: false,
    validationInProgress: false,
    demonstrationTimerId: null,
    timerValue: 0,
    timerMaxValue: 0
};

let ws = null; // WebSocket connection

// --- Inicialización ---
function initializeApp() {
    setupEventListeners();
    initializeWebSocket();
    
    // Mostrar instrucciones en primera visita
    if (!localStorage.getItem('mentiroso_instructions_viewed')) {
        showInstructionsModal();
    }
}

// --- Funciones Auxiliares ---
function generateRandomId() {
    return Math.random().toString(36).substring(2, 9);
}

function normalizeText(text) {
    return text.toString().trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .replace(/[^a-z0-9\s]/gi, ''); // Eliminar caracteres especiales
}

// --- Funciones de UI ---
function showLobby() {
    document.getElementById('lobbySection').classList.add('active');
    document.getElementById('gameContentSection').style.display = 'none';
    document.getElementById('playersHeaderInfo').style.display = 'none';
    
    // Limpiar mensaje del lobby
    clearLobbyMessage();
    
    // Re-habilitar botones del lobby
    enableLobbyButtons();
}

function showGameScreen() {
    document.getElementById('lobbySection').classList.remove('active');
    document.getElementById('gameContentSection').style.display = 'block';
    document.getElementById('playersHeaderInfo').style.display = 'flex';
    
    // Actualizar UI del juego
    updateGameUI();
}

// --- Lobby ---
function setupEventListeners() {
    // Botones del lobby
    document.getElementById('createRoomButton').addEventListener('click', handleCreateRoom);
    document.getElementById('joinRoomButton').addEventListener('click', handleJoinRoomById);
    document.getElementById('joinRandomRoomButton').addEventListener('click', handleJoinRandomRoom);
    
    // Controles de declaración
    document.getElementById('decrementDeclare').addEventListener('click', () => {
        const input = document.getElementById('declareAmount');
        if (parseInt(input.value) > parseInt(input.min)) {
            input.value = parseInt(input.value) - 1;
        }
    });
    
    document.getElementById('incrementDeclare').addEventListener('click', () => {
        const input = document.getElementById('declareAmount');
        input.value = parseInt(input.value) + 1;
    });
    
    // Botones de acción durante el juego
    document.getElementById('submitDeclareButton').addEventListener('click', handleSubmitDeclaration);
    document.getElementById('callLiarButton').addEventListener('click', handleCallLiar);
    document.getElementById('acceptDeclareButton').addEventListener('click', handleAcceptDeclaration);
    document.getElementById('submitDemonstrationButton').addEventListener('click', handleSubmitDemonstration);
    document.getElementById('submitValidationButton').addEventListener('click', handleSubmitValidation);
    
    // Modal de fin de juego
    document.getElementById('playAgainButton').addEventListener('click', handlePlayAgain);
    document.getElementById('backToLobbyButton').addEventListener('click', handleBackToLobby);
    
    // Modal de contraseña
    document.getElementById('privateRoomPasswordForm').addEventListener('submit', handleSubmitPasswordModal);
    document.getElementById('cancelPasswordSubmit').addEventListener('click', hidePasswordPromptModal);
    
    // Modal de instrucciones
    document.getElementById('closeInstructionsButton').addEventListener('click', hideInstructionsModal);
    
    // Disponible para clics en la lista de salas
    document.getElementById('availableRoomsList').addEventListener('click', (e) => {
        const joinButton = e.target.closest('.join-room-list-btn');
        if (joinButton) {
            const roomId = joinButton.dataset.roomId;
            const requiresPassword = joinButton.dataset.requiresPassword === 'true';
            handleJoinRoomFromList(roomId, requiresPassword);
        }
    });
}

function handleCreateRoom() {
    const playerName = document.getElementById('createPlayerName').value.trim() || `Jugador_${generateRandomId().substring(0, 4)}`;
    const password = document.getElementById('createRoomPassword').value.trim();
    
    if (playerName.length < 1) {
        showLobbyMessage('Ingresa un nombre válido.', 'error');
        return;
    }
    
    disableLobbyButtons(true, false, false);
    
    state.playerName = playerName;
    
    sendToServer('createMentirosoRoom', {
        playerName: playerName,
        password: password
    });
}

function handleJoinRoomById() {
    const roomId = document.getElementById('joinRoomId').value.trim();
    const password = document.getElementById('joinRoomPassword').value.trim();
    const playerName = document.getElementById('joinPlayerName').value.trim() || `Jugador_${generateRandomId().substring(0, 4)}`;
    
    if (!roomId) {
        showLobbyMessage('Ingresa un ID de sala válido.', 'error');
        return;
    }
    
    if (playerName.length < 1) {
        showLobbyMessage('Ingresa un nombre válido.', 'error');
        return;
    }
    
    disableLobbyButtons(false, true, false);
    
    state.playerName = playerName;
    
    sendToServer('joinMentirosoRoom', {
        roomId: roomId,
        playerName: playerName,
        password: password
    });
}

function handleJoinRandomRoom() {
    const playerName = document.getElementById('joinPlayerName').value.trim() || `Jugador_${generateRandomId().substring(0, 4)}`;
    
    if (playerName.length < 1) {
        showLobbyMessage('Ingresa un nombre válido.', 'error');
        return;
    }
    
    disableLobbyButtons(false, false, true);
    
    state.playerName = playerName;
    
    sendToServer('joinRandomRoom', {
        playerName: playerName,
        gameType: 'mentiroso'
    });
}

function handleJoinRoomFromList(roomId, requiresPassword) {
    if (requiresPassword) {
        showPasswordPromptModal(roomId);
        return;
    }
    
    const playerName = document.getElementById('joinPlayerName').value.trim() || `Jugador_${generateRandomId().substring(0, 4)}`;
    state.playerName = playerName;
    
    disableLobbyButtons(false, false, false);
    document.querySelectorAll('.join-room-list-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    sendToServer('joinMentirosoRoom', {
        roomId: roomId,
        playerName: playerName,
        password: ''
    });
}

function showLobbyMessage(message, type = 'info', persistent = false) {
    const messageArea = document.getElementById('lobbyMessageArea');
    messageArea.textContent = message;
    messageArea.className = `lobby-message ${type}`;
    messageArea.style.display = 'block';
    
    if (!persistent) {
        setTimeout(() => {
            clearLobbyMessage();
        }, 5000);
    }
}

function clearLobbyMessage() {
    const messageArea = document.getElementById('lobbyMessageArea');
    messageArea.textContent = '';
    messageArea.className = 'lobby-message';
    messageArea.style.display = 'none';
}

function disableLobbyButtons(spinCreate = false, spinJoinId = false, spinJoinRandom = false) {
    const createButton = document.getElementById('createRoomButton');
    const joinIdButton = document.getElementById('joinRoomButton');
    const joinRandomButton = document.getElementById('joinRandomRoomButton');
    
    createButton.disabled = true;
    joinIdButton.disabled = true;
    joinRandomButton.disabled = true;
    
    if (spinCreate) createButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
    if (spinJoinId) joinIdButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uniéndose...';
    if (spinJoinRandom) joinRandomButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
}

function enableLobbyButtons() {
    const createButton = document.getElementById('createRoomButton');
    const joinIdButton = document.getElementById('joinRoomButton');
    const joinRandomButton = document.getElementById('joinRandomRoomButton');
    
    createButton.disabled = false;
    joinIdButton.disabled = false;
    joinRandomButton.disabled = false;
    
    createButton.innerHTML = 'Crear Sala';
    joinIdButton.innerHTML = 'Unirse por ID';
    joinRandomButton.innerHTML = 'Buscar Sala Aleatoria';
    
    document.querySelectorAll('.join-room-list-btn').forEach(btn => {
        btn.disabled = false;
    });
}

// --- Gestión del Juego ---
function updateGameUI() {
    updatePlayersInfo();
    updateTurnIndicator();
    updateRoundCounter();

    // Ocultar todas las áreas de acción
    hideAllActionAreas();
    
    // Mostrar área relevante según el estado del juego
    if (state.demonstrationInProgress) {
        if (state.localPlayerId === state.demonstrationState?.demonstratorId) {
            showDemonstrationArea();
        } else {
            showWaitingArea('Esperando la demostración del oponente...');
        }
    } else if (state.validationInProgress) {
        if (state.localPlayerId === state.validationState?.challengerId) {
            showValidationArea();
        } else {
            showWaitingArea('Esperando la validación del retador...');
        }
    } else if (state.currentTurn === state.localPlayerId) {
        // Mi turno
        if (state.declarations.length === 0 || state.declarations[state.declarations.length - 1].playerId !== state.localPlayerId) {
            showDeclareArea();
        } else {
            // No debería llegar aquí normalmente
            showWaitingArea('Esperando al oponente...');
        }
    } else {
        // Turno del oponente
        if (state.declarations.length > 0 && state.declarations[state.declarations.length - 1].playerId !== state.localPlayerId) {
            showRespondArea();
        } else {
            showWaitingArea('Esperando la declaración del oponente...');
        }
    }
}

function updatePlayersInfo() {
    const player1Info = state.players.player1;
    const player2Info = state.players.player2;
    
    if (!player1Info || !player2Info) return;
    
    // Determinar cuál es el jugador local y el oponente
    const localPlayerInfo = state.localPlayerId === player1Info.id ? player1Info : player2Info;
    const opponentInfo = state.localPlayerId === player1Info.id ? player2Info : player1Info;
    
    // Actualizar información en el header
    document.getElementById('player1Name').textContent = localPlayerInfo.name;
    document.getElementById('player1Score').textContent = `Puntos: ${localPlayerInfo.score}`;
    
    document.getElementById('player2Name').textContent = opponentInfo.name;
    document.getElementById('player2Score').textContent = `Puntos: ${opponentInfo.score}`;
}

function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turnIndicator');
    
    if (!state.currentTurn) {
        turnIndicator.textContent = 'Esperando...';
        return;
    }
    
    const isMyTurn = state.currentTurn === state.localPlayerId;
    const player1Info = state.players.player1;
    const player2Info = state.players.player2;
    
    if (!player1Info || !player2Info) return;
    
    const currentPlayerName = state.currentTurn === player1Info.id ? player1Info.name : player2Info.name;
    
    turnIndicator.textContent = isMyTurn ? 'Tu turno' : `Turno de: ${currentPlayerName}`;
    
    if (isMyTurn) {
        turnIndicator.classList.add('my-turn');
    } else {
        turnIndicator.classList.remove('my-turn');
    }
}

function updateRoundCounter() {
    document.getElementById('roundCounter').textContent = `Ronda ${state.roundNumber}/${state.maxRounds}`;
}

function updateDeclarationsList() {
    const declarationsLog = document.getElementById('declarationsLogList');
    
    if (state.declarations.length === 0) {
        declarationsLog.innerHTML = '<li class="no-declarations">Esperando primera declaración...</li>';
        return;
    }
    
    declarationsLog.innerHTML = '';
    
    state.declarations.forEach(declaration => {
        const li = document.createElement('li');
        
        const playerSpan = document.createElement('span');
        playerSpan.className = 'player-tag';
        playerSpan.textContent = declaration.player;
        
        const declarationText = document.createElement('span');
        declarationText.textContent = ': Puedo nombrar ';
        
        const amountSpan = document.createElement('span');
        amountSpan.className = 'amount-tag';
        amountSpan.textContent = `${declaration.amount}`;
        
        li.appendChild(playerSpan);
        li.appendChild(declarationText);
        li.appendChild(amountSpan);
        
        // Si es la última declaración, marcarla como current
        if (declaration === state.declarations[state.declarations.length - 1]) {
            li.classList.add('current');
        }
        
        declarationsLog.appendChild(li);
    });
}

function updateChallengeText() {
    const challengeTextElement = document.getElementById('challengeText');
    
    if (!state.currentChallenge) {
        challengeTextElement.textContent = 'Cargando desafío...';
        return;
    }
    
    // Obtener texto con el marcador "X" reemplazado por "_"
    challengeTextElement.textContent = state.currentChallenge.text;
}

// --- Áreas de acción ---
function hideAllActionAreas() {
    document.getElementById('declareArea').classList.remove('active');
    document.getElementById('respondArea').classList.remove('active');
    document.getElementById('demonstrationArea').classList.remove('active');
    document.getElementById('validationArea').classList.remove('active');
    document.getElementById('waitingArea').classList.remove('active');
}

function showDeclareArea() {
    hideAllActionAreas();
    
    const declareArea = document.getElementById('declareArea');
    const lastDeclaration = state.declarations.length > 0 ? state.declarations[state.declarations.length - 1] : null;
    
    // Si hay una declaración previa, establecer min y value
    const declareInput = document.getElementById('declareAmount');
    
    if (lastDeclaration) {
        declareInput.min = lastDeclaration.amount + 1;
        declareInput.value = lastDeclaration.amount + 1;
    } else {
        declareInput.min = 1;
        declareInput.value = 1;
    }
    
    declareArea.classList.add('active');
}

function showRespondArea() {
    hideAllActionAreas();
    document.getElementById('respondArea').classList.add('active');
}

function showDemonstrationArea() {
    hideAllActionAreas();
    
    const demonstrationArea = document.getElementById('demonstrationArea');
    const demonstrationCount = document.getElementById('demonstrationCount');
    const listChallengeInputs = document.getElementById('listChallengeInputs');
    const structuredChallengeInputs = document.getElementById('structuredChallengeInputs');
    
    // Actualizar contador
    demonstrationCount.textContent = state.demonstrationState.declaredAmount;
    
    // Configurar el área según el tipo de desafío
    if (state.demonstrationState.challengeData.type === 'list') {
        listChallengeInputs.style.display = 'block';
        structuredChallengeInputs.style.display = 'none';
    } else if (state.demonstrationState.challengeData.type === 'structured') {
        listChallengeInputs.style.display = 'none';
        structuredChallengeInputs.style.display = 'block';
        
        // Generar campos para respuestas estructuradas
        generateStructuredInputs();
    }
    
    demonstrationArea.classList.add('active');
    
    // Iniciar el timer
    startDemonstrationTimer(state.demonstrationState.timeLimit);
}

function generateStructuredInputs() {
    const container = document.getElementById('structuredChallengeInputs');
    container.innerHTML = '';
    
    const questions = state.demonstrationState.challengeData.data.questions.slice(0, state.demonstrationState.declaredAmount);
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'structured-question';
        
        const questionLabel = document.createElement('label');
        questionLabel.htmlFor = `question_${index}`;
        questionLabel.textContent = `${index + 1}. ${question.text}`;
        
        const inputArea = document.createElement('div');
        
        if (question.type === 'VF') {
            // Verdadero/Falso
            const radioGroup = document.createElement('div');
            radioGroup.className = 'radio-group';
            
            const trueOption = createRadioOption(`question_${index}`, question.q_id, 'verdadero', 'Verdadero');
            const falseOption = createRadioOption(`question_${index}`, question.q_id, 'falso', 'Falso');
            
            radioGroup.appendChild(trueOption);
            radioGroup.appendChild(falseOption);
            
            inputArea.appendChild(radioGroup);
        } else if (question.type === 'MC') {
            // Multiple choice
            const selectElement = document.createElement('select');
            selectElement.id = `question_${index}`;
            selectElement.className = 'structured-select';
            selectElement.dataset.questionId = question.q_id;
            
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Selecciona una opción';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            
            selectElement.appendChild(defaultOption);
            
            question.options.forEach((option, optIndex) => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                
                selectElement.appendChild(optionElement);
            });
            
            inputArea.appendChild(selectElement);
        }
        
        questionDiv.appendChild(questionLabel);
        questionDiv.appendChild(inputArea);
        
        container.appendChild(questionDiv);
    });
}

function createRadioOption(name, questionId, value, label) {
    const wrapper = document.createElement('div');
    wrapper.className = 'radio-option';
    
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.id = `${name}_${value}`;
    input.value = value;
    input.dataset.questionId = questionId;
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = `${name}_${value}`;
    labelElement.textContent = label;
    
    wrapper.appendChild(input);
    wrapper.appendChild(labelElement);
    
    return wrapper;
}

function showValidationArea() {
    hideAllActionAreas();
    
    const validationArea = document.getElementById('validationArea');
    const validationList = document.getElementById('validationList');
    
    // Limpiar lista y llenarla con respuestas para validar
    validationList.innerHTML = '';
    
    state.demonstrationAnswers.forEach((answer, index) => {
        const item = document.createElement('div');
        item.className = 'validation-item';
        
        const text = document.createElement('div');
        text.className = 'validation-text';
        text.textContent = `${index + 1}. ${answer}`;
        
        const controls = document.createElement('div');
        controls.className = 'validation-controls';
        
        const validBtn = document.createElement('button');
        validBtn.className = 'validation-btn valid';
        validBtn.innerHTML = '<i class="fas fa-check"></i>';
        validBtn.onclick = () => {
            toggleValidation(item, true);
        };
        
        const invalidBtn = document.createElement('button');
        invalidBtn.className = 'validation-btn invalid';
        invalidBtn.innerHTML = '<i class="fas fa-times"></i>';
        invalidBtn.onclick = () => {
            toggleValidation(item, false);
        };
        
        controls.appendChild(validBtn);
        controls.appendChild(invalidBtn);
        
        item.appendChild(text);
        item.appendChild(controls);
        item.dataset.index = index;
        
        validationList.appendChild(item);
    });
    
    validationArea.classList.add('active');
}

function toggleValidation(item, isValid) {
    const validBtn = item.querySelector('.validation-btn.valid');
    const invalidBtn = item.querySelector('.validation-btn.invalid');
    
    if (isValid) {
        validBtn.classList.add('selected');
        invalidBtn.classList.remove('selected');
        item.dataset.valid = 'true';
    } else {
        validBtn.classList.remove('selected');
        invalidBtn.classList.add('selected');
        item.dataset.valid = 'false';
    }
}

function showWaitingArea(message = 'Esperando al oponente...') {
    hideAllActionAreas();
    
    const waitingArea = document.getElementById('waitingArea');
    const waitingMessage = document.getElementById('waitingMessage');
    
    waitingMessage.textContent = message;
    waitingArea.classList.add('active');
}

// --- Timer Management ---
function startDemonstrationTimer(seconds) {
    const timerBar = document.getElementById('demonstrationTimerBar');
    const timerCount = document.getElementById('demonstrationTimerCount');
    
    // Detener timer existente si hay
    if (state.demonstrationTimerId) {
        clearInterval(state.demonstrationTimerId);
    }
    
    // Configurar valor inicial
    state.timerValue = seconds;
    state.timerMaxValue = seconds;
    
    // Actualizar UI
    timerBar.style.width = '100%';
    timerCount.textContent = seconds;
    
    // Iniciar timer
    state.demonstrationTimerId = setInterval(() => {
        state.timerValue--;
        
        // Actualizar UI
        const percent = (state.timerValue / state.timerMaxValue) * 100;
        timerBar.style.width = `${percent}%`;
        timerCount.textContent = state.timerValue;
        
        // Verificar si se acabó el tiempo
        if (state.timerValue <= 0) {
            clearInterval(state.demonstrationTimerId);
            handleTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (state.demonstrationTimerId) {
        clearInterval(state.demonstrationTimerId);
        state.demonstrationTimerId = null;
    }
}

function handleTimeUp() {
    // Auto-enviar respuestas actuales si es el demostrador
    if (state.demonstrationInProgress && state.localPlayerId === state.demonstrationState.demonstratorId) {
        handleSubmitDemonstration();
    }
}

// --- Acciones de Juego ---
function handleSubmitDeclaration() {
    const declareAmount = parseInt(document.getElementById('declareAmount').value);
    
    if (isNaN(declareAmount) || declareAmount < 1) {
        showError('Ingresa una cantidad válida.');
        return;
    }
    
    // Si hay una declaración previa, verificar que sea mayor
    const lastDeclaration = state.declarations.length > 0 ? state.declarations[state.declarations.length - 1] : null;
    if (lastDeclaration && declareAmount <= lastDeclaration.amount) {
        showError('La cantidad debe ser mayor que la declaración anterior.');
        return;
    }
    
    // Deshabilitar botón para evitar doble envío
    document.getElementById('submitDeclareButton').disabled = true;
    
    // Enviar al servidor
    sendToServer('mentirosoDeclare', {
        amount: declareAmount
    });
    
    // Mostrar área de espera
    showWaitingArea();
}

function handleAcceptDeclaration() {
    // Mostrar área de declaración
    showDeclareArea();
}

function handleCallLiar() {
    // Deshabilitar botón para evitar doble click
    document.getElementById('callLiarButton').disabled = true;
    
    // Enviar al servidor
    sendToServer('mentirosoCallLiar', {});
    
    // Mostrar área de espera
    showWaitingArea('Retaste al oponente. Esperando su demostración...');
}

function handleSubmitDemonstration() {
    stopTimer();
    
    let answers = [];
    
    if (state.demonstrationState.challengeData.type === 'list') {
        // Obtener respuestas del textarea y dividirlas
        const answersText = document.getElementById('demonstrationAnswers').value;
        answers = answersText.split(',')
            .map(answer => answer.trim())
            .filter(answer => answer.length > 0);
    } else if (state.demonstrationState.challengeData.type === 'structured') {
        // Obtener respuestas de inputs estructurados
        if (state.demonstrationState.challengeData.data.questions[0].type === 'VF') {
            // Verdadero/Falso
            const radioInputs = document.querySelectorAll('#structuredChallengeInputs input[type="radio"]:checked');
            
            radioInputs.forEach(input => {
                answers.push({
                    question_id: input.dataset.questionId,
                    user_answer: input.value
                });
            });
        } else if (state.demonstrationState.challengeData.data.questions[0].type === 'MC') {
            // Multiple choice
            const selects = document.querySelectorAll('#structuredChallengeInputs select');
            
            selects.forEach(select => {
                if (select.value) {
                    answers.push({
                        question_id: select.dataset.questionId,
                        user_answer: select.value
                    });
                }
            });
        }
    }
    
    // Verificar que haya suficientes respuestas
    if (answers.length < state.demonstrationState.declaredAmount) {
        showError(`Debes proporcionar ${state.demonstrationState.declaredAmount} respuestas.`);
        startDemonstrationTimer(state.timerValue); // Reiniciar el timer con el tiempo restante
        return;
    }
    
    // Deshabilitar botón para evitar doble envío
    document.getElementById('submitDemonstrationButton').disabled = true;
    
    // Enviar al servidor
    sendToServer('mentirosoSubmitDemonstration', {
        answers: answers
    });
    
    // Mostrar área de espera
    showWaitingArea('Enviando demostración...');
}

function handleSubmitValidation() {
    const validationItems = document.querySelectorAll('.validation-item');
    const validations = [];
    
    validationItems.forEach(item => {
        validations.push(item.dataset.valid === 'true');
    });
    
    // Verificar que todas las respuestas hayan sido validadas
    if (validations.length !== state.demonstrationAnswers.length) {
        showError('Debes validar todas las respuestas.');
        return;
    }
    
    // Deshabilitar botón para evitar doble envío
    document.getElementById('submitValidationButton').disabled = true;
    
    // Enviar al servidor
    sendToServer('mentirosoSubmitValidation', {
        validations: validations
    });
    
    // Mostrar área de espera
    showWaitingArea('Enviando validación...');
}

// --- Modales ---
function showPasswordPromptModal(roomId) {
    const modal = document.getElementById('privateRoomPasswordModal');
    const modalText = document.getElementById('passwordModalText');
    const form = document.getElementById('privateRoomPasswordForm');
    
    modalText.textContent = `La sala '${roomId}' es privada. Por favor, ingresá la contraseña:`;
    form.dataset.roomId = roomId;
    
    // Limpiar mensaje de error previo
    document.getElementById('passwordErrorText').style.display = 'none';
    
    // Limpiar input
    document.getElementById('passwordModalInput').value = '';
    
    modal.style.display = 'flex';
    document.getElementById('passwordModalInput').focus();
}

function hidePasswordPromptModal() {
    document.getElementById('privateRoomPasswordModal').style.display = 'none';
}

function handleSubmitPasswordModal(event) {
    event.preventDefault();
    
    const roomId = event.target.dataset.roomId;
    const password = document.getElementById('passwordModalInput').value;
    const playerName = document.getElementById('joinPlayerName').value.trim() || `Jugador_${generateRandomId().substring(0, 4)}`;
    
    if (!password) {
        const errorText = document.getElementById('passwordErrorText');
        errorText.textContent = 'Debes ingresar una contraseña.';
        errorText.style.display = 'block';
        return;
    }
    
    state.playerName = playerName;
    
    hidePasswordPromptModal();
    disableLobbyButtons();
    
    sendToServer('joinMentirosoRoom', {
        roomId: roomId,
        playerName: playerName,
        password: password
    });
}

function showInstructionsModal() {
    document.getElementById('instructionsModal').style.display = 'flex';
}

function hideInstructionsModal() {
    document.getElementById('instructionsModal').style.display = 'none';
    localStorage.setItem('mentiroso_instructions_viewed', 'true');
}

function showGameResultModal(payload) {
    const modal = document.getElementById('gameResultModal');
    const title = document.getElementById('resultTitle');
    const message = document.getElementById('resultMessage');
    const stats = document.getElementById('resultStats');
    
    // Configurar título y mensaje
    if (payload.draw) {
        title.textContent = '¡Empate!';
        message.textContent = `${payload.reason || 'El juego terminó en empate.'}`;
    } else if (payload.winnerId === state.localPlayerId) {
        title.textContent = '¡Victoria!';
        message.textContent = `${payload.reason || '¡Ganaste el juego!'}`;
    } else {
        title.textContent = 'Derrota';
        message.textContent = `${payload.reason || 'Tu oponente ganó el juego.'}`;
    }
    
    // Mostrar estadísticas
    stats.innerHTML = '';
    
    // Obtener info de jugadores
    const player1 = state.players.player1;
    const player2 = state.players.player2;
    
    if (player1 && player2) {
        const p1Stat = document.createElement('div');
        p1Stat.className = 'stat-item player1-score';
        p1Stat.innerHTML = `
            <span class="stat-label">${player1.name}</span>
            <span class="stat-value">${player1.score} pts</span>
        `;
        
        const p2Stat = document.createElement('div');
        p2Stat.className = 'stat-item player2-score';
        p2Stat.innerHTML = `
            <span class="stat-label">${player2.name}</span>
            <span class="stat-value">${player2.score} pts</span>
        `;
        
        stats.appendChild(p1Stat);
        stats.appendChild(p2Stat);
    }
    
    modal.style.display = 'flex';
}

function hideGameResultModal() {
    document.getElementById('gameResultModal').style.display = 'none';
}

function handlePlayAgain() {
    hideGameResultModal();
    // Reinicio manual en este nivel: simplemente recargamos la página
    window.location.reload();
}

function handleBackToLobby() {
    hideGameResultModal();
    showLobby();
}

function showError(message) {
    console.error('Error:', message);
    alert(message);
}

// --- WebSocket y Comunicación ---
function initializeWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '8081'; // Puerto del servidor WebSocket
    const wsUrl = `${protocol}//${host}:${port}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Conexión WebSocket establecida');
    };
    
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        } catch (error) {
            console.error('Error al parsear mensaje:', error);
        }
    };
    
    ws.onclose = () => {
        console.log('Conexión WebSocket cerrada');
        // Intentar reconectar después de un tiempo
        setTimeout(() => {
            console.log('Intentando reconectar...');
            initializeWebSocket();
        }, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
    };
}

function sendToServer(type, payload = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            type: type,
            payload: payload
        };
        ws.send(JSON.stringify(message));
    } else {
        console.error('WebSocket no está conectado');
        showError('Error de conexión. Intenta recargar la página.');
    }
}

function handleServerMessage(message) {
    console.log('Mensaje recibido:', message);
    
    switch (message.type) {
        case 'yourInfo':
            state.localPlayerId = message.payload.playerId;
            break;
            
        case 'availableRooms':
            renderAvailableRooms(message.payload.rooms);
            break;
            
        case 'mentirosoRoomCreated':
            handleRoomCreated(message.payload);
            break;
            
        case 'mentirosoJoinSuccess':
            handleJoinSuccess(message.payload);
            break;
            
        case 'mentirosoPlayerJoined':
            handlePlayerJoined(message.payload);
            break;
            
        case 'joinError':
            handleJoinError(message.payload);
            break;
            
        case 'mentirosoNewRound':
            handleNewRound(message.payload);
            break;
            
        case 'mentirosoDeclarationUpdate':
            handleDeclarationUpdate(message.payload);
            break;
            
        case 'mentirosoDemonstrationRequired':
            handleDemonstrationRequired(message.payload);
            break;
            
        case 'mentirosoDemonstrationWait':
            handleDemonstrationWait(message.payload);
            break;
            
        case 'mentirosoRoundResult':
            handleRoundResult(message.payload);
            break;
            
        case 'mentirosoGameOver':
            handleGameOver(message.payload);
            break;
            
        case 'errorMessage':
            showError(message.payload.error);
            break;
            
        default:
            console.log('Mensaje no manejado:', message.type);
    }
}

// --- Manejo de Mensajes del Servidor ---
function handleRoomCreated(payload) {
    state.roomId = payload.roomId;
    state.role = 'player1';
    
    showLobbyMessage(`Sala creada con éxito. ID: ${payload.roomId}. Esperando a otro jugador...`, 'success', true);
    enableLobbyButtons();
}

function handleJoinSuccess(payload) {
    state.roomId = payload.roomId;
    state.role = 'player2';
    state.players = payload.players;
    
    // Ir directamente a la pantalla de juego
    showGameScreen();
}

function handlePlayerJoined(payload) {
    state.players = payload.players;
    
    // Si soy el player1, ir a la pantalla de juego
    if (state.role === 'player1') {
        showGameScreen();
    }
}

function handleJoinError(payload) {
    showLobbyMessage(payload.error, 'error');
    enableLobbyButtons();
}

function handleNewRound(payload) {
    // Actualizar estado
    state.roundNumber = payload.roundNumber;
    state.maxRounds = payload.maxRounds;
    state.currentTurn = payload.currentTurn;
    state.currentChallenge = payload.challenge;
    state.declarations = [];
    state.demonstrationInProgress = false;
    state.validationInProgress = false;
    
    // Limpiar estados de demostración
    state.demonstrationState = null;
    state.validationState = null;
    
    // Actualizar UI
    updateGameUI();
    updateChallengeText();
    updateDeclarationsList();
}

function handleDeclarationUpdate(payload) {
    // Actualizar estado
    state.currentTurn = payload.currentTurn;
    state.declarations = payload.declarationsLog;
    state.players = payload.players;
    
    // Actualizar UI
    updateGameUI();
    updateDeclarationsList();
    updatePlayersInfo();
}

function handleDemonstrationRequired(payload) {
    // Soy el demostrador
    state.demonstrationInProgress = true;
    state.demonstrationState = {
        demonstratorId: payload.demonstratorId,
        challengerId: payload.challengerId,
        declaredAmount: payload.declaredAmount,
        challengeData: payload.challenge,
        timeLimit: payload.timeLimit
    };
    
    // Actualizar UI
    updateGameUI();
}

function handleDemonstrationWait(payload) {
    // Soy el retador/espectador
    state.demonstrationInProgress = true;
    // Solo guardar info básica ya que no soy el demostrador
    state.demonstrationState = {
        demonstratorId: payload.demonstratorId,
        challengerId: payload.challengerId,
        declaredAmount: payload.declaredAmount
    };
    
    // Actualizar UI
    updateGameUI();
}

function handleRoundResult(payload) {
    stopTimer(); // Por si hay un timer activo

    state.demonstrationInProgress = false;
    state.validationInProgress = false;
    
    // Actualizar puntuaciones
    if (state.players && payload.players) {
        state.players = payload.players;
    }
    
    // Mostrar resultado de la ronda
    showRoundResult(payload);
}

function handleGameOver(payload) {
    state.gameActive = false;
    
    // Actualizar puntuaciones finales
    if (payload.finalScores) {
        if (state.players.player1) state.players.player1.score = payload.finalScores.player1?.score || 0;
        if (state.players.player2) state.players.player2.score = payload.finalScores.player2?.score || 0;
    }
    
    // Mostrar modal de fin de juego
    showGameResultModal(payload);
}

function renderAvailableRooms(rooms) {
    const roomsList = document.getElementById('availableRoomsList');
    
    // Filtrar solo salas de tipo "mentiroso"
    const mentirosoRooms = rooms.filter(room => room.gameType === 'mentiroso');
    
    if (mentirosoRooms.length === 0) {
        roomsList.innerHTML = '<li class="no-rooms-message">No hay salas de Mentiroso disponibles. ¡Crea una!</li>';
        return;
    }
    
    roomsList.innerHTML = '';
    
    mentirosoRooms.forEach(room => {
        const roomItem = document.createElement('li');
        roomItem.className = 'room-item';
        
        const roomInfo = document.createElement('div');
        roomInfo.className = 'room-info';
        
        const roomName = document.createElement('span');
        roomName.innerHTML = `Sala: <strong>${room.id}</strong>`;
        
        const playerCount = document.createElement('span');
        playerCount.innerHTML = `<strong>${room.playerCount}/${room.maxPlayers}</strong> jugadores`;
        
        roomInfo.appendChild(roomName);
        
        if (room.requiresPassword) {
            const passwordIcon = document.createElement('span');
            passwordIcon.innerHTML = '<i class="fas fa-lock" title="Requiere contraseña"></i>';
            roomInfo.appendChild(passwordIcon);
        }
        
        roomInfo.appendChild(playerCount);
        
        const joinButton = document.createElement('button');
        joinButton.className = 'join-room-list-btn';
        joinButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Unirse';
        joinButton.dataset.roomId = room.id;
        joinButton.dataset.requiresPassword = room.requiresPassword;
        
        roomItem.appendChild(roomInfo);
        roomItem.appendChild(joinButton);
        
        roomsList.appendChild(roomItem);
    });
}

function showRoundResult(payload) {
    const resultArea = document.getElementById('roundResultArea');
    
    // Construir contenido
    let html = `
        <h3 class="round-result-title">Resultado de la Ronda ${payload.roundNumber}</h3>
        <div class="round-winner">${payload.roundWinnerName} gana esta ronda</div>
        <div class="round-reason">${payload.reason}</div>
    `;
    
    // Si hay respuestas correctas para mostrar
    if (payload.wasSuccessfulDemonstration && payload.actualCorrectAnswers > 0) {
        html += `
            <div class="correct-answers-display">
                <h4>Respuestas correctas (${payload.actualCorrectAnswers}/${payload.declaredAmount}):</h4>
                <ul class="answers-list">
        `;
        
        // Esto es un placeholder - en la implementación real, habría que pasar las respuestas correctas
        for (let i = 0; i < payload.actualCorrectAnswers; i++) {
            html += `<li>Respuesta ${i+1}</li>`;
        }
        
        html += `
                </ul>
            </div>
        `;
    }
    
    // Botón para continuar
    html += `
        <button id="nextRoundButton" class="next-round-btn">
            <i class="fas fa-arrow-right"></i>
            Continuar
        </button>
    `;
    
    // Actualizar contenido y mostrar
    resultArea.innerHTML = html;
    resultArea.classList.add('active');
    
    // Agregar evento al botón
    document.getElementById('nextRoundButton').addEventListener('click', () => {
        resultArea.classList.remove('active');
        updateGameUI(); // Refrescar UI para mostrar espera de nuevo turno
    });
} 