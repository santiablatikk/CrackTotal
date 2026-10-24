# Crack Total 3.5 — bitácora verificable (19/10/2026)

## Alcance

Esta iteración continúa **exclusivamente** la rama `redesign/crack-total-2`, PR #1, sin fusionar con `main` ni modificar producción, el backend productivo, Firebase o `reports/`. Mantiene los cinco juegos existentes y no vuelve a presentar Mi Carrera.

## Mejoras implementadas

1. **Configuración de Arena en vista previa:** la página `/pasala-1v1` muestra una conexión asistida cuando aún no se configuró el WebSocket de staging; acepta la URL HTTPS del servicio independiente y la convierte en su conexión WSS. Rechaza URL de producción e inseguros y conserva el servidor al salir de la sala.
2. **Inicio «HOY SE JUEGA»:** composición editorial con el Top 10 diario real —título, contexto y fuente del banco verificado—, estado local del desafío y acceso a Wordle/Pasala individual. No inventa resultados, audiencia ni jugadores.
3. **Catálogo «ENTRÁ EN CALOR»:** acceso diario contextual, coherente con el desafío real y con la búsqueda/filtros del catálogo.
4. **Wordle:** bloqueo efectivo de nuevas respuestas después de completar el desafío del día también desde teclado físico; excepciones para elementos interactivos enfocados; etiquetas accesibles de letras y estados; progreso local conservado.
5. **Top 10:** fecha del desafío fijada al iniciar la ronda: cruzar medianoche UTC ya no guarda el resultado en el día incorrecto.
6. **Regresiones:** suite `scripts/ct35_experience_smoke.js` integrada en `npm test`; ahora se ejecutan cinco suites, incluyendo las comprobaciones de protocolo WebSocket preexistentes.

## Pruebas y resultados

- En el HEAD de la iteración, Netlify notificó **SUCCESS** para el build del Deploy Preview (configurado para ejecutar validación, `npm test` y build). El despliegue debe volver a verificarse después de cada commit final.
- Navegador desktop, deploy preview: portada y bloque diario visibles; título y fuente del Top 10 extraídos del banco real; búsqueda por «wordle» filtró el catálogo a un juego; la Arena bloqueó una URL de producción; Wordle aceptó la entrada por teclado, persistió una letra al recargar y expuso su nombre a tecnologías asistivas.
- Las cinco suites se comprueban como parte del proceso de Netlify. **Sí** se conectaron dos pestañas cliente y una pestaña espectador al backend WebSocket público Render; el recorrido completo de 26 letras, la reconexión real entre redes y la revancha completada siguen pendientes.
- **Mobile visual:** todavía no se verificaron capturas de 360, 390, 430 y 768 px; existen reglas responsive pero eso no sustituye la inspección visual.
- **Firebase:** la consola del navegador mostró errores de autenticación anónima durante la prueba de Wordle; la persistencia local se comprobó, la escritura remota no. No atribuir estos errores a esta iteración sin investigación adicional.

## Contenido futbolero

Se reutilizó únicamente el conjunto Top 10 ya auditado/verificado por fuentes UEFA en iteraciones anteriores. La home y el catálogo lo consultan sin replicar ni revelar las soluciones. **Preguntas nuevas en esta iteración: 0. Preguntas auditadas individualmente en esta iteración: 0.** Siguen vigentes los registros previos de `docs/football-facts-2026-10-19.json`; esta iteración no afirma una nueva auditoría.

## Staging público activado y probado (19/10/2026)

- Blueprint nuevo: `cracktotal-arena-staging-blueprint`, ID `exs-dbb6h9jncjis73dl07r0`, rama `redesign/crack-total-2`, ruta `deploy/staging.render.yaml`.
- Servicio nuevo: **`cracktotal-arena-staging`**, ID `srv-dbb6hj2gjjms73d73fd0`, runtime Node, **plan Free**, sin despliegue automático y separado de los dos servicios preexistentes `CrackTotal` (estático) y `cracktotal-servidor` (Node). Ninguno fue editado.
- Host de pruebas: https://cracktotal-arena-staging.onrender.com
- Endpoint de salud público **verificado en navegador**: https://cracktotal-arena-staging.onrender.com/__ct_staging/health devolvió `{"ok":true,"service":"cracktotal-arena-staging","websocket":true}`.
- Build del servicio: `npm ci && npm test`, **SUCCESS**; los logs reportaron cinco suites correctas: smoke duelo, contenido verificado, UI Arena, experiencia 3.5, WebSocket integración con dos clientes y espectador de loopback.
- URL navegable para probar online: https://deploy-preview-1--zingy-haupia-53b742.netlify.app/pasala-1v1 ; este hostname exacto ahora usa automáticamente `wss://cracktotal-arena-staging.onrender.com`. Otras vistas previas Netlify y producción no reciben esa conexión automática. Se puede forzar un servidor con el parámetro `?server=`.
- Prueba manual pública realizada desde **dos pestañas de navegador y una pestaña OBS** contra ese host: crear sala privada, entrar por código, ambos listos, inicio sincronizado y misma primera pregunta, acierto `Aston Villa` validado, pase del rival, marcador 1–0 replicado, espectador observa nombres/marcador/reloj sin formularios ni soluciones, abandono del rival, victoria por ausencia y estadísticas finales, petición de revancha. El rival que abandonó no pudo reingresar a esa sala finalizada; una **revancha completa con ambos presentes no se verificó**.
- Las pestañas fueron del mismo navegador cloud; **no** se probó aún con dos personas desde redes/dispositivos independientes. Tampoco se probó corte y reconexión manual en hosting.
- El plan gratuito puede suspender el servicio por inactividad; al volver a jugar podría tardar en despertar.
- `npm ci` en Render informó **15 avisos de vulnerabilidad: 10 moderados, 3 altos, 2 críticos** en el árbol de dependencias existente. No se aplicó `npm audit fix` automático: se requiere auditar cadenas y compatibilidad antes de introducir cambios. No tratar este staging como apto para tráfico masivo o datos sensibles.

No se fusionó el PR ni se cambió el dominio/servidor productivo.

## Próximas prioridades

1. Extender QA E2E público a dos dispositivos y redes independientes, desconexión/reconexión y revancha completa.
2. Auditar vulnerabilidades de dependencias y diagnosticar el error de autenticación Firebase sin tocar producción.
3. Realizar QA visual móvil y recorridos completos de los cinco juegos.
4. Continuar la auditoría y expansión de datos futboleros oficiales, con fuente y fecha para cada dato.
