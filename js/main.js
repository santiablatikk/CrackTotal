// IIFE para encapsular y ejecutar inmediatamente
(function() {
    const playerName = localStorage.getItem('playerName');
    const currentPagePath = window.location.pathname;
    const isIndexPage = (currentPagePath === '/' || currentPagePath.endsWith('/index.html'));

    if (!playerName && !isIndexPage) {
        window.location.href = '/';
    }
})();

// Lista de palabras prohibidas (ejemplos, puedes ampliarla)
const BANNED_WORDS = ["pene", "pelotudo", "puto", "gay", "chota"]; // Añade más palabras según necesites

// Función para validar el nombre del jugador
function isValidPlayerName(name) {
    if (!name || name.trim() === "") {
        return { valid: false, message: "El nombre no puede estar vacío." };
    }
    const lowerCaseName = name.toLowerCase();
    for (const bannedWord of BANNED_WORDS) {
        if (lowerCaseName.includes(bannedWord.toLowerCase())) {
            return { valid: false, message: `El nombre contiene una palabra no permitida: "${bannedWord}".` };
        }
    }
    if (name.length > 20) { // Límite de longitud ejemplo
        return { valid: false, message: "El nombre no puede tener más de 20 caracteres." };
    }
    // Puedes añadir más validaciones aquí (ej. caracteres especiales no permitidos)
    return { valid: true, message: "Nombre válido." };
}

function setupNamePersistence() {
    const nameForm = document.getElementById('nameForm');
    const playerNameInput = document.getElementById('playerName');
    const createPlayerNameLobbyInput = document.getElementById('createPlayerName');
    const joinPlayerNameLobbyInput = document.getElementById('joinPlayerName');
    const nameErrorDiv = document.getElementById('nameError');

    const savedPlayerName = localStorage.getItem('playerName');
    if (savedPlayerName) {
        if (playerNameInput) playerNameInput.value = savedPlayerName;
        if (createPlayerNameLobbyInput) createPlayerNameLobbyInput.value = savedPlayerName;
        if (joinPlayerNameLobbyInput) joinPlayerNameLobbyInput.value = savedPlayerName;
    }

    if (nameForm && playerNameInput) {
        nameForm.addEventListener('submit', function(event) {
            const enteredName = playerNameInput.value.trim();
            const validation = isValidPlayerName(enteredName);
            if (validation.valid) {
                event.preventDefault();
                localStorage.setItem('playerName', enteredName);
                if (nameErrorDiv) nameErrorDiv.textContent = '';
                window.location.href = 'games.html';
            } else {
                event.preventDefault();
                if (nameErrorDiv) {
                    nameErrorDiv.textContent = validation.message;
                    nameErrorDiv.style.display = 'block';
                } else {
                    alert(validation.message);
                }
                playerNameInput.focus();
            }
        });
    }
}

