const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const routes = require('./routes');
require('dotenv').config();

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Parsear JSON en las solicitudes
app.use(express.urlencoded({ extended: true })); // Parsear URL-encoded en las solicitudes

// Configurar rutas
app.use('/api', routes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de CrackTotal funcionando correctamente' });
});

// Iniciar el servidor
async function startServer() {
  try {
    // Probar la conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Error al conectar a la base de datos. El servidor no se iniciará.');
      process.exit(1);
    }
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer(); 