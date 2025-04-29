// Store player name in local storage
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the home page
    const nameForm = document.getElementById('nameForm');
    if (nameForm) {
        // Si ya hay un nombre guardado, redirigir directamente a games.html
        const existingName = sessionStorage.getItem('playerName');
        if (existingName) {
            window.location.href = 'games.html';
            return;
        }
        
        nameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const playerName = document.getElementById('playerName').value.trim();
            
            if (playerName) {
                // Save the name to session storage
                sessionStorage.setItem('playerName', playerName);
                // Redirect to game selection page
                window.location.href = 'games.html';
            }
        });
    }

    // Check if we're on the games page
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    if (playerNameDisplay) {
        let playerName = sessionStorage.getItem('playerName') || 'Jugador';
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
                        sessionStorage.setItem('playerName', newName);
                        playerNameDisplay.textContent = newName;
                        changeNameModal.classList.remove('active');
                        playerName = newName;

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
        const playerName = sessionStorage.getItem('playerName') || 'Jugador';
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