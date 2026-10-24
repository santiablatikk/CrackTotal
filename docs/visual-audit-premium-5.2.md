# Crack Total 5.2 — Premium Game Experience / Auditoría y ejecución

**Fecha:** 21 de octubre de 2026. **Rama:** `redesign/crack-total-2` · **PR:** [#1](https://github.com/santiablatikk/CrackTotal/pull/1).

## Dirección creativa ejecutada

Objetivo: unificar los seis juegos bajo **Football Intelligence Arena** sin convertirlos en seis variantes idénticas de una tarjeta. Base: carbón `#101b1b`, bosque `#243b35`, crema `#f4f2e9`, lima `#b5eb53`, cobre `#d89b70`; Manrope para UI y Space Grotesk para puntuaciones y titulares.

### Rediseños realizados, no solo recomendaciones

| Experiencia | Resultado en el código |
|---|---|
| Quién Sabe Más | `ct-quiz-stage`: escena responsive de dos zonas, **pregunta editorial sobre crema** y **respuestas competitivas sobre verde bosque**. El marcador, los eventos y los IDs de pregunta no se modificaron. |
| Mentiroso | `ct-bluff-stage`: consigna protagonista, apuesta e interacción separadas; jerarquía del texto, botones de apostar / declarar Mentiroso y espacio para listas de 20+ nombres. El contador, temporizador y datos de servidor permanecen intactos. |
| Wordle Futbolero | Encabezado con etiqueta editorial y `ct-wordle-ledger`, una composición nueva para la racha y la cuenta regresiva diaria. Se conservaron los IDs del motor y el tamaño dinámico de casillas por longitud. |
| Top 10 | Cabecera de torneo convertida de fila a retícula editorial; subtítulo junto al titular en escritorio y bloques apilados en móvil. Clasificación e inputs conservan su mecánica. |
| Pasala Che individual | Etiqueta editorial de rosco y migración **dentro del CSS existente** de brillos violetas, cyan y naranja a bosque/lima/cobre, preservando coordenadas de las letras. |
| Pasala Che 1v1 | Se conserva la Arena de dos modalidades y el diseño responsive trabajado previamente; sigue compartiendo pautas tipográficas y cromáticas. |

Los componentes transversales `ct-game-eyebrow`, `ct-game-index` y foco visible están en `assets/css/game-shell.css`. No se agregaron frameworks ni dependencias; se mantuvieron los CSS propios existentes. Se actualizaron las versiones en URL de las hojas CSS.

## QA técnico realizado durante la implementación

- Se comprobó con fuentes reales descargadas de GitHub el balance de llaves de siete hojas CSS y la **correspondencia de etiquetas** de los seis archivos HTML, incluidos los nuevos contenedores. Se corrigió una etiqueta de cierre detectada por esa auditoría.
- Se amplió `scripts/games_visual_52_smoke.js` (ya incluido en `npm test`) con test de anidamiento HTML, estructura de QSM/Mentiroso y sus media queries, cabecera de Top 10, Wordle ledger y etiquetas de identidad.
- La ejecución aislada de ese test con fuentes GitHub en V8 dio PASS. Esta comprobación no equivale a renderizar la página en un navegador.
- Contraste calculado en combinaciones base: crema/carbón **15,67:1**, lima/carbón **12,53:1**, cobre/carbón **7,40:1** y texto de opción crema/bosque **7,65:1**. La nota auxiliar de Mentiroso se oscureció al detectar una variante anterior por debajo de 4,5:1. Estas mediciones no certifican todos los estados WCAG de todas las páginas.

## Infraestructura verificada

La app Render está conectada. El servicio **existente** `cracktotal-arena-staging` (ID `srv-dbb6hj2gjjms73d73fd0`, región Frankfurt, rama `redesign/crack-total-2`, `npm ci && npm test`, `npm start`) tiene auto-deploy **desactivado**, por eso los commits nuevos requieren despliegue manual. Se confirmó que el 21 de octubre recibió exitosamente el commit anterior `d53c51659de4e815c657113f87ac85e5c3429cc2`; sus logs aprobaron QSM 36 preguntas, Mentiroso seis rondas y Pasala Che 1v1. Esta evidencia no debe atribuirse automáticamente a commits posteriores.

La producción es una **Static Site distinta**, servicio `srv-d06n6p2li9vc73ei37m0`, rama `main`. El backend histórico `cracktotal-servidor` es otro servicio y otro repositorio. **Ambos deben quedar intactos** hasta una migración comprobada.

## Pendientes que impiden anunciar un release totalmente terminado

1. Esperar `npm test` y desplegar el último HEAD a staging Render (que no tiene auto-deploy); comprobar estado `live`, logs y SHA.
2. Ejecutar **capturas y comparación real** de interfaz en navegador para 320, 360, 390, 430, 768, 1024, 1366, 1440 y 1920 px. No se dispone de browser automation activo en esta ejecución; las pruebas CSS/HTML no sustituyen screenshots ni pruebas de overflow.
3. Probar sesiones simultáneas reales contra **el endpoint externo** de Render y verificar reconexión, relojes y revancha. Un test de servidor WebSocket local no certifica el transporte externo.
4. Consolidar técnicamente las secciones heredadas de `pasalache.css` y `mentiroso.css` (siguen siendo archivos grandes) solamente después de tener snapshots visuales para evitar regresiones.
5. Completar auditoría factual individual de bancos restantes y ampliar Mentiroso desde las seis consignas piloto a un banco de mayor profundidad, siempre verificadas.
6. Fusionar PR #1 a `main` **únicamente** tras validar QA visual, multijugador externo, contenido y estrategia de rollback.

**Categorías de estado:** cambios CSS/HTML **implementados**; pruebas V8 **ejecutadas**; verificación visual pixel-perfect **pendiente**; Render de último HEAD **pendiente de verificación**.
