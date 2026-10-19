# Crack Total 3.6 — Superarena: iteración verificada (19-10-2026)

## Alcance y límites
- Rama: `redesign/crack-total-2`. PR: https://github.com/santiablatikk/CrackTotal/pull/1
- Frontend preview: https://deploy-preview-1--zingy-haupia-53b742.netlify.app
- Arena navegable: https://deploy-preview-1--zingy-haupia-53b742.netlify.app/pasala-1v1
- WebSocket STAGING independiente: https://cracktotal-arena-staging.onrender.com
- No hubo merge a `main`, cambios de dominio, publicación en `cracktotal.com` ni modificaciones en `reports/`.

## Cambios realmente implementados

### Pasala Che 1v1
- El servidor permite desmarcar `Listo` mientras la sala espera al segundo confirmado (`pasala:unready`); no lo permite durante el countdown.
- Se eliminó un estado transitorio de countdown enviado al desconectarse un jugador.
- El cliente evita ofrecer revancha si el rival está desconectado; muestra motivo y alternativa al volver al lobby.
- Pantalla de resultados: botón para copiar un resumen sin preguntas ni soluciones, basado en el resultado del servidor.
- La vista de espectador ya no muestra controles de invitación de jugador y sigue sin recibir preguntas.
- Marcador con barra de progreso por jugador (letras resueltas / 26) sin revelar posiciones individuales; estados claros de `JUGANDO` y `ROSCO COMPLETO`.
- Selección etiquetada como **tiempo**, ya que el banco 1v1 no tiene metadatos de dificultad por pregunta.
- Estilos responsive de acciones finales y soporte `prefers-reduced-motion` para las nuevas transiciones.
- El resultado final fija la hora de cierre en el servidor (`endedAt`): al reconectar o entrar a mirar tarde, los segundos transcurridos no siguen creciendo. El cliente muestra `FINAL` en lugar de un reloj residual.

### Quién Sabe Más — auditoría acotada
- Se inspeccionaron **113 registros preexistentes** del archivo `assets/data/level_1.json`.
- **4 preguntas existentes** se recuperaron al agregar cuatro opciones y clave compatibles con el motor (Libertadores 2025, Champions 2024/25, Mundial 2026, Balón de Oro 2025).
- **4 preguntas nuevas** con fuente oficial, opciones y criterio temporal (Golden Ball Mundial 2026, subcampeón Mundial 2026, sede Libertadores 2025, resultado Champions 2024/25).
- **1 pregunta previa corregida**: Santos no usa tradicionalmente amarillo y verde; se formuló una pista válida sobre el `Peixe` y sus colores blanco y negro.
- El registro editable `docs/football-facts-qsm-2026-10-19.json` documenta las **9 preguntas afectadas**, fuente individual y fecha.
- El test de contenido comprueba formato de las **117 preguntas** que ahora contiene el nivel 1, falta de duplicados normalizados, opciones distintas, respuestas y referencias de las 9 verificadas.
- **No se afirma verificación factual exhaustiva** de los otros 108 registros de este nivel ni de los otros niveles. No se tocaron esos bancos.

## Pruebas y evidencia reales
- Netlify, preview de la rama: `validate-deploy.js` y `npm test` con suites de duelo, contenido, interfaz y experiencia; estado **SUCCESS** del commit `ec06cef` confirmado en GitHub.
- Render staging: build `npm ci && npm test` **correcto en commit `ec06cef`**, incluyendo integración WebSocket con dos clientes, mismo rosco, cancelar listo, 26 respuestas validadas por servidor, espectador rechazado al responder, reconexión, revancha y abandono. El test verifica que el tiempo final es **inmutable** para un espectador que entra después de 1,5 s; desplegado LIVE el 19-10-2026 a las 19:44 UTC.
- Arranque de Render después del despliegue: `[NIVEL 1] Procesadas: 117, Válidas cargadas: 117`, sin las cuatro advertencias previas.
- QA de navegador en staging + Netlify con **dos sesiones de jugador y una sesión espectadora**, sala privada creada mediante enlace; cancelación de Listo visible; countdown real; primera pregunta idéntica; respuesta correcta y pase; marcador espectador 1-0 y sin pregunta; abandono con resultado `forfeit`; revancha deshabilitada para rival ausente; resumen copiado sin respuestas.
- Las pruebas automatizadas también comprueban la revancha y reconexión real por WebSocket, pero **esta iteración no repitió esos dos casos completos manualmente en la interfaz**.
- El motor existente mantiene el estado y cronómetro autoritativos del servidor; los demás protocolos de multijugador no se editaron.

## Pendientes explícitos
1. QA visual con emulación móvil real a 360, 390, 430 y 768 px y regresión manual de los cinco juegos: pendiente.
2. Auditoría de consola y persistencia Firebase en todos los juegos: pendiente.
3. Resistencia, escalado y antiabuso con audiencias masivas: **no probado**. El servidor tiene límite técnico de 80 espectadores por sala; no anunciar capacidad para miles de espectadores directos.
4. Auditoría y actualización prudente de dependencias: Render mostró advertencias de vulnerabilidades durante `npm ci`, pero no se hizo clasificación ni remediación de cada CVE en esta iteración.
5. Rankings 1v1 persistentes, torneos y sistema de comentarios/creadores: no implementados.
6. Banco histórico de preguntas completo: falta auditoría factual individual; agregar sólo contenido con fuente oficial.
7. Backend de producción y partidas guardadas existentes: **deliberadamente no se modificaron**; no se validó su funcionamiento bajo las nuevas reglas.

## Próxima prioridad
Auditoría de dependencias y seguridad del WebSocket de staging, seguido por QA móvil y regresión visual completa de Quién Sabe Más y Mentiroso. Después, agregar un segundo formato 1v1 sólo tras validar el primero con usuarios reales.
