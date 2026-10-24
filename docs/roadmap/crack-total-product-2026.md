# CRACK TOTAL — Plan de producto y ejecución técnica
**Corte de planificación:** 24 de octubre de 2026 · **Responsable de producto:** proyecto Crack Total  
**Principio:** fútbol masculino, hechos contrastados, experiencia original y resultados honestos.

> Este archivo distingue lo que existe del trabajo pendiente. Una prueba local no demuestra un despliegue online. Un alias de Firestore `verifiedBy: "server"` escrito por el propio navegador NO constituye validación; los resultados competitivos deben proceder de partidas terminadas en servidor y escrituras por Admin SDK.

## Decisiones de producto
- **Promesa:** el fútbol se juega, el conocimiento se demuestra. El sitio debe sentirse como un medio deportivo y un videojuego bien hecho, no como una plantilla de trivia producida en serie.
- **Identidad visual:** carbón `#101b1b`, bosque `#243b35`, crema `#f4f2e9`, lima de alto contraste `#b5eb53` y cobre `#d89b70`; títulos contundentes, cuerpo legible, composición editorial, silencios, paneles tipo marcador, foco visible. Sin gradientes neón por defecto, sin emoji-decoración excesiva, sin stock de jugadores aleatorios.
- **Tecnología:** aprovechar los servicios y el design system existentes; no incorporar dependencias ni servicios pagos sin necesidad; no modificar ni borrar el histórico de usuario; respetar `main` y los dos Render producción.
- **Fuentes:** FIFA, UEFA, CONMEBOL, AFA y clubes para hechos de temporadas. Un dato sin URL y fecha de revisión no entra como pregunta nueva `verified_official`. Preguntas ambiguas se retiran de rotación, no se "arreglan" por intuición.
- **Alcance:** solo fútbol masculino por decisión editorial actual. Nada de Mi Carrera hasta que exista autorización de reintroducirlo.
- **Honestidad del estado:** nunca mostrar usuarios ficticios como rankings reales; XP y misiones del navegador no afectan la clasificación competitiva.

## Inventario de iniciativas

| # | Iniciativa | Estado | Definición de terminado |
|---|---|---|---|
| 01 | Pasala Che 1v1 online | **Staging: protocolo externo validado** | Dos navegadores reales completan partida, desempate, revancha y reconexión |
| 02 | Quién Sabe Más online | Pendiente de E2E externo | Dos clientes, todos los niveles, servidor como árbitro, abandono/reconexión |
| 03 | Mentiroso online | Pendiente de E2E externo | Más de 20 respuestas por ronda, todas las fases, fraude y revanchas |
| 04 | Clasificaciones reales inmediatas | Capa lectora 6.2 en borrador | Admin SDK publica resultados autenticados, idempotentes y auditables |
| 05 | Perfiles con cuenta | Parcial: alias, perfil y XP local existentes | Firebase Auth estable, consentimiento y migración sin perder registros |
| 06 | Sistema de puntuación unificado | Parcial en navegador | Política publicada y aplicable en backend, no valores enviados por cliente |
| 07 | Reconexión y antitrampas | Parcial 6.2 en staging | Pruebas de tokens, expiración, replays y paquetes adulterados |
| 08 | Auditoría factual exhaustiva | Pendiente; inventario 6.1 existe | Cada entrada activa: respuesta, alias, fecha y fuente verificada |
| 09 | Objetivo 5.000+ preguntas | Pendiente, meta por lotes | Publicar incrementos auditados y deduplicados; nunca inventar cifras |
| 10 | Actualización editorial semanal | Pendiente | Proceso de revisión con PR y CI, sin scraping que infrinja condiciones |
| 11 | Categorías históricas/actuales | Parcial | Filtros equilibrados por Mundial, clubes, copas, Argentina y selecciones |
| 12 | Memoria antirrepeticiones | Parcial Pasala 6.1 | Rotación por identidad de pregunta; pruebas de retorno/agotamiento |
| 13 | Dificultad adaptativa | Pendiente | Criterios por rendimiento sin hacer imposibles los desafíos |
| 14 | Mentiroso con cientos de consignas | Pendiente | Cada consigna objetiva tiene 20+ respuestas canónicas verificadas |
| 15 | Top 10 histórico expandido | 4 tablas objetivas rotando | Fuentes métricas oficiales y días históricos Wordle/Top10 congelados |
| 16 | ¿Quién soy? | **Implementado en 6.3, PR de desarrollo** | Cinco rondas reales, pistas, puntaje, estado local, fuente y responsive |
| 17 | Adiviná la carrera | **Implementado en 6.3, PR de desarrollo** | Clubes progresivos, 28 trayectorias jugables, validación de alias |
| 18 | Armá el 11 | Pendiente | Alineaciones comprobadas por partido, posiciones, cambios y desempates |
| 19 | Duelo Relámpago | Pendiente | Tiempo y respuestas validados por servidor, empate reproducible |
| 20 | Conexiones futboleras | Pendiente | Particiones de cuatro categorías sin solapamientos subjetivos |
| 21 | Ordená la historia | Pendiente | Cronología exacta por fecha y reglas claras ante empates |
| 22 | Ligas y divisiones | Pendiente | Ranking competitivo con MMR y antifraude; sin mezclar XP |
| 23 | Temporadas y clasificaciones | Pendiente | Rollover de semana/mes con snapshot, zona horaria y premios visuales |
| 24 | Logros y medallas | Parcial; dos logros nuevos 6.3 | Fuente de progreso consistente, sin doble registro |
| 25 | Misiones diarias/semanales | **Implementadas localmente en 6.3** | Seis objetivos comprobables en el historial del navegador y sin rewards falsos |
| 26 | Perfil competitivo público | Pendiente | Privacidad, nombre único, estadísticas server-signed y consentimiento |
| 27 | Desafiar a un amigo | Parcial con códigos Pasala | Link compartible estable, sin exponer secretos de sesión |
| 28 | Resultados y animaciones premium | En progreso | Estado reducido accesible, timing coherente, sin saltos visuales |
| 29 | PWA y juego instalable | Manifest y SW existentes | Auditoría de rutas, cache/versionado, instalaciones y manejo offline |
| 30 | Dashboard de jugador | Parcial perfil local | Panel personalizado, misiones, XP, resultados reales y retos |

