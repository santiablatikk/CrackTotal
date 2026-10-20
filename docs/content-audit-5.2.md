# Crack Total 5.2 — Auditoría de preguntas y respuestas

Fecha: 2026-10-20. Estado: **EN CURSO — NO certifica exactitud factual completa**.

## Inventario preliminar

| Dataset | Registros | Comprobación estructural |
| --- | ---: | --- |
| `assets/data/pasalache_2025.json` (principal) | 280 | 0 infracciones de letra detectadas |
| `assets/data/preguntas_combinadas.json` (fallback/legacy) | 1478 | 0 infracciones de letra detectadas |
| `assets/data/level_1.json` | 117 | 0 respuestas fuera de opciones |
| `assets/data/level_2.json` | 66 | 0 respuestas fuera de opciones |
| `assets/data/level_3.json` | 61 | 0 respuestas fuera de opciones |
| `assets/data/level_4.json` | 57 | 0 respuestas fuera de opciones |
| `assets/data/level_5.json` | 37 | 0 respuestas fuera de opciones |
| `assets/data/level_6.json` | 37 | 0 respuestas fuera de opciones |
| `assets/data/top10_pool.json` | 12 temas | 0 problemas estructurales |
| `assets/data/top10_pool_extended.json` | 27 temas | 0 problemas estructurales |
| `assets/data/top10_verified_v2.json` (rotación activa) | 4 temas, 40 posiciones | puntos y orden cotejados con clasificaciones históricas |
| `assets/data/wordle_pool.json` | 92 entradas | 0 problemas estructurales |

Los bancos pueden contener contenido duplicado o histórico. No sumar estos conteos como número de preguntas únicas. El inventario debe ampliarse a preguntas embebidas en JS, reglas de servidor y fuentes remotas si las hubiese.

## Cambios verificados individualmente

- Pasala Che fallback, letra A: se corrigió una pista que llamaba «El Moro» a Álvaro Arbeloa, confundiendo su apodo con Fernando Morientes. Nueva pista: «¿Apellido del lateral español que jugó en Liverpool y Real Madrid y fue campeón del mundo en 2010?», respuesta `Arbeloa`. Fuentes:
  - https://www.realmadrid.com/es-ES/el-club/historia/leyendas-futbol/alvaro-arbeloa-coca
  - https://www.realmadrid.com/pt-PT/o-clube/historia/lendas-futebol/fernando-morientes-sanchez

## Verificaciones del 20 de octubre de 2026

- **35 pistas de Pasala Che fallback actualizadas:** 30 en el commit `ce78bc9` y 5 en `261e960`. Se quitaron referencias a equipos, clubes, entrenadores y camisetas como si fueran actuales. No se modificaron las respuestas esperadas ni las letras.
- Casos comprobados en fuentes primarias: salida de Arne Slot de Liverpool; llegada de Son a LAFC en 2025; retiro de Sergio Busquets en 2025; dirección de Xabi Alonso en Leverkusen durante la Bundesliga invicta 2023/24; llegada de Unai Emery a Aston Villa en 2022; regreso de Leandro Paredes a Boca en 2025.
- También se corrigió la descripción incorrecta de Juan Román Riquelme como delantero. Se lo identifica como mediocampista/enganche de Boca.
- **Top 10 activo:** cuatro clasificaciones históricas — Bundesliga 2022/23, 2023/24, 2024/25 y Premier League 2024/25. Se cotejaron orden y puntos con Bundesliga.com y la tabla oficial de Premier League, con contraste adicional en RSSSF donde el sitio oficial no expone todo su HTML.
- **Comprobaciones de consistencia:** Pasala principal: 0 preguntas literalmente duplicadas; Pasala fallback: 3 grupos repetidos, uno usa `Borussia Dortmund` y otro `Dortmund` para una misma pista bajo letras distintas (sin contradicción de club); QSM: 5 grupos repetidos, uno usa `URSS`/`Unión Soviética` como sinónimos, y ninguna de sus 375 preguntas tiene dos opciones idénticas.
- **Limitación:** esta revisión dirigida de 35 pistas, cuatro tablas y conflictos entre preguntas **no constituye comprobación factual individual de las 1.478 pistas fallback, 280 principales, 375 QSM ni 92 Wordle**. Cada registro sin fuente contrastada sigue en estado `pending`.

