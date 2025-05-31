/**
 * ========================================
 * CRACK TOTAL - INTELLIGENT CACHE MANAGER
 * ========================================
 * Advanced caching system for optimal performance
 */

class CrackTotalCacheManager {
    constructor() {
        this.config = {
            version: '2.1.0',
            maxCacheSize: 50 * 1024 * 1024, // 50MB
            maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            compressionEnabled: true,
            encryptionEnabled: false,
            preloadCriticalResources: true,
            intelligentPrefetch: true
        };

        this.caches = {
            static: new Map(),      // CSS, JS, Images
            dynamic: new Map(),     // API responses, Game data
            prefetch: new Map(),    // Prefetched resources
            persistent: new Map(),  // Long-term storage
            temporary: new Map()    // Session-based cache
        };

        this.cacheStrategies = {
            'cache-first': this.cacheFirst.bind(this),
            'network-first': this.networkFirst.bind(this),
            'cache-only': this.cacheOnly.bind(this),
            'network-only': this.networkOnly.bind(this),
            'stale-while-revalidate': this.staleWhileRevalidate.bind(this)
        };

        this.resourceTypes = {
            'text/css': { cache: 'static', strategy: 'cache-first', maxAge: 86400000 },
            'text/javascript': { cache: 'static', strategy: 'cache-first', maxAge: 86400000 },
            'application/javascript': { cache: 'static', strategy: 'cache-first', maxAge: 86400000 },
            'image/': { cache: 'static', strategy: 'cache-first', maxAge: 604800000 },
            'font/': { cache: 'static', strategy: 'cache-first', maxAge: 2592000000 },
            'application/json': { cache: 'dynamic', strategy: 'stale-while-revalidate', maxAge: 300000 },
            'text/html': { cache: 'dynamic', strategy: 'network-first', maxAge: 3600000 }
        };

        this.statistics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalRequests: 0,
            cacheSize: 0,
            compressionRatio: 0
        };

        this.prefetchQueue = [];
        this.observers = new Map();

        this.init();
    }

    init() {
        this.loadStoredCache();
        this.setupCacheInterceptors();
        this.setupIntelligentPrefetch();
        this.setupCacheCleanup();
        this.setupPerformanceMonitoring();
        
        // Preload critical resources
        if (this.config.preloadCriticalResources) {
            this.preloadCriticalResources();
        }
        
        console.log('🗄️ CrackTotalCacheManager initialized');
    }

    /**
     * Cache Strategies Implementation
     */
    async cacheFirst(request, cacheType = 'static') {
        const cacheKey = this.generateCacheKey(request);
        const cached = this.get(cacheKey, cacheType);
        
        if (cached && !this.isExpired(cached)) {
            this.statistics.hits++;
            return this.deserializeResponse(cached.data);
        }
        
        try {
            const response = await fetch(request);
            if (response.ok) {
                await this.set(cacheKey, response.clone(), cacheType);
            }
            this.statistics.misses++;
            return response;
        } catch (error) {
            // Return stale cache if network fails
            if (cached) {
                this.statistics.hits++;
                return this.deserializeResponse(cached.data);
            }
            throw error;
        }
    }

    async networkFirst(request, cacheType = 'dynamic') {
        const cacheKey = this.generateCacheKey(request);
        
        try {
            const response = await fetch(request);
            if (response.ok) {
                await this.set(cacheKey, response.clone(), cacheType);
                this.statistics.hits++;
                return response;
            }
            throw new Error('Network response not ok');
        } catch (error) {
            const cached = this.get(cacheKey, cacheType);
            if (cached && !this.isExpired(cached)) {
                this.statistics.misses++;
                return this.deserializeResponse(cached.data);
            }
            throw error;
        }
    }

    async cacheOnly(request, cacheType = 'static') {
        const cacheKey = this.generateCacheKey(request);
        const cached = this.get(cacheKey, cacheType);
        
        if (cached && !this.isExpired(cached)) {
            this.statistics.hits++;
            return this.deserializeResponse(cached.data);
        }
        
        this.statistics.misses++;
        throw new Error('Resource not found in cache');
    }

    async networkOnly(request) {
        this.statistics.misses++;
        return fetch(request);
    }

    async staleWhileRevalidate(request, cacheType = 'dynamic') {
        const cacheKey = this.generateCacheKey(request);
        const cached = this.get(cacheKey, cacheType);
        
        // Return cached version immediately
        let cacheResponse = null;
        if (cached) {
            cacheResponse = this.deserializeResponse(cached.data);
            this.statistics.hits++;
        }
        
        // Update cache in background
        fetch(request)
            .then(async (response) => {
                if (response.ok) {
                    await this.set(cacheKey, response.clone(), cacheType);
                }
            })
            .catch(error => {
                console.warn('Background cache update failed:', error);
            });
        
        if (cacheResponse) {
            return cacheResponse;
        }
        
        // If no cache, wait for network
        this.statistics.misses++;
        return fetch(request);
    }

    /**
     * Core Cache Operations
     */
    async set(key, data, cacheType = 'dynamic') {
        try {
            const cache = this.caches[cacheType];
            if (!cache) throw new Error(`Cache type '${cacheType}' not found`);
            
            const serializedData = await this.serializeData(data);
            const compressed = this.config.compressionEnabled ? 
                this.compress(serializedData) : serializedData;
            
            const cacheEntry = {
                data: compressed,
                timestamp: Date.now(),
                size: this.getDataSize(compressed),
                compressed: this.config.compressionEnabled,
                hits: 0,
                lastAccess: Date.now()
            };
            
            // Check cache size limits
            if (this.shouldEvict(cacheEntry.size)) {
                this.evictLRU(cacheType);
            }
            
            cache.set(key, cacheEntry);
            this.updateStatistics();
            this.persistCache();
            
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    get(key, cacheType = 'dynamic') {
        const cache = this.caches[cacheType];
        if (!cache) return null;
        
        const entry = cache.get(key);
        if (!entry) return null;
        
        // Update access statistics
        entry.hits++;
        entry.lastAccess = Date.now();
        
        return entry;
    }

    delete(key, cacheType = 'dynamic') {
        const cache = this.caches[cacheType];
        if (cache && cache.has(key)) {
            cache.delete(key);
            this.updateStatistics();
            this.persistCache();
            return true;
        }
        return false;
    }

    clear(cacheType = null) {
        if (cacheType) {
            const cache = this.caches[cacheType];
            if (cache) {
                cache.clear();
            }
        } else {
            Object.values(this.caches).forEach(cache => cache.clear());
        }
        
        this.updateStatistics();
        this.persistCache();
    }

    /**
     * Smart Caching Features
     */
    setupCacheInterceptors() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        
        window.fetch = async (input, init = {}) => {
            const request = new Request(input, init);
            const url = new URL(request.url, window.location.origin);
            
            // Skip cache for external URLs unless explicitly enabled
            if (url.origin !== window.location.origin && !init.useCache) {
                return originalFetch(request);
            }
            
            const resourceConfig = this.getResourceConfig(request);
            if (!resourceConfig) {
                return originalFetch(request);
            }
            
            const strategy = this.cacheStrategies[resourceConfig.strategy];
            if (strategy) {
                this.statistics.totalRequests++;
                return strategy(request, resourceConfig.cache);
            }
            
            return originalFetch(request);
        };
    }

    getResourceConfig(request) {
        const url = new URL(request.url);
        const pathname = url.pathname.toLowerCase();
        const contentType = request.headers.get('content-type') || '';
        
        // Check by content type
        for (const [type, config] of Object.entries(this.resourceTypes)) {
            if (contentType.includes(type) || pathname.includes(type.replace('/', '.'))) {
                return config;
            }
        }
        
        // Check by file extension
        const extension = pathname.split('.').pop();
        const extensionMap = {
            'css': this.resourceTypes['text/css'],
            'js': this.resourceTypes['text/javascript'],
            'json': this.resourceTypes['application/json'],
            'html': this.resourceTypes['text/html'],
            'jpg': this.resourceTypes['image/'],
            'jpeg': this.resourceTypes['image/'],
            'png': this.resourceTypes['image/'],
            'gif': this.resourceTypes['image/'],
            'webp': this.resourceTypes['image/'],
            'svg': this.resourceTypes['image/'],
            'woff': this.resourceTypes['font/'],
            'woff2': this.resourceTypes['font/'],
            'ttf': this.resourceTypes['font/']
        };
        
        return extensionMap[extension];
    }

    setupIntelligentPrefetch() {
        if (!this.config.intelligentPrefetch) return;
        
        // Prefetch on link hover
        document.addEventListener('mouseover', (event) => {
            const link = event.target.closest('a[href]');
            if (link && !link.dataset.prefetched) {
                this.prefetchResource(link.href);
                link.dataset.prefetched = 'true';
            }
        });
        
        // Prefetch on intersection (viewport proximity)
        if ('IntersectionObserver' in window) {
            const prefetchObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        if (element.dataset.prefetch) {
                            this.prefetchResource(element.dataset.prefetch);
                            prefetchObserver.unobserve(element);
                        }
                    }
                });
            }, { rootMargin: '100px' });
            
            // Observe elements with data-prefetch attribute
            document.querySelectorAll('[data-prefetch]').forEach(el => {
                prefetchObserver.observe(el);
            });
            
            this.observers.set('prefetch', prefetchObserver);
        }
        
        // Process prefetch queue
        setInterval(() => this.processPrefetchQueue(), 1000);
    }

    async prefetchResource(url) {
        if (this.prefetchQueue.includes(url)) return;
        
        this.prefetchQueue.push(url);
    }

    async processPrefetchQueue() {
        if (this.prefetchQueue.length === 0) return;
        
        // Process one item at a time to avoid overwhelming the network
        const url = this.prefetchQueue.shift();
        
        try {
            const request = new Request(url);
            const resourceConfig = this.getResourceConfig(request);
            
            if (resourceConfig) {
                const cacheKey = this.generateCacheKey(request);
                const cached = this.get(cacheKey, 'prefetch');
                
                if (!cached || this.isExpired(cached)) {
                    const response = await fetch(request, { priority: 'low' });
                    if (response.ok) {
                        await this.set(cacheKey, response.clone(), 'prefetch');
                    }
                }
            }
        } catch (error) {
            console.warn('Prefetch failed for:', url, error);
        }
    }

    preloadCriticalResources() {
        const criticalResources = [
            '/css/critical.css',
            '/css/base.css',
            '/js/state-manager.js',
            '/js/security-manager.js',
            '/js/theme-manager.js'
        ];
        
        criticalResources.forEach(resource => {
            this.prefetchResource(resource);
        });
    }

    /**
     * Cache Management
     */
    shouldEvict(newDataSize) {
        const totalSize = this.getTotalCacheSize();
        return (totalSize + newDataSize) > this.config.maxCacheSize;
    }

    evictLRU(cacheType) {
        const cache = this.caches[cacheType];
        if (!cache || cache.size === 0) return;
        
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, entry] of cache.entries()) {
            if (entry.lastAccess < oldestTime) {
                oldestTime = entry.lastAccess;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            cache.delete(oldestKey);
            this.statistics.evictions++;
        }
    }

    setupCacheCleanup() {
        // Clean expired entries every 5 minutes
        setInterval(() => {
            this.cleanExpiredEntries();
        }, 5 * 60 * 1000);
        
        // Full cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.persistCache();
        });
    }

    cleanExpiredEntries() {
        let cleaned = 0;
        
        Object.entries(this.caches).forEach(([type, cache]) => {
            for (const [key, entry] of cache.entries()) {
                if (this.isExpired(entry)) {
                    cache.delete(key);
                    cleaned++;
                }
            }
        });
        
        if (cleaned > 0) {
            console.log(`🗑️ Cleaned ${cleaned} expired cache entries`);
            this.updateStatistics();
            this.persistCache();
        }
    }

    isExpired(entry) {
        const maxAge = this.config.maxCacheAge;
        return (Date.now() - entry.timestamp) > maxAge;
    }

    /**
     * Data Serialization & Compression
     */
    async serializeData(data) {
        if (data instanceof Response) {
            const responseData = {
                status: data.status,
                statusText: data.statusText,
                headers: Object.fromEntries(data.headers.entries()),
                body: await data.arrayBuffer()
            };
            return JSON.stringify(responseData);
        }
        
        if (typeof data === 'object') {
            return JSON.stringify(data);
        }
        
        return String(data);
    }

    deserializeResponse(serializedData) {
        try {
            let data = serializedData;
            
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            
            // If it looks like a Response object
            if (data.status && data.headers && data.body) {
                const body = new Uint8Array(data.body);
                return new Response(body, {
                    status: data.status,
                    statusText: data.statusText,
                    headers: new Headers(data.headers)
                });
            }
            
            return data;
        } catch (error) {
            console.error('Deserialization error:', error);
            return null;
        }
    }

    compress(data) {
        if (!this.config.compressionEnabled) return data;
        
        try {
            // Simple compression using built-in compression
            const compressed = pako.deflate(data, { to: 'string' });
            this.updateCompressionRatio(data.length, compressed.length);
            return compressed;
        } catch (error) {
            console.warn('Compression failed, storing uncompressed:', error);
            return data;
        }
    }

    decompress(compressedData) {
        if (!this.config.compressionEnabled) return compressedData;
        
        try {
            return pako.inflate(compressedData, { to: 'string' });
        } catch (error) {
            console.warn('Decompression failed:', error);
            return compressedData;
        }
    }

    /**
     * Persistence
     */
    persistCache() {
        try {
            const cacheData = {
                version: this.config.version,
                timestamp: Date.now(),
                caches: {}
            };
            
            // Only persist static and persistent caches
            ['static', 'persistent'].forEach(type => {
                const cache = this.caches[type];
                cacheData.caches[type] = Object.fromEntries(cache.entries());
            });
            
            localStorage.setItem('crackTotalCache', JSON.stringify(cacheData));
        } catch (error) {
            console.error('Cache persistence error:', error);
        }
    }

    loadStoredCache() {
        try {
            const stored = localStorage.getItem('crackTotalCache');
            if (!stored) return;
            
            const cacheData = JSON.parse(stored);
            
            // Version check
            if (cacheData.version !== this.config.version) {
                localStorage.removeItem('crackTotalCache');
                return;
            }
            
            // Load caches
            Object.entries(cacheData.caches || {}).forEach(([type, data]) => {
                if (this.caches[type]) {
                    this.caches[type] = new Map(Object.entries(data));
                }
            });
            
            console.log('📦 Cache loaded from storage');
        } catch (error) {
            console.error('Cache loading error:', error);
            localStorage.removeItem('crackTotalCache');
        }
    }

    /**
     * Utilities & Statistics
     */
    generateCacheKey(request) {
        const url = new URL(request.url);
        const method = request.method || 'GET';
        const headers = request.headers ? 
            Array.from(request.headers.entries()).sort().join('|') : '';
        
        return `${method}:${url.pathname}${url.search}:${headers}`;
    }

    getDataSize(data) {
        if (typeof data === 'string') {
            return new Blob([data]).size;
        }
        if (data instanceof ArrayBuffer) {
            return data.byteLength;
        }
        return JSON.stringify(data).length;
    }

    getTotalCacheSize() {
        let totalSize = 0;
        Object.values(this.caches).forEach(cache => {
            for (const entry of cache.values()) {
                totalSize += entry.size || 0;
            }
        });
        return totalSize;
    }

    updateStatistics() {
        this.statistics.cacheSize = this.getTotalCacheSize();
        
        // Update state manager if available
        if (window.CrackTotalState) {
            window.CrackTotalState.setState('performance.cache', this.statistics, { silent: true });
        }
    }

    updateCompressionRatio(originalSize, compressedSize) {
        const ratio = ((originalSize - compressedSize) / originalSize) * 100;
        this.statistics.compressionRatio = Math.round(ratio);
    }

    setupPerformanceMonitoring() {
        // Monitor cache performance
        setInterval(() => {
            const hitRate = this.statistics.totalRequests > 0 ? 
                (this.statistics.hits / this.statistics.totalRequests) * 100 : 0;
            
            if (window.CrackTotalAnalytics) {
                window.CrackTotalAnalytics.trackEvent('performance', 'cache_metrics', {
                    hit_rate: Math.round(hitRate),
                    total_requests: this.statistics.totalRequests,
                    cache_size_mb: Math.round(this.statistics.cacheSize / 1024 / 1024),
                    compression_ratio: this.statistics.compressionRatio
                });
            }
        }, 60000); // Every minute
    }

    /**
     * Public API
     */
    getCacheInfo() {
        const info = {
            statistics: { ...this.statistics },
            cacheTypes: {},
            totalSize: this.getTotalCacheSize(),
            hitRate: this.statistics.totalRequests > 0 ? 
                (this.statistics.hits / this.statistics.totalRequests) * 100 : 0
        };
        
        Object.entries(this.caches).forEach(([type, cache]) => {
            info.cacheTypes[type] = {
                entries: cache.size,
                size: 0
            };
            
            for (const entry of cache.values()) {
                info.cacheTypes[type].size += entry.size || 0;
            }
        });
        
        return info;
    }

    invalidateCache(pattern) {
        let invalidated = 0;
        
        Object.entries(this.caches).forEach(([type, cache]) => {
            for (const key of cache.keys()) {
                if (key.includes(pattern)) {
                    cache.delete(key);
                    invalidated++;
                }
            }
        });
        
        if (invalidated > 0) {
            this.updateStatistics();
            this.persistCache();
        }
        
        return invalidated;
    }

    warmUpCache(resources = []) {
        resources.forEach(resource => {
            this.prefetchResource(resource);
        });
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.CrackTotalCache = new CrackTotalCacheManager();
    
    // Debugging utilities
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.getCacheInfo = () => window.CrackTotalCache.getCacheInfo();
        window.clearCache = () => window.CrackTotalCache.clear();
        window.invalidateCache = (pattern) => window.CrackTotalCache.invalidateCache(pattern);
    }
}

export default CrackTotalCacheManager; 