## Fases y puertas de publicación

### Fase A — Estabilidad competitiva (bloqueante para publicar 6.2 en producción)
1. Hacer el E2E externo de QSM y Mentiroso con **dos navegadores**, no solo sockets.
2. Añadir un publicador servidor `results` con `matchId` único, participantes autenticados y resultados firmados por el motor; Firestore Admin escribe agregados mediante transacciones.
3. Establecer reglas de acceso Firestore efectivamente desplegadas. Nunca migrar `matches` locales o legacy a `verified` automáticamente.
4. Comparar `feature/crack-total-6-1-content-quality` y 6.2 sin sobrescribir el hotfix Pasala. Ejecutar todas las pruebas antes de fusionar.

### Fase B — Contenido y experiencias (6.3)
1. **16 → 32 jugadores documentados** en `assets/data/identidad-futbolera.json`; 28 recorridos aptos para modo carrera. Los clubes son **etapas seleccionadas ordenadas**, no promesas de trayectoria exhaustiva.
2. `identidad-futbolera.html` habilita dos modos: `?modo=pistas` y `?modo=carrera`; hasta cinco rondas, tres intentos, puntaje por cantidad de pistas, guardado/reanudación de partida.
3. Registrar partidas **solo en ProgressService local**, con `verifiedOnline:false`; integrarlo en perfil y logros, no en tabla online.
4. Mostrar seis misiones locales en perfil, calculadas sobre el histórico retenido, con periodo local diario/lunes-semana. Aclarar que las métricas pueden ser parciales para juegos que todavía no reportan al sistema.
5. CI: `npm test` + Chromium 320/390/768/1366, probar cinco rondas de cada modo y confirmar que no exista scroll horizontal ni controles fuera de pantalla.

### Fase C — Crecimiento editorial y juego social
Cada nuevo juego tendrá ficha UX, esquema de datos versionado, test de respuesta real, referencia documental, review responsive, estado offline honesto, soporte de teclado y `prefers-reduced-motion`. Priorizar por valor y dificultad: Armá el 11 → Conexiones → Ordená historia → Duelo Relámpago.

### Fase D — Escala, identidad de usuario y retención
Recién con puntuación y perfil competitivos autorizados habilitar ligas, temporadas, identidad compartida, logros de ranking, misiones con recompensa pública y notificaciones; antes serían simulaciones.

## Condiciones de release innegociables
- El contenido nuevo no puede contradecir una fuente primaria; no certificar masivamente registros históricos sin auditarlos.
- No cambiar índices de Wordle diario ni responder con datos de fútbol femenino mientras dure el alcance actual.
- No introducir anuncios, redes, datos en vivo ni servicios pagos no requeridos.
- No habilitar amistosos clasificados desde JS-only: cualquiera puede modificar localStorage.
- No fusionar una PR con CI roja ni sin inspección de mobile 320/390, desktop 1366, accesibilidad y funcionalidades.
- Cualquier cambio de `main` debe verificarse contra el SHA servido por Render de producción y tener reversión preparada.
