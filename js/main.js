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
    // const startButton = document.getElementById('startButton'); // No es necesario si el form maneja el submit

    // 1. Al cargar la página, intentar pre-rellenar el nombre
    const savedPlayerName = localStorage.getItem('playerName');
    if (savedPlayerName) {
        if (playerNameInput) {
            playerNameInput.value = savedPlayerName;
        }
    }

    if (nameForm) {
        nameForm.addEventListener('submit', function(event) {
            // event.preventDefault(); // Se previene SOLO si la redirección es 100% por JS
                                    // Si el form tiene un action o el botón es submit, no siempre es necesario prevenirlo aquí
                                    // o se hace la redirección manualmente después de guardar.

            if (playerNameInput) {
                const enteredName = playerNameInput.value.trim();
                
                if (enteredName) {
                    // 2. Guardar el nombre en localStorage
                    localStorage.setItem('playerName', enteredName);
                    console.log(`Nombre guardado: ${enteredName}.`);
                    
                    // Si el formulario NO tiene un action="games.html" y la redirección debe ser por JS:
                    // event.preventDefault(); // Descomentar si es necesario
                    // window.location.href = 'games.html'; // Descomentar y ajustar si es necesario
                    
                    // Si el formulario SÍ tiene action="games.html" o el botón es type="submit"
                    // y naturalmente redirige, el localStorage.setItem se ejecutará ANTES
                    // de esa redirección. En ese caso, no se necesita event.preventDefault()
                    // ni window.location.href aquí.
                    // Por ahora, asumiremos que el form se encarga de la redirección a games.html
                    // (por ejemplo, si action="games.html" estuviera en el <form>)
                    // o que el botón submit inicia la navegación.

                } else {
                    // Opcional: manejar caso de nombre vacío si 'required' no es suficiente
                    console.log("El nombre no puede estar vacío.");
                    event.preventDefault(); // Prevenir envío si el nombre está vacío después de trim
                    if (playerNameInput) {
                        playerNameInput.focus();
                    }
                }
            } else {
                event.preventDefault(); // Si no hay input, prevenir.
            }
        });
    }

    // --- Manejo de Cookies y Privacidad (ejemplo) ---
    // Si tienes un banner de cookies con id 'cookieConsentBanner'
    // y un botón de aceptar con id 'acceptCookieButton'
    const cookieBanner = document.getElementById('cookieConsentBanner');
    const acceptButton = document.getElementById('acceptCookieButton');

    if (cookieBanner && acceptButton) {
        // Comprobar si ya se aceptaron las cookies
        if (!localStorage.getItem('cookiesAccepted')) {
            cookieBanner.style.display = 'block'; // o 'flex', según tu CSS
        }

        acceptButton.addEventListener('click', function() {
            localStorage.setItem('cookiesAccepted', 'true');
            cookieBanner.style.display = 'none';
            // Aquí podrías inicializar scripts de tracking/analíticas que dependen del consentimiento
            // por ejemplo, reactivar gtag o similar.
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
                    const saveButton = changeNameForm.querySelector('.save-button');
                    const cancelButton = changeNameForm.querySelector('.cancel-button');
                    
                    if (newName) {
                        // Disable buttons during save
                        if(saveButton) saveButton.disabled = true;
                        if(cancelButton) cancelButton.disabled = true;

                        localStorage.setItem('playerName', newName);
                        playerNameDisplay.textContent = newName;
                        changeNameModal.classList.remove('active');
                        playerName = newName;

                        // Actualizar cualquier otro elemento con nombre de jugador
                        document.querySelectorAll('.player-name').forEach(element => {
                            element.textContent = newName;
                        });
                        // Re-enable buttons after a short delay (optional, or keep disabled)
                        // setTimeout(() => {
                        //    if(saveButton) saveButton.disabled = false;
                        //    if(cancelButton) cancelButton.disabled = false;
                        // }, 300); 
                    } // Re-enable buttons if save fails (e.g., empty name)? 
                      // Currently, buttons remain disabled if newName is empty.
                      // Consider re-enabling them in an else block if desired.
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
            // We need the button inside the card to check if it's disabled
            const playButton = card.querySelector('.play-button');

            card.addEventListener('click', function(event) {
                // Prevent click if the button inside is disabled (e.g., Coming Soon)
                if (playButton && playButton.disabled) {
                    event.stopPropagation(); // Stop the event from bubbling/default action
                    return;
                }

                const gameType = this.getAttribute('data-game');

                if (gameType === 'quiensabemas') {
                    event.preventDefault(); // Prevent default navigation for QSM
                    event.stopPropagation(); // Stop event propagation
                    // Show the intro modal
                    if (qsmIntroModal) {
                        qsmIntroModal.classList.add('active');
                    }
                } else if (gameType) {
                    // For other games, navigate directly (original behavior)
                window.location.href = `${gameType}.html`;
                } 
                // If gameType is null/undefined (e.g. clicked on empty space), do nothing
            });
        });
    }

    // --- Event Listener for QSM Intro Modal Button ---
    if (goToLobbyQSMButton && qsmIntroModal) {
        goToLobbyQSMButton.addEventListener('click', function() {
            qsmIntroModal.classList.remove('active'); // Hide modal
            window.location.href = 'quiensabemas.html'; // Navigate to the game lobby
        });
    }

    // --- Optional: Close modal if clicking outside the content ---
    if (qsmIntroModal) {
        qsmIntroModal.addEventListener('click', function(event) {
            // Check if the click is directly on the overlay (not the content)
            if (event.target === qsmIntroModal) {
                qsmIntroModal.classList.remove('active');
            }
        });
    }
    // --- End Modal Logic ---

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
        title: document.title, // Usa el título de la página actual
        text: '¡Juega y demuestra tus conocimientos de fútbol en Crack Total!', // Texto a compartir
        url: window.location.href // URL de la página actual
    };

    try {
        // Comprobar si la API Web Share es compatible
        if (navigator.share) {
            await navigator.share(shareData);
            console.log('Contenido compartido exitosamente!');
        } else {
            // Fallback para navegadores que no soportan Web Share
            // Podríamos mostrar un modal personalizado aquí en lugar de un alert
            alert('Tu navegador no soporta la función de compartir. Por favor, copia el enlace manualmente: ' + window.location.href);
            // O intentar copiar al portapapeles si es posible
            // navigator.clipboard.writeText(window.location.href).then(() => alert('Enlace copiado al portapapeles')).catch(err => console.error('Error al copiar:', err));
        }
    } catch (err) {
        console.error('Error al compartir: ', err);
        // Solo mostrar error si no es porque el usuario canceló
        if (err.name !== 'AbortError') {
            alert('Hubo un error al intentar compartir.');
        }
    }
} 