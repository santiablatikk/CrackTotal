# Wordle — contrato de estabilidad de desafíos diarios (6.1)

- Foto de referencia tomada del banco de 92 registros de Wordle de Crack Total 6.0 el 24-10-2026. Se conserva el orden de los identificadores y sus respuestas canónicas.
- La selección antigua era `AAAAMMDD % pool.length`. Si se cambia `pool.length`, también cambia el desafío de una fecha pasada y se invalida la comparación con partidas guardadas.
- La selección 6.1 usa ventanas con `from` (fecha numérica AAAAMMDD) y `size` (longitud congelada de la porción del banco). Actualmente la única ventana `{from:0,size:92}` reproduce exactamente la selección histórica.
- **Cómo ampliar en el futuro:** incorporar entradas masculinas verificadas al FINAL del JSON y, luego de probarlas, agregar una ventana nueva con inicio futuro a `DAILY_POOL_WINDOWS` en `assets/js/wordle-futbol.js`, con el tamaño total que quedará congelado. No reordenar ni cambiar entradas base. No usar una fecha de inicio anterior a la publicación.
- `scripts/wordle_daily_stability_smoke.cjs` comprueba integridad de la línea base, unicidad de respuestas y uso de ventanas. Además deben mantenerse las pruebas de UI y de persistencia del juego real.

**Garantía acotada:** esta comprobación protege la secuencia histórica, no constituye una auditoría biográfica ni verifica cada apellido con fuentes externas.
