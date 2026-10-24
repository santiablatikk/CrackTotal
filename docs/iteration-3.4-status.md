# Crack Total 3.4 — implementación y verificación (19-10-2026)

Rama: `redesign/crack-total-2`. Pull Request: https://github.com/santiablatikk/CrackTotal/pull/1

Preview: https://deploy-preview-1--zingy-haupia-53b742.netlify.app
Arena: https://deploy-preview-1--zingy-haupia-53b742.netlify.app/pasala-1v1

## Cambios implementados en esta iteración

1. **Revanchas con roscos renovados.** `server/pasala-duel.js` evita seleccionar, para una revancha, la misma pregunta que se usó previamente en cada letra cuando existe otra válida. Si solo existe una pregunta, hay compatibilidad y fallback. La misma nueva selección se comparte entre ambos rivales.
2. **Resultados auditables controlados por el servidor.** El resultado distingue victoria por aciertos, por menor cantidad de errores, por velocidad, por abandono o empate, y declara el criterio en `pasala:result.reason`. En abandono anticipado, el tiempo del jugador no finalizado corresponde al transcurrido real, no al total de la ronda.
3. **Pantalla de resultados de la Arena.** Motivo legible del resultado, nombres, aciertos, errores, letras pendientes y tiempo empleado por jugador. Los espectadores pueden verla, pero no solicitar revancha. Sin inyectar HTML de nombres; se utiliza `textContent`.
4. **Pruebas del motor y WebSocket.** `scripts/pasala_duel_smoke.js` verifica nuevos enunciados por letra tras revancha y criterio de desempate/abandono; `scripts/pasala_duel_ws_integration.js` valida la razón y el tiempo de abandono con WebSockets reales en loopback. `scripts/arena_ui_smoke.js` comprueba los nuevos elementos de UI.
5. **Corrección factual heredada.** Se eliminó la afirmación de que el estadio Santiago Bernabéu fue «reinaugurado en 2023», sin cambiar la solución. El registro `docs/pasala-legacy-audit-2026-10-19.json` documenta **3 preguntas heredadas revisadas** (1 corregida, 2 verificadas sin cambios), fechas y fuentes originales del Real Madrid, CONMEBOL y Bundesliga.

## Conteo editorial preciso

- **Preguntas antiguas auditadas ahora:** 3.
- **Preguntas antiguas corregidas ahora:** 1.
- **Preguntas nuevas agregadas ahora:** 0. Esta iteración priorizó la fiabilidad competitiva. Las **29 nuevas verificadas** previamente están registradas por separado en `docs/football-facts-2026-10-19.json`.
- **Auditoría pendiente:** quedan preguntas anteriores sin revisión individual. No asumir que el banco heredado entero está validado; consultar ambos registros.

## Evidencia de pruebas y límites

- Las suites automatizadas pertenecen al pipeline de Netlify (`npm test` en la configuración de deploy). Comprobar estado del último commit antes de dar por finalizada la entrega.
- Navegador, preview estático: la página Arena abrió correctamente en escritorio (viewport observado de 1363 px, documento de 1348 px; sin scroll horizontal). El único error de consola observado provino de una extensión de Chrome, no del sitio.
- **Staging público no publicado:** el backend WebSocket 1v1 se probó con dos clientes reales y un espectador en un servidor de loopback automatizado, **no** entre dispositivos o redes públicas. La cuenta del propietario debe crear un servicio Render independiente según `docs/pasala-duel-staging.md`. No conectar a producción.
- **Sin verificación manual de resultados en vivo:** la vista previa estática bloquea controles online, por lo que la pantalla final solo está cubierta por las comprobaciones automatizadas y análisis del código.
- **Pendiente:** QA móvil visual 360/390/430/768 px, test completo en staging externo, persistencia Firebase con sesión autenticada, preguntas heredadas restantes y protocolos online de Quién Sabe Más/Mentiroso.
- Sin cambios en `main`, `reports/`, dominio productivo, backend productivo ni formatos guardados.

## Próxima prioridad

**Crear y comprobar un servicio de staging independiente**, ejecutar un 1v1 desde dos dispositivos/redes con espectadores, pérdida/reconexión y revancha, y corregir cualquier defecto real observado antes de agregar nuevos formatos competitivos.
