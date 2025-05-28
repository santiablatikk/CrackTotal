/**
 * ========================================
 * CRACK TOTAL - ADVANCED THEME MANAGER
 * ========================================
 * Dynamic theme system with multiple themes and customization
 */

class CrackTotalThemeManager {
    constructor() {
        this.themes = {
            dark: {
                name: 'Modo Oscuro',
                icon: '🌙',
                colors: {
                    primary: '#007bff',
                    primaryLight: '#4da6ff',
                    primaryDark: '#0056b3',
                    secondary: '#6c757d',
                    success: '#28a745',
                    danger: '#dc3545',
                    warning: '#ffc107',
                    info: '#17a2b8',
                    background: '#0a0a0a',
                    backgroundAlt: '#161616',
                    backgroundHover: '#222222',
                    text: '#ffffff',
                    textLight: '#cccccc',
                    textMuted: '#999999',
                    border: 'rgba(255, 255, 255, 0.1)',
                    borderLight: 'rgba(255, 255, 255, 0.05)',
                    shadow: 'rgba(0, 0, 0, 0.3)',
                    overlay: 'rgba(0, 0, 0, 0.8)'
                }
            },
            light: {
                name: 'Modo Claro',
                icon: '☀️',
                colors: {
                    primary: '#007bff',
                    primaryLight: '#66b3ff',
                    primaryDark: '#0056b3',
                    secondary: '#6c757d',
                    success: '#28a745',
                    danger: '#dc3545',
                    warning: '#ffc107',
                    info: '#17a2b8',
                    background: '#ffffff',
                    backgroundAlt: '#f8f9fa',
                    backgroundHover: '#e9ecef',
                    text: '#212529',
                    textLight: '#495057',
                    textMuted: '#6c757d',
                    border: 'rgba(0, 0, 0, 0.1)',
                    borderLight: 'rgba(0, 0, 0, 0.05)',
                    shadow: 'rgba(0, 0, 0, 0.15)',
                    overlay: 'rgba(255, 255, 255, 0.9)'
                }
            },
            football: {
                name: 'Modo Fútbol',
                icon: '⚽',
                colors: {
                    primary: '#00a651', // Verde césped
                    primaryLight: '#4dd47c',
                    primaryDark: '#007a3d',
                    secondary: '#8b4513', // Marrón cuero
                    success: '#00a651',
                    danger: '#ff4444', // Rojo tarjeta
                    warning: '#ffcc00', // Amarillo tarjeta
                    info: '#0066cc',
                    background: '#1a4731', // Verde oscuro
                    backgroundAlt: '#2d5a3d',
                    backgroundHover: '#3a6b4a',
                    text: '#ffffff',
                    textLight: '#e0ffe6',
                    textMuted: '#b3d9c2',
                    border: 'rgba(0, 166, 81, 0.3)',
                    borderLight: 'rgba(0, 166, 81, 0.1)',
                    shadow: 'rgba(0, 0, 0, 0.4)',
                    overlay: 'rgba(26, 71, 49, 0.9)'
                }
            },
            neon: {
                name: 'Modo Neón',
                icon: '⚡',
                colors: {
                    primary: '#ff00ff', // Magenta neón
                    primaryLight: '#ff66ff',
                    primaryDark: '#cc00cc',
                    secondary: '#00ffff', // Cian neón
                    success: '#00ff00', // Verde neón
                    danger: '#ff0040',
                    warning: '#ffff00', // Amarillo neón
                    info: '#0080ff',
                    background: '#000000',
                    backgroundAlt: '#111111',
                    backgroundHover: '#222222',
                    text: '#ffffff',
                    textLight: '#ff00ff',
                    textMuted: '#888888',
                    border: 'rgba(255, 0, 255, 0.3)',
                    borderLight: 'rgba(255, 0, 255, 0.1)',
                    shadow: 'rgba(255, 0, 255, 0.5)',
                    overlay: 'rgba(0, 0, 0, 0.8)'
                }
            },
            retro: {
                name: 'Modo Retro',
                icon: '📺',
                colors: {
                    primary: '#ff6b35', // Naranja retro
                    primaryLight: '#ff8f65',
                    primaryDark: '#e5501f',
                    secondary: '#4ecdc4', // Turquesa retro
                    success: '#45b7d1',
                    danger: '#f96d6d',
                    warning: '#f9ca24',
                    info: '#6c5ce7',
                    background: '#2d3436', // Gris carbón
                    backgroundAlt: '#636e72',
                    backgroundHover: '#74b9ff',
                    text: '#ddd',
                    textLight: '#fab1a0',
                    textMuted: '#a29bfe',
                    border: 'rgba(255, 107, 53, 0.3)',
                    borderLight: 'rgba(255, 107, 53, 0.1)',
                    shadow: 'rgba(255, 107, 53, 0.3)',
                    overlay: 'rgba(45, 52, 54, 0.9)'
                }
            }
        };

        this.currentTheme = 'dark';
        this.customColors = {};
        this.animations = {
            enabled: true,
            duration: 300
        };

        this.init();
    }

