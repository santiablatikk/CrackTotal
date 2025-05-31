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

- **`package.json`**: Dependencies y scripts (DEBE estar en root)
- **`config/render.yaml`**: Configuración de servicio
- **Servidor HTTP**: Sirve archivos estáticos y WebSocket

### Archivos Críticos en Root
⚠️ **IMPORTANTE**: Estos archivos DEBEN permanecer en la raíz para que Render funcione:
- `package.json` - Render lo necesita para `npm install`
- `package-lock.json` - Para versiones exactas de dependencies
- `server.js` - Archivo principal del servidor

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

## 🏗️ Estructura del Proyecto (REORGANIZADA)

```
cracktotal/
├── 📁 assets/           # Recursos del proyecto
│   ├── 📁 css/          # Estilos CSS modulares
│   ├── 📁 js/           # JavaScript modular
│   ├── 📁 images/       # Recursos de imagen
│   └── 📁 data/         # Archivos JSON con preguntas
├── 📁 config/           # Archivos de configuración
│   ├── 📄 package.json  # Configuración Node.js
│   ├── 📄 manifest.json # PWA Manifest
│   ├── 📄 render.yaml   # Configuración Render
│   ├── 📄 netlify.toml  # Configuración Netlify
│   ├── 📄 vite.config.js # Configuración Vite
│   └── 📄 firestore.rules # Reglas Firestore
├── 📁 docs/             # Documentación
│   ├── 📄 README.md     # Este archivo
│   ├── 📄 SERVIDOR_LOCAL.md
│   └── 📄 *.md          # Otros documentos
├── 📁 server/           # Servidor Node.js adicional
├── 📄 *.html            # Páginas HTML del sitio
├── 📄 server.js         # Servidor WebSocket + HTTP principal
├── 📄 sw.js             # Service Worker
├── 📄 .htaccess         # Configuración Apache
├── 📄 robots.txt        # SEO robots
├── 📄 sitemap.xml       # Mapa del sitio
└── 📄 ads.txt           # Configuración AdSense
```

## 🧹 Limpieza Realizada

### Archivos Eliminados
- ✅ **Archivos vacíos**: `analytics-manager.js`, `ADSENSE-OPTIMIZATION-REPORT.md`, `guia-principiantes.html`
- ✅ **Archivos de backup**: `crack-rapido-backup.js`
- ✅ **Scripts de desarrollo**: `*.bat`, `*.py` (servidores de desarrollo)
- ✅ **Duplicados**: `.htaccess_production`
- ✅ **Entorno virtual**: `.venv/` (no debe estar en el repositorio)

### Reorganización
- ✅ **CSS**: Movido de `css/` a `assets/css/`
- ✅ **JavaScript**: Movido de `js/` a `assets/js/`
- ✅ **Imágenes**: Consolidado `images/` e `img/` en `assets/images/`
- ✅ **Datos JSON**: Movido de `data/` a `assets/data/`
- ✅ **Configuración**: Movido a `config/`
- ✅ **Documentación**: Movido a `docs/`

### Referencias Actualizadas
- ✅ **Todos los archivos HTML** actualizados con las nuevas rutas
- ✅ **server.js** actualizado para usar `assets/data/`
- ✅ **Rutas de CSS, JS, imágenes y datos** corregidas

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

✅ **Estructura reorganizada**  
✅ **Archivos de configuración organizados**  
✅ **Servidor HTTP configurado**  
✅ **Dependencies resueltas**  
✅ **WebSocket funcionando**  
✅ **Archivos estáticos servidos**  
✅ **Referencias actualizadas**  

## 📝 Pasos para Deploy en Render

1. **Conectar repositorio** a Render
2. **Seleccionar** "Web Service"
3. **Configuración automática** desde `config/render.yaml`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Deploy** automático

## 🐛 Solución de Errores Comunes

### Error: "package.json not found"
- ✅ **Solucionado**: `package.json` movido a `config/package.json`

### Error: "Build failed"
- ✅ **Solucionado**: Dependencies correctas en package.json

### Error: "Cannot serve static files"
- ✅ **Solucionado**: Servidor HTTP configurado para archivos estáticos

### Error: "CSS/JS not loading"
- ✅ **Solucionado**: Todas las referencias actualizadas a `assets/`

## 📞 Soporte

Para problemas de deployment o configuración, verificar:

1. **Logs de Render** para errores específicos
2. **Console del navegador** para errores frontend
3. **Network tab** para problemas de recursos
4. **WebSocket connection** en Developer Tools

---

**Desarrollado con ❤️ para los fanáticos del fútbol** ⚽

## 📋 Checklist de Mantenimiento

### Estructura de Archivos
- [ ] Verificar que no hay archivos duplicados
- [ ] Confirmar que todas las rutas están actualizadas
- [ ] Revisar que no hay archivos de desarrollo en producción

### Performance
- [ ] Verificar tiempos de carga
- [ ] Comprobar que el cache funciona correctamente
- [ ] Revisar métricas de Core Web Vitals

### SEO
- [ ] Verificar que todas las páginas tienen meta tags
- [ ] Comprobar sitemap.xml actualizado
- [ ] Revisar robots.txt

### Funcionalidad
- [ ] Probar todos los juegos
- [ ] Verificar WebSocket connections
- [ ] Comprobar sistema de rankings