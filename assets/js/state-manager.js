/**
 * ========================================
 * CRACK TOTAL - GLOBAL STATE MANAGER
 * ========================================
 * Centralized state management for the entire application
 */

class CrackTotalStateManager {
    constructor() {
        this.state = {
            user: {
                id: null,
                name: '',
                email: '',
                isAuthenticated: false,
                preferences: {
                    theme: 'dark',
                    sound: true,
                    notifications: true,
                    language: 'es'
                }
            },
            game: {
                currentGame: null,
                difficulty: 'normal',
                sound: true,
                isPlaying: false,
                score: 0,
                streak: 0
            },
            stats: {
                pasalache: {},
                quiensabemas: {},
                mentiroso: {},
                crackrapido: {},
                achievements: []
            },
            ui: {
                loading: false,
                modal: null,
                notification: null,
                theme: 'dark',
                sidebarOpen: false
            },
            offline: {
                isOffline: !navigator.onLine,
                pendingSync: [],
                lastSync: null
            },
            performance: {
                metrics: {},
                loadTime: null,
                renderTime: null
            }
        };

        this.subscribers = new Map();
        this.middleware = [];
        this.history = [];
        this.maxHistory = 50;

        this.init();
    }

    init() {
        // Load saved state from localStorage
        this.loadState();
        
        // Setup offline detection
        this.setupOfflineDetection();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();

        // Auto-save state periodically
        setInterval(() => this.saveState(), 30000);
        
        console.log('🚀 CrackTotalStateManager initialized');
    }

    /**
     * Subscribe to state changes
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        this.subscribers.get(path).add(callback);

        // Return unsubscribe function
        return () => {
            this.subscribers.get(path)?.delete(callback);
        };
    }

    /**
     * Update state and notify subscribers
     */
    setState(path, value, options = {}) {
        const { silent = false, merge = true } = options;
        
        // Store previous state for history
        const previousState = JSON.parse(JSON.stringify(this.state));
        
        // Apply middleware
        for (const middleware of this.middleware) {
            const result = middleware(path, value, this.state);
            if (result === false) return; // Cancel update
        }

        // Update state
        this.setNestedValue(this.state, path, value, merge);
        
        // Add to history
        this.addToHistory({
            timestamp: Date.now(),
            path,
            value,
            previousState,
            newState: JSON.parse(JSON.stringify(this.state))
        });

        // Notify subscribers
        if (!silent) {
            this.notifySubscribers(path);
        }

        // Auto-save critical data
        if (this.isCriticalPath(path)) {
            this.saveState();
        }

        console.log(`📊 State updated: ${path}`, value);
    }

    /**
     * Get state value by path
     */
    getState(path = '') {
        if (!path) return this.state;
        return this.getNestedValue(this.state, path);
    }

    /**
     * Add middleware for state updates
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Batch multiple state updates
     */
    batchUpdate(updates, options = {}) {
        const { silent = false } = options;
        
        for (const [path, value] of Object.entries(updates)) {
            this.setState(path, value, { silent: true });
        }
        
        if (!silent) {
            // Notify all affected subscribers
            Object.keys(updates).forEach(path => {
                this.notifySubscribers(path);
            });
        }
    }

    /**
     * Reset state to default values
     */
    reset(preserveUser = true) {
        const userState = preserveUser ? this.state.user : null;
        
        this.state = {
            user: userState || {
                id: null,
                name: '',
                email: '',
                isAuthenticated: false,
                preferences: {
                    theme: 'dark',
                    sound: true,
                    notifications: true,
                    language: 'es'
                }
            },
            game: {
                currentGame: null,
                difficulty: 'normal',
                sound: true,
                isPlaying: false,
                score: 0,
                streak: 0
            },
            stats: {
                pasalache: {},
                quiensabemas: {},
                mentiroso: {},
                crackrapido: {},
                achievements: []
            },
            ui: {
                loading: false,
                modal: null,
                notification: null,
                theme: this.state.user?.preferences?.theme || 'dark',
                sidebarOpen: false
            },
            offline: {
                isOffline: !navigator.onLine,
                pendingSync: [],
                lastSync: null
            },
            performance: {
                metrics: {},
                loadTime: null,
                renderTime: null
            }
        };

        this.notifyAllSubscribers();
    }