    init() {
        // Load saved theme
        this.loadTheme();
        
        // Apply theme
        this.applyTheme(this.currentTheme);
        
        // Setup system theme detection
        this.setupSystemThemeDetection();
        
        // Setup theme persistence
        this.setupThemePersistence();
        
        console.log('🎨 CrackTotalThemeManager initialized');
    }

    /**
     * Apply a theme to the document
     */
    applyTheme(themeName, animate = true) {
        const theme = this.themes[themeName];
        if (!theme) {
            console.warn(`Theme '${themeName}' not found`);
            return;
        }

        const root = document.documentElement;
        const body = document.body;

        // Add transition class for smooth theme changes
        if (animate && this.animations.enabled) {
            body.classList.add('theme-transitioning');
        }

        // Apply CSS custom properties
        Object.entries(theme.colors).forEach(([property, value]) => {
            root.style.setProperty(`--${this.camelToKebab(property)}`, value);
        });

        // Apply any custom colors
        Object.entries(this.customColors).forEach(([property, value]) => {
            root.style.setProperty(`--${this.camelToKebab(property)}`, value);
        });

        // Update theme data attributes
        body.setAttribute('data-theme', themeName);
        body.setAttribute('data-theme-name', theme.name);

        // Update theme metadata
        this.updateThemeMetadata(theme);

        // Store current theme
        this.currentTheme = themeName;
        this.saveTheme();

        // Remove transition class after animation
        if (animate && this.animations.enabled) {
            setTimeout(() => {
                body.classList.remove('theme-transitioning');
            }, this.animations.duration);
        }

        // Dispatch theme change event
        this.dispatchThemeChangeEvent(themeName, theme);

        console.log(`🎨 Applied theme: ${theme.name}`);
    }

    /**
     * Get available themes
     */
    getAvailableThemes() {
        return Object.entries(this.themes).map(([key, theme]) => ({
            key,
            name: theme.name,
            icon: theme.icon
        }));
    }

    /**
     * Create theme selector UI
     */
    createThemeSelector(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) {
            console.warn('Theme selector container not found');
            return;
        }

