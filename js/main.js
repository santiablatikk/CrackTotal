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
        const changeNameErrorDiv = document.getElementById('changeNameError'); // Para errores en el modal
        
        if (changeNameBtn && changeNameModal) {
            changeNameBtn.addEventListener('click', function() {
                newPlayerNameInput.value = playerName;
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
                        playerName = newName;

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
        title: document.title || 'Crack Total - El Juego del Fútbol',
        text: '¡Juega y demuestra tus conocimientos de fútbol en Crack Total!',
        url: window.location.href
    };

    // Si el navegador soporta compartir nativo (móvil principalmente)
    if (navigator.share) {
    try {
            await navigator.share(shareData);
            console.log('Contenido compartido exitosamente!');
            return;
        } catch (err) {
            console.error('Error al compartir con API nativa: ', err);
            // Si el usuario cancela, no mostramos el modal de compartir
            if (err.name === 'AbortError') {
                return;
            }
        }
    }

    // Si no podemos usar navigator.share, mostramos un modal con opciones
    // Primero, verificamos si el modal ya existe
    let shareModal = document.getElementById('shareModal');
    
    if (!shareModal) {
        // Crear el modal de compartir
        const modalHTML = `
            <div id="shareModal" class="share-modal">
                <div class="share-modal-content">
                    <span class="share-modal-close">&times;</span>
                    <h3>Compartir Crack Total</h3>
                    <p>¡Comparte este sitio con tus amigos!</p>
                    <div class="social-share-buttons">
                        <a href="#" class="share-button share-whatsapp" title="Compartir en WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                        <a href="#" class="share-button share-facebook" title="Compartir en Facebook">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" class="share-button share-twitter" title="Compartir en Twitter">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="#" class="share-button share-telegram" title="Compartir en Telegram">
                            <i class="fab fa-telegram-plane"></i>
                        </a>
                        <a href="#" class="share-button share-email" title="Compartir por Email">
                            <i class="fas fa-envelope"></i>
                        </a>
                    </div>
                    <div class="copy-link-container">
                        <input type="text" id="shareUrl" value="${shareData.url}" readonly>
                        <button id="copyLinkBtn" class="copy-link-btn">
                            <i class="fas fa-copy"></i> Copiar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar estilos para el modal
        const modalStyle = document.createElement('style');
        modalStyle.textContent = `
            .share-modal {
                display: none;
                position: fixed;
                z-index: 9999;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0,0,0,0.6);
                animation: fadeIn 0.3s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .share-modal-content {
                background-color: #fff;
                margin: 15% auto;
                padding: 25px;
                border-radius: 10px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                position: relative;
                animation: slideIn 0.3s;
            }
            
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .share-modal-close {
                position: absolute;
                top: 15px;
                right: 20px;
                color: #aaa;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                transition: color 0.2s;
            }
            
            .share-modal-close:hover {
                color: #333;
            }
            
            .share-modal h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #333;
                font-family: 'Montserrat', sans-serif;
                text-align: center;
            }
            
            .share-modal p {
                text-align: center;
                margin-bottom: 20px;
                color: #666;
            }
            
            .social-share-buttons {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .share-button {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                text-decoration: none;
                color: white;
                font-size: 20px;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .share-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            
            .share-whatsapp { background-color: #25D366; }
            .share-facebook { background-color: #3b5998; }
            .share-twitter { background-color: #1DA1F2; }
            .share-telegram { background-color: #0088cc; }
            .share-email { background-color: #D44638; }
            
            .copy-link-container {
                display: flex;
                margin-top: 15px;
                border: 1px solid #ddd;
                border-radius: 4px;
                overflow: hidden;
        }
            
            #shareUrl {
                flex-grow: 1;
                padding: 10px;
                border: none;
                font-size: 14px;
                color: #333;
                background: #f5f5f5;
            }
            
            .copy-link-btn {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 10px 15px;
                cursor: pointer;
                font-weight: 500;
                transition: background-color 0.2s;
                white-space: nowrap;
            }
            
            .copy-link-btn:hover {
                background-color: #2980b9;
            }
            
            @media (max-width: 480px) {
                .social-share-buttons {
                    gap: 10px;
                }
                
                .share-button {
                    width: 45px;
                    height: 45px;
                    font-size: 18px;
                }
            }
        `;
        
        document.head.appendChild(modalStyle);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        shareModal = document.getElementById('shareModal');
        
        // Agregar event listeners a los botones de compartir
        const whatsappBtn = shareModal.querySelector('.share-whatsapp');
        const facebookBtn = shareModal.querySelector('.share-facebook');
        const twitterBtn = shareModal.querySelector('.share-twitter');
        const telegramBtn = shareModal.querySelector('.share-telegram');
        const emailBtn = shareModal.querySelector('.share-email');
        const copyLinkBtn = shareModal.querySelector('#copyLinkBtn');
        const closeBtn = shareModal.querySelector('.share-modal-close');
        
        whatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
        });
        
        facebookBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`, '_blank');
        });
        
        twitterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`, '_blank');
        });
        
        telegramBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`, '_blank');
        });
        
        emailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
        });
        
        copyLinkBtn.addEventListener('click', () => {
            const shareUrl = document.getElementById('shareUrl');
            shareUrl.select();
            document.execCommand('copy');
            
            // Cambiar el texto del botón temporalmente para indicar que se copió
            const originalText = copyLinkBtn.innerHTML;
            copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
            setTimeout(() => {
                copyLinkBtn.innerHTML = originalText;
            }, 2000);
        });
        
        closeBtn.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });
        
        // Cerrar el modal al hacer clic fuera del contenido
        window.addEventListener('click', (event) => {
            if (event.target === shareModal) {
                shareModal.style.display = 'none';
        }
        });
    }
    
    // Mostrar el modal
    shareModal.style.display = 'block';
} 