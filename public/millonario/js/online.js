// online.js

// Configurar logger para evitar loggear en producción
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const logger = {
  log: isProduction ? function(){} : console.log,
  warn: isProduction ? function(){} : console.warn,
  error: console.error // Mantener errores siempre
};

// Conectar con Socket.io
const socket = io();

// Variables para el juego online
let onlineQuestions = [];
let questionIndex = 0;
let onlineScore = 0;
let onlineTimerInterval;
let onlineTimeLeft = 60; // 1 minuto por pregunta
let currentLevel = 1; // Empezamos en nivel 1

// Elementos en online_game.html
const playerDisplayOnline = document.getElementById("player-display-online");
const onlineTimerEl = document.getElementById("online-timer");
const onlineScoreEl = document.getElementById("online-score");
const onlineQuestionTextEl = document.getElementById("online-question-text");
const onlineOptionArea = document.getElementById("online-option-area");
const onlineShowOptionsBtn = document.getElementById("online-show-options-btn");
const floatingMsg = document.getElementById("floating-msg");

// Para formularios de creación/unión
const createRoomSubmit = document.getElementById("create-room-submit");
const roomNameInput = document.getElementById("room-name");
const roomPasswordInput = document.getElementById("room-password");

const joinRoomSubmit = document.getElementById("join-room-submit");
const roomCodeInput = document.getElementById("room-code");
const joinRoomPasswordInput = document.getElementById("join-room-password");

document.addEventListener("DOMContentLoaded", () => {
  const name = sessionStorage.getItem("playerName") || "Jugador";
  if (playerDisplayOnline) {
    playerDisplayOnline.textContent = `Bienvenido, ${name}`;
  }
  loadOnlineQuestions(currentLevel);
});

// Función para cargar preguntas del nivel online
async function loadOnlineQuestions(level) {
  try {
    const res = await fetch(`/api/questionsOnline?level=${level}`);
    const data = await res.json();
    onlineQuestions = data || [];
  } catch (error) {
    if (onlineQuestionTextEl)
      onlineQuestionTextEl.textContent = `Error al cargar preguntas del nivel ${level}.`;
    console.error(error);
  }
}

// En la página de creación de sala:
if (createRoomSubmit) {
  createRoomSubmit.addEventListener("click", () => {
    // Aquí implementarías la lógica para crear la sala vía Socket.io
    // Ya no redirigimos a online_wait.html
    logger.log("Creando sala...");
    // La lógica de espera ahora se maneja dentro de online.html
  });
}

// En la página de unirse a sala:
if (joinRoomSubmit) {
  joinRoomSubmit.addEventListener("click", () => {
    // Implementa la lógica para unirse a una sala vía Socket.io
    logger.log("Uniéndose a sala...");
    // La lógica de espera ahora se maneja dentro de online.html
  });
}

// Funciones para el juego online (en online_game.html)
async function startOnlineGame() {
  questionIndex = 0;
  onlineScore = 0;
  await loadOnlineQuestions(currentLevel);
  showOnlineQuestion();
  startOnlineTimer();
}

function showOnlineQuestion() {
  if (questionIndex >= onlineQuestions.length) {
    endOnlineGame();
    return;
  }
  resetOnlineTimer();
  const currentQ = onlineQuestions[questionIndex];
  onlineQuestionTextEl.textContent = currentQ.pregunta;
  onlineOptionArea.innerHTML = "";
  onlineOptionArea.classList.add("hidden");
  onlineShowOptionsBtn.classList.remove("hidden");
}

if (onlineShowOptionsBtn) {
  onlineShowOptionsBtn.addEventListener("click", () => {
    const currentQ = onlineQuestions[questionIndex];
    let optionsHtml = "";
    for (const key in currentQ.opciones) {
      optionsHtml += `<button class="option-btn" onclick="selectOnlineOption('${key}')">${key}: ${currentQ.opciones[key]}</button>`;
    }
    onlineOptionArea.innerHTML = optionsHtml;
    onlineOptionArea.classList.remove("hidden");
    onlineShowOptionsBtn.classList.add("hidden");
  });
}

function selectOnlineOption(selected) {
  const currentQ = onlineQuestions[questionIndex];
  if (selected === currentQ.respuesta_correcta) {
    onlineScore += (questionIndex < 5 ? 1 : 2);
  }
  onlineScoreEl.textContent = `Puntaje: ${onlineScore}`;
  questionIndex++;
  setTimeout(() => {
    showOnlineQuestion();
  }, 700);
}

function startOnlineTimer() {
  onlineTimerInterval = setInterval(() => {
    onlineTimeLeft--;
    onlineTimerEl.textContent = `Tiempo: ${formatTime(onlineTimeLeft)}`;
    if (onlineTimeLeft <= 0) {
      questionIndex++;
      showOnlineQuestion();
      resetOnlineTimer();
    }
  }, 1000);
}

function resetOnlineTimer() {
  clearInterval(onlineTimerInterval);
  onlineTimeLeft = 60;
  onlineTimerEl.textContent = `Tiempo: ${formatTime(onlineTimeLeft)}`;
  startOnlineTimer();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function endOnlineGame() {
  clearInterval(onlineTimerInterval);
  onlineQuestionTextEl.textContent = `Juego finalizado. Puntaje final: ${onlineScore}`;
}

function showFloatingMsg(message) {
  floatingMsg.textContent = message;
  floatingMsg.classList.remove("hidden");
  setTimeout(() => { floatingMsg.classList.add("hidden"); }, 2000);
}

function normalizeString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
