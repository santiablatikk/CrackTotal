/**
 * Botón de compartir en redes sociales para CRACK TOTAL
 */

// Crear y agregar el botón flotante al DOM
function addShareButton() {
  // Comprobar si estamos en una página con botón de volver
  const hasBackButton = document.querySelector('.back-button') !== null;
  
  // Crear contenedor principal
  const shareContainer = document.createElement('div');
  shareContainer.className = 'share-floating-btn';
  
  // Si hay botón de volver, posicionamos a la izquierda
  if (hasBackButton) {
    shareContainer.style.left = '30px';
    shareContainer.style.right = 'auto';
  }
  
  // Crear botón principal
  const mainButton = document.createElement('button');
  mainButton.className = 'share-main-btn';
  mainButton.innerHTML = '<i class="fas fa-share-alt"></i>';
  
  // Crear opciones de compartir
  const shareOptions = document.createElement('div');
  shareOptions.className = 'share-options';
  
  // Facebook
  const facebookLink = document.createElement('a');
  facebookLink.href = 'javascript:void(0)';
  facebookLink.className = 'share-item facebook';
  facebookLink.innerHTML = '<i class="fab fa-facebook-f"></i>';
  facebookLink.addEventListener('click', shareOnFacebook);
  
  // Twitter
  const twitterLink = document.createElement('a');
  twitterLink.href = 'javascript:void(0)';
  twitterLink.className = 'share-item twitter';
  twitterLink.innerHTML = '<i class="fab fa-twitter"></i>';
  twitterLink.addEventListener('click', shareOnTwitter);
  
  // WhatsApp
  const whatsappLink = document.createElement('a');
  whatsappLink.href = 'javascript:void(0)';
  whatsappLink.className = 'share-item whatsapp';
  whatsappLink.innerHTML = '<i class="fab fa-whatsapp"></i>';
  whatsappLink.addEventListener('click', shareOnWhatsApp);
  
  // Agregar elementos al DOM
  shareOptions.appendChild(facebookLink);
  shareOptions.appendChild(twitterLink);
  shareOptions.appendChild(whatsappLink);
  
  shareContainer.appendChild(mainButton);
  shareContainer.appendChild(shareOptions);
  
  document.body.appendChild(shareContainer);
  
  // Agregar estilos CSS
  addShareButtonStyles();
  
  // Configurar funcionamiento del botón
  mainButton.addEventListener('click', function() {
    shareOptions.style.opacity = shareOptions.style.opacity === '1' ? '0' : '1';
    shareOptions.style.transform = shareOptions.style.opacity === '1' ? 'translateY(0)' : 'translateY(20px)';
    shareOptions.style.pointerEvents = shareOptions.style.opacity === '1' ? 'all' : 'none';
  });
}

// Agregar estilos CSS para el botón de compartir
function addShareButtonStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* Estilos para botón de compartir flotante */
    .share-floating-btn {
      position: fixed;
      bottom: 30px;
      left: 30px;
      z-index: 999;
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
    }
    
    .share-main-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e11d48, #be123c);
      border: none;
      box-shadow: 0 4px 12px rgba(225, 29, 72, 0.4);
      color: white;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 2;
    }
    
    .share-main-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(225, 29, 72, 0.5);
    }
    
    .share-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 15px;
      opacity: 0;
      transform: translateY(20px);
      pointer-events: none;
      transition: all 0.3s ease;
    }
    
    .share-floating-btn:hover .share-options,
    .share-main-btn:focus + .share-options {
      opacity: 1;
      transform: translateY(0);
      pointer-events: all;
    }
    
    /* Opcionalmente podemos añadir una clase para detectar si estamos en una página con botón de volver */
    .blog-page .share-floating-btn {
      left: 30px;
      right: auto;
    }
    
    /* Media query para dispositivos móviles */
    @media (max-width: 768px) {
      .share-floating-btn {
        bottom: 20px;
        left: 20px;
      }
    }
    
    .share-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      color: white;
      font-size: 1.2rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      text-decoration: none;
    }
    
    .share-item:hover {
      transform: scale(1.1);
    }
    
    .share-item.facebook {
      background: #1877f2;
    }
    
    .share-item.twitter {
      background: #1da1f2;
    }
    
    .share-item.whatsapp {
      background: #25d366;
    }
  `;
  document.head.appendChild(styleElement);
}

// Funciones para compartir en redes sociales
function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`, '_blank');
}

function shareOnTwitter() {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(`¡Juega a ${document.title} en CRACK TOTAL!`);
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
}

function shareOnWhatsApp() {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(`¡Juega a ${document.title} en CRACK TOTAL!`);
  window.open(`https://api.whatsapp.com/send?text=${title}%20${url}`, '_blank');
}

// Inicializar el botón de compartir cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  // Añadir un pequeño retraso para asegurar que todos los elementos del DOM estén cargados
  setTimeout(function() {
    addShareButton();
  }, 300);
}); 