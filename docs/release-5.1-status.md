# Crack Total 5.1 — Limpieza verificable y preparación de publicación

Fecha de auditoría: 20-10-2026. Estado: **RELEASE CANDIDATE / PUBLICACIÓN AÚN NO AUTORIZADA POR LOS GATES CRÍTICOS**.

## Fuente de verdad
- Repositorio: `santiablatikk/CrackTotal`.
- Rama de trabajo: `redesign/crack-total-2`.
- PR #1 abierto; `main` sigue en `5e8ffb476a221dcb49946875957126c61928f13a`.
- Backup del estado de producción previo al lanzamiento: rama `backup/production-pre-5-1-20261020` apuntando al mismo commit de `main`.
- **Producción:** Render (Node y WebSocket) según `.github/workflows/deploy.yml` y `render.yaml`. El dominio canónico es `https://cracktotal.com` y `www` redirige al raíz.
- **Preview:** Netlify solo prueba el frontend estático, no es el despliegue de producción ni aloja el servidor de juegos.
- El workflow producción utiliza un Deploy Hook de Render si existe `RENDER_DEPLOY_HOOK`; si el secreto no está configurado, emite advertencia y depende de auto-deploy en Render. **Su SUCCESS no demuestra que Render haya desplegado nada**.

## Hallazgos de auditoría
Se revisó el árbol completo: inicialmente tenía 1.651 archivos versionados, de los cuales 1.267 tenían rutas del modo **Mi Carrera**, retirado del producto. Además había 56 scripts auxiliares exclusivos de ese modo y su workflow podía fast-forward hacia producción desde una rama obsoleta.

`main` no tiene archivos exclusivos pendientes de incorporar a la rama 5.0: comparación Github `main...redesign/crack-total-2` indicó `behind=0` cuando empezó la limpieza. No se revisó visualmente el deploy productivo.

## Cambios realizados EN LA RAMA DE DESARROLLO (no main)
- Eliminados **1.323 archivos** exclusivamente vinculados a Mi Carrera, incluido el viejo workflow automático de promoción. Los objetos continúan en el historial de Git; no se reescribió historia, no se tocaron datos Firebase.
- Añadida redirección HTTP `/mi-carrera.html` y `/mi-carrera` → `/games.html` en el servidor de la futura versión, para proteger antiguos favoritos y enlaces.
- Eliminadas **6 hojas CSS heredadas sin referencias activas detectadas**: `critical.css`, `experience-2.css`, `experience-3.css`, `game-experience-2.css`, `gameplay-2.css`, `landing.css`. Se retiró `landing.css` del precache del service worker. `player-profile.css` **se conservó** porque puede cargarse dinámicamente.
- Subido `sw.js` desde versión de caché 3.10.0 a 5.1.0. Se conservan LocalStorage y Firebase.
- Simplificado el generador estático de Netlify; limpia el directorio de salida antes de copiar y falla si el modo retirado reaparece.
- Reescrito el mensaje de diagnóstico de deploy para eliminar indicaciones de auto-promoción de Mi Carrera.
- Agregada la ejecución de `npm ci` y `npm test` al workflow de despliegue hacia Render, antes del disparo del hook.
- Añadido `scripts/release_51_smoke.js` al `npm test` existente: ausencia de modo retirado, página de Arena independiente, rutas, CSS, service worker, workflow y build preview.
- Creado `README.md` con producto vigente, estructura, instalación, pruebas, entornos, despliegue y rollback.

**Total de archivos eliminados: 1.329** (1.323 Mi Carrera + 6 CSS). No se eliminaron `reports/`, el historial Git, bancos deportivos del Top 10, juegos activos, APIs, datos de usuario, ni dependencias npm.

## Validación obtenida
- Árbol después de limpieza: **324 archivos rastreados**, **28 CSS**, **0 archivos con `mi-carrera` o `mi_carrera` en el path**, un workflow activo `.github/workflows/deploy.yml`.
- Durante la creación de la nueva suite hubo dos fallos de CI atribuibles a la propia prueba: condición incorrecta que exigía design system compartido en Arena autónoma; y expresión regular mal escapada. Ambas se corrigieron.
- El resultado de Netlify para el **último commit** debe comprobarse en los checks del PR; no usar SUCCESS antiguo como prueba.
- Verificar rutas antiguas, caché, Render/Cloudflare, funcionamiento del backend y web publicada sigue pendiente de herramientas de entorno de producción y pruebas con navegador.
- No se certifica WCAG completo ni QA visual a 320–1920 px. No se inventan capturas.

## Bloqueos de release

**No fusionar** hasta completar, como mínimo:
1. Check automatizado del HEAD final en SUCCESS.
2. QA visual real de home, Top 10, Pasala, Wordle, Quién Sabe Más y Mentiroso en móvil/desktop.
3. Prueba manual completa de cada juego en preview con backend de staging, sin tocar producción.
4. Confirmar en Render servicio correcto, rama auto-deploy y/o Deploy Hook operativo, capacidad de rollback y backend WebSocket de producción.
5. Confirmar con el navegador el dominio canónico y disponibilidad de `www.cracktotal.com`.
6. Revisar la diferencia final grande del PR antes de merge.

El sitio público no resultó accesible en vivo desde el entorno de verificación de esta sesión (DNS de contenedor no disponible, navegación web sin resultado fresco fiable). Por este motivo no hay evidencia suficiente para afirmar que la producción publica 5.0 o para completar con seguridad el merge.

## Publicación pendiente
Una vez aprobados los gates anteriores:
- Revisar `main` y PR head y asegurar que no surgieron commits exclusivos.
- Fusionar PR #1.
- Comprobar ejecución del workflow y deployment real en Render.
- Inspeccionar `https://cracktotal.com` y redirección desde `https://www.cracktotal.com`.
- Confirmar commit, 5 juegos, Arena, perfiles y rutas, monitorizar errores.
- No eliminar el backup hasta confirmar el lanzamiento.
