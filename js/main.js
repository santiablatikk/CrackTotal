// Store player name in local storage
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the home page
    const nameForm = document.getElementById('nameForm');
    if (nameForm) {
        // Si ya hay un nombre guardado, redirigir directamente a games.html
        const existingName = localStorage.getItem('playerName');
        if (existingName) {
            window.location.href = 'games.html';
            return;
        }
        
        nameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const playerName = document.getElementById('playerName').value.trim();
            
            if (playerName) {
                // Save the name to local storage
                localStorage.setItem('playerName', playerName);
                // Redirect to game selection page
                window.location.href = 'games.html';
            }
        });
    }

    // Check if we're on the games page
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    if (playerNameDisplay) {
        const playerName = localStorage.getItem('playerName') || 'Jugador';
        playerNameDisplay.textContent = playerName;
        
        // Configurar el cambio de nombre
        const changeNameBtn = document.getElementById('changeNameBtn');
        const changeNameModal = document.getElementById('changeNameModal');
        const changeNameForm = document.getElementById('changeNameForm');
        const cancelNameChange = document.getElementById('cancelNameChange');
        const newPlayerNameInput = document.getElementById('newPlayerName');
        
        if (changeNameBtn && changeNameModal) {
            // Mostrar modal
            changeNameBtn.addEventListener('click', function() {
                newPlayerNameInput.value = playerName;
                changeNameModal.classList.add('active');
            });
            
            // Ocultar modal con cancelar
            if (cancelNameChange) {
                cancelNameChange.addEventListener('click', function() {
                    changeNameModal.classList.remove('active');
                });
            }
            
            // Guardar nuevo nombre
            if (changeNameForm) {
                changeNameForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const newName = newPlayerNameInput.value.trim();
                    
                    if (newName) {
                        localStorage.setItem('playerName', newName);
                        playerNameDisplay.textContent = newName;
                        changeNameModal.classList.remove('active');
                        
                        // Actualizar cualquier otro elemento con nombre de jugador
                        document.querySelectorAll('.player-name').forEach(element => {
                            element.textContent = newName;
                        });
                    }
                });
            }
        }
    }

    // Handle clicking on game cards
    const gameCards = document.querySelectorAll('.game-card');
    if (gameCards.length > 0) {
        gameCards.forEach(card => {
            card.addEventListener('click', function() {
                const gameType = this.getAttribute('data-game');
                window.location.href = `${gameType}.html`;
            });
        });
    }

    // Handle back buttons
    const backButtons = document.querySelectorAll('.back-button');
    if (backButtons.length > 0) {
        backButtons.forEach(button => {
            button.addEventListener('click', function() {
                window.location.href = 'games.html';
            });
        });
    }

    // Update player name in game headers
    const playerNameElements = document.querySelectorAll('.player-name');
    if (playerNameElements.length > 0) {
        const playerName = localStorage.getItem('playerName') || 'Jugador';
        playerNameElements.forEach(element => {
            element.textContent = playerName;
        });
    }
    
    // Hacer que el logo sea un enlace
    const logoElements = document.querySelectorAll('.logo');
    logoElements.forEach(logo => {
        logo.addEventListener('click', function() {
            window.location.href = 'games.html';
        });
    });
});

// Animation helpers
function animateElement(element, animationClass) {
    element.classList.add(animationClass);
    element.addEventListener('animationend', () => {
        element.classList.remove(animationClass);
    });
}

// Handle screen size changes
function handleResponsiveChanges() {
    const width = window.innerWidth;
    if (width <= 768) {
        // Mobile specific adjustments
    } else {
        // Desktop specific adjustments
    }
}

window.addEventListener('resize', handleResponsiveChanges);
handleResponsiveChanges(); 