function setupPlayerNameDisplayAndChange() {
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const changeNameBtn = document.getElementById('changeNameBtn');
    const changeNameModal = document.getElementById('changeNameModal');
    const changeNameForm = document.getElementById('changeNameForm');
    const cancelNameChange = document.getElementById('cancelNameChange');
    const newPlayerNameInput = document.getElementById('newPlayerName');
    const changeNameErrorDiv = document.getElementById('changeNameError');
    let localPlayerName = localStorage.getItem('playerName') || 'Jugador';

    if (playerNameDisplay) {
        playerNameDisplay.textContent = localPlayerName;
    }

    if (changeNameBtn && changeNameModal && newPlayerNameInput) {
        changeNameBtn.addEventListener('click', function() {
            newPlayerNameInput.value = localPlayerName;
            if (changeNameErrorDiv) changeNameErrorDiv.textContent = '';
            changeNameModal.classList.add('active');
        });
    }

    if (cancelNameChange && changeNameModal) {
        cancelNameChange.addEventListener('click', function() {
            changeNameModal.classList.remove('active');
        });
    }

    if (changeNameForm && newPlayerNameInput && changeNameModal && playerNameDisplay) {
        changeNameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const newName = newPlayerNameInput.value.trim();
            const validation = isValidPlayerName(newName);
            const saveButton = changeNameForm.querySelector('.save-button');
            const cancelButton = changeNameForm.querySelector('.cancel-button');

            if (validation.valid) {
                if (saveButton) saveButton.disabled = true;
                if (cancelButton) cancelButton.disabled = true;
                if (changeNameErrorDiv) changeNameErrorDiv.textContent = '';

                localStorage.setItem('playerName', newName);
                playerNameDisplay.textContent = newName;
                localPlayerName = newName; // Update local variable
                changeNameModal.classList.remove('active');

                document.querySelectorAll('.player-name').forEach(element => {
                    if (element.tagName !== 'INPUT' || !element.value || element.value === 'Jugador 1' || element.value === 'Jugador 2') {
                        element.textContent = newName;
                    }
                    if (element.id === 'createPlayerName' || element.id === 'joinPlayerName') {
                        if (element.value !== newName) element.value = newName;
                    }
                });
                setTimeout(() => {
                    if (saveButton) saveButton.disabled = false;
                    if (cancelButton) cancelButton.disabled = false;
                }, 300);
            } else {
                if (changeNameErrorDiv) {
                    changeNameErrorDiv.textContent = validation.message;
                    changeNameErrorDiv.style.display = 'block';
                } else {
                    alert(validation.message);
                }
                newPlayerNameInput.focus();
            }
        });
    }
    
    // Update player name in various game lobby inputs if on specific game pages
    if (window.location.pathname.includes('quiensabemas.html') || window.location.pathname.includes('mentiroso.html')) {
        const createNameInput = document.getElementById('createPlayerName');
        const joinNameInput = document.getElementById('joinPlayerName');
        if (createNameInput && createNameInput.value !== localPlayerName) createNameInput.value = localPlayerName;
        if (joinNameInput && joinNameInput.value !== localPlayerName) joinNameInput.value = localPlayerName;
    }
}

function setupGameCardInteractions() {
    const qsmIntroModal = document.getElementById('qsmIntroModal');
    const mentirosoIntroModal = document.getElementById('mentirosoIntroModal');
    const gameCards = document.querySelectorAll('.game-card');

    gameCards.forEach(card => {
        const playButton = card.querySelector('.play-button');
        card.addEventListener('click', function(event) {
            if (playButton && playButton.disabled) {
                event.stopPropagation();
                return;
            }
            const gameType = this.getAttribute('data-game');
            if (gameType === 'quiensabemas' && qsmIntroModal) {
                event.preventDefault();
                event.stopPropagation();
                qsmIntroModal.classList.add('active');
            } else if (gameType === 'mentiroso' && mentirosoIntroModal) {
                event.preventDefault();
                event.stopPropagation();
                mentirosoIntroModal.classList.add('active');
            } else if (gameType) {
                window.location.href = `${gameType}.html`;
            }
        });
    });
}

function setupModalNavigation() {
    const qsmIntroModal = document.getElementById('qsmIntroModal');
    const goToLobbyQSMButton = document.getElementById('goToLobbyQSMButton');
    const mentirosoIntroModal = document.getElementById('mentirosoIntroModal');
    const goToLobbyMentirosoButton = document.getElementById('goToLobbyMentirosoButton');

    if (goToLobbyQSMButton && qsmIntroModal) {
        goToLobbyQSMButton.addEventListener('click', function() {
            qsmIntroModal.classList.remove('active');
            window.location.href = 'quiensabemas.html';
        });
    }
    if (qsmIntroModal) {
        qsmIntroModal.addEventListener('click', function(event) {
            if (event.target === qsmIntroModal) qsmIntroModal.classList.remove('active');
        });
    }

    if (goToLobbyMentirosoButton && mentirosoIntroModal) {
        goToLobbyMentirosoButton.addEventListener('click', function() {
            mentirosoIntroModal.classList.remove('active');
            window.location.href = 'mentiroso.html';
        });
    }
    if (mentirosoIntroModal) {
        mentirosoIntroModal.addEventListener('click', function(event) {
            if (event.target === mentirosoIntroModal) mentirosoIntroModal.classList.remove('active');
        });
    }
}

function setupBackButtonNavigation() {
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            window.location.href = 'games.html';
        });
    });
}