Fuentes primarias consultadas:
- https://www.liverpoolfc.com/news/ (historial y cambio de entrenador); https://www.lafc.com/news/lafc-signs-global-football-icon-son-heung-min
- https://www.intermiamicf.com/news/sergio-busquets-to-retire-at-the-end-of-the-season
- https://www.bayer04.de/en-us/news/bundesliga/werkself-complete-unbeaten-bundesliga-season-with-2-1-win-against-augsburg
- https://www.avfc.co.uk/news/2022/november/04/new-era-begins-as-unai-emery-is-introduced-to-the-media/
- https://www.bocajuniors.com.ar/noticias/ya-es-una-realidad
- https://www.tottenhamhotspur.com/news/984194/xavi-simons-joins-from-rb-leipzig
- https://www.bundesliga.com/en/bundesliga/matchday/2022-2023/27/hertha-bsc-vs-rb-leipzig/table
- https://www.bundesliga.com/en/bundesliga/matchday/2023-2024/32/vfb-stuttgart-vs-fc-bayern-muenchen/table
- https://www.bundesliga.com/en/bundesliga/matchday/2024-2025/33/fc-bayern-muenchen-vs-borussia-moenchengladbach/table
- https://www.premierleague.com/en/tables/premier-league/2024-25

## Controles ejecutados

- `python3 scripts/audit_all_banks.py` tras corregir el reconocimiento de `respuesta_correcta`: 0 fallos de estructura/validación en los bancos listados por el script.
- `node scripts/release_51_smoke.js`: PASS.
- `npm ci --ignore-scripts` + `npm test`: **PASS completo** el 20/10/2026, incluidos 26 aciertos reales del test WebSocket 1v1, reconexión, espectadores, revancha, abandono y estadísticas finales. La primera ejecución sin instalar dependencias falló por `MODULE_NOT_FOUND: ws` del entorno local; tras instalar las dependencias declaradas, la suite terminó con código 0.
- `npm run validate`: PASS — referencias y estructura de despliegue presentes.
- `node scripts/content_verified_smoke.js`: PASS tras la corrección de 30 pistas.
- `node scripts/top10_42_smoke.js`: PASS — cotejo de los 40 puestos activos, alias, rotación y componentes.
- `python3 scripts/audit_all_banks.py`: repetido tras la actualización de las 30 primeras pistas, con 0 errores de letra, 0 respuestas QSM inválidas y 0 problemas estructurales Top10/Wordle; quedan banderas suaves no bloqueantes.
- Netlify Deploy Preview del commit `36738768afe3b1c45a2c25f27008ed7e2be9d485`: SUCCESS.
- Búsqueda preliminar de términos volátiles en `assets/data/*.json`: 68 líneas coincidentes (no equivale a 68 preguntas únicas o erróneas).

## Desfase del backend de dos juegos — BLOQUEANTE PARA RELEASE

El dominio público se sirve desde **Render Static Site**, rama `main`. Sin embargo, los clientes de `Quién Sabe Más` (`assets/js/quiensabemas_1v1.js`) y `Mentiroso` (`assets/js/mentiroso.js`) se conectan en producción a `wss://cracktotal-servidor.onrender.com`, cuyo código fuente está en el repositorio **separado** `santiablatikk/cracktotal-servidor`. En el Deploy Preview no conectan a ese backend si no se indica explícitamente un servidor de staging.

Comparación de **repositorios** al 20/10/2026 (no prueba qué commit concreto está corriendo en el servidor de Render):

| Banco | Repo de backend antiguo | Rama nueva del sitio | Observación |
| --- | ---: | ---: | --- |
| QSM: niveles 1–6 | 366 | 375 | 295 enunciados en común; 80 propios de la rama nueva y 67 exclusivos del backend antiguo |
| Mentiroso: retos `template` en `server.js` | 193 | 256 | Los 193 anteriores persisten; 63 adicionales están solo en la rama nueva |

- Entre los enunciados QSM idénticos hay una diferencia textual de respuesta (`Bayern Munich`/`Bayern Múnich`), no una contradicción deportiva.
- Al menos **43 de los 256 retos de Mentiroso** disparan una alerta editorial por términos como `importante`, `picante`, `batacazo`, `fracasó` o `golazo`. Es una señal heurística, no 43 errores probados. Por ser respuestas libres validadas entre jugadores, **no existe un solucionario inequívoco** para estos retos tal como están escritos.
- **No prometer que QSM/Mentiroso usan las correcciones nuevas** hasta validar y desplegar su backend correspondiente; la actualización del Static Site por sí sola no lo logra.
- Pendiente obligatorio: preparar staging reproducible del backend de esos juegos, reconciliar preguntas/retos, ejecutar partidas end-to-end y planificar despliegue/rollback del servicio independiente.

