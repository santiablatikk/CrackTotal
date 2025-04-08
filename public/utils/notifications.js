/**
 * Muestra una notificación toast en la pantalla
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (info, success, error, warning)
 * @param {number} duration - Duración en milisegundos (por defecto 3000ms)
 */
function showNotification(message, type = 'info', duration = 3000) {
  // Agregar estilos si no existen
  if (!document.getElementById('notification-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'notification-styles';
    styleElement.textContent = `
      /* Estilos para las notificaciones toast */
      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-size: 14px;
        z-index: 9999;
        display: none;
        animation: fadeInOut 3s ease forwards;
        background-color: #1e293b;
        color: white;
        border-left: 4px solid var(--accent-color, #3182ce);
      }
      
      .toast.success {
        border-left-color: #48bb78;
      }
      
      .toast.error {
        border-left-color: #f56565;
      }
      
      .toast.info {
        border-left-color: #4299e1;
      }
      
      .toast.warning {
        border-left-color: #ed8936;
      }
      
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
      }
      
      @media (max-width: 600px) {
        .toast {
          width: calc(100% - 40px);
          right: auto;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Buscar elemento de notificación existente o crear uno nuevo
  let notification = document.getElementById('notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'toast';
    notification.style.display = 'none';
    document.body.appendChild(notification);
  }
  
  // Mostrar notificación
  notification.textContent = message;
  notification.className = `toast ${type}`;
  notification.style.display = 'block';
  
  // Ocultar después del tiempo especificado
  setTimeout(() => {
    notification.style.display = 'none';
  }, duration);
}

// Exponer la función globalmente
window.showNotification = showNotification; 