// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

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
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Servir portal.html como página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "portal.html"));
});

// Datos en memoria para FutbolMillonario
const rooms = new Map();

// Generador de códigos de sala
function generateRoomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Función para transmitir las salas disponibles a todos los clientes
function broadcastAvailableRooms() {
  const availableRooms = [];
    
  rooms.forEach((room, roomId) => {
    // Solo incluir salas que no están en juego y tienen espacio
    if (!room.gameStarted && room.players.length < 2) {
      availableRooms.push({
        id: roomId,
        name: room.name,
        hasPassword: !!room.password,
        playerCount: room.players.length
      });
    }
  });
  
  io.emit('available_rooms', { rooms: availableRooms });
}

// Socket.io para ambos juegos
io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  
  // Eventos para PASALA CHE (Rosco)
  socket.on("playerAnswer", (data) => {
    io.emit("answerResult", data);
  });
  
  // Obtener salas disponibles para Millonario
  socket.on('get_available_rooms', () => {
    const availableRooms = [];
    
    rooms.forEach((room, roomId) => {
      // Solo incluir salas que no están en juego y tienen espacio
      if (!room.gameStarted && room.players.length < 2) {
        availableRooms.push({
          id: roomId,
          name: room.name,
          hasPassword: !!room.password,
          playerCount: room.players.length
        });
      }
    });
    
    socket.emit('available_rooms', { rooms: availableRooms });
  });
  
  // Crear sala para Millonario
  socket.on('create_room', (data) => {
    const { username, roomName, password, forcedRoomId } = data;
    
    // Generar código único
    const roomId = forcedRoomId || generateRoomCode();
    
    // Verificar que el código no exista ya
    if (rooms.has(roomId)) {
      socket.emit('error', { message: 'Ya existe una sala con ese código' });
      return;
    }
    
    // Crear la sala
    const room = {
      id: roomId,
      name: roomName || `Sala de ${username}`,
      password: password || '',
      players: [{
        id: socket.id,
        username,
        isHost: true,
        score: 0
      }],
      gameStarted: false
    };
    
    rooms.set(roomId, room);
    socket.join(roomId);
    
    // Emitir evento de sala creada
    socket.emit('room_created', {
      roomId,
      roomName: room.name
    });
    
    // Actualizar la lista de salas disponibles para todos
    broadcastAvailableRooms();
  });
  
  // Unirse a sala para Millonario
  socket.on('join_room', (data) => {
    const { username, roomId, password } = data;
    
    // Verificar si existe la sala
    if (!rooms.has(roomId)) {
      socket.emit('error', { message: 'No existe una sala con ese código' });
      return;
    }
    
    const room = rooms.get(roomId);
    
    // Verificar si la sala ya está en juego
    if (room.gameStarted) {
      socket.emit('error', { message: 'La partida ya ha comenzado' });
      return;
    }
    
    // Verificar si la sala está llena
    if (room.players.length >= 2) {
      socket.emit('error', { message: 'La sala está llena' });
      return;
    }
    
    // Verificar contraseña
    if (room.password && room.password !== password) {
      socket.emit('error', { message: 'Contraseña incorrecta' });
      return;
    }
    
    // Añadir jugador a la sala
    room.players.push({
      id: socket.id,
      username,
      isHost: false,
      score: 0
    });
    
    socket.join(roomId);
    
    // Emitir evento de unión a sala
    socket.emit('room_joined', {
      roomId,
      players: room.players
    });
    
    // Actualizar jugadores para todos en la sala
    io.to(roomId).emit('players_updated', {
      players: room.players
    });
    
    // Actualizar la lista de salas disponibles para todos
    broadcastAvailableRooms();
  });
  
  // Resto de eventos del Millonario pueden agregarse aquí...
  
  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
    
    // Buscar al jugador en todas las salas y eliminarlo
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const isHost = room.players[playerIndex].isHost;
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          // Si no quedan jugadores, eliminar la sala
          rooms.delete(roomId);
        } else if (isHost && room.players.length > 0) {
          // Si era el host y quedan jugadores, transferir el host
          room.players[0].isHost = true;
          io.to(roomId).emit('host_changed', { 
            newHostId: room.players[0].id,
            newHostName: room.players[0].username 
          });
        }
        
        // Actualizar jugadores para todos en la sala
        io.to(roomId).emit('players_updated', { players: room.players });
        
        // Actualizar la lista de salas disponibles para todos
        broadcastAvailableRooms();
      }
    });
  });
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
