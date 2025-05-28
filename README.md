# 🏆 Crack Total - El Juego del Fútbol

**Crack Total** es una plataforma interactiva de trivia y juegos de fútbol donde los usuarios pueden demostrar sus conocimientos futbolísticos a través de diferentes modalidades de juego.

## 🚀 Características

- **Juegos Multijugador**: Sistema de salas con WebSocket para juegos en tiempo real
- **Múltiples Modalidades**: Quién Sabe Más, Crack Rápido, El Mentiroso
- **6 Niveles de Dificultad**: Desde básico hasta experto
- **Sistema de Rankings**: Competencia global entre jugadores
- **Interfaz Moderna**: Diseño responsive con CSS Grid/Flexbox
- **PWA Ready**: Progressive Web App con Service Worker
- **SEO Optimizado**: Meta tags, Schema.org, y optimizaciones avanzadas

## 🛠️ Tecnologías

### Frontend
- **HTML5/CSS3/JavaScript ES6+**
- **CSS Grid & Flexbox** para layouts responsivos
- **Service Worker** para PWA y cache
- **WebSocket** para comunicación en tiempo real

### Backend
- **Node.js** con servidor HTTP nativo
- **WebSocket (ws)** para tiempo real
- **Sistema de archivos** para almacenamiento de preguntas

### Analytics & Performance
- **Google Analytics 4** 
- **Sistema de métricas avanzado** (Core Web Vitals)
- **Optimizador de rendimiento automático**
- **Sistema de notificaciones inteligentes**

## 📦 Deployment en Render

### Configuración Automática

El proyecto está configurado para deployment automático en Render con:

- **`package.json`**: Dependencias y scripts
- **`render.yaml`**: Configuración de servicio
- **Servidor HTTP**: Sirve archivos estáticos y WebSocket

### Variables de Entorno

```bash
NODE_ENV=production
PORT=8081  # Render asigna automáticamente
```

### Comandos de Build

```bash
# Build (automático en Render)
npm install

# Start (automático en Render)
npm start
```

## 🏗️ Estructura del Proyecto

```
cracktotal/
├── 📁 css/              # Estilos CSS modulares
├── 📁 data/             # Archivos JSON con preguntas
├── 📁 images/           # Recursos de imagen
├── 📁 js/               # JavaScript modular
├── 📄 index.html        # Página principal
├── 📄 server.js         # Servidor WebSocket + HTTP
├── 📄 package.json      # Configuración Node.js
├── 📄 render.yaml       # Configuración Render
└── 📄 manifest.json     # PWA Manifest
```

## 🎮 Modalidades de Juego

### 1. **Quién Sabe Más**
- Duelo 1vs1 en tiempo real
- Avance por niveles de dificultad
- Sistema de puntuación competitivo

### 2. **Crack Rápido**
- Respuesta rápida individual
- Medición de tiempo de respuesta
- Ranking por velocidad y precisión

### 3. **El Mentiroso**
- Juego de apuestas y deducciones
- Mecánica de bluff social
- Validación colaborativa

## 📊 Sistema de Analytics

El sitio incluye un sistema avanzado de analytics que mide:

- **Core Web Vitals**: FCP, LCP, CLS, FID
- **Engagement**: Tiempo en página, scroll depth, clicks
- **Performance**: Tiempos de carga, recursos lentos
- **Eventos de juego**: Estadísticas detalladas por modalidad

## 🔧 Optimizaciones Implementadas

### Performance
- **Lazy loading** de imágenes
- **Preload** de recursos críticos
- **Cache automático** con Service Worker
- **Compresión** de assets
- **DNS prefetch** para recursos externos

### SEO
- **Meta tags** completos
- **Schema.org** markup
- **Open Graph** para redes sociales
- **Canonical URLs**
- **Sitemap XML** dinámico

### UX
- **Estados de carga** con shimmer
- **Notificaciones inteligentes**
- **Feedback visual** inmediato
- **Responsive design** completo

## 🚦 Estado del Deployment

✅ **Archivos de configuración creados**  
✅ **Servidor HTTP configurado**  
✅ **Dependencies resueltas**  
✅ **WebSocket funcionando**  
✅ **Archivos estáticos servidos**  

## 📝 Pasos para Deploy en Render

1. **Conectar repositorio** a Render
2. **Seleccionar** "Web Service"
3. **Configuración automática** desde `render.yaml`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Deploy** automático

## 🐛 Solución de Errores Comunes

### Error: "package.json not found"
- ✅ **Solucionado**: `package.json` creado en root

### Error: "Build failed"
- ✅ **Solucionado**: Dependencies correctas en package.json

### Error: "Cannot serve static files"
- ✅ **Solucionado**: Servidor HTTP configurado para archivos estáticos

## 📞 Soporte

Para problemas de deployment o configuración, verificar:

1. **Logs de Render** para errores específicos
2. **Console del navegador** para errores frontend
3. **Network tab** para problemas de recursos
4. **WebSocket connection** en Developer Tools

---

**Desarrollado con ❤️ para los fanáticos del fútbol** ⚽