/**
 * ========================================
 * CRACK TOTAL - ADVANCED ANALYTICS SYSTEM
 * ========================================
 * Sistema avanzado de analíticas y métricas personalizadas
 */

class CrackTotalAdvancedAnalytics {
    constructor() {
        this.config = {
            sessionId: this.generateSessionId(),
            userId: this.getUserId(),
            trackingEnabled: true,
            debugMode: false
        };

        this.metrics = {
            pageViews: 0,
            timeOnPage: 0,
            clicks: 0,
            scrollDepth: 0,
            interactions: [],
            performance: {},
            userEngagement: {}
        };

        this.events = [];
        this.sessionStartTime = Date.now();
        this.lastActivity = Date.now();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.trackPageView();
        this.setupScrollTracking();
        this.setupClickTracking();
        this.setupTimeTracking();
        this.setupPerformanceTracking();
        this.setupEngagementTracking();
        this.setupHeartbeat();
        
        console.log('📊 CrackTotalAdvancedAnalytics initialized');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', { timestamp: Date.now() });
            } else {
                this.trackEvent('page_visible', { timestamp: Date.now() });
                this.lastActivity = Date.now();
            }
        });

        // Antes de salir de la página
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Errores JavaScript
        window.addEventListener('error', (e) => {
            this.trackEvent('javascript_error', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        });

        // Promises rechazadas
        window.addEventListener('unhandledrejection', (e) => {
            this.trackEvent('promise_rejection', {
                reason: e.reason?.toString() || 'Unknown'
            });
        });
    }

    /**
     * Tracking de page views
     */
    trackPageView() {
        this.metrics.pageViews++;
        
        const pageData = {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: Date.now(),
            sessionId: this.config.sessionId,
            userId: this.config.userId
        };

        this.trackEvent('page_view', pageData);
        
        // Enviar a Google Analytics
        if (window.gtag) {
            gtag('config', 'G-5XP3T1RTH7', {
                page_title: pageData.title,
                page_location: pageData.url,
                custom_map: {
                    dimension1: 'session_id',
                    dimension2: 'user_engagement_score'
                }
            });

            gtag('event', 'page_view', {
                page_title: pageData.title,
                page_location: pageData.url,
                session_id: this.config.sessionId,
                user_id: this.config.userId
            });
        }
    }

    /**
     * Tracking de scroll
     */
    setupScrollTracking() {
        let maxScrollDepth = 0;
        let scrollMilestones = [25, 50, 75, 90, 100];
        let trackedMilestones = new Set();

        const trackScroll = () => {
            const scrolled = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrolled / maxScroll) * 100);

            if (scrollPercent > maxScrollDepth) {
                maxScrollDepth = scrollPercent;
                this.metrics.scrollDepth = maxScrollDepth;
            }

            // Trackear milestones
            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
                    trackedMilestones.add(milestone);
                    this.trackEvent('scroll_milestone', {
                        percentage: milestone,
                        timestamp: Date.now()
                    });

                    if (window.gtag) {
                        gtag('event', 'scroll', {
                            event_category: 'engagement',
                            event_label: `${milestone}%`,
                            value: milestone
                        });
                    }
                }
            });
        };

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(trackScroll, 100);
        });
    }

    /**
     * Tracking de clicks
     */
    setupClickTracking() {
        document.addEventListener('click', (e) => {
            this.metrics.clicks++;
            this.lastActivity = Date.now();

            const element = e.target;
            const clickData = {
                element: element.tagName,
                className: element.className,
                id: element.id,
                text: element.textContent?.substring(0, 100) || '',
                href: element.href || '',
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now()
            };

            this.trackEvent('click', clickData);

            // Tracking específico para elementos importantes
            if (element.tagName === 'A') {
                this.trackEvent('link_click', {
                    url: element.href,
                    text: element.textContent,
                    external: !element.href.includes('cracktotal.com')
                });

                if (window.gtag) {
                    gtag('event', 'click', {
                        event_category: 'navigation',
                        event_label: element.href,
                        value: clickData.external ? 0 : 1
                    });
                }
            }

            if (element.tagName === 'BUTTON' || element.classList.contains('btn')) {
                this.trackEvent('button_click', {
                    text: element.textContent,
                    className: element.className
                });

                if (window.gtag) {
                    gtag('event', 'click', {
                        event_category: 'interaction',
                        event_label: element.textContent,
                        value: 1
                    });
                }
            }
        });
    }

    /**
     * Tracking de tiempo en página
     */
    setupTimeTracking() {
        setInterval(() => {
            if (!document.hidden) {
                this.metrics.timeOnPage = Date.now() - this.sessionStartTime;
                
                // Trackear milestones de tiempo
                const timeInSeconds = Math.floor(this.metrics.timeOnPage / 1000);
                const timeMilestones = [30, 60, 120, 300, 600]; // 30s, 1m, 2m, 5m, 10m

                timeMilestones.forEach(milestone => {
                    if (timeInSeconds === milestone) {
                        this.trackEvent('time_milestone', {
                            seconds: milestone,
                            timestamp: Date.now()
                        });

                        if (window.gtag) {
                            gtag('event', 'timing_complete', {
                                event_category: 'engagement',
                                name: 'time_on_page',
                                value: milestone
                            });
                        }
                    }
                });
            }
        }, 1000);
    }

    /**
     * Tracking de rendimiento
     */
    setupPerformanceTracking() {
        if (!window.performance) return;

        // Métricas básicas de performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = performance.timing;
                const navigation = performance.navigation;
                
                this.metrics.performance = {
                    loadTime: timing.loadEventEnd - timing.navigationStart,
                    domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                    firstByte: timing.responseStart - timing.navigationStart,
                    navigationType: navigation.type,
                    redirectCount: navigation.redirectCount
                };

                this.trackEvent('performance_metrics', this.metrics.performance);

                if (window.gtag) {
                    gtag('event', 'timing_complete', {
                        event_category: 'performance',
                        name: 'page_load_time',
                        value: this.metrics.performance.loadTime
                    });
                }
            }, 0);
        });

        // Core Web Vitals
        if ('PerformanceObserver' in window) {
            // First Input Delay
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.trackEvent('core_web_vital', {
                        metric: 'FID',
                        value: entry.processingStart - entry.startTime,
                        timestamp: Date.now()
                    });
                }
            }).observe({ entryTypes: ['first-input'] });

            // Largest Contentful Paint
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.trackEvent('core_web_vital', {
                    metric: 'LCP',
                    value: lastEntry.startTime,
                    timestamp: Date.now()
                });
            }).observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }

    /**
     * Tracking de engagement
     */
    setupEngagementTracking() {
        // Trackear formularios
        document.addEventListener('submit', (e) => {
            const form = e.target;
            this.trackEvent('form_submit', {
                formId: form.id,
                formClass: form.className,
                action: form.action,
                method: form.method
            });
        });

        // Trackear inputs
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.trackEvent('form_interaction', {
                    inputType: e.target.type,
                    inputName: e.target.name,
                    inputId: e.target.id
                });
            }
        });

        // Trackear búsquedas
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.type === 'search') {
                this.trackEvent('search', {
                    query: e.target.value,
                    searchType: 'internal'
                });
            }
        });
    }

    /**
     * Heartbeat para mantener la sesión activa
     */
    setupHeartbeat() {
        setInterval(() => {
            if (!document.hidden && Date.now() - this.lastActivity < 300000) { // 5 minutos
                this.trackEvent('heartbeat', {
                    sessionDuration: Date.now() - this.sessionStartTime,
                    timestamp: Date.now()
                });
            }
        }, 60000); // Cada minuto
    }

    /**
     * Trackear eventos personalizados
     */
    trackEvent(eventName, eventData = {}) {
        const event = {
            name: eventName,
            data: {
                ...eventData,
                sessionId: this.config.sessionId,
                userId: this.config.userId,
                url: window.location.href,
                timestamp: Date.now()
            }
        };

        this.events.push(event);

        if (this.config.debugMode) {
            console.log('📊 Analytics Event:', event);
        }

        // Enviar a servicios externos si están disponibles
        this.sendToExternalServices(event);

        // Guardar en localStorage para análisis offline
        this.saveToLocalStorage(event);
    }

    /**
     * Trackear juegos específicos
     */
    trackGameEvent(gameType, eventType, data = {}) {
        this.trackEvent('game_event', {
            gameType,
            eventType,
            ...data
        });

        if (window.gtag) {
            gtag('event', 'game_interaction', {
                event_category: 'games',
                event_label: `${gameType}_${eventType}`,
                custom_parameter_1: gameType,
                custom_parameter_2: eventType
            });
        }
    }

    /**
     * Calcular score de engagement
     */
    calculateEngagementScore() {
        const timeScore = Math.min(this.metrics.timeOnPage / 60000, 10); // Max 10 puntos por tiempo
        const scrollScore = this.metrics.scrollDepth / 10; // Max 10 puntos por scroll
        const clickScore = Math.min(this.metrics.clicks, 20) / 2; // Max 10 puntos por clicks
        
        const totalScore = Math.round(timeScore + scrollScore + clickScore);
        
        this.metrics.userEngagement.score = totalScore;
        this.metrics.userEngagement.timeScore = timeScore;
        this.metrics.userEngagement.scrollScore = scrollScore;
        this.metrics.userEngagement.clickScore = clickScore;

        return totalScore;
    }

    /**
     * Enviar a servicios externos
     */
    sendToExternalServices(event) {
        // Google Analytics 4
        if (window.gtag && this.config.trackingEnabled) {
            gtag('event', event.name, {
                event_category: 'custom',
                custom_parameter_1: JSON.stringify(event.data)
            });
        }

        // Aquí se pueden agregar otros servicios como Mixpanel, Amplitude, etc.
    }

    /**
     * Guardar en localStorage
     */
    saveToLocalStorage(event) {
        try {
            let storedEvents = JSON.parse(localStorage.getItem('crackTotalAnalytics') || '[]');
            storedEvents.push(event);
            
            // Mantener solo los últimos 100 eventos
            if (storedEvents.length > 100) {
                storedEvents = storedEvents.slice(-100);
            }
            
            localStorage.setItem('crackTotalAnalytics', JSON.stringify(storedEvents));
        } catch (e) {
            console.warn('Could not save analytics to localStorage:', e);
        }
    }

    /**
     * Trackear fin de sesión
     */
    trackSessionEnd() {
        const sessionData = {
            duration: Date.now() - this.sessionStartTime,
            pageViews: this.metrics.pageViews,
            clicks: this.metrics.clicks,
            maxScrollDepth: this.metrics.scrollDepth,
            engagementScore: this.calculateEngagementScore(),
            events: this.events.length
        };

        this.trackEvent('session_end', sessionData);

        // Enviar datos críticos antes de cerrar
        if (window.gtag) {
            gtag('event', 'session_end', {
                event_category: 'engagement',
                session_duration: sessionData.duration,
                engagement_score: sessionData.engagementScore
            });
        }
    }

    /**
     * Utilities
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
        let userId = localStorage.getItem('crackTotalUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('crackTotalUserId', userId);
        }
        return userId;
    }

    // API pública
    getMetrics() {
        return {
            ...this.metrics,
            engagementScore: this.calculateEngagementScore(),
            sessionDuration: Date.now() - this.sessionStartTime
        };
    }

    getEvents() {
        return this.events;
    }

    exportAnalytics() {
        const data = {
            sessionId: this.config.sessionId,
            userId: this.config.userId,
            metrics: this.getMetrics(),
            events: this.events,
            exportTime: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cracktotal-analytics-${this.config.sessionId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    enableDebugMode() {
        this.config.debugMode = true;
        console.log('📊 Analytics Debug Mode enabled');
    }

    disableTracking() {
        this.config.trackingEnabled = false;
        console.log('📊 Analytics tracking disabled');
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.CrackTotalAdvancedAnalytics = new CrackTotalAdvancedAnalytics();
    
    // Exponer funciones útiles
    window.getAnalyticsMetrics = () => window.CrackTotalAdvancedAnalytics.getMetrics();
    window.exportAnalytics = () => window.CrackTotalAdvancedAnalytics.exportAnalytics();
    window.trackGameEvent = (gameType, eventType, data) => 
        window.CrackTotalAdvancedAnalytics.trackGameEvent(gameType, eventType, data);
    window.enableAnalyticsDebug = () => window.CrackTotalAdvancedAnalytics.enableDebugMode();
}

export default CrackTotalAdvancedAnalytics; 