## QA visual en el Deploy Preview

- Portada: catálogo y enlaces a cinco juegos cargan.
- Pasala Che individual: apertura de partida, carga de pregunta y corrección real de `Batistuta` (1/26), con avance a letra B.
- Top 10: desafío Bundesliga 2022/23, ingreso de `Bayern Munich`, validación de alias y posición 1 con 71 puntos.
- Wordle: pantalla, tablero, teclado virtual y control de reglas presentes; sin partida terminada.
- No se ejecutó todavía una partida UI completa de QSM/Mentiroso contra staging del backend antiguo.

## Otras preguntas cotejadas con fuentes oficiales

Se añadieron `audit_status: verified_official`, `source_url` y `verified_at` a **8 preguntas QSM** de los niveles 1 y 5: campeones de Libertadores 2025 (Flamengo), Champions 2024/25 (PSG) y Mundial 2026 (España); Balón de Oro 2025 (Dembélé); Balón de Oro del Mundial 2026 (Rodri); subcampeón 2026 (Argentina); sede de la final Libertadores 2025 (Lima) y Mundiales celebrados en México antes de 2026 (dos). Fuentes: FIFA, UEFA y CONMEBOL. Son ocho verificaciones individuales, no certificación del banco completo.

## Pendientes obligatorios

1. Construir inventario completo de preguntas embebidas y usadas dinámicamente; verificar qué bancos carga cada juego.
2. Contrastar cada afirmación factual contra fuentes primarias, con fecha de corte y trazabilidad por pregunta.
3. Clasificar como `verified`, `corrected`, `ambiguous`, `duplicate`, `retired` o `pending`. No promover contenido pendiente como verificado.
4. Resolver ambigüedades en datos variables, alias de respuestas y listas Top 10, sin cambiar arbitrariamente mecánicas.
5. Ejecutar tests regresivos completos y QA manual de todos los juegos.
6. Reconciliar y desplegar el backend independiente de Quién Sabe Más y Mentiroso, verificando que las preguntas/retos activos correspondan a los datos auditados, antes del merge del PR #1.

**No fusionar ni publicar como release final mientras siga sin completarse la verificación factual y funcional acordada.**

## 21 de octubre de 2026 — Unificación multijugador (fase piloto, SIN despliegue)

**Estado: avance parcial, NO apto para producción.** El PR #1 permanece abierto y la rama `main` no se ha modificado en esta fase.

### Hallazgos de código confirmados

- Pasala Che usa `server/pasala-duel.js`: salas separadas, IDs seguros, verificación del servidor, reconexión por token y revancha.
- Los clientes QSM y Mentiroso todavía utilizan el protocolo heredado, desplegado independientemente desde `santiablatikk/cracktotal-servidor`.
- El cliente de QSM trata la desconexión durante una partida como finalización; falta integrar la recuperación que ofrece Pasala.
- El Mentiroso heredado utiliza `mentirosoSubmitValidation` con booleanos remitidos por el adversario: no equivale a arbitraje factual.
- Se identificó y corrigió en el código candidato un bug de `joinRandomRoom`: al crear una sala vacía ignoraba el `gameType` solicitado y hacía una sala QSM.

### Código agregado y cambios ejecutados

- `server/multiplayer/core.js`: normalización estricta, códigos seguros, nombres acotados, alias vinculados a IDs canónicos y descarte de respuestas duplicadas. El módulo se reutiliza en Pasala y en el servidor heredado candidato.
- `server/multiplayer/objective-mentiroso.js`: adjudicación de respuestas por servidor, sin arbitraje manual, con validación del conjunto y apuestas acotadas.
- `assets/data/mentiroso_objective_pilot.json`: **6 consignas cerradas, 29 respuestas canónicas** distribuidas en las seis categorías. Todas contienen URLs de FIFA, UEFA o CONMEBOL; su revisión editorial completa y cobertura total del banco antiguo aún NO está certificada.
- `server.js`: el piloto se activa **solo** si ambas variables de entorno `CT_STAGING=true` y `CT_OBJECTIVE_MENTIROSO=true`. Fuera de ese escenario permanece la mecánica antigua para evitar una migración destructiva. En piloto, seis rondas, una por categoría, servidor decide la validez.
- `assets/js/mentiroso.js`: pantalla de resultados con detalle de cada veredicto, límites de apuesta y números correctos de ronda; `assets/css/mentiroso.css`: colores del sistema visual 5.2 y tarjeta de verificación.
- `scripts/objective_mentiroso_smoke.js`: nuevo test que cubre alias, duplicados, apuestas inválidas, rechazo de respuestas ajenas al conjunto y validez estructural del piloto, incorporado a `npm test`.
- Tres preguntas ambiguas/incorrectas de QSM corregidas, con fuentes: Zidane 2016–2018 (UEFA), tres finales del Atlético hasta 2016 incluyendo Copa de Europa (UEFA), y Griezmann francés cuya cláusula de 120 millones de euros pagó Barcelona en 2019 (FC Barcelona).

