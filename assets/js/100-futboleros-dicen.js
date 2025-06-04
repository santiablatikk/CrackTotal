// 100 Futboleros Dicen - Game Logic with Firebase Integration
console.log('100 Futboleros Dicen script loaded!');

class FutbolerosDicenGame {
    constructor() {
        this.firebase = null; // Will be initialized dynamically
        this.gameState = {
            currentSection: 'lobby',
            roomId: null,
            playerId: null,
            playerName: '',
            isHost: false,
            players: [],
            gamePhase: 'waiting',
            currentRound: 1,
            maxRounds: 5,
            currentQuestion: null,
            currentPlayerIndex: 0,
            teamAScore: 0,
            teamBScore: 0,
            roundScore: 0,
            strikes: 0,
            maxStrikes: 3,
            turnTimeLimit: 30,
            currentTimer: 30,
            answers: [],
            revealedAnswers: [],
            isOnline: false
        };

        this.questions = [
            {
                question: "Nombre un jugador argentino que haya ganado el Balón de Oro",
                answers: [
                    { text: "MESSI", points: 100 },
                    { text: "MARADONA", points: 80 },
                    { text: "DI STEFANO", points: 60 },
                    { text: "KEMPES", points: 40 },
                    { text: "SIVORI", points: 20 }
                ]
            },
            {
                question: "Nombre un club de fútbol argentino que haya ganado la Copa Libertadores",
                answers: [
                    { text: "BOCA JUNIORS", points: 100 },
                    { text: "RIVER PLATE", points: 80 },
                    { text: "INDEPENDIENTE", points: 60 },
                    { text: "RACING", points: 40 },
                    { text: "SAN LORENZO", points: 20 }
                ]
            }
        ];

        this.sounds = { correct: null, wrong: null, reveal: null, win: null };
        this.timerInterval = null;
        this.roomListener = null;
        this.init();
    }

    async init() {
        console.log('Initializing 100 Futboleros Dicen Game...');
        this.loadSounds();
        this.bindEvents();
        this.bindModalEvents();
        this.handleExternalRequests();
        await this.initializeFirebase();
        this.showSection('lobbySection');
        this.generateRandomPlayerName();
        console.log('Game initialized successfully');
    }

    async initializeFirebase() {
        try {
            console.log('Initializing Firebase for 100 Futboleros Dicen...');
            const { FutbolerosDicenFirebase } = await import('./100-futboleros-dicen-firebase.js');
            this.firebase = new FutbolerosDicenFirebase();
            
            const success = await this.firebase.init();
            if (success) {
                this.gameState.isOnline = true;
                console.log('✅ Firebase integration ready for 100 Futboleros Dicen');
                this.showOnlineStatus();
                this.refreshRooms();
            } else {
                throw new Error('Firebase initialization failed');
            }
        } catch (error) {
            console.warn('⚠️ Firebase initialization failed, running in offline mode:', error);
            this.showOfflineMode();
        }
    }

    showOnlineStatus() {
        const messageArea = document.getElementById('lobbyMessageArea');
        if (messageArea) {
            messageArea.innerHTML = `
                <div class="online-notice">
                    <i class="fas fa-wifi" style="color: #00d4ff;"></i>
                    <span style="color: #00d4ff;">Modo online activado - Multijugador disponible</span>
                </div>
            `;
            messageArea.style.display = 'block';
            setTimeout(() => {
                if (messageArea.textContent.includes('Modo online activado')) {
                    messageArea.style.display = 'none';
                }
            }, 3000);
        }
    }

    showOfflineMode() {
        this.gameState.isOnline = false;
        const messageArea = document.getElementById('lobbyMessageArea');
        if (messageArea) {
            messageArea.innerHTML = `
                <div class="offline-notice" style="background: rgba(255, 107, 53, 0.1); border: 1px solid rgba(255, 107, 53, 0.3); border-radius: 8px; padding: 12px; text-align: center;">
                    <i class="fas fa-wifi-slash" style="color: #ff6b35; margin-right: 8px;"></i>
                    <span style="color: #ff6b35; font-weight: 500;">Modo sin conexión - Solo multijugador local disponible</span>
                </div>
            `;
            messageArea.style.display = 'block';
        }
        console.log('🔌 Running in offline mode - Firebase not available');
    }

    loadSounds() {
        this.sounds.correct = document.getElementById('correctAnswerSound');
        this.sounds.wrong = document.getElementById('wrongAnswerSound');
        this.sounds.reveal = document.getElementById('revealAnswerSound');
        this.sounds.win = document.getElementById('gameWinSound');
    }

    bindEvents() {
        // Lobby events
        const createBtn = document.getElementById('createRoomButton');
        const joinBtn = document.getElementById('joinRoomButton');
        const joinRandomBtn = document.getElementById('joinRandomRoomButton');
        const refreshBtn = document.getElementById('refreshRoomsButton');
        
        if (createBtn) createBtn.addEventListener('click', () => this.createRoom());
        if (joinBtn) joinBtn.addEventListener('click', () => this.joinRoom());
        if (joinRandomBtn) joinRandomBtn.addEventListener('click', () => this.joinRandomRoom());
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshRooms());

        // Game events
        const answerForm = document.getElementById('answerForm');
        if (answerForm) answerForm.addEventListener('submit', (e) => this.submitAnswer(e));
    }

    bindModalEvents() {
        const modals = ['confirmModal', 'errorModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) closeBtn.addEventListener('click', () => this.hideModal(modalId));
            }
        });
    }

    generateRandomPlayerName() {
        const savedName = localStorage.getItem('playerName');
        const createInput = document.getElementById('createPlayerName');
        const joinInput = document.getElementById('joinPlayerName');
        
        if (savedName) {
            if (createInput) createInput.value = savedName;
            if (joinInput) joinInput.value = savedName;
        } else {
            const names = ['Crack', 'Futbolero', 'Messi', 'Pelusa', 'Pibe', 'Crack10', 'Goleador', 'Maestro'];
            const randomName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
            if (createInput) createInput.value = randomName;
            if (joinInput) joinInput.value = randomName;
        }
    }

    showSection(sectionName) {
        console.log('Showing section:', sectionName);
        const sections = ['lobbySection', 'waitingRoomSection', 'gameSection', 'resultsSection'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) element.style.display = 'none';
        });
        
        const targetElement = document.getElementById(sectionName);
        if (targetElement) targetElement.style.display = 'block';
        this.gameState.currentSection = sectionName.replace('Section', '');
    }

    showLoading(message = 'Cargando...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const text = overlay.querySelector('.loading-text');
            if (text) text.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    showModal(modalId, title, message, confirmCallback = null) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        const titleElement = modal.querySelector('h3');
        const messageElement = modal.querySelector('p');
        
        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        
        if (confirmCallback && modalId === 'confirmModal') {
            const confirmBtn = document.getElementById('confirmModalConfirm');
            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    confirmCallback();
                    this.hideModal(modalId);
                };
            }
        }
        
        modal.style.display = 'flex';
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }

    async createRoom() {
        const playerNameInput = document.getElementById('createPlayerName');
        const passwordInput = document.getElementById('createRoomPassword');
        const maxPlayersSelect = document.getElementById('maxPlayers');
        
        const playerName = playerNameInput ? playerNameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';
        const maxPlayers = maxPlayersSelect ? parseInt(maxPlayersSelect.value) : 4;

        if (!playerName) {
            this.showModal('errorModal', 'Error', 'Por favor ingresa tu nombre');
            return;
        }

        this.showLoading('Creando sala...');

        if (this.gameState.isOnline && this.firebase) {
            try {
                const playerId = this.generatePlayerId();
                const result = await this.firebase.createRoom({
                    playerId,
                    playerName,
                    password,
                    maxPlayers
                });

                if (result) {
                    this.gameState.roomId = result.roomId;
                    this.gameState.playerId = playerId;
                    this.gameState.playerName = playerName;
                    this.gameState.isHost = true;
                    
                    localStorage.setItem('playerName', playerName);
                    this.emitGameEvent('roomCreated', { 
                        roomId: result.roomId, 
                        playerName: playerName,
                        isHost: true 
                    });
                    
                    this.hideLoading();
                    this.showWaitingRoom();
                    this.listenToRoomChanges();
                } else {
                    throw new Error('No se pudo crear la sala');
                }
            } catch (error) {
                this.hideLoading();
                this.showModal('errorModal', 'Error', 'Error al crear la sala: ' + error.message);
            }
        } else {
            // Modo offline
            setTimeout(() => {
                this.gameState.roomId = this.generateRoomId();
                this.gameState.playerId = this.generatePlayerId();
                this.gameState.playerName = playerName;
                this.gameState.isHost = true;
                this.gameState.players = [{
                    id: this.gameState.playerId,
                    name: playerName,
                    isHost: true,
                    team: 'A',
                    score: 0
                }];

                localStorage.setItem('playerName', playerName);
                this.emitGameEvent('roomCreated', { 
                    roomId: this.gameState.roomId, 
                    playerName: playerName,
                    isHost: true,
                    offline: true 
                });
                
                this.hideLoading();
                this.showWaitingRoom();
            }, 1500);
        }
    }

    async refreshRooms() {
        if (!this.gameState.isOnline) {
            this.simulateOfflineRooms();
            return;
        }

        const roomsList = document.getElementById('availableRoomsList');
        if (roomsList) {
            roomsList.innerHTML = '<li class="no-rooms-message"><i class="fas fa-spinner fa-spin"></i> Actualizando...</li>';

            try {
                const rooms = await this.firebase.getAvailableRooms();
                this.displayAvailableRooms(rooms);
            } catch (error) {
                console.error('Error refreshing rooms:', error);
                roomsList.innerHTML = '<li class="no-rooms-message">Error al cargar salas</li>';
            }
        }
    }

    displayAvailableRooms(rooms) {
        const roomsList = document.getElementById('availableRoomsList');
        if (!roomsList) return;
        
        if (!rooms || rooms.length === 0) {
            roomsList.innerHTML = '<li class="no-rooms-message">No hay salas disponibles</li>';
            return;
        }

        roomsList.innerHTML = '';
        rooms.forEach(room => {
            const roomItem = document.createElement('li');
            roomItem.className = 'room-item';
            roomItem.innerHTML = `
                <div class="room-info">
                    <span class="room-name">Sala de ${room.hostName}</span>
                    <span class="room-players">${room.currentPlayers}/${room.maxPlayers}</span>
                </div>
            `;
            roomItem.addEventListener('click', () => this.quickJoinRoom(room.id));
            roomsList.appendChild(roomItem);
        });
    }

    simulateOfflineRooms() {
        const roomsList = document.getElementById('availableRoomsList');
        if (!roomsList) return;
        
        roomsList.innerHTML = '<li class="no-rooms-message"><i class="fas fa-spinner fa-spin"></i> Actualizando...</li>';

        setTimeout(() => {
            if (Math.random() < 0.5) {
                roomsList.innerHTML = `
                    <li class="room-item" onclick="window.game?.quickJoinRoom('ABC123')">
                        <div class="room-info">
                            <span class="room-name">Sala de Crack789</span>
                            <span class="room-players">2/4</span>
                        </div>
                    </li>
                `;
            } else {
                roomsList.innerHTML = '<li class="no-rooms-message">No hay salas disponibles</li>';
            }
        }, 1000);
    }

    quickJoinRoom(roomId) {
        const joinInput = document.getElementById('joinPlayerName');
        const roomIdInput = document.getElementById('joinRoomId');
        
        const playerName = joinInput ? joinInput.value.trim() : '';
        if (!playerName) {
            this.showModal('errorModal', 'Error', 'Por favor ingresa tu nombre primero');
            return;
        }

        if (roomIdInput) roomIdInput.value = roomId;
        this.joinRoom();
    }

    async joinRoom() {
        const joinInput = document.getElementById('joinPlayerName');
        const roomIdInput = document.getElementById('joinRoomId');
        const passwordInput = document.getElementById('joinRoomPassword');
        
        const playerName = joinInput ? joinInput.value.trim() : '';
        const roomId = roomIdInput ? roomIdInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

        if (!playerName) {
            this.showModal('errorModal', 'Error', 'Por favor ingresa tu nombre');
            return;
        }

        if (!roomId) {
            this.showModal('errorModal', 'Error', 'Por favor ingresa el código de sala');
            return;
        }

        this.showLoading('Uniéndose a la sala...');

        if (this.gameState.isOnline && this.firebase) {
            try {
                const playerId = this.generatePlayerId();
                const result = await this.firebase.joinRoom(roomId, {
                    playerId,
                    playerName
                }, password);

                if (result) {
                    this.gameState.roomId = roomId;
                    this.gameState.playerId = playerId;
                    this.gameState.playerName = playerName;
                    this.gameState.isHost = false;
                    
                    localStorage.setItem('playerName', playerName);
                    this.emitGameEvent('playerJoined', { 
                        roomId: roomId, 
                        playerName: playerName,
                        isHost: false 
                    });
                    
                    this.hideLoading();
                    this.showWaitingRoom();
                    this.listenToRoomChanges();
                } else {
                    throw new Error('No se pudo unir a la sala');
                }
            } catch (error) {
                this.hideLoading();
                this.showModal('errorModal', 'Error', 'Error al unirse: ' + error.message);
            }
        } else {
            // Modo offline simulado
            setTimeout(() => {
                this.gameState.roomId = roomId;
                this.gameState.playerId = this.generatePlayerId();
                this.gameState.playerName = playerName;
                this.gameState.isHost = false;
                this.gameState.players = [
                    { id: 'host', name: 'Crack123', isHost: true, team: 'A', score: 0 },
                    { id: this.gameState.playerId, name: playerName, isHost: false, team: 'B', score: 0 }
                ];

                localStorage.setItem('playerName', playerName);
                this.hideLoading();
                this.showWaitingRoom();
            }, 1500);
        }
    }

    async joinRandomRoom() {
        const joinInput = document.getElementById('joinPlayerName');
        const playerName = joinInput ? joinInput.value.trim() : '';

        if (!playerName) {
            this.showModal('errorModal', 'Error', 'Por favor ingresa tu nombre');
            return;
        }

        this.showLoading('Buscando sala aleatoria...');

        if (this.gameState.isOnline && this.firebase) {
            try {
                const availableRooms = await this.firebase.getAvailableRooms();
                
                if (availableRooms.length > 0) {
                    const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
                    const roomIdInput = document.getElementById('joinRoomId');
                    if (roomIdInput) roomIdInput.value = randomRoom.id;
                    this.joinRoom();
                } else {
                    this.hideLoading();
                    this.showModal('errorModal', 'Info', 'No se encontraron salas disponibles. Intenta crear una nueva.');
                }
            } catch (error) {
                this.hideLoading();
                this.showModal('errorModal', 'Error', 'Error buscando salas: ' + error.message);
            }
        } else {
            // Modo offline simulado
            setTimeout(() => {
                this.hideLoading();
                this.showModal('errorModal', 'Info', 'No se encontraron salas disponibles. Intenta crear una nueva.');
            }, 2000);
        }
    }

    showWaitingRoom() {
        this.showSection('waitingRoomSection');
        this.updateWaitingRoom();
    }

    updateWaitingRoom() {
        const displayRoomId = document.getElementById('displayRoomId');
        const playerCountDisplay = document.getElementById('playerCountDisplay');
        
        if (displayRoomId) displayRoomId.textContent = this.gameState.roomId || '';
        if (playerCountDisplay) playerCountDisplay.textContent = `${this.gameState.players.length}/4`;
    }

    listenToRoomChanges() {
        if (!this.gameState.isOnline || !this.firebase) return;

        this.roomListener = this.firebase.listenToRoom(this.gameState.roomId, (roomData) => {
            if (!roomData) {
                this.showModal('errorModal', 'Info', 'La sala ha sido cerrada');
                this.backToLobby();
                return;
            }
            this.handleRoomUpdate(roomData);
        });
    }

    handleRoomUpdate(roomData) {
        this.gameState.players = Object.values(roomData.players || {});
        
        if (this.gameState.currentSection === 'waiting') {
            this.updateWaitingRoom();
        }
    }

    submitAnswer(e) {
        e.preventDefault();
        const answerInput = document.getElementById('answerInput');
        if (!answerInput) return;
        
        const answer = answerInput.value.trim().toUpperCase();
        if (!answer) return;
        
        answerInput.value = '';
        console.log('Answer submitted:', answer);
        // Lógica del juego aquí
    }

    // Métodos de utilidad
    generateRoomId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    emitGameEvent(eventType, data = {}) {
        const event = new CustomEvent('gameStateChanged', {
            detail: { state: eventType, data }
        });
        window.dispatchEvent(event);
    }

    backToLobby() {
        this.resetGame();
        this.showSection('lobbySection');
    }

    resetGame() {
        if (this.roomListener) {
            this.roomListener();
            this.roomListener = null;
        }
        
        this.gameState = {
            ...this.gameState,
            currentSection: 'lobby',
            roomId: null,
            playerId: null,
            isHost: false,
            players: [],
            gamePhase: 'waiting'
        };
    }

    cleanup() {
        if (this.roomListener) {
            this.roomListener();
            this.roomListener = null;
        }
        
        if (this.firebase) {
            this.firebase.cleanup();
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    handleExternalRequests() {
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data && event.data.type === 'requestRooms' && event.data.gameType === '100-futboleros-dicen') {
                this.sendAvailableRooms();
            }
        });
    }

    async sendAvailableRooms() {
        try {
            let rooms = [];
            if (this.firebase && this.gameState.isOnline) {
                rooms = await this.firebase.getAvailableRooms();
            }
            
            const message = {
                type: 'availableRooms',
                gameType: '100-futboleros-dicen',
                rooms: rooms
            };
            
            if (window.parent !== window) {
                window.parent.postMessage(message, window.location.origin);
            }
            
            if (window.opener) {
                window.opener.postMessage(message, window.location.origin);
            }
        } catch (error) {
            console.error('Error sending available rooms:', error);
        }
    }
}

// Initialize game when DOM is loaded
let game;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting game initialization');
    game = new FutbolerosDicenGame();
    window.game = game;
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (game) {
        game.cleanup();
    }
});

// Export for debugging
window.FutbolerosDicenGame = FutbolerosDicenGame; 