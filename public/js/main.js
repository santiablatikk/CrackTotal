/**
 * Main.js - Script principal de la aplicación
 * Versión: 2.0.0
 * 
 * Este script controla las funcionalidades principales de la aplicación,
 * incluyendo la inicialización de componentes, manejo de eventos y 
 * adaptaciones para dispositivos móviles.
 */

// Función autoejecutable para encapsular todo el código
(function() {
    'use strict';
    
    // Objetos para configuración y estado
    const config = {
        mobileBreakpoint: 768,
        initialLoadDelay: 100,
        transitionSpeed: 300,
        enableLogging: !window.browserFeatures?.mobile && 
                      (window.location.hostname === 'localhost' || 
                       window.location.hostname.includes('127.0.0.1'))
    };
    
    // Estado de la aplicación
    const state = {
        isMobile: window.browserFeatures?.mobile || 
                 window.innerWidth <= config.mobileBreakpoint,
        menuOpen: false,
        currentSection: null,
        isLoading: true,
        userLoggedIn: false
    };
    
    /**
     * Inicializa los elementos de la UI
     */
    function initUI() {
        // Referencias a elementos del DOM
        const menuButton = document.querySelector('.menu-button');
        const navMenu = document.querySelector('.nav-menu');
        const themeToggle = document.querySelector('.theme-toggle');
        const loginButton = document.querySelector('.login-button');
        const sections = document.querySelectorAll('section');
        
        // Inicializar componentes de UI
        if (menuButton && navMenu) {
            initMobileMenu(menuButton, navMenu);
        }
        
        if (themeToggle) {
            initThemeToggle(themeToggle);
        }
        
        if (loginButton) {
            initLoginSystem(loginButton);
        }
        
        // Inicializar secciones
        if (sections.length) {
            initSections(sections);
        }
        
        // Añadir clase cuando la UI esté lista
        document.body.classList.add('ui-ready');
    }
    
    /**
     * Inicializa el menú móvil
     */
    function initMobileMenu(button, menu) {
        const closeButton = menu.querySelector('.close-menu');
        const menuItems = menu.querySelectorAll('a');
        
        // Optimizar para móviles si está disponible
        if (window.MobileUtils) {
            window.MobileUtils.optimizeTouchTarget(button);
            menuItems.forEach(item => {
                window.MobileUtils.optimizeTouchTarget(item);
            });
        }
        
        // Configurar eventos
        button.addEventListener('click', function(e) {
            e.preventDefault();
            state.menuOpen = !state.menuOpen;
            
            if (state.menuOpen) {
                menu.classList.add('open');
                document.body.classList.add('menu-open');
                
                // Vibración táctil en dispositivos que lo soporten
                if (window.MobileUtils && window.MobileUtils.env.supportsVibration) {
                    navigator.vibrate(5);
                }
            } else {
                closeMenu();
            }
        });
        
        // Cerrar menú al hacer clic en un enlace
        menuItems.forEach(item => {
            item.addEventListener('click', closeMenu);
        });
        
        // Botón de cierre
        if (closeButton) {
            closeButton.addEventListener('click', function(e) {
                e.preventDefault();
                closeMenu();
            });
        }
        
        // Cerrar menú con escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && state.menuOpen) {
                closeMenu();
            }
        });
        
        // Función para cerrar el menú
        function closeMenu() {
            state.menuOpen = false;
            menu.classList.remove('open');
            document.body.classList.remove('menu-open');
        }
        
        // Configurar gestos táctiles si está disponible
        if (window.MobileUtils && state.isMobile) {
            window.MobileUtils.setupGestureNavigation('.nav-menu', {
                swipeLeft: closeMenu,
                threshold: 50
            });
        }
    }
    
    /**
     * Inicializa el cambio de tema
     */
    function initThemeToggle(toggle) {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Establecer tema inicial
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            if (savedTheme === 'dark') {
                toggle.classList.add('active');
            }
        } else if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            toggle.classList.add('active');
        }
        
        // Cambiar tema al hacer clic
        toggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            toggle.classList.toggle('active');
            
            // Vibración táctil en dispositivos que lo soporten
            if (window.MobileUtils && window.MobileUtils.env.supportsVibration) {
                navigator.vibrate(5);
            }
        });
    }
    
    /**
     * Inicializa el sistema de login
     */
    function initLoginSystem(loginButton) {
        // Comprobar si el usuario tiene sesión guardada
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (userData && userData.token) {
                updateLoginState(true, userData);
            }
        } catch (e) {
            console.error('Error al cargar datos de usuario:', e);
        }
        
        // Evento de clic en el botón de login
        loginButton.addEventListener('click', function(e) {
            if (!state.userLoggedIn) {
                e.preventDefault();
                showLoginModal();
            }
        });
    }
    
    /**
     * Actualiza el estado de login en la UI
     */
    function updateLoginState(isLoggedIn, userData) {
        const loginButton = document.querySelector('.login-button');
        const userMenu = document.querySelector('.user-menu');
        
        state.userLoggedIn = isLoggedIn;
        
        if (isLoggedIn && loginButton && userMenu) {
            loginButton.textContent = userData.username || 'Usuario';
            loginButton.classList.add('logged-in');
            
            if (userData.avatar) {
                const avatar = document.createElement('img');
                avatar.src = userData.avatar;
                avatar.alt = 'Avatar';
                avatar.classList.add('user-avatar');
                loginButton.prepend(avatar);
            }
            
            // Actualizar enlaces del menú de usuario
            const profileLink = userMenu.querySelector('.profile-link');
            if (profileLink) {
                profileLink.href = `/perfil/${userData.username}`;
            }
        } else if (loginButton) {
            loginButton.textContent = 'Iniciar sesión';
            loginButton.classList.remove('logged-in');
            const avatar = loginButton.querySelector('.user-avatar');
            if (avatar) {
                avatar.remove();
            }
        }
    }
    
    /**
     * Muestra el modal de login
     */
    function showLoginModal() {
        const modal = document.querySelector('#login-modal');
        
        if (!modal) {
            // Crear modal si no existe
            const modalHTML = `
                <div id="login-modal" class="modal">
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2>Iniciar sesión</h2>
                        <form id="login-form">
                            <div class="form-group">
                                <label for="username">Usuario:</label>
                                <input type="text" id="username" name="username" required>
                            </div>
                            <div class="form-group">
                                <label for="password">Contraseña:</label>
                                <input type="password" id="password" name="password" required>
                            </div>
                            <button type="submit" class="btn primary">Iniciar sesión</button>
                        </form>
                        <p class="register-link">¿No tienes cuenta? <a href="/registro">Regístrate</a></p>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const newModal = document.querySelector('#login-modal');
            
            // Inicializar eventos del modal
            initModalEvents(newModal);
            
            // Optimizar modal para móviles si el módulo está disponible
            if (window.MobileUtils && state.isMobile) {
                const form = newModal.querySelector('form');
                if (form) {
                    window.MobileUtils.optimizeFormForTouch(form);
                }
            }
        } else {
            // Mostrar modal existente
            modal.style.display = 'block';
        }
    }
    
    /**
     * Inicializa eventos del modal
     */
    function initModalEvents(modal) {
        const closeButton = modal.querySelector('.close');
        const form = modal.querySelector('form');
        
        // Cerrar modal
        closeButton.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Manejar envío del formulario
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = form.querySelector('#username').value;
            const password = form.querySelector('#password').value;
            
            // Simulación de login exitoso (reemplazar con API real)
            setTimeout(function() {
                const userData = {
                    username: username,
                    token: 'simulated-token',
                    avatar: '/img/default-avatar.png'
                };
                
                localStorage.setItem('userData', JSON.stringify(userData));
                updateLoginState(true, userData);
                modal.style.display = 'none';
                
                // Mostrar notificación
                if (window.Utils) {
                    window.Utils.showNotification('¡Bienvenido, ' + username + '!', 'success');
                }
            }, 500);
        });
    }
    
    /**
     * Inicializa las secciones de la página
     */
    function initSections(sections) {
        // Marcar sección activa en la navegación
        const currentPath = window.location.pathname;
        let activeSection = null;
        
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (currentPath === link.getAttribute('href')) {
                link.classList.add('active');
                activeSection = link.getAttribute('data-section');
            }
        });
        
        // Activar sección correspondiente
        if (activeSection) {
            sections.forEach(section => {
                if (section.id === activeSection) {
                    section.classList.add('active');
                    state.currentSection = activeSection;
                }
            });
        }
    }
    
    /**
     * Inicializa optimizaciones de imágenes si el módulo está disponible
     */
    function initImageOptimizations() {
        if (window.ImageOptimizer) {
            // Inicializar optimizador de imágenes con diferentes configuraciones según el dispositivo
            window.ImageOptimizer.init({
                lazyLoadSelector: 'img[data-src]',
                quality: state.isMobile ? 70 : 85,
                batchSize: state.isMobile ? 3 : 5
            });
            
            // Optimizar imágenes de fondo
            window.ImageOptimizer.optimizeBackgroundImages('.has-bg-image');
        }
    }
    
    /**
     * Inicializa detección de cambios de tamaño y orientación
     */
    function initResponsiveHandlers() {
        // Reaccionar a cambios de tamaño
        window.addEventListener('resize', function() {
            const wasMobile = state.isMobile;
            state.isMobile = window.innerWidth <= config.mobileBreakpoint;
            
            // Si cambia entre móvil y desktop, actualizar UI
            if (wasMobile !== state.isMobile) {
                refreshUI();
            }
        });
        
        // Detectar cambios de orientación en móviles
        if (state.isMobile) {
            window.addEventListener('orientationchange', refreshUI);
        }
    }
    
    /**
     * Actualiza la UI cuando cambia el entorno
     */
    function refreshUI() {
        // Actualizar clases CSS
        document.documentElement.classList.toggle('mobile-view', state.isMobile);
        
        // Actualizar optimizaciones de imágenes si está disponible
        if (window.ImageOptimizer) {
            window.ImageOptimizer.updateConfig({
                quality: state.isMobile ? 70 : 85,
                batchSize: state.isMobile ? 3 : 5
            });
        }
        
        // Evento personalizado para que otros componentes reaccionen
        window.dispatchEvent(new CustomEvent('uiRefresh', {
            detail: { isMobile: state.isMobile }
        }));
    }
    
    /**
     * Registra service worker si está en producción
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    if (config.enableLogging) {
                        console.log('ServiceWorker registrado con éxito:', registration.scope);
                    }
                }).catch(error => {
                    console.error('Error al registrar ServiceWorker:', error);
                });
        }
    }
    
    /**
     * Función principal para inicializar todo
     */
    function init() {
        // Marcar que la app está cargando
        state.isLoading = true;
        document.documentElement.classList.add('is-loading');
        
        // Registrar Service Worker
        registerServiceWorker();
        
        // Inicializar UI con un pequeño retraso para asegurar que el DOM esté listo
        setTimeout(function() {
            initUI();
            initResponsiveHandlers();
            
            // Optimizaciones para móviles
            if (state.isMobile && window.MobileUtils) {
                window.MobileUtils.init({
                    fixVhUnits: true,
                    optimizeScrolling: true
                });
            }
            
            // Inicializar optimizaciones de imágenes
            initImageOptimizations();
            
            // Marcar como cargado
            state.isLoading = false;
            document.documentElement.classList.remove('is-loading');
            document.documentElement.classList.add('is-loaded');
            
            // Limpiar almacenamiento local si Utils está disponible
            if (window.Utils) {
                window.Utils.cleanupStorage();
            }
        }, config.initialLoadDelay);
    }
    
    // Iniciar la aplicación cuando el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Exponer funciones útiles globalmente para ser utilizadas por otros scripts
    window.App = {
        refreshUI: refreshUI,
        updateLoginState: updateLoginState,
        showLoginModal: showLoginModal
    };
})();