    /**
     * Performance monitoring
     */
    setupPerformanceMonitoring() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    this.setState('performance.loadTime', perfData.loadEventEnd - perfData.fetchStart);
                    
                    // Core Web Vitals
                    this.measureCoreWebVitals();
                }, 0);
            });
        }
    }

    measureCoreWebVitals() {
        // First Contentful Paint
        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.setState('performance.metrics.fcp', entry.startTime);
                    }
                }
            }).observe({ entryTypes: ['paint'] });
        } catch (error) {
            console.warn('Performance Observer not supported');
        }

        // Largest Contentful Paint
        try {
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.setState('performance.metrics.lcp', lastEntry.startTime);
            }).observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (error) {
            console.warn('LCP Observer not supported');
        }
    }

    /**
     * Offline detection and sync management
     */
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.setState('offline.isOffline', false);
            this.syncPendingData();
        });

        window.addEventListener('offline', () => {
            this.setState('offline.isOffline', true);
        });
    }

    /**
     * Sync pending data when online
     */
    async syncPendingData() {
        const pendingSync = this.getState('offline.pendingSync');
        if (pendingSync.length === 0) return;

        try {
            // Process pending sync operations
            for (const operation of pendingSync) {
                await this.processSyncOperation(operation);
            }
            
            this.setState('offline.pendingSync', []);
            this.setState('offline.lastSync', Date.now());
            
            if (window.NotificationSystem) {
                window.NotificationSystem.success('Sincronización', 'Datos sincronizados correctamente');
            }
        } catch (error) {
            console.error('Error syncing data:', error);
        }
    }

    /**
     * Add operation to pending sync
     */
    addToPendingSync(operation) {
        const pendingSync = this.getState('offline.pendingSync') || [];
        pendingSync.push({
            ...operation,
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        });
        this.setState('offline.pendingSync', pendingSync);
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            const stateToSave = {
                user: this.state.user,
                stats: this.state.stats,
                ui: {
                    theme: this.state.ui.theme
                }
            };
            localStorage.setItem('crackTotalState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('crackTotalState');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.batchUpdate(parsed, { silent: true });
            }
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }

    /**
     * Utility methods
     */
    setNestedValue(obj, path, value, merge = true) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        const lastKey = keys[keys.length - 1];
        if (merge && typeof current[lastKey] === 'object' && typeof value === 'object') {
            current[lastKey] = { ...current[lastKey], ...value };
        } else {
            current[lastKey] = value;
        }
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    notifySubscribers(path) {
        // Notify exact path subscribers
        this.subscribers.get(path)?.forEach(callback => {
            try {
                callback(this.getNestedValue(this.state, path), path);
            } catch (error) {
                console.error('Error in subscriber callback:', error);
            }
        });

        // Notify parent path subscribers
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            this.subscribers.get(parentPath)?.forEach(callback => {
                try {
                    callback(this.getNestedValue(this.state, parentPath), parentPath);
                } catch (error) {
                    console.error('Error in parent subscriber callback:', error);
                }
            });
        }
    }

    notifyAllSubscribers() {
        this.subscribers.forEach((callbacks, path) => {
            callbacks.forEach(callback => {
                try {
                    callback(this.getNestedValue(this.state, path), path);
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        });
    }

    isCriticalPath(path) {
        const criticalPaths = ['user', 'stats', 'ui.theme'];
        return criticalPaths.some(criticalPath => path.startsWith(criticalPath));
    }

    addToHistory(entry) {
        this.history.push(entry);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    async processSyncOperation(operation) {
        // Implementation depends on the type of operation
        switch (operation.type) {
            case 'updateStats':
                // Sync stats to Firebase
                break;
            case 'saveScore':
                // Sync score to leaderboard
                break;
            default:
                console.warn('Unknown sync operation:', operation);
        }
    }

    /**
     * Debug methods
     */
    getDebugInfo() {
        return {
            state: this.state,
            subscribers: Array.from(this.subscribers.keys()),
            history: this.history.slice(-10),
            performance: this.state.performance
        };
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.CrackTotalState = new CrackTotalStateManager();
    
    // Make it available globally for debugging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.debugState = () => console.log(window.CrackTotalState.getDebugInfo());
    }
}

export default CrackTotalStateManager; 