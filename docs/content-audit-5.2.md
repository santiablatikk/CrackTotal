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

## Pendientes obligatorios

1. Construir inventario completo de preguntas embebidas y usadas dinámicamente; verificar qué bancos carga cada juego.
2. Contrastar cada afirmación factual contra fuentes primarias, con fecha de corte y trazabilidad por pregunta.
3. Clasificar como `verified`, `corrected`, `ambiguous`, `duplicate`, `retired` o `pending`. No promover contenido pendiente como verificado.
4. Resolver ambigüedades en datos variables, alias de respuestas y listas Top 10, sin cambiar arbitrariamente mecánicas.
5. Ejecutar tests regresivos completos y QA manual de todos los juegos.
6. Verificar arquitectura de producción y multijugador antes del merge del PR #1.

**No fusionar ni publicar como release final mientras siga sin completarse la verificación factual y funcional acordada.**
