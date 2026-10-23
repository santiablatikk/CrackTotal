# Auditoría de Crack Total — primer corte (23/10/2026)

## Alcance real verificado

- Comparados los árboles Git del HEAD `e26710e21726933ccf9c3da88df1fa3f997eb510` y el `main` de producción `5e8ffb476a221dcb49946875957126c61928f13a`.
- Rama de desarrollo antes de este trabajo: **347 archivos** (blobs).
- Producción: **1.609 archivos** (blobs); los recuentos previos que incluían directorios no son comparables.
- Se detectó que **1.266 archivos** relacionados con Mi Carrera (juego, motor, imágenes y datos) existían en `main` pero no en la rama candidata.
- Se examinó el HTML de Mi Carrera y se comprobó que todas sus referencias locales a recursos del juego existían en la versión de producción. Se restaura íntegro desde blobs y árboles Git exactos, sin reescribir el motor.
- El CI anterior falló: `39786761269` — la prueba sintética de partido de Pasala Che 1v1 en 320 px encontró `#duelRing` de x=25 a x=326; anchura de 301 px para una pantalla de 320 px. Se sustituye el ancho basado exclusivamente en viewport por uno que también respeta la anchura del contenedor.

## Criterios y riesgos pendientes

1. **Bloqueante:** ejecutar QA funcional de Mi Carrera (nuevo jugador, guardar/cargar, transición de temporada, mercado, retirada). La prueba de archivos añadida es estructural, NO prueba estas interacciones.
2. **Bloqueante:** QSM y Mentiroso usan un backend separado; disparidad conocida: QSM 366 vs. 375 preguntas, Mentiroso 193 vs. 256 retos. Reconfirmar en el servidor actualmente desplegado antes de migrar nada.
3. **Bloqueante:** QA online real de partida completa, reconexiones, ambos modos, revancha y resultados.
4. **Alto:** auditar visualmente Mi Carrera en 10 anchos; el nuevo pipeline toma capturas iniciales de Chromium.
5. **Alto:** auditar tamaños táctiles; el reporte de Chromium indica varios controles <44 px en pantallas de juego, incluidos teclado Wordle (pueden requerir evaluación contextual).
6. **Alto:** código de estilos fragmentado entre tokens, Home, Discover, capas 2/3/4 y seis juegos. Antes de borrar, construir mapa de cascada y referencias.

## Reglas de conservación

No eliminar `reports/`, datos de usuarios, lógica del motor de carrera, archivos de caché/persistencia en producción, ni realizar merge a `main`.
No inferir que un archivo no se usa solamente porque no aparezca enlazado en HTML.
No considerar las capturas con fixtures sintéticos como prueba de reglas de juego.

## Registro de ejecución

Primera intervención: recuperar el árbol completo de Mi Carrera, volver a mostrarlo en el catálogo; corregir el rosco de 320 px y ampliar los gates automatizados.
