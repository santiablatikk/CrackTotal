/**
 * Script para asegurar que los enlaces en el footer sean relativos a la ubicación actual
 * y manejar la funcionalidad compartir en toda la web
 */

// Función para actualizar los enlaces en el footer según la profundidad del archivo
function updateFooterLinks() {
  // Determinar la profundidad del archivo actual
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/').filter(Boolean);
  const depth = pathParts.length - (currentPath.endsWith('/') ? 0 : 1);
  const prefix = depth > 0 ? '../'.repeat(depth) : '';

  // Actualizar todos los enlaces en el footer
  const footer = document.querySelector('footer');
  if (!footer) return;

  // Verificar si faltan enlaces esenciales en el footer
  const essentialLinks = [
    { icon: 'fa-home', text: ' Portal', href: 'portal.html' },
    { icon: 'fa-file-contract', text: ' Términos', href: 'terms.html' },
    { icon: 'fa-lock', text: ' Privacidad', href: 'privacy.html' },
    { icon: 'fa-blog', text: ' Blog', href: 'blog.html' },
    { icon: 'fa-cookie-bite', text: ' Cookies', href: 'cookies.html' },
    { icon: 'fa-envelope', text: ' Contacto', href: 'contact.html' },
    { icon: 'fa-info-circle', text: ' Acerca de', href: 'about.html' },
    { icon: 'fa-medal', text: ' Logros', href: 'logros.html' }
  ];

  // Obtener el contenedor de enlaces del footer
  const footerLinksContainer = footer.querySelector('.footer-links-mini');
  if (footerLinksContainer) {
    // Verificar si falta algún enlace esencial
    essentialLinks.forEach(link => {
      const exists = Array.from(footerLinksContainer.querySelectorAll('a')).some(a => 
        a.textContent.includes(link.text) ||
        a.getAttribute('href').endsWith(link.href)
      );
      
      if (!exists) {
        // Agregar el enlace faltante
        const newLink = document.createElement('a');
        newLink.href = prefix + link.href;
        newLink.innerHTML = `<i class="fas ${link.icon}"></i>${link.text}`;
        footerLinksContainer.appendChild(newLink);
      }
    });
  }

  // Actualizar enlaces en el footer para que tengan las rutas correctas
  const links = footer.querySelectorAll('a[href]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    
    // Solo actualizar enlaces internos que no sean absolutos
    if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
      // Si el enlace ya comienza con '../', no modificarlo
      if (!href.startsWith('../') && !href.startsWith('./')) {
        // Eliminar cualquier './' inicial antes de añadir el prefijo
        const cleanHref = href.startsWith('./') ? href.substring(2) : href;
        link.setAttribute('href', prefix + cleanHref);
      }
    }
  });
}

// Asegurar que el footer esté siempre visible
function ensureFooterVisibility() {
  const footer = document.querySelector('footer.policy-footer');
  if (!footer) return;
  
  // Verificar si el footer está oculto por CSS
  const footerStyle = window.getComputedStyle(footer);
  if (footerStyle.display === 'none' || footerStyle.visibility === 'hidden') {
    footer.style.display = 'block';
    footer.style.visibility = 'visible';
  }
  
  // Asegurarse de que esté al final de la página
  document.body.appendChild(footer);
  
  // Verificar si necesita scroll para ver el footer
  const windowHeight = window.innerHeight;
  const documentHeight = document.body.scrollHeight;
  const footerHeight = footer.offsetHeight;
  
  if (documentHeight < windowHeight + footerHeight) {
    // Añadir padding-bottom al body para asegurar que haya espacio para el footer
    document.body.style.paddingBottom = footerHeight + 'px';
  }
  
  // Asegurarse de que el footer tenga un z-index alto
  footer.style.zIndex = '10';
}

// Función para manejar el botón de compartir
function setupShareButton() {
  const shareButton = document.getElementById('share-button');
  if (!shareButton) return;
  
  shareButton.addEventListener('click', function() {
    // Título y URL para compartir
    const pageTitle = document.title || 'Crack Total - El Juego del Rosco Futbolero';
    const pageUrl = window.location.href;
    const text = '¡Estoy jugando al Rosco Futbolero! ¿Te atreves a probarlo?';
    
    // Comprobar si la API de compartir está disponible
    if (navigator.share) {
      navigator.share({
        title: pageTitle,
        text: text,
        url: pageUrl
      })
      .catch(error => {
        console.warn('Error al compartir:', error);
        showShareDialog(pageTitle, text, pageUrl);
      });
    } else {
      // Fallback para navegadores que no soportan la API Share
      showShareDialog(pageTitle, text, pageUrl);
    }
  });
}

// Función para mostrar el diálogo de compartir personalizado
function showShareDialog(title, text, url) {
  // Crear el diálogo si no existe
  let shareOptions = document.querySelector('.share-options');
  
  if (shareOptions) {
    document.body.removeChild(shareOptions);
  }
  
  shareOptions = document.createElement('div');
  shareOptions.className = 'share-options';
  shareOptions.innerHTML = `
    <div class="share-dialog">
      <div class="share-header">
        <h3>Compartir esta página</h3>
        <button class="close-share"><i class="fas fa-times"></i></button>
      </div>
      <div class="share-buttons">
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="fb-share">
          <i class="fab fa-facebook-f"></i> Facebook
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" target="_blank" class="tw-share">
          <i class="fab fa-twitter"></i> Twitter
        </a>
        <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}" target="_blank" class="wa-share">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
        <a href="mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + ' ' + url)}" class="email-share">
          <i class="fas fa-envelope"></i> Email
        </a>
      </div>
    </div>
  `;
  
  document.body.appendChild(shareOptions);
  
  // Cerrar el diálogo cuando se hace clic en el botón de cerrar
  const closeButton = shareOptions.querySelector('.close-share');
  closeButton.addEventListener('click', function() {
    document.body.removeChild(shareOptions);
  });
  
  // Cerrar el diálogo al hacer clic fuera de él
  shareOptions.addEventListener('click', function(e) {
    if (e.target === shareOptions) {
      document.body.removeChild(shareOptions);
    }
  });
}

// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  updateFooterLinks();
  ensureFooterVisibility();
  setupShareButton();
  
  // Verificar nuevamente después de 1 segundo para asegurar la visibilidad
  setTimeout(ensureFooterVisibility, 1000);
  
  // Verificar cuando se carguen imágenes o recursos adicionales
  window.addEventListener('load', ensureFooterVisibility);
  
  // Verificar cuando cambie el tamaño de la ventana
  window.addEventListener('resize', ensureFooterVisibility);
}); 