        const selector = document.createElement('div');
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <div class="theme-selector-header">
                <h3>🎨 Seleccionar Tema</h3>
                <button class="theme-selector-close" aria-label="Cerrar selector de temas">×</button>
            </div>
            <div class="theme-options">
                ${this.getAvailableThemes().map(theme => `
                    <button class="theme-option ${theme.key === this.currentTheme ? 'active' : ''}" 
                            data-theme="${theme.key}"
                            aria-label="Aplicar tema ${theme.name}">
                        <span class="theme-icon">${theme.icon}</span>
                        <span class="theme-name">${theme.name}</span>
                        <div class="theme-preview" data-theme-preview="${theme.key}"></div>
                    </button>
                `).join('')}
            </div>
            <div class="theme-customization">
                <h4>Personalización</h4>
                <div class="color-customizers">
                    <div class="color-customizer">
                        <label for="primary-color">Color Principal:</label>
                        <input type="color" id="primary-color" value="${this.getCurrentColor('primary')}">
                    </div>
                    <div class="color-customizer">
                        <label for="background-color">Fondo:</label>
                        <input type="color" id="background-color" value="${this.getCurrentColor('background')}">
                    </div>
                </div>
                <div class="theme-settings">
                    <label class="theme-checkbox">
                        <input type="checkbox" id="animations-enabled" ${this.animations.enabled ? 'checked' : ''}>
                        <span>Animaciones habilitadas</span>
                    </label>
                </div>
                <div class="theme-actions">
                    <button id="reset-theme" class="theme-btn-secondary">Restablecer</button>
                    <button id="export-theme" class="theme-btn-primary">Exportar</button>
                </div>
            </div>
        `;

        // Add event listeners
        this.addThemeSelectorEvents(selector);

        // Apply theme selector styles
        this.addThemeSelectorStyles();

        container.appendChild(selector);
        return selector;
    }

    /**
     * Add event listeners to theme selector
     */
    addThemeSelectorEvents(selector) {
        // Theme option selection
        selector.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeName = option.dataset.theme;
                this.applyTheme(themeName);
                
                // Update active state
                selector.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });

        // Close selector
        selector.querySelector('.theme-selector-close').addEventListener('click', () => {
            selector.remove();
        });

        // Color customization
        selector.querySelector('#primary-color').addEventListener('input', (e) => {
            this.setCustomColor('primary', e.target.value);
        });

        selector.querySelector('#background-color').addEventListener('input', (e) => {
            this.setCustomColor('background', e.target.value);
        });

        // Animation toggle
        selector.querySelector('#animations-enabled').addEventListener('change', (e) => {
            this.animations.enabled = e.target.checked;
            this.saveTheme();
        });

        // Reset theme
        selector.querySelector('#reset-theme').addEventListener('click', () => {
            this.resetCustomizations();
        });

        // Export theme
        selector.querySelector('#export-theme').addEventListener('click', () => {
            this.exportTheme();
        });
    }

    /**
     * Set custom color
     */
    setCustomColor(property, color) {
        this.customColors[property] = color;
        document.documentElement.style.setProperty(`--${this.camelToKebab(property)}`, color);
        this.saveTheme();
    }

    /**
     * Get current color value
     */
    getCurrentColor(property) {
        const customColor = this.customColors[property];
        if (customColor) return customColor;
        
        const themeColor = this.themes[this.currentTheme]?.colors[property];
        return themeColor || '#000000';
    }

    /**
     * Reset all customizations
     */
    resetCustomizations() {
        this.customColors = {};
        this.applyTheme(this.currentTheme);
        
        if (window.NotificationSystem) {
            window.NotificationSystem.success('Tema Restablecido', 'Personalizaciones eliminadas correctamente');
        }
    }

    /**
     * Export current theme configuration
     */
    exportTheme() {
        const themeConfig = {
            baseTheme: this.currentTheme,
            customColors: this.customColors,
            animations: this.animations,
            timestamp: Date.now()
        };

        const dataStr = JSON.stringify(themeConfig, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `crack-total-theme-${this.currentTheme}-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        if (window.NotificationSystem) {
            window.NotificationSystem.success('Tema Exportado', 'Configuración descargada correctamente');
        }
    }

    /**
     * Import theme configuration
     */
    async importTheme(file) {
        try {
            const text = await file.text();
            const themeConfig = JSON.parse(text);
            
            if (themeConfig.baseTheme && this.themes[themeConfig.baseTheme]) {
                this.currentTheme = themeConfig.baseTheme;
                this.customColors = themeConfig.customColors || {};
                this.animations = { ...this.animations, ...themeConfig.animations };
                
                this.applyTheme(this.currentTheme);
                
                if (window.NotificationSystem) {
                    window.NotificationSystem.success('Tema Importado', 'Configuración aplicada correctamente');
                }
            } else {
                throw new Error('Archivo de tema inválido');
            }
        } catch (error) {
            console.error('Error importing theme:', error);
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Error de Importación', 'No se pudo cargar el archivo de tema');
            }
        }
    }

    /**
     * Setup system theme detection
     */
    setupSystemThemeDetection() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleChange = (e) => {
                const autoTheme = localStorage.getItem('crackTotalAutoTheme');
                if (autoTheme === 'true') {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            };

            mediaQuery.addEventListener('change', handleChange);
            
            // Initial check
            handleChange(mediaQuery);
        }
    }

    /**
     * Enable/disable automatic system theme
     */
    setAutoTheme(enabled) {
        localStorage.setItem('crackTotalAutoTheme', enabled.toString());
        
        if (enabled && window.matchMedia) {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(isDark ? 'dark' : 'light');
        }
    }

    /**
     * Setup theme persistence
     */
    setupThemePersistence() {
        // Save theme when page unloads
        window.addEventListener('beforeunload', () => {
            this.saveTheme();
        });

        // Listen for state manager changes
        if (window.CrackTotalState) {
            window.CrackTotalState.subscribe('ui.theme', (theme) => {
                if (theme !== this.currentTheme) {
                    this.applyTheme(theme, false);
                }
            });
        }
    }

    /**
     * Save theme to storage
     */
    saveTheme() {
        try {
            const themeData = {
                currentTheme: this.currentTheme,
                customColors: this.customColors,
                animations: this.animations
            };
            
            localStorage.setItem('crackTotalTheme', JSON.stringify(themeData));
            
            // Update state manager if available
            if (window.CrackTotalState) {
                window.CrackTotalState.setState('ui.theme', this.currentTheme, { silent: true });
            }
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }

    /**
     * Load theme from storage
     */
    loadTheme() {
        try {
            const saved = localStorage.getItem('crackTotalTheme');
            if (saved) {
                const themeData = JSON.parse(saved);
                this.currentTheme = themeData.currentTheme || 'dark';
                this.customColors = themeData.customColors || {};
                this.animations = { ...this.animations, ...themeData.animations };
            }
        } catch (error) {
            console.error('Error loading theme:', error);
            this.currentTheme = 'dark';
        }
    }

    /**
     * Update theme metadata
     */
    updateThemeMetadata(theme) {
        // Update meta theme-color
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (!metaTheme) {
            metaTheme = document.createElement('meta');
            metaTheme.name = 'theme-color';
            document.head.appendChild(metaTheme);
        }
        metaTheme.content = theme.colors.primary;

        // Update manifest theme color
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            // We'd need to dynamically generate manifest, but for now just update the meta
        }
    }

    /**
     * Dispatch theme change event
     */
    dispatchThemeChangeEvent(themeName, theme) {
        const event = new CustomEvent('themeChanged', {
            detail: {
                themeName,
                theme,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Add theme selector styles
     */
    addThemeSelectorStyles() {
        if (document.getElementById('theme-selector-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'theme-selector-styles';
        styles.textContent = `
            .theme-selector {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--background-alt);
                border: 1px solid var(--border);
                border-radius: 12px;
                padding: 20px;
                min-width: 400px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                z-index: 10000;
                box-shadow: 0 10px 30px var(--shadow);
            }

            .theme-selector-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--border);
            }

            .theme-selector-close {
                background: none;
                border: none;
                color: var(--text);
                font-size: 24px;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }

            .theme-selector-close:hover {
                background: var(--background-hover);
            }

            .theme-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }

            .theme-option {
                background: var(--background);
                border: 2px solid var(--border);
                border-radius: 8px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            }

            .theme-option:hover {
                border-color: var(--primary);
                transform: translateY(-2px);
            }

            .theme-option.active {
                border-color: var(--primary);
                background: var(--primary-transparent, rgba(0, 123, 255, 0.1));
            }

            .theme-icon {
                font-size: 24px;
                display: block;
                margin-bottom: 5px;
            }

            .theme-name {
                font-size: 14px;
                color: var(--text);
            }

            .theme-customization h4 {
                margin: 15px 0 10px 0;
                color: var(--text);
            }

            .color-customizers {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 15px;
            }

            .color-customizer {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .color-customizer label {
                color: var(--text);
                font-size: 14px;
            }

            .color-customizer input[type="color"] {
                width: 40px;
                height: 30px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }

            .theme-settings {
                margin: 15px 0;
            }

            .theme-checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text);
                cursor: pointer;
            }

            .theme-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }

            .theme-btn-primary,
            .theme-btn-secondary {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }

            .theme-btn-primary {
                background: var(--primary);
                color: white;
            }

            .theme-btn-secondary {
                background: var(--background);
                color: var(--text);
                border: 1px solid var(--border);
            }

            .theme-btn-primary:hover,
            .theme-btn-secondary:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px var(--shadow);
            }

            /* Theme transition */
            .theme-transitioning,
            .theme-transitioning * {
                transition: background-color 0.3s ease,
                           color 0.3s ease,
                           border-color 0.3s ease,
                           box-shadow 0.3s ease !important;
            }

            @media (max-width: 768px) {
                .theme-selector {
                    min-width: 90vw;
                    padding: 15px;
                }
                
                .theme-options {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .color-customizers {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Utility method to convert camelCase to kebab-case
     */
    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * Public API
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    getTheme(themeName) {
        return this.themes[themeName];
    }

    addCustomTheme(name, themeData) {
        this.themes[name] = themeData;
    }

    removeCustomTheme(name) {
        if (this.themes[name] && name !== 'dark' && name !== 'light') {
            delete this.themes[name];
            if (this.currentTheme === name) {
                this.applyTheme('dark');
            }
        }
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.CrackTotalTheme = new CrackTotalThemeManager();
    
    // Add global theme toggle function
    window.toggleTheme = () => {
        const current = window.CrackTotalTheme.getCurrentTheme();
        const themes = Object.keys(window.CrackTotalTheme.themes);
        const currentIndex = themes.indexOf(current);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        window.CrackTotalTheme.applyTheme(nextTheme);
    };
}

export default CrackTotalThemeManager; 