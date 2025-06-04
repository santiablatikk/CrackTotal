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
                    window.notifications.info(
                        'Nueva versión disponible',
                        'Crack Total se ha actualizado. La página se recargará automáticamente.',
                        {
                            persistent: true,
                            actions: [
                                {
                                    id: 'reload',
                                    label: 'Actualizar ahora',
                                    handler: () => window.location.reload()
                                }
                            ]
                        }
                    );
                }
            });
        }
    } else {
        console.warn('[Main] Sistema de notificaciones no disponible');
    }
});

// *** SISTEMA DE OPTIMIZACIÓN DE RENDIMIENTO ***
window.PerformanceManager = {
    // Cache para datos pesados
    cache: new Map(),
    
    // Indicadores de carga globales
    showLoadingIndicator: function(containerId, message = 'Cargando...') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const loadingHTML = `
            <div class="loading-indicator" style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                padding: 2rem; 
                text-align: center;
                animation: fadeIn 0.3s ease-in;
            ">
                <div class="loading-spinner" style="
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top: 3px solid var(--primary);
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    animation: spin 1s linear infinite;
                    margin-right: 15px;
                "></div>
                <span style="color: var(--text-light); font-weight: 500;">${message}</span>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            </style>
        `;
        container.innerHTML = loadingHTML;
    },
    
    hideLoadingIndicator: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const loadingIndicator = container.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (loadingIndicator.parentNode) {
                    loadingIndicator.remove();
                }
            }, 300);
        }
    },
    
    // Lazy loading para contenido pesado
    lazyLoad: function(callback, delay = 100) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const result = callback();
                resolve(result);
            }, delay);
        });
    },
    
    // Debounce para optimizar eventos
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle para scroll y resize
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
};

// Agregar CSS para fadeOut
const fadeOutCSS = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
const style = document.createElement('style');
style.textContent = fadeOutCSS;
document.head.appendChild(style);

// *** OPTIMIZACIÓN PARA LOGROS Y RANKINGS ***
window.addEventListener('DOMContentLoaded', () => {
    // Optimizar carga de logros
    const logrosContainer = document.getElementById('logrosContainer');
    if (logrosContainer) {
        window.PerformanceManager.showLoadingIndicator('logrosContainer', 'Cargando tus logros...');
    }
    
    // Optimizar carga de rankings
    const rankingContainer = document.querySelector('.ranking-container, .leaderboard-container');
    if (rankingContainer && rankingContainer.id) {
        window.PerformanceManager.showLoadingIndicator(rankingContainer.id, 'Cargando clasificaciones...');
    }
});

// *** DETECCIÓN DE COMPATIBILIDAD ***
window.BrowserCompatibility = {
    // Detectar navegador y versión
    detectBrowser: function() {
        const userAgent = navigator.userAgent;
        let browserName = "Unknown";
        let browserVersion = "Unknown";
        
        if (userAgent.indexOf("Chrome") > -1) {
            browserName = "Chrome";
            browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf("Firefox") > -1) {
            browserName = "Firefox";
            browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
            browserName = "Safari";
            browserVersion = userAgent.match(/Version\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf("Edge") > -1) {
            browserName = "Edge";
            browserVersion = userAgent.match(/Edge\/([0-9.]+)/)[1];
        }
        
        return { name: browserName, version: browserVersion };
    },
    
    // Verificar características soportadas
    checkFeatureSupport: function() {
        const features = {
            localStorage: typeof(Storage) !== "undefined",
            fetch: typeof fetch !== "undefined",
            promises: typeof Promise !== "undefined",
            css3: this.supportsCSSProperty('transform'),
            flexbox: this.supportsCSSProperty('display', 'flex'),
            grid: this.supportsCSSProperty('display', 'grid'),
            webp: this.supportsWebP(),
            serviceWorker: 'serviceWorker' in navigator
        };
        
        return features;
    },
    
    supportsCSSProperty: function(property, value = null) {
        const testElement = document.createElement('div');
        if (value) {
            testElement.style[property] = value;
            return testElement.style[property] === value;
        } else {
            return property in testElement.style;
        }
    },
    
    supportsWebP: function() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('webp') > -1;
    },
    
    // Mostrar advertencia si hay problemas de compatibilidad
    checkCompatibilityAndWarn: function() {
        const browser = this.detectBrowser();
        const features = this.checkFeatureSupport();
        
        console.log('Browser detected:', browser);
        console.log('Feature support:', features);
        
        // Advertir sobre navegadores muy antiguos
        if (browser.name === "Chrome" && parseInt(browser.version) < 70) {
            this.showCompatibilityWarning("Tu versión de Chrome es antigua. Actualiza para una mejor experiencia.");
        } else if (browser.name === "Firefox" && parseInt(browser.version) < 65) {
            this.showCompatibilityWarning("Tu versión de Firefox es antigua. Actualiza para una mejor experiencia.");
        } else if (browser.name === "Safari" && parseInt(browser.version) < 12) {
            this.showCompatibilityWarning("Tu versión de Safari es antigua. Actualiza para una mejor experiencia.");
        }
        
        // Advertir sobre características no soportadas
        if (!features.localStorage) {
            this.showCompatibilityWarning("Tu navegador no soporta almacenamiento local. Algunas funciones pueden no funcionar.");
        }
    },
    
    showCompatibilityWarning: function(message) {
        if (typeof window.notifications !== 'undefined') {
            window.notifications.warning('Compatibilidad', message, { duration: 8000 });
        } else {
            console.warn('Compatibility warning:', message);
        }
    }
};

// Ejecutar verificación de compatibilidad al cargar
window.addEventListener('load', () => {
    window.BrowserCompatibility.checkCompatibilityAndWarn();
});

