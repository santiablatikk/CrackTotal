// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
// Importación de node-fetch con compatibilidad para ESM y CJS
let fetch;
try {
  // Para Node.js >=18 que tiene fetch nativo
  if (!globalThis.fetch) {
    fetch = require("node-fetch");
  } else {
    fetch = globalThis.fetch;
  }
} catch (error) {
  // Fallback a la versión instalada
  fetch = require("node-fetch");
  console.log("Usando node-fetch importado");
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Servir crack-total.html como página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "crack-total.html"));
});

// Gestión de salas y estado del juego
const rooms = {};
const ROOM_CODE_LENGTH = 6;

// Generar código aleatorio para sala
function generateRoomCode() {
  let code = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  } while (rooms[code]); // Asegurar que el código no exista
  
  return code;
}

// Socket.io para FutbolMillonario
io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  
  // Crear sala
  socket.on("createRoom", ({ username }) => {
    const roomCode = generateRoomCode();
    
    // Crear estructura de sala
    rooms[roomCode] = {
      host: socket.id,
      players: [{
        id: socket.id,
        username,
        isHost: true,
        score: 0,
        errors: 0
      }],
      gameStarted: false,
      currentQuestion: null,
      questions: [],
      currentQuestionIndex: 0
    };
    
    // Unir al socket a la sala
    socket.join(roomCode);
    
    // Guardar datos en el socket
    socket.roomCode = roomCode;
    socket.username = username;
    socket.isHost = true;
    
    // Notificar al cliente
    socket.emit("roomCreated", {
      roomCode,
      players: rooms[roomCode].players,
      isHost: true
    });
    
    console.log(`Sala ${roomCode} creada por ${username}`);
  });
  
  // Unirse a sala
  socket.on("joinRoom", ({ roomCode, username }) => {
    roomCode = roomCode.toUpperCase();
    
    // Verificar si la sala existe
    if (!rooms[roomCode]) {
      return socket.emit("error", { message: "La sala no existe" });
    }
    
    // Verificar si el juego ya comenzó
    if (rooms[roomCode].gameStarted) {
      return socket.emit("error", { message: "El juego ya ha comenzado" });
    }
    
    // Verificar si la sala está llena (máximo 4 jugadores)
    if (rooms[roomCode].players.length >= 4) {
      return socket.emit("error", { message: "La sala está llena" });
    }
    
    // Unir al socket a la sala
    socket.join(roomCode);
    
    // Añadir jugador a la sala
    const newPlayer = {
      id: socket.id,
      username,
      isHost: false,
      score: 0,
      errors: 0
    };
    
    rooms[roomCode].players.push(newPlayer);
    
    // Guardar datos en el socket
    socket.roomCode = roomCode;
    socket.username = username;
    socket.isHost = false;
    
    // Notificar a todos los jugadores en la sala
    io.to(roomCode).emit("playerJoined", {
      players: rooms[roomCode].players,
      newPlayer: newPlayer
    });
    
    // Notificar al jugador que se unió
    socket.emit("roomJoined", {
      roomCode,
      players: rooms[roomCode].players,
      isHost: false
    });
    
    // Mensaje en el chat
    io.to(roomCode).emit("chatMessage", {
      system: true,
      message: `${username} se ha unido a la sala`
    });
    
    console.log(`${username} se unió a la sala ${roomCode}`);
  });
  
  // Iniciar juego
  socket.on("startGame", async () => {
    const roomCode = socket.roomCode;
    
    // Verificar si la sala existe y el usuario es el host
    if (!roomCode || !rooms[roomCode] || rooms[roomCode].host !== socket.id) {
      return socket.emit("error", { message: "No tienes permiso para iniciar el juego" });
    }
    
    try {
      // Cargar preguntas (nivel 1 por defecto)
      const questionsPath = path.join(__dirname, "public", "millonario", "data", "level_1.json");
      const questionsData = fs.readFileSync(questionsPath, "utf8");
      let questions = JSON.parse(questionsData);
      
      // Mezclar preguntas y limitar a 10
      questions = questions.sort(() => 0.5 - Math.random()).slice(0, 10);
      
      // Actualizar estado de la sala
      rooms[roomCode].gameStarted = true;
      rooms[roomCode].questions = questions;
      rooms[roomCode].currentQuestionIndex = 0;
      rooms[roomCode].currentQuestion = questions[0];
      
      // Notificar a todos los jugadores
      io.to(roomCode).emit("gameStarted", {
        question: rooms[roomCode].currentQuestion,
        players: rooms[roomCode].players,
        questionIndex: 0,
        totalQuestions: questions.length
      });
      
      console.log(`Juego iniciado en sala ${roomCode}`);
    } catch (error) {
      console.error("Error al iniciar el juego:", error);
      socket.emit("error", { message: "Error al cargar las preguntas" });
    }
  });
  
  // Respuesta de jugador
  socket.on("playerAnswer", ({ answer }) => {
    const roomCode = socket.roomCode;
    
    // Verificar si la sala existe y el juego ha comenzado
    if (!roomCode || !rooms[roomCode] || !rooms[roomCode].gameStarted) {
      return;
    }
    
    const room = rooms[roomCode];
    const currentQuestion = room.currentQuestion;
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex === -1 || !currentQuestion) return;
    
    // Verificar respuesta
    const isCorrect = answer === currentQuestion.correct;
    
    // Actualizar puntuación
    if (isCorrect) {
      room.players[playerIndex].score += 10;
    } else {
      room.players[playerIndex].errors += 1;
    }
    
    // Notificar a todos los jugadores
    io.to(roomCode).emit("answerResult", {
      playerId: socket.id,
      username: socket.username,
      isCorrect,
      answer,
      correctAnswer: currentQuestion.correct,
      players: room.players
    });
    
    // Comprobar si todos han respondido o si ha pasado el tiempo
    const checkNextQuestion = () => {
      // Si es la última pregunta, finalizar juego
      if (room.currentQuestionIndex >= room.questions.length - 1) {
        io.to(roomCode).emit("gameOver", {
          players: room.players.sort((a, b) => b.score - a.score)
        });
        
        console.log(`Juego finalizado en sala ${roomCode}`);
        return;
      }
      
      // Pasar a la siguiente pregunta
      room.currentQuestionIndex++;
      room.currentQuestion = room.questions[room.currentQuestionIndex];
      
      // Notificar a todos los jugadores
      io.to(roomCode).emit("nextQuestion", {
        question: room.currentQuestion,
        players: room.players,
        questionIndex: room.currentQuestionIndex,
        totalQuestions: room.questions.length
      });
    };
    
    // Después de un tiempo, pasar a la siguiente pregunta
    setTimeout(checkNextQuestion, 3000);
  });
  
  // Chat
  socket.on("chatMessage", ({ message }) => {
    const roomCode = socket.roomCode;
    
    if (!roomCode || !rooms[roomCode]) return;
    
    // Enviar mensaje a todos en la sala
    io.to(roomCode).emit("chatMessage", {
      sender: socket.username,
      message
    });
  });
  
  // Salir de la sala
  socket.on("leaveRoom", () => {
    handleDisconnect();
  });
  
  // Desconexión
  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
    handleDisconnect();
  });
  
  // Manejar desconexión o salida
  function handleDisconnect() {
    const roomCode = socket.roomCode;
    
    if (!roomCode || !rooms[roomCode]) return;
    
    const room = rooms[roomCode];
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex === -1) return;
    
    // Obtener información del jugador antes de eliminarlo
    const player = room.players[playerIndex];
    
    // Eliminar jugador de la sala
    room.players.splice(playerIndex, 1);
    
    // Si no quedan jugadores, eliminar la sala
    if (room.players.length === 0) {
      delete rooms[roomCode];
      console.log(`Sala ${roomCode} eliminada`);
      return;
    }
    
    // Si el host se desconecta, asignar nuevo host
    if (player.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
      room.host = room.players[0].id;
      
      // Notificar al nuevo host
      const newHostSocket = io.sockets.sockets.get(room.host);
      if (newHostSocket) {
        newHostSocket.isHost = true;
      }
    }
    
    // Notificar a los demás jugadores
    io.to(roomCode).emit("playerLeft", {
      playerId: socket.id,
      username: player.username,
      players: room.players
    });
    
    // Mensaje en el chat
    io.to(roomCode).emit("chatMessage", {
      system: true,
      message: `${player.username} ha abandonado la sala`
    });
    
    console.log(`${player.username} salió de la sala ${roomCode}`);
  }
});

