# Crack Total 3.9 — corrección inteligente y jugabilidad justa

Fecha de corte: 19 de octubre de 2026. Rama: redesign/crack-total-2. PR: #1.

## Cambios implementados

- **Modo Rosco por Turnos:** ahora la primera respuesta se clasifica en el servidor. Si coincide exactamente tras normalización (mayúsculas, tildes, espacios), se puntúa de inmediato. Si es evidentemente incorrecta, se marca incorrecta de inmediato y empieza el traspaso de turno de 2.000 ms controlado por el servidor.
- **Corrección condicional:** solo se abre una ventana de 6.000 ms si la respuesta difiere de un valor admitido en **una inserción, eliminación, sustitución o transposición adyacente**, en valores de al menos 6 caracteres alfanuméricos, sin agregar/eliminar palabras; o si coincide con un fragmento de nombre incompleto definido explícitamente en la pregunta y esta pide nombre completo.
- **Corrección única:** una sola edición opcional, confirmación anticipada y tiempo de juego que continúa corriendo. No hay pistas de similitud ni puntos por coincidencia aproximada: para puntuar hay que responder exactamente, con normalización o variante válida explícita.
- **Curación editorial:** se agregaron 32 valores `respuestasIncompletasCorregibles` a preguntas ya existentes que piden nombre completo, evitando apellidos ambiguos como Martínez. No se alteró ninguna pregunta ni respuesta histórica y no se incorporaron nuevos datos deportivos.
- **Interfaz:** explicación específica y sin sugerir que toda respuesta es provisional; reloj visual de corrección limitado a un máximo de 6 s y transición visual a un máximo de 2 s para evitar desfases aparentes por sincronización de relojes.
- **Compatibilidad:** se preservan Rosco Espejo, partidas individuales, los otros cuatro juegos, el protocolo WebSocket, sesiones y rutas. Sin dependencias nuevas ni cambios en producción.

## Ejemplos de criterio

| Respuesta esperada | Envío | Resultado |
| --- | --- | --- |
| Bernabéu | `BERNABEU` | Correcta inmediata |
| Bernabéu | `bernabseu` | Una ventana de 6 segundos para corregir |
| Bernabéu | `Wembley` | Incorrecta inmediata y transición de 2 segundos |
| Erling Haaland, con `respuestasIncompletasCorregibles: ["Haaland"]` y pregunta que exige nombre completo | `Haaland` | Una ventana de 6 segundos; sin corregir, es incorrecta |
| Erling Haaland | `Cristiano Ronaldo` | Incorrecta inmediata |

**Límites intencionales:** el indicio de que una ventana se habilitó es inevitable cuando se ofrece al jugador; aun así, el servidor no revela la solución, no informa distancia de edición y no concede puntos hasta la comprobación final exacta. Una coincidencia fonética o un apellido no catalogado no activa corrección. La tolerancia ante nombres incompletos está limitada a las 32 preguntas anotadas.

## Verificación

- Ejecución aislada del motor y suite `scripts/pasala_duel_smoke.js` con reloj artificial: **PASS**. Cubre normalización, error manifiesto, tipografía de una inserción, incompleto explícito, una sola revisión, fin de plazo, latencia, privacidad del espectador y reloj de traspaso.
- Render staging: desplegado el commit `8c6a1acd54f33cc20131d96619316dd84193d778` el 19/10/2026; `npm ci && npm test` **PASS**, incluyendo pruebas de contenido, interfaz y `scripts/pasala_duel_ws_integration.js` con clientes WebSocket reales.
- Netlify Deploy Preview del PR #1: desplegó correctamente el commit `8c6a1acd54f33cc20131d96619316dd84193d778`. Los cambios posteriores al temporizador de frontend requieren la verificación del siguiente deploy.
- Prueba manual de navegador (tres sesiones en staging): creación de sala `B6F392029B`; ingreso de 2 jugadores; invitación del espectador; cuenta regresiva; pregunta privada; typo `Arsenla` activó corrección; `aston VILLA` fue puntuada de inmediato; respuesta manifiestamente errónea habilitó transición de **2 S** con relojes congelados. Estado del espectador: solo marcador/progreso, sin controles de respuesta.

## Pendientes y riesgos conocidos

- No se ejecutó una batería manual exhaustiva de las 32 variantes catalogadas; existe cobertura automatizada del mecanismo con ejemplos controlados.
- Las 6 s comienzan con el reloj del servidor; el tiempo útil en pantalla puede verse reducido por latencia real. No existe extensión de plazo concedida por el cliente.
- Revisar aparte las **15 vulnerabilidades de dependencias que informa `npm ci`** (10 moderadas, 3 altas, 2 críticas); no se alteró el árbol de dependencias en 3.9. Antes de intervenir, auditar qué paquetes y rutas están afectados.
- No se actualizó la página de inicio general; su rediseño queda para otra iteración.

## Siguientes prioridades

1. Completar pruebas visuales móviles de 360, 390 y 430 px sobre el PR.
2. Auditar dependencias con vulnerabilidades y plan de actualización no disruptiva.
3. Ampliar el catálogo de incompletos por verificación editorial, sin agregar tolerancias difusas.
