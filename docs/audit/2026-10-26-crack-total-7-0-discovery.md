# Crack Total 7.0 — Auditoría de integración (26/10/2026)

> Documento de hallazgos verificables. **No equivale a una certificación de producción.**

## Repositorios y release realmente activos

| Componente | Repositorio y referencia | SHA / despliegue observado |
| --- | --- | --- |
| Frontend público | `santiablatikk/CrackTotal`, `main` | `fab1568957eb72570f716a40e7207145374f71fc`; Render `dep-dbeah3ek1f9s73f3t02g`, estado live |
| Backend histórico | `santiablatikk/cracktotal-servidor`, `main` | `15aa29b989d4f0e002da04092c87401a91fb2c07`; Render `dep-d0vltiodl3ps73frf7m0`, estado live |
| Staging de juegos | `cracktotal-arena-staging` | Render `dep-dbeg842vcj2c73crvhcg`, `aa9e29dcddf54c9cd33f8c660045c17ce7fd8c8d`, live |
| Base 7.2 | `feature/crack-total-7-2-content-missions` | `0da10237a7c14c795f4a294439fa230b4f680975`, no producción |

Verificado mediante metadatos de GitHub y listado de despliegues de Render el 26/10/2026. No se ha ejecutado un test E2E de Firestore contra un backend publicador real durante esta auditoría.

## Topología de ramas: no hacer un merge ciego

- Frontend PR #2 (6.1) está en borrador y diverge de `main`: 34 commits adelante, uno detrás a 26/10.
- Frontend PR #4 (6.2) también es borrador; parte de `main` y agrega rankings con escucha Firestore y pruebas.
- PR #5 (7.0) y PR #7 (6.3) nacen de 6.2 e implementan ideas similares de juegos editoriales por caminos diferentes. Debe seleccionarse una implementación canónica antes de consolidar.
- PR #6 (7.1) se apila sobre el PR #5; incluye Conexiones Futboleras y PWA local.
- 7.2 agrega una ampliación del banco de trayectorias sobre 7.1; la PR #8 (7.3) se apila sobre 7.2.
- El frontend PR #3, hotfix de rellenos de letras de Pasala Che, **sí** fue fusionado a `main` y corresponde al release público vigente.
- Backend PR #1 (6.1) y #2 (6.2) permanecen borradores; #2 se apila sobre #1, **no** sobre `main`.

**Decisión de arquitectura:** mantener 6.1/6.2 y 7.x como trabajo de desarrollo. Integrar por feature y con tests de regresión; preservar el hotfix de Pasala Che y los datos históricos de Wordle.

## Ranking en tiempo real: lectura implementada, publicación confiable bloqueada

Hallazgos sobre `feature/crack-total-6-2-realtime-integrity`:

1. `assets/js/services/progress/ranking-service.js` escucha `leaderboard_scopes/{scope}/entries`, filtra registros con `verified===true`, `verifiedBy==='server'` y `schemaVersion===1`, y soporta suscripción realtime.
2. `firestore.rules` en la rama plantea `allow write: if false` para la colección competitiva y lectura selectiva. **No consta aquí prueba de despliegue de esas reglas a Firebase**.
3. No se encontró en la revisión un publicador productivo confiable de resultados con credenciales server-side y escrituras atómicas. Un campo `verified` en cliente no constituye garantía de legitimidad.
4. `/matches` y `/user_stats` mantienen reglas legadas para escrituras de usuarios autenticados; **no deben promoverse directamente** a un leaderboard competitivo.
5. La consulta ordena por `score` y limita resultados antes del filtro de validación y los desempates en cliente. Puede descartar posiciones válidas si los datos recuperados no cumplen el contrato o hay empates en el corte. Diseñar clasificación/índices y migración con pruebas de Firestore antes de activar competición.

**Gate innegociable:** partida terminada con dos clientes externos; resultado computado por servidor; persistencia única e inmutable/auditable; actualización atómica de estadísticas; lectura Firestore desde otra sesión; intento de manipulación y de duplicación rechazados. Sin este gate, mostrar ranking vacío o no disponible, jamás simulado.

## Identidad visual y juegos 7.3

- ¿Quién soy? y Adiviná la carrera ya comparten motor local de rondas, recuperación de sesión y registro de XP **local exclusivamente**.
- Se incorporan metadatos de autor y CC BY-SA 3.0 para retratos reales de Messi, Cristiano Ronaldo, Ronaldo Nazário, Ronaldinho, Maradona y Zidane desde Wikimedia Commons. Son imágenes históricas verificables; no fotografías generadas ni supuestamente oficiales de la temporada vigente.
- Las seis imágenes aparecen **solo en resultados** y se limpian al comenzar cada nueva ronda; nunca se muestran durante la adivinanza.
- Trayectorias: marcadores tipográficos de clubes de aspecto coherente. No identificarlos como **escudos oficiales**. Una biblioteca posterior deberá validar marca, versión histórica, licencia y autorización de cada escudo.
- Comportamiento de error: ocultar fotografía fallida y conservar nombre/resultado textual.
- Pruebas en `scripts/ct73_media_smoke.cjs` y CI `.github/workflows/ct73-authentic-media.yml`.

## Deuda técnica y riesgo confirmado

- La instalación `npm ci` de frontend en CI del 26/10 informó **15 alertas de dependencias** (10 moderadas, 3 altas, 2 críticas). No implica por sí sola explotación ni exposición en producción; hay que ejecutar `npm audit --json`, discriminar dependencia utilizada en runtime frente a tooling, actualizar gradualmente y repetir regresiones.
- El árbol de Git del backend incluye `node_modules` versionados, lo que complica revisión y mantenimiento. Antes de limpiar, validar instalación reproducible desde `package-lock.json` y el comportamiento del despliegue Render.
- Versiones y CSS de los juegos deben comprobarse en móvil y contra el SHA desplegado, no solo mediante capturas de portada.

## Próximos cambios con criterio de aceptación

1. CI 7.3 verde: pruebas unitarias, suite completa y Chromium 320/390/768/1366; inspección de capturas y recursos externos reales.
2. Reconciliar la rama 6.1 con la 6.2, incluyendo hotfixes de `main`, conservar bancos ya verificados y evitar recrear juegos duplicados.
3. Diseñar el publicador de resultados en el backend confiable, seguridad de Firestore, índices y tests de doble escritura.
4. E2E remoto de QSM, Mentiroso y Pasala Che 1v1 con dos jugadores, reconexión y antitrampas.
5. Solo tras esas pruebas, staging con SHA exacto, checklist de regresión y procedimiento de rollback.
6. Auditar licencias y recursos de escudos antes de incorporarlos a los juegos públicos.

**Producción deliberadamente sin cambios en este trabajo.**
