/**
 * Sistema de gestión de consentimiento de cookies para cumplir con RGPD
 * Compatible con Google Consent Mode V2
 * @version 1.0
 */

class CookieConsent {
  constructor() {
    this.cookieName = 'cracktotal_consent';
    this.cookieExpDays = 180; // 6 meses
    this.consentBanner = null;
    this.settingsModal = null;
    this.consentGiven = false;
    this.consentRejected = false;
    
    // Configuración predeterminada
    this.consentSettings = {
      necessary: true, // Siempre necesario, no se puede desactivar
      analytics: false,
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false,
      lastUpdated: new Date().toISOString()
    };
    
    this.init();
  }
  
  init() {
    // Verificar si ya existe consentimiento guardado
    const savedConsent = this.getCookie(this.cookieName);
    
    if (savedConsent) {
      try {
        this.consentSettings = JSON.parse(savedConsent);
        this.consentGiven = true;
        this.updateGoogleConsent();
      } catch (e) {
        console.error('Error al procesar el consentimiento guardado:', e);
        this.resetConsent();
      }
    } else {
      // Si no hay consentimiento guardado, mostrar el banner
      this.createBanner();
    }
    
    // Enlazar evento para botón de Política de Cookies en footer
    this.bindCookiesPolicyLink();
  }
  
  createBanner() {
    // Crear el banner solo si no existe
    if (document.getElementById('cookie-consent-banner')) return;
    
    // Crear el banner
    this.consentBanner = document.createElement('div');
    this.consentBanner.id = 'cookie-consent-banner';
    this.consentBanner.className = 'cookie-consent-banner';
    
    this.consentBanner.innerHTML = `
      <div class="cookie-consent-container">
        <div class="cookie-consent-content">
          <h3>Respetamos tu privacidad</h3>
          <p>Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y mostrar anuncios personalizados. 
          Al hacer clic en "Aceptar todo", consientes al uso de todas las cookies. También puedes personalizar tus preferencias o rechazar todas las cookies opcionales.</p>
          <div class="cookie-consent-buttons">
            <button id="cookie-reject" class="cookie-btn cookie-reject">Rechazar todo</button>
            <button id="cookie-settings" class="cookie-btn cookie-settings">Personalizar</button>
            <button id="cookie-accept" class="cookie-btn cookie-accept">Aceptar todo</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.consentBanner);
    
    // Agregar estilos CSS inline para mayor compatibilidad
    this.addStyles();
    
    // Agregar eventos a los botones
    document.getElementById('cookie-accept').addEventListener('click', () => this.acceptAll());
    document.getElementById('cookie-reject').addEventListener('click', () => this.rejectAll());
    document.getElementById('cookie-settings').addEventListener('click', () => this.showSettings());
  }
  
  createSettingsModal() {
    // Crear el modal de configuración
    this.settingsModal = document.createElement('div');
    this.settingsModal.id = 'cookie-settings-modal';
    this.settingsModal.className = 'cookie-settings-modal';
    
    this.settingsModal.innerHTML = `
      <div class="cookie-settings-container">
        <div class="cookie-settings-header">
          <h3>Configuración de cookies</h3>
          <button id="cookie-settings-close" class="cookie-settings-close">&times;</button>
        </div>
        <div class="cookie-settings-content">
          <div class="cookie-settings-group">
            <div class="cookie-settings-item">
              <label class="cookie-toggle">
                <input type="checkbox" id="cookie-necessary" checked disabled>
                <span class="cookie-toggle-slider"></span>
              </label>
              <div class="cookie-settings-info">
                <h4>Cookies necesarias</h4>
                <p>Esenciales para el funcionamiento básico del sitio. No pueden ser desactivadas.</p>
              </div>
            </div>
            
            <div class="cookie-settings-item">
              <label class="cookie-toggle">
                <input type="checkbox" id="cookie-analytics" ${this.consentSettings.analytics ? 'checked' : ''}>
                <span class="cookie-toggle-slider"></span>
              </label>
              <div class="cookie-settings-info">
                <h4>Cookies analíticas</h4>
                <p>Nos ayudan a entender cómo interactúas con el sitio y mejorar tu experiencia.</p>
              </div>
            </div>
            
            <div class="cookie-settings-item">
              <label class="cookie-toggle">
                <input type="checkbox" id="cookie-ads" ${this.consentSettings.ad_storage ? 'checked' : ''}>
                <span class="cookie-toggle-slider"></span>
              </label>
              <div class="cookie-settings-info">
                <h4>Cookies publicitarias</h4>
                <p>Permiten mostrar anuncios personalizados basados en tus intereses.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="cookie-settings-footer">
          <button id="cookie-settings-save" class="cookie-btn cookie-accept">Guardar preferencias</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.settingsModal);
    
