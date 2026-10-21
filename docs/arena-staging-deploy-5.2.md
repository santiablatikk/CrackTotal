# Arena 5.2 — puesta en marcha del servicio de staging existente

**Propósito:** publicar y probar Quién Sabe Más y Mentiroso en modo WebSocket junto a Pasala Che, sin modificar el frontend oficial ni el antiguo servidor `cracktotal-servidor`.

## Arquitectura real

- Frontend público actual: Render Static Site `CrackTotal`, servicio `srv-d06n6p2li9vc73ei37m0`, rama `main`, dominio `cracktotal.com`.
- Backend histórico independiente: Render Web Service `cracktotal-servidor`, otro repositorio; no modificar ni borrar sin migración completa.
- Backend **ya existente** de staging: Render Web Service `cracktotal-arena-staging`, ID `srv-dbb6hj2gjjms73d73fd0`, situado en Frankfurt.
- Preview: `https://deploy-preview-1--zingy-haupia-53b742.netlify.app/`.
- Repo del código Arena 5.2: `santiablatikk/CrackTotal`, rama `redesign/crack-total-2`.

## Configuración a aplicar en el servicio YA EXISTENTE

1. Abrir Render Dashboard y seleccionar **`cracktotal-arena-staging`** (verificar service ID). No crear otro servicio ni modificar `CrackTotal` Static Site.
2. Settings → Repository/Branch: `https://github.com/santiablatikk/CrackTotal` / `redesign/crack-total-2`.
3. Build: `npm ci`. Start: `npm start`. Health check: `/__ct_staging/health`. Instance: conservar el plan y región existentes.
4. Environment:
   - `CT_STAGING=true`
   - `CT_OBJECTIVE_MENTIROSO=true`
   - `CT_STAGING_ORIGINS=https://deploy-preview-1--zingy-haupia-53b742.netlify.app`
   - `NODE_ENV=production`
5. Deploy → **Deploy latest commit** de la rama, confirmar build y logs sin errores.
6. Abrir `https://cracktotal-arena-staging.onrender.com/__ct_staging/health` y exigir JSON con `ok=true`, `arenaProtocol=cracktotal-arena-5.2`, `features.qsmResume=true`, `features.mentirosoObjective=true`, `branch=redesign/crack-total-2` y `commit` igual al HEAD desplegado.
7. Recién entonces probar `mentiroso.html` y `quiensabemas.html` desde la preview. El handshake `arena:hello` bloquea correctamente el matchmaking si el servidor está desactualizado.

Como referencia, `render.arena-staging.yaml` describe el servicio; **no importar esta Blueprint a ciegas**, porque podría crear un duplicado o reconfigurar un servicio distinto. Aplicar los ajustes al servicio existente, con control de acceso, es la vía preferida.

Existe también `.github/workflows/verify-arena-staging.yml` para validar localmente los juegos y comparar el commit remoto; el workflow manual de GitHub puede requerir que el archivo ya esté en la rama predeterminada. Para usar el Deploy Hook opcional, definir el secreto `RENDER_STAGING_DEPLOY_HOOK` **solo** para el servicio de staging. Nunca usar aquí el hook del frontend oficial.

## Verificación funcional que sigue siendo obligatoria

- **Mentiroso:** salas privadas/públicas, matchmaking, apuestas de 1/5/10/20 o más, 6 rondas objetivas, listas correctas/incorrectas/incompletas, rechazo de validaciones falsas del rival, puntuaciones, abandono, pausa/reconexión y revancha aceptada por ambos.
- **QSM:** jugar desde dos sesiones, revisar seis niveles, comodines, turnos, marcador, reloj autoritativo, respuesta duplicada, desconexión de 45 segundos, regreso y revancha real.
- **Pasala Che:** correr toda la suite `npm test` y partidas reales desde dos navegadores; no degradar Rosco Espejo ni Rosco por Turnos.
- **UI:** revisar en móvil y escritorio, incluido el título de Mentiroso bajo la navbar, las etiquetas de formularios y botones activos/deshabilitados.
- **Datos:** las 6 consignas cerradas de Mentiroso tienen 20–32 IDs canónicos; el objetivo de 90 consignas con 15 por categoría sigue pendiente de producción. QSM contiene preguntas no verificadas factual e individualmente.

### Gate de publicación

**NO MERGE a main, NO actualizar cracktotal.com y NO apagar el servidor antiguo** hasta que la instancia de Render devuelva el commit correcto, se completen partidas reales y cierre la auditoría editorial. El éxito de Netlify solo prueba el candidato local, no la actualización remota de Render.
