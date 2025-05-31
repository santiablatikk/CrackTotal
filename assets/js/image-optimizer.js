/**
 * ========================================
 * CRACK TOTAL - IMAGE OPTIMIZATION MANAGER
 * ========================================
 * Advanced image optimization and lazy loading system
 */

class CrackTotalImageOptimizer {
    constructor() {
        this.config = {
            lazyLoadEnabled: true,
            compressionEnabled: true,
            webpSupported: false,
            avifSupported: false,
            retinaSuffix: '@2x',
            rootMargin: '50px',
            threshold: 0.1,
            maxCacheSize: 20 * 1024 * 1024, // 20MB
            compressionQuality: 0.85,
            placeholderEnabled: true,
            fadeInDuration: 300
        };

        this.imageCache = new Map();
        this.loadingImages = new Set();
        this.observers = new Map();
        this.processedImages = new WeakSet();
        
        this.statistics = {
            totalImages: 0,
            optimizedImages: 0,
            bytesOriginal: 0,
            bytesOptimized: 0,
            averageLoadTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        this.supportedFormats = {
            webp: false,
            avif: false,
            jpeg: true,
            png: true,
            gif: true,
            svg: true
        };

        this.responsiveBreakpoints = {
            small: 480,
            medium: 768,
            large: 1024,
            xlarge: 1440
        };

        this.init();
    }

    async init() {
        await this.detectFormatSupport();
        this.setupLazyLoading();
        this.setupImageObserver();
        this.optimizeExistingImages();
        this.setupCacheCleanup();
        this.setupPerformanceMonitoring();
        
        console.log('🖼️ CrackTotalImageOptimizer initialized');
    }

    /**
     * Format Detection
     */
    async detectFormatSupport() {
        // Test WebP support
        this.supportedFormats.webp = await this.testImageSupport(
            'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
        );

        // Test AVIF support
        this.supportedFormats.avif = await this.testImageSupport(
            'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
        );

        this.config.webpSupported = this.supportedFormats.webp;
        this.config.avifSupported = this.supportedFormats.avif;

        console.log('📷 Format support:', this.supportedFormats);
    }

    async testImageSupport(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img.width === 2 && img.height === 2);
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }

    /**
     * Lazy Loading Setup
     */
    setupLazyLoading() {
        if (!this.config.lazyLoadEnabled || !('IntersectionObserver' in window)) {
            // Fallback for browsers without IntersectionObserver
            this.loadAllImages();
            return;
        }

        const lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    lazyImageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        });

        this.observers.set('lazy', lazyImageObserver);
        this.observeImages();
    }

    setupImageObserver() {
        // Observer for dynamically added images
        if ('MutationObserver' in window) {
            const imageObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const images = node.tagName === 'IMG' ? [node] : 
                                          node.querySelectorAll('img');
                            images.forEach(img => this.processNewImage(img));
                        }
                    });
                });
            });

            imageObserver.observe(document.body, {
                childList: true,
                subtree: true
            });

            this.observers.set('mutation', imageObserver);
        }
    }

    observeImages() {
        const images = document.querySelectorAll('img[data-src], img[data-lazy]');
        const lazyObserver = this.observers.get('lazy');
        
        images.forEach(img => {
            if (!this.processedImages.has(img)) {
                this.prepareImageForLazyLoad(img);
                if (lazyObserver) {
                    lazyObserver.observe(img);
                }
            }
        });
    }

    prepareImageForLazyLoad(img) {
        this.processedImages.add(img);
        this.statistics.totalImages++;

        // Store original src
        if (img.src && !img.dataset.src) {
            img.dataset.src = img.src;
            img.removeAttribute('src');
        }

        // Add loading class
        img.classList.add('lazy-loading');

        // Create placeholder if enabled
        if (this.config.placeholderEnabled) {
            this.createPlaceholder(img);
        }

        // Setup responsive sources if data-srcset exists
        if (img.dataset.srcset) {
            this.setupResponsiveImage(img);
        }
    }

    createPlaceholder(img) {
        if (img.dataset.placeholder) return;

        const width = img.dataset.width || img.getAttribute('width') || 300;
        const height = img.dataset.height || img.getAttribute('height') || 200;
        
        // Create a simple colored placeholder or blurred version
        const placeholder = this.generatePlaceholder(width, height, img.alt);
        img.src = placeholder;
        img.dataset.placeholder = 'true';
    }

    generatePlaceholder(width, height, alt = '') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#e0e0e0');
        gradient.addColorStop(1, '#f0f0f0');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add loading text
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(alt || 'Loading...', width / 2, height / 2);
        
        return canvas.toDataURL('image/png');
    }

    /**
     * Image Loading and Optimization
     */
    async loadImage(img) {
        if (this.loadingImages.has(img) || img.dataset.loaded === 'true') {
            return;
        }

        this.loadingImages.add(img);
        const startTime = Date.now();

        try {
            const optimizedSrc = await this.getOptimizedImageSrc(img);
            await this.loadImageSrc(img, optimizedSrc);
            
            this.onImageLoaded(img, Date.now() - startTime);
        } catch (error) {
            this.onImageError(img, error);
        } finally {
            this.loadingImages.delete(img);
        }
    }

    async getOptimizedImageSrc(img) {
        const originalSrc = img.dataset.src || img.src;
        if (!originalSrc) return null;

        // Check cache first
        const cacheKey = this.generateCacheKey(originalSrc);
        if (this.imageCache.has(cacheKey)) {
            this.statistics.cacheHits++;
            return this.imageCache.get(cacheKey);
        }

        // Generate optimized version
        let optimizedSrc = originalSrc;
        
        // Apply format optimization
        optimizedSrc = this.applyFormatOptimization(optimizedSrc);
        
        // Apply size optimization
        optimizedSrc = this.applySizeOptimization(optimizedSrc, img);
        
        // Apply compression if enabled
        if (this.config.compressionEnabled) {
            optimizedSrc = await this.applyCompression(optimizedSrc);
        }

        // Cache the result
        this.imageCache.set(cacheKey, optimizedSrc);
        this.statistics.cacheMisses++;

        return optimizedSrc;
    }

    applyFormatOptimization(src) {
        if (src.includes('data:') || src.includes('.svg')) {
            return src; // Skip data URLs and SVGs
        }

        const url = new URL(src, window.location.origin);
        
        // Use AVIF if supported and available
        if (this.supportedFormats.avif && this.isAvifAvailable(src)) {
            return this.convertToFormat(src, 'avif');
        }
        
        // Use WebP if supported and available
        if (this.supportedFormats.webp && this.isWebpAvailable(src)) {
            return this.convertToFormat(src, 'webp');
        }

        return src;
    }

    applySizeOptimization(src, img) {
        if (src.includes('data:') || src.includes('.svg')) {
            return src; // Skip data URLs and SVGs
        }

        const devicePixelRatio = window.devicePixelRatio || 1;
        const containerWidth = img.parentElement?.offsetWidth || window.innerWidth;
        const targetWidth = Math.round(containerWidth * devicePixelRatio);

        // Apply responsive sizing
        return this.getResponsiveImageSrc(src, targetWidth);
    }

    async applyCompression(src) {
        if (src.includes('data:') || this.isAlreadyOptimized(src)) {
            return src;
        }

        try {
            const response = await fetch(src);
            const blob = await response.blob();
            
            if (blob.type.startsWith('image/') && !blob.type.includes('svg')) {
                const compressedBlob = await this.compressImage(blob);
                return URL.createObjectURL(compressedBlob);
            }
        } catch (error) {
            console.warn('Image compression failed:', error);
        }

        return src;
    }

    async compressImage(blob) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(
                    (compressedBlob) => {
                        resolve(compressedBlob || blob);
                    },
                    blob.type,
                    this.config.compressionQuality
                );
            };

            img.onerror = () => resolve(blob);
            img.src = URL.createObjectURL(blob);
        });
    }

    async loadImageSrc(img, src) {
        return new Promise((resolve, reject) => {
            const newImg = new Image();
            
            newImg.onload = () => {
                img.src = src;
                
                // Handle srcset if available
                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                    img.removeAttribute('data-srcset');
                }
                
                resolve(newImg);
            };
            
            newImg.onerror = reject;
            newImg.src = src;
        });
    }

    onImageLoaded(img, loadTime) {
        img.dataset.loaded = 'true';
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');

        // Fade in effect
        if (this.config.fadeInDuration > 0) {
            img.style.opacity = '0';
            img.style.transition = `opacity ${this.config.fadeInDuration}ms ease-in-out`;
            
            requestAnimationFrame(() => {
                img.style.opacity = '1';
            });
        }

        // Update statistics
        this.statistics.optimizedImages++;
        this.updateAverageLoadTime(loadTime);

        // Trigger custom event
        img.dispatchEvent(new CustomEvent('imageOptimized', {
            detail: { loadTime, src: img.src }
        }));

        // Track with analytics if available
        if (window.CrackTotalAnalytics) {
            window.CrackTotalAnalytics.trackEvent('performance', 'image_loaded', {
                load_time: loadTime,
                image_size: this.getImageSize(img),
                format: this.getImageFormat(img.src)
            });
        }
    }

    onImageError(img, error) {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');

        console.warn('Image loading failed:', img.dataset.src || img.src, error);

        // Try fallback image if available
        if (img.dataset.fallback) {
            img.src = img.dataset.fallback;
        }
    }

    /**
     * Responsive Images
     */
    setupResponsiveImage(img) {
        const baseSrc = img.dataset.src || img.src;
        const srcset = this.generateResponsiveSrcset(baseSrc);
        
        if (srcset) {
            img.dataset.srcset = srcset;
        }
    }

    generateResponsiveSrcset(baseSrc) {
        if (!baseSrc || baseSrc.includes('data:')) return null;

        const srcset = [];
        
        Object.entries(this.responsiveBreakpoints).forEach(([size, width]) => {
            const responsiveSrc = this.getResponsiveImageSrc(baseSrc, width);
            srcset.push(`${responsiveSrc} ${width}w`);
        });

        return srcset.join(', ');
    }

    getResponsiveImageSrc(src, targetWidth) {
        // This would typically integrate with your image CDN or processing service
        // For now, we'll append size parameters
        const url = new URL(src, window.location.origin);
        
        if (this.isExternalImage(src)) {
            // For external images, try common CDN patterns
            if (src.includes('cloudinary.com')) {
                return src.replace('/upload/', `/upload/w_${targetWidth},f_auto,q_auto/`);
            }
            
            if (src.includes('images.unsplash.com')) {
                url.searchParams.set('w', targetWidth);
                url.searchParams.set('q', '80');
                return url.toString();
            }
        }

        // For local images, append size parameter
        url.searchParams.set('w', targetWidth);
        return url.toString();
    }

    /**
     * Format Conversion Helpers
     */
    convertToFormat(src, format) {
        const url = new URL(src, window.location.origin);
        const pathname = url.pathname;
        const extension = pathname.split('.').pop();
        
        // Replace extension
        const newPathname = pathname.replace(new RegExp(`\\.${extension}$`), `.${format}`);
        url.pathname = newPathname;
        
        return url.toString();
    }

    isWebpAvailable(src) {
        // Check if WebP version exists (you'd implement actual checking logic)
        return this.supportedFormats.webp && !src.includes('.gif');
    }

    isAvifAvailable(src) {
        // Check if AVIF version exists (you'd implement actual checking logic)
        return this.supportedFormats.avif && !src.includes('.gif');
    }

    isAlreadyOptimized(src) {
        return src.includes('optimized=true') || 
               src.includes('f_auto') || 
               src.includes('q_auto');
    }

    isExternalImage(src) {
        try {
            const url = new URL(src, window.location.origin);
            return url.origin !== window.location.origin;
        } catch {
            return false;
        }
    }

    /**
     * Utility Methods
     */
    generateCacheKey(src) {
        const url = new URL(src, window.location.origin);
        return `${url.pathname}${url.search}`;
    }

    getImageSize(img) {
        return {
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            displayWidth: img.offsetWidth,
            displayHeight: img.offsetHeight
        };
    }

    getImageFormat(src) {
        if (src.includes('data:image/')) {
            return src.split('data:image/')[1].split(';')[0];
        }
        
        const extension = src.split('.').pop().toLowerCase();
        return extension.split('?')[0]; // Remove query parameters
    }

    updateAverageLoadTime(loadTime) {
        const total = this.statistics.averageLoadTime * (this.statistics.optimizedImages - 1);
        this.statistics.averageLoadTime = (total + loadTime) / this.statistics.optimizedImages;
    }

    /**
     * Cache Management
     */
    setupCacheCleanup() {
        // Clean cache periodically
        setInterval(() => {
            this.cleanImageCache();
        }, 10 * 60 * 1000); // Every 10 minutes

        // Clean on memory pressure
        if ('memory' in performance) {
            setInterval(() => {
                if (performance.memory.usedJSHeapSize > 100 * 1024 * 1024) { // > 100MB
                    this.cleanImageCache(true);
                }
            }, 30 * 1000); // Every 30 seconds
        }
    }

    cleanImageCache(aggressive = false) {
        const maxSize = aggressive ? this.config.maxCacheSize / 2 : this.config.maxCacheSize;
        let currentSize = 0;
        
        // Calculate current cache size (approximate)
        for (const [key, value] of this.imageCache.entries()) {
            if (value.startsWith('blob:')) {
                currentSize += 1024 * 1024; // Estimate 1MB per blob
            } else {
                currentSize += value.length;
            }
        }

        if (currentSize > maxSize) {
            const entriesToRemove = Math.ceil(this.imageCache.size / 4);
            let removed = 0;
            
            for (const [key, value] of this.imageCache.entries()) {
                if (removed >= entriesToRemove) break;
                
                if (value.startsWith('blob:')) {
                    URL.revokeObjectURL(value);
                }
                
                this.imageCache.delete(key);
                removed++;
            }
            
            console.log(`🗑️ Cleaned ${removed} images from cache`);
        }
    }

    /**
     * Performance Monitoring
     */
    setupPerformanceMonitoring() {
        // Report statistics periodically
        setInterval(() => {
            this.reportStatistics();
        }, 60 * 1000); // Every minute

        // Report on page unload
        window.addEventListener('beforeunload', () => {
            this.reportStatistics();
        });
    }

    reportStatistics() {
        if (window.CrackTotalAnalytics) {
            window.CrackTotalAnalytics.trackEvent('performance', 'image_optimization_stats', {
                total_images: this.statistics.totalImages,
                optimized_images: this.statistics.optimizedImages,
                average_load_time: Math.round(this.statistics.averageLoadTime),
                cache_hit_rate: this.statistics.cacheHits > 0 ? 
                    Math.round((this.statistics.cacheHits / (this.statistics.cacheHits + this.statistics.cacheMisses)) * 100) : 0,
                webp_supported: this.supportedFormats.webp,
                avif_supported: this.supportedFormats.avif
            });
        }
    }

    /**
     * Public API
     */
    processNewImage(img) {
        if (!this.processedImages.has(img)) {
            this.prepareImageForLazyLoad(img);
            
            const lazyObserver = this.observers.get('lazy');
            if (lazyObserver) {
                lazyObserver.observe(img);
            } else {
                this.loadImage(img);
            }
        }
    }

    loadAllImages() {
        const images = document.querySelectorAll('img[data-src], img[data-lazy]');
        images.forEach(img => this.loadImage(img));
    }

    getStatistics() {
        return { ...this.statistics };
    }

    optimizeExistingImages() {
        // Process images already in the DOM
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.dataset.src && !img.dataset.lazy) {
                // Convert existing images to lazy loading
                if (img.src && !img.complete) {
                    img.dataset.src = img.src;
                    img.dataset.lazy = 'true';
                    this.processNewImage(img);
                }
            }
        });
    }

    clearCache() {
        // Revoke blob URLs to free memory
        for (const [key, value] of this.imageCache.entries()) {
            if (value.startsWith('blob:')) {
                URL.revokeObjectURL(value);
            }
        }
        
        this.imageCache.clear();
        this.statistics.cacheHits = 0;
        this.statistics.cacheMisses = 0;
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.CrackTotalImageOptimizer = new CrackTotalImageOptimizer();
    
    // Debugging utilities
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.getImageStats = () => window.CrackTotalImageOptimizer.getStatistics();
        window.loadAllImages = () => window.CrackTotalImageOptimizer.loadAllImages();
        window.clearImageCache = () => window.CrackTotalImageOptimizer.clearCache();
    }
}

export default CrackTotalImageOptimizer;