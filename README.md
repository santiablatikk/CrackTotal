# CRACK TOTAL - Panel de Usuario

Un panel de usuario moderno para los juegos PASALA CHE y ¿QUIÉN SABE MÁS? que muestra estadísticas y rankings en tiempo real.

## Características

- **Dashboard Interactivo:** Muestra estadísticas personales, rankings globales y logros
- **Soporte para múltiples juegos:** Cambia fácilmente entre los juegos PASALA CHE y ¿QUIÉN SABE MÁS?
- **Datos en tiempo real:** Los resultados de las partidas actualizan automáticamente las estadísticas
- **Ranking global:** Clasificación de jugadores con filtros por períodos (global, mensual, semanal)
- **Estadísticas detalladas:** Análisis visual de rendimiento por letras o categorías

## Requisitos

- PHP 7.4 o superior
- MySQL 5.7 o superior
- Servidor web (Apache, Nginx, etc.)

## Instalación

1. Clona este repositorio en tu servidor web:
   ```
   git clone https://github.com/tu-usuario/crack-total.git
   ```

2. Configura la base de datos en `public/api/index.php` y `public/api/install.php`:
   ```php
   $db_host = 'localhost';  // Servidor de base de datos
   $db_name = 'crack_total'; // Nombre de la base de datos
   $db_user = 'root';       // Usuario de la base de datos
   $db_pass = '';           // Contraseña del usuario
   ```

3. Ejecuta el script de instalación para crear la base de datos y tablas:
   ```
   http://tu-servidor/public/api/install.php
   ```

4. Accede al dashboard:
   ```
   http://tu-servidor/public/user-dashboard.html
   ```

## Integración con Juegos

Para integrar los resultados de los juegos con el dashboard, usa las funciones en `game-completion.js`:

### Para PASALA CHE:

```javascript
// Al finalizar un juego de PASALA CHE
const gameResults = {
    correctLetters: 22,
    incorrectLetters: 5,
    letterDetails: [
        { letter: 'A', word: 'Argentina', isCorrect: true },
        { letter: 'B', word: 'Brasil', isCorrect: true },
        // ... más letras
    ]
};

sendPasalaCheResults(gameResults)
    .then(() => {
        // Redirigir al dashboard o mostrar resumen
        window.location.href = '/public/user-dashboard.html';
    });
```

### Para ¿QUIÉN SABE MÁS?:

```javascript
// Al finalizar un juego de QUIÉN SABE MÁS
const quizResults = {
    score: 7,
    correctAnswers: 12,
    incorrectAnswers: 2,
    skippedQuestions: 1,
    totalQuestions: 15,
    categoryDetails: [
        { category: 'Historia', question: '¿En qué año...?', answer: '1986', isCorrect: true },
        // ... más preguntas
    ]
};

sendQuienSabeMasResults(quizResults)
    .then(() => {
        // Redirigir al dashboard o mostrar resumen
        window.location.href = '/public/user-dashboard.html';
    });
```

## Estructura de Archivos

- `public/user-dashboard.html` - Página principal del dashboard
- `public/css/user/` - Archivos CSS para estilos del dashboard
  - `dashboard-modern.css` - Estilos principales
  - `game-notifications.css` - Estilos para notificaciones
- `public/js/` - Archivos JavaScript
  - `user-dashboard.js` - Lógica principal del dashboard
  - `game-completion.js` - Funciones para enviar resultados de juegos
- `public/api/` - Endpoints de la API
  - `index.php` - Controlador principal de la API
  - `install.php` - Script de instalación de la base de datos

## Autenticación

Por ahora, el sistema usa un usuario de prueba (ID=1). En una implementación real, deberías:

1. Implementar un sistema de inicio de sesión
2. Usar sesiones PHP o tokens JWT para la autenticación
3. Modificar la función `getCurrentUserId()` en `public/api/index.php` para obtener el ID del usuario actual autenticado

## Notas de Implementación

1. Este sistema usa una base de datos MySQL para almacenar datos reales de usuarios y partidas
2. Los datos se actualizan automáticamente después de cada partida
3. Para evitar problemas de CORS, asegúrate de ejecutar tanto el frontend como la API en el mismo dominio
4. Para desarrollo local, puedes usar PHP's built-in server: `php -S localhost:8000 -t public`