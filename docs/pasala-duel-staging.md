# Pasala Che 1v1 — entorno de pruebas

La rama `redesign/crack-total-2` incorpora el protocolo WebSocket `pasala:*` en `server/pasala-duel.js` y una pantalla independiente en `pasala-1v1.html`.

## Estado y aislamiento
- **No se modifican** las partidas y eventos de Quién Sabe Más ni Mentiroso.
- Pasala Che individual sigue usando `assets/js/pasalache.js` y su guardado existente.
- El servidor crea una sola selección de 26 preguntas por partida: ambos jugadores reciben las mismas, en el mismo orden. Las soluciones quedan en el servidor.
- Los clientes solo envían letra, respuesta o paso. El servidor calcula aciertos, reloj y ganador.
- Sala privada con código, búsqueda de un jugador de la misma dificultad, dos confirmaciones de inicio, espectadores, reconexión durante 45 s, revancha y limpieza.
- Sala y resultados son **en memoria**: un reinicio de servidor corta las partidas. No hay ranking persistente de duelos 1v1 todavía.
- Las preguntas originales son recursos públicos de Pasala Che solo, por lo que no se puede garantizar protección contra usuarios que consulten el banco.

## Comprobación
```sh
npm test
npm run validate
```
`npm test` ejecuta el humo determinista de creación, emparejamiento privado, mismo rosco, validación en servidor, espectadores, reconexión y revancha.

## Publicar un backend de pruebas (SIN cambiar producción)
1. Desplegar la rama `redesign/crack-total-2` en **un servicio Node temporal separado**. Comando `npm start`, Node >= 22, instalar dependencias, puerto provisto por el proveedor.
2. Configurar `CT_STAGING=true` **solo en ese backend** para desactivar las redirecciones canónicas HTTP a `cracktotal.com`. No cambiar las variables del servidor de producción.
3. Obtener la URL WebSocket segura `wss://<host-de-staging>`. No apuntar la nueva interfaz al backend de producción sin desplegarle y probarle primero este protocolo.
4. Abrir `https://deploy-preview-1--zingy-haupia-53b742.netlify.app/pasala-1v1?server=wss://<host-de-staging>`. El enlace de invitación y el de espectador conservan ese parámetro.
5. Probar en dos dispositivos/navegadores: crear, invitar, preparar, responder y pasar, finalizar, revancha, pestaña recargada, desconexión de 45 s y el overlay `?overlay=CODIGO&server=...`.
6. Probar en paralelo Quién Sabe Más y Mentiroso contra el backend de staging. La página estática por sí sola no verifica esos protocolos.

## Retiro de Mi Carrera
- La página `mi-carrera.html` redirige al catálogo; portada y catálogo ya no la promocionan.
- El bundle estático del Deploy Preview omite su motor, data y miles de imágenes exclusivas.
- El historial de Git y los datos guardados del navegador no se borraron. Todavía existen archivos fuente antiguos en el repositorio; su eliminación definitiva requiere una limpieza separada y verificación de referencias.
- No publicar en `main` ni en `cracktotal.com` sin verificación de backend real.