### Gate pendiente antes del lanzamiento

1. Ejecutar y documentar `npm ci`, `npm test`, `npm run validate` y tests reales WebSocket del **nuevo HEAD**. La ejecución de estos tests **no fue confirmada** en esta fase: se añadieron y versionaron, pero no se informará PASS sin evidencia.
2. Habilitar un servidor de staging que ejecute el código candidato con las dos variables indicadas; probar partida completa de Mentiroso con dos clientes, seis rondas, temporizadores y resultados, incluido fallo/reconexión.
3. Integrar QSM al mismo sistema de salas y sesiones. **QSM todavía no utiliza el núcleo de Pasala para reconexión**.
4. Verificar individualmente TODOS los bancos deportivos activos. El piloto de Mentiroso no reemplaza los 256 retos anteriores; los retos subjetivos permanecen fuera del piloto, no están borrados ni convertidos todos.
5. Reconciliar y desplegar la fuente canónica en el servidor de producción de manera controlada (está en otro repositorio); QA completo responsive, seguridad y monitorización.
6. Confirmar CI en verde y rollback antes de cualquier merge o modificación del dominio.

Fuentes primarias cotejadas para los casos nuevos:
- https://www.uefa.com/uefachampionsleague/news/028c-1aad7af4a471-75bd5cff54cf-1000--champions-league-semi-finals-meet-the-teams/
- https://www.fifa.com/es/articles/que-seleccion-gano-la-ultima-copa-mundial-de-la-fifa-qatar-2022
- https://www.fifa.com/es/articles/todos-los-mundiales-de-la-historia-campeones-sedes-y-mejores-jugadores
- https://gol.conmebol.com/libertadores/es/news/los-campeones-de-la-conmebol-libertadores-que-iran-por-una-nueva-corona
- https://www.uefa.com/uefachampionsleague/news/0245-0e98d8e8f00a-1372e16c4e8d-1000--zidane-leaves-real-madrid-how-much-did-he-achieve/
- https://www.uefa.com/uefachampionsleague/news/022d-0e9475a3f13d-96d6cbb93192-1000--can-atletico-make-it-third-time-lucky-in-milan/
- https://www.fcbarcelona.es/es/futbol/primer-equipo/news/1277948/barca-sign-griezmann


## 21 de octubre de 2026 — Mentiroso mínimo 20 y continuación de QSM

**Actualización posterior al piloto inicial.** El conjunto provisional de 6 retos / 29 entradas descrito arriba fue **sustituido**: no cumplía el mínimo editorial. Ya no se carga en `mentiroso_objective_pilot.json`.

### Conjunto objetivo actualmente versionado

| Categoría | Conjunto histórico | Respuestas únicas |
| --- | --- | ---: |
| Fútbol Argentino | 28 clubes Liga Profesional 2024 | 28 |
| Libertadores | Fase de grupos Libertadores 2026 | 32 |
| Mundiales | Participantes Qatar 2022 | 32 |
| Champions League | Fase de grupos UEFA 2023/24 | 32 |
| Selección Argentina | Plantel Qatar 2022 | 26 |
| Fútbol General | Clubes Premier League 2023/24 | 20 |
| **TOTAL** | **6 conjuntos cerrados** | **170** |

Cada conjunto incorpora documentación oficial contextual (Liga Profesional/AFA, CONMEBOL, FIFA, UEFA, Premier League); fue cotejado a nivel de lista pública. Los alias y variantes de nombres **no** se incluyen en el conteo. Conjuntos mayores siguen sujetos a revisión editorial continua; las seis listas NO equivalen al objetivo final de 90 consignas.

