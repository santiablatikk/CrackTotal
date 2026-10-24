# Repeticiones exactas conocidas — Crack Total 6.1 (24-10-2026)

La auditoría normalizada (sin diferencias de tildes, puntuación y mayúsculas) encontró **16 parejas** de enunciados repetidos en el inventario de 2284 entradas.

De esas parejas, tres están dentro del banco heredado `preguntas_combinadas.json` y cinco cruzan niveles de Quién Sabe Más. Las otras ocho cruzan bancos o modos; compartir información entre formatos no implica automáticamente un error, pero no deben contarse como 16 conocimientos adicionales.

## Pendientes en banco fallback Pasala (3)
- Club del Signal Iduna Park.
- Estadio del FC Barcelona.
- Apellido del argentino con ocho Balones de Oro.

## Pendientes entre niveles QSM (5)
- Real Madrid: tres Champions consecutivas 2016–2018 (niveles 2 y 3).
- Descenso de River Plate en 2011 (niveles 2 y 3).
- Campeón de la Eurocopa de 1960 (niveles 2 y 5).
- Campeón de la Copa América de 2019 (niveles 3 y 4).
- Goles de Gerd Müller en el Mundial de 1970 (niveles 3 y 4).

La Eurocopa de 1960 la ganó la **Unión Soviética/URSS**, según el [historial oficial UEFA](https://es.uefa.com/uefaeuro/history/seasons/1960/); las dos variantes de ese par representan la misma respuesta y deben unificarse en un futuro reemplazo con contenido nuevo y verificado.

El test `scripts/content_duplicate_gate_61.cjs` bloquea la aparición de nuevos enunciados exactos repetidos en el fallback o entre niveles QSM. Permite que las ocho parejas heredadas disminuyan conforme se reemplacen por preguntas contrastadas. **No es todavía un detector semántico completo ni certifica los hechos**. La sustitución de cada entrada está pendiente porque debe conciliarse con el banco independiente del servidor online antes de cambiar la experiencia competitiva.
