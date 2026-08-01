// Integración del sistema de notificaciones
window.addEventListener('load', () => {
    // Verificar que el sistema de notificaciones esté disponible
    if (typeof window.notifications !== 'undefined') {
        console.log('[Main] Sistema de notificaciones integrado correctamente');
        
        // Mostrar notificación de bienvenida si es la primera visita
        const isFirstVisit = !localStorage.getItem('hasVisited');
        if (isFirstVisit) {
            setTimeout(() => {
                window.notifications.info(
                    '¡Bienvenido a Crack Total!', 
                    'Descubre todo tu conocimiento sobre fútbol en nuestros juegos',
                    { duration: 6000 }
                );
                localStorage.setItem('hasVisited', 'true');
            }, 2000);
        }
        
        // Notificar actualizaciones del Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_UPDATED') {
                    // Auto-reload suave para tomar la última versión
                    const currentUrl = new URL(window.location.href);
                    currentUrl.searchParams.set('v', Date.now().toString());
                    window.location.replace(currentUrl.toString());
                }
            });
        }
    } else {
        console.warn('[Main] Sistema de notificaciones no disponible');
    }
});

// Lista de palabras prohibidas (ejemplos, puedes ampliarla)
const BANNED_WORDS = ["pene", "pelotudo", "puto", "chota"]; // Ajuste de lista para evitar términos sensibles

