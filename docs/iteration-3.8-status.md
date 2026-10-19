# Crack Total 3.8 — Estado verificado (19-10-2026)

## Alcance implementado

- **Rosco por Turnos**: dos roscos diferentes; cada pase o respuesta incorrecta inicia una transferencia de **2.000 ms** gobernada por el servidor. Ninguno de los dos relojes corre durante ese intervalo; los controles quedan bloqueados. Reconexión y difusión del estado mantienen `turnReadyAt`.
- **Respuesta provisional**: el servidor retiene el envío **6.000 ms**, permite **una sola edición opcional** y permite confirmar anticipadamente. No revela corrección, similitud ni solución mientras está pendiente. El reloj del jugador continúa; la expiración del reloj resuelve la respuesta pendiente sin regalar tiempo. Duplicados y mensajes fuera de plazo se rechazan. La normalización conserva la lista explícita de variantes del banco.
- **Lobby**: código de sala grande, copia, compartir invitación o enlace de espectador, participantes con conexión/preparación, modo y duración `MM:SS`, mensajes de conexión.
- **Partida**: rosco activo ampliado y rival reducido, marcador de ambos, estado de transferencia, pregunta protagonista y controles grandes. En espera, los dos roscos conservan una composición equilibrada. Adaptación móvil y `prefers-reduced-motion`.
- **Resultados**: aciertos, errores, pendientes, tiempos y motivo oficial; se diferencia abandono voluntario de expiración del plazo de reconexión.
- **Espectadores**: progreso y relojes sin pregunta secreta ni controles para responder. Se mantiene Rosco Espejo.

## Pruebas automatizadas

Ejecutadas por el pipeline de **Render staging**, `npm ci && npm test` y build, commit `9e68386`:

- `scripts/pasala_duel_smoke.js`: creación de sala, confirmaciones, servidor de relojes, transferencia exacta 2s, respuesta provisional 6s, única edición, duplicados, rechazo de respuesta tardía, reconexión, abandono, desconexión tras 45s y empate.
- `scripts/pasala_duel_ws_integration.js`: WebSocket loopback real, dos clientes y espectador, confidencialidad, estado, rematch, Rosco Espejo, turnos alternos y relojes.
- `scripts/arena_ui_smoke.js`: 74 enlaces de DOM y versiones de activos.
- Otros tests `npm test`: banco de preguntas (comprobación estructural), experiencia 3.5 y rutas compartidas.

**Resultado: PASS** para los tests y **Build successful** (Render staging, 19-10-2026 22:58 GMT+2).\n\n**Registro del build:** ver [despliegues de Render staging](https://dashboard.render.com/web/srv-dbb6hj2gjjms73d73fd0/deploys). Guardar resultados exactos en el estado visible del despliegue; no inferirlos de un preview estático.

## Partida online manual (navegador + staging independiente)

- Anfitrión `Santi QA`, invitado `Jugador`, espectador; sala `C97995201A`.
- Los dos entraron mediante enlace y confirmaron; comenzó partida real con WebSocket del staging `cracktotal-arena-staging.onrender.com`.
- El anfitrión envió `Aston Vilo` para la pregunta sobre Dibu Martínez. El servidor mostró respuesta provisional sin dar veredicto, transcurrieron los 6s y se registró **error** porque la edición se intentó fuera de plazo. Se transfirió el turno al invitado.
- El invitado envió `Arne Slott`, utilizó **una edición** para cambiarla a `Arne Slot`; se registró acierto y pasó de A a B sin perder el turno.
- El invitado pulsó **Pasala Che**; el anfitrión recibió su pregunta B distinta. Este respondió `Bellingham` y pulsó confirmar anticipadamente: acierto y avance a C.
- El invitado abandonó: el anfitrión y el espectador vieron fin de partida; resultado asignado por el servidor. Las estadísticas finales se conservaron.
- El espectador no mostró campo de respuesta ni preguntas privadas. La consola del navegador solo registró errores de la extensión de navegador de pruebas (`chrome-extension://`), no errores de JavaScript de la web.
- Captura revisada visualmente en escritorio: rosco activo grande, rival reducido, pregunta y controles en pantalla.

La duración exacta del intervalo de transferencia y el rechazo de ediciones tardías están **verificados por reloj falso y tests de protocolo**; la comprobación manual corrobora la alternancia, pero no mide milisegundos. La prueba manual no agotó reconexión/desconexión prolongada; están cubiertas por test automatizado.

## Contenido, compatibilidad y pendientes

- **Preguntas nuevas:** 0. **Preguntas sometidas a verificación factual individual en 3.8:** 0. La prueba de banco revisa estructura, no certifica todas las afirmaciones deportivas.
- **Juegos modificados:** Pasala Che 1v1; los otros cuatro juegos y el modo individual se preservaron sin cambios en esta iteración.
- **No se modificó** `reports/`, `main`, el dominio `cracktotal.com`, ni el servidor de producción.
- **Pendiente:** QA manual en anchos 360, 390, 430, 768 y 1920; auditoría factual completa; tests de carga para audiencia grande; revisión de dependencias (15 avisos de auditoría npm en el último build: 10 moderados, 3 altos, 2 críticos, y advertencia deprecada de `url.parse()`); revisión funcional exhaustiva del resto de juegos.
- **Próxima prioridad:** test visual móvil completo, mejorar accesibilidad de la partida y verificar gradualmente las preguntas por nivel y fuente.
