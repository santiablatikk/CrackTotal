/**
 * ========================================
 * CRACK TOTAL - SECURITY MANAGER
 * ========================================
 * Comprehensive security system for the application
 */

class CrackTotalSecurityManager {
    constructor() {
        this.config = {
            maxRequestsPerMinute: 60,
            maxFailedAttempts: 5,
            blockDuration: 15 * 60 * 1000, // 15 minutes
            tokenExpiration: 24 * 60 * 60 * 1000, // 24 hours
            csrfTokenLength: 32,
            sessionTimeout: 30 * 60 * 1000 // 30 minutes
        };

        this.rateLimiter = new Map();
        this.failedAttempts = new Map();
        this.blockedIPs = new Map();
        this.activeSessions = new Map();
        this.csrfTokens = new Map();

        this.init();
    }

    init() {
        this.setupCSP();
        this.setupXSSProtection();
        this.setupInputValidation();
        this.setupRateLimiting();
        this.setupSessionManager();
        
        // Cleanup expired entries periodically
        setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
        
        console.log('🛡️ CrackTotalSecurityManager initialized');
    }

    /**
     * Content Security Policy
     */
    setupCSP() {
        if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            return; // CSP already set
        }

        const csp = [
            "default-src 'self'",
            // Permitir dominios de Google Ads/Analytics necesarios
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://adservice.google.com https://adservice.google.com.ar",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://firestore.googleapis.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://adservice.google.com https://adservice.google.com.ar wss: ws:",
            // AdSense usa iframes desde estos orígenes
            "frame-src 'self' https://www.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ');

        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = csp;
        document.head.appendChild(meta);
    }

    /**
     * XSS Protection
     */
    setupXSSProtection() {
        // No se sobreescriben prototipos globales para evitar romper scripts de terceros (AdSense, Analytics, etc.)
        // La validación se maneja a nivel de formularios/inputs en setupInputValidation().
        // Si se requiere sanitización de HTML dinámico, usar utilidades explícitas en el punto de inserción.
        return;
    }

    /**
     * Input Validation
     */
    setupInputValidation() {
        document.addEventListener('input', (event) => {
            const input = event.target;
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                this.validateInput(input);
            }
        });

        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (!this.validateForm(form)) {
                event.preventDefault();
                this.showSecurityWarning('Formulario contiene datos inválidos');
            }
        });
    }

    /**
     * Rate Limiting
     */
    setupRateLimiting() {
        // Monitor API calls (solo same-origin)
        const originalFetch = window.fetch;
        window.fetch = (input, init) => {
            try {
                const url = typeof input === 'string' ? new URL(input, window.location.origin) : new URL(input.url, window.location.origin);
                const isSameOrigin = url.origin === window.location.origin;
                if (isSameOrigin && !this.checkRateLimit('api')) {
                    return Promise.reject(new Error('Rate limit exceeded'));
                }
            } catch (_) {
                // Si falla el parsing, no bloqueamos
            }
            return originalFetch.call(window, input, init);
        };

        // Monitor user actions
        document.addEventListener('click', () => {
            this.logUserAction('click');
        });
    }

    /**
     * Session Management
     */
    setupSessionManager() {
        // Create session token
        const sessionToken = this.generateToken();
        this.activeSessions.set(sessionToken, {
            createdAt: Date.now(),
            lastActivity: Date.now(),
            isValid: true
        });

        // Store session token
        sessionStorage.setItem('crackTotalSession', sessionToken);

        // Monitor session activity
        document.addEventListener('click', () => this.updateSessionActivity());
        document.addEventListener('keypress', () => this.updateSessionActivity());

        // Check session validity periodically
        setInterval(() => this.validateSession(), 60 * 1000); // Every minute
    }

    /**
     * Static Methods for Input Sanitization
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/['"]/g, '') // Remove quotes
            .substring(0, 1000); // Limit length
    }

    static sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email) && email.length <= 254;
    }

    static validateUsername(username) {
        const re = /^[a-zA-Z0-9_]{3,20}$/;
        return re.test(username);
    }

    static validateScore(score) {
        return typeof score === 'number' && score >= 0 && score <= 100000 && Number.isInteger(score);
    }

    /**
     * Instance Methods
     */
    validateInput(input) {
        const value = input.value;
        const type = input.type || input.dataset.validate;

        switch (type) {
            case 'email':
                return this.constructor.validateEmail(value);
            case 'username':
                return this.constructor.validateUsername(value);
            case 'score':
                return this.constructor.validateScore(parseInt(value));
            default:
                return value.length <= 1000; // General length check
        }
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        return Array.from(inputs).every(input => this.validateInput(input));
    }

    checkRateLimit(identifier = 'global') {
        const now = Date.now();
        const windowStart = now - 60 * 1000; // 1 minute window

        if (!this.rateLimiter.has(identifier)) {
            this.rateLimiter.set(identifier, []);
        }

        const requests = this.rateLimiter.get(identifier);
        
        // Remove old requests
        const recentRequests = requests.filter(time => time > windowStart);
        this.rateLimiter.set(identifier, recentRequests);

        // Check limit
        if (recentRequests.length >= this.config.maxRequestsPerMinute) {
            this.logFailedAttempt(identifier);
            return false;
        }

        // Add current request
        recentRequests.push(now);
        return true;
    }

    logUserAction(action, data = {}) {
        const timestamp = Date.now();
        const sessionToken = sessionStorage.getItem('crackTotalSession');
        
        // Log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`🔐 User action: ${action}`, { timestamp, data, sessionToken });
        }

        // You could send to analytics or logging service here
    }

    logFailedAttempt(identifier) {
        const now = Date.now();
        
        if (!this.failedAttempts.has(identifier)) {
            this.failedAttempts.set(identifier, []);
        }

        const attempts = this.failedAttempts.get(identifier);
        attempts.push(now);

        // Remove old attempts
        const recentAttempts = attempts.filter(time => time > now - this.config.blockDuration);
        this.failedAttempts.set(identifier, recentAttempts);

        // Block if too many attempts
        if (recentAttempts.length >= this.config.maxFailedAttempts) {
            this.blockIP(identifier);
        }
    }

    blockIP(identifier) {
        this.blockedIPs.set(identifier, Date.now() + this.config.blockDuration);
        this.showSecurityWarning('Demasiados intentos fallidos. Acceso bloqueado temporalmente.');
        
        console.warn(`🚫 IP blocked: ${identifier}`);
    }

    isBlocked(identifier) {
        const blockUntil = this.blockedIPs.get(identifier);
        if (blockUntil && Date.now() < blockUntil) {
            return true;
        }
        
        if (blockUntil) {
            this.blockedIPs.delete(identifier); // Remove expired block
        }
        
        return false;
    }

    generateToken(length = this.config.csrfTokenLength) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }

    generateCSRFToken() {
        const token = this.generateToken();
        this.csrfTokens.set(token, Date.now() + this.config.tokenExpiration);
        return token;
    }

    validateCSRFToken(token) {
        const expiration = this.csrfTokens.get(token);
        if (!expiration || Date.now() > expiration) {
            this.csrfTokens.delete(token);
            return false;
        }
        return true;
    }

    updateSessionActivity() {
        const sessionToken = sessionStorage.getItem('crackTotalSession');
        const session = this.activeSessions.get(sessionToken);
        
        if (session) {
            session.lastActivity = Date.now();
        }
    }

    validateSession() {
        const sessionToken = sessionStorage.getItem('crackTotalSession');
        const session = this.activeSessions.get(sessionToken);
        
        if (!session) {
            this.invalidateSession();
            return false;
        }

        const now = Date.now();
        const isExpired = now - session.lastActivity > this.config.sessionTimeout;
        
        if (isExpired) {
            this.invalidateSession();
            return false;
        }

        return true;
    }

    invalidateSession() {
        const sessionToken = sessionStorage.getItem('crackTotalSession');
        if (sessionToken) {
            this.activeSessions.delete(sessionToken);
            sessionStorage.removeItem('crackTotalSession');
        }
        
        // Optionally redirect to login or show warning
        this.showSecurityWarning('Sesión expirada. Por favor, recarga la página.');
    }

    showSecurityWarning(message) {
        if (window.NotificationSystem) {
            window.NotificationSystem.warning('⚠️ Advertencia de Seguridad', message);
        } else {
            console.warn('Security Warning:', message);
            // Fallback notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff6b6b;
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }

    cleanup() {
        const now = Date.now();
        
        // Clean expired CSRF tokens
        for (const [token, expiration] of this.csrfTokens.entries()) {
            if (now > expiration) {
                this.csrfTokens.delete(token);
            }
        }
        
        // Clean expired blocks
        for (const [ip, blockUntil] of this.blockedIPs.entries()) {
            if (now > blockUntil) {
                this.blockedIPs.delete(ip);
            }
        }
        
        // Clean old failed attempts
        for (const [identifier, attempts] of this.failedAttempts.entries()) {
            const recentAttempts = attempts.filter(time => time > now - this.config.blockDuration);
            if (recentAttempts.length === 0) {
                this.failedAttempts.delete(identifier);
            } else {
                this.failedAttempts.set(identifier, recentAttempts);
            }
        }
    }

    /**
     * Public API Methods
     */
    secureAPICall(url, options = {}) {
        if (this.isBlocked('api')) {
            return Promise.reject(new Error('API access blocked'));
        }

        if (!this.checkRateLimit('api')) {
            return Promise.reject(new Error('API rate limit exceeded'));
        }

        // Add CSRF token to requests
        const csrfToken = this.generateCSRFToken();
        options.headers = {
            ...options.headers,
            'X-CSRF-Token': csrfToken
        };

        return fetch(url, options);
    }

    validateGameScore(score, gameType, timeSpent) {
        // Validate score based on game type
        const maxScores = {
            pasalache: 27,
            quiensabemas: 100,
            mentiroso: 100,
            crackrapido: 20
        };

        const maxScore = maxScores[gameType] || 100;
        
        if (!this.constructor.validateScore(score) || score > maxScore) {
            this.logFailedAttempt('score_manipulation');
            return false;
        }

        // Check if score is achievable in the given time
        const minTimePerQuestion = 1000; // 1 second minimum
        const minTime = score * minTimePerQuestion;
        
        if (timeSpent < minTime) {
            this.logFailedAttempt('impossible_time');
            return false;
        }

        return true;
    }

    encryptData(data) {
        // Simple obfuscation for client-side storage
        const jsonString = JSON.stringify(data);
        const encoded = btoa(jsonString);
        return encoded.split('').reverse().join('');
    }

    decryptData(encryptedData) {
        try {
            const reversed = encryptedData.split('').reverse().join('');
            const decoded = atob(reversed);
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Failed to decrypt data:', error);
            return null;
        }
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.CrackTotalSecurity = new CrackTotalSecurityManager();
}

export default CrackTotalSecurityManager; 