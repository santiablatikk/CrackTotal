# Crack Total — Retiro completo del antiguo juego Mi Carrera

**Decisión del propietario (23/10/2026):** eliminar Mi Carrera de la nueva versión de Crack Total. Este retiro sustituye cualquier plan anterior de recuperación.

## Alcance aplicado a la rama `redesign/crack-total-2`

- Sin `mi-carrera.html`, hoja `assets/css/mi-carrera.css`, lógica `assets/js/games/mi-carrera/`, bancos `assets/data/mi-carrera/` ni recursos `assets/images/mi-carrera/`.
- Retiradas las fichas en Home y catálogo, las importaciones de servicio y las pruebas específicas que ejecutaban el juego.
- Restaurado el bloqueo del empaquetado estático: el preview debe **rechazar** cualquier build que contenga dichos artefactos.
- Preservada una redirección HTTP 301 desde la URL antigua hacia `/games.html` en el servidor Node, en lugar de ofrecer un juego inexistente.
- Añadidas pruebas para impedir que reaparezcan rutas y activos de este juego por accidente.
- Se conserva intacta la **historia Git** anterior por trazabilidad. La eliminación afecta el árbol activo, no borra necesariamente el historial de commits, los archivos accesibles en ramas de respaldo ni producción.

## QA y publicación

La versión candidata se mantiene exclusivamente en una rama separada y su PR. No se ejecuta una fusión ni se modifican archivos del `main` o del servidor independiente sin revisión de pruebas.

## Próximas prioridades

Cerrar QA de los seis accesos del catálogo (Pasala Che, Pasala Che 1v1, Top 10, Wordle, QSM, Mentiroso) y verificar conectividad online/consistencia de bancos antes del lanzamiento.