// Función para validar el nombre del jugador
function isValidPlayerName(name) {
    if (window.CrackTotalProfile?.validatePlayerName) {
        const validation = window.CrackTotalProfile.validatePlayerName(name);
        return { valid: validation.valid, message: validation.message };
    }
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

// Función global para actualizar todos los elementos de nombre de jugador
function updateAllPlayerNameElements() {
    const savedPlayerName = localStorage.getItem('playerName');
    const playerName = savedPlayerName || 'Invitado';
    console.log(`Actualizando todos los elementos de nombre con: ${playerName}`);
    
    // Actualizar playerNameDisplay específicamente
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    if (playerNameDisplay) {
        playerNameDisplay.textContent = playerName;
        console.log(`✓ playerNameDisplay actualizado: ${playerName}`);
    }
    
    // Actualizar otros elementos con clase player-name
    const playerNameElements = document.querySelectorAll('.player-name');
    playerNameElements.forEach(element => {
        if (element.tagName !== 'INPUT' || !element.value || element.value === 'Jugador' || element.value === 'Jugador 1' || element.value === 'Jugador 2') {
            element.textContent = playerName;
        }
        if (savedPlayerName && (element.id === 'createPlayerName' || element.id === 'joinPlayerName')){
            element.value = playerName;
        }
    });
    
    // Actualizar span con clase player-highlight (por si acaso)
    const playerHighlightElements = document.querySelectorAll('.player-highlight');
    playerHighlightElements.forEach(element => {
        if (element.id === 'playerNameDisplay' || !element.textContent || element.textContent === 'Jugador' || element.textContent === 'Invitado') {
            element.textContent = playerName;
        }
    });
}

// Synchronize the optional player profile across pages.
document.addEventListener('DOMContentLoaded', function() {
    const createPlayerNameLobbyInput = document.getElementById('createPlayerName');
    const joinPlayerNameLobbyInput = document.getElementById('joinPlayerName');

    const savedPlayerName = localStorage.getItem('playerName');
    if (savedPlayerName) {
        if (createPlayerNameLobbyInput) {
            createPlayerNameLobbyInput.value = savedPlayerName;
        }
        if (joinPlayerNameLobbyInput) {
            joinPlayerNameLobbyInput.value = savedPlayerName;
        }
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

    // Consentimiento y cookies gestionado por assets/js/cookie-consent.js (se elimina banner duplicado)

    // Check if we're on the games page and setup player name display
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    if (playerNameDisplay) {
        // Get current player name from localStorage, use 'Jugador' as fallback only if no name exists
        const currentPlayerName = localStorage.getItem('playerName');
        let displayName = currentPlayerName || 'Invitado';
        
        // Always display the actual saved name
        playerNameDisplay.textContent = displayName;
        console.log(`Nombre actualizado en playerNameDisplay: ${displayName}`);
        
        // Configurar el cambio de nombre
        const changeNameBtn = document.getElementById('changeNameBtn');
        const changeNameModal = document.getElementById('changeNameModal');
        const changeNameForm = document.getElementById('changeNameForm');
        const cancelNameChange = document.getElementById('cancelNameChange');
        const newPlayerNameInput = document.getElementById('newPlayerName');
        const changeNameErrorDiv = document.getElementById('changeNameError'); // Para errores en el modal

        if (changeNameBtn && !currentPlayerName) {
            const textNode = Array.from(changeNameBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) textNode.textContent = ' Crear perfil';
        }
        
        if (changeNameBtn && changeNameModal) {
            changeNameBtn.addEventListener('click', async function() {
                if (window.CrackTotalProfile) {
                    const hasProfile = Boolean(window.CrackTotalProfile.getPlayerName());
                    const name = await window.CrackTotalProfile.ensurePlayerName({
                        reason: hasProfile ? 'change-name' : 'create-profile',
                        force: hasProfile
                    });
                    if (name) {
                        displayName = name;
                        updateAllPlayerNameElements();
                        const textNode = Array.from(changeNameBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                        if (textNode) textNode.textContent = ' Cambiar';
                    }
                    return;
                }
                if (newPlayerNameInput) {
                    newPlayerNameInput.value = displayName;
                }
                if(changeNameErrorDiv) changeNameErrorDiv.textContent = ''; // Limpiar errores previos
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
                    const validation = isValidPlayerName(newName);
                    const saveButton = changeNameForm.querySelector('.save-button');
                    const cancelButton = changeNameForm.querySelector('.cancel-button');
                    
                    if (validation.valid) {
                        if(saveButton) saveButton.disabled = true;
                        if(cancelButton) cancelButton.disabled = true;
                        if(changeNameErrorDiv) changeNameErrorDiv.textContent = ''; // Limpiar error

                        localStorage.setItem('playerName', newName);
                        
                        // -- NUEVO: Actualizar perfil de Firebase --
                        if (window.CrackTotalFirebase) {
                            window.CrackTotalFirebase.updateUserProfile(newName);
                        }
                        // -- FIN NUEVO --

                        console.log(`Nombre cambiado a: ${newName}`);
                        
                        // Usar la función de actualización centralizada
                        updateAllPlayerNameElements();
                        
                        changeNameModal.classList.remove('active');
                        displayName = newName; // Update local variable
                         // Habilitar botones después de un breve retraso para evitar doble submit si algo falla
                        setTimeout(() => {
                            if(saveButton) saveButton.disabled = false;
                            if(cancelButton) cancelButton.disabled = false;
                        }, 300);

                    } else {
                        console.log("Validación de cambio de nombre fallida:", validation.message);
                        if (changeNameErrorDiv) {
                            changeNameErrorDiv.textContent = validation.message;
                            changeNameErrorDiv.style.display = 'block';
                        } else {
                            alert(validation.message); // Fallback
                        }
                        newPlayerNameInput.focus();
                    }
                });
            }
            
            // Close modal when clicking outside - move this inside the scope where changeNameModal is defined
            window.addEventListener('click', function(e) {
                if (e.target === changeNameModal) {
                    changeNameModal.classList.remove('active');
                }
            });
        }
    }

    // --- Get Modal Elements --- 
    const qsmIntroModal = document.getElementById('qsmIntroModal');
    const goToLobbyQSMButton = document.getElementById('goToLobbyQSMButton');

    // Handle clicking on game cards
    const gameCards = document.querySelectorAll('.cosmic-game-card, .game-card');
    if (gameCards.length > 0) {
        // Skip adding event listeners here as they're now handled in games.html
        // This prevents duplicate event handlers
        console.log("Game cards found, but event handlers are in games.html");
    }

    // These handlers will only trigger if games.html doesn't handle them
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
        const currentSavedPlayerName = localStorage.getItem('playerName') || 'Invitado';
        const hasSavedPlayerName = Boolean(localStorage.getItem('playerName'));
        playerNameElements.forEach(element => {
            if (element.tagName !== 'INPUT' || !element.value || element.value === 'Jugador 1' || element.value === 'Jugador 2') {
                 element.textContent = currentSavedPlayerName;
            }
            if (hasSavedPlayerName && (element.id === 'createPlayerName' || element.id === 'joinPlayerName')){
                if(element.value !== currentSavedPlayerName) element.value = currentSavedPlayerName;
            }
        });
    }



    // Ejecutar actualización después de que todo esté cargado
    setTimeout(() => {
        updateAllPlayerNameElements();
    }, 100);

    // También actualizar cuando el DOM esté completamente listo
    if (document.readyState === 'complete') {
        setTimeout(updateAllPlayerNameElements, 50);
    } else {
        window.addEventListener('load', () => {
            setTimeout(updateAllPlayerNameElements, 50);
        });
    }

    // Actualización adicional al final de DOMContentLoaded
    setTimeout(() => {
        console.log('Ejecutando actualización final de nombre de jugador...');
        updateAllPlayerNameElements();
    }, 200);

    // Listener para cambios en localStorage (por si se actualiza desde otra pestaña)
    window.addEventListener('storage', function(e) {
        if (e.key === 'playerName') {
            console.log('Detectado cambio en playerName desde otra pestaña:', e.newValue);
            updateAllPlayerNameElements();
        }
    });

    // Inicializar tabs de salas disponibles
    const roomTabs = document.querySelectorAll('.room-tab-button');
    const gameRoomsContainers = document.querySelectorAll('.game-rooms');
    
    if (roomTabs.length > 0) {
        roomTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const gameType = this.getAttribute('data-game');
                
                // Cambiar tabs activas
                roomTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Cambiar contenedores activos
                gameRoomsContainers.forEach(container => {
                    container.classList.remove('active');
                });
                document.getElementById(`${gameType}-rooms`).classList.add('active');
            });
        });
        
        // Cargar salas al inicio
        const initialGameType = roomTabs[0].getAttribute('data-game');
        fetchRooms(initialGameType);
        
        // Si hay más tabs, cargar también las del segundo juego
        if (roomTabs.length > 1) {
            const secondGameType = roomTabs[1].getAttribute('data-game');
            fetchRooms(secondGameType);
        }
    }
    
    // Botones de actualizar salas
    const refreshButtons = document.querySelectorAll('.refresh-rooms-button');
    if (refreshButtons.length > 0) {
        refreshButtons.forEach(button => {
            button.addEventListener('click', function() {
                const gameType = this.getAttribute('data-game');
                if (gameType) {
                    // Añadir clase de rotación al icono de actualizar
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.add('fa-spin');
                        setTimeout(() => {
                            icon.classList.remove('fa-spin');
                        }, 1000);
                    }
                    
                    fetchRooms(gameType);
                }
            });
        });
    }
    
    // Botón de jugar QSM en el modal ya está manejado arriba
    // No necesitamos redeclararlo aquí
    
    // Si la URL tiene el parámetro showQSMIntro, mostrar el modal
    const urlParams = new URLSearchParams(window.location.search);
    const showQSMIntro = urlParams.get('showQSMIntro');
    if (showQSMIntro === 'true') {
        const qsmIntroModal = document.getElementById('qsmIntroModal');
        if (qsmIntroModal) qsmIntroModal.classList.add('active');
    }

    // Cargar salas iniciales para la pestaña activa
    const activeTab = document.querySelector('.room-tab-button.active');
    if (activeTab) {
        const gameType = activeTab.getAttribute('data-game');
        fetchRooms(gameType);
    }
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
/* COMENTADO PARA EVITAR CONFLICTOS CON games.html
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
            
            // Mostrar el contenedor correspondiente
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
*/ // FIN COMENTADO PARA EVITAR CONFLICTOS CON games.html

