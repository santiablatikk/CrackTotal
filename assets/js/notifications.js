/**
 * Sistema de Notificaciones Avanzado para Crack Total
 * Maneja toasts, alertas, confirmaciones y notificaciones push
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.config = {
            duration: {
                success: 4000,
                error: 6000,
                warning: 5000,
                info: 4000,
                achievement: 8000
            },
            maxNotifications: 5,
            position: 'top-right',
            sounds: {
                success: '/audio/success.mp3',
                error: '/audio/error.mp3',
                achievement: '/audio/achievement.mp3',
                warning: '/audio/warning.mp3'
            }
        };
        this.soundEnabled = true;
        this.animationQueue = [];
        this.init();
    }

    init() {
        this.createContainer();
        this.loadSounds();
        this.setupEventListeners();
        console.log('[Notifications] Sistema de notificaciones inicializado');
    }

    createContainer() {
        // Eliminar container existente si existe
        const existing = document.getElementById('notification-container');
        if (existing) {
            existing.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = `notification-container ${this.config.position}`;
        
        // Estilos CSS embebidos para mayor control
        this.container.innerHTML = `
            <style>
                .notification-container {
                    position: fixed;
                    z-index: 10000;
                    max-width: 400px;
                    padding: 20px;
                    pointer-events: none;
                }
                
                .notification-container.top-right {
                    top: 20px;
                    right: 20px;
                }
                
                .notification-container.top-left {
                    top: 20px;
                    left: 20px;
                }
                
                .notification-container.bottom-right {
                    bottom: 20px;
                    right: 20px;
                }
                
                .notification-container.bottom-left {
                    bottom: 20px;
                    left: 20px;
                }
                
                .notification {
                    background: rgba(30, 30, 30, 0.95);
                    border-radius: 12px;
                    padding: 16px 20px;
                    margin-bottom: 12px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    transform: translateX(120%);
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    pointer-events: auto;
                    position: relative;
                    overflow: hidden;
                    min-height: 60px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .notification.hide {
                    transform: translateX(120%);
                    opacity: 0;
                    margin-bottom: 0;
                    padding-top: 0;
                    padding-bottom: 0;
                    min-height: 0;
                }
                
                .notification-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .notification-content {
                    flex: 1;
                    color: #fff;
                }
                
                .notification-title {
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 4px;
                    line-height: 1.2;
                }
                
                .notification-message {
                    font-size: 13px;
                    opacity: 0.9;
                    line-height: 1.3;
                }
                
                .notification-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.7);
                    cursor: pointer;
                    font-size: 16px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }
                
                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }
                
                .notification-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #4CAF50, #45a049);
                    border-radius: 0 0 12px 12px;
                    transition: width linear;
                }
                
                /* Tipos de notificación */
                .notification.success {
                    border-left: 4px solid #4CAF50;
                }
                
                .notification.success .notification-icon {
                    background: rgba(76, 175, 80, 0.2);
                    color: #4CAF50;
                }
                
                .notification.success .notification-progress {
                    background: linear-gradient(90deg, #4CAF50, #45a049);
                }
                
                .notification.error {
                    border-left: 4px solid #f44336;
                }
                
                .notification.error .notification-icon {
                    background: rgba(244, 67, 54, 0.2);
                    color: #f44336;
                }
                
                .notification.error .notification-progress {
                    background: linear-gradient(90deg, #f44336, #d32f2f);
                }
                
                .notification.warning {
                    border-left: 4px solid #ff9800;
                }
                
                .notification.warning .notification-icon {
                    background: rgba(255, 152, 0, 0.2);
                    color: #ff9800;
                }
                
                .notification.warning .notification-progress {
                    background: linear-gradient(90deg, #ff9800, #f57c00);
                }
                
                .notification.info {
                    border-left: 4px solid #2196F3;
                }
                
                .notification.info .notification-icon {
                    background: rgba(33, 150, 243, 0.2);
                    color: #2196F3;
                }
                
                .notification.info .notification-progress {
                    background: linear-gradient(90deg, #2196F3, #1976D2);
                }
                
                .notification.achievement {
                    border-left: 4px solid #FFD700;
                    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.05));
                    border: 1px solid rgba(255, 215, 0, 0.3);
                }
                
                .notification.achievement .notification-icon {
                    background: rgba(255, 215, 0, 0.2);
                    color: #FFD700;
                    font-size: 20px;
                }
                
                .notification.achievement .notification-progress {
                    background: linear-gradient(90deg, #FFD700, #FFC107);
                }
                
                .notification.achievement .notification-title {
                    color: #FFD700;
                }
                
                /* Animaciones especiales para logros */
                .notification.achievement {
                    animation: achievementPulse 0.6s ease-out;
                }
                
                @keyframes achievementPulse {
                    0% { transform: scale(0.8) translateX(120%); }
                    50% { transform: scale(1.05) translateX(0); }
                    100% { transform: scale(1) translateX(0); }
                }
                
                /* Responsive */
                @media (max-width: 480px) {
                    .notification-container {
                        left: 10px !important;
                        right: 10px !important;
                        max-width: none;
                        padding: 10px;
                    }
                    
                    .notification {
                        padding: 12px 16px;
                    }
                    
                    .notification-title {
                        font-size: 13px;
                    }
                    
                    .notification-message {
                        font-size: 12px;
                    }
                }
                
                /* Accesibilidad */
                @media (prefers-reduced-motion: reduce) {
                    .notification {
                        transition: opacity 0.2s ease;
                    }
                    
                    .notification.achievement {
                        animation: none;
                    }
                }
            </style>
        `;

        document.body.appendChild(this.container);
    }

    loadSounds() {
        this.sounds = {};
        if (typeof Audio !== 'undefined') {
            for (const [type, url] of Object.entries(this.config.sounds)) {
                try {
                    this.sounds[type] = new Audio(url);
                    this.sounds[type].volume = 0.3;
                    this.sounds[type].preload = 'auto';
                } catch (error) {
                    console.warn(`[Notifications] No se pudo cargar sonido ${type}:`, error);
                }
            }
        }
    }

    setupEventListeners() {
        // Escuchar cambios de visibilidad para pausar/reanudar notificaciones
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAllTimers();
            } else {
                this.resumeAllTimers();
            }
        });

        // Escuchar eventos del service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'SW_UPDATED') {
                    this.show({
                        type: 'info',
                        title: 'Actualización disponible',
                        message: 'Una nueva versión está disponible. La página se actualizará automáticamente.',
                        persistent: true
                    });
                }
            });
        }
    }

    /**
     * Mostrar una notificación
     * @param {Object} options - Opciones de la notificación
     * @param {string} options.type - Tipo: success, error, warning, info, achievement
     * @param {string} options.title - Título de la notificación
     * @param {string} options.message - Mensaje de la notificación
     * @param {number} [options.duration] - Duración en ms (opcional)
     * @param {boolean} [options.persistent] - No cerrar automáticamente
     * @param {boolean} [options.sound] - Reproducir sonido
     * @param {Function} [options.onClick] - Callback al hacer click
     * @param {Object} [options.actions] - Botones de acción
     */
    show(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = this.config.duration[type],
            persistent = false,
            sound = true,
            onClick = null,
            actions = null
        } = options;

        // Limpiar notificaciones excesivas
        this.cleanupOldNotifications();

        const id = this.generateId();
        const notification = this.createNotificationElement(id, {
            type, title, message, persistent, onClick, actions
        });

        // Agregar al container
        this.container.appendChild(notification);

        // Configurar comportamiento
        this.setupNotificationBehavior(id, notification, {
            duration, persistent, sound, type
        });

        return id;
    }

    createNotificationElement(id, options) {
        const { type, title, message, persistent, onClick, actions } = options;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('data-id', id);
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');

        const icon = this.getIcon(type);
        
        let actionsHTML = '';
        if (actions && actions.length > 0) {
            actionsHTML = `
                <div class="notification-actions" style="margin-top: 8px; display: flex; gap: 8px;">
                    ${actions.map(action => `
                        <button class="notification-action" data-action="${action.id}" 
                                style="background: rgba(255,255,255,0.2); border: none; padding: 4px 8px; 
                                       border-radius: 4px; color: #fff; font-size: 12px; cursor: pointer;">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${this.sanitizeHTML(title)}</div>` : ''}
                <div class="notification-message">${this.sanitizeHTML(message)}</div>
                ${actionsHTML}
            </div>
            ${!persistent ? '<button class="notification-close" aria-label="Cerrar">✕</button>' : ''}
            ${!persistent ? '<div class="notification-progress"></div>' : ''}
        `;

        // Event listeners
        if (onClick) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-close') && 
                    !e.target.classList.contains('notification-action')) {
                    onClick(id);
                }
            });
        }

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide(id);
            });
        }

        // Action buttons
        if (actions) {
            notification.querySelectorAll('.notification-action').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const actionId = e.target.dataset.action;
                    const action = actions.find(a => a.id === actionId);
                    if (action && action.handler) {
                        action.handler(id);
                    }
                    this.hide(id);
                });
            });
        }

        return notification;
    }

    setupNotificationBehavior(id, element, options) {
        const { duration, persistent, sound, type } = options;

        // Reproducir sonido
        if (sound && this.soundEnabled && this.sounds[type]) {
            this.sounds[type].play().catch(() => {
                // Silently fail if sound can't play
            });
        }

        // Mostrar con animación
        setTimeout(() => {
            element.classList.add('show');
        }, 50);

        // Configurar timer de auto-cierre
        if (!persistent && duration > 0) {
            this.setupAutoClose(id, element, duration);
        }

        // Almacenar referencia
        this.notifications.set(id, {
            element,
            timestamp: Date.now(),
            duration: persistent ? 0 : duration,
            type
        });
    }

    setupAutoClose(id, element, duration) {
        const progressBar = element.querySelector('.notification-progress');
        
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transitionDuration = `${duration}ms`;
            
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 50);
        }

        const timer = setTimeout(() => {
            this.hide(id);
        }, duration);

        this.notifications.set(id, {
            ...this.notifications.get(id),
            timer
        });
    }

    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        const { element, timer } = notification;

        // Limpiar timer
        if (timer) {
            clearTimeout(timer);
        }

        // Ocultar con animación
        element.classList.add('hide');
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 400);
    }

    hideAll() {
        for (const id of this.notifications.keys()) {
            this.hide(id);
        }
    }

    cleanupOldNotifications() {
        if (this.notifications.size >= this.config.maxNotifications) {
            const oldest = Array.from(this.notifications.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
            
            if (oldest) {
                this.hide(oldest[0]);
            }
        }
    }

    pauseAllTimers() {
        // En una implementación más avanzada, pausaríamos los timers
        console.log('[Notifications] Pausando timers de notificaciones');
    }

    resumeAllTimers() {
        // En una implementación más avanzada, reanudaríamos los timers
        console.log('[Notifications] Reanudando timers de notificaciones');
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            achievement: '🏆'
        };
        return icons[type] || icons.info;
    }

    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    generateId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Métodos de conveniencia
    success(title, message, options = {}) {
        return this.show({ type: 'success', title, message, ...options });
    }

    error(title, message, options = {}) {
        return this.show({ type: 'error', title, message, ...options });
    }

    warning(title, message, options = {}) {
        return this.show({ type: 'warning', title, message, ...options });
    }

    info(title, message, options = {}) {
        return this.show({ type: 'info', title, message, ...options });
    }

    achievement(title, message, options = {}) {
        return this.show({ type: 'achievement', title, message, sound: true, ...options });
    }

    // Configuración
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    setPosition(position) {
        this.config.position = position;
        this.container.className = `notification-container ${position}`;
    }

    // API pública para el juego
    gameEvent(eventType, data) {
        switch (eventType) {
            case 'correct_answer':
                this.success('¡Correcto!', `+${data.points} puntos`, {
                    duration: 3000
                });
                break;
                
            case 'wrong_answer':
                this.error('Incorrecto', `La respuesta era: ${data.correctAnswer}`, {
                    duration: 4000
                });
                break;
                
            case 'time_warning':
                this.warning('¡Tiempo!', `Quedan ${data.seconds} segundos`, {
                    duration: 2000
                });
                break;
                
            case 'game_won':
                this.achievement('¡Victoria!', `Has ganado con ${data.score} puntos`, {
                    duration: 6000
                });
                break;
                
            case 'new_high_score':
                this.achievement('¡Nuevo récord!', `Puntuación: ${data.score}`, {
                    duration: 8000
                });
                break;
                
            case 'player_joined':
                this.info('Jugador conectado', `${data.playerName} se unió al juego`);
                break;
                
            case 'player_left':
                this.info('Jugador desconectado', `${data.playerName} dejó el juego`);
                break;
                
            case 'connection_lost':
                this.error('Conexión perdida', 'Intentando reconectar...', {
                    persistent: true
                });
                break;
                
            case 'connection_restored':
                this.success('Reconectado', 'Conexión restablecida');
                break;
        }
    }
}

// Crear instancia global
window.notifications = new NotificationSystem();

// Exponer API global para compatibilidad
window.showNotification = (type, title, message, options) => {
    return window.notifications.show({ type, title, message, ...options });
};

console.log('[Notifications] Sistema de notificaciones cargado y listo'); 