function setupCookieConsentBanner() {
    const AD_CONSENT_KEY = 'adConsent';
    let cookieBanner = document.getElementById('cookieConsentBanner');
    if (!cookieBanner) {
        const bannerHTML = `
            <div id="cookieConsentBanner" style="display: none; position: fixed; bottom: 0; left: 0; width: 100%; background-color: #2c3e50; color: white; padding: 15px; text-align: center; z-index: 10000; border-top: 3px solid var(--primary); box-shadow: 0 -2px 10px rgba(0,0,0,0.2);">
                <p style="margin: 0 0 10px 0; font-size: 0.9em;">Utilizamos cookies para mejorar tu experiencia y mostrar anuncios personalizados. Al continuar navegando, aceptas nuestro uso de cookies. Consulta nuestra <a href="cookies.html" style="color: var(--primary-light); text-decoration: underline;">Política de Cookies</a> y <a href="privacy.html" style="color: var(--primary-light); text-decoration: underline;">Política de Privacidad</a>.</p>
                <button id="acceptCookieButton" style="background-color: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; transition: background-color 0.3s ease;">ACEPTAR</button>
                <button id="rejectCookieButton" style="background-color: #7f8c8d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-left: 10px; transition: background-color 0.3s ease;">RECHAZAR</button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', bannerHTML);
        cookieBanner = document.getElementById('cookieConsentBanner');
    }

    const acceptButton = document.getElementById('acceptCookieButton');
    const rejectButton = document.getElementById('rejectCookieButton');

    if (cookieBanner && acceptButton && rejectButton) {
        if (!localStorage.getItem(AD_CONSENT_KEY)) {
            cookieBanner.style.display = 'block';
        }
        acceptButton.addEventListener('click', function() {
            localStorage.setItem(AD_CONSENT_KEY, 'true');
            cookieBanner.style.display = 'none';
            if (typeof window.loadAds === 'function') window.loadAds();
        });
        rejectButton.addEventListener('click', function() {
            localStorage.setItem(AD_CONSENT_KEY, 'false');
            cookieBanner.style.display = 'none';
            document.querySelectorAll(".adsense-container").forEach(container => container.style.display = "none");
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setupNamePersistence(); // Handles index.html name form and pre-filling lobby inputs
    
    if (window.location.pathname.includes('games.html')) {
        setupPlayerNameDisplayAndChange();
        setupGameCardInteractions();
        setupModalNavigation();
        setupCookieConsentBanner();
         // Initialize room tabs and fetching for games.html
        const roomTabs = document.querySelectorAll('.room-tab-button');
        const gameRoomsContainers = document.querySelectorAll('.game-rooms');
        const refreshButtons = document.querySelectorAll('.refresh-rooms-button');

        if (roomTabs.length > 0) {
            roomTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const gameType = this.getAttribute('data-game');
                    roomTabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    gameRoomsContainers.forEach(container => container.classList.remove('active'));
                    const targetContainer = document.getElementById(`${gameType}-rooms`);
                    if (targetContainer) targetContainer.classList.add('active');
                    fetchRooms(gameType); // Fetch rooms when tab is clicked
                });
            });

            // Load rooms for the initially active tab
            const activeTab = document.querySelector('.room-tab-button.active');
            if (activeTab) {
                fetchRooms(activeTab.getAttribute('data-game'));
            } else if (roomTabs.length > 0) {
                // Default to the first tab if none are active
                roomTabs[0].classList.add('active');
                 const initialGameType = roomTabs[0].getAttribute('data-game');
                 const initialContainer = document.getElementById(`${initialGameType}-rooms`);
                 if(initialContainer) initialContainer.classList.add('active');
                fetchRooms(initialGameType);
            }
        }

        if (refreshButtons.length > 0) {
            refreshButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const gameType = this.getAttribute('data-game');
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.add('fa-spin');
                        setTimeout(() => icon.classList.remove('fa-spin'), 1000);
                    }
                    fetchRooms(gameType);
                });
            });
        }
    } else if (!window.location.pathname.includes('index.html')) {
        // For other pages like individual game pages
        setupPlayerNameDisplayAndChange(); // So name change modal works
        setupBackButtonNavigation();
    }
    
    // Generic player name update for elements with class 'player-name' (e.g., in game headers)
    const currentSavedPlayerName = localStorage.getItem('playerName') || 'Jugador';
    document.querySelectorAll('.player-name').forEach(element => {
        if (element.tagName !== 'INPUT' || !element.value || element.value === 'Jugador 1' || element.value === 'Jugador 2') {
             element.textContent = currentSavedPlayerName;
        }
    });
});

// Animation helpers
function animateElement(element, animationClass) {
    element.classList.add(animationClass);
    element.addEventListener('animationend', () => {
        element.classList.remove(animationClass);
    }, { once: true });
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
        title: 'Crack Total',
        text: '¡Demostrame cuánto sabés de fútbol! Trivia y juegos de conocimiento futbolero.',
        url: 'https://cracktotal.com'
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // Fallback: Copiar al portapapeles
            navigator.clipboard.writeText(`${shareData.title} - ${shareData.text} ${shareData.url}`);
            alert('¡Enlace copiado al portapapeles! Compartí con tus amigos.');
        }
    } catch (err) {
        console.error('Error al compartir:', err);
    }
}

// Funciones para gestionar las salas disponibles en games.html
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página games.html
    if (!document.querySelector('.available-rooms-section')) return;
    
    // Referencias a elementos DOM
    const roomTabs = document.querySelectorAll('.room-tab-button');
    const gameRoomsContainers = document.querySelectorAll('.game-rooms');
    const refreshButtons = document.querySelectorAll('.refresh-rooms-button');
    
    // Manejo de pestañas
    roomTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const gameType = this.getAttribute('data-game');
            
            // Actualizar pestañas activas
            roomTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Cambiar contenedores activos
            gameRoomsContainers.forEach(container => {
                container.classList.remove('active');
            });
            document.getElementById(`${gameType}-rooms`).classList.add('active');
            
            // Cargar salas al cambiar de pestaña
            fetchRooms(gameType);
        });
    });
    
    // Manejo de botones de actualización
    refreshButtons.forEach(button => {
        button.addEventListener('click', function() {
            const gameType = this.getAttribute('data-game');
            fetchRooms(gameType);
            
            // Efecto visual de rotación
            const icon = this.querySelector('i');
            icon.style.transition = 'transform 0.5s ease';
            icon.style.transform = 'rotate(360deg)';
            
            // Restablecer después de la animación
            setTimeout(() => {
                icon.style.transition = 'none';
                icon.style.transform = 'rotate(0deg)';
            }, 500);
        });
    });
    
    // Función para obtener salas desde el servidor
    function fetchRooms(gameType) {
        const roomsList = document.getElementById(`${gameType}-rooms-list`);
        
        // Mostrar cargando
        roomsList.innerHTML = `
            <li class="loading-rooms">
                <span class="spinner-lobby"></span> Cargando salas...
            </li>
        `;
        
        // Crear un elemento iframe oculto para comunicarse con la página del juego
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = gameType === 'quiensabemas' ? 'quiensabemas.html' : 'mentiroso.html';
        document.body.appendChild(iframe);
        
        // Variables para controlar el timeout
        let timeoutId;
        let messageReceived = false;
        
        // Esperar a que el iframe cargue
        iframe.onload = function() {
            // Crear un timeout de 5 segundos
            timeoutId = setTimeout(() => {
                if (!messageReceived) {
                    console.log(`Timeout al solicitar salas de ${gameType}`);
                    cleanup();
                    roomsList.innerHTML = `
                        <li class="no-rooms-message">
                            <i class="fas fa-exclamation-circle"></i> No se pudieron cargar las salas. Intenta nuevamente.
                        </li>
                    `;
                }
            }, 5000);
            
            // Escuchar mensaje del iframe con las salas
            function messageHandler(event) {
                // Verificar que el mensaje sea de nuestro dominio
                if (event.origin !== window.location.origin) return;
                
                // Verificar que sea el mensaje de salas que esperamos
                if (event.data && event.data.type === 'availableRooms' && event.data.gameType === gameType) {
                    messageReceived = true;
                    clearTimeout(timeoutId);
                    
                    const rooms = event.data.rooms || [];
                    renderRooms(roomsList, rooms, gameType);
                    
                    cleanup();
                }
            }
            
            window.addEventListener('message', messageHandler);
            
            // Función para limpiar recursos
            function cleanup() {
                clearTimeout(timeoutId);
                window.removeEventListener('message', messageHandler);
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }
            
            // Pedir las salas al iframe
            setTimeout(() => {
                if (iframe.contentWindow) {
                    console.log(`Solicitando salas de ${gameType}...`);
                    iframe.contentWindow.postMessage({ type: 'requestRooms', gameType: gameType }, '*');
                }
            }, 500); // Pequeño retraso para asegurar que el iframe está listo
        };
        
        // Manejar errores de carga del iframe
        iframe.onerror = function() {
            console.error(`Error al cargar iframe para ${gameType}`);
            document.body.removeChild(iframe);
            roomsList.innerHTML = `
                <li class="no-rooms-message">
                    <i class="fas fa-exclamation-circle"></i> Error al cargar el juego. Intenta nuevamente.
                </li>
            `;
        };
    }
    
    // Función para renderizar salas en la lista
    function renderRooms(container, rooms, gameType) {
        if (!container) return;
        
        container.innerHTML = '';
        
        // Si no hay salas disponibles
        if (!rooms || rooms.length === 0) {
            const gameNames = {
                'quiensabemas': 'Quien Sabe Más',
                'mentiroso': 'Mentiroso'
            };
            
            const gameName = gameNames[gameType] || gameType;
            const noRoomsMessage = document.createElement('li');
            noRoomsMessage.className = 'no-rooms-message';
            noRoomsMessage.innerHTML = `
                <div class="empty-rooms-container">
                    <i class="fas fa-door-closed"></i>
                    <p>No hay salas de ${gameName} disponibles en este momento</p>
                    <button class="create-room-button" data-game="${gameType}">
                        <i class="fas fa-plus-circle"></i> Crear una sala nueva
                    </button>
                </div>
            `;
            container.appendChild(noRoomsMessage);
            
            // Agregar evento al botón de crear sala
            const createButton = noRoomsMessage.querySelector('.create-room-button');
            if (createButton) {
                createButton.addEventListener('click', function() {
                    window.location.href = `${gameType}.html`;
                });
            }
            
            return;
        }
        
        // Mostrar el número de salas disponibles
        const roomCountHeader = document.createElement('li');
        roomCountHeader.className = 'rooms-count-header';
        roomCountHeader.innerHTML = `
            <div class="rooms-count">
                <i class="fas fa-door-open"></i> 
                <span>${rooms.length} ${rooms.length === 1 ? 'sala disponible' : 'salas disponibles'}</span>
            </div>
        `;
        container.appendChild(roomCountHeader);
        
        // Mostrar cada sala disponible
        rooms.forEach(room => {
            const roomItem = document.createElement('li');
            roomItem.className = 'room-item';
            roomItem.dataset.roomId = room.id;
            
            const roomInfo = document.createElement('div');
            roomInfo.className = 'room-info';
            roomInfo.innerHTML = `
                <span><i class="fas fa-hashtag"></i> <strong>${room.id}</strong></span>
                <span><i class="fas fa-user"></i> <strong>${room.creatorName || 'Anónimo'}</strong></span>
                <span><i class="fas fa-users"></i> <strong>${room.playerCount || 0}/${room.maxPlayers || 2}</strong></span>
                ${room.requiresPassword ? '<span><i class="fas fa-lock"></i> <strong>Privada</strong></span>' : ''}
            `;
            
            const joinButton = document.createElement('button');
            joinButton.className = 'join-room-list-btn';
            joinButton.disabled = (room.playerCount >= room.maxPlayers);
            joinButton.innerHTML = room.playerCount >= room.maxPlayers ? 
                '<i class="fas fa-ban"></i> Llena' : 
                '<i class="fas fa-sign-in-alt"></i> Unirse';
            
            joinButton.addEventListener('click', function() {
                // Guardar el ID de la sala en localStorage para auto-completar en la página del juego
                localStorage.setItem(`join_${gameType}_room_id`, room.id);
                window.location.href = `${gameType}.html`;
            });
            
            roomItem.appendChild(roomInfo);
            roomItem.appendChild(joinButton);
            container.appendChild(roomItem);
        });
    }
    
    // Cargar salas iniciales para la pestaña activa
    const activeTab = document.querySelector('.room-tab-button.active');
    if (activeTab) {
        const gameType = activeTab.getAttribute('data-game');
        fetchRooms(gameType);
    }
}); 