/* ========================================= */
/* ======= NAVEGACIÓN MOBILE HAMBURGUESA === */
/* ========================================= */

/**
 * Inicializar menú de navegación mobile
 */
function initMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navUl = document.querySelector('.main-navigation ul');
    
    if (!navToggle || !navUl) return;
    
    // Toggle menu mobile
    navToggle.addEventListener('click', () => {
        navUl.classList.toggle('active');
        navToggle.classList.toggle('active');
        
        // Actualizar aria-expanded para accesibilidad
        const isExpanded = navUl.classList.contains('active');
        navToggle.setAttribute('aria-expanded', isExpanded);
        
        // Prevenir scroll del body cuando el menú está abierto
        document.body.style.overflow = isExpanded ? 'hidden' : '';
    });
    
    // Cerrar menú al hacer clic en un enlace
    const navLinks = navUl.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navUl.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });
    
    // Cerrar menú con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navUl.classList.contains('active')) {
            navUl.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            navToggle.focus();
        }
    });
    
    // Cerrar menú al cambiar tamaño de ventana
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navUl.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });
}

/**
 * Marcar página actual en navegación
 */
function setActiveNavItem() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-navigation a');
    
    navLinks.forEach(link => {
        // Remover clases/atributos activos existentes
        link.classList.remove('active');
        link.removeAttribute('aria-current');
        
        // Obtener el href del enlace
        const linkPath = new URL(link.href).pathname;
        
        // Comparar rutas
        if (currentPage === linkPath || 
            (currentPage === '/' && linkPath.endsWith('index.html')) ||
            (currentPage.endsWith('index.html') && linkPath === '/')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

// Inicializar navegación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initMobileNavigation();
    setActiveNavItem();
});

/* ========================================= */
/* ========== SERVICE WORKER SETUP ========= */
/* ========================================= */

/**
 * Registrar Service Worker para funcionalidad PWA
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registrado exitosamente:', registration.scope);
                
                // Verificar actualizaciones periódicamente
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🆕 Nueva versión del Service Worker disponible');
                            
                            // Comentado: Evitar mostrar diálogo automático en cada recarga
                            // if (confirm('Hay una nueva versión disponible. ¿Quieres recargar la página?')) {
                            //     window.location.reload();
                            // }
                        }
                    });
                });
            })
            .catch(error => {
                console.error('❌ Error al registrar Service Worker:', error);
            });
    } else {
        console.log('⚠️ Service Workers no soportados en este navegador');
    }
}

// Registrar Service Worker cuando la página esté cargada
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerServiceWorker);
} else {
    registerServiceWorker();
}

// Mostrar tiempo jugado al usuario
let sessionTime = 0;
setInterval(() => {
    sessionTime++;
    if (sessionTime % 60 === 0) {
        console.log(`🎮 Llevas ${sessionTime/60} minutos jugando!`);
    }
}, 1000);

// Inicialización del Service Worker (DESACTIVADO PERMANENTEMENTE)
/*
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker de limpieza registrado:', registration);
            })
            .catch(error => {
                console.error('Error al registrar el Service Worker de limpieza:', error);
            });
    });
}
*/

// Limpieza de snippet incompleto que causaba errores de parseo