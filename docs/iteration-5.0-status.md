# Crack Total 5.0 — Legibilidad, tipografía y estética unificada

Fecha: 20 de octubre de 2026. Rama: `redesign/crack-total-2`. PR #1. Producción `main` no modificada.

## Objetivo y alcance ejecutado

Esta entrega realiza una **primera fase transversal del rediseño 5.0**: los problemas de fuentes ultracondensadas, tamaños extremos, color inconsistente y lectura incómoda. No equivale todavía a la aprobación visual manual ni a una reconstrucción verificada de todos los flujos de cada juego.

Se modificaron **65 archivos** respecto al último commit de 4.3 (comparación GitHub `f3f91bc..4502f1a`), incluidos documentos HTML, design system, hojas por juego, pruebas y artículos. No se eliminaron juegos ni archivos en forma destructiva.

### Dirección visual nueva

**Familias**
- Manrope 400–800: texto principal, preguntas, respuestas, navegación, inputs y botones.
- Space Grotesk 500–700: títulos cortos, números relevantes y headings.
- Se eliminan fuentes activas Montserrat/Oswald/Barlow Condensed/DM Sans de los flujos principales y llamadas duplicadas a Google Fonts.
- La fuente se carga centralizadamente desde `assets/css/design-system/tokens.css`; la Arena independiente carga las mismas dos familias por su CSS.

**Tokens canónicos**
- Carbón `#101b1b`.
- Verde bosque `#243b35`.
- Crema `#f4f2e9`.
- Lima controlado `#b5eb53`.
- Cobre `#d89b70`.
- Texto secundario `#c7d2c8`.

Los tokens de marca y aliases se conservaron para compatibilidad con páginas y juegos antiguos. La paleta incluye superficies claras en los juegos que se benefician de esa lectura.

### Cambios por experiencia

- **Portada:** escala display mucho más moderada, interlineado natural, jerarquía de títulos sin condensación agresiva, párrafos y etiquetas de mayor tamaño; se conserva la fotografía, Arena y los cinco juegos.
- **Catálogo:** tipografía y contraste consolidados en los CSS compartidos, tarjetas y acciones sin fuentes conflictivas.
- **Top 10:** titulares menos desproporcionados, filas altas con equipos completos legibles, mejor lectura del reloj, títulos y labels en móvil; mantuvo las cuatro tablas verificadas, fechas UTC, alias y guardados.
- **Pasala Che individual:** en móvil se separó el rosco (se conserva círculo de letras con las posiciones originales) de la **tarjeta rectangular de pregunta a ancho completo** debajo. La pregunta, reloj, campo y controles ahora tienen espacio para leerse; sin tocar el motor.
- **Pasala Che 1v1:** reemplazo de Barlow Condensed/DM Sans por Space Grotesk/Manrope, reducción de títulos extremos, mejora de textos/preguntas/controles y marca. Cero cambios en protocolos, turnos, seguridad o WebSockets.
- **Wordle:** se conserva tablero y selección diaria; nueva tipografía, título reducido y teclado más legible sin modificar lógica o respuestas.
- **Quién Sabe Más y Mentiroso:** títulos, preguntas y decisiones tipográficamente más proporcionadas, paleta armonizada; motor y datos sin cambios.
- **Ranking, perfil, logros:** mayor tamaño de filas y tipografía, menor truncado de nombres, badges/controles legibles y superficies con contraste.
- **Blog y artículos:** ancho y ritmo de lectura, titulares, imágenes y texto de contenido, despliegue tipográfico en los 21 artículos existentes. Se corrigieron accesos antiguos a `/#historias` que ya no existe.
- **Legales, contacto y About:** nueva dirección tipográfica, eliminación de peticiones a fuentes retiradas.

### Integración técnica y caché

- `design-system/tokens.css` y `bridges.css` unifican las reglas semánticas de tipografía/foco. Se actualizaron los CSS legados `crack-total-2.css`, `gameplay-2.css`, `game-experience-2.css`, `home.css`, `discover.css` y estilos por juego **dentro de sus archivos existentes**.
- `design-system/index.css` y `base.css` importan la revisión 5.0 con cache busting, igual que los enlaces CSS de las páginas.
- No se añadieron dependencias JavaScript, servicios, nuevas rutas ni nuevas preguntas.
- Se eliminaron peticiones explícitas obsoletas a tipografías de las páginas HTML principales y de blog.
- Aún existe deuda CSS histórica (overrides y !important) que requiere un barrido de referencias y QA visual antes de una eliminación más grande. **No afirmar que está completamente consolidada**.

### Calidad y validación

- `scripts/visual_50_smoke.js` se integra en `npm test`; comprueba las 11 páginas nucleares, la Arena independiente, IDs, CSS, fuentes, paleta, cuatro pares de texto/fondo con contraste >=4.5:1, y la continuidad de hooks de los juegos.
- Se actualizaron `home_4_smoke.js` y `arena_ui_smoke.js` para reflejar el nuevo versionado CSS.
- El pipeline del deploy preview ejecuta `node validate-deploy.js && npm test && node scripts/build-netlify-preview.cjs`. El último estado debe verificarse tras cada push.
- **No es una auditoría WCAG completa**: solo se contrastaron cuatro combinaciones cromáticas. Quedan por comprobar focus, navegación por teclado, lectores de pantalla y contrastes de cada elemento.
- **No se completó QA visual de navegador** en 320/360/390/430/768/1024/1366/1920 px. En esta sesión la URL preview no fue accesible desde navegador/web (cache miss o DNS). Por lo tanto no hay capturas, Lighthouse, métricas de rendimiento ni partidas manuales nuevas verificadas.
- Las suites anteriores de gameplay y WebSocket permanecen integradas en `npm test`; el cambio 5.0 ha sido de presentación. No se tocaron datos de fútbol, guardados ni backend.

### Restricciones cumplidas

- No merge a `main`.
- No cambio en `cracktotal.com`.
- No cambio en `reports/`, backend producción o Firebase.
- No borrado destructivo de archivos.
- Mi Carrera no se reincorporó.

### Siguientes hitos

1. Revisión visual y corrección de resultados reales en escritorio y móvil, incluidas partidas a medio completar y resultado final.
2. Recorrido funcional de los cinco juegos, especialmente teclado móvil, Pasala Che con pregunta ahora fuera del rosco en celular y reanudación de guardados.
3. Limpieza segura de reglas legadas y CSS `!important` tras mapa exhaustivo de dependencias.
4. Auditoría de accesibilidad WCAG 2.2 AA y mediciones LCP/CLS/INP con navegador.
5. Refinar composición e imágenes allí donde las capturas reales identifiquen inconsistencias.

No considerar completado el rediseño 5.0 integral hasta cerrar esos hitos.
