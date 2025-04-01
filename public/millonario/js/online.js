// online.js - Juego multijugador

// Conectar con Socket.io
const socket = io();

// Variables globales
let username;
let roomCode;
let isHost = false;
let gameStarted = false;
let currentQuestion = null;
let selectedAnswer = null;
let timer;
let timerValue = 30;

// Elementos DOM - Secciones principales
const roomSection = document.getElementById("room-section");
const waitingRoom = document.getElementById("waiting-room");
const gameSection = document.getElementById("game-section");

// Elementos DOM - Sala de espera
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const roomCodeInput = document.getElementById("room-code");
const backToNameBtn = document.getElementById("back-to-name-btn");
const roomIdDisplay = document.getElementById("room-id");
const playerCountDisplay = document.getElementById("player-count");
const playersContainer = document.getElementById("players-container");
const startGameBtn = document.getElementById("start-game-btn");
const leaveRoomBtn = document.getElementById("leave-room-btn");
const copyCodeBtn = document.getElementById("copy-code-btn");

// Elementos DOM - Juego
const playerDisplay = document.getElementById("player-display");
const roomDisplay = document.getElementById("room-display");
const playersScore = document.getElementById("players-score");
const errorsDisplay = document.getElementById("errors-display");
const timerBar = document.getElementById("timer-bar");
const timerDisplay = document.getElementById("timer-display");
const questionText = document.getElementById("question-text");
const answersContainer = document.getElementById("answers-container");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendChatBtn = document.getElementById("send-chat-btn");

// Elementos DOM - Modal de resultados
const resultModal = document.getElementById("result-modal");
const resultTitle = document.getElementById("result-title");
const finalRanking = document.getElementById("final-ranking");
const playAgainBtn = document.getElementById("play-again-btn");

// Elemento de notificación
const notification = document.getElementById("notification");

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  // Obtener el nombre de usuario del almacenamiento local
  username = localStorage.getItem("millonarioUsername");
  
  // Si no hay nombre de usuario, redirigir a la página principal
  if (!username) {
    window.location.href = "index.html";
    return;
  }
  
  // Configurar eventos
  setupEventListeners();
});

// Configurar eventos
function setupEventListeners() {
  // Botón para crear sala
  if (createRoomBtn) {
    createRoomBtn.addEventListener("click", () => {
      socket.emit("createRoom", { username });
    });
  }
  
  // Botón para unirse a sala
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener("click", () => {
      const code = roomCodeInput.value.trim();
      if (code.length !== 6) {
        showNotification("El código debe tener 6 caracteres");
        return;
      }
      socket.emit("joinRoom", { roomCode: code, username });
    });
  }
  
  // Botón para volver a la página principal
  if (backToNameBtn) {
    backToNameBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
  
  // Botón para copiar código de sala
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener("click", () => {
      copyToClipboard(roomIdDisplay.textContent);
    });
  }
  
  // Botón para iniciar juego
  if (startGameBtn) {
    startGameBtn.addEventListener("click", () => {
      socket.emit("startGame");
    });
  }
  
  // Botón para salir de la sala
  if (leaveRoomBtn) {
    leaveRoomBtn.addEventListener("click", () => {
      socket.emit("leaveRoom");
      showRoomSection();
    });
  }
  
  // Chat
  if (sendChatBtn && chatInput) {
    sendChatBtn.addEventListener("click", sendChatMessage);
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendChatMessage();
      }
    });
  }
  
  // Botón para jugar de nuevo
  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
      hideResultModal();
      showRoomSection();
    });
  }
  
  // Configurar eventos de Socket.io
  setupSocketEvents();
}

