/**
 * ========================================
 * CRACK TOTAL - SMART NOTIFICATIONS SYSTEM
 * ========================================
 * Sistema inteligente de notificaciones contextuales
 */

class CrackTotalSmartNotifications {
    constructor() {
        this.config = {
            enabled: true,
            maxNotifications: 3,
            notificationDuration: 5000,
            cooldownPeriod: 30000, // 30 segundos entre notificaciones
            position: 'top-right'
        };

        this.activeNotifications = [];
        this.notificationHistory = [];
        this.lastNotificationTime = 0;
        this.userBehavior = {
            timeOnSite: 0,
            pagesVisited: 0,
            gamesPlayed: 0,
            scrollDepth: 0,
            clicks: 0
        };

        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.setupBehaviorTracking();
        this.setupSmartTriggers();
        this.setupPushNotifications();
        
        console.log('🔔 CrackTotalSmartNotifications initialized');
    }

    /**
     * Crear contenedor de notificaciones
     */
    createNotificationContainer() {
        if (document.getElementById('smart-notifications-container')) return;

        const container = document.createElement('div');
        container.id = 'smart-notifications-container';
        container.className = `notifications-container ${this.config.position}`;
        
        // Estilos CSS
        const styles = `
            .notifications-container {
                position: fixed;
                z-index: 10000;
                pointer-events: none;
                max-width: 400px;
            }
            
            .notifications-container.top-right {
                top: 20px;
                right: 20px;
            }
            
            .notifications-container.top-left {
                top: 20px;
                left: 20px;
            }
            
            .notifications-container.bottom-right {
                bottom: 20px;
                right: 20px;
            }
            
            .smart-notification {
                background: rgba(42, 42, 42, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 15px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                font-family: 'Montserrat', sans-serif;
                pointer-events: all;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .smart-notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .smart-notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }
            
            .smart-notification::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: var(--gradient-primary);
            }
            
            .notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            
            .notification-icon {
                font-size: 1.2rem;
                margin-right: 10px;
            }
            
            .notification-title {
                font-weight: 600;
                font-size: 1rem;
                color: var(--primary-light);
            }
            
            .notification-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                cursor: pointer;
                padding: 0;
                font-size: 1.2rem;
                transition: color 0.3s ease;
            }
            
            .notification-close:hover {
                color: white;
            }
            
            .notification-body {
                font-size: 0.9rem;
                line-height: 1.4;
                color: rgba(255, 255, 255, 0.9);
                margin-bottom: 15px;
            }
            
            .notification-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            .notification-btn {
                background: var(--gradient-primary);
                border: none;
                border-radius: 8px;
                padding: 8px 16px;
                color: white;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .notification-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.4);
            }
            
            .notification-btn.secondary {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background: var(--accent);
                transition: width linear;
            }
            
            @media (max-width: 768px) {
                .notifications-container {
                    left: 10px;
                    right: 10px;
                    max-width: none;
                }
                
                .smart-notification {
                    padding: 15px;
                    margin-bottom: 10px;
                }
            }
        `;

        // Agregar estilos si no existen
        if (!document.getElementById('smart-notifications-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'smart-notifications-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        document.body.appendChild(container);
    }

    /**
     * Configurar tracking de comportamiento
     */
    setupBehaviorTracking() {
        // Tracking del tiempo en el sitio
        setInterval(() => {
            this.userBehavior.timeOnSite += 1000;
        }, 1000);

        // Tracking de scroll
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                this.userBehavior.scrollDepth = maxScroll;
            }
        });

        // Tracking de clicks
        document.addEventListener('click', () => {
            this.userBehavior.clicks++;
        });

