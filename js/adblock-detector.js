/**
 * Detector de AdBlock para Crack Total
 * Muestra un mensaje amigable a usuarios con bloqueadores de anuncios
 */

class AdBlockDetector {
  constructor(options = {}) {
    this.options = Object.assign({
      showAlert: false,
      showBanner: true,
      bannerDuration: 7000, // milisegundos que se muestra el banner
      messageTitle: '¡Detectamos un bloqueador de anuncios!',
      messageText: 'Entendemos que los anuncios pueden ser molestos, pero son nuestra principal fuente de ingresos para mantener este sitio gratuito. ¿Podrías considerar desactivar tu bloqueador para apoyarnos?',
      closeText: 'Entendido',
      learnMoreText: 'Saber más',
      learnMoreLink: '/cookies.html',
      refreshText: 'He desactivado AdBlock',
      bannerPosition: 'bottom' // 'top' o 'bottom'
    }, options);
    
    this.adblockDetected = false;
    this.banner = null;
    
    this.init();
  }
  
  init() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.detectAdBlock());
    } else {
      this.detectAdBlock();
    }
  }
  
  detectAdBlock() {
    // Crear un elemento de prueba que los bloqueadores de anuncios suelen ocultar
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad adglare';
    testAd.style.cssText = 'position: absolute; top: -10px; left: -10px; height: 1px; width: 1px; opacity: 0;';
    
    document.body.appendChild(testAd);
    
    // Comprobar después de un breve retraso
    setTimeout(() => {
      this.adblockDetected = testAd.offsetHeight === 0 || testAd.clientHeight === 0;
      testAd.remove();
      
      if (this.adblockDetected) {
        if (this.options.showAlert) {
          alert(this.options.messageTitle + '\n\n' + this.options.messageText);
        }
        
        if (this.options.showBanner) {
          this.showAdBlockBanner();
        }
        
        // Registrar evento para análisis (si está disponible)
        if (typeof gtag === 'function') {
          gtag('event', 'adblock_detected', {
            'event_category': 'AdBlock',
            'event_label': 'Usuario con AdBlock'
          });
        }
      }
    }, 100);
  }
  
  showAdBlockBanner() {
    // Crear el banner solo si no existe ya
    if (document.getElementById('adblock-banner')) return;
    
    // Crear el banner
    this.banner = document.createElement('div');
    this.banner.id = 'adblock-banner';
    this.banner.className = `adblock-banner adblock-banner-${this.options.bannerPosition}`;
    
    this.banner.innerHTML = `
      <div class="adblock-banner-container">
        <div class="adblock-banner-content">
          <div class="adblock-banner-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="adblock-banner-text">
            <h3>${this.options.messageTitle}</h3>
            <p>${this.options.messageText}</p>
          </div>
        </div>
        <div class="adblock-banner-buttons">
          <button id="adblock-dismiss" class="adblock-btn adblock-btn-secondary">${this.options.closeText}</button>
          <a href="${this.options.learnMoreLink}" class="adblock-btn adblock-btn-link">${this.options.learnMoreText}</a>
          <button id="adblock-refresh" class="adblock-btn adblock-btn-primary">${this.options.refreshText}</button>
        </div>
        <button id="adblock-close" class="adblock-banner-close">&times;</button>
      </div>
    `;
    
    document.body.appendChild(this.banner);
    
    // Agregar estilos
    this.addStyles();
    
    // Agregar eventos
    document.getElementById('adblock-dismiss').addEventListener('click', () => this.dismissBanner());
    document.getElementById('adblock-close').addEventListener('click', () => this.dismissBanner());
    document.getElementById('adblock-refresh').addEventListener('click', () => window.location.reload());
    
    // Auto-cerrar después del tiempo establecido (si es > 0)
    if (this.options.bannerDuration > 0) {
      setTimeout(() => {
        this.dismissBanner();
      }, this.options.bannerDuration);
    }
  }
  
  dismissBanner() {
    if (this.banner) {
      this.banner.classList.add('adblock-banner-hidden');
      
      // Eliminar después de la animación
      setTimeout(() => {
        if (this.banner) {
          this.banner.remove();
          this.banner = null;
        }
      }, 300);
    }
  }
  
  addStyles() {
    // Añadir estilos CSS solo si no existen ya
    if (!document.getElementById('adblock-detector-styles')) {
      const style = document.createElement('style');
      style.id = 'adblock-detector-styles';
      style.textContent = `
        .adblock-banner {
          position: fixed;
          left: 0;
          right: 0;
          z-index: 999998;
          background-color: #fff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
          font-family: 'Montserrat', sans-serif;
          max-width: 800px;
          margin: 0 auto;
          border-radius: 8px;
          opacity: 1;
        }
        
        .adblock-banner-top {
          top: 20px;
        }
        
        .adblock-banner-bottom {
          bottom: 20px;
        }
        
        .adblock-banner-hidden {
          opacity: 0;
          transform: translateY(20px);
        }
        
        .adblock-banner-container {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }
        
        .adblock-banner-content {
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }
        
        .adblock-banner-icon {
          flex: 0 0 40px;
          color: #c71a3f;
        }
        
        .adblock-banner-icon svg {
          width: 32px;
          height: 32px;
        }
        
        .adblock-banner-text {
          flex: 1;
        }
        
        .adblock-banner-text h3 {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }
        
        .adblock-banner-text p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #334155;
        }
        
        .adblock-banner-buttons {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          padding-left: 55px;
        }
        
        .adblock-btn {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
        }
        
        .adblock-btn-primary {
          background-color: #c71a3f;
          color: white;
        }
        
        .adblock-btn-primary:hover {
          background-color: #a61232;
        }
        
        .adblock-btn-secondary {
          background-color: #f1f5f9;
          color: #334155;
        }
        
        .adblock-btn-secondary:hover {
          background-color: #e2e8f0;
        }
        
        .adblock-btn-link {
          background: none;
          color: #64748b;
          text-decoration: underline;
          padding: 8px 8px;
        }
        
        .adblock-btn-link:hover {
          color: #475569;
        }
        
        .adblock-banner-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 22px;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
        }
        
        .adblock-banner-close:hover {
          color: #64748b;
        }
        
        @media (max-width: 768px) {
          .adblock-banner {
            max-width: calc(100% - 32px);
            margin: 0 16px;
          }
          
          .adblock-banner-content {
            flex-direction: column;
            gap: 10px;
          }
          
          .adblock-banner-buttons {
            padding-left: 0;
          }
          
          .adblock-btn {
            width: 100%;
            text-align: center;
          }
        }
      `;
      
      document.head.appendChild(style);
    }
  }
}

// Inicializar el detector cuando la página esté lista
window.addEventListener('load', function() {
  window.adBlockDetector = new AdBlockDetector();
}); 