# Crack Total 3.5 — bitácora verificable (19/10/2026)

## Alcance

Esta iteración continúa **exclusivamente** la rama `redesign/crack-total-2`, PR #1, sin fusionar con `main` ni modificar producción, el backend productivo, Firebase o `reports/`. Mantiene los cinco juegos existentes y no vuelve a presentar Mi Carrera.

## Mejoras implementadas

1. **Configuración de Arena en vista previa:** la página `/pasala-1v1` muestra una conexión asistida cuando aún no se configuró el WebSocket de staging; acepta la URL HTTPS del servicio independiente y la convierte en su conexión WSS. Rechaza URL de producción e inseguros y conserva el servidor al salir de la sala.
2. **Inicio «HOY SE JUEGA»:** composición editorial con el Top 10 diario real —título, contexto y fuente del banco verificado—, estado local del desafío y acceso a Wordle/Pasala individual. No inventa resultados, audiencia ni jugadores.
3. **Catálogo «ENTRÁ EN CALOR»:** acceso diario contextual, coherente con el desafío real y con la búsqueda/filtros del catálogo.
4. **Wordle:** bloqueo efectivo de nuevas respuestas después de completar el desafío del día también desde teclado físico; excepciones para elementos interactivos enfocados; etiquetas accesibles de letras y estados; progreso local conservado.
5. **Top 10:** fecha del desafío fijada al iniciar la ronda: cruzar medianoche UTC ya no guarda el resultado en el día incorrecto.
6. **Regresiones:** suite `scripts/ct35_experience_smoke.js` integrada en `npm test`; ahora se ejecutan cinco suites, incluyendo las comprobaciones de protocolo WebSocket preexistentes.

## Pruebas y resultados

- En el HEAD de la iteración, Netlify notificó **SUCCESS** para el build del Deploy Preview (configurado para ejecutar validación, `npm test` y build). El despliegue debe volver a verificarse después de cada commit final.
- Navegador desktop, deploy preview: portada y bloque diario visibles; título y fuente del Top 10 extraídos del banco real; búsqueda por «wordle» filtró el catálogo a un juego; la Arena bloqueó una URL de producción; Wordle aceptó la entrada por teclado, persistió una letra al recargar y expuso su nombre a tecnologías asistivas.
- Las cinco suites se comprueban como parte del proceso de Netlify. **No** se hizo una partida WebSocket con dos equipos conectados a un servidor públicamente desplegado.
- **Mobile visual:** todavía no se verificaron capturas de 360, 390, 430 y 768 px; existen reglas responsive pero eso no sustituye la inspección visual.
- **Firebase:** la consola del navegador mostró errores de autenticación anónima durante la prueba de Wordle; la persistencia local se comprobó, la escritura remota no. No atribuir estos errores a esta iteración sin investigación adicional.

## Contenido futbolero

Se reutilizó únicamente el conjunto Top 10 ya auditado/verificado por fuentes UEFA en iteraciones anteriores. La home y el catálogo lo consultan sin replicar ni revelar las soluciones. **Preguntas nuevas en esta iteración: 0. Preguntas auditadas individualmente en esta iteración: 0.** Siguen vigentes los registros previos de `docs/football-facts-2026-10-19.json`; esta iteración no afirma una nueva auditoría.

## Staging pendiente — bloqueo externo

El repositorio ya incluye el Blueprint `deploy/staging.render.yaml` y las instrucciones `docs/pasala-duel-staging.md`. La consola de Render mostró una pantalla de inicio de sesión; no había un servicio staging público accesible ni una sesión autorizada para crearlo. El dueño debe:

1. Entrar en https://dashboard.render.com/ mediante su cuenta.
2. Elegir **New → Blueprint**, seleccionar este repositorio y la rama `redesign/crack-total-2`, e indicar el archivo `deploy/staging.render.yaml`.
3. Verificar que se crea un **servicio nuevo y separado** con plan gratuito y que no se alteran recursos productivos. Revisar condiciones de uso/límites de Render antes de confirmar.
4. Esperar el deploy y comprobar `https://<host>.onrender.com/__ct_staging/health`.
5. Pegar la URL HTTPS del servicio en el campo **Servidor de pruebas** de `/pasala-1v1`. Crear sala y abrir la invitación en otra sesión/dispositivo para validar dos clientes, espectador, desconexión, reconexión y revancha.

Hasta completar el paso anterior, el multijugador **no está verificado en hosting real**. La vista previa estática no constituye prueba del backend.

## Próximas prioridades

1. Habilitar staging y automatizar un test E2E con dos clientes reales, un espectador y pérdida de red.
2. Diagnosticar el error de autenticación Firebase sin tocar producción.
3. Realizar QA visual móvil y recorridos completos de los cinco juegos.
4. Continuar la auditoría y expansión de datos futboleros oficiales, con fuente y fecha para cada dato.
