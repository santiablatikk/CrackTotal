const express = require('express');
const router = express.Router();

// Importar controladores
const userController = require('../controllers/userController');
const gameController = require('../controllers/gameController');
const rankingController = require('../controllers/rankingController');
const achievementController = require('../controllers/achievementController');

// Rutas para usuarios
router.post('/users', userController.getOrCreateUser);
router.get('/users/:userId/profile/:gameType', userController.getUserProfile);

// Rutas para juegos
router.get('/games/:gameType/info', gameController.getGameInfo);
router.post('/games', gameController.saveGameData);

// Rutas para ranking
router.get('/games/:gameType/ranking', rankingController.getGlobalRanking);
router.get('/games/:gameType/global-stats', rankingController.getGlobalStats);
router.get('/games/:gameType/top-players', rankingController.getTopPlayers);
router.get('/games/:gameType/ranking/search', rankingController.searchPlayers);

// Rutas para logros
router.get('/games/:gameType/achievements', achievementController.getAllAchievements);
router.get('/users/:userId/achievements/:gameType', achievementController.getUserAchievements);

module.exports = router; 