- `server/multiplayer/objective-mentiroso.js` impone **mínimo de 20 entidades canónicas diferentes**, exige marca de verificación, fecha, fuente y prohíbe IDs o alias ambiguos. Una consigna de 4–7 respuestas provoca fallo y no puede entrar al modo objetivo.
- El test `scripts/objective_mentiroso_smoke.js` se actualizó para las 170 entradas, mínimo 20, pruebas de apuestas 1/5/10/15/20/21, respuestas repetidas y casos negativos de registros sin verificar y catálogos demasiado pequeños.
- `server.js` incorpora tiempo para listar proporcional a la apuesta (acotado 60–240 s), arbitraje automático atómico al enviar o vencer el reloj y guardia contra doble puntuación. Todo sigue tras `CT_STAGING=true` + `CT_OBJECTIVE_MENTIROSO=true`: no es el backend actualmente desplegado.
- Se ejecutó el código real descargado de GitHub del corrector y su smoke test en un entorno JavaScript aislado con dependencias Node emuladas: **PASS**. También pasó la compilación sintáctica de servidor y cliente. **No confundir con `npm test`, CI ni una partida WebSocket real:** siguen pendientes.
- Quién Sabe Más: corregida respuesta **73 goles en temporada 2011/12 vs. 91 en año calendario 2012**, respaldada por FC Barcelona. Reformuladas una pregunta sobre la final UCL 2017 y otra sobre Higuaín (Serie A 2015/16) con UEFA y Lega Serie A. Se marcó como `retired` una pregunta global sin fuente sobre el partido de fútbol «más largo de la historia» y `server.js` evita servir explícitamente contenido `retired`, `ambiguous` o `pending`.
- Nuevo test `scripts/qsm_content_integrity_smoke.js`: 375 registros revisados estructuralmente, 374 elegibles, 1 explícitamente retirado; 14 con marca `verified_official` y documentación consultable. Pasó ejecución aislada; **361 no están certificados factual e individualmente**. Este test también se añadió a `npm test`.

Fuentes utilizadas en esta etapa:
- https://www.ligaprofesional.ar/?p=48022
- https://gol.conmebol.com/libertadores/es/news/sorteo-de-la-fase-de-grupos-de-la-conmebol-libertadores-2026-fecha-horario-clasificados
- https://inside.fifa.com/tournament-organisation/world-cup-2022-in-numbers/fifa-world-cup-qatar-2022-at-a-glance
- https://www.uefa.com/uefachampionsleague/news/0283-188394537406-c113ed18f2d0-1000--group-stage-line-up-complete/
- https://www.afa.com.ar/es/posts/origen-futbolistas
- https://www.premierleague.com/es/news/4028389/premier-league-202324-club-by-club-review
- https://www.fcbarcelona.com/en/card/2214377/lionel-messi
- https://www.uefa.com/uefachampionsleague/news/0250-0c5117c008df-de0901ea6dae-1000--majestic-real-madrid-win-champions-league-in-cardiff/
- https://www.legaseriea.it/serie-a/news/giornata-storica-per-batistuta-e-higuain

**Gates aún bloqueantes:** faltan 84 consignas competitivas de Mentiroso para el objetivo 90 (mínimo 15 por cada categoría); no existe aún sincronización del backend público independiente; falta migración de sesiones QSM, prueba WebSocket completa de los modos actualizados, CI del HEAD final, auditoría factual de los bancos restantes, QA responsive y validación del despliegue. No fusionar el PR #1 aún.

## 21 de octubre de 2026 — Mejoras de interacción y control de cierre de rondas

- En `mentiroso.html`, `assets/js/mentiroso.js` y `assets/css/mentiroso.css` se implementaron campos de respuesta extensos, contador de entradas (sin indicar cuáles son correctas), anuncio del tamaño del conjunto válido y un máximo de apuesta reflejado en el input. Se conservaron botones y flujos existentes.
- El temporizador del modo objetivo se adapta a apuestas grandes (mínimo 60 segundos, máximo 240 segundos) y se comprueba la fecha límite del servidor. Una llamada «Mentiroso» o una apuesta fuera de la fase correcta se rechaza.
- El resultado de cada ronda y los avisos de feedback se muestran mediante nodos de texto seguros; los nombres de jugadores no se incorporan a HTML interpolado.
- **Comprobación de esta fase**: ejecución real del código descargado de la rama en JavaScript V8 aislado, con primitivas Node simuladas, de ambos smoke tests: PASS (170 respuestas / 6 retos, min 20; 375 QSM estructurales y 1 retirado). También pasó la compilación sintáctica de los archivos principales. No implica `npm test` completo, despliegue de staging ni partida real.
- **Sigue bloqueado el lanzamiento** mientras no se validen el nuevo servidor en staging, toda la superficie de QSM/Mentiroso, el contenido factual pendiente y los checks finales de CI. El backend antiguo independiente no recibió estos commits.