// API Routes

// Original PASALA CHE endpoints
app.get("/api/preguntas", (req, res) => {
  try {
    const filePath = path.join(__dirname, "data", "questions.json");
    const rawData = fs.readFileSync(filePath);
    let data = JSON.parse(rawData);
    
    // Filtrar por dificultad si se proporciona
    const dificultad = req.query.dificultad;
    if (dificultad) {
      data = data.filter(item => item.dificultad === dificultad);
    }
    
    res.json({ rosco_futbolero: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// FutbolMillonario endpoints
app.get("/api/questionsLocal", async (req, res) => {
  try {
    const questionsPath = path.join(__dirname, "public", "millonario", "data", "questions.json");
    const data = fs.readFileSync(questionsPath, "utf8");
    if (!data.trim()) {
      throw new Error("El archivo questions.json está vacío");
    }
    const questions = JSON.parse(data);
    console.log("Preguntas local cargadas. Total:", questions.length);
    res.json(questions);
  } catch (error) {
    console.error("Error al cargar questions.json:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/questionsOnline", async (req, res) => {
  try {
    const level = req.query.level; // Ej: '1', '2', ...
    if (!level) {
      return res.status(400).json({ error: "Se requiere parámetro 'level'" });
    }
    const fileName = `level_${level}.json`;
    const questionsPath = path.join(__dirname, "public", "millonario", "data", fileName);
    const data = fs.readFileSync(questionsPath, "utf8");
    const questions = JSON.parse(data);
    console.log(`Preguntas online nivel ${level} cargadas. Total: ${questions.length}`);
    res.json(questions);
  } catch (error) {
    console.error("Error al cargar archivo JSON online:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener datos de ranking
app.get("/api/ranking", (req, res) => {
  try {
    const rankingFile = path.join(__dirname, "data", "ranking.json");
    const rankingData = fs.existsSync(rankingFile) 
      ? JSON.parse(fs.readFileSync(rankingFile)) 
      : [];
    
    res.json({ ranking: rankingData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para guardar partida
app.post("/api/partida", (req, res) => {
  try {
    const gameData = req.body;
    
    if (!gameData || !gameData.player) {
      return res.status(400).json({ error: "Datos de juego inválidos" });
    }
    
    // Aquí se procesaría la lógica para guardar la partida
    console.log("Partida guardada:", gameData);
    
    res.status(201).json({ message: "Juego registrado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
