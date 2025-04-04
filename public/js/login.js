/**
 * CRACK TOTAL - Gestor de Login
 * Maneja la funcionalidad de login para el sitio
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente cargado - Login');

    // Verificar si el usuario ya está logueado
    const username = localStorage.getItem('username') || localStorage.getItem('playerName');
    if (username) {
        console.log('Usuario ya logueado:', username);
        // Redirigir al portal si ya existe un nombre de usuario
        // Pero permitimos que se quede en la página si quiere cambiar su nombre
    }

    // Gestionar el formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('Formulario de login encontrado, inicializando...');
        
        // Focar en el input de username
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            // Si hay un nombre guardado, ponerlo como valor por defecto
            if (username) {
                usernameInput.value = username;
            }
            // Enfocar el input
            setTimeout(() => {
                usernameInput.focus();
            }, 500);
        }
        
        // Manejar el envío del formulario
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (usernameInput && usernameInput.value.trim() !== '') {
                // Guardar el nombre de usuario
                const newUsername = usernameInput.value.trim();
                localStorage.setItem('username', newUsername);
                localStorage.setItem('playerName', newUsername);
                
                console.log('Nombre guardado:', newUsername);
                
                // Mostrar notificación
                if (typeof showNotification === 'function') {
                    showNotification('¡Bienvenido, ' + newUsername + '!', 'success');
                } else {
                    console.log('Función showNotification no disponible');
                }
                
                // Redireccionar al portal
                setTimeout(() => {
                    window.location.href = 'portal.html';
                }, 500);
            } else {
                // Mostrar error si el campo está vacío
                if (typeof showNotification === 'function') {
                    showNotification('Por favor, ingresa tu nombre', 'error');
                } else {
                    alert('Por favor, ingresa tu nombre');
                }
            }
        });
    } else {
        console.warn('No se encontró el formulario de login');
    }
    
    // Inicializar partículas si está disponible
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        console.log('Inicializando particles.js...');
        try {
            particlesJS('particles-js', window.particlesConfig || {});
        } catch (error) {
            console.warn('Error al inicializar partículas:', error);
        }
    }
}); 