## 21 de octubre de 2026 — Online 1v1 (QSM y Mentiroso, aislamiento staging)

**Implementado en la rama / PR, NO en el servicio histórico público:**

1. Los clientes `quiensabemas_1v1.js` y `mentiroso.js` utilizan automáticamente **`wss://cracktotal-arena-staging.onrender.com`** solo desde la preview Netlify oficial `deploy-preview-1--zingy-haupia-53b742.netlify.app`. En otras previews Netlify se mantiene la protección de no utilizar producción; el despliegue `cracktotal.com` todavía utiliza el backend histórico. Las URLs de los recursos en ambas páginas fueron actualizadas para evitar scripts antiguos en caché.
2. Para QSM y Mentiroso, el servidor staging implementa `resumeRoom` con credenciales aleatorias de 24 bytes, rotación del token al reconectar, grace period de 45 segundos, restauración de identidad/estado y bloqueo de acciones durante la caída del rival. Los clientes guardan el token en `sessionStorage` por partida, sin enviarlo al adversario.
3. QSM corrige duplicados durante el retardo de próxima pregunta. El servidor controla el límite de **20 segundos** y emite `answerResult` con `timedOut:true`, 0 puntos y cambio de turno; ignora intentos de manipulación desde `timeOut` del navegador. El reloj se suspende al desconectar y se restaura con el tiempo restante; `CT_QSM_TEST_QUESTION_MS` permite reducirlo solo en tests de staging.
4. Mentiroso conserva apuesta dinámica de 20 o más respuestas, arbitraje automático por IDs canónicos, reloj controlado por servidor y reconexión del estado de la ronda. **Solo** con `CT_STAGING=true` y `CT_OBJECTIVE_MENTIROSO=true`.
5. El servidor publica `arena:hello` por WebSocket y un health de staging con `arenaProtocol:"cracktotal-arena-5.2"`, flags `qsmResume`, `mentirosoObjective` y `RENDER_GIT_COMMIT`. Los clientes de la preview no habilitan matchmaking cuando el backend es antiguo o carece de las capacidades obligatorias.
6. Se añadió `scripts/legacy_online_ws_integration.js` a `npm test`: lanza un servidor Node local de staging y prueba dos sesiones QSM, pausa/reconexión, rechazo de segunda respuesta, expiración por servidor, señal de compatibilidad y luego Mentiroso con apuesta válida de 20 respuestas, rechazo de arbitraje subjetivo y reconexión en ronda 2. La URL remota de Render **no** se usa en este test.

### Puesta en marcha del servidor remoto de staging (pendiente de verificar)

Para `cracktotal-arena-staging` debe confirmarse en Render:
- Repositorio: `santiablatikk/CrackTotal`.
- Rama: `redesign/crack-total-2` y auto-deploy tras commit; no utilizar el repositorio histórico `cracktotal-servidor` para pruebas 5.2.
- Comando de build: `npm ci`; inicio: `npm start` (servidor HTTP + WebSocket).
- Variables: `CT_STAGING=true`, `CT_OBJECTIVE_MENTIROSO=true` y `CT_STAGING_ORIGINS=https://deploy-preview-1--zingy-haupia-53b742.netlify.app`.
- Ruta de salud: `https://cracktotal-arena-staging.onrender.com/__ct_staging/health`.
- Debe devolver protocolo 5.2, `features.qsmResume=true`, `features.mentirosoObjective=true` y un SHA igual al commit desplegado. Si no devuelve esto, el nuevo frontend no habilita las salas 5.2.

**No se ha confirmado desde esta revisión un deploy remoto de Render ni una partida en esa instancia externa.** La preview Netlify puede validar `npm test` local y seguir sin tener el nuevo servidor remoto desplegado. No fusionar con `main` ni apuntar al dominio principal hasta desplegar, probar y versionar el backend de producción por separado.

**Limitaciones pendientes:** QSM/Mentiroso siguen teniendo adaptadores de protocolo propios dentro de `server.js` (aunque ya comparten funciones base, servicio y recuperación). La convergencia del RoomManager completo con Pasala y la cobertura editorial de todas las preguntas/consignas continúa abierta. Los resultados de desconexión definitiva y la limpieza de sala merecen pruebas adicionales de tolerancia a fallos.
