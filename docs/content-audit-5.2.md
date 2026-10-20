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
| `assets/data/top10_verified_v2.json` | 4 temas | pendiente de reconciliar con activos |
| `assets/data/wordle_pool.json` | 92 entradas | 0 problemas estructurales |

Los bancos pueden contener contenido duplicado o histórico. No sumar estos conteos como número de preguntas únicas. El inventario debe ampliarse a preguntas embebidas en JS, reglas de servidor y fuentes remotas si las hubiese.

## Cambios verificados individualmente

- Pasala Che fallback, letra A: se corrigió una pista que llamaba «El Moro» a Álvaro Arbeloa, confundiendo su apodo con Fernando Morientes. Nueva pista: «¿Apellido del lateral español que jugó en Liverpool y Real Madrid y fue campeón del mundo en 2010?», respuesta `Arbeloa`. Fuentes:
  - https://www.realmadrid.com/es-ES/el-club/historia/leyendas-futbol/alvaro-arbeloa-coca
  - https://www.realmadrid.com/pt-PT/o-clube/historia/lendas-futebol/fernando-morientes-sanchez

## Controles ejecutados

- `python3 scripts/audit_all_banks.py` tras corregir el reconocimiento de `respuesta_correcta`: 0 fallos de estructura/validación en los bancos listados por el script.
- `node scripts/release_51_smoke.js`: PASS.
- `node scripts/content_verified_smoke.js`: PASS en el momento del chequeo inicial.
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
