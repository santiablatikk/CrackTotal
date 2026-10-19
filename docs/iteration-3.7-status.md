# Crack Total 3.7 — Estado de la iteración (19-10-2026)

## Alcance implementado

- **Pasala Che 1v1 por turnos**: dos roscos de 26 letras, con preguntas diferentes entre jugadores; un solo jugador activo.
- Acierto mantiene el turno; error o «Pasala Che» lo cede; reloj independiente y puntuación validados en el servidor.
- Resultados con empate cuando corresponda, abandono y reconexión, revancha con cambio de primer turno y nuevas preguntas.
- Conservado **Rosco Espejo** con selección explícita en el lobby. El protocolo previo mantiene modo espejo cuando se omite el campo de modo.
- Marcador doble, estado de turno, anillos de progreso y visualización para espectadores sin preguntas ni respuestas.
- Portada simplificada: eliminados los bloques redundantes `ct2-mode-strip`, `ct3-duel-feature` y `home-stats-band`. Se mantiene catálogo y acceso a juegos.
- Actualizados los tests del motor, los WebSockets y el DOM del lobby.

## Pruebas ejecutadas

**Automatizadas en Render staging, build del commit `16628b5` (19-10-2026):**

- `npm ci && npm test`: **PASS**. Incluye tests del motor, bancos, UI y WebSocket loopback.
- Motor nuevo: preguntas por jugador, pase/error, relojes separados, acciones inactivas rechazadas, empate.
- Integración WebSocket: dos jugadores, espectador, validación del servidor, abandono, reconexión, revancha y ambos modos.
- Netlify Deploy Preview, commit `16628b5`: **SUCCESS**.

**Manual desde la vista previa y el WebSocket real de staging (tres sesiones de navegador):**

1. Sala privada `166E1DA18D`, anfitrión «Santi QA», invitado «Jugador» y espectador.
2. Ambos listos; comenzó Rosco por Turnos después de la cuenta regresiva.
3. Primera pregunta del invitado, letra A, «Sigla de la Asociación del Fútbol Argentino»; respuesta AFA correcta, mantuvo turno.
4. Invitado pulsó «Pasala Che». El anfitrión recibió una **pregunta A distinta** (sobre el club de Emiliano Martínez). El reloj del invitado quedó detenido, y corrió el del anfitrión.
5. El anfitrión respondió incorrectamente: su letra A pasó a incorrecta y el turno volvió al invitado.
6. El espectador vio puntuaciones y estados; **no recibió un campo para responder ni vio en pantalla las preguntas de los jugadores**.
7. El invitado abandonó: el anfitrión vio «PARTIDO FINALIZADO», victoria por abandono, estadísticas definitivas y mensaje de rival desconectado.

Los tests automatizados también cubren escenarios que no se agotaron manualmente. No confundir la aprobación de tests con una auditoría exhaustiva de la experiencia bajo carga.

## Contenido futbolero

- El banco existente `assets/data/pasalache_2025.json` contiene **280 entradas** distribuidas en las 26 letras, con al menos dos entradas por letra, lo que permite la selección de dos preguntas distintas.
- **Preguntas nuevas incorporadas en esta iteración: 0.** Se analizó estructuralmente la disponibilidad de preguntas por letra, pero **no se verificaron individualmente las 280 afirmaciones contra fuentes oficiales**.
- El banco actual no clasifica cada pregunta con dificultad, fuentes y fecha. **Pendiente**: auditoría documental y metadatos de procedencia sin alterar el contrato consumido por los juegos.
- El emparejamiento garantiza diferencia de preguntas, **no equivalencia de dificultad factual**. No afirmar justicia perfecta de dificultad hasta incorporar metadatos.

## Restricciones y próximos pasos

- No se tocaron `reports/`, `main`, el dominio ni el backend de producción.
- El staging WebSocket independiente es `cracktotal-arena-staging.onrender.com`. La vista previa de Netlify depende de este servidor para duelos reales.
- **Pendiente**: pruebas visuales de todos los tamaños móviles, recorrido exhaustivo de los otros cuatro juegos, pruebas de carga para miles de espectadores, auditoría general de preguntas y revisión de dependencias (`npm ci` informó 15 avisos de seguridad).
- Siguiente prioridad: endurecimiento y validación completa del Rosco por Turnos, banco verificado con dificultad/alternativas, revisión integral del catálogo y de los cinco juegos.
