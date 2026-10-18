# Crack Total 3.1 — registro de iteración (2026-10-19)

Rama: `redesign/crack-total-2`. PR: https://github.com/santiablatikk/CrackTotal/pull/1.
Preview: https://deploy-preview-1--zingy-haupia-53b742.netlify.app

## Cambios comprobados en esta iteración

- **Pasala Che 1v1**: la reconexión automática ahora funciona también desde Netlify si existe `?server=wss://<staging>`; el resultado conserva el token para reconectar antes de pedir revancha. El servidor anuncia el fin de la cuenta regresiva y confirma acciones demasiado rápidas. Acepta alternativas documentadas sin confiar en el navegador.
- **Pasala Che individual**: se incorporaron 17 preguntas fechadas y documentadas en `docs/football-facts-2026-10-19.json`. Se aceptan las alternativas explícitas; 26 letras y contador alineados.
- **Top 10**: siete desafíos con diez posiciones únicas elegidas por el grupo técnico de UEFA (ediciones 2022/23 a 2025/26); cada uno muestra fuente original, fecha, temporada, criterio y pistas de clubes. La selección diaria usa UTC. Los pools antiguos sin acreditación oficial siguen en el repositorio, pero están excluidos de la rotación hasta auditarse. Timer, finalización, cantidad de aciertos y recuperación tras recarga corregidos.
- **Wordle Futbolero**: corrección del registro de duración e intentos que antes referenciaba variables fuera de ámbito; tablero y resultado diarios recuperables tras recarga sin duplicar estadísticas; compartir con cuadrícula sin revelar la palabra; tablero largo y teclado táctil más adaptables.
- **Quién Sabe Más y Mentiroso**: la vista previa estática ya no se conecta automáticamente al WebSocket de producción. Para probar contra un backend temporal: `?server=wss://<staging>`. Con servidor ausente se informa que no hay conexión y se deshabilitan controles del lobby. En producción se mantiene exactamente la URL anterior.

## Auditoría de contenido

- **268** preguntas de Pasala Che presentes en el banco: auditoría automática de forma, 26 letras y duplicados exactos; **17 nuevas comprobadas individualmente** contra FIFA, UEFA y CONMEBOL. Las **251 previas no se certificaron individualmente** en esta iteración.
- **7 nuevos Top 10 × 10 posiciones = 70 respuestas ordenadas** contrastadas con publicaciones oficiales de UEFA. Los 32 temas antiguos permanecen para auditoría, fuera de la rotación diaria.
- **92 entradas de Wordle** revisadas **estructuralmente** (longitud, palabras únicas), no verificadas una por una frente a fichajes actuales.
- Fecha de corte para las incorporaciones: **19 de octubre de 2026**. Datos y evidencia: `docs/football-facts-2026-10-19.json` y `source_url`/`verified_at` de cada Top 10 oficial.

## Validación

- Humo determinista del motor `scripts/pasala_duel_smoke.js`: sala privada, espejo de preguntas, reloj y cuenta regresiva, variantes, throttling, espectadores sin soluciones, desconexión/reanudación, ganador, revancha y limpieza.
- `scripts/content_verified_smoke.js`: integridad de preguntas nuevas/alternativas/fuentes, siete desafíos de diez respuestas distintas, 92 palabras Wordle sin duplicados.
- Ambos se ejecutan mediante `npm test` y son condición del build de Netlify. La salida real de la ejecución Node en memoria de ambas suites fue satisfactoria.
- Navegador: Top 10 presentó fuente oficial y aceptó “Valverde”; recargar mantuvo 1/10 y siguió el reloj. Wordle aceptó la solución diaria de prueba, mostró victoria y guardó tablero/racha, restaurados tras recarga. Pasala individual cargó las 26 letras y una pregunta.
- Pendiente de pruebas externas: partida WebSocket real de dos clientes sobre staging; Firebase/guardado remoto por fallos de autenticación detectados en preview; QA de resoluciones móviles específicas, reconexión de red real y los dos protocolos competitivos heredados.

## Próximos pasos prioritarios

1. Crear/deployar un servicio Node **staging independiente** de producción con `CT_STAGING=true` y `npm start` (ver `docs/pasala-duel-staging.md`). Probar dos clientes + espectador/OBS y reconexión; no usar producción para probar.
2. Revisar las 251 preguntas antiguas una a una y los 32 Top 10 históricos, con fuentes oficiales y corrección justificada. Solo reincorporar listas verificadas.
3. Probar y pulir lobby/partida real de Quién Sabe Más y Mentiroso contra staging, además de accesibilidad y móvil real.

No se alteraron `main`, `cracktotal.com`, los archivos de `reports/`, los esquemas Firebase ni guardados históricos. El backend del preview Netlify **es estático** y no certifica multijugador real.
