# Crack Total 4.1 — Premium Visual Overhaul

Fecha de implementación: 20 de octubre de 2026. Rama: `redesign/crack-total-2`. PR #1.

## Qué cambió respecto de 4.0

Esta iteración recupera personalidad y dirección artística **sin volver a agregar secciones ni un nuevo archivo CSS**. Se mantienen cinco módulos de portada, reorganizados como: **hero → Arena 1v1 → cinco juegos → desafíos diarios → accesos de perfil/logros**.

### Hero
- Nueva composición editorial de gran escala: título tipográfico en tres líneas, márgenes escalonados, fotografía existente a la derecha, tratamiento de luz en capas, marca de agua deportiva y rail inferior con accesos reales.
- Se mantienen fotografía y archivo existente `assets/images/portada.jpg`, precarga y prioridad de descarga; no se añadieron recursos visuales remotos.
- Secuencia de entrada CSS corta para imagen, titular y CTA; acceso a juegos y al duelo real.
- Adaptación específica móvil con recorte fotográfico, tamaños y distribución de CTA diferentes.

### Arena 1v1
- Presentación tipo transmisión/esports con dos roscos de **26 letras A–Z cada uno**, distribuidas en anillo; no los antiguos ocho círculos de prueba.
- Un pie claramente indica **«VISTA ILUSTRATIVA · NO ES UNA PARTIDA EN VIVO»**: no se inventan jugadores, puntos, salas o espectadores.
- Información breve de las dos modalidades (turnos y Espejo) y enlace directo a la Arena.
- Sin cambios en servidor, preguntas, reloj, corrección 3.9, sesiones o protocolo WebSocket.

### Juegos
- Grid editorial asimétrico 12 columnas: primer juego con fotografía; Top 10 con gráfica de clasificaciones sin datos ficticios; Wordle con casillas abstractas sin spoilers; Quién Sabe Más con tratamiento fotográfico de versus; Mentiroso con composición tipográfica propia.
- Cinco enlaces conservados y cinco tarjetas con tratamiento distinto. Las imágenes reutilizadas ya existen en el repositorio (`assets/images/blog/worldcup.jpg` y `assets/images/blog/championss.jpg`).
- No se alteraron las reglas ni contenido de los juegos.

### Desafíos, navegación y footer
- Se mantienen IDs y scripts de progreso real de Top 10/Wordle; diseños editoriales con contrastes distintos y sin duplicarlos en otra sección.
- En el encabezado, **«Buscar» ahora enlaza a `games.html#juegos`**: antes activaba un atajo a un buscador que ya no existe en la portada.
- Footer con cierre editorial tipográfico de marca y accesos funcionales y legales preservados.
- La quinta sección de perfil/rankings/logros dejó de ser un grupo de tarjetas heredadas y pasó a una franja editorial de progreso con tres accesos claros.

### CSS/arquitectura
- Se **reemplazó** `assets/css/home-4.css` en el mismo path (sin crear `home-5.css` ni sumar librerías). Namespace `ct4-*` acotado a la portada.
- Responsive explícito para anchos de 1100, 760, 500 y 360 px; foco visible y respeto de `prefers-reduced-motion`.
- Estilos heredados compartidos en `home.css` y el design system permanecen por compatibilidad de otros archivos. **La consolidación profunda de hojas heredadas aún no fue realizada.**

## Verificación

- **Netlify Deploy Preview:** estado GitHub `netlify/zingy-haupia-53b742/deploy-preview = success` en commit `9e37dcc` (primera versión 4.1). La revisión visual final y el estado del último commit se verifican aparte.
- `netlify.toml` especifica `node validate-deploy.js && npm test && node scripts/build-netlify-preview.cjs` para deploy-preview: por tanto el SUCCESS acredita ese pipeline del commit verificado.
- `scripts/home_4_smoke.js` ahora verifica 5 tarjetas/5 secciones, enlaces esenciales, IDs diarios, estilo responsive, ausencia de marcadores inventados y **52 letras de la ilustración**. `scripts/ct35_experience_smoke.js` preserva los contratos de desafío del día y almacenamiento real.
- Inspección estática de la rama: 5 secciones, 5 juegos, 52 letras, IDs HTML sin duplicados, enlaces a todas las rutas principales; no se observan referencias a Mi Carrera desde portada.
- **No hubo QA visual manual con capturas**: el entorno no ofreció una navegación de navegador compatible (el intento público devolvió «Cache miss»). No afirmar que los 360/390/430/768/1366/1920 px se inspeccionaron visualmente ni atribuir métricas Lighthouse.
- No se probaron partidas desde móviles ni se midieron nuevos tiempos de carga. El backend staging no cambió.

## Archivos editados en 4.1

- `index.html` — composición, marcado, rutas y SEO de portada.
- `assets/css/home-4.css` — sustitución completa del diseño de la portada.
- `scripts/home_4_smoke.js` — pruebas de estructura y versionado CSS.
- `scripts/ct35_experience_smoke.js` — actualización de cobertura de los breakpoints.

No hubo eliminación física de archivos, manipulación de datos, cambios de dependencias ni cambio en producción. `main` y `reports/` permanecen intactos.

## Pendientes concretos

1. QA visual manual y corrección de proporciones en 360, 390, 430, 768, 1366 y 1920 px; comparación de capturas antes/después.
2. Medición Lighthouse de LCP/CLS/INP; optimización de peso de fotografías cuando se obtengan archivos e información de licencia.
3. Consolidación segura del CSS heredado tras verificar su uso en `games.html` y páginas secundarias. No borrar archivos sin rastrear dependencias dinámicas.
4. Auditoría de vulnerabilidades de las dependencias existentes.
5. Auditoría individual del contenido futbolero heredado.