// Configurar eventos de Socket.io
function setupSocketEvents() {
  // Cuando se crea una sala
  socket.on("roomCreated", (data) => {
    roomCode = data.roomCode;
    isHost = data.isHost;
    updateRoomInfo(data);
    showWaitingRoom();
  });
  
  // Cuando se une a una sala
  socket.on("roomJoined", (data) => {
    roomCode = data.roomCode;
    isHost = data.isHost;
    updateRoomInfo(data);
    showWaitingRoom();
  });
  
  // Cuando un jugador se une a la sala
  socket.on("playerJoined", (data) => {
    updateRoomInfo(data);
    if (isHost && data.players.length >= 2) {
      startGameBtn.disabled = false;
    }
  });
  
  // Cuando un jugador abandona la sala
  socket.on("playerLeft", (data) => {
    updateRoomInfo(data);
    if (data.players.length < 2) {
      startGameBtn.disabled = true;
    }
  });
  
  // Cuando comienza el juego
  socket.on("gameStarted", (data) => {
    gameStarted = true;
    currentQuestion = data.question;
    updateGameInfo(data);
    showGameSection();
    startTimer();
  });
  
  // Cuando se recibe el resultado de una respuesta
  socket.on("answerResult", (data) => {
    highlightCorrectAnswer(data.correctAnswer);
    updatePlayerScores(data.players);
    
    if (data.playerId === socket.id) {
      if (data.isCorrect) {
        showNotification("¡Respuesta correcta!");
      } else {
        showNotification("Respuesta incorrecta");
      }
    }
  });
  
  // Cuando pasamos a la siguiente pregunta
  socket.on("nextQuestion", (data) => {
    currentQuestion = data.question;
    updateGameInfo(data);
    resetAnswerButtons();
    startTimer();
  });
  
  // Cuando finaliza el juego
  socket.on("gameOver", (data) => {
    gameStarted = false;
    clearInterval(timer);
    showFinalResults(data.players);
  });
  
  // Mensajes de chat
  socket.on("chatMessage", (data) => {
    addChatMessage(data);
  });
  
  // Mensajes de error
  socket.on("error", (data) => {
    showNotification(data.message);
  });
}

// Funciones auxiliares para la interfaz
function showRoomSection() {
  if (roomSection) roomSection.style.display = "block";
  if (waitingRoom) waitingRoom.style.display = "none";
  if (gameSection) gameSection.style.display = "none";
}

function showWaitingRoom() {
  if (roomSection) roomSection.style.display = "none";
  if (waitingRoom) waitingRoom.style.display = "block";
  if (gameSection) gameSection.style.display = "none";
}

function showGameSection() {
  if (roomSection) roomSection.style.display = "none";
  if (waitingRoom) waitingRoom.style.display = "none";
  if (gameSection) gameSection.style.display = "block";
}

function updateRoomInfo(data) {
  if (roomIdDisplay) roomIdDisplay.textContent = roomCode;
  if (playerCountDisplay) playerCountDisplay.textContent = data.players.length;
  
  // Actualizar lista de jugadores
  if (playersContainer) {
    playersContainer.innerHTML = "";
    
    data.players.forEach(player => {
      const playerItem = document.createElement("li");
      playerItem.textContent = player.username;
      
      if (player.isHost) {
        const hostBadge = document.createElement("span");
        hostBadge.textContent = "Anfitrión";
        hostBadge.className = "host-badge";
        playerItem.appendChild(hostBadge);
      }
      
      playersContainer.appendChild(playerItem);
    });
  }
  
  // Actualizar botón de inicio (solo visible para el anfitrión)
  if (startGameBtn) {
    startGameBtn.disabled = data.players.length < 2;
    startGameBtn.style.display = isHost ? "block" : "none";
  }
}

function updateGameInfo(data) {
  // Mostrar información del jugador y sala
  if (playerDisplay) playerDisplay.textContent = username;
  if (roomDisplay) roomDisplay.textContent = `Sala: ${roomCode}`;
  
  // Actualizar puntuaciones de jugadores
  updatePlayerScores(data.players);
  
  // Actualizar pregunta y opciones
  if (questionText && currentQuestion) {
    questionText.textContent = currentQuestion.question;
    
    if (answersContainer) {
      answersContainer.innerHTML = "";
      
      const options = ["a", "b", "c", "d"];
      options.forEach(option => {
        const button = document.createElement("button");
        button.className = "answer-btn";
        button.dataset.answer = option;
        button.textContent = currentQuestion.options[option];
        button.addEventListener("click", () => selectAnswer(option));
        answersContainer.appendChild(button);
      });
    }
  }
}

function updatePlayerScores(players) {
  if (playersScore) {
    playersScore.innerHTML = "";
    
    players.forEach(player => {
      const scoreItem = document.createElement("div");
      scoreItem.className = "player-score-item";
      
      if (player.id === socket.id) {
        scoreItem.classList.add("current");
      }
      
      scoreItem.textContent = `${player.username}: ${player.score}`;
      playersScore.appendChild(scoreItem);
    });
  }
}

function selectAnswer(answer) {
  if (!gameStarted || !currentQuestion || selectedAnswer) return;
  
  selectedAnswer = answer;
  
  // Deshabilitar todos los botones
  const buttons = answersContainer.querySelectorAll(".answer-btn");
  buttons.forEach(btn => {
    btn.classList.add("disabled");
    btn.disabled = true;
  });
  
  // Marcar la respuesta seleccionada
  const selectedButton = answersContainer.querySelector(`[data-answer="${answer}"]`);
  if (selectedButton) {
    selectedButton.classList.add(answer === currentQuestion.correct ? "correct" : "incorrect");
  }
  
  // Enviar respuesta al servidor
  socket.emit("playerAnswer", { answer });
}

function resetAnswerButtons() {
  selectedAnswer = null;
  
  if (answersContainer) {
    const buttons = answersContainer.querySelectorAll(".answer-btn");
    buttons.forEach(btn => {
      btn.classList.remove("disabled", "correct", "incorrect");
      btn.disabled = false;
    });
  }
}

function highlightCorrectAnswer(correctAnswer) {
  if (!answersContainer) return;
  
  const correctButton = answersContainer.querySelector(`[data-answer="${correctAnswer}"]`);
  if (correctButton) {
    correctButton.classList.add("correct");
  }
}

function startTimer() {
  clearInterval(timer);
  timerValue = 30;
  
  if (timerDisplay) timerDisplay.textContent = `${timerValue}s`;
  if (timerBar) timerBar.style.width = "100%";
  
  timer = setInterval(() => {
    timerValue--;
    
    if (timerDisplay) timerDisplay.textContent = `${timerValue}s`;
    if (timerBar) timerBar.style.width = `${(timerValue / 30) * 100}%`;
    
    if (timerValue <= 0) {
      clearInterval(timer);
      
      // Si no ha seleccionado ninguna respuesta, seleccionar automáticamente una incorrecta
      if (!selectedAnswer) {
        selectAnswer("e"); // Respuesta que no existe, se cuenta como incorrecta
      }
    }
  }, 1000);
}

function showFinalResults(players) {
  if (resultModal && finalRanking) {
    finalRanking.innerHTML = "";
    
    players.forEach((player, index) => {
      const rankItem = document.createElement("div");
      rankItem.className = "rank-item";
      
      const position = document.createElement("div");
      position.className = "rank-position";
      position.textContent = `${index + 1}`;
      
      const name = document.createElement("div");
      name.className = "rank-name";
      name.textContent = player.username;
      
      const score = document.createElement("div");
      score.className = "rank-score";
      score.textContent = `${player.score} puntos`;
      
      rankItem.appendChild(position);
      rankItem.appendChild(name);
      rankItem.appendChild(score);
      
      finalRanking.appendChild(rankItem);
    });
    
    resultModal.style.display = "block";
  }
}

function hideResultModal() {
  if (resultModal) {
    resultModal.style.display = "none";
  }
}

function sendChatMessage() {
  if (!chatInput || !roomCode) return;
  
  const message = chatInput.value.trim();
  if (message.length === 0) return;
  
  socket.emit("chatMessage", { message });
  chatInput.value = "";
}

function addChatMessage(data) {
  if (!chatMessages) return;
  
  const messageElement = document.createElement("div");
  messageElement.className = "chat-message";
  
  if (data.system) {
    messageElement.classList.add("system");
    messageElement.textContent = data.message;
  } else {
    const sender = document.createElement("span");
    sender.className = "sender";
    sender.textContent = data.sender;
    
    messageElement.appendChild(sender);
    messageElement.appendChild(document.createTextNode(`: ${data.message}`));
  }
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showNotification(message) {
  if (!notification) return;
  
  notification.textContent = message;
  notification.style.display = "block";
  
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification("Código copiado al portapapeles");
  }).catch(() => {
    showNotification("No se pudo copiar el código");
  });
}
