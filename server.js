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
  if (!globalThis.fetch) {
    fetch = require("node-fetch");
  } else {
    fetch = globalThis.fetch;
  }
} catch (error) {
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

// Variable global para guardar el ranking real de partidas
// En un entorno real deberías persistir esto en una base de datos.
let rankingData = [];

// Servir portal.html como página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "portal.html"));
});

// ... (Aquí irían tus endpoints y lógica para Millonario y PASALA CHE)

// Ejemplo de endpoint para ranking global
app.get("/api/ranking", (req, res) => {
  // Devolver ranking ordenado de mayor a menor puntuación
  const sortedRanking = rankingData.sort((a, b) => b.score - a.score);
  res.json(sortedRanking);
});

// Endpoint para guardar partida y actualizar ranking en tiempo real
app.post("/api/partida", (req, res) => {
  try {
    const gameData = req.body;
    if (!gameData || !gameData.player || typeof gameData.score !== 'number') {
      return res.status(400).json({ error: "Datos de juego inválidos" });
    }

    // Asignar fecha de la partida si no viene incluida
    if (!gameData.date) {
      gameData.date = new Date().toISOString().split('T')[0];
    }

    // Guardar partida en el ranking
    rankingData.push(gameData);
    console.log("Partida guardada:", gameData);

    // Emitir actualización en tiempo real a todos los clientes conectados
    io.emit('ranking_update', rankingData);

    res.status(201).json({ message: "Juego registrado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.io para otros juegos y eventos
io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  
  // Eventos para PASALA CHE (Rosco)
  socket.on("playerAnswer", (data) => {
    io.emit("answerResult", data);
  });

  // Eventos para Millonario y otros (tu código existente)
  // ...

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
    // Manejo de desconexión en salas, etc.
  });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