// *** RESPONSIVE PERFORMANCE MONITORING ***
window.ResponsiveManager = {
    // Detectar tipo de dispositivo
    getDeviceType: function() {
        const width = window.innerWidth;
        if (width <= 480) return 'mobile';
        if (width <= 768) return 'tablet';
        return 'desktop';
    },
    
    // Optimizar según dispositivo
    optimizeForDevice: function() {
        const deviceType = this.getDeviceType();
        document.body.classList.add(`device-${deviceType}`);
        
        // Reducir animaciones en móviles para mejor rendimiento
        if (deviceType === 'mobile') {
            document.body.classList.add('reduced-motion');
        }
        
        console.log('Device optimized for:', deviceType);
    },
    
    // Monitor de rendimiento responsivo
    monitorResponsivePerformance: window.PerformanceManager.throttle(function() {
        const deviceType = window.ResponsiveManager.getDeviceType();
        document.body.className = document.body.className.replace(/device-(mobile|tablet|desktop)/g, '');
        document.body.classList.add(`device-${deviceType}`);
    }, 250)
};

// Aplicar optimizaciones responsivas
window.addEventListener('DOMContentLoaded', () => {
    window.ResponsiveManager.optimizeForDevice();
});

window.addEventListener('resize', window.ResponsiveManager.monitorResponsivePerformance);

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

// Store player name in local storage
document.addEventListener('DOMContentLoaded', function() {
    const nameForm = document.getElementById('nameForm');
    const playerNameInput = document.getElementById('playerName');
    const createPlayerNameLobbyInput = document.getElementById('createPlayerName');
    const joinPlayerNameLobbyInput = document.getElementById('joinPlayerName');
    const nameErrorDiv = document.getElementById('nameError'); // Para mostrar errores en index.html

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
                const validation = isValidPlayerName(enteredName);

                if (validation.valid) {
                    event.preventDefault();
                    localStorage.setItem('playerName', enteredName);
                    console.log(`Nombre guardado desde index.html: ${enteredName}. Redirigiendo a games.html...`);
                    if (nameErrorDiv) nameErrorDiv.textContent = ''; // Limpiar error si es válido
                    window.location.href = 'games.html';
                } else {
                    console.log("Validación de nombre fallida en index.html:", validation.message);
                    event.preventDefault();
                    if (nameErrorDiv) {
                        nameErrorDiv.textContent = validation.message;
                        nameErrorDiv.style.display = 'block';
                    } else {
                        alert(validation.message); // Fallback si el div no existe
                    }
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
    // Unificamos la clave a 'adConsent'
    const AD_CONSENT_KEY = 'adConsent';

    // Crear y añadir el banner de cookies dinámicamente si no existe
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
        cookieBanner = document.getElementById('cookieConsentBanner'); // Re-asignar después de añadirlo
    }

    const acceptButton = document.getElementById('acceptCookieButton');
    const rejectButton = document.getElementById('rejectCookieButton');

    if (cookieBanner && acceptButton && rejectButton) {
        if (!localStorage.getItem(AD_CONSENT_KEY)) { // Usar la clave unificada
            cookieBanner.style.display = 'block';
        }

        acceptButton.addEventListener('click', function() {
            localStorage.setItem(AD_CONSENT_KEY, 'true'); // Usar la clave unificada
            cookieBanner.style.display = 'none';
            console.log("Consentimiento de cookies/anuncios ACEPTADO.");
            // Refrescar anuncios o llamar a función que los carga si es necesario
            if (typeof window.loadAds === 'function') {
                window.loadAds(); // Asumiendo que tienes una función para cargar/refrescar anuncios
            }
        });

        rejectButton.addEventListener('click', function() {
            localStorage.setItem(AD_CONSENT_KEY, 'false'); // Guardar rechazo
            cookieBanner.style.display = 'none';
            console.log("Consentimiento de cookies/anuncios RECHAZADO.");
            // Asegurarse de que los scripts de anuncios no se carguen o se oculten los contenedores
             const adContainers = document.querySelectorAll(".adsense-container");
             adContainers.forEach(container => container.style.display = "none");
        });
    }

    // Check if we're on the games page and setup player name display
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    if (playerNameDisplay) {
        // Get current player name from localStorage, use 'Jugador' as fallback only if no name exists
        const currentPlayerName = localStorage.getItem('playerName');
        let displayName = currentPlayerName || 'Jugador';
        
        // Always display the actual saved name
        playerNameDisplay.textContent = displayName;
        console.log('🏷️ Nombre de usuario actualizado en playerNameDisplay:', displayName);
        
        // Si no hay nombre guardado y estamos en games.html, redirigir a index
        if (!currentPlayerName && window.location.pathname.includes('games.html')) {
            console.log('⚠️ No hay nombre de usuario, redirigiendo a index.html');
            window.location.href = 'index.html';
            return;
        }
        
        // Configurar el cambio de nombre
        const changeNameBtn = document.getElementById('changeNameBtn');
        const changeNameModal = document.getElementById('changeNameModal');
        const changeNameForm = document.getElementById('changeNameForm');
        const cancelNameChange = document.getElementById('cancelNameChange');
        const newPlayerNameInput = document.getElementById('newPlayerName');
        const changeNameErrorDiv = document.getElementById('changeNameError'); // Para errores en el modal
        
        if (changeNameBtn && changeNameModal) {
            changeNameBtn.addEventListener('click', function() {
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
                        playerNameDisplay.textContent = newName;
                        changeNameModal.classList.remove('active');
                        displayName = newName; // Update local variable

                        document.querySelectorAll('.player-name').forEach(element => {
                            element.textContent = newName;
                        });
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