        // Tracking de páginas visitadas
        this.userBehavior.pagesVisited++;
    }

    /**
     * Configurar triggers inteligentes
     */
    setupSmartTriggers() {
        // Trigger: Usuario inactivo por mucho tiempo
        this.setupInactivityTrigger();
        
        // Trigger: Usuario muy enganchado
        this.setupEngagementTrigger();
        
        // Trigger: Tiempo en página específico
        this.setupTimeBasedTriggers();
        
        // Trigger: Comportamiento de abandono
        this.setupExitIntentTrigger();
        
        // Trigger: Nuevas funcionalidades
        this.setupFeatureTriggers();
    }

    setupInactivityTrigger() {
        let inactiveTime = 0;
        let inactivityTimer;

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactiveTime = 0;
            
            inactivityTimer = setTimeout(() => {
                inactiveTime += 60000; // 1 minuto
                
                if (inactiveTime >= 120000 && !this.hasShownNotification('inactivity_reminder')) { // 2 minutos
                    this.showNotification({
                        type: 'inactivity_reminder',
                        icon: '⏰',
                        title: '¿Seguís ahí?',
                        message: '¡Hay muchos juegos esperándote! ¿Querés probar uno nuevo?',
                        actions: [
                            {
                                text: 'Ver Juegos',
                                action: () => window.location.href = 'games.html'
                            },
                            {
                                text: 'Recordar más tarde',
                                action: () => this.dismissNotification('inactivity_reminder'),
                                secondary: true
                            }
                        ],
                        priority: 'medium'
                    });
                }
            }, 60000);
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
    }

    setupEngagementTrigger() {
        setTimeout(() => {
            if (this.userBehavior.timeOnSite > 180000 && // 3 minutos
                this.userBehavior.scrollDepth > 70 &&
                !this.hasShownNotification('high_engagement')) {
                
                this.showNotification({
                    type: 'high_engagement',
                    icon: '🔥',
                    title: '¡Sos un verdadero crack!',
                    message: '¡Te encanta nuestro contenido! ¿Te gustaría recibir notificaciones cuando agreguemos nuevos juegos?',
                    actions: [
                        {
                            text: 'Sí, quiero!',
                            action: () => this.requestPushPermission()
                        },
                        {
                            text: 'Ahora no',
                            action: () => this.dismissNotification('high_engagement'),
                            secondary: true
                        }
                    ],
                    priority: 'high'
                });
            }
        }, 180000);
    }

    setupTimeBasedTriggers() {
        // Trigger a los 30 segundos
        setTimeout(() => {
            if (!this.hasShownNotification('welcome_tip')) {
                this.showNotification({
                    type: 'welcome_tip',
                    icon: '💡',
                    title: 'Consejo rápido',
                    message: '¿Sabías que podés ver tu progreso y estadísticas en tu perfil?',
                    actions: [
                        {
                            text: 'Ver Perfil',
                            action: () => window.location.href = 'profile.html'
                        }
                    ],
                    priority: 'low',
                    duration: 7000
                });
            }
        }, 30000);

        // Trigger a los 5 minutos
        setTimeout(() => {
            if (!this.hasShownNotification('blog_suggestion')) {
                this.showNotification({
                    type: 'blog_suggestion',
                    icon: '📚',
                    title: 'Mientras jugás...',
                    message: '¡Descubrí nuestros artículos exclusivos sobre fútbol en el blog!',
                    actions: [
                        {
                            text: 'Leer Blog',
                            action: () => window.location.href = 'blog.html'
                        }
                    ],
                    priority: 'medium'
                });
            }
        }, 300000);
    }

    setupExitIntentTrigger() {
        let mouseY = 0;
        let hasTriggered = false;

        document.addEventListener('mousemove', (e) => {
            mouseY = e.clientY;
        });

        document.addEventListener('mouseleave', () => {
            if (mouseY < 100 && !hasTriggered && !this.hasShownNotification('exit_intent')) {
                hasTriggered = true;
                
                this.showNotification({
                    type: 'exit_intent',
                    icon: '👋',
                    title: '¡Esperá!',
                    message: '¿No encontraste lo que buscabas? ¡Tenemos mucho más contenido para explorar!',
                    actions: [
                        {
                            text: 'Ver Todo',
                            action: () => window.location.href = 'games.html'
                        },
                        {
                            text: 'Contactar',
                            action: () => window.location.href = 'contact.html'
                        }
                    ],
                    priority: 'high',
                    duration: 8000
                });
            }
        });
    }

    setupFeatureTriggers() {
        // Detectar si es la primera visita
        if (!localStorage.getItem('crackTotalFirstVisit')) {
            localStorage.setItem('crackTotalFirstVisit', 'true');
            
            setTimeout(() => {
                this.showNotification({
                    type: 'first_visit',
                    icon: '🎉',
                    title: '¡Bienvenido a Crack Total!',
                    message: 'Descubrí todos nuestros juegos, leé el blog y competí con otros cracks.',
                    actions: [
                        {
                            text: 'Empezar Tour',
                            action: () => this.startTour()
                        }
                    ],
                    priority: 'high',
                    duration: 10000
                });
            }, 5000);
        }
    }

    /**
     * Mostrar notificación
     */
    showNotification(notification) {
        if (!this.config.enabled || 
            this.activeNotifications.length >= this.config.maxNotifications ||
            Date.now() - this.lastNotificationTime < this.config.cooldownPeriod) {
            return;
        }

        const container = document.getElementById('smart-notifications-container');
        if (!container) return;

        const notificationElement = this.createNotificationElement(notification);
        container.appendChild(notificationElement);

        // Mostrar con animación
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 100);

        // Auto-hide después del tiempo especificado
        const duration = notification.duration || this.config.notificationDuration;
        if (duration > 0) {
            this.setupProgressBar(notificationElement, duration);
            
            setTimeout(() => {
                this.hideNotification(notificationElement, notification.type);
            }, duration);
        }

        // Agregar a arrays de tracking
        this.activeNotifications.push(notification);
        this.notificationHistory.push({
            ...notification,
            timestamp: Date.now(),
            action: 'shown'
        });
        
        this.lastNotificationTime = Date.now();

        // Analytics
        if (window.gtag) {
            gtag('event', 'notification_shown', {
                event_category: 'engagement',
                event_label: notification.type,
                value: 1
            });
        }
    }

    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = 'smart-notification';
        element.dataset.type = notification.type;

        const actions = notification.actions || [];
        const actionsHTML = actions.map(action => 
            `<button class="notification-btn ${action.secondary ? 'secondary' : ''}" 
                     onclick="window.smartNotificationAction('${notification.type}', ${actions.indexOf(action)})">
                ${action.text}
             </button>`
        ).join('');

        element.innerHTML = `
            <div class="notification-header">
                <div>
                    <span class="notification-icon">${notification.icon || '🔔'}</span>
                    <span class="notification-title">${notification.title}</span>
                </div>
                <button class="notification-close" onclick="window.closeSmartNotification('${notification.type}')">&times;</button>
            </div>
            <div class="notification-body">${notification.message}</div>
            ${actionsHTML ? `<div class="notification-actions">${actionsHTML}</div>` : ''}
            <div class="notification-progress"></div>
        `;

        return element;
    }

    setupProgressBar(element, duration) {
        const progressBar = element.querySelector('.notification-progress');
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transitionDuration = duration + 'ms';
            
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 100);
        }
    }

    hideNotification(element, type) {
        element.classList.add('hide');
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            // Remover de notifications activas
            this.activeNotifications = this.activeNotifications.filter(n => n.type !== type);
        }, 400);
    }

    /**
     * Configurar push notifications
     */
    setupPushNotifications() {
        // Registrar funciones globales para callbacks
        window.smartNotificationAction = (type, actionIndex) => {
            const notification = this.activeNotifications.find(n => n.type === type);
            if (notification && notification.actions && notification.actions[actionIndex]) {
                notification.actions[actionIndex].action();
                this.trackNotificationAction(type, actionIndex);
            }
        };

        window.closeSmartNotification = (type) => {
            const element = document.querySelector(`[data-type="${type}"]`);
            if (element) {
                this.hideNotification(element, type);
                this.trackNotificationAction(type, 'close');
            }
        };
    }

    async requestPushPermission() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.showNotification({
                    type: 'push_enabled',
                    icon: '✅',
                    title: '¡Genial!',
                    message: 'Te avisaremos cuando tengamos nuevos juegos y contenido.',
                    priority: 'low',
                    duration: 3000
                });

                // Guardar preferencia
                localStorage.setItem('crackTotalPushEnabled', 'true');
                
                if (window.gtag) {
                    gtag('event', 'push_notification_enabled', {
                        event_category: 'engagement',
                        value: 1
                    });
                }
            }
        }
    }

    startTour() {
        // Implementar tour guiado del sitio
        this.showNotification({
            type: 'tour_step_1',
            icon: '👆',
            title: 'Paso 1: Navegación',
            message: 'Usá el menú superior para navegar entre juegos, blog y tu perfil.',
            priority: 'high',
            duration: 6000
        });

        setTimeout(() => {
            this.showNotification({
                type: 'tour_step_2',
                icon: '🎮',
                title: 'Paso 2: Juegos',
                message: 'Tenemos 4 tipos de juegos: Pasalache, ¿Quién Sabe Más?, El Mentiroso y Crack Rápido.',
                actions: [
                    {
                        text: 'Ver Juegos',
                        action: () => window.location.href = 'games.html'
                    }
                ],
                priority: 'high',
                duration: 8000
            });
        }, 7000);
    }

    /**
     * Utilities
     */
    hasShownNotification(type) {
        return this.notificationHistory.some(n => n.type === type);
    }

    trackNotificationAction(type, action) {
        this.notificationHistory.push({
            type,
            action,
            timestamp: Date.now()
        });

        if (window.gtag) {
            gtag('event', 'notification_action', {
                event_category: 'engagement',
                event_label: `${type}_${action}`,
                value: 1
            });
        }
    }

    dismissNotification(type) {
        const element = document.querySelector(`[data-type="${type}"]`);
        if (element) {
            this.hideNotification(element, type);
        }
    }

    // API pública
    disable() {
        this.config.enabled = false;
        console.log('🔔 Smart Notifications disabled');
    }

    enable() {
        this.config.enabled = true;
        console.log('🔔 Smart Notifications enabled');
    }

    getNotificationHistory() {
        return this.notificationHistory;
    }

    clearNotifications() {
        const container = document.getElementById('smart-notifications-container');
        if (container) {
            container.innerHTML = '';
        }
        this.activeNotifications = [];
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.CrackTotalSmartNotifications = new CrackTotalSmartNotifications();
    
    // Exponer funciones útiles
    window.showSmartNotification = (notification) => 
        window.CrackTotalSmartNotifications.showNotification(notification);
    window.disableSmartNotifications = () => 
        window.CrackTotalSmartNotifications.disable();
    window.getNotificationHistory = () => 
        window.CrackTotalSmartNotifications.getNotificationHistory();
}

export default CrackTotalSmartNotifications; 