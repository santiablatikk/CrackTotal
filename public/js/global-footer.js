/**
 * Script global para actualizar todos los footers del sitio
 * Este script debe ser incluido en todos los archivos HTML
 */
document.addEventListener('DOMContentLoaded', function() {
  // Buscar footers existentes con clases antiguas
  const oldFooters = document.querySelectorAll('.policy-footer, .nuevo-footer, footer');
  
  // Crear el nuevo footer si no existe ya uno con la clase nuevo-footer
  if (!document.querySelector('.nuevo-footer')) {
    // Crear el nuevo footer
    const newFooter = document.createElement('footer');
    newFooter.className = 'nuevo-footer';
    
    // Determinar los prefijos de ruta según donde estamos
    const path = window.location.pathname;
    const isInSubdir = path.includes('/millonario/') || path.includes('/pasala-che/');
    const isInSubSubdir = path.includes('/millonario/vs/');
    
    let prefix = '';
    if (isInSubSubdir) {
      prefix = '../../';
    } else if (isInSubdir) {
      prefix = '../';
    }
    
    // Configurar el contenido HTML del footer
    newFooter.innerHTML = `
      <div class="footer-links">
        <a href="${prefix}terms.html">Términos</a>
        <a href="${prefix}privacy.html">Privacidad</a>
        <a href="${prefix}blog.html">Blog</a>
        <a href="${prefix}cookies.html">Cookies</a>
        <a href="${prefix}contact.html">Contacto</a>
        <a href="${prefix}about.html">Acerca de</a>
      </div>
      <div class="copyright-text">© 2025 CRACK TOTAL - El Juego del Rosco Futbolero.</div>
      <div class="footer-social-icons">
        <a href="https://www.facebook.com/cracktotal" class="social-icon" target="_blank"><i class="fab fa-facebook-f"></i></a>
        <a href="https://twitter.com/cracktotal" class="social-icon" target="_blank"><i class="fab fa-twitter"></i></a>
        <a href="https://www.instagram.com/cracktotal" class="social-icon" target="_blank"><i class="fab fa-instagram"></i></a>
        <a href="https://www.youtube.com/c/cracktotal" class="social-icon" target="_blank"><i class="fab fa-youtube"></i></a>
      </div>
    `;
    
    // Reemplazar el primer footer existente o añadir al final del body
    if (oldFooters.length > 0) {
      oldFooters[0].replaceWith(newFooter);
      
      // Eliminar el resto de footers si hay más de uno
      for (let i = 1; i < oldFooters.length; i++) {
        oldFooters[i].remove();
      }
    } else {
      document.body.appendChild(newFooter);
    }
    
    // Añadir los estilos si no existe la hoja de estilos del footer
    if (!document.querySelector('link[href*="footer-styles.css"]')) {
      addFooterStyles();
    }
  }
  
  // Ocultar footers antiguos si existen
  document.querySelectorAll('.policy-footer').forEach(footer => {
    footer.style.display = 'none';
  });
  
  // Función para añadir los estilos del footer
  function addFooterStyles() {
    const style = document.createElement('style');
    style.id = 'nuevo-footer-styles';
    style.textContent = `
      /* Estilos para el nuevo footer */
      .nuevo-footer {
        width: 100%;
        max-width: 800px;
        margin: 2rem auto 0;
        text-align: center;
        position: relative;
        padding-top: 1.5rem;
        z-index: 1;
        opacity: 0.9;
        flex-shrink: 0;
      }
      
      .nuevo-footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60%;
        height: 1px;
        background: linear-gradient(to right, transparent, var(--accent-color, #3182ce), transparent);
        opacity: 0.3;
      }
      
      .footer-links {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      
      .footer-links a {
        color: var(--text-muted, #718096);
        text-decoration: none;
        font-size: 0.85rem;
        transition: all 0.3s ease;
        position: relative;
        padding-bottom: 2px;
      }
      
      .footer-links a::after {
        content: '';
        position: absolute;
        width: 0;
        height: 1px;
        bottom: 0;
        left: 0;
        background-color: var(--accent-color, #3182ce);
        transition: all 0.3s ease;
      }
      
      .footer-links a:hover::after {
        width: 100%;
      }
      
      .footer-links a:hover {
        color: var(--accent-color, #3182ce);
        transform: translateY(-2px);
      }
      
      .copyright-text {
        font-size: 0.8rem;
        color: var(--text-muted, #718096);
        opacity: 0.7;
        margin-bottom: 0.75rem;
      }
      
      .footer-social-icons {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-top: 15px;
      }
      
      .social-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: rgba(225, 29, 72, 0.1);
        color: var(--text-muted, #718096);
        transition: all 0.3s ease;
      }
      
      .social-icon:hover {
        background-color: var(--accent-color, #3182ce);
        color: white;
        transform: translateY(-3px);
      }
      
      @media (max-width: 600px) {
        .footer-links {
          gap: 0.5rem;
        }
        
        .footer-links a {
          font-size: 0.75rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}); 