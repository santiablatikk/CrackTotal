/**
 * Script para actualizar todos los footers del sitio con el nuevo footer
 */
document.addEventListener('DOMContentLoaded', function() {
  // Solo crear el nuevo footer si aún no existe
  if (!document.querySelector('.nuevo-footer')) {
    // Crear el nuevo footer
    const footer = document.createElement('footer');
    footer.className = 'nuevo-footer';
    
    // Añadir los enlaces
    const linksContainer = document.createElement('div');
    linksContainer.className = 'footer-links';
    
    // Definir los enlaces
    const links = [
      { href: 'terms.html', text: 'Términos' },
      { href: 'privacy.html', text: 'Privacidad' },
      { href: 'blog.html', text: 'Blog' },
      { href: 'cookies.html', text: 'Cookies' },
      { href: 'contacto.html', text: 'Contacto' },
      { href: 'about.html', text: 'Acerca de' }
    ];
    
    // Crear y añadir los enlaces al contenedor
    links.forEach(link => {
      const a = document.createElement('a');
      a.href = addPathPrefix(link.href);
      a.textContent = link.text;
      linksContainer.appendChild(a);
    });
    
    // Crear el texto de copyright
    const copyright = document.createElement('div');
    copyright.className = 'copyright-text';
    copyright.textContent = '© 2025 CRACK TOTAL - El Juego del Rosco Futbolero.';
    
    // Crear los iconos sociales
    const socialIcons = document.createElement('div');
    socialIcons.className = 'footer-social-icons';
    
    // Definir las redes sociales
    const socialNetworks = [
      { href: 'https://www.facebook.com/cracktotal', icon: 'facebook-f' },
      { href: 'https://twitter.com/cracktotal', icon: 'twitter' },
      { href: 'https://www.instagram.com/cracktotal', icon: 'instagram' },
      { href: 'https://www.youtube.com/c/cracktotal', icon: 'youtube' }
    ];
    
    // Crear y añadir los iconos sociales
    socialNetworks.forEach(social => {
      const a = document.createElement('a');
      a.href = social.href;
      a.className = 'social-icon';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      
      const i = document.createElement('i');
      i.className = `fab fa-${social.icon}`;
      
      a.appendChild(i);
      socialIcons.appendChild(a);
    });
    
    // Añadir todos los elementos al footer
    footer.appendChild(linksContainer);
    footer.appendChild(copyright);
    footer.appendChild(socialIcons);
    
    // Buscar y reemplazar todos los footers existentes con el nuevo footer
    const existingFooters = document.querySelectorAll('footer');
    if (existingFooters.length > 0) {
      // Reemplazar el primer footer y eliminar el resto
      existingFooters[0].replaceWith(footer);
      for (let i = 1; i < existingFooters.length; i++) {
        existingFooters[i].remove();
      }
    } else {
      // Si no hay footers, añadir uno al final del body
      document.body.appendChild(footer);
    }
    
    // Añadir los estilos para el nuevo footer
    addFooterStyles();
  }
  
  // Función para añadir estilos del nuevo footer
  function addFooterStyles() {
    const style = document.createElement('style');
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
  
  // Función para manejar la diferencia de rutas en diferentes niveles del sitio
  function addPathPrefix(href) {
    // Detectar si estamos en una subcarpeta
    const path = window.location.pathname;
    let prefix = '';
    
    // Si estamos en un subdirectorio (como millonario/)
    if (path.includes('/millonario/')) {
      prefix = '../';
    }
    
    // Si estamos en un sub-subdirectorio (como millonario/vs/)
    if (path.includes('/millonario/vs/')) {
      prefix = '../../';
    }
    
    return prefix + href;
  }
}); 