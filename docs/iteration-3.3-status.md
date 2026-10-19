# Crack Total — iteración competitiva 19-10-2026

**Rama:** `redesign/crack-total-2` · **PR:** https://github.com/santiablatikk/CrackTotal/pull/1  
**Vista previa estática:** https://deploy-preview-1--zingy-haupia-53b742.netlify.app  
**Arena:** https://deploy-preview-1--zingy-haupia-53b742.netlify.app/pasala-1v1

## Código implementado en esta iteración

### Pasala Che 1v1 / servidor
- Límite de **250 salas concurrentes por proceso** para evitar creación ilimitada.
- Servidor de staging opt-in, con `GET /__ct_staging/health`, orígenes WebSocket permitidos configurables con `CT_STAGING_ORIGINS` y máximo **64 KiB** por mensaje. Estas restricciones adicionales solo se activan al definir `CT_STAGING=true`.
- Blueprint de Render **separado**: [deploy/staging.render.yaml](../deploy/staging.render.yaml). No se toca el Render Blueprint de producción.
- Nueva prueba de integración de punta a punta (servidor real de loopback y **dos conexiones WS de jugador más una de espectador**). Prueba salud, rechazo por origen, mismo rosco, respuestas puntuadas en servidor, pasar, reconectar socket, revancha, abandono y no filtrar respuestas al espectador.
- Cliente Arena: bloquea temporalmente responder/pasar mientras espera al servidor, evita doble envío; contador de letras resueltas y ventaja en el marcador; desactiva entradas ante pérdida de conexión.
- [Procedimiento de staging y verificación manual](pasala-duel-staging.md).

### Preguntas y datos
- **12 preguntas nuevas** añadidas a la ampliación anterior de 17: **29 preguntas nuevas con fuentes individuales**, fecha de verificación 19-10-2026 y variantes aceptadas.
- **280 preguntas** en el banco Pasala Che (en su totalidad, no son 280 verificadas individualmente). El formato original de los juegos no cambió.
- Registro por pregunta: [football-facts-2026-10-19.json](football-facts-2026-10-19.json), con pregunta, letra, respuesta, alias, fecha, fuente oficial y contexto temporal.
- Fuentes: FIFA, UEFA, CONMEBOL y AFA. Las preguntas añadidas están ancladas a campeonatos, temporadas y resultados concluidos.
- Top 10 conserva **7 listas oficiales UEFA de 10 lugares** en rotación UTC. **32 listas heredadas sin documentación de origen** se conservan en el repositorio pero no se muestran como desafíos diarios verificados.
- Los **92 términos Wordle** solo fueron comprobados estructuralmente (longitud y unicidad), no auditados biográficamente uno por uno.
- **251 preguntas Pasala anteriores** quedan por auditar individualmente; controles automatizados detectan estructura, duplicados textuales exactos y correspondencia de la letra, sin garantizar la verdad histórica de todas.

### Calidad de juegos
- **Top 10:** nuevo historial local de hasta 30 fechas completas (se ven las últimas siete), resultado, intentos y tiempo. Se restaura al recargar, no publica respuestas ni modifica los datos diarios previos `top10_state_v1`. Clave adicional `top10_history_v1`.
- **Mentiroso:** si el preview no tiene servidor, en la lista de salas aparece un estado de conexión honesto, en vez de permanecer “Buscando salas...” eternamente.
- Pasala individual, Wordle y los lobbies antiguos mantienen sus reglas y guardados anteriores.

## Pruebas ejecutadas

- **Netlify deploy-preview: SUCCESS** en el commit que incorporó el historial Top 10 (`3973150`) y en commits anteriores. Se volvió a ejecutar al actualizar Mentiroso, resultado pendiente hasta finalizar CI.
- Pipeline de preview: `node validate-deploy.js && npm test && node scripts/build-netlify-preview.cjs`. `npm test` ejecuta: motor del duelo, verificación estructural y trazabilidad de datos, interfaz Arena, integración real Node HTTP + WebSocket. No se añadió dependencia.
- **Verificación en navegador de la vista previa**:
  - Inicio: hero, catálogo, enlaces y navegación visibles.
  - Pasala individual: selector de dificultad, preparación, 26 letras, temporizador, respuesta correcta **Arsenal → siguiente letra B** (se observó nueva pregunta 2026).
  - Top 10: tema oficial con enlace fuente, intento, rendición, modal y bloqueo diario, historial guardado y **restaurado tras recargar**.
  - Wordle: tablero y teclado virtual, contador diario y rachas visibles; no se completó una partida en esta ronda.
  - Quién Sabe Más: lobby cargado; acciones online deshabilitadas sin staging.
  - Mentiroso: lobby cargado; acciones online deshabilitadas sin staging; se corrigió mensaje de salas.
  - Arena 1v1: interfaz y bloqueo explícito por falta de WS externo.
- Consola del navegador: avisos de políticas publicitarias, errores de una extensión de Chrome y **error real de autenticación Firebase en el navegador de pruebas**. No se verificó guardado remoto de perfil/rankings y no se modificó configuración Firebase.
- Se revisó visualmente la portada a **ancho de escritorio**. **Pendiente QA visual 360/390/430/768 px**: no se debe presentar como validado.

## Qué demuestra la integración / qué NO

**Verificado:** una instancia de servidor Node de pruebas iniciada por la suite, con **dos clientes reales WebSocket y un tercero espectador**, cuenta regresiva, 26 preguntas espejo, 26 respuestas validadas por el servidor, pérdida de conexión y reanudación, revancha, forfeit y comprobación de privacidad.

**NO verificado:** servidor **público** externo de staging, latencia de dos jugadores en distintas redes, miles de espectadores, estabilidad bajo carga, compatibilidad multijugador completa de Quién Sabe Más/Mentiroso y guardados online.

El backend de Render de staging **no está publicado** porque requiere crear en la cuenta del propietario un servicio nuevo independiente. El Blueprint y [guía paso a paso](pasala-duel-staging.md) están listos. El preview de Netlify sigue siendo estático.

## Restricciones respetadas

No se modificaron archivos de `reports/`, `main`, dominio `cracktotal.com`, Render de producción, esquemas de Firebase ni los datos guardados anteriores. Mi Carrera continúa ausente de navegación pública, sin borrar históricos.

## Próxima prioridad

**Crear el servicio Render de staging usando el Blueprint nuevo y probar dos navegadores/dispositivos externos**. Después: privacidad de banco de preguntas (hoy existe JSON público por compatibilidad con modo solo), reconexión bajo latencia, anticheat, accesibilidad en móvil, auditoría individual de preguntas antiguas y pruebas de persistencia Firebase en un entorno de pruebas controlado.
