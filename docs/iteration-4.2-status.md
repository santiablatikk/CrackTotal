# Crack Total 4.2 — TOP 10: clasificaciones oficiales y UI competitiva

Fecha de implementación: 20/10/2026. Rama: `redesign/crack-total-2`. PR #1.
Producción, `main`, `reports/`, WebSocket y los motores de otros juegos: sin modificar.

## Auditoría de las 39 listas existentes

Se inspeccionaron las estructuras y metadatos de `top10_pool.json` (12) y `top10_pool_extended.json` (27).
Esto es una **auditoría de elegibilidad**, no una revisión factual de las 390 respuestas originales.

| Estado | Cantidad | Resolución |
|---|---:|---|
| Selecciones editoriales de goles destacados UEFA | 7 | Desactivadas del Top 10 diario; categoría subjetiva, aunque atribuidas a UEFA |
| Listas sin URL verificable y fecha de auditoría completas | 32 | Conservadas en Git, excluidas de la rotación hasta revisión |
| Listas heredadas validadas estadísticamente una por una | 0 | No afirmar revisión no realizada |
| Nuevas tablas verificadas contra fuentes primarias | 4 | Activadas en un archivo nuevo, inmutable `top10_verified_v2.json` |
| Posiciones oficiales nuevas | 40 | Diez por desafío |

No se borró ni reordenó el banco histórico ni sus IDs, para evitar perder la trazabilidad de los guardados previos.

## Nuevos desafíos objetivos

**1. Clasificación final de Bundesliga 2024/25** (id `ct-top10-bl-2024-25-final`). Bayern Munich 82; Leverkusen 69; Frankfurt 60; Dortmund 57; Freiburg 55; Mainz 52; Leipzig 51; Bremen 51; Stuttgart 50; Gladbach 45. Fuente: https://www.bundesliga.com/en/bundesliga/matchday/2024-2025/33/fc-bayern-muenchen-vs-borussia-moenchengladbach/table

**2. Clasificación final de Bundesliga 2023/24** (id `ct-top10-bl-2023-24-final`). Leverkusen 90; Stuttgart 73; Bayern 72; Leipzig 65; Dortmund 63; Frankfurt 47; Hoffenheim 46; Heidenheim 42; Bremen 42; Freiburg 42. Fuente: https://www.bundesliga.com/en/bundesliga/matchday/2023-2024/33/vfl-bochum-1848-vs-bayer-04-leverkusen/table

**3. Clasificación final de Bundesliga 2022/23** (id `ct-top10-bl-2022-23-final`). Bayern 71; Dortmund 71; Leipzig 66; Union Berlin 62; Freiburg 59; Leverkusen 50; Frankfurt 50; Wolfsburg 49; Mainz 46; Gladbach 43. Fuente: https://www.bundesliga.com/de/bundesliga/liveticker-ergebnisse-tabelle/2022-2023/34

**4. Clasificación final de Premier League 2024/25** (id `ct-top10-pl-2024-25-final`). Liverpool 84; Arsenal 74; Manchester City 71; Chelsea 69; Newcastle 66; Aston Villa 66; Nottingham Forest 65; Brighton 61; Bournemouth 56; Brentford 56. Fuente: https://www.premierleague.com/en/tables/premier-league/2024-25/matchweek-38

En cada caso se conserva el orden **oficial completo** (la puntuación está empatada en algunas posiciones, pero el orden oficial aplica los desempates reglamentarios). El juego no crea desempates propios.

No se añadieron goleadores ni nombres de futbolistas sin corroborar una fuente y un ranking de diez puestos. **4 desafíos nuevos**, no se fabricaron veinte para aparentar volumen.

## Contrato del juego y rotación UTC

- `assets/js/top10-verified.js` funciona en navegador y Node; valida esquema, fuente, fecha, métricas y alias sin colisiones.
- El archivo `top10_verified_v2.json` representa una **rotación congelada** de cuatro desafíos. Para ampliarla, crear versión nueva con plan de migración; nunca reordenarla ni cambiar sus elementos una vez publicada.
- El juego (`assets/js/top10.js`) y la portada (`assets/js/home.js`) usan **el mismo selector UTC** y archivo.
- Un resultado previo del mismo día con otro ID se copia a `top10_retired_backup_YYYY-MM-DD` antes de reemplazar `top10_state_v1`. Se conserva el historial persistido.
- El reloj de dos minutos empieza con **EMPEZAR DESAFÍO**, y sigue basado en `startTime` guardado entre recargas.
- Los nombres y alias se aceptan únicamente por igualdad normalizada (tildes, mayúsculas, espacios), con variantes explícitas por desafío. No existe coincidencia difusa. Repetir un acierto no suma intentos.
- La clasificación de diez posiciones revela el **puesto y los puntos oficiales** tras acertar. La pantalla final incluye los diez puestos completos con fuente, sin spoilers en el resultado compartido.

## Diseño y experiencia

- Pantalla `top10.html` reconstruida con tipografía deportiva, ranking de diez posiciones, panel de respuestas, temporizador destacado y pantalla de inicio. `assets/css/top10.css` fue reemplazado en el mismo archivo, sin dependencias nuevas.
- Se corrigió el texto obsoleto sobre «mejores goles UEFA» que figuraba en el Top 10 anterior.
- Módulo de inicio convertido a una representación de **tabla de posiciones anónima, sin nombres revelados**, eliminando el número gigante verde. Wordle se mantiene en el módulo diario.
- `games.html` también usa el selector compartido para su teaser.
- No se cambiaron los datos ni la jugabilidad de Wordle.

## Pruebas y límites

- `scripts/top10_42_smoke.js`: comprueba métricas y orden oficiales frente a puntos fijados de la auditoría, 4 IDs, alias, colisiones, validación de estructura, selección UTC y uso del mismo banco en portada/juego.
- Incluido en `npm test` de Netlify, además de todas las regresiones existentes.
- **La comprobación automatizada de estructura no vuelve a consultar las fuentes**. Las 4 tablas oficiales se contrastaron manualmente contra páginas públicas antes de crearlas.
- **No afirmar QA visual completo móvil, Lighthouse ni 18 casos de gameplay manual hasta ejecutar**; la herramienta conectada a GitHub permite cambios, pero no ofrece en esta sesión navegación gráfica de Web para esos tests.
- Queda pendiente una selección más diversa por continentes/torneos y auditoría histórica de los otros 32 desafíos, únicamente cuando puedan verificarse de forma seria.
