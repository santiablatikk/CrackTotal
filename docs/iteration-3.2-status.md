# Crack Total 3.2 — Arena 1v1 y retransmisiones (2026-10-19)

Rama: `redesign/crack-total-2`.
PR: https://github.com/santiablatikk/CrackTotal/pull/1
Vista previa estática: https://deploy-preview-1--zingy-haupia-53b742.netlify.app/pasala-1v1

## Mejoras implementadas (incrementales sobre 3.1)

- **Salas resistentes:** si el anfitrión abandona una sala en espera, el invitado y los espectadores reciben `pasala:closed` y regresan al lobby con una explicación, en lugar de quedarse esperando. El mismo evento se envía al terminar el tiempo de retención de una sala.
- **Reconexión en espera:** una desconexión durante el lobby reinicia las confirmaciones de preparación; los dos vuelven a indicar que están listos.
- **Espectadores en directo:** el servidor envía el contador de espectadores y lo actualiza al unirse, salir o desconectarse; no revela preguntas ni respuestas a los espectadores.
- **Invitaciones:** en el match, botones separados para copiar código, enlace del rival y enlace de espectadores; preservan el parámetro de servidor staging cuando se usa. El overlay `?overlay=CODIGO` presenta marcador, reloj de partida, etapa de juego y audiencia.
- **Estado de la arena:** los formularios de crear/unirse/emparejar/ver quedan deshabilitados mientras el servidor WebSocket no está conectado. La vista previa estática explica que falta staging sin fingir funcionamiento online.
- **UI y accesibilidad:** panel de directo reutilizable, estilos responsive, foco existente y respeto de `prefers-reduced-motion`. No se modificaron las reglas ni la persistencia histórica de los juegos.

## Pruebas

- `scripts/pasala_duel_smoke.js`: tests deterministas Node, con nuevos casos de cierre de sala, notificación de invitado y espectador, reinicio de `ready` y conteo de audiencia. **Correctos**, ejecutados mediante Node en memoria contra los archivos actualizados.
- `scripts/arena_ui_smoke.js`: valida sintaxis del cliente, correspondencia de **43 referencias a IDs** con HTML, duplicaciones, presencia de enlaces de invitación y versiones de recursos. **Correcto**.
- El comando `npm test` ahora ejecuta las dos suites anteriores más `content_verified_smoke.js`; Netlify las exige para el preview.
- Browser/Netlify: preview 3.2 inspeccionado en escritorio, aviso explícito de que staging está ausente, cuatro acciones de lobby realmente deshabilitadas sin WebSocket, cliente `v=5` cargado y overlay de stream presentando `SEÑAL INTERRUMPIDA` cuando no hay servidor.
- La compilación de Netlify terminó correctamente después de actualizar UI y servidor; comprobar el último commit de este documento y package al publicar.

## Limitaciones pendientes

- **No existe un servicio WebSocket de staging accesible desde este preview**. No se pudo validar en navegador una partida real entre dos celulares o una transmisión con datos reales. La simulación Node no reemplaza estas pruebas.
- Sin staging tampoco están verificados los flujos heredados de Quién Sabe Más y Mentiroso.
- Firebase remoto no se certificó por el fallo de autenticación previamente observado en la vista previa.
- QA de tamaños móviles 360/390/430 y dispositivos táctiles reales pendiente.

### Activación posterior

Desplegar una instancia Node independiente usando `CT_STAGING=true npm start`, restringirla a uso de pruebas y conectar el navegador mediante `?server=wss://HOST_STAGING`. Ver `docs/pasala-duel-staging.md`. No conectar esta preview al WebSocket de producción.

No hubo merge a `main`, cambios en `reports/`, alteraciones de producción ni dependencias nuevas.
