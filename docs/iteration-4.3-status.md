# Crack Total 4.3 — Game Experience Overhaul

Rama: `redesign/crack-total-2`, PR #1. Producción `main` y `reports/`: no modificados.

## Resumen
Iteración centrada en experiencia de juego y legibilidad: rediseño profundo del Top 10 y mejoras concretas de presentación de los otros cuatro juegos. **No hay cambios en el motor WebSocket del 1v1, Firebase, reglas o bancos deportivos.**

### Top 10 — prioridad principal
Archivos `top10.html`, `assets/css/top10.css`, `assets/js/top10.js`.

- Separación real de tres estados UI: **inicio**, **partida** y **resultado**. El tablero no se muestra hasta que comienza el desafío.
- El inicio informa consigna real, competición/temporada, diez respuestas, 120 segundos y límite diario. El reloj solo arranca tras `EMPEZAR A JUGAR`.
- Encabezado compacto para recuperar espacio vertical, tablero de clasificación con filas legibles, números destacados y nombres largos con salto de línea (sin `text-overflow:ellipsis`). Puntos de cada equipo legibles.
- En móvil, el panel de respuesta está **antes del ranking**; el teclado no obliga a desplazarse sobre diez filas para escribir.
- Feedback distinguido por tipo de respuesta; palabras repetidas no cuentan de nuevo. Se conserva coincidencia exacta mediante alias oficiales del motor v2.
- Pantalla final con clasificación completa, puntos oficiales y fuente, acciones `VER MI CLASIFICACIÓN` y cierre del modal. El antiguo overlay que tapaba el tablero terminado se reconvirtió en una banda estática con cuenta regresiva.
- Eliminado código de banderas de selecciones y `normalize` heredados sin uso, y un bloque CSS antiguo `topic-source-note` huérfano.
- Contador UTC sin intervalos duplicados. Se conservan el progreso local, historial y reportes existentes.
- **Sin modificar el banco Top 10 verificado v2 ni añadir preguntas**. Los datos deportivos permanecen como en 4.2.

### Wordle Futbolero
Archivos `assets/css/wordle.css`, `wordle-futbol.html`.

- Sustitución completa del tema de estilo anterior: tablero claro con estados de letras de alto contraste, teclado táctil proporcionado, título visual destacado y modal de resultado con nueva jerarquía.
- Tipografía del tablero heredando el tamaño dinámico que ya calcula el motor para apellidos largos.
- Eliminada una carga duplicada de `game-shell.css`. Sin alterar palabra diaria, seis intentos, almacenamiento ni teclado JavaScript.

### Quién Sabe Más
Archivo `quiensabemas.html`.

- Reescritura de su bloque de CSS integrado, reemplazando la distribución genérica de tarjetas y el exceso de bordes y gradientes.
- Lobby crear/unirse con contraste real y campos grandes; pregunta de trivia protagonista; respuestas grandes y táctiles, marcadores diferenciados y barra de tiempo.
- CSS responsive para una columna en móvil, con estados de respuesta correcta/incorrecta visibles.
- Eliminada referencia duplicada a `base.css`. Sin cambiar el protocolo multijugador ni las preguntas.

### Mentiroso
Archivo `mentiroso.html`.

- Reemplazado el bloque de tema CSS interno por una identidad de estrategia/riesgo más clara (acento cálido, superficies de alto contraste).
- Lobby, apuestas, llamada de Mentiroso, entrada de lista, validación, categorías y mensajes reorganizados visualmente.
- Se afinó la redacción de los controles. Sin alterar apuestas, turno o validaciones de motor.

### Pasala Che individual
Archivos `assets/css/pasalache.css`, `pasalache.html`.

- Contraste reforzado del rosco; pregunta interior clara y legible, letra activa destacada, temporizador con jerarquía y controles simplificados.
- CSS ajustado al teléfono dentro del mismo archivo. Retirado el pulso continuo del fondo durante la partida.
- Redacción de indicaciones y campo de respuesta actualizada.
- Se añadió un pequeño bloque al final de una hoja de estilo heredada muy grande: **deuda técnica pendiente de consolidar tras un QA visual**; no afirmar que se eliminó todo el CSS duplicado.
- No se cambió su motor ni el Pasala Che 1v1.

## Pruebas y límites
- Añadido `scripts/game_43_smoke.js` al `npm test`: contratos de los cinco HTML, IDs únicos, CSS responsive y reducción de movimiento, reordenación de Top 10, fin/reanudación por estados, chequeo de scripts de juego en Node y guardados del código existente.
- Netlify ejecuta `node validate-deploy.js && npm test && node scripts/build-netlify-preview.cjs` en deploy-preview; **consultar el check del commit de entrega para conocer el estado final**.
- La herramienta de lectura pública no pudo abrir las páginas de preview, por lo que **no se realizaron pruebas visuales manuales ni se generaron capturas verificadas**. Las reglas CSS en 360–1920 px son implementadas, pero no equivalen a QA real.
- Tampoco se corrieron partidas manuales de los cinco juegos en sesiones de navegador: las pruebas disponibles son de integración previa del servidor y controles estructurales. Los límites se mantienen explícitos.
- Firebase, rutas, guardados, fuentes, SEO y modo 1v1 no se modificaron.

## Próximos pasos
1. QA visual en navegador en 360/390/430/768/1366/1920 px; corregir diferencias entre render real y CSS esperado.
2. Recorrido manual por inicio, partida, error, acierto, fin y recarga en los cinco juegos.
3. Auditoría técnica del CSS heredado de Pasala Che/Mentiroso para eliminar overrides antiguos solo con evidencia de no uso.
4. Integración en la portada de capturas reales tomadas de los juegos, respetando spoilers y funcionalidad.
