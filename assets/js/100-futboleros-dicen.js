// 100 Futboleros Dicen - Game Logic
class FutbolerosDicenGame {
    constructor() {
        this.gameState = {
            currentSection: 'lobby',
            roomId: null,
            playerId: null,
            playerName: '',
            isHost: false,
            players: [],
            gamePhase: 'waiting', // waiting, playing, results
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
            revealedAnswers: []
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
            },
            {
                question: "Nombre una posición en el campo de fútbol",
                answers: [
                    { text: "DELANTERO", points: 100 },
                    { text: "MEDIOCAMPISTA", points: 80 },
                    { text: "DEFENSOR", points: 60 },
                    { text: "ARQUERO", points: 40 },
                    { text: "LATERAL", points: 20 }
                ]
            },
            {
                question: "Nombre un país que haya ganado la Copa del Mundo",
                answers: [
                    { text: "BRASIL", points: 100 },
                    { text: "ARGENTINA", points: 80 },
                    { text: "ALEMANIA", points: 60 },
                    { text: "ITALIA", points: 40 },
                    { text: "URUGUAY", points: 20 }
                ]
            },
            {
                question: "Nombre un estadio de fútbol famoso en Argentina",
                answers: [
                    { text: "LA BOMBONERA", points: 100 },
                    { text: "EL MONUMENTAL", points: 80 },
                    { text: "EL CILINDRO", points: 60 },
                    { text: "LIBERTADORES DE AMÉRICA", points: 40 },
                    { text: "CIUDAD DE LA PLATA", points: 20 }
                ]
            }
        ];

        this.sounds = {
            correct: null,
            wrong: null,
            reveal: null,
            win: null
        };

