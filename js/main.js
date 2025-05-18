(function() { // IIFE para encapsular y ejecutar inmediatamente
    const playerName = localStorage.getItem('playerName');
    const currentPagePath = window.location.pathname;

    // Solo permitir el acceso a index.html (raíz o /index.html) si no hay nombre.
    const isIndexPage = (currentPagePath === '/' || currentPagePath === '/index.html');

    // Si no hay nombre y la página actual NO es index.html, redirigir a la raíz.
    if (!playerName && !isIndexPage) {
        window.location.href = '/'; 
    }
})();

// Store player name in local storage
document.addEventListener('DOMContentLoaded', function() {
    const nameForm = document.getElementById('nameForm');
    const playerNameInput = document.getElementById('playerName');
    const createPlayerNameLobbyInput = document.getElementById('createPlayerName');
    const joinPlayerNameLobbyInput = document.getElementById('joinPlayerName');

    // 1. Al cargar la página, intentar pre-rellenar el nombre
    const savedPlayerName = localStorage.getItem('playerName');
    if (savedPlayerName) {
        if (playerNameInput) {
            playerNameInput.value = savedPlayerName;
        }
        if (createPlayerNameLobbyInput) {
            createPlayerNameLobbyInput.value = savedPlayerName;
        }
        if (joinPlayerNameLobbyInput) {
            joinPlayerNameLobbyInput.value = savedPlayerName;
        }
    }

    if (nameForm) {
        nameForm.addEventListener('submit', function(event) {
            if (playerNameInput) {
                const enteredName = playerNameInput.value.trim();
                if (enteredName) {
                    event.preventDefault();
                    localStorage.setItem('playerName', enteredName);
                    console.log(`Nombre guardado desde index.html: ${enteredName}. Redirigiendo a games.html...`);
            window.location.href = 'games.html';
                } else {
                    console.log("El nombre en index.html no puede estar vacío.");
                    event.preventDefault();
                    playerNameInput.focus();
                }
            } else {
                event.preventDefault();
            }
        });
    }

    // --- Lógica para actualizar los nombres en los inputs del lobby de QSM si se cambian en la página de juegos ---
    if (window.location.pathname.includes('quiensabemas.html')) {
        if (savedPlayerName) {
            if (createPlayerNameLobbyInput && createPlayerNameLobbyInput.value !== savedPlayerName) {
                createPlayerNameLobbyInput.value = savedPlayerName;
            }
            if (joinPlayerNameLobbyInput && joinPlayerNameLobbyInput.value !== savedPlayerName) {
                joinPlayerNameLobbyInput.value = savedPlayerName;
            }
        }
    }

    // --- Manejo de Cookies y Privacidad (ejemplo) ---
    const cookieBanner = document.getElementById('cookieConsentBanner');
    const acceptButton = document.getElementById('acceptCookieButton');

    if (cookieBanner && acceptButton) {
        if (!localStorage.getItem('cookiesAccepted')) {
            cookieBanner.style.display = 'block';
        }

        acceptButton.addEventListener('click', function() {
            localStorage.setItem('cookiesAccepted', 'true');
            cookieBanner.style.display = 'none';
            console.log("Cookies aceptadas.");
        });
    }

    // Check if we're on the games page
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    if (playerNameDisplay) {
        let playerName = localStorage.getItem('playerName') || 'Jugador';
        playerNameDisplay.textContent = playerName;
        
        // Configurar el cambio de nombre
        const changeNameBtn = document.getElementById('changeNameBtn');
        const changeNameModal = document.getElementById('changeNameModal');
        const changeNameForm = document.getElementById('changeNameForm');
        const cancelNameChange = document.getElementById('cancelNameChange');
        const newPlayerNameInput = document.getElementById('newPlayerName');
        
        if (changeNameBtn && changeNameModal) {
            changeNameBtn.addEventListener('click', function() {
                newPlayerNameInput.value = playerName;
                changeNameModal.classList.add('active');
            });
            
            if (cancelNameChange) {
                cancelNameChange.addEventListener('click', function() {
                    changeNameModal.classList.remove('active');
                });
            }
            
            if (changeNameForm) {
                changeNameForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const newName = newPlayerNameInput.value.trim();
                    const saveButton = changeNameForm.querySelector('.save-button');
                    const cancelButton = changeNameForm.querySelector('.cancel-button');
                    
                    if (newName) {
                        if(saveButton) saveButton.disabled = true;
                        if(cancelButton) cancelButton.disabled = true;

                        localStorage.setItem('playerName', newName);
                        playerNameDisplay.textContent = newName;
                        changeNameModal.classList.remove('active');
                        playerName = newName;

                        document.querySelectorAll('.player-name').forEach(element => {
                            element.textContent = newName;
                        });
                    }
                });
            }
        }
    }

    // --- Get Modal Elements --- 
    const qsmIntroModal = document.getElementById('qsmIntroModal');
    const goToLobbyQSMButton = document.getElementById('goToLobbyQSMButton');

    // Handle clicking on game cards
    const gameCards = document.querySelectorAll('.game-card');
    if (gameCards.length > 0) {
        gameCards.forEach(card => {
            const playButton = card.querySelector('.play-button');

            card.addEventListener('click', function(event) {
                if (playButton && playButton.disabled) {
                    event.stopPropagation();
                    return;
                }

                const gameType = this.getAttribute('data-game');

                if (gameType === 'quiensabemas') {
                    event.preventDefault();
                    event.stopPropagation();
                    if (qsmIntroModal) {
                        qsmIntroModal.classList.add('active');
                    }
                } else if (gameType) {
                window.location.href = `${gameType}.html`;
                } 
            });
        });
    }

    if (goToLobbyQSMButton && qsmIntroModal) {
        goToLobbyQSMButton.addEventListener('click', function() {
            qsmIntroModal.classList.remove('active');
            window.location.href = 'quiensabemas.html';
        });
    }

    if (qsmIntroModal) {
        qsmIntroModal.addEventListener('click', function(event) {
            if (event.target === qsmIntroModal) {
                qsmIntroModal.classList.remove('active');
            }
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
        const currentSavedPlayerName = localStorage.getItem('playerName') || 'Jugador';
        playerNameElements.forEach(element => {
            if (element.tagName !== 'INPUT' || !element.value || element.value === 'Jugador 1' || element.value === 'Jugador 2') {
                 element.textContent = currentSavedPlayerName;
            }
            if (element.id === 'createPlayerName' || element.id === 'joinPlayerName'){
                if(element.value !== currentSavedPlayerName) element.value = currentSavedPlayerName;
            }
        });
    }
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


// Función para compartir el sitio
async function shareSite() {
    const shareData = {
        title: document.title,
        text: '¡Juega y demuestra tus conocimientos de fútbol en Crack Total!',
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            console.log('Contenido compartido exitosamente!');
        } else {
            alert('Tu navegador no soporta la función de compartir. Por favor, copia el enlace manualmente: ' + window.location.href);
        }
    } catch (err) {
        console.error('Error al compartir: ', err);
        if (err.name !== 'AbortError') {
            alert('Hubo un error al intentar compartir.');
        }
    }
} 