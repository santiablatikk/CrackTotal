/**
 * Rutas para la gestión de usuarios
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Proteger todas las rutas con middleware de autenticación
router.use(authMiddleware.verifyToken);

// Rutas para perfil de usuario
router.get('/profile/:userId', userController.getUserProfile);
router.put('/profile/:userId', userController.updateUserProfile);

// Rutas para preferencias
router.put('/preferences/:userId', userController.saveUserPreferences);

// Rutas para estadísticas de juego
router.post('/stats/:userId', userController.saveGameStats);

module.exports = router; 