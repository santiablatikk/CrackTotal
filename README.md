# Crack Total - Plataforma de Juegos de Fútbol

## 🚀 Problemas Solucionados

### ✅ 1. Imagen del index.html
- **Problema**: La imagen no se cargaba por usar `loading="lazy"`
- **Solución**: Cambiado a `loading="eager"` para carga inmediata

### ✅ 2. Botón "Comenzar" en Crack Rápido
- **Problema**: El botón no dirigía al juego
- **Solución**: Agregada función `showAchievements()` faltante

### ✅ 3. Conexión al servidor en juegos multijugador
- **Problema**: Los juegos no se conectaban al servidor
- **Solución**: Actualizada configuración de WebSocket para detectar localhost automáticamente

### ✅ 4. Historial de rankings simplificado
- **Problema**: El historial era muy complejo y no tenía estilos consistentes
- **Solución**: Simplificado el historial para mostrar solo jugadores y resultado, agregados estilos CSS

## 🛠️ Instalación y Ejecución

### Prerrequisitos
- Node.js >= 14.0.0
- npm

### Instalación
```bash
# Instalar dependencias
npm install
```

### Ejecución

#### Servidor Local
```bash
# Iniciar servidor en puerto 3000 (o PORT del entorno)
npm start
```

#### Desarrollo
```bash
# Modo desarrollo
npm run dev
```

### Acceso
- **Local**: http://localhost:3000
- **Producción**: https://cracktotal.com

## 🎮 Juegos Disponibles

### 1. Crack Rápido
- Trivia de velocidad con 20 preguntas
- 5 segundos por pregunta
- Power-ups disponibles
- **URL**: `/crack-rapido.html`

### 2. Quién Sabe Más (1v1)
- Duelos de conocimiento entre jugadores
- 6 niveles de dificultad
- Modo multijugador en tiempo real
- **URL**: `/quiensabemas.html`

### 3. Mentiroso
- Juego de engaño y detección
- Modo multijugador
- Sistema de puntuación por engaños exitosos
- **URL**: `/mentiroso.html`

## 🔧 Configuración del Servidor

### WebSocket URLs
- **Local**: `ws://localhost:3000`
- **Producción**: `wss://cracktotal-servidor.onrender.com`

La aplicación detecta automáticamente el entorno y usa la URL correcta.

## 📊 Rankings

### Disponibles
- **Crack Rápido**: `/ranking-crackrapido.html`
- **Quién Sabe Más**: `/ranking-quiensabemas.html`
- **Mentiroso**: `/ranking-mentiroso.html`

### Características
- Historial simplificado con jugadores y resultados
- Estilos consistentes entre todos los rankings
- Estadísticas clave por partida

## 🐛 Solución de Problemas

### Servidor no conecta
1. Verificar que el servidor esté ejecutándose: `npm start`
2. Comprobar el puerto (por defecto 3000)
3. Verificar firewall/antivirus

### Imagen no carga
- La imagen ahora usa `loading="eager"` para carga inmediata
- Verificar que existe `/assets/images/portada.jpg`

### Botones no funcionan
- Verificar que JavaScript esté habilitado
- Comprobar consola del navegador para errores

## 📁 Estructura del Proyecto

```
crack-total/
├── assets/
│   ├── css/           # Estilos CSS
│   ├── js/            # JavaScript
│   ├── images/        # Imágenes
│   └── data/          # Datos de preguntas
├── server.js          # Servidor principal
├── index.html         # Página principal
├── crack-rapido.html  # Juego Crack Rápido
├── quiensabemas.html  # Juego Quién Sabe Más
├── mentiroso.html     # Juego Mentiroso
└── ranking-*.html     # Páginas de rankings
```

## 🚀 Despliegue

### Render.com
El proyecto está configurado para desplegarse automáticamente en Render.com:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node.js

### Variables de Entorno
- `PORT`: Puerto del servidor (automático en Render)

## 📝 Notas de Desarrollo

### Cambios Recientes
1. **WebSocket**: Configuración automática de URL según entorno
2. **CSS**: Estilos unificados para rankings
3. **JavaScript**: Funciones faltantes agregadas
4. **Imágenes**: Optimización de carga

### Próximas Mejoras
- [ ] Sistema de autenticación
- [ ] Más categorías de preguntas
- [ ] Modo torneo
- [ ] Chat en tiempo real

## 📞 Soporte

Para reportar problemas o sugerencias:
- Revisar la consola del navegador
- Verificar conexión a internet
- Comprobar que el servidor esté activo 