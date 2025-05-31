/**
 * ========================================
 * CRACK TOTAL - ESSENTIAL FUNCTIONS
 * ========================================
 * Minimal functionality for basic operation
 */

// Essential error handler
window.addEventListener('error', function(e) {
    console.warn('Error capturado:', e.error?.message || e.message);
});

window.addEventListener('unhandledrejection', function(e) {
    console.warn('Promise rechazada:', e.reason);
    e.preventDefault(); // Prevent unhandled rejection
});

// Basic notification system
window.notifications = {
    info: function(title, message, options = {}) {
        console.log(`ℹ️ ${title}: ${message}`);
        
        // Simple fallback notification
        if (!options.silent) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #17a2b8;
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 300px;
                font-size: 14px;
            `;
            notification.innerHTML = `<strong>${title}</strong><br>${message}`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, options.duration || 5000);
        }
    },
    
    warning: function(title, message, options = {}) {
        console.warn(`⚠️ ${title}: ${message}`);
        
        if (!options.silent) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ffc107;
                color: #212529;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 300px;
                font-size: 14px;
            `;
            notification.innerHTML = `<strong>${title}</strong><br>${message}`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, options.duration || 6000);
        }
    },
    
    error: function(title, message, options = {}) {
        console.error(`❌ ${title}: ${message}`);
        
        if (!options.silent) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #dc3545;
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 300px;
                font-size: 14px;
            `;
            notification.innerHTML = `<strong>${title}</strong><br>${message}`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, options.duration || 8000);
        }
    }
};

// Basic logger for compatibility
window.logger = {
    info: function(message, ...args) {
        console.log(`[INFO] ${message}`, ...args);
    },
    warn: function(message, ...args) {
        console.warn(`[WARN] ${message}`, ...args);
    },
    error: function(message, ...args) {
        console.error(`[ERROR] ${message}`, ...args);
    }
};

// Disable problematic fetch overrides
if (window.fetch && window.fetch.toString().includes('CrackTotal')) {
    console.log('Restoring original fetch function');
    // Try to restore original fetch if it was overridden
    if (window.originalFetch) {
        window.fetch = window.originalFetch;
    }
}

console.log('✅ Essential functions loaded successfully'); 