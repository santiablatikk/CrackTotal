/**
 * ========================================
 * CRACK TOTAL - ADVANCED LOGGER MANAGER
 * ========================================
 * Comprehensive logging and debugging system
 */

class CrackTotalLoggerManager {
    constructor() {
        this.config = {
            enabled: true,
            level: this.isDevelopment() ? 'debug' : 'info',
            persistLogs: true,
            maxLogSize: 1000,
            enableConsoleOutput: true,
            enableRemoteLogging: false,
            remoteEndpoint: null,
            enablePerformanceLogging: true,
            enableErrorTracking: true
        };

        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            fatal: 4
        };

        this.logs = [];
        this.errorLogs = [];
        this.performanceLogs = [];
        this.userActionLogs = [];
        
        this.logBuffer = [];
        this.flushTimer = null;
        
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        
        this.contexts = new Map();
        this.loggers = new Map();
        
        this.init();
    }

    init() {
        if (!this.config.enabled) return;

        this.setupConsoleOverrides();
        this.setupErrorTracking();
        this.setupPerformanceLogging();
        this.setupUserActionTracking();
        this.loadStoredLogs();
        this.startLogFlushing();
        
        // Log system initialization
        this.info('Logger', 'CrackTotalLoggerManager initialized', {
            level: this.config.level,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Core Logging Methods
     */
    log(level, category, message, data = {}, context = {}) {
        if (!this.config.enabled || !this.shouldLog(level)) return;

        const logEntry = this.createLogEntry(level, category, message, data, context);
        
        // Add to appropriate log arrays
        this.logs.push(logEntry);
        
        if (level === 'error' || level === 'fatal') {
            this.errorLogs.push(logEntry);
        }

        // Console output
        if (this.config.enableConsoleOutput) {
            this.outputToConsole(logEntry);
        }

        // Buffer for remote logging
        if (this.config.enableRemoteLogging) {
            this.logBuffer.push(logEntry);
        }

        // Persist logs
        if (this.config.persistLogs) {
            this.saveLogs();
        }

        // Trigger log event
        this.triggerLogEvent(logEntry);

        // Maintain log size limit
        this.maintainLogSize();
    }

    debug(category, message, data = {}, context = {}) {
        this.log('debug', category, message, data, context);
    }

    info(category, message, data = {}, context = {}) {
        this.log('info', category, message, data, context);
    }

    warn(category, message, data = {}, context = {}) {
        this.log('warn', category, message, data, context);
    }

    error(category, message, data = {}, context = {}) {
        this.log('error', category, message, data, context);
    }

    fatal(category, message, data = {}, context = {}) {
        this.log('fatal', category, message, data, context);
    }

    /**
     * Specialized Logging Methods
     */
    logPerformance(operation, duration, data = {}) {
        const perfLog = {
            type: 'performance',
            operation,
            duration,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            ...data
        };

        this.performanceLogs.push(perfLog);
        this.info('Performance', `${operation} completed`, {
            duration: `${duration}ms`,
            ...data
        });

        // Track with analytics if available
        if (window.CrackTotalAnalytics) {
            window.CrackTotalAnalytics.trackEvent('performance', 'operation_timing', {
                operation,
                duration,
                ...data
            });
        }
    }

    logUserAction(action, element = null, data = {}) {
        const actionLog = {
            type: 'user_action',
            action,
            element: element ? this.serializeElement(element) : null,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            page: window.location.pathname,
            ...data
        };

        this.userActionLogs.push(actionLog);
        this.debug('UserAction', action, actionLog);
    }

    logGameEvent(gameType, event, data = {}) {
        this.info('Game', `${gameType}: ${event}`, {
            gameType,
            event,
            timestamp: Date.now(),
            ...data
        });
    }

    logApiCall(url, method, duration, status, error = null) {
        const apiLog = {
            type: 'api',
            url,
            method,
            duration,
            status,
            error,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };

        if (error || status >= 400) {
            this.error('API', `${method} ${url} failed`, apiLog);
        } else {
            this.info('API', `${method} ${url} (${duration}ms)`, apiLog);
        }
    }

    logSecurityEvent(type, severity, data = {}) {
        this.warn('Security', `Security event: ${type}`, {
            type,
            severity,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...data
        });
    }

    /**
     * Console Overrides
     */
    setupConsoleOverrides() {
        if (!this.isDevelopment()) return; // Only in development

        const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };

        // Override console methods to also log to our system
        console.log = (...args) => {
            originalConsole.log(...args);
            this.info('Console', 'Log', { args: this.serializeArgs(args) });
        };

        console.info = (...args) => {
            originalConsole.info(...args);
            this.info('Console', 'Info', { args: this.serializeArgs(args) });
        };

        console.warn = (...args) => {
            originalConsole.warn(...args);
            this.warn('Console', 'Warning', { args: this.serializeArgs(args) });
        };

        console.error = (...args) => {
            originalConsole.error(...args);
            this.error('Console', 'Error', { args: this.serializeArgs(args) });
        };

        console.debug = (...args) => {
            originalConsole.debug(...args);
            this.debug('Console', 'Debug', { args: this.serializeArgs(args) });
        };

        // Store original methods for restoration
        this.originalConsole = originalConsole;
    }

    /**
     * Error Tracking
     */
    setupErrorTracking() {
        if (!this.config.enableErrorTracking) return;

        // Global error handler
        window.addEventListener('error', (event) => {
            this.error('GlobalError', 'JavaScript Error', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error('GlobalError', 'Unhandled Promise Rejection', {
                reason: event.reason?.toString(),
                stack: event.reason?.stack,
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });

        // CSP violations
        window.addEventListener('securitypolicyviolation', (event) => {
            this.logSecurityEvent('CSP Violation', 'high', {
                directive: event.violatedDirective,
                blocked_uri: event.blockedURI,
                source_file: event.sourceFile,
                line_number: event.lineNumber
            });
        });
    }

    /**
     * Performance Logging
     */
    setupPerformanceLogging() {
        if (!this.config.enablePerformanceLogging) return;

        // Navigation timing
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (performance.getEntriesByType) {
                    const navigationEntry = performance.getEntriesByType('navigation')[0];
                    if (navigationEntry) {
                        this.logPerformance('page_load', navigationEntry.loadEventEnd - navigationEntry.fetchStart, {
                            navigation_type: navigationEntry.type,
                            dns_lookup: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
                            tcp_connect: navigationEntry.connectEnd - navigationEntry.connectStart,
                            server_response: navigationEntry.responseStart - navigationEntry.requestStart,
                            dom_processing: navigationEntry.domContentLoadedEventStart - navigationEntry.responseEnd
                        });
                    }
                }
            }, 0);
        });

        // Resource timing
        if (performance.getEntriesByType) {
            setInterval(() => {
                const resources = performance.getEntriesByType('resource');
                const newResources = resources.slice(-10); // Last 10 resources
                
                newResources.forEach(resource => {
                    if (resource.duration > 1000) { // Log slow resources
                        this.logPerformance('slow_resource', resource.duration, {
                            name: resource.name,
                            type: this.getResourceType(resource.name),
                            size: resource.transferSize || 0
                        });
                    }
                });
            }, 10000); // Every 10 seconds
        }
    }

    /**
     * User Action Tracking
     */
    setupUserActionTracking() {
        // Click tracking
        document.addEventListener('click', (event) => {
            const target = event.target;
            this.logUserAction('click', target, {
                x: event.clientX,
                y: event.clientY,
                button: event.button
            });
        });

        // Form submissions
        document.addEventListener('submit', (event) => {
            this.logUserAction('form_submit', event.target, {
                form_id: event.target.id,
                action: event.target.action
            });
        });

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.logUserAction('visibility_change', null, {
                hidden: document.hidden,
                visibility_state: document.visibilityState
            });
        });
    }

    /**
     * Context Management
     */
    setContext(key, value) {
        this.contexts.set(key, value);
    }

    getContext(key) {
        return this.contexts.get(key);
    }

    clearContext(key) {
        this.contexts.delete(key);
    }

    withContext(context, callback) {
        const originalContexts = new Map(this.contexts);
        
        // Set temporary context
        Object.entries(context).forEach(([key, value]) => {
            this.contexts.set(key, value);
        });

        try {
            return callback();
        } finally {
            // Restore original context
            this.contexts = originalContexts;
        }
    }

    /**
     * Named Loggers
     */
    getLogger(name) {
        if (!this.loggers.has(name)) {
            this.loggers.set(name, new NamedLogger(name, this));
        }
        return this.loggers.get(name);
    }

    /**
     * Log Management
     */
    createLogEntry(level, category, message, data, context) {
        return {
            id: this.generateLogId(),
            timestamp: Date.now(),
            level,
            category,
            message,
            data,
            context: { ...Object.fromEntries(this.contexts), ...context },
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            stack: this.config.level === 'debug' ? new Error().stack : null
        };
    }

    shouldLog(level) {
        return this.levels[level] >= this.levels[this.config.level];
    }

    outputToConsole(logEntry) {
        const { level, category, message, data } = logEntry;
        const prefix = `[${new Date(logEntry.timestamp).toISOString()}] [${level.toUpperCase()}] [${category}]`;
        
        const consoleMethod = level === 'debug' ? 'debug' :
                             level === 'info' ? 'info' :
                             level === 'warn' ? 'warn' : 'error';

        if (this.originalConsole) {
            this.originalConsole[consoleMethod](prefix, message, data);
        } else {
            console[consoleMethod](prefix, message, data);
        }
    }

    triggerLogEvent(logEntry) {
        const event = new CustomEvent('crackTotalLog', {
            detail: logEntry
        });
        document.dispatchEvent(event);
    }

    maintainLogSize() {
        if (this.logs.length > this.config.maxLogSize) {
            this.logs = this.logs.slice(-this.config.maxLogSize);
        }
        
        if (this.errorLogs.length > 100) {
            this.errorLogs = this.errorLogs.slice(-100);
        }
        
        if (this.performanceLogs.length > 200) {
            this.performanceLogs = this.performanceLogs.slice(-200);
        }
        
        if (this.userActionLogs.length > 500) {
            this.userActionLogs = this.userActionLogs.slice(-500);
        }
    }

    /**
     * Remote Logging
     */
    startLogFlushing() {
        if (!this.config.enableRemoteLogging) return;

        this.flushTimer = setInterval(() => {
            this.flushLogs();
        }, 30000); // Flush every 30 seconds
    }

    async flushLogs() {
        if (this.logBuffer.length === 0) return;

        const logsToSend = [...this.logBuffer];
        this.logBuffer = [];

        try {
            if (this.config.remoteEndpoint) {
                await fetch(this.config.remoteEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: this.sessionId,
                        logs: logsToSend,
                        metadata: {
                            userAgent: navigator.userAgent,
                            url: window.location.href,
                            timestamp: Date.now()
                        }
                    })
                });
            }
        } catch (error) {
            // Re-add logs to buffer on failure
            this.logBuffer.unshift(...logsToSend);
            console.warn('Failed to send logs to remote endpoint:', error);
        }
    }

    /**
     * Persistence
     */
    saveLogs() {
        try {
            const logsToSave = {
                logs: this.logs.slice(-500), // Keep last 500 logs
                errorLogs: this.errorLogs.slice(-50),
                performanceLogs: this.performanceLogs.slice(-100),
                sessionId: this.sessionId,
                timestamp: Date.now()
            };

            localStorage.setItem('crackTotalLogs', JSON.stringify(logsToSave));
        } catch (error) {
            console.warn('Failed to save logs to localStorage:', error);
        }
    }

    loadStoredLogs() {
        try {
            const stored = localStorage.getItem('crackTotalLogs');
            if (stored) {
                const data = JSON.parse(stored);
                
                // Only load logs from the same session or recent logs
                const oneHourAgo = Date.now() - (60 * 60 * 1000);
                if (data.sessionId === this.sessionId || data.timestamp > oneHourAgo) {
                    this.logs = data.logs || [];
                    this.errorLogs = data.errorLogs || [];
                    this.performanceLogs = data.performanceLogs || [];
                }
            }
        } catch (error) {
            console.warn('Failed to load stored logs:', error);
        }
    }

    /**
     * Utility Methods
     */
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateLogId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    serializeElement(element) {
        return {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            textContent: element.textContent?.substring(0, 100),
            attributes: this.getElementAttributes(element)
        };
    }

    getElementAttributes(element) {
        const attrs = {};
        for (const attr of element.attributes) {
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }

    serializeArgs(args) {
        return args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch {
                    return '[Object]';
                }
            }
            return String(arg);
        });
    }

    getResourceType(url) {
        const extension = url.split('.').pop()?.toLowerCase() || '';
        
        if (['css'].includes(extension)) return 'stylesheet';
        if (['js'].includes(extension)) return 'script';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
        if (['woff', 'woff2', 'ttf', 'eot'].includes(extension)) return 'font';
        if (['json'].includes(extension)) return 'data';
        
        return 'other';
    }

    /**
     * Export and Analysis
     */
    exportLogs(type = 'all') {
        const data = {
            sessionId: this.sessionId,
            exportTime: new Date().toISOString(),
            logs: type === 'all' || type === 'logs' ? this.logs : [],
            errorLogs: type === 'all' || type === 'errors' ? this.errorLogs : [],
            performanceLogs: type === 'all' || type === 'performance' ? this.performanceLogs : [],
            userActionLogs: type === 'all' || type === 'actions' ? this.userActionLogs : []
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `crack-total-logs-${type}-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    getLogSummary() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        const recentLogs = this.logs.filter(log => log.timestamp > oneHourAgo);
        const recentErrors = this.errorLogs.filter(log => log.timestamp > oneHourAgo);
        
        return {
            total: this.logs.length,
            errors: this.errorLogs.length,
            performance: this.performanceLogs.length,
            userActions: this.userActionLogs.length,
            recentLogs: recentLogs.length,
            recentErrors: recentErrors.length,
            sessionDuration: now - this.startTime,
            averageLogsPerMinute: this.logs.length / ((now - this.startTime) / 60000)
        };
    }

    clearLogs() {
        this.logs = [];
        this.errorLogs = [];
        this.performanceLogs = [];
        this.userActionLogs = [];
        localStorage.removeItem('crackTotalLogs');
    }
}

/**
 * Named Logger Class
 */
class NamedLogger {
    constructor(name, manager) {
        this.name = name;
        this.manager = manager;
    }

    debug(message, data = {}, context = {}) {
        this.manager.debug(this.name, message, data, context);
    }

    info(message, data = {}, context = {}) {
        this.manager.info(this.name, message, data, context);
    }

    warn(message, data = {}, context = {}) {
        this.manager.warn(this.name, message, data, context);
    }

    error(message, data = {}, context = {}) {
        this.manager.error(this.name, message, data, context);
    }

    fatal(message, data = {}, context = {}) {
        this.manager.fatal(this.name, message, data, context);
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.CrackTotalLogger = new CrackTotalLoggerManager();
    
    // Debugging utilities
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.exportLogs = (type) => window.CrackTotalLogger.exportLogs(type);
        window.getLogSummary = () => window.CrackTotalLogger.getLogSummary();
        window.clearLogs = () => window.CrackTotalLogger.clearLogs();
    }
}

export default CrackTotalLoggerManager; 