        this.timerInterval = null;
        this.init();
    }

    init() {
        this.loadSounds();
        this.bindEvents();
        this.showSection('lobby');
        this.generateRandomPlayerName();
    }

    loadSounds() {
        this.sounds.correct = document.getElementById('correctAnswerSound');
        this.sounds.wrong = document.getElementById('wrongAnswerSound');
        this.sounds.reveal = document.getElementById('revealAnswerSound');
        this.sounds.win = document.getElementById('gameWinSound');
    }

    bindEvents() {
        // Lobby events
        document.getElementById('createRoomButton').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoomButton').addEventListener('click', () => this.joinRoom());
        document.getElementById('joinRandomRoomButton').addEventListener('click', () => this.joinRandomRoom());
        document.getElementById('refreshRoomsButton').addEventListener('click', () => this.refreshRooms());

        // Waiting room events
        document.getElementById('startGameButton').addEventListener('click', () => this.startGame());
        document.getElementById('leaveRoomButton').addEventListener('click', () => this.leaveRoom());
        document.getElementById('copyRoomIdButton').addEventListener('click', () => this.copyRoomId());

        // Game events
        document.getElementById('answerForm').addEventListener('submit', (e) => this.submitAnswer(e));

        // Results events
        document.getElementById('playAgainButton').addEventListener('click', () => this.playAgain());
        document.getElementById('backToLobbyButton').addEventListener('click', () => this.backToLobby());
        document.getElementById('shareResultsButton').addEventListener('click', () => this.shareResults());

        // Modal events
        this.bindModalEvents();
    }

    bindModalEvents() {
        const modals = ['confirmModal', 'errorModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            const closeBtn = modal.querySelector('.modal-close');
            closeBtn.addEventListener('click', () => this.hideModal(modalId));
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal(modalId);
            });
        });

        document.getElementById('confirmModalCancel').addEventListener('click', () => this.hideModal('confirmModal'));
        document.getElementById('errorModalOk').addEventListener('click', () => this.hideModal('errorModal'));
    }

    generateRandomPlayerName() {
        const names = ['Crack', 'Futbolero', 'Messi', 'Pelusa', 'Pibe', 'Crack10', 'Goleador', 'Maestro'];
        const randomName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
        
        document.getElementById('createPlayerName').value = randomName;
        document.getElementById('joinPlayerName').value = randomName;
    }

    showSection(sectionName) {
        const sections = ['lobbySection', 'waitingRoomSection', 'gameSection', 'resultsSection'];
        sections.forEach(section => {
            document.getElementById(section).style.display = 'none';
        });
        
        document.getElementById(sectionName).style.display = 'block';
        this.gameState.currentSection = sectionName.replace('Section', '');

        // Update header stats visibility
        const headerStats = document.getElementById('gameStatsHeader');
        if (sectionName === 'gameSection') {
            headerStats.style.display = 'block';
        } else {
            headerStats.style.display = 'none';
        }
    }

    showLoading(message = 'Cargando...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay.querySelector('.loading-text');
        text.textContent = message;
        overlay.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showModal(modalId, title, message, confirmCallback = null) {
        const modal = document.getElementById(modalId);
        const titleElement = modal.querySelector('h3');
        const messageElement = modal.querySelector('p');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        if (confirmCallback && modalId === 'confirmModal') {
            const confirmBtn = document.getElementById('confirmModalConfirm');
            confirmBtn.onclick = () => {
                confirmCallback();
                this.hideModal(modalId);
            };
        }
        
        modal.style.display = 'flex';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    createRoom() {
        const playerName = document.getElementById('createPlayerName').value.trim();
        const password = document.getElementById('createRoomPassword').value.trim();
        const maxPlayers = parseInt(document.getElementById('maxPlayers').value);

        if (!playerName) {
            this.showModal('errorModal', 'Error', 'Por favor ingresa tu nombre');
            return;
        }

        this.showLoading('Creando sala...');

        // Simulate room creation
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

            this.hideLoading();
            this.showWaitingRoom();
        }, 1500);
    }

    joinRoom() {
        const playerName = document.getElementById('joinPlayerName').value.trim();
        const roomId = document.getElementById('joinRoomId').value.trim();
        const password = document.getElementById('joinRoomPassword').value.trim();

        if (!playerName) {
            this.showModal('errorModal', 'Error', 'Por favor ingresa tu nombre');
            return;
        }

        if (!roomId) {
            this.showModal('errorModal', 'Error', 'Por favor ingresa el código de sala');
            return;
        }

        this.showLoading('Uniéndose a la sala...');

        // Simulate joining room
        setTimeout(() => {
            if (Math.random() < 0.8) { // 80% success rate
                this.gameState.roomId = roomId;
                this.gameState.playerId = this.generatePlayerId();
                this.gameState.playerName = playerName;
                this.gameState.isHost = false;
                this.gameState.players = [
                    { id: 'host', name: 'Crack123', isHost: true, team: 'A', score: 0 },
                    { id: this.gameState.playerId, name: playerName, isHost: false, team: 'B', score: 0 }
                ];

                this.hideLoading();
                this.showWaitingRoom();
            } else {
                this.hideLoading();
                this.showModal('errorModal', 'Error', 'No se pudo encontrar la sala. Verifica el código.');
            }
        }, 1500);
    }

    joinRandomRoom() {
        const playerName = document.getElementById('joinPlayerName').value.trim();

        if (!playerName) {
            this.showModal('errorModal', 'Error', 'Por favor ingresa tu nombre');
            return;
        }

        this.showLoading('Buscando sala aleatoria...');

        // Simulate random room search
        setTimeout(() => {
            if (Math.random() < 0.6) { // 60% success rate
                this.gameState.roomId = this.generateRoomId();
                this.gameState.playerId = this.generatePlayerId();
                this.gameState.playerName = playerName;
                this.gameState.isHost = false;
                this.gameState.players = [
                    { id: 'host', name: 'Futbolero456', isHost: true, team: 'A', score: 0 },
                    { id: this.gameState.playerId, name: playerName, isHost: false, team: 'B', score: 0 }
                ];

                this.hideLoading();
                this.showWaitingRoom();
            } else {
                this.hideLoading();
                this.showModal('errorModal', 'Info', 'No se encontraron salas disponibles. Intenta crear una nueva.');
            }
        }, 2000);
    }

    refreshRooms() {
        // Simulate refreshing room list
        const roomsList = document.getElementById('availableRoomsList');
        roomsList.innerHTML = '<li class="no-rooms-message"><i class="fas fa-spinner fa-spin"></i> Actualizando...</li>';

        setTimeout(() => {
            if (Math.random() < 0.5) {
                roomsList.innerHTML = `
                    <li class="room-item" onclick="game.quickJoinRoom('ABC123')">
                        <div class="room-info">
                            <span class="room-name">Sala de Crack789</span>
                            <span class="room-players">2/4</span>
                        </div>
                    </li>
                    <li class="room-item" onclick="game.quickJoinRoom('XYZ456')">
                        <div class="room-info">
                            <span class="room-name">Futboleros Pro</span>
                            <span class="room-players">3/6</span>
                        </div>
                    </li>
                `;
            } else {
                roomsList.innerHTML = '<li class="no-rooms-message">No hay salas disponibles</li>';
            }
        }, 1000);
    }

    quickJoinRoom(roomId) {
        const playerName = document.getElementById('joinPlayerName').value.trim();
        if (!playerName) {
            this.showModal('errorModal', 'Error', 'Por favor ingresa tu nombre primero');
            return;
        }

        document.getElementById('joinRoomId').value = roomId;
        this.joinRoom();
    }

    showWaitingRoom() {
        this.showSection('waitingRoomSection');
        this.updateWaitingRoom();
    }

    updateWaitingRoom() {
        document.getElementById('displayRoomId').textContent = this.gameState.roomId;
        document.getElementById('playerCountDisplay').textContent = `${this.gameState.players.length}/4`;

        const playersGrid = document.getElementById('playersGrid');
        playersGrid.innerHTML = '';

        // Add current players
        this.gameState.players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = `player-card ${player.isHost ? 'host' : ''}`;
            playerCard.innerHTML = `
                <div class="player-avatar-large">
                    <i class="fas fa-user"></i>
                </div>
                <div class="player-name-large">${player.name}</div>
                <div class="player-status">${player.isHost ? 'Anfitrión' : 'Listo'}</div>
            `;
            playersGrid.appendChild(playerCard);
        });

        // Add empty slots
        const maxPlayers = 4;
        const emptySlots = maxPlayers - this.gameState.players.length;
        for (let i = 0; i < emptySlots; i++) {
            const emptySlot = document.createElement('div');
            emptySlot.className = 'player-card empty-slot';
            emptySlot.textContent = 'Esperando jugador...';
            playersGrid.appendChild(emptySlot);
        }

        // Show/hide start button
        const startBtn = document.getElementById('startGameButton');
        if (this.gameState.isHost && this.gameState.players.length >= 2) {
            startBtn.style.display = 'block';
        } else {
            startBtn.style.display = 'none';
        }
    }

    copyRoomId() {
        const roomId = this.gameState.roomId;
        navigator.clipboard.writeText(roomId).then(() => {
            // Show feedback
            const copyBtn = document.getElementById('copyRoomIdButton');
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
            }, 1000);
        });
    }

    startGame() {
        if (!this.gameState.isHost) return;

        this.showLoading('Iniciando juego...');

        setTimeout(() => {
            this.gameState.gamePhase = 'playing';
            this.initializeGame();
            this.hideLoading();
            this.showSection('gameSection');
            this.startRound();
        }, 1500);
    }

    initializeGame() {
        this.gameState.currentRound = 1;
        this.gameState.teamAScore = 0;
        this.gameState.teamBScore = 0;
        this.gameState.roundScore = 0;
        this.gameState.strikes = 0;
        this.gameState.currentPlayerIndex = 0;
        
        // Assign teams alternately
        this.gameState.players.forEach((player, index) => {
            player.team = index % 2 === 0 ? 'A' : 'B';
        });

        this.updateGameUI();
        this.updateTeams();
    }

    startRound() {
        if (this.gameState.currentRound > this.gameState.maxRounds) {
            this.endGame();
            return;
        }

        // Get random question
        this.gameState.currentQuestion = this.questions[Math.floor(Math.random() * this.questions.length)];
        this.gameState.revealedAnswers = [];
        this.gameState.roundScore = 0;
        this.gameState.strikes = 0;

        this.updateGameUI();
        this.showQuestion();
        this.startTurn();
    }

    showQuestion() {
        document.getElementById('currentQuestion').textContent = this.gameState.currentQuestion.question;
        document.getElementById('gameRound').textContent = this.gameState.currentRound;

        // Reset answer board
        for (let i = 1; i <= 5; i++) {
            const slot = document.querySelector(`[data-slot="${i}"]`);
            slot.classList.remove('revealed');
            slot.querySelector('.answer-text').textContent = '';
            slot.querySelector('.answer-points').textContent = '';
        }

        this.updateStrikes();
    }

    startTurn() {
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        document.getElementById('currentPlayerName').textContent = currentPlayer.name;
        
        // Update team highlighting
        this.updateTeams();
        
        // Enable/disable input based on if it's current player's turn
        const inputPanel = document.getElementById('inputPanel');
        const spectatorMode = document.getElementById('spectatorMode');
        
        if (currentPlayer.id === this.gameState.playerId) {
            inputPanel.style.display = 'block';
            spectatorMode.style.display = 'none';
            this.startTimer();
        } else {
            inputPanel.style.display = 'none';
            spectatorMode.style.display = 'block';
            this.startTimer();
        }
    }

    startTimer() {
        this.gameState.currentTimer = this.gameState.turnTimeLimit;
        this.updateTimer();
        
        this.timerInterval = setInterval(() => {
            this.gameState.currentTimer--;
            this.updateTimer();
            
            if (this.gameState.currentTimer <= 0) {
                this.timeUp();
            }
        }, 1000);
    }

    updateTimer() {
        const timerElement = document.getElementById('turnTimer');
        timerElement.textContent = this.gameState.currentTimer;
        
        const timerDisplay = document.querySelector('.timer-display');
        if (this.gameState.currentTimer <= 10) {
            timerDisplay.classList.add('warning');
        } else {
            timerDisplay.classList.remove('warning');
        }
    }

    timeUp() {
        this.stopTimer();
        this.addStrike();
        this.nextTurn();
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    submitAnswer(e) {
        e.preventDefault();
        const answerInput = document.getElementById('answerInput');
        const answer = answerInput.value.trim().toUpperCase();
        
        if (!answer) return;
        
        answerInput.value = '';
        this.stopTimer();
        
        this.checkAnswer(answer);
    }

    checkAnswer(answer) {
        const question = this.gameState.currentQuestion;
        const matchingAnswer = question.answers.find(a => 
            a.text.includes(answer) || answer.includes(a.text) || this.similarity(a.text, answer) > 0.7
        );

        if (matchingAnswer && !this.gameState.revealedAnswers.includes(matchingAnswer)) {
            this.revealAnswer(matchingAnswer);
            this.playSound('correct');
        } else {
            this.addStrike();
            this.playSound('wrong');
        }

        setTimeout(() => {
            if (this.gameState.revealedAnswers.length === question.answers.length) {
                this.endRound();
            } else if (this.gameState.strikes >= this.gameState.maxStrikes) {
                this.endRound();
            } else {
                this.nextTurn();
            }
        }, 2000);
    }

    similarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
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
        return matrix[str2.length][str1.length];
    }

    revealAnswer(answer) {
        this.gameState.revealedAnswers.push(answer);
        this.gameState.roundScore += answer.points;
        
        const index = this.gameState.currentQuestion.answers.indexOf(answer) + 1;
        const slot = document.querySelector(`[data-slot="${index}"]`);
        
        slot.classList.add('revealed');
        slot.querySelector('.answer-text').textContent = answer.text;
        slot.querySelector('.answer-points').textContent = answer.points;
        
        this.playSound('reveal');
        this.updateGameUI();
    }

    addStrike() {
        this.gameState.strikes++;
        this.updateStrikes();
    }

    updateStrikes() {
        const strikeIcons = document.querySelectorAll('.strike-icon');
        strikeIcons.forEach((icon, index) => {
            if (index < this.gameState.strikes) {
                icon.classList.add('active');
            } else {
                icon.classList.remove('active');
            }
        });
    }

    nextTurn() {
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % this.gameState.players.length;
        this.startTurn();
    }

    endRound() {
        this.stopTimer();
        
        // Award points to current team
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        if (currentPlayer.team === 'A') {
            this.gameState.teamAScore += this.gameState.roundScore;
        } else {
            this.gameState.teamBScore += this.gameState.roundScore;
        }
        
        this.updateGameUI();
        this.updateTeams();
        
        // Next round
        setTimeout(() => {
            this.gameState.currentRound++;
            this.startRound();
        }, 3000);
    }

    endGame() {
        this.gameState.gamePhase = 'results';
        this.showResults();
    }

    showResults() {
        this.showSection('resultsSection');
        
        // Determine winner
        const teamAWon = this.gameState.teamAScore > this.gameState.teamBScore;
        const titleText = teamAWon ? '¡Equipo A Ganó!' : this.gameState.teamBScore > this.gameState.teamAScore ? '¡Equipo B Ganó!' : '¡Empate!';
        
        document.getElementById('resultsTitle').textContent = titleText;
        document.getElementById('finalScoreA').textContent = this.gameState.teamAScore;
        document.getElementById('finalScoreB').textContent = this.gameState.teamBScore;
        
        // Find MVP (most points contributed)
        const mvpPlayer = this.gameState.players.reduce((prev, current) => 
            (prev.score > current.score) ? prev : current
        );
        
        document.getElementById('mvpName').textContent = mvpPlayer.name;
        document.getElementById('mvpStats').textContent = `${mvpPlayer.score} respuestas correctas`;
        
        this.playSound('win');
    }

    updateGameUI() {
        document.getElementById('currentRound').textContent = this.gameState.currentRound;
        document.getElementById('totalScore').textContent = this.gameState.teamAScore + this.gameState.teamBScore;
        document.getElementById('roundScore').textContent = this.gameState.roundScore;
    }

    updateTeams() {
        document.getElementById('teamAScore').textContent = this.gameState.teamAScore;
        document.getElementById('teamBScore').textContent = this.gameState.teamBScore;
        
        // Update team players
        const teamAPlayers = document.getElementById('teamAPlayers');
        const teamBPlayers = document.getElementById('teamBPlayers');
        
        teamAPlayers.innerHTML = '';
        teamBPlayers.innerHTML = '';
        
        this.gameState.players.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = `team-player ${index === this.gameState.currentPlayerIndex ? 'active' : ''}`;
            playerElement.innerHTML = `
                <div class="team-player-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="team-player-name">${player.name}</div>
            `;
            
            if (player.team === 'A') {
                teamAPlayers.appendChild(playerElement);
            } else {
                teamBPlayers.appendChild(playerElement);
            }
        });
    }

    playSound(soundType) {
        if (this.sounds[soundType] && this.sounds[soundType].readyState >= 2) {
            this.sounds[soundType].currentTime = 0;
            this.sounds[soundType].play().catch(e => console.log('Sound play failed:', e));
        }
    }

    leaveRoom() {
        this.showModal('confirmModal', 'Confirmar', '¿Estás seguro de que quieres salir de la sala?', () => {
            this.resetGame();
            this.showSection('lobbySection');
        });
    }

    playAgain() {
        if (this.gameState.isHost) {
            this.initializeGame();
            this.showSection('gameSection');
            this.startRound();
        }
    }

    backToLobby() {
        this.resetGame();
        this.showSection('lobbySection');
    }

    shareResults() {
        const text = `¡Jugué 100 Futboleros Dicen en Crack Total! Equipo A: ${this.gameState.teamAScore} - Equipo B: ${this.gameState.teamBScore}`;
        if (navigator.share) {
            navigator.share({
                title: '100 Futboleros Dicen - Crack Total',
                text: text,
                url: window.location.href
            });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + ' ' + window.location.href);
            this.showModal('errorModal', 'Copiado', 'Resultado copiado al portapapeles');
        }
    }

    resetGame() {
        this.stopTimer();
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
            revealedAnswers: []
        };
    }

    generateRoomId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize game when DOM is loaded
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new FutbolerosDicenGame();
});

// Export for debugging
window.FutbolerosDicenGame = FutbolerosDicenGame; 