# Pasala Che 1v1 — staging aislado (19-10-2026)

La rama `redesign/crack-total-2` contiene el servidor `server/pasala-duel.js` y la pantalla `pasala-1v1.html`. La vista previa de Netlify es estática: **no hospeda WebSockets**.

## Garantías y límites actuales

- Los 2 jugadores reciben las mismas 26 preguntas y los mismos límites de tiempo, calculados por el servidor.
- El servidor valida respuestas y puntajes, controla el inicio, estado de conexión, abandono, reconexión de hasta 45 segundos, espectadores, revancha, cierre y límite de 250 salas simultáneas por proceso.
- Las respuestas correctas no aparecen en los mensajes de espectadores antes de acabar la partida. Sí están presentes en el JSON público del rosco individual: **un usuario malintencionado aún puede consultar ese archivo**.
- Resultados y salas en memoria. No hay persistencia de duelos 1v1 ni escalado horizontal. Reiniciar el proceso interrumpe las salas.
- Quién Sabe Más y Mentiroso conservan sus protocolos anteriores y requieren pruebas de staging propias.
- No se alteran Firebase, formatos guardados, dominio ni servidor de producción.

## Pruebas reproducibles antes de exponer staging

```sh
npm ci
npm test
npm run validate
```

`npm test` ejecuta cinco suites, incluida **`scripts/pasala_duel_ws_integration.js`** que inicia `server.js` con `CT_STAGING=true` en un puerto local temporal y conecta **dos clientes WebSocket y un espectador reales**; comprueba endpoint de salud, origen rechazado, mismo rosco, desconexión y reanudación, marcador validado por servidor, filtrado de respuestas al espectador, revancha y abandono. Este test es local y automatizado; **no acredita una partida pública por Internet ni en dispositivos diferentes**.

## Staging Render activado (19/10/2026), sin tocar producción

1. [Ya realizado] En Render se creó **un nuevo Blueprint** desde este repositorio. Indicá el archivo `deploy/staging.render.yaml` como Blueprint Path. **No actualices ni sustituyas el Blueprint de producción `render.yaml`.** La rama especificada es `redesign/crack-total-2`.
2. [Ya realizado] Se verificó que el servicio creado se llama **`cracktotal-arena-staging`**, use Node, tenga `CT_STAGING=true`, build `npm ci && npm test`, start `npm start`, health `/__ct_staging/health` y **despliegue automático desactivado**. Si Render propone tocar recursos ya existentes, cancelá la operación.
3. [Ya realizado] Host de staging: **https://cracktotal-arena-staging.onrender.com**. No se asoció el dominio productivo.
4. [Verificado] https://cracktotal-arena-staging.onrender.com/__ct_staging/health devolvió JSON `ok: true`, `websocket: true`.
5. En el servicio de staging, restringí `CT_STAGING_ORIGINS` a `https://deploy-preview-1--zingy-haupia-53b742.netlify.app` y otros orígenes de testing explícitamente aprobados, separados por comas. La configuración de origen por defecto acepta solo ese preview y localhost; **esto no sustituye autenticación, cuotas ni controles antitrampas**.
6. Entrá a **https://deploy-preview-1--zingy-haupia-53b742.netlify.app/pasala-1v1**. Este Deploy Preview exacto se conecta automáticamente al staging. Para otras vistas, usar explícitamente `?server=wss://cracktotal-arena-staging.onrender.com`; la página conserva el servidor en invitaciones y overlay.
7. Probar manualmente: crear sala, copiar invitación, segundo jugador, dos confirmaciones, cuenta regresiva, responder/pasar, mismo conjunto de preguntas, reloj y marcador, terminar y decidir ganador, revancha, abandonar, reconectar antes/después de 45 s y espectador con enlace `?overlay=CODIGO&server=wss://HOST-REAL`. Verificar que el espectador no recibe soluciones mientras corre el juego.
8. Ejecutar las pruebas de Quién Sabe Más y Mentiroso contra este backend sin exponer a producción. Registrar evidencia y errores de consola.

**Estado actual:** el servicio público de staging ya se desplegó y se probó con dos pestañas cliente y una pestaña espectador; creación de sala, inicio, acierto, pase, marcador, abandono y ganador funcionaron. Siguen pendientes pruebas entre redes independientes, reconexión en vivo y revancha completa. Render Free puede entrar en reposo. El build reportó 15 vulnerabilidades de dependencias (2 críticas), pendientes de auditoría antes de promoción a producción.

## Retiro de Mi Carrera

- `mi-carrera.html` redirige al catálogo; portada y catálogo no lo promocionan.
- El bundle de Netlify omite motor, datos e imágenes exclusivos de ese modo.
- El código fuente histórico y los datos guardados antiguos no se borraron; auditar referencias antes de eliminarlos.

**No fusionar esta rama con `main` ni publicar en `cracktotal.com` todavía.**