    // Agregar eventos
    document.getElementById('cookie-settings-close').addEventListener('click', () => this.hideSettings());
    document.getElementById('cookie-settings-save').addEventListener('click', () => this.saveSettings());
    
    // Si se hace clic fuera del modal, cerrarlo
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.hideSettings();
      }
    });
  }
  
  showSettings() {
    if (!this.settingsModal) {
      this.createSettingsModal();
    }
    this.settingsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Evitar scroll
  }
  
  hideSettings() {
    if (this.settingsModal) {
      this.settingsModal.style.display = 'none';
      document.body.style.overflow = ''; // Restaurar scroll
    }
  }
  
  saveSettings() {
    // Actualizar configuración basada en las selecciones del usuario
    const analyticsConsent = document.getElementById('cookie-analytics').checked;
    const adsConsent = document.getElementById('cookie-ads').checked;
    
    this.consentSettings.analytics = analyticsConsent;
    this.consentSettings.ad_storage = adsConsent;
    this.consentSettings.ad_user_data = adsConsent;
    this.consentSettings.ad_personalization = adsConsent;
    this.consentSettings.lastUpdated = new Date().toISOString();
    
    this.consentGiven = true;
    this.updateGoogleConsent();
    this.setCookie(this.cookieName, JSON.stringify(this.consentSettings), this.cookieExpDays);
    
    this.hideSettings();
    this.hideBanner();
  }
  
  acceptAll() {
    // El usuario acepta todas las cookies
    Object.keys(this.consentSettings).forEach(key => {
      if (key !== 'lastUpdated') {
        this.consentSettings[key] = true;
      }
    });
    
    this.consentSettings.lastUpdated = new Date().toISOString();
    this.consentGiven = true;
    
    this.updateGoogleConsent();
    this.setCookie(this.cookieName, JSON.stringify(this.consentSettings), this.cookieExpDays);
    this.hideBanner();
  }
  
  rejectAll() {
    // El usuario rechaza todas las cookies excepto las necesarias
    Object.keys(this.consentSettings).forEach(key => {
      if (key !== 'necessary' && key !== 'lastUpdated') {
        this.consentSettings[key] = false;
      }
    });
    
    this.consentSettings.lastUpdated = new Date().toISOString();
    this.consentGiven = true;
    this.consentRejected = true;
    
    this.updateGoogleConsent();
    this.setCookie(this.cookieName, JSON.stringify(this.consentSettings), this.cookieExpDays);
    this.hideBanner();
  }
  
  updateGoogleConsent() {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': this.consentSettings.analytics ? 'granted' : 'denied',
        'ad_storage': this.consentSettings.ad_storage ? 'granted' : 'denied',
        'ad_user_data': this.consentSettings.ad_user_data ? 'granted' : 'denied',
        'ad_personalization': this.consentSettings.ad_personalization ? 'granted' : 'denied'
      });
      
      // Actualizar estado de los anuncios
      if (this.consentSettings.ad_storage) {
        localStorage.setItem("adConsent", "true");
        this.refreshAdsIfNeeded();
      } else {
        localStorage.setItem("adConsent", "false");
        this.hideAds();
      }
    }
  }
  
  refreshAdsIfNeeded() {
    // Intentar cargar los anuncios si están disponibles
    if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
      document.querySelectorAll('.adsbygoogle').forEach(ad => {
        try {
          (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.log('Error al cargar anuncio:', e);
        }
      });
    }
  }
  
  hideAds() {
    // Ocultar anuncios si no hay consentimiento
    document.querySelectorAll('.adsbygoogle, .adsense-container').forEach(ad => {
      ad.style.display = 'none';
    });
  }
  
  hideBanner() {
    if (this.consentBanner) {
      this.consentBanner.classList.add('cookie-consent-hidden');
      setTimeout(() => {
        this.consentBanner.remove();
        this.consentBanner = null;
      }, 300);
    }
  }
  
  resetConsent() {
    // Resetear todo el consentimiento
    this.deleteCookie(this.cookieName);
    this.consentSettings = {
      necessary: true,
      analytics: false,
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false,
      lastUpdated: new Date().toISOString()
    };
    
    this.consentGiven = false;
    this.consentRejected = false;
    this.updateGoogleConsent();
    this.createBanner();
  }
  
  setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
  }
  
  getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }
  
  deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
  
  bindCookiesPolicyLink() {
    // Permitir que cualquier enlace con la clase 'open-cookie-settings' abra la configuración
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('open-cookie-settings') || 
          e.target.closest('.open-cookie-settings')) {
        e.preventDefault();
        this.showSettings();
      }
    });
  }
  
  addStyles() {
    // Añadir estilos CSS para el banner y modal
    if (!document.getElementById('cookie-consent-styles')) {
      const style = document.createElement('style');
      style.id = 'cookie-consent-styles';
      style.textContent = `
        .cookie-consent-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: rgba(15, 23, 42, 0.95);
          color: #fff;
          z-index: 999999;
          box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
          font-family: 'Montserrat', sans-serif;
        }
        
        .cookie-consent-hidden {
          transform: translateY(100%);
          opacity: 0;
        }
        
        .cookie-consent-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .cookie-consent-content h3 {
          font-size: 18px;
          margin: 0 0 10px;
          font-weight: 700;
          color: #f8fafc;
        }
        
        .cookie-consent-content p {
          font-size: 14px;
          margin: 0 0 15px;
          line-height: 1.5;
          color: #e2e8f0;
        }
        
        .cookie-consent-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .cookie-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Montserrat', sans-serif;
        }
        
        .cookie-accept {
          background-color: #c71a3f;
          color: white;
        }
        
        .cookie-accept:hover {
          background-color: #a61232;
        }
        
        .cookie-settings {
          background-color: transparent;
          border: 1px solid #64748b;
          color: #f8fafc;
        }
        
        .cookie-settings:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .cookie-reject {
          background-color: transparent;
          color: #94a3b8;
        }
        
        .cookie-reject:hover {
          color: #f8fafc;
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        /* Modal de configuración */
        .cookie-settings-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 1000000;
          display: none;
          justify-content: center;
          align-items: center;
          font-family: 'Montserrat', sans-serif;
        }
        
        .cookie-settings-container {
          background-color: #1e293b;
          border-radius: 10px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }
        
        .cookie-settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .cookie-settings-header h3 {
          font-size: 18px;
          margin: 0;
          color: #f8fafc;
          font-weight: 700;
        }
        
        .cookie-settings-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #94a3b8;
          cursor: pointer;
        }
        
        .cookie-settings-close:hover {
          color: #f8fafc;
        }
        
        .cookie-settings-content {
          padding: 20px;
        }
        
        .cookie-settings-item {
          display: flex;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .cookie-settings-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        
        .cookie-settings-info {
          flex: 1;
          padding-left: 15px;
        }
        
        .cookie-settings-info h4 {
          font-size: 16px;
          margin: 0 0 5px;
          color: #f8fafc;
        }
        
        .cookie-settings-info p {
          font-size: 14px;
          margin: 0;
          color: #94a3b8;
          line-height: 1.5;
        }
        
        .cookie-toggle {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        
        .cookie-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .cookie-toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #475569;
          transition: .4s;
          border-radius: 34px;
        }
        
        .cookie-toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .cookie-toggle-slider {
          background-color: #c71a3f;
        }
        
        input:checked + .cookie-toggle-slider:before {
          transform: translateX(26px);
        }
        
        input:disabled + .cookie-toggle-slider {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .cookie-settings-footer {
          padding: 15px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: right;
        }
        
        @media (max-width: 768px) {
          .cookie-consent-buttons {
            flex-direction: column;
            width: 100%;
          }
          
          .cookie-btn {
            width: 100%;
            text-align: center;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Inicializar el gestor de consentimiento cuando la página esté lista
document.addEventListener('DOMContentLoaded', function() {
  window.cookieConsent = new